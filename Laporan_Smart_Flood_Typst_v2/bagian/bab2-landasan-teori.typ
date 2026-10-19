= Landasan Teori

== Internet of Things

_Internet of Things_ (IoT) adalah konsep yang menghubungkan perangkat fisik berbasis sensor dan mikrokontroler ke jaringan internet sehingga data dapat dikumpulkan, dikirim, dan dipantau dari jarak jauh secara _real-time_. Sistem IoT pada umumnya terdiri atas sensor sebagai masukan data fisis, mikrokontroler sebagai unit pemrosesan, jalur komunikasi data, serta antarmuka pemantau jarak jauh (_monitoring dashboard_).

== Mikrokontroler ESP32 DevKit-C V4

ESP32 adalah mikrokontroler berkinerja tinggi buatan Espressif Systems yang mengintegrasikan prosesor Xtensa Dual-Core 32-bit, modul Wi-Fi 802.11 b/g/n, dan Bluetooth [1]. Papan pengembangan ESP32 DevKit-C V4 menyediakan pin GPIO (_General Purpose Input/Output_) serbaguna, termasuk jalur komunikasi perangkat keras I2C default pada pin GPIO 21 (SDA) dan GPIO 22 (SCL). Level logika pin digital ESP32 beroperasi pada tegangan 3,3 V, sedangkan pin daya menyediakan keluaran 5 V (USB) dan 3,3 V untuk menyuplai sensor dan modul eksternal.

== Sensor Ultrasonik HC-SR04

HC-SR04 adalah modul sensor pengukur jarak nirsentuh berbasis pantulan gelombang ultrasonik [3]. Modul ini memiliki pemancar (_transmitter_) dan penerima (_receiver_) ultrasonik dengan rentang pengukuran efektif 2 cm hingga 400 cm. Modul beroperasi dengan memicu pulsa HIGH selama minimal 10 $mu$s pada pin TRIG, kemudian pin ECHO akan bernilai HIGH selama gelombang merambat pergi dan kembali memantul dari permukaan objek. Jarak dihitung menggunakan hubungan:

$ d = (v dot t) / 2 approx t / 58 $ <pers-jarak>

Pada @pers-jarak, $d$ menyatakan jarak dalam sentimeter (cm), $t$ adalah durasi pulsa pin ECHO dalam mikrodetik ($mu$s), dan $v$ merupakan cepat rambat gelombang bunyi di udara ($approx$ 343 m/s atau 0,0343 cm/$mu$s pada suhu kamar). Konstanta 58 merepresentasikan waktu tempuh bolak-balik bunyi sejauh 1 cm ($2 / 0.0343 approx 58.3$ $mu$s/cm).

== Protokol Komunikasi MQTT

MQTT (_Message Queuing Telemetry Transport_) adalah protokol komunikasi data berbasis standar ISO (ISO/IEC 20922) dengan pola _publish/subscribe_ yang sangat ringan dan hemat konsumsi daya maupun lebar pita (_bandwidth_) [2]. Pada arsitektur MQTT:
+ *Broker* bertindak sebagai penyalur pesan pusat (pada praktikum ini menggunakan broker publik `test.mosquitto.org` pada port 1883).
+ *Publisher* (ESP32) mengirimkan data pengukuran yang dikemas dalam format teks terstruktur JSON (_JavaScript Object Notation_) ke topik tertentu.
+ *Subscriber* (klien pemantau) menerima data secara otomatis setiap kali broker menerima kiriman pesan baru pada topik yang dilanggani.

Komunikasi pada program ESP32 diimplementasikan menggunakan pustaka Arduino `PubSubClient`.

== LCD 16×2 dengan Modul Antarmuka I2C PCF8574

LCD 16×2 adalah modul penampil alfanumerik yang memiliki 2 baris dengan kapasitas 16 karakter per baris. Modul LCD standar memerlukan setidaknya 6 hingga 10 pin mikrokontroler untuk mode paralel. Dengan penambahan papan konverter I2C berbasis chip PCF8574, modul hanya memerlukan dua jalur komunikasi, yaitu _Serial Data_ (SDA) dan _Serial Clock_ (SCL). Alamat I2C default modul pada simulasi Wokwi adalah `0x27`. Pengendalian tampilan LCD dilakukan melalui pustaka `LiquidCrystal_I2C`. Karena kapasitas tampilan terbatas, informasi disajikan secara bergantian melalui teknik perputaran halaman (_paging_).

== Indikator Visual dan Alarm Suara (LED, Resistor, Buzzer)

Sistem peringatan lokal memanfaatkan komponen elektro-akustik dan visual:
+ *Light Emitting Diode (LED):* Tiga buah LED berwarna hijau, kuning, dan merah digunakan sebagai representasi kondisi SAFE, WARNING, dan DANGER.
+ *Resistor 220 $Omega$:* Dipasang secara seri pada katoda masing-masing LED untuk membatasi kuat arus listrik agar tidak melebihi batas aman arus keluaran pin GPIO ESP32 (maksimal $approx$ 12–20 mA per pin) serta memperpanjang usia kerja LED.
+ *Piezoelectric Buzzer:* Menghasilkan alarm suara akustik pada kondisi DANGER dengan memanfaatkan fungsi modulasi frekuensi `tone()` pada frekuensi 1000 Hz. Pin pengendali buzzer dihubungkan ke GPIO 14 agar tidak mengganggu jalur I2C pada GPIO 21.

