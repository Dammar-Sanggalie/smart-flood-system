#import "/template/components.typ": *

= Tujuan Proyek

== Tujuan Umum

Tujuan umum dari proyek ini adalah merekayasa, mengimplementasikan, dan mendemonstrasikan prototipe fungsional _Smart Flood Detection and Early Warning System_ terpadu berbasis teknologi IoT. Sistem ini dirancang untuk mendeteksi dinamika muka air secara nir-sentuh, mengeksekusi peringatan dini multi-indera secara instan pada sisi perangkat keras lokal, serta menyediakan kanal pemantauan jarak jauh melalui visualisasi _Digital Twin 3D Reservoir_ dan grafik hidrograf telemetri secara terintegrasi.

== Tujuan Khusus

Secara rinci, tujuan spesifik yang ingin dicapai melalui proyek ini mencakup:

1. *Rancang Bangun Perangkat Keras*: Merakit sirkuit fisik terintegrasi yang menghubungkan ESP32 DevKit-C V4 dengan transduser ultrasonik HC-SR04, penampil visual LCD 16×2 via konverter I2C PCF8574, rangkaian aktuator visual (LED Hijau, Kuning, dan 3 LED Merah), serta transduser akustik buzzer piezoelektrik secara aman dan modular.
2. *Pengembangan Firmware Non-Blocking*: Mengembangkan kode program tertanam (_embedded firmware_) berbasis bahasa C++/Arduino dengan penjadwalan multi-interval waktu mandiri (`millis()`), mencakup pembacaan sensor berkala ($500$ ms), penyegaran animasi strobo teks LCD ($150$ ms), siklus lari animasi LED merah ($100$ ms), dan pengiriman data telemetri nirkabel ($2000$ ms) tanpa hambatan pemblokiran eksekusi program (_zero delay blocking_).
3. *Implementasi Kanal Telemetri Nirkabel*: Mengintegrasikan protokol komunikasi Wi-Fi Station (STA) pada ESP32 untuk mempublikasikan objek telemetri berformat JSON ke server _backend_ melalui pemanggilan HTTP POST REST API (`/api/readings`) secara konsisten.
4. *Penyediaan Antarmuka Monitoring Digital Twin 3D*: Mengembangkan dashboard berbasis web modern menggunakan Next.js dan React Three Fiber yang memvisualisasikan model tabung reservoir kaca 3D dengan massa air biru berombak realistis serta menyajikan analitik hidrograf fluktuasi air secara _real-time_.

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
    [Sinkronisasi 3D Twin], [Model ketinggian air pada antarmuka 3D bergerak naik-turun sesuai data telemetri aktual dalam jeda $< 2$ detik], [Pengujian fungsional web dashboard],
  ),
  caption: [Matriks indikator keberhasilan prototipe sistem pemantau banjir],
  kind: table,
) <tbl-indikator>
