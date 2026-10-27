#import "/template/components.typ": *
#import "/config/gambar.typ": *

= Arsitektur dan Komponen IoT

== Arsitektur Sistem Lima Tingkat (Five-Tier AI-IoT Architecture)

Arsitektur sistem _Smart Flood Early Warning System_ dirancang mengacu pada arsitektur terdistribusi lima tingkat (_Five-Tier AI-IoT Architecture_). Struktur ini memisahkan tanggung jawab fungsional secara modular mulai dari akuisisi fisik di lapangan hingga komputasi intelijen di sisi server dan aplikasi web:

1. *Lapisan Persepsi dan Aktuasi Tepi (_Perception & Edge Actuation Layer_)*: Berada langsung pada pos pantau fisik, terdiri dari transduser ultrasonik HC-SR04 yang diakuisisi oleh mikrokontroler ESP32 DevKit-C V4. Lapisan ini mengeksekusi mesin status bahaya (_Finite State Machine_) lokal, menggerakkan indikator visual (5 unit LED multi-warna dengan mode strobo lari), display lokal LCD 16×2 I2C, serta alarm akustik frekuensi tinggi ($1000$ Hz) secara instan tanpa ketergantungan koneksi internet.
2. *Lapisan Jaringan dan Transpor (_Network & Transport Layer_)*: Menggunakan konektivitas Wi-Fi IEEE 802.11 b/g/n bawaan ESP32 untuk membungkus data telemetri ke dalam format JSON berbobot ringan (_lightweight payload_) dan mentransmisikannya menuju server _backend_ via protokol HTTP REST POST (didukung saluran cadangan failover MQTT).
3. *Lapisan Middleware dan Persistensi Data (_Middleware & Persistence Layer_)*: Server _backend_ berkinerja tinggi berbasis bahasa Go (Golang) bertindak sebagai _ingestion daemon_ pada port `8080`, memvalidasi payload telemetri masuk, menyimpannya ke basis data SQLite _time-series_, dan menyalurkan aliran data ke antarmuka web melalui protokol _Server-Sent Events_ (SSE).
4. *Lapisan Kecerdasan Buatan (_AI Analytics & Inference Engine_)*: Layanan komputasi analitik di sisi server yang menaungi dua mesin intelijen:
   - *Model Deep Learning LSTM*: Memproses jendela data deret waktu historis untuk memproyeksikan lintasan ketinggian air $15$–$60$ menit ke depan dan mengkalkulasi waktu menuju titik luapan (_Estimated Time to Flood_ / ETTF); serta
   - *Agen GenAI Sitrep Advisor*: Menggunakan model bahasa besar (_Large Language Model_) untuk menyintesis angka telemetri mentah menjadi laporan situasi kebencanaan naratif otomatis yang siap dibagikan ke masyarakat.
5. *Lapisan Presentasi dan Kembar Digital (_Presentation & 3D Digital Twin Layer_)*: Aplikasi web modern berbasis Next.js 14 yang merender kembar digital tabung reservoir kaca 3D interaktif (_React Three Fiber_) dengan dinamika riak fluida volumetrik, kurva proyeksi hidrograf masa depan, dan panel konsol asisten kebencanaan.

== Spesifikasi Komponen Perangkat Keras

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

Untuk memberikan gambaran jalur perkabelan sirkuit secara visual serta dokumentasi simulasi sebelum pengujian fisik, tangkapan layar antarmuka simulasi Wokwi disajikan pada @gbr-wokwi.

#figure(
  image(fig-wokwi, width: 95%),
  caption: [Diagram skematik perkabelan sirkuit pada platform simulasi Wokwi],
) <gbr-wokwi>

== Dokumentasi Perakitan Prototipe Perangkat Keras Fisik

Sebagai pemenuhan kriteria demonstrasi langsung (_physical prototype demo_) di laboratorium di hadapan dosen penguji, seluruh komponen fisik telah dirakit di atas _breadboard_ 400 titik kontak dan diuji coba dengan wadah air simulasi setinggi 100 cm. Dokumentasi perakitan fisik disajikan pada @gbr-hardware-fisik.

#figure(
  placeholder-gambar(
    label: "DOKUMENTASI FOTO PERANGKAT KERAS FISIK",
    petunjuk: "Tempatkan foto dokumentasi prototipe fisik asli (tampak atas perakitan breadboard ESP32, sensor HC-SR04, LCD 16x2, 5 LED, buzzer, dan wadah uji) pada folder figure/",
    file-target: "figure/foto-hardware.jpg",
    tinggi: 7.2cm,
  ),
  caption: [Dokumentasi perakitan unit prototipe perangkat keras fisik pendeteksi banjir],
) <gbr-hardware-fisik>

== Komponen Perangkat Lunak dan Tumpukan Teknologi (Software Stack)

Di sisi perangkat lunak, ekosistem sistem dibangun dengan tumpukan teknologi modern berkinerja tinggi:
1. *Firmware ESP32 (Arduino C++)*: Menggunakan pustaka `Wire.h` (I2C 100 kHz), `LiquidCrystal_I2C.h`, `WiFi.h`, `HTTPClient.h`, dan `ArduinoJson.h` v6/v7 untuk mengelola akuisisi sensor, aktuator lokal, dan serialisasi payload JSON secara non-blocking.
2. *Backend Server (Go / Golang)*: Layanan mikro berbobot ringan sebagai _ingestion daemon_ pada port `8080`, menangani endpoint REST `/api/readings`, manajemen koneksi _Server-Sent Events_ (SSE), dan persistensi SQLite.
3. *AI Analytics Engine (Python / ONNX)*: Modul layanan inferensi yang mengeksekusi model _Deep Learning_ LSTM untuk peramalan deret waktu dan mengintegrasikan model bahasa besar (LLM API) untuk penyusunan laporan darurat otomatis.
4. *Frontend Web Dashboard (Next.js 14 & Three.js)*: Antarmuka pemantauan responsif pada port `3000` berbasis React 18, React Three Fiber (kembar digital tabung kaca 3D dengan riak air realistis), dan visualisasi hidrograf proyeksi prediktif.
