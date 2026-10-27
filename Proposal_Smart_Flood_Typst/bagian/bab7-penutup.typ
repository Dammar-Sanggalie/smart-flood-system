= Penutup

== Kesimpulan

Proposal proyek ini memaparkan perancangan, implementasi, dan kebaruan saintifik-teknologis dari _Smart Flood Detection and Early Warning System_ terpadu. Sistem ini berhasil mentransformasikan paradigma pemantauan banjir konvensional yang bersifat manual dan murni reaktif menjadi ekosistem mitigasi bencana cerdas yang prediktif, preskriptif, dan terintegrasi secara _end-to-end_. Prototipe fisik perangkat keras telah selesai dirakit dan diverifikasi keandalannya di laboratorium guna memenuhi kriteria demonstrasi langsung.

Keunggulan dan kebaruan utama dari sistem yang diusulkan meliputi:
1. *Ketangguhan Komputasi Tepi (Edge Resilience)*: Mikrokontroler ESP32 menjalankan mesin status bahaya empat kondisi (_Four-State FSM_) dengan arsitektur _non-blocking_ `millis()`, menjamin alarm akustik $1000$ Hz dan animasi strobo tiga LED merah bekerja seketika tanpa latensi meski koneksi internet terputus.
2. *Pengukuran Nir-Sentuh Akurat*: Pemanfaatan sensor ultrasonik HC-SR04 dengan filter rata-rata bergerak ($k=5$) mengeliminasi derau riak sesaat dan menghasilkan galat pembacaan jarak kurang dari $1,0$ cm pada tabung referensi $100$ cm.
3. *Analitika Prediktif Deep Learning (Time-Series LSTM)*: Model peramalan deret waktu di sisi server memproyeksikan lintasan muka air $15$–$60$ menit ke depan, menghitung laju pertambahan air ($d h / d t$), serta mengestimasi waktu sebelum tanggul meluap (_Estimated Time to Flood_ / ETTF) dengan pita interval kepercayaan 95%.
4. *Otomasi Diseminasi Kebencanaan GenAI*: Modul _GenAI Sitrep Advisor_ mengonversi data telemetri mentah menjadi laporan situasi kebencanaan berstandar BNPB/BPBD secara instan ($< 3$ detik), memangkas rantai birokrasi komunikasi darurat kepada relawan dan masyarakat.
5. *Kembar Digital 3D Interaktif*: Antarmuka web Next.js 14 menyajikan visualisasi reservoir volumetrik kaca 3D dengan dinamika riak ombak realistis, memberikan pemahaman situasi yang intuitif bagi operator posko kendali.

== Harapan dan Rencana Keberlanjutan Proyek

Keberhasilan implementasi prototipe fisik ini menjadi pijakan kuat untuk demonstrasi pada Ujian Tengah Semester (UTS) mata kuliah Internet of Things. Sebagai rencana pengembangan keberlanjutan pasca-UTS, tim merancang beberapa inovasi lanjutan:
1. *Penerapan Kecerdasan Buatan di Perangkat Tepi (Edge AI / TinyML)*: Mengonversi model peramalan LSTM menjadi model kuantisasi terkompresi (_int8_) menggunakan kerangka kerja TensorFlow Lite for Microcontrollers atau ESP-DL agar inferensi prediktif dapat berjalan langsung pada mikrokontroler (ESP32-S3) secara otonom tanpa memerlukan koneksi server awan.
2. *Integrasi Jaringan Nirkabel Jarak Jauh LoRaWAN*: Menambahkan modul transceiver SX1276/SX1262 untuk transmisi data jarak jauh (hingga $5$–$10$ km) pada wilayah Daerah Aliran Sungai (DAS) hulu terpencil yang tidak terjangkau sinyal seluler atau Wi-Fi komersial.
3. *Sistem Catu Daya Mandiri Berkelanjutan*: Mengintegrasikan panel surya fotovoltaik monokristalin dengan baterai _Lithium Iron Phosphate_ (LiFePO4) serta manajemen daya tidur lelap (_deep sleep mode_) untuk operasional nir-henti di alam terbuka.

Demikian proposal proyek ini disusun dengan penuh tanggung jawab. Besar harapan kami agar rancang bangun sistem yang memadukan keandalan perangkat keras fisik dan kecerdasan analitik buatan ini dapat dinilai secara konstruktif serta memberikan kontribusi nyata dalam pengembangan teknologi mitigasi bencana hidrologis di Indonesia.
