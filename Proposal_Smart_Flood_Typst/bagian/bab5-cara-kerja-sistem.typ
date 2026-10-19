#import "/template/components.typ": *

= Cara Kerja Sistem

== Siklus Pengukuran Ultrasonik dan Konversi Ketinggian Air

Mekanisme sensing ketinggian air bekerja secara nir-sentuh dengan memanfaatkan prinsip pemantulan gelombang ultrasonik (_time-of-flight acoustic measurement_). Mikrokontroler ESP32 mengirimkan sinyal pemicu logika tinggi (_HIGH pulse_) selama $10$ $mu$s pada pin `TRIG_PIN` (GPIO 5). Transduser pemancar sensor HC-SR04 kemudian memancarkan delapan siklus gelombang akustik berfrekuensi $40$ kHz menuju permukaan air.

Ketika gelombang suara mengenai antarmuka cairan, pantulan gema akustik ditangkap oleh transduser penerima, yang menyebabkan pin `ECHO_PIN` (GPIO 18) berada dalam kondisi logika tinggi selama durasi waktu rambat bolak-balik ($t$). Durasi pulsa dibaca oleh fungsi `pulseIn(ECHO_PIN, HIGH, 30000UL)` dengan batas waktu _timeout_ $30$ ms. Berdasarkan laju rambat suara di udara kering pada suhu $20 degree$C ($v approx 343$ m/s atau setara dengan $29,1$ $mu$s per sentimeter untuk lintasan satu arah), jarak sensor ke permukaan air dihitung melalui @eq-jarak.

$ d = frac(t, 58.0) quad ["cm"] $ <eq-jarak>

Selanjutnya, ketinggian air aktual ($h_("air")$) di dalam tangki dihitung berdasarkan selisih antara tinggi referensi wadah ($T_("ref") = 100.0$ cm) dan jarak pantulan terukur ($d$), sebagaimana dirumuskan pada @eq-tinggi.

$ h_("air") = cases(
  T_("ref") & "jika" d <= 2.0 "cm",
  0 & "jika" (T_("ref") - d) < 0,
  T_("ref") & "jika" (T_("ref") - d) > T_("ref"),
  T_("ref") - d & "lainnya."
) $ <eq-tinggi>

Pembacaan dinyatakan tidak valid (*SENSOR ERROR*) apabila durasi pulsa bernilai $0$ (sinyal pantul hilang) atau jarak terukur melebihi jangkauan fisik wadah ($d > 400.0$ cm).

== Mesin Status Bahaya (Finite State Machine)

Sistem mengimplementasikan mesin status empat kondisi (_Four-State FSM_) untuk mengklasifikasikan risiko banjir dan menentukan kombinasi aktuator yang diaktifkan, seperti yang dijabarkan pada @tbl-fsm.

#figure(
  tabel(
    (0.9fr, 1fr, 0.9fr, 1.2fr, 1fr),
    ("Status", "Syarat Ketinggian", "Indikator LED", "Animasi Khusus", "Buzzer"),
    [SAFE (Aman)], [$h_("air") < 50.0$ cm], [Hijau: AKTIF \ Lainnya: MATI], [Penerangan statis normal], [Mati (_silent_)],
    [WARNING (Siaga)], [$50.0 <= h_("air") < 80.0$ cm], [Kuning: AKTIF \ Lainnya: MATI], [Penerangan statis siaga], [Mati (_silent_)],
    [DANGER (Bahaya)], [$h_("air") >= 80.0$ cm], [3 LED Merah beranimasi], [Pancaran lari memancar dari tengah ($100$ ms)], [Aktif konstan $1000$ Hz],
    [SENSOR ERROR], [Sensor invalid / gema hilang], [3 LED Merah AKTIF], [Ketiga LED merah menyala diam serentak], [Mati (_silent_)],
  ),
  caption: [Matriks mesin status bahaya dan perilaku aktuator],
  kind: table,
) <tbl-fsm>

== Manajemen Eksekusi Non-Blocking Berbasis Waktu

Untuk mencegah pembekuan sistem (_system freeze_) yang kerap terjadi pada mikrokontroler pemula akibat penggunaan fungsi `delay()`, _firmware_ ESP32 dirancang menggunakan arsitektur penjadwalan multi-interval mandiri berbasis fungsi pelacak waktu milidetik `millis()`. 

Sistem memisahkan tugas menjadi empat siklus independen:
1. *Akuisisi Sensor (`SENSOR_INTERVAL = 500` ms)*: Membaca pulsa ultrasonik dan memperbarui status FSM dua kali per detik.
2. *Animasi Aktuator LED (`LED_ANIMATION_INTERVAL = 100` ms)*: Mengatur pola pergeseran frame tiga LED merah saat status DANGER (Frame 0/2: LED tengah pin 33 aktif; Frame 1: LED kiri pin 27 aktif; Frame 3: LED kanan pin 32 aktif).
3. *Penyegaran Display LCD (`LCD_ANIMATION_INTERVAL = 150` ms)*: Menampilkan teks alfanumerik dan menggerakkan animasi strobo blok hitam penuh (`ASCII 255`) di sekitar kata "BAHAYA" saat kondisi kritis.
4. *Publikasi Telemetri HTTP (`PUBLISH_INTERVAL = 2000` ms)*: Membangun paket JSON dan mengirimkan _request_ HTTP POST ke server _backend_ setiap dua detik.

Struktur ini memastikan bahwa tugas transmisi jaringan yang membutuhkan waktu beberapa ratus milidetik tidak akan mengorbankan kelancaran animasi strobo display maupun respon bunyi buzzer.

== Antarmuka Lokal LCD 16×2 I2C dengan Animasi Stroboskopik

Modul LCD 16×2 menyajikan pembacaan status lokal secara langsung di gardu pemantau lapangan:
- *Baris 0*: Selalu menampilkan informasi jarak numerik terukur dengan presisi satu desimal, misalnya `Jarak: 35.2 cm`.
- *Baris 1 (Kondisi Normal/Siaga)*: Menampilkan teks status sistem, misalnya `Status: AMAN` atau `Status: SIAGA`.
- *Baris 1 (Kondisi Bahaya)*: Mengeksekusi efek strobo visual bergerak dengan merender tiga blok hitam pekat (`char kotak = 255;`) yang berpindah posisi secara ritmis:
  - Frame 0: `■■■  BAHAYA     `
  - Frame 1: `     BAHAYA  ■■■`
  - Frame 2: `■■■  BAHAYA  ■■■`
  - Frame 3: `     BAHAYA     `
- *Kondisi Sensor Rusak*: Menampilkan peringatan darurat `SENSOR ERROR!` pada baris pertama dan `Cek HC-SR04` pada baris kedua.

== Protokol Telemetri HTTP POST dan Serialisasi JSON

Ketika pewaktu `PUBLISH_INTERVAL` tercapai, modul ESP32 secara otomatis memverifikasi koneksi Wi-Fi. Apabila koneksi terputus, fungsi `setupWiFi()` akan dipanggil secara nir-henti (_non-blocking retry_). Jika jaringan aktif, objek telemetri diserialisasikan ke format JSON menggunakan pustaka `ArduinoJson` dengan struktur sebagai berikut:

```json
{
  "deviceId": "smartflood-esp32-01",
  "distanceCm": 35.2,
  "status": "SAFE",
  "sensorValid": true,
  "wifiConnected": true,
  "uptimeSeconds": 142
}
```

Paket data ini dikirimkan melalui permintaan `HTTP POST` ke alamat server _backend_ (`http://192.168.1.8:8080/api/readings`) dengan _header_ `Content-Type: application/json` dan batas waktu respons (_timeout_) sebesar $3000$ ms.

== Integrasi Dashboard Pemantauan Jarak Jauh (Digital Twin 3D)

Data yang diterima oleh server Go segera dialirkan menuju _frontend_ web Next.js via protokol SSE. Pada antarmuka web, operator disajikan dengan dua instrumen utama yang ditempatkan berdampingan:
1. *Digital Twin 3D Reservoir*: Menggunakan pustaka React Three Fiber untuk merender tabung wadah kaca transparan dengan skala metrik sentimeter fisik. Massa air dimodelkan dengan fluida volumetrik berwarna biru laut konsisten (`#0284c7`). Permukaan air dilengkapi dengan algoritma riak gelombang (_wave displacement_) matematis berbasis superposisi fungsi sinus-kosinus:
   $ z(x, y, t) = A(t) dot [sin(22 r - 3.4 t) + 0.45 cos(16 x + 2.5 t) + 0.45 sin(18 y - 2.0 t)] $
   Amplitudo gelombang ($A(t)$) melonjak secara dinamis ketika air sedang naik atau turun drastis, kemudian meluruh secara perlahan menuju ketenangan riak alami ($0.75$ mm) ketika ketinggian air telah stabil.
2. *Grafik Hidrograf Telemetri*: Menampilkan rekam jejak $50$ titik data fluktuasi air terakhir secara mulus dengan garis penanda ambang batas Siaga ($60%$) dan Bahaya ($80%$) untuk kemudahan analisis kecenderungan kenaikan debit air.
