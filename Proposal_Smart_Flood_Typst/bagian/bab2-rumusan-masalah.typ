= Rumusan Masalah

== Rumusan Masalah Teknis

Berdasarkan latar belakang yang telah diuraikan, perumusan masalah dalam proyek pengembangan sistem ini difokuskan pada aspek-aspek rekayasa berikut:

1. Bagaimana merancang dan mengintegrasikan subsistem perangkat keras berbasis mikrokontroler ESP32 dan sensor ultrasonik HC-SR04 agar mampu mengakuisisi jarak pantulan gelombang akustik dan mengonversinya menjadi data ketinggian air secara akurat dan nir-sentuh?
2. Bagaimana menyusun algoritma kontrol _non-blocking_ (berbasis pelacak waktu `millis()`) untuk mengendalikan mesin status tingkat bahaya (_Finite State Machine_) yang mengatur display LCD 16×2 I2C dengan animasi strobo teks, rangkaian LED multi-warna (Hijau, Kuning, dan tiga LED Merah beranimasi sekuensial), serta alarm suara buzzer secara simultan tanpa mengalami _freezing_?
3. Bagaimana membangun mekanisme transmisi data telemetri nirkabel dari modul ESP32 menuju server _backend_ melalui protokol HTTP POST berbasis payload JSON yang tangguh (_robust_) terhadap latensi jaringan atau putusnya koneksi Wi-Fi?
4. Bagaimana merancang antarmuka pemantauan jarak jauh modern berbasis web dengan teknologi _Digital Twin 3D Reservoir_ dan grafik hidrograf telemetri _real-time_ yang secara presisi merefleksikan kondisi fisik muka air di lapangan?

== Batasan Masalah

Untuk menjaga fokus dan kelayakan implementasi prototipe pada skala laboratorium, batasan masalah proyek ditetapkan sebagai berikut:

1. Pengujian perangkat fisik dilakukan menggunakan model wadah penampung berskala laboratorium dengan tinggi referensi sensor sebesar $100$ cm ($1$ meter) dari dasar wadah.
2. Sensor yang digunakan adalah transduser ultrasonik standar HC-SR04 yang bekerja pada frekuensi akustik $40$ kHz dengan jangkauan deteksi efektif antara $2$ cm hingga $400$ cm.
3. Penetapan ambang batas peringatan dini disesuaikan dengan skenario wadah referensi, yakni:
   - Status *SAFE* (Aman): Ketinggian air $< 50$ cm;
   - Status *WARNING* (Siaga): Ketinggian air $50$ cm hingga $< 80$ cm; dan
   - Status *DANGER* (Bahaya): Ketinggian air $>= 80$ cm.
4. Kanal transmisi nirkabel beroperasi pada pita frekuensi Wi-Fi $2,4$ GHz (IEEE 802.11 b/g/n) dengan alamat endpoint server lokal atau jaringan _intranet_ Lab Multimedia.
