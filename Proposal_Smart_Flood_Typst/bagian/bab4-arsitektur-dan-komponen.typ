#import "/template/components.typ": *
#import "/config/gambar.typ": *

= Arsitektur dan Komponen IoT

== Arsitektur Sistem Berlapis (Four-Tier Architecture)

Arsitektur sistem _Smart Flood Detection and Early Warning System_ dirancang mengacu pada standar empat lapisan arsitektur IoT (_Four-Tier IoT Architecture_), yang memisahkan tanggung jawab fungsional secara modular mulai dari persepsi fisik hingga presentasi analitik berbasis web, sebagaimana diilustrasikan pada @gbr-arsitektur.

#figure(
  image(fig-arsitektur, width: 100%),
  caption: [Diagram arsitektur sistem IoT empat tingkat (Four-Tier Architecture)],
) <gbr-arsitektur>

Uraian tugas fungsional masing-masing tingkatan adalah sebagai berikut:
1. *Lapisan Persepsi dan Aktuasi (_Perception & Actuation Layer_)*: Bertugas mengonversi parameter fisis pantulan gelombang ultrasonik menjadi sinyal listrik serta memberikan umpan balik fisik seketika kepada manusia melalui display LCD 16×2, barisan LED multi-warna, dan alarm akustik piezoelektrik berfrekuensi $1000$ Hz.
2. *Lapisan Pemrosesan Tepi (_Edge Processing Layer_)*: Berpusat pada mikrokontroler ESP32 DevKit-C V4 yang mengeksekusi perhitungan konversi jarak ke tinggi air, memvalidasi integritas data (_threshold clamping_), mengendalikan mesin status bahaya (_Finite State Machine_), dan mengelola orkestrasi waktu secara _non-blocking_.
3. *Lapisan Jaringan dan Transpor (_Network & Transport Layer_)*: Memanfaatkan antarmuka Wi-Fi bawaan ESP32 untuk membungkus data telemetri ke dalam format JSON berbobot ringan (_lightweight payload_) dan mentransmisikannya ke server lokal via protokol HTTP REST POST (dengan saluran cadangan failover MQTT).
4. *Lapisan Layanan Backend (_Backend Middleware Daemon_)*: Server _backend_ berbasis bahasa pemrograman Go (Golang) bertindak sebagai _ingestion daemon_ berkecepatan tinggi yang menerima _stream_ pembacaan telemetri via REST `/api/readings`, mengarsipkan histori pembacaan ke basis data SQLite, dan menyalurkan data ke antarmuka web melalui _Server-Sent Events_ (SSE).
5. *Lapisan Aplikasi dan Presentasi (_Application & Presentation Layer_)*: Aplikasi web frontend modern berbasis Next.js 14 menyajikan visualisasi kembar digital 3D (_Digital Twin 3D Reservoir_) dengan simulasi dinamika riak air laut secara real-time dan hidrograf telemetri interaktif.

== Spesifikasi Komponen Perangkat Keras

Seluruh komponen perangkat keras yang telah diimplementasikan dan diuji pada prototipe fisik dirangkum pada @tbl-komponen-hw.

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

== Pemetaan Pin GPIO Mikrokontroler ESP32

Konfigurasi pengkabelan antara modul periferal fisik dan pin GPIO pada mikrokontroler ESP32 disusun secara presisi untuk menjamin integritas sinyal dan menghindari konflik bus komunikasi I2C, sebagaimana dirangkum pada @tbl-pin-esp32.

#figure(
  tabel(
    (1fr, 1fr, 0.9fr, 1.5fr),
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
  ),
  caption: [Pemetaan pin GPIO mikrokontroler ESP32 pada sirkuit fisik],
  kind: table,
) <tbl-pin-esp32>

Untuk memberikan gambaran perkabelan sirkuit secara visual dan memudahkan verifikasi jalur pinout saat perakitan laboratorium, diagram skematik rangkaian simulasi Wokwi disajikan pada @gbr-wokwi.

#figure(
  image(fig-wokwi, width: 100%),
  caption: [Diagram skematik perkabelan sirkuit pada platform simulasi Wokwi],
) <gbr-wokwi>

== Dokumentasi Perakitan Prototipe Fisik (Hardware Assembly)

Sebagai pemenuhan kriteria demonstrasi langsung (_physical prototype demo_) di depan dosen penguji pada sesi Ujian Tengah Semester (UTS), prototipe fisik telah dirakit di atas _half-size breadboard_ 400 titik kontak dengan mengintegrasikan seluruh komponen fisik yang diuji coba secara fungsional. Dokumentasi unit prototipe fisik disajikan pada @gbr-hardware-fisik.

#figure(
  image(fig-hardware, width: 100%),
  caption: [Dokumentasi perakitan unit prototipe perangkat keras fisik pendeteksi banjir],
) <gbr-hardware-fisik>

Keberadaan diagram skematik virtual Wokwi (@gbr-wokwi) berdampingan dengan unit fisik prototipe (@gbr-hardware-fisik) membuktikan kesiapan kelompok baik secara teoritis (skema perkabelan terstandar) maupun secara empiris (alat bekerja dan siap didemonstrasikan).

== Komponen Perangkat Lunak (Software Stack)

Di sisi perangkat lunak, ekosistem sistem dibangun dengan arsitektur modern berkinerja tinggi:
1. *Firmware ESP32*: Dikembangkan menggunakan Arduino C++ dengan pustaka inti `Wire.h` (antarmuka I2C bus frekuensi 100 kHz), `LiquidCrystal_I2C.h` (manajemen buffer display teks), `WiFi.h` (manajemen status jaringan nirkabel), `HTTPClient.h` (protokol transfer HTTP POST), dan `ArduinoJson.h` v6/v7 (serialisasi objek data telemetri).
2. *Backend Server (Go)*: Layanan mikro berbobot ringan yang bertindak sebagai _ingestion daemon_ pada port `8080`, menerima _stream_ pembacaan telemetri via endpoint REST `/api/readings`, dan menyalurkan data ke antarmuka web melalui _Server-Sent Events_ (SSE).
3. *Frontend Web Dashboard (Next.js & Three.js)*: Antarmuka pemantauan responsif pada port `3000` dengan pustaka `@react-three/fiber` dan `@react-three/drei` untuk merender kembar digital tabung kaca 3D dengan massa air biru laut transparan dan simulasi riak ombak parametrik.
