= Rumusan Masalah

== Rumusan Masalah Teknis

Berdasarkan latar belakang yang telah diuraikan, perumusan masalah dalam proyek rekayasa sistem ini difokuskan pada aspek-aspek kunci berikut:

1. Bagaimana merancang dan mengintegrasikan subsistem perangkat keras berbasis mikrokontroler ESP32 dan sensor ultrasonik HC-SR04 agar mampu mengakuisisi jarak pantulan gelombang akustik dan mengonversinya menjadi data ketinggian air secara akurat dan nir-sentuh?
2. Bagaimana menyusun algoritma kontrol _non-blocking_ berbasis pelacak waktu `millis()` untuk mengendalikan mesin status tingkat bahaya (_Finite State Machine_) yang mengatur display LCD 16×2 I2C dengan animasi strobo teks, rangkaian 5 unit LED multi-warna, serta alarm suara buzzer secara simultan tanpa mengalami _freezing_?
3. Bagaimana membangun mekanisme transmisi data telemetri nirkabel dari modul ESP32 menuju server _backend_ melalui protokol HTTP POST berbasis payload JSON yang tangguh (_robust_) dengan latensi transmisi rendah?
4. Bagaimana memodelkan dan menerapkan algoritma _Deep Learning_ berbasis deret waktu (_time-series forecasting_) seperti _Long Short-Term Memory_ (LSTM) pada sisi server untuk memprediksi kenaikan elevasi muka air $15$ hingga $60$ menit ke depan serta menghitung estimasi waktu sebelum meluap (_Estimated Time to Flood_ / ETTF)?
5. Bagaimana merancang agen kecerdasan buatan generatif (_GenAI Situational Report Advisor_) pada antarmuka web untuk mengonversi data telemetri teknis menjadi laporan situasi kebencanaan naratif otomatis yang siap didiseminasikan ke masyarakat?
6. Bagaimana mengintegrasikan model kembar digital 3D (_Digital Twin 3D Reservoir_) dengan dinamika riak fluida volumetrik pada dashboard Next.js sebagai media visualisasi status bahaya yang intuitif dan interaktif?

== Batasan Masalah

Untuk menjaga fokus dan ketercapaian implementasi prototipe pada skala laboratorium, batasan masalah proyek ditetapkan sebagai berikut:

1. Pengujian perangkat fisik dilakukan menggunakan model wadah penampung berskala laboratorium dengan tinggi referensi sensor sebesar $100$ cm ($1$ meter) dari dasar wadah.
2. Sensor yang digunakan adalah transduser ultrasonik standar HC-SR04 yang bekerja pada frekuensi akustik $40$ kHz dengan rentang pengukuran efektif antara $2$ cm hingga $400$ cm.
3. Penetapan ambang batas peringatan dini disesuaikan dengan skenario wadah referensi laboratorium:
   - Status *SAFE* (Aman): Ketinggian air $< 50$ cm;
   - Status *WARNING* (Siaga): Ketinggian air $50$ cm hingga $< 80$ cm; dan
   - Status *DANGER* (Bahaya): Ketinggian air $>= 80$ cm.
4. Model peramalan deret waktu menggunakan arsitektur _Long Short-Term Memory_ (LSTM) yang dilatih menggunakan data fluktuasi elevasi air dengan horizon prediksi maksimal $60$ menit ke depan.
5. Modul _GenAI Situational Report Advisor_ diimplementasikan menggunakan pemanggilan API model bahasa besar (_Large Language Model_) melalui teknik _system prompt engineering_ terstruktur yang disuplai konteks telemetri terkini.
6. Kanal transmisi nirkabel beroperasi pada pita frekuensi Wi-Fi $2,4$ GHz (IEEE 802.11 b/g/n) dengan endpoint server _backend_ lokal atau jaringan _intranet_ Lab Multimedia.
