#import "/template/components.typ": *
#import "/config/gambar.typ": *

= Cara Kerja Sistem

== Siklus Pengukuran Ultrasonik dan Konversi Ketinggian Air

Mekanisme _sensing_ ketinggian air bekerja secara nir-sentuh dengan memanfaatkan prinsip waktu tempuh pantulan gelombang ultrasonik (_time-of-flight acoustic measurement_). Mikrokontroler ESP32 mengirimkan sinyal pemicu logika tinggi (_HIGH pulse_) selama $10$ $mu$s pada pin `TRIG_PIN` (GPIO 5). Transduser pemancar sensor HC-SR04 kemudian memancarkan delapan siklus gelombang akustik berfrekuensi $40$ kHz menuju permukaan air.

Ketika gelombang suara mengenai permukaan cairan, pantulan gema akustik ditangkap oleh transduser penerima, yang menyebabkan pin `ECHO_PIN` (GPIO 18) berada dalam kondisi logika tinggi selama durasi waktu rambat bolak-balik ($t$). Durasi pulsa dibaca oleh fungsi `pulseIn(ECHO_PIN, HIGH, 30000UL)` dengan batas waktu _timeout_ $30$ ms. Berdasarkan laju rambat suara di udara kering pada suhu $20 degree$C ($v approx 343$ m/s atau setara dengan $29,1$ $mu$s per sentimeter untuk lintasan satu arah), jarak sensor ke permukaan air dihitung melalui @eq-jarak.

$ d = frac(t, 58.0) quad ["cm"] $ <eq-jarak>

Selanjutnya, ketinggian air aktual ($h_("air")$) di dalam tangki dihitung berdasarkan selisih antara tinggi referensi wadah ($T_("ref") = 100.0$ cm) dan jarak pantulan terukur ($d$), sebagaimana dirumuskan pada @eq-tinggi.

$ h_("air") = cases(
  T_("ref") & "jika" d <= 2.0 "cm",
  0 & "jika" (T_("ref") - d) < 0,
  T_("ref") & "jika" (T_("ref") - d) > T_("ref"),
  T_("ref") - d & "lainnya."
) $ <eq-tinggi>

Untuk memitigasi fluktuasi acak akibat riak air sesaat dan _outlier_ akustik, sistem mengimplementasikan filter rata-rata bergerak (_moving average filter_) dengan ukuran jendela $k = 5$ sampel sebelum nilai ketinggian air dievaluasi oleh mesin status. Pembacaan diklasifikasikan sebagai *SENSOR ERROR* apabila durasi pulsa bernilai $0$ (sinyal pantul hilang) atau jarak terukur melampaui batas fisik wadah ($d > 400.0$ cm).

== Mesin Status Bahaya (Finite State Machine) Lokal pada Perangkat Tepi

Sistem mengimplementasikan mesin status empat kondisi (_Four-State FSM_) pada mikrokontroler ESP32. Hal ini menjamin bahwa tindakan proteksi dini—seperti peringatan suara dan lampu darurat—dapat dieksekusi secara instan dan otonom di pos pantau fisik tanpa terpengaruh ada atau tidaknya koneksi jaringan internet. Matriks logika FSM dirangkum pada @tbl-fsm.

#figure(
  tabel(
    (0.9fr, 1.1fr, 1fr, 1.2fr, 0.9fr),
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

Untuk mencegah pembekuan sistem (_system freeze_) yang kerap terjadi pada mikrokontroler akibat penggunaan fungsi penahan `delay()`, _firmware_ ESP32 dirancang menggunakan arsitektur penjadwalan multi-interval mandiri berbasis fungsi pelacak waktu milidetik `millis()`. 

Sistem memisahkan tugas operasional mikrokontroler menjadi empat siklus independen:
1. *Akuisisi Sensor (`SENSOR_INTERVAL = 500` ms)*: Membaca pulsa ultrasonik dan memperbarui status FSM dua kali per detik untuk deteksi responsif lonjakan air.
2. *Animasi Aktuator LED (`LED_ANIMATION_INTERVAL = 100` ms)*: Mengatur pola pergeseran frame tiga LED merah saat status DANGER (Frame 0/2: LED tengah pin 33 aktif; Frame 1: LED kiri pin 27 aktif; Frame 3: LED kanan pin 32 aktif).
3. *Penyegaran Display LCD (`LCD_ANIMATION_INTERVAL = 150` ms)*: Menampilkan teks alfanumerik dan menggerakkan animasi strobo blok hitam penuh (`ASCII 255`) di sekitar kata "BAHAYA" saat kondisi kritis.
4. *Publikasi Telemetri HTTP (`PUBLISH_INTERVAL = 2000` ms)*: Membangun paket JSON dan mengirimkan _request_ HTTP POST ke server _backend_ setiap dua detik.

Struktur ini menjamin bahwa tugas transmisi jaringan yang membutuhkan waktu ratusan milidetik tidak akan mengorbankan frekuensi kedipan animasi LED darurat maupun keandalan respon bunyi buzzer.

== Antarmuka Lokal LCD 16×2 I2C dengan Animasi Stroboskopik

Modul LCD 16×2 menyajikan pembacaan status lokal secara langsung di gardu pemantau lapangan:
- *Baris 0*: Selalu menampilkan informasi jarak numerik terukur dengan presisi satu desimal, misalnya `Jarak: 40.0 cm`.
- *Baris 1 (Kondisi Normal/Siaga)*: Menampilkan teks status sistem, misalnya `Status: AMAN` atau `Status: SIAGA`.
- *Baris 1 (Kondisi Bahaya)*: Mengeksekusi efek strobo visual bergerak dengan merender blok hitam pekat (`char kotak = 255;`) yang berpindah posisi secara ritmis di samping kata `BAHAYA`.
- *Kondisi Sensor Rusak*: Menampilkan peringatan darurat `SENSOR ERROR!` pada baris pertama dan instruksi `Cek HC-SR04` pada baris kedua.

== Protokol Telemetri HTTP REST POST dan Serialisasi JSON

Ketika pewaktu `PUBLISH_INTERVAL` tercapai, modul ESP32 secara otomatis memverifikasi koneksi Wi-Fi. Apabila koneksi terputus, fungsi `setupWiFi()` akan dipanggil secara nir-henti (_non-blocking retry_). Jika jaringan aktif, objek telemetri diserialisasikan ke format JSON menggunakan pustaka `ArduinoJson` dengan struktur sebagai berikut:

```json
{
  "deviceId": "smartflood-esp32-01",
  "distanceCm": 40.0,
  "waterLevelCm": 60.0,
  "status": "WARNING",
  "sensorValid": true,
  "wifiConnected": true,
  "uptimeSeconds": 142
}
```

Paket data ini dikirimkan melalui permintaan `HTTP POST` ke alamat server _backend_ (`http://192.168.1.8:8080/api/readings`) dengan _header_ `Content-Type: application/json` dan batas waktu respons (_timeout_) sebesar $3000$ ms.

== Mesin Deep Learning Time-Series Forecasting (LSTM)

Kelemahan utama sistem peringatan dini konvensional adalah sifatnya yang murni reaktif, di mana alarm baru berbunyi setelah air mencapai bibir tanggul. Untuk memberikan jendela waktu evakuasi yang memadai, sistem ini mengintegrasikan mesin _Deep Learning_ berbasis deret waktu (_time-series forecasting_) di sisi server dengan arsitektur _Long Short-Term Memory_ (LSTM).

=== Arsitektur Jaringan Saraf Tiruan LSTM

Arsitektur LSTM dirancang dengan lapisan bertingkat (_stacked LSTM_) sebanyak 64 unit sel memori yang memiliki gerbang kendali internal (_forget gate_, _input gate_, dan _output gate_) untuk mengatasi masalah gradien hilang (_vanishing gradient_) pada dependensi sekuensial panjang. Model menerima masukan berupa jendela geser (_sliding window_) sepanjang $N = 30$ titik data historis terakhir ($X_t = [h_(t - N + 1), dots, h_t]$ dengan interval pengambilan sampel $30$ detik) dan memproyeksikan lintasan ketinggian air pada tiga horizon masa depan: $15$ menit ($\hat{h}_{t+15}$), $30$ menit ($\hat{h}_{t+30}$), dan $60$ menit ($\hat{h}_{t+60}$).

Dinamika aliran informasi di dalam sel LSTM pada langkah waktu $t$ dirumuskan secara matematis sebagai berikut:

$ f_t = sigma(W_f dot [h_(t-1), x_t] + b_f) $ <eq-lstm-forget>

$ i_t = sigma(W_i dot [h_(t-1), x_t] + b_i) $ <eq-lstm-input>

$ tilde(C)_t = tanh(W_c dot [h_(t-1), x_t] + b_c) $ <eq-lstm-candidate>

$ C_t = f_t dot C_(t-1) + i_t dot tilde(C)_t $ <eq-lstm-cell>

$ o_t = sigma(W_o dot [h_(t-1), x_t] + b_o) $ <eq-lstm-output>

$ h_t = o_t dot tanh(C_t) $ <eq-lstm-hidden>

Di mana $f_t$, $i_t$, dan $o_t$ berturut-turut merepresentasikan vektor aktivasi gerbang lupa, gerbang masukan, dan gerbang keluaran; $C_t$ adalah kondisi sel internal (_cell state_); $h_t$ adalah vektor keadaan tersembunyi (_hidden state_); sedangkan $sigma$ adalah fungsi aktivasi sigmoid non-linear.

=== Kalkulasi Laju Kenaikan Air dan Estimated Time to Flood (ETTF)

Berdasarkan lintasan elevasi air masa depan hasil prediksi LSTM, sistem secara otomatis menghitung laju perubahan ketinggian air per satuan waktu ($d h / d t$) melalui aproksimasi turunan numerik terpusat:

$ frac(d h, d t) = frac(hat(h)_(t + Delta t) - h_t, Delta t) quad ["cm/menit"] $ <eq-laju-air>

Ketika laju pertambahan air bernilai positif ($d h / d t > 0$) dan elevasi air mengarah melampaui batas kritis wadah ($h_("kritis") = 80.0$ cm), sistem mengkalkulasi waktu estimasi wadah meluap (_Estimated Time to Flood_ / ETTF):

$ "ETTF" = cases(
  frac(h_("kritis") - h_t, d h / d t) & "jika" d h / d t > 0 "dan" h_t < h_("kritis"),
  0 & "jika" h_t >= h_("kritis"),
  infinity & "jika" d h / d t <= 0
) $ <eq-ettf>

Hasil perhitungan ETTF disajikan secara mencolok pada dashboard utama (misalnya: _"Perkiraan Luapan: 24 Menit Lagi"_), memberikan petugas kebencanaan dasar perhitungan waktu yang konkret untuk segera mengarahkan warga mengamankan aset berharga dan menuju ke titik kumpul aman.

=== Pita Estimasi Ketidakpastian (95% Confidence Interval)

Untuk menjaga akuntabilitas saintifik, proyeksi peramalan hidrograf dilengkapi dengan pita interval kepercayaan 95% ($hat(h)_(t+k) plus.minus 1.96 dot sigma_k$), di mana $sigma_k$ merupakan varians galat residu model pada horizon ke-$k$. Tampilan kerucut ketidakpastian ini membantu operator membedakan skenario kenaikan debit air yang pasti dengan proyeksi yang masih memiliki variabilitas tinggi.

== Agen Cerdas GenAI Situational Report (Sitrep) Advisor

Sebagai pilar kebaruan kedua pada antarmuka web, sistem menghadirkan agen bahasa cerdas (_Generative AI Sitrep Advisor_) yang memanfaatkan model bahasa besar (_Large Language Model_ / LLM) melalui integrasi antarmuka pemrograman aplikasi (API). Agen ini bertugas mentransformasikan deretan data teknis mentah menjadi dokumen laporan situasi kebencanaan yang komprehensif, terstruktur, dan bernilai taktis dalam Bahasa Indonesia formal.

=== Alur Pemrosesan Prompt Berbasis Konteks (Prompt Engineering Pipeline)

Setiap kali terjadi eskalasi status bahaya (peralihan dari SAFE ke WARNING atau WARNING ke DANGER) atau saat operator menekan tombol pemicu laporan, sistem secara otomatis mengekstraksi parameter telemetri terkini dari basis data SQLite, meliputi:
1. Elevasi muka air saat ini ($h_t$), laju kenaikan air ($d h / d t$), dan estimasi waktu luapan (ETTF) dari model LSTM;
2. Riwayat tren fluktuasi air selama 60 menit terakhir;
3. Status operasional pintu air, status sensor, dan durasi sistem aktif (_system uptime_).

Data tersebut kemudian diinjeksikan ke dalam _system prompt_ berstruktur ketat yang mendefinisikan peran agen sebagai analis operasi darurat Badan Penanggulangan Bencana Daerah (BPBD). Format laporan kebencanaan standar yang dihasilkan secara otomatis mencakup lima komponen utama:
- *Identitas & Waktu Laporan*: Tanggal, jam presisi, identitas gardu pantau, dan level siaga resmi.
- *Ringkasan Situasi Ketinggian Air*: Elevasi terukur aktual dan laju dinamika air per menit.
- *Analisis Prospektif Mitigasi*: Proyeksi LSTM untuk 30–60 menit ke depan beserta nilai ETTF.
- *Instruksi Tindakan Lapangan (SOP Teknis)*: Rekomendasi pembukaan pintu air pembuang, aktivasi pompa drainase darurat, dan koordinasi posko.
- *Draf Pengumuman Publik Cepat*: Format pesan singkat yang informatif, jelas, dan menenangkan untuk didiseminasikan langsung kepada grup WhatsApp warga sekitar.

=== Diseminasi Informasi Satu-Klik dan Asisten Dialog Interaktif

Laporan yang digenerasi oleh agen GenAI langsung ditampilkan pada panel khusus di aplikasi web. Disediakan tombol aksi satu-klik (_"Salin Format Siaran Warga"_ dan _"Unduh Sitrep Resmi"_) yang memungkinkan operator mendistribusikan peringatan ke kanal media sosial dan aplikasi perpesanan instan dalam hitungan detik. Selain itu, modul ini dilengkapi fitur antarmuka dialog interaktif (_AI Assistant_), di mana petugas dapat mengajukan pertanyaan taktis lanjutan, seperti: _"Berapa kapasitas tampung tersisa jika debit air naik 10 cm/jam?"_ atau _"Kapan jalur evakuasi sektor utara harus mulai disterilkan?"_.

== Antarmuka Web Dashboard Sistem Pemantau Banjir Terpadu

Seluruh luaran telemetri perangkat keras, pemodelan kembar digital, peramalan LSTM, dan laporan AI diintegrasikan ke dalam antarmuka web modern berbasis Next.js 14, sebagaimana ditunjukkan pada @gbr-dashboard.

#figure(
  image(fig-dashboard, width: 95%),
  caption: [Antarmuka web dashboard sistem pemantau banjir terpadu dengan Digital Twin 3D dan analitik cerdas],
) <gbr-dashboard>

Dashboard terpadu pada @gbr-dashboard menyajikan tiga komponen fungsional utama yang tersusun secara ergonomis:
1. *Kembar Digital 3D Reservoir (React Three Fiber)*: Merepresentasikan wadah tabung kaca silinder transparan dengan penandaan skala metrik fisik secara presisi. Ketinggian fluida air 3D bergerak naik dan turun secara mulus selaras dengan pembacaan sensor ultrasonik fisik. Permukaan fluida dilengkapi dengan simulasi riak dinamis (_wave surface displacement_) yang bergejolak saat muka air bertambah drastis dan kembali tenang saat kondisi stabil.
2. *Panel Hidrograf Telemetri dan Proyeksi LSTM*: Menampilkan grafik rekam jejak elevasi air historis berdampingan dengan kurva lintasan prediksi masa depan berwarna kontras serta garis batas zona Siaga ($50$ cm) dan Bahaya ($80$ cm).
3. *Panel Konsol Asisten Cerdas (Sitrep & AI Chat)*: Menyediakan jendela laporan darurat otomatis yang diperbarui secara dinamis saat status kritis tercapai, lengkap dengan tombol diseminasi instan ke grup warga dan kotak interaksi percakapan taktis mitigasi bencana.
