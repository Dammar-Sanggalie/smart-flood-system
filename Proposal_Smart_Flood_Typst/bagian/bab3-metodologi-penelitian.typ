#import "/template/components.typ": *
#import "/config/gambar.typ": *

= Metodologi Perancangan dan Implementasi Sistem

== Kerangka Alur Kerja Sistem (Five-Tier AI-IoT Architecture)

Arsitektur sistem _Smart Flood Early Warning System_ dirancang mengacu pada arsitektur terdistribusi lima tingkat (_Five-Tier AI-IoT Architecture_) secara modular:

1. *Lapisan Persepsi dan Aktuasi Tepi (_Perception & Edge Actuation Layer_)*: Sensor ultrasonik HC-SR04 dan ESP32 DevKit-C V4 pada gardu pantau fisik mengeksekusi mesin status bahaya (_Finite State Machine_) lokal, menggerakkan indikator visual 5 LED strobo, penampil LCD 16×2 I2C, dan buzzer akustik $1000$ Hz secara instan dan otonom tanpa tergantung koneksi internet.
2. *Lapisan Jaringan dan Transpor (_Network & Transport Layer_)*: Konektivitas Wi-Fi IEEE 802.11 b/g/n bawaan ESP32 membungkus telemetri ke dalam format payload JSON berbobot ringan menuju server _backend_ melalui protokol HTTP REST POST.
3. *Lapisan Middleware dan Persistensi Data (_Middleware & Persistence Layer_)*: Server _backend_ Go (_Golang_) pada port `8080` memvalidasi paket masuk, menyimpannya ke basis data SQLite _time-series_, dan menyalurkan aliran data ke antarmuka web via _Server-Sent Events_ (SSE).
4. *Lapisan Kecerdasan Buatan (_AI Analytics & Inference Engine_)*: Layanan komputasi server yang mengeksekusi model _Deep Learning_ LSTM untuk memproyeksikan lintasan elevasi air $15$–$60$ menit ke depan (menghitung laju kenaikan $d h / d t$ dan estimasi waktu luap ETTF) serta agen _GenAI Sitrep Advisor_ berbasis LLM penyusun laporan situasi kebencanaan naratif berstandar BNPB/BPBD.
5. *Lapisan Presentasi dan Kembar Digital (_Presentation & 3D Digital Twin Layer_)*: Aplikasi web modern Next.js 14 yang merender kembar digital tabung kaca 3D interaktif (_React Three Fiber_) dengan riak fluida volumetrik realistis, kurva proyeksi hidrograf, dan konsol asisten AI.

== Perancangan Perangkat Keras Fisik

=== Spesifikasi Komponen Perangkat Keras
Seluruh komponen perangkat keras yang telah diintegrasikan dan diverifikasi pada prototipe fisik dirangkum pada @tbl-komponen-hw.

#figure(
  tabel(
    (1fr, 1.3fr, 1.7fr),
    ("Komponen", "Fungsi Utama", "Spesifikasi Teknis"),
    [ESP32 DevKit-C V4], [Mikrokontroler & pemroses utama], [Dual-Core Xtensa 32-bit LX6 240 MHz, 520 KB SRAM, Wi-Fi 802.11 b/g/n, Bluetooth v4.2 BR/EDR & BLE],
    [HC-SR04], [Sensor jarak ultrasonik nir-sentuh], [Frekuensi kerja 40 kHz, sudut deteksi $< 15 degree$, resolusi 0,3 cm, jangkauan 2–400 cm, VCC 5V],
    [LCD 16×2 I2C], [Display alfanumerik lokal], [Modul LCD1602 dengan _I2C backpack_ PCF8574, alamat I2C `0x27`, 2 baris 16 karakter, backlight biru],
    [LED Hijau (5 mm)], [Indikator status AMAN (SAFE)], [Arus maju 20 mA, tegangan kerja 2,0–2,2 V, dipasang seri resistor 220 $Omega$],
    [LED Kuning (5 mm)], [Indikator status SIAGA (WARNING)], [Arus maju 20 mA, tegangan kerja 2,0–2,2 V, dipasang seri resistor 220 $Omega$],
    [3× LED Merah (5 mm)], [Indikator status BAHAYA & ERROR], [3 unit LED merah (Kiri, Tengah, Kanan) untuk animasi memancar dan status darurat],
    [Buzzer Piezo 5V], [Alarm akustik peringatan dini], [Buzzer aktif/smooth mode, frekuensi nada konstan 1000 Hz pada kondisi DANGER],
    [Resistor 220 $Omega$ (5 buah)], [Pembatas arus proteksi LED], [Toleransi 5%, daya 1/4 Watt, dipasang pada katoda tiap-tiap LED],
    [Breadboard & Jumper], [Papan perakitan sirkuit], [Half-size breadboard 400 titik kontak, kabel jumper male-to-male dan male-to-female],
    [Catu Daya USB 5V], [Suplai daya mikrokontroler], [Adaptor/Port USB 5V 2A dengan regulasi tegangan on-board 3,3V pada modul ESP32],
  ),
  caption: [Daftar spesifikasi perangkat keras prototipe sistem banjir],
  kind: table,
) <tbl-komponen-hw>

=== Pemetaan Pin GPIO Mikrokontroler ESP32
Konfigurasi pengkabelan antara modul periferal fisik dan pin GPIO pada mikrokontroler ESP32 disusun secara presisi untuk menjamin integritas sinyal dan menghindari konflik bus komunikasi I2C, sebagaimana dirangkum pada @tbl-pin-esp32.

#figure(
  {
    set text(size: 9.5pt)
    set table(inset: 4pt)
    tabel(
      (1fr, 0.9fr, 0.9fr, 1.6fr),
      ("Periferal / Modul", "Pin Komponen", "GPIO ESP32", "Keterangan Rangkaian Fisik"),
      [Sensor HC-SR04], [TRIG], [GPIO 5], [Keluaran digital pemicu pulsa 10 $mu$s],
      [Sensor HC-SR04], [ECHO], [GPIO 18], [Masukan digital pembacaan durasi pulsa pantulan],
      [Sensor HC-SR04], [VCC, GND], [5V, GND], [Terhubung ke rel daya 5V dan rel ground],
      [Display LCD 16×2], [SDA], [GPIO 21], [Jalur data serial bus I2C (Wire library)],
      [Display LCD 16×2], [SCL], [GPIO 22], [Jalur sinyal clock serial bus I2C],
      [Display LCD 16×2], [VCC, GND], [5V, GND], [Tersambung ke rel daya 5V dan ground],
      [LED Hijau (SAFE)], [Anoda (+)], [GPIO 25], [Katoda (-) terhubung resistor 220 $Omega$ ke GND],
      [LED Kuning (WARN)], [Anoda (+)], [GPIO 26], [Katoda (-) terhubung resistor 220 $Omega$ ke GND],
      [LED Merah 1 (Kiri)], [Anoda (+)], [GPIO 27], [Katoda (-) terhubung resistor 220 $Omega$ ke GND],
      [LED Merah 2 (Tengah)], [Anoda (+)], [GPIO 33], [Katoda (-) terhubung resistor 220 $Omega$ ke GND],
      [LED Merah 3 (Kanan)], [Anoda (+)], [GPIO 32], [Katoda (-) terhubung resistor 220 $Omega$ ke GND],
      [Buzzer Piezoelektrik], [Positif (+)], [GPIO 14], [Sinyal nada audio PWM 1000 Hz, kaki (-) ke GND],
    )
  },
  caption: [Pemetaan pin GPIO mikrokontroler ESP32 pada sirkuit fisik],
  kind: table,
) <tbl-pin-esp32>

Untuk memberikan gambaran jalur perkabelan sirkuit secara visual sebelum pengujian fisik, tangkapan layar simulasi Wokwi disajikan pada @gbr-wokwi.

#figure(
  image(fig-wokwi, width: 80%),
  caption: [Diagram skematik perkabelan sirkuit pada platform simulasi Wokwi],
) <gbr-wokwi>

=== Dokumentasi Perakitan Prototipe Perangkat Keras Fisik
Sebagai pemenuhan kriteria demonstrasi langsung (_physical prototype demo_) di laboratorium di hadapan dosen penguji, seluruh komponen fisik telah dirakit di atas _breadboard_ 400 titik kontak dan diuji coba dengan wadah air simulasi setinggi 100 cm. Dokumentasi perakitan fisik disajikan pada @gbr-hardware-fisik.

#figure(
  image(fig-hardware, width: 75%),
  caption: [Dokumentasi perakitan unit prototipe perangkat keras fisik pendeteksi banjir],
) <gbr-hardware-fisik>

== Perancangan Perangkat Lunak Tertanam (Firmware ESP32)

=== Logika Mesin Status Bahaya (Finite State Machine)
Sistem mengimplementasikan mesin status empat kondisi (_Four-State FSM_) pada mikrokontroler ESP32 untuk menjamin tindakan peringatan dini di lapangan tetap dieksekusi seketika secara otonom tanpa tergantung koneksi internet. Matriks logika FSM dirangkum pada @tbl-fsm.

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

=== Manajemen Eksekusi Non-Blocking Berbasis Waktu (millis)
Untuk mencegah pembekuan eksekusi program (_freezing_) akibat fungsi `delay()`, _firmware_ ESP32 memisahkan tugas menjadi empat interval independen:
1. *Akuisisi Sensor (`SENSOR_INTERVAL = 500` ms)*: Membaca pulsa ultrasonik dan memperbarui status FSM dua kali per detik untuk deteksi responsif lonjakan air.
2. *Animasi Aktuator LED (`LED_ANIMATION_INTERVAL = 100` ms)*: Mengatur pola pergeseran frame tiga LED merah saat status DANGER (Frame 0/2: LED tengah pin 33 aktif; Frame 1: LED kiri pin 27 aktif; Frame 3: LED kanan pin 32 aktif).
3. *Penyegaran Display LCD (`LCD_ANIMATION_INTERVAL = 150` ms)*: Menampilkan teks alfanumerik dan menggerakkan animasi strobo blok hitam penuh (`ASCII 255`) di sekitar kata `BAHAYA` saat kondisi kritis.
4. *Publikasi Telemetri HTTP (`PUBLISH_INTERVAL = 2000` ms)*: Membangun paket JSON dan mengirimkan permintaan HTTP POST ke server _backend_ setiap dua detik.

=== Protokol Telemetri HTTP REST POST dan Serialisasi JSON
Setiap 2 detik, modul ESP32 menyerialisasikan data telemetri ke dalam format JSON menggunakan pustaka `ArduinoJson` dengan struktur:

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

== Desain Pemodelan Deep Learning Time-Series (LSTM)

Mesin peramalan deret waktu pada peladen dibangun dengan arsitektur _stacked LSTM_ sebanyak 64 sel memori. Alur pemodelan dirancang melalui tahapan:
1. *Pembentukan Jendela Geser (Sliding Window)*: Mengonversi deret telemetri ketinggian air menjadi matriks masukan $X_t = [h_(t-N+1), dots, h_t]$ dengan $N = 30$ titik historis ($15$ menit pengamatan).
2. *Inferensi Multi-Horizon*: Menghasilkan proyeksi lintasan elevasi air pada horizon $15$ menit ($hat(h)_(t+15)$), $30$ menit ($hat(h)_(t+30)$), dan $60$ menit ($hat(h)_(t+60)$).
3. *Kalkulasi Laju Dinamika Air dan ETTF*: Menghitung turunan kenaikan air $d h / d t$ dan waktu luap (*Estimated Time to Flood* / ETTF) menuju batas kritis $80.0$ cm.
4. *Pita Ketidakpastian*: Memproyeksikan pita interval kepercayaan 95% ($hat(h) plus.minus 1.96 dot sigma$) pada kurva hidrograf masa depan.

== Desain Pipeline Agen Cerdas GenAI Sitrep Advisor

Modul _GenAI Sitrep Advisor_ bertindak sebagai analis operasional kebencanaan otonom melalui integrasi model bahasa besar (LLM API):
1. *Ekstraksi Konteks Waktu-Nyata*: Menarik status terkini dari basis data SQLite (elevasi aktual $h_t$, laju pertambahan air $d h / d t$, nilai ETTF dari model LSTM, tren 60 menit terakhir, serta status tanggul).
2. *System Prompt Pipeline*: Menginjeksikan konteks telemetri ke dalam rancangan _prompt_ terstruktur berstandar format laporan BNPB/BPBD yang mencakup: identitas posko, ringkasan situasi, analisis prospektif, rekomendasi SOP tindakan teknis pintu air, dan draf siaran warga.
3. *Diseminasi Cepat dan Asisten Dialog*: Antarmuka web menyediakan tombol salin instan laporan darurat untuk disebarkan ke grup WhatsApp warga serta jendela percakapan interaktif (*AI Chat*) untuk panduan mitigasi lapangan.

== Perancangan Antarmuka Web Dashboard Sistem Terpadu

Seluruh data telemetri fisik, kembar digital 3D, peramalan LSTM, dan laporan GenAI diintegrasikan ke dalam antarmuka web modern berbasis Next.js 14, sebagaimana disajikan pada @gbr-dashboard.

#figure(
  image(fig-dashboard, width: 95%),
  caption: [Antarmuka web dashboard sistem pemantau banjir terpadu dengan Digital Twin 3D dan analitik cerdas],
) <gbr-dashboard>

Dashboard terpadu pada @gbr-dashboard menyajikan tiga komponen fungsional utama:
1. *Kembar Digital 3D Reservoir (React Three Fiber)*: Merepresentasikan wadah tabung kaca silinder transparan dengan skala metrik fisik presisi dan simulasi riak dinamis (_wave surface displacement_) yang bergejolak saat kenaikan air drastis dan tenang saat elevasi stabil.
2. *Panel Hidrograf Telemetri dan Proyeksi LSTM*: Menampilkan grafik rekam jejak elevasi air historis berdampingan dengan kurva lintasan prediksi masa depan berwarna kontras serta garis batas zona Siaga ($50$ cm) dan Bahaya ($80$ cm).
3. *Panel Konsol Asisten Cerdas (Sitrep & AI Chat)*: Menyediakan jendela laporan darurat otomatis yang diperbarui secara dinamis saat status kritis tercapai, lengkap dengan tombol diseminasi instan ke grup warga dan kotak interaksi percakapan taktis mitigasi bencana.

== Metrik Pengujian dan Evaluasi Kinerja Sistem

Tingkat keberhasilan implementasi prototipe diukur berdasarkan kriteria kuantitatif dan kualitatif yang dirangkum pada @tbl-indikator.

#figure(
  tabel(
    (1.2fr, 1.8fr, 1fr),
    ("Aspek Pengujian", "Kriteria Keberhasilan", "Metode Verifikasi"),
    [Akurasi Sensor Jarak], [Galat ukur pembacaan sensor ultrasonik $<= plus.minus 1$ cm pada rentang $5$–$90$ cm], [Kalibrasi manual mistar ukur],
    [Latensi Respon Aktuator], [Aktuator LED dan buzzer bereaksi $< 200$ ms setelah perubahan ambang batas terdeteksi], [Pengamatan serial dan fisik],
    [Keandalan Non-Blocking], [Animasi LCD dan running LED merah tetap berjalan halus tanpa mengalami gangguan saat HTTP POST berlangsung], [Uji loop timing osiloskop/serial],
    [Keberhasilan Telemetri], [Persentase transmisi paket data HTTP POST JSON berhasil mencapai $> 95%$ pada kondisi jaringan Wi-Fi stabil], [Pemeriksaan status HTTP response 200/201],
    [Akurasi Prediksi AI (LSTM)], [Model LSTM mencapai nilai $"RMSE" < 3,0$ cm dan $"MAE" < 2,0$ cm pada horizon prediksi 30 menit ke depan], [Evaluasi metrik regresi dataset uji],
    [Latensi Inferensi Model AI], [Waktu eksekusi inferensi peramalan pada server membutuhkan waktu $< 1,0$ detik], [Benchmarking waktu komputasi inferensi],
    [Kecepatan Generasi GenAI], [Agen GenAI menghasilkan dokumen Sitrep kebencanaan lengkap dalam tempo $< 3,0$ detik], [Pengukuran response time API LLM],
    [Sinkronisasi 3D Twin], [Model ketinggian air pada antarmuka 3D bergerak naik-turun sesuai data telemetri aktual dalam jeda $< 2$ detik], [Pengujian fungsional web dashboard],
  ),
  caption: [Matriks indikator keberhasilan prototipe sistem pemantau banjir],
  kind: table,
) <tbl-indikator>

== Jadwal Pelaksanaan Proyek (Timeline)

Pelaksanaan proyek _Smart Flood Detection and Early Warning System_ terpadu dirancang berlangsung selama delapan pekan perkuliahan semester ganjil tahun akademik 2026/2027, dengan puncak evaluasi paruh waktu berupa Demo Prototipe Fisik pada Ujian Tengah Semester (UTS), Senin 19 Oktober 2026. Rincian pembagian waktu kerja seluruh tahapan rekayasa perangkat keras, kecerdasan buatan, dan aplikasi web disajikan pada @tbl-timeline.

#figure(
  {
    set text(size: 10pt)
    set table(inset: 4.5pt)
    tabel(
      (0.35fr, 2.3fr, 0.35fr, 0.35fr, 0.35fr, 0.35fr, 0.35fr, 0.35fr, 0.35fr, 0.35fr),
      ("No", "Uraian Aktivitas Proyek", "M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8"),
      [1], [Studi literatur hidrologi, sensor ultrasonik & model deret waktu AI], [X], [X], [], [], [], [], [], [],
      [2], [Perancangan skematik sirkuit & simulasi pada platform Wokwi], [], [X], [X], [], [], [], [], [],
      [3], [Pengadaan komponen perangkat keras & perakitan _breadboard_ fisik], [], [], [X], [X], [], [], [], [],
      [4], [Pengembangan _firmware_ ESP32 C++ _non-blocking_ & aktuasi FSM], [], [], [], [X], [X], [], [], [],
      [5], [Pengembangan _backend daemon_ Go, basis data SQLite & jalur HTTP/SSE], [], [], [], [], [X], [X], [], [],
      [6], [Pelatihan model peramalan LSTM & rekayasa _prompt_ GenAI Sitrep], [], [], [], [], [X], [X], [X], [],
      [7], [Pengembangan antarmuka web Next.js 14 & kembar digital 3D Three.js], [], [], [], [], [], [X], [X], [],
      [8], [*Uji integrasi menyeluruh (end-to-end) & Demo Prototipe UTS (19 Okt 2026)*], [], [], [], [], [], [], [*X*], [],
      [9], [Evaluasi performa, penyusunan laporan akhir & penyempurnaan sistem], [], [], [], [], [], [], [], [X],
    )
  },
  caption: [Matriks jadwal pelaksanaan proyek (Timeline Gantt Chart)],
  kind: table,
) <tbl-timeline>
