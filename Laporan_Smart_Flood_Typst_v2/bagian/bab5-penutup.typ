= Penutup

== Kesimpulan

Berdasarkan perancangan, implementasi kode program, dan hasil simulasi sistem pada Wokwi, dapat ditarik beberapa kesimpulan sebagai berikut:

+ Prototipe _Smart Flood Detection and Early Warning System_ berbasis mikrokontroler ESP32 DevKit-C V4 dan sensor ultrasonik HC-SR04 berhasil disimulasikan secara utuh pada platform Wokwi dengan mengintegrasikan keluaran lokal dan kanal telemetri IoT.
+ Sistem berhasil mengklasifikasikan tingkat bahaya banjir secara bertahap: level SAFE (tinggi air < 50 cm) ditandai LED hijau, level WARNING (50–79 cm) ditandai LED kuning sebagai tanda siaga awal, dan level DANGER ($>= 80$ cm serta jarak ekstrem < 2 cm) memicu LED merah bersamaan dengan alarm nada frekuensi buzzer 1000 Hz.
+ Pemindahan pin buzzer ke GPIO 14 terbukti menjadi solusi efektif untuk membebaskan pin GPIO 21 (SDA) dan GPIO 22 (SCL), sehingga modul LCD 16×2 I2C dapat berkomunikasi dengan stabil tanpa mengalami gangguan sinyal nada frekuensi audio.
+ Implementasi penjadwalan waktu non-blocking menggunakan fungsi `millis()` memungkinkan rotasi antarmuka LCD 16×2 tiga halaman, pemrosesan sensor (500 ms), pelaporan konsol Serial (1000 ms), dan publikasi data telemetri MQTT (2000 ms ke topik `ti2024i/kelompok3/smartflood/data`) berlangsung simultan dan responsif.
+ Sistem memiliki mekanisme mitigasi kegagalan (_fail-safe_) dengan mendeteksi anomali sensor ($d > 400$ cm atau ketiadaan pulsa), memunculkan indikasi `SENSOR_ERROR` pada LCD dan menyalakan LED merah tanpa membunyikan buzzer, serta mengirimkan muatan telemetri khusus ke broker MQTT.

== Saran

Untuk pengembangan lanjutan menuju implementasi perangkat fisik di lapangan, saran yang dapat dipertimbangkan adalah:

+ Menambahkan rangkaian pembagi tegangan resistor (_voltage divider_) atau konverter logika level (_logic level shifter_) dari 5 V ke 3,3 V pada jalur pin ECHO HC-SR04 sebelum terhubung ke pin GPIO 18 ESP32 guna menjamin keselamatan mikrokontroler pada sirkuit fisik nyata.
+ Mengimplementasikan lapisan keamanan protokol MQTTS berbasis TLS/SSL (port 8883) dengan kredensial otentikasi nama pengguna dan kata sandi untuk menjamin kerahasiaan dan integritas data telemetri dari manipulasi pihak luar.
+ Mengembangkan dasbor pemantauan berbasis web responsif (misalnya menggunakan Node-RED, Grafana, atau ThingsBoard) serta bot notifikasi pesan instan (seperti Telegram Bot API) untuk penyebaran informasi peringatan dini langsung ke ponsel pintar masyarakat.
+ Melakukan kalibrasi sensor di lingkungan lapangan dan menggunakan sensor ultrasonik kedap air (seperti modul JSN-SR04T) agar tahan terhadap kelembapan tinggi, percikan air, dan cuaca ekstrem.

