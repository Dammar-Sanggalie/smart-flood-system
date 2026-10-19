= Pendahuluan

== Latar Belakang

Banjir merupakan bencana yang dampaknya dapat dikurangi apabila peringatan diterima lebih awal. Waktu antara kenaikan muka air dan datangnya dampak banjir sering kali singkat, sehingga warga hanya memiliki sedikit kesempatan untuk bersiap. Pemantauan secara manual bergantung pada petugas di lapangan dan sulit dilakukan secara terus-menerus, sehingga diperlukan perangkat otomatis yang mampu mengukur ketinggian air dan memberi peringatan.

_Internet of Things_ (IoT) menyediakan cara untuk mengumpulkan data dari sensor dan mengirimkannya melalui jaringan. Pada sistem ini, mikrokontroler ESP32 DevKit-C V4 dipadukan dengan sensor ultrasonik HC-SR04 untuk mengukur jarak ke permukaan air, keluaran lokal berupa LCD 16×2 I2C tiga halaman informasi berputar, 3 unit LED warna (hijau, kuning, merah), dan buzzer peringatan, serta protokol MQTT yang ringan dan berbasis _publish/subscribe_ untuk menerbitkan data telemetri berkala melalui jaringan Wi-Fi ke broker `test.mosquitto.org`. Seluruh sistem dirancang dan disimulasikan pada platform Wokwi.

== Rumusan Masalah

Berdasarkan latar belakang tersebut, rumusan masalah dalam praktikum ini adalah sebagai berikut.

+ Bagaimana merancang sistem yang mengukur tinggi air menggunakan sensor ultrasonik HC-SR04 dan ESP32?
+ Bagaimana menentukan tingkat bahaya (SAFE, WARNING, DANGER) berdasarkan tinggi air?
+ Bagaimana memberi peringatan lokal melalui LCD, LED, dan buzzer?
+ Bagaimana mengirim data pengukuran ke pemantau jarak jauh menggunakan MQTT?

== Tujuan

Tujuan praktikum ini adalah membuat dan mensimulasikan prototipe sistem peringatan dini banjir yang mampu mengukur tinggi air, menentukan status bahaya, menampilkan peringatan secara lokal, dan menerbitkan data ke MQTT broker pada mata kuliah Internet of Things.

== Batasan Masalah

Praktikum ini memiliki batasan sebagai berikut.

+ Pengujian dilakukan melalui simulasi dengan model wadah berukuran tetap, bukan pengukuran pada sungai yang sebenarnya.
+ Sensor diletakkan pada ketinggian 100 cm di atas dasar wadah.
+ Ambang batas status ditetapkan pada 50 cm dan 80 cm sebagai nilai simulasi.
+ Sistem belum diuji terhadap pengaruh cuaca, kalibrasi lapangan, dan keandalan jaringan jangka panjang.

== Manfaat

Praktikum ini bermanfaat sebagai sarana belajar mengenai integrasi sensor, mikrokontroler, dan protokol komunikasi IoT dalam satu sistem utuh. Hasilnya juga dapat menjadi dasar pengembangan sistem pemantauan ketinggian air yang lebih lanjut.

== Sistematika Penulisan

Laporan ini disusun dalam lima bab. Bab I berisi latar belakang, rumusan masalah, tujuan, batasan masalah, dan manfaat. Bab II memuat landasan teori mengenai IoT, ESP32, HC-SR04, MQTT, LCD I2C, serta LED dan buzzer. Bab III menguraikan perancangan dan implementasi sistem. Bab IV memaparkan hasil pengujian dan pembahasan. Bab V berisi kesimpulan dan saran.
