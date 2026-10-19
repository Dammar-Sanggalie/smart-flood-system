= Penutup

== Kesimpulan

Proposal proyek ini memaparkan perancangan dan implementasi _Smart Flood Detection and Early Warning System_ terpadu berbasis mikrokontroler ESP32, sensor ultrasonik HC-SR04, dan antarmuka pemantauan modern _Digital Twin 3D_. Prototipe fisik sistem telah berhasil dirakit, diprogram, dan diverifikasi keandalannya di laboratorium.

Beberapa poin keunggulan utama dari sistem yang diusulkan antara lain:
1. *Deteksi Nir-Sentuh Akurat*: Sensor HC-SR04 mampu mengukur ketinggian air wadah referensi setinggi $100$ cm secara konsisten tanpa risiko korosi akibat kontak langsung dengan air.
2. *Eksekusi Non-Blocking Tanpa Delay*: Penggunaan penjadwalan waktu mandiri `millis()` memungkinkan animasi strobo alfanumerik LCD 16×2 dan pergerakan sekuensial tiga LED merah tetap berjalan mulus pada frekuensi tinggi ($10$–$15$ Hz) bersamaan dengan transmisi paket data jaringan HTTP POST berukuran $256$ byte ke server.
3. *Peringatan Dini Multi-Indera*: Kombinasi alarm suara frekuensi tinggi $1000$ Hz dan visualisasi stroboskopik memberikan notifikasi darurat yang sangat tegas bagi warga sekitar lokasi pemantauan.
4. *Kembar Digital 3D Interaktif*: Integrasi telemetri menuju aplikasi web Next.js menghadirkan representasi visual 3D yang dinamis, informatif, dan intuitif melalui pemodelan riak ombak fluida yang realistis.

== Harapan dan Rencana Keberlanjutan Proyek

Keberhasilan implementasi prototipe fisik ini menjadi pijakan kuat untuk demonstrasi pada Ujian Tengah Semester (UTS) mata kuliah Internet of Things. Untuk pengembangan lanjutan pasca-UTS, tim merencanakan sejumlah peningkatan fitur:
1. *Integrasi Kanal Notifikasi Langsung*: Menghubungkan server _backend_ dengan bot Telegram atau gateway WhatsApp Business API guna memicu pengiriman pesan peringatan otomatis kepada warga di zona terdampak saat status DANGER terpicu.
2. *Sistem Catu Daya Mandiri*: Menambahkan modul panel surya mini (_photovoltaic_) dan sirkuit pengisi daya baterai Li-ion 18650 dengan manajemen daya hemat energi (_deep sleep mode_) agar perangkat dapat beroperasi secara otonom di pos pantau terpencil tanpa tergantung pada suplai listrik jala-jala PLN.
3. *Dukungan Multi-Sensor*: Mengintegrasikan sensor curah hujan (_rain gauge_) dan sensor kekeruhan air (_turbidity sensor_) untuk memberikan data prediksi potensi luapan sungai secara lebih komprehensif.

Demikian proposal proyek ini disusun dengan penuh tanggung jawab. Besar harapan kami agar sistem yang dirancang ini dapat dievaluasi secara konstruktif pada sesi demo langsung di laboratorium serta memberikan kontribusi nyata dalam pengembangan teknologi mitigasi bencana berbasis IoT di Indonesia.
