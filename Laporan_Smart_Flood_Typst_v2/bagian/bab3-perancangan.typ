#import "/template/components.typ": *
#import "/config/gambar.typ": *

= Perancangan dan Implementasi Sistem

== Arsitektur Sistem

Sistem _Smart Flood Detection and Early Warning System_ dirancang dengan arsitektur terintegrasi yang memisahkan pemrosesan data sensor ke dua kanal keluaran: antarmuka fisik lokal (LCD 16×2, LED indikator, dan alarm suara buzzer) serta kanal telemetri jarak jauh melalui protokol MQTT via jaringan Wi-Fi. Diagram blok sistem ditunjukkan pada @gbr-blok.

#figure(
  grid(
    columns: (1fr, 1cm, 1fr, 1cm, 1fr),
    row-gutter: 6pt,
    align: center + horizon,
    blok[*HC-SR04* \ sensor jarak ultrasonik], panah(), blok[*ESP32 DevKit-C V4* \ mikrokontroler pengolah], panah(), blok[*Wi-Fi Wokwi* \ Wokwi-GUEST],
    [], [], panah(arah: "b"), [], panah(arah: "b"),
    [], [], blok[*Keluaran Lokal* \ LCD 16×2 I2C, 3 LED, Buzzer], [], blok[*MQTT Broker* \ test.mosquitto.org:1883],
    [], [], [], [], panah(arah: "b"),
    [], [], [], [], blok[*Topik Data Telemetri* \ ti2024i/kelompok3/smartflood/data],
  ),
  caption: [Diagram blok sistem pemantau banjir terintegrasi],
) <gbr-blok>

== Komponen yang Digunakan

Perancangan perangkat keras disimulasikan menggunakan platform Wokwi. Seluruh komponen beserta fungsi dan spesifikasinya dirangkum pada @tbl-komponen.

#figure(
  tabel(
    (auto, 1fr, 1.4fr),
    ("Komponen", "Fungsi", "Keterangan teknis"),
    [ESP32 DevKit-C V4], [Mikrokontroler & pemroses utama], [Dual-Core 240 MHz, modul Wi-Fi 2,4 GHz, tegangan logika 3,3 V, catu daya USB 5 V],
    [HC-SR04], [Sensor jarak ultrasonik], [Rentang ukur 2–400 cm, pin TRIG (pemicu) dan ECHO (pantulan), VCC 5 V],
    [LCD 16×2 I2C], [Penampil visual lokal], [Modul LCD1602 dengan _backpack_ I2C PCF8574, alamat `0x27`, 3 rotasi halaman informasi],
    [LED Hijau, Kuning, Merah], [Indikator visual level siaga], [Tiga buah LED 5 mm masing-masing merepresentasikan status SAFE, WARNING, dan DANGER],
    [Resistor 220 $Omega$ (3 buah)], [Pembatas arus LED], [Dipasang seri pada katoda masing-masing LED ke rel ground],
    [Buzzer Piezoelektrik], [Alarm suara peringatan dini], [Mode _smooth_, menghasilkan nada 1000 Hz saat terpicu kondisi DANGER],
    [Breadboard & Kabel Jumper], [Papan sirkuit simulasi], [Half-size breadboard (`bb1`) untuk distribusi daya 5 V dan GND],
    [Pustaka Arduino], [Dukungan perangkat lunak], [`PubSubClient` (klien MQTT) dan `LiquidCrystal I2C` (antarmuka penampil LCD)],
    [Wi-Fi & Broker MQTT], [Kanal transmisi data nirkabel], [SSID `Wokwi-GUEST`, broker publik `test.mosquitto.org` pada port 1883],
  ),
  caption: [Daftar komponen perangkat keras dan perangkat lunak simulasi],
  kind: table,
) <tbl-komponen>

== Konfigurasi Pin dan Pengalamatan Perangkat

Hubungan perkabelan antara modul periferal dan pin GPIO mikrokontroler ESP32 disusun secara presisi untuk menghindari konflik perangkat keras, sebagaimana tertera pada @tbl-pin.

#figure(
  tabel(
    (1fr, 1.2fr, 1fr, 1.4fr),
    ("Periferal", "Pin Komponen", "GPIO ESP32", "Keterangan Koneksi"),
    [HC-SR04], [TRIG], [GPIO 5], [Keluaran digital pemicu pulsa 10 $mu$s],
    [HC-SR04], [ECHO], [GPIO 18], [Masukan digital pembacaan durasi pulsa pantul],
    [HC-SR04], [VCC, GND], [5V, GND], [Tersambung ke rel daya breadboard],
    [LED Hijau], [Anoda], [GPIO 25], [Katoda terhubung resistor 220 $Omega$ ke rel GND],
    [LED Kuning], [Anoda], [GPIO 26], [Katoda terhubung resistor 220 $Omega$ ke rel GND],
    [LED Merah], [Anoda], [GPIO 27], [Katoda terhubung resistor 220 $Omega$ ke rel GND],
    [Buzzer], [Pin 2 (Sinyal)], [GPIO 14], [Pin 1 terhubung ke rel GND],
    [LCD 16×2 I2C], [SDA], [GPIO 21], [Jalur data serial bus I2C hardware],
    [LCD 16×2 I2C], [SCL], [GPIO 22], [Jalur detak serial bus I2C hardware],
    [LCD 16×2 I2C], [VCC, GND], [5V, GND], [Tersambung ke rel daya breadboard, alamat `0x27`],
  ),
  caption: [Konfigurasi pin GPIO ESP32 DevKit-C V4 pada simulasi Wokwi],
  kind: table,
) <tbl-pin>

Alokasi pin buzzer pada perancangan ini secara khusus dipindahkan ke GPIO 14. Keputusan desain ini penting karena GPIO 21 dan GPIO 22 merupakan pin bus I2C bawaan (_hardware I2C_) mikrokontroler ESP32 yang dialokasikan khusus untuk modul LCD I2C. Penempatan buzzer pada GPIO 14 menjamin komunikasi I2C LCD tetap stabil tanpa interferensi sinyal nada frekuensi audio.

== Rangkaian Simulasi Wokwi

Skema rangkaian dirakit secara virtual pada platform simulator daring Wokwi dan dapat diakses serta diuji secara publik melalui tautan https://wokwi.com/projects/477733466285817857. Susunan tata letak komponen ditunjukkan pada @gbr-rangkaian.

#figure(
  image(fig-rangkaian, width: 85%),
  caption: [Tata letak rangkaian simulasi sistem pada Wokwi],
) <gbr-rangkaian>

== Cara Kerja Pengukuran dan Model Wadah

Sistem menggunakan model wadah dengan ketinggian sensor referensi $T_("ref") = 100$ cm di atas dasar wadah. Sensor ultrasonik HC-SR04 mengukur jarak pantul ke permukaan air ($d$). Ketinggian muka air ($h$) kemudian dihitung melalui pengurangan ketinggian referensi dengan jarak terukur:

$ h = max(0, min(T_("ref"), T_("ref") - d)) $ <pers-tinggi>

Untuk menjamin keandalan data fisis, program menerapkan penanganan batas ekstrem:
+ *Batas Buta Minimum Sensor ($d < 2$ cm):* HC-SR04 memiliki batas deteksi minimum nominal 2 cm. Apabila jarak terukur kurang dari 2 cm, air diinterpretasikan telah mencapai bibir wadah, sehingga nilai $h$ langsung ditetapkan pada kapasitas maksimum (100 cm) dan status masuk ke kondisi DANGER.
+ *Batas Jangkauan Maksimum ($d > 400$ cm) atau Pulsa Hilang ($t = 0$):* Jika pulsa pantul tidak terdeteksi dalam waktu tunggu (_timeout_ 30 ms) atau jarak melebihi 400 cm, pembacaan dinyatakan tidak valid (`sensorValid = false`), memicu status kesalahan `SENSOR_ERROR`.

== Logika Ambang Batas (Threshold) dan Tanggap Darurat

Status siaga bahaya banjir diklasifikasikan ke dalam tiga tingkatan utama berdasarkan tinggi air, ditambah satu status pengaman perangkat keras saat sensor mengalami gangguan, seperti dirangkum pada @tbl-threshold.

#figure(
  tabel(
    (auto, 1.2fr, 1fr, 1fr, 1.5fr),
    ("Status", "Tinggi Air ($h$)", "Indikator LED", "Alarm Buzzer", "Pesan pada LCD"),
    [SAFE], [$h < 50$ cm], [Hijau (ON)], [Mati], [Baris 0: STATUS: SAFE \ Baris 1: Air normal],
    [WARNING], [$50 "cm" <= h < 80$ cm], [Kuning (ON)], [Mati], [Baris 0: STATUS: WARNING \ Baris 1: Air meninggi!],
    [DANGER], [$h >= 80$ cm], [Merah (ON)], [Aktif (1000 Hz)], [Baris 0: STATUS: DANGER \ Baris 1: BAHAYA BANJIR!],
    [SENSOR_ERROR], [Pembacaan invalid], [Merah (ON)], [Mati], [Baris 0: STATUS: ERROR \ Baris 1: Sensor invalid],
  ),
  caption: [Logika ambang batas, tanggap darurat aktuator, dan pesan sistem],
  kind: table,
) <tbl-threshold>

Pada kondisi `SENSOR_ERROR`, LED merah dinyalakan sebagai peringatan visual bahwa perangkat mengalami malfungsi, namun buzzer dimatikan agar operator dapat membedakan gangguan sensor dari situasi darurat banjir sesungguhnya.

== Antarmuka Penampil LCD 16×2 Sistem Paging Tiga Halaman

Karena layar LCD 16×2 hanya memiliki kapasitas 32 karakter, program menerapkan teknik perputaran halaman informasi (_cyclic display paging_) otomatis setiap 2500 ms (2,5 detik) tanpa menghentikan eksekusi program:
+ *Halaman 1 (Nilai Fisis Pengukuran):* Menampilkan jarak sensor dan tinggi air (`Jarak: XX cm` pada baris 0 dan `Tinggi: YY cm` pada baris 1; atau `Sensor: ERROR` / `Cek HC-SR04` jika sensor gagal).
+ *Halaman 2 (Status Operasional):* Menampilkan tingkat bahaya dan deskripsi peringatan (`STATUS: SAFE`, `STATUS: WARNING`, atau `STATUS: DANGER`).
+ *Halaman 3 (Status Konektivitas Jaringan):* Menampilkan kondisi koneksi komunikasi IoT secara _real-time_ (`WiFi: ONLINE/OFFLINE` dan `MQTT: ONLINE/OFFLINE`).

Setiap baris LCD dicetak sepanjang tepat 16 karakter dengan spasi pengisi agar sisa karakter dari halaman sebelumnya bersih tanpa perlu membersihkan seluruh layar (_anti-flicker_).

== Komunikasi Protokol MQTT

Data telemetri dipublikasikan secara berkala setiap 2000 ms melalui koneksi Wi-Fi ke broker MQTT dengan spesifikasi:
- *MQTT Broker:* `test.mosquitto.org`, Port: 1883
- *Topik Telemetri:* `ti2024i/kelompok3/smartflood/data`
- *Client ID Unik:* `SmartFloodLCD-K3-XXXX` (menggunakan 4 digit heksadesimal terakhir MAC Address ESP32 melalui `ESP.getEfuseMac()`)
- *Muatan Data (Payload JSON) Kondisi Normal:*
#block(breakable: false)[
```json
{"distance_cm":40.0,"water_level_cm":60.0,"status":"WARNING"}
```
]
- *Muatan Data (Payload JSON) Kondisi Sensor Error:*
#block(breakable: false)[
```json
{"status":"SENSOR_ERROR"}
```
]

== Alur Program dan Penjadwalan Waktu Non-Blocking

Program mikrokontroler menggunakan pendekatan pewaktuan berbasis fungsi `millis()` alih-alih fungsi tunda pemblokir `delay()`. Hal ini memungkinkan seluruh subsistem berjalan secara simultan:
+ *Pemeriksaan Konektivitas:* Loop utama secara berkelanjutan memeriksa status Wi-Fi (coba ulang setiap 10 detik) dan MQTT (coba ulang setiap 5 detik) serta memproses antrean pesan melalui `mqttClient.loop()`.
+ *Akuisisi Data Sensor (Interval 500 ms):* Mengirim pulsa pemicu ke pin TRIG, membaca pulsa pantul pin ECHO, menghitung jarak dan ketinggian air, menentukan status, serta memperbarui aktuator LED dan buzzer.
+ *Penyegaran Tampilan LCD (Interval 250 ms & Rotasi 2500 ms):* Memperbarui teks LCD secara cepat sehingga perubahan status konektivitas maupun nilai sensor segera terefleksi pada layar.
+ *Pelaporan Serial Monitor (Interval 1000 ms):* Menampilkan ringkasan status operasional perangkat secara berkala ke antarmuka serial komputer dengan kecepatan 115200 bps.
+ *Publikasi Data MQTT (Interval 2000 ms):* Mengemas data telemetri ke dalam format JSON dan menerbitkannya ke broker publik MQTT.

