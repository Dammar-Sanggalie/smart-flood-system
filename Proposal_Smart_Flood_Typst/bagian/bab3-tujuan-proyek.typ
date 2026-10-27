#import "/template/components.typ": *

= Tujuan Proyek

== Tujuan Umum

Tujuan umum dari proyek ini adalah merekayasa, mengimplementasikan, dan mendemonstrasikan prototipe fungsional _Smart Flood Early Warning System_ terpadu yang memadukan teknologi _Internet of Things_ (IoT), pemodelan prediktif berbasis _Deep Learning_ deret waktu (_Time-Series LSTM_), asisten diseminasi berbasis kecerdasan buatan generatif (_GenAI Sitrep Advisor_), serta antarmuka pemantauan spasial _Digital Twin 3D Reservoir_. Sistem ini dirancang untuk mendeteksi muka air secara nir-sentuh, mengeksekusi peringatan dini multi-indera secara instan di lapangan, serta menyediakan sarana mitigasi prediktif-preskriptif yang proaktif melalui aplikasi web modern.

== Tujuan Khusus

Secara terperinci, tujuan spesifik yang ingin dicapai melalui proyek ini mencakup:

1. *Rancang Bangun Perangkat Keras Fisik*: Merakit sirkuit fisik terintegrasi yang menghubungkan ESP32 DevKit-C V4 dengan transduser ultrasonik HC-SR04, penampil visual LCD 16×2 via konverter I2C PCF8574, rangkaian aktuator visual (LED Hijau, Kuning, dan 3 LED Merah), serta transduser akustik buzzer piezoelektrik secara aman, rapi, dan modular.
2. *Pengembangan Firmware Non-Blocking*: Mengembangkan kode program tertanam (_embedded firmware_) berbasis C++/Arduino dengan penjadwalan multi-interval waktu mandiri (`millis()`), mencakup pembacaan sensor berkala ($500$ ms), penyegaran animasi strobo teks LCD ($150$ ms), siklus lari animasi LED merah ($100$ ms), dan pengiriman data telemetri nirkabel ($2000$ ms) tanpa hambatan pemblokiran eksekusi program (_zero delay blocking_).
3. *Implementasi Kanal Telemetri Nirkabel*: Mengintegrasikan protokol komunikasi Wi-Fi Station (STA) pada ESP32 untuk mempublikasikan objek telemetri berformat JSON ke server _backend_ melalui pemanggilan HTTP REST POST (`/api/readings`) secara konsisten.
4. *Pengembangan Model AI Time-Series Forecasting (LSTM)*: Merancang dan melatih arsitektur jaringan saraf tiruan _Long Short-Term Memory_ (LSTM) pada sisi server untuk memproyeksikan elevasi muka air $15$–$60$ menit ke depan, menghitung laju kenaikan air ($d h / d t$), serta mengestimasi waktu sebelum wadah meluap (_Estimated Time to Flood_ / ETTF).
5. *Perancangan Asisten Cerdas GenAI Sitrep*: Mengintegrasikan modul _Large Language Model_ (LLM) pada dashboard web yang secara otomatis menyintesis riwayat data telemetri menjadi laporan situasi darurat naratif berstandar BNPB/BPBD dalam Bahasa Indonesia dan dapat dibagikan ke kanal publik hanya dengan satu klik.
6. *Penyediaan Antarmuka Monitoring Digital Twin 3D*: Mengembangkan dashboard berbasis web modern menggunakan Next.js 14 dan React Three Fiber yang memvisualisasikan model tabung reservoir kaca 3D dengan fluida air berombak realistis serta menyajikan grafik hidrograf telemetri dan kurva proyeksi masa depan secara _real-time_.

== Indikator Keberhasilan Proyek

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
