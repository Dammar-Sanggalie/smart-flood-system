#import "/template/components.typ": *

= Pendahuluan

== Latar Belakang

Banjir merupakan salah satu bencana hidrometeorologis tahunan yang paling sering melanda wilayah perkotaan dan kawasan Daerah Aliran Sungai (DAS) di Indonesia. Tingginya intensitas curah hujan akibat fenomena anomali iklim global, laju sedimentasi drainase perkotaan yang tinggi, serta penyusutan daerah resapan air sering kali memicu kenaikan volume genangan secara drastis dalam kurun waktu yang singkat. Dalam konteks penanggulangan bencana, keterlambatan diseminasi informasi kenaikan muka air ke tingkat kritis menjadi faktor determinan timbulnya kerugian harta benda, lumpuhnya aktivitas sosial-ekonomi, hingga ancaman langsung terhadap keselamatan jiwa warga.

Hingga saat ini, sebagian besar pemantauan elevasi muka air pada saluran drainase perkotaan, pintu air pengendali, maupun wadah retensi lokal masih mengandalkan pengamatan visual manual menggunakan mistar ukur peilskal. Metode konvensional ini memiliki sejumlah kelemahan mendasar:
1. Menuntut kehadiran fisik personel di pos pantau pada saat cuaca ekstrem yang berisiko tinggi terhadap keselamatan;
2. Bersifat diskret dan memiliki latensi pelaporan informasi yang lambat; serta
3. Rentan terhadap bias pembacaan (_human error_), khususnya pada malam hari atau kondisi jarak pandang minim saat hujan lebat.

Perkembangan teknologi _Internet of Things_ (IoT) menawarkan paradigma baru dalam sistem pemantauan lingkungan secara nir-kabel, nir-kontak, dan berkelanjutan. Pemanfaatan mikrokontroler berkemampuan tinggi seperti ESP32 yang terintegrasi modul Wi-Fi 2,4 GHz dan sensor ultrasonik HC-SR04 memungkinkan pengukuran jarak muka air secara presisi tanpa risiko kerusakan akibat sentuhan langsung dengan arus air yang deras atau korosif. Pada gardu lokal, aktuasi stroboskopik multi-warna dan alarm akustik frekuensi tinggi ($1000$ Hz) mampu memberikan peringatan seketika kepada warga di sekitar posko.

Namun demikian, telaah terhadap berbagai sistem pemantauan banjir berbasis IoT yang telah dikembangkan sebelumnya menunjukkan adanya keterbatasan fundamental:
1. *Karakteristik Sistem yang Murni Reaktif*: Peringatan dini baru terpicu saat muka air telah melewati garis ambang batas kritis. Pendekatan reaktif ini menyisakan jendela waktu evakuasi (_evacuation lead time_) yang sangat sempit bagi warga dan petugas kebencanaan.
2. *Penyajian Data Mentah Tanpa Analisis Taktis*: Mayoritas antarmuka hanya menampilkan tabel angka atau grafik statis tanpa kemampuan mengestimasi laju peningkatan muka air ($d h / d t$) dan waktu kritis meluap (_Estimated Time to Flood_ / ETTF).
3. *Ketiadaan Otomasi Diseminasi Kebencanaan*: Operator masih harus menyusun laporan situasi secara manual, memperlambat penyampaian instruksi mitigasi kepada masyarakat luas.

Menjawab kesenjangan tersebut, proyek ini mengusulkan kebaruan (_novelty_) berupa rancang bangun *_Smart Flood Early Warning System_* terpadu yang memadukan komputasi tepi IoT, kecerdasan buatan (*AI-Augmented Dashboard*), dan visualisasi *3D Digital Twin*. Pada antarmuka web modern berbasis Next.js, sistem mengintegrasikan dua mesin kecerdasan buatan:
1. *Deep Learning Time-Series Forecasting (LSTM)*: Memproyeksikan dinamika fluktuasi air $15$ hingga $60$ menit ke depan berdasarkan deret data historis, dilengkapi kurva pita ketidakpastian (_confidence interval 95%_) dan estimasi waktu sebelum air meluap secara preventif; serta
2. *Generative AI Situational Report (Sitrep) Advisor*: Agen bahasa cerdas berbasis _Large Language Model_ (LLM) yang secara otomatis menyusun narasi laporan situasi kebencanaan berstandar BNPB/BPBD dalam Bahasa Indonesia dan memberikan rekomendasi aksi taktis yang dapat langsung disebarkan kepada warga melalui satu klik.

Integrasi menyeluruh antara keandalan sirkuit fisik ESP32, kembar digital 3D reservoir, dan kecerdasan analitik prediktif-preskriptif ini diharapkan dapat menjadi terobosan baru dalam sistem mitigasi bencana hidrologi yang cerdas, proaktif, dan berpusat pada keselamatan masyarakat.

== Rumusan Masalah

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

== Tujuan Proyek

=== Tujuan Umum
Tujuan umum dari proyek ini adalah merekayasa, mengimplementasikan, dan mendemonstrasikan prototipe fungsional _Smart Flood Early Warning System_ terpadu yang memadukan teknologi _Internet of Things_ (IoT), pemodelan prediktif berbasis _Deep Learning_ deret waktu (_Time-Series LSTM_), asisten diseminasi berbasis kecerdasan buatan generatif (_GenAI Sitrep Advisor_), serta antarmuka pemantauan spasial _Digital Twin 3D Reservoir_. Sistem ini dirancang untuk mendeteksi muka air secara nir-sentuh, mengeksekusi peringatan dini multi-indera secara instan di lapangan, serta menyediakan sarana mitigasi prediktif-preskriptif yang proaktif melalui aplikasi web modern.

=== Tujuan Khusus
Secara terperinci, tujuan spesifik yang ingin dicapai melalui proyek ini mencakup:
1. *Rancang Bangun Perangkat Keras Fisik*: Merakit sirkuit fisik terintegrasi yang menghubungkan ESP32 DevKit-C V4 dengan transduser ultrasonik HC-SR04, penampil visual LCD 16×2 via konverter I2C PCF8574, rangkaian aktuator visual (LED Hijau, Kuning, dan 3 LED Merah), serta transduser akustik buzzer piezoelektrik secara aman, rapi, dan modular.
2. *Pengembangan Firmware Non-Blocking*: Mengembangkan kode program tertanam (_embedded firmware_) berbasis C++/Arduino dengan penjadwalan multi-interval waktu mandiri (`millis()`), mencakup pembacaan sensor berkala ($500$ ms), penyegaran animasi strobo teks LCD ($150$ ms), siklus lari animasi LED merah ($100$ ms), dan pengiriman data telemetri nirkabel ($2000$ ms) tanpa hambatan pemblokiran eksekusi program (_zero delay blocking_).
3. *Implementasi Kanal Telemetri Nirkabel*: Mengintegrasikan protokol komunikasi Wi-Fi Station (STA) pada ESP32 untuk mempublikasikan objek telemetri berformat JSON ke server _backend_ melalui pemanggilan HTTP REST POST (`/api/readings`) secara konsisten.
4. *Pengembangan Model AI Time-Series Forecasting (LSTM)*: Merancang dan melatih arsitektur jaringan saraf tiruan _Long Short-Term Memory_ (LSTM) pada sisi server untuk memproyeksikan elevasi muka air $15$–$60$ menit ke depan, menghitung laju kenaikan air ($d h / d t$), serta mengestimasi waktu sebelum wadah meluap (_Estimated Time to Flood_ / ETTF).
5. *Perancangan Asisten Cerdas GenAI Sitrep*: Mengintegrasikan modul _Large Language Model_ (LLM) pada dashboard web yang secara otomatis menyintesis riwayat data telemetri menjadi laporan situasi darurat naratif berstandar BNPB/BPBD dalam Bahasa Indonesia dan dapat dibagikan ke kanal publik hanya dengan satu klik.
6. *Penyediaan Antarmuka Monitoring Digital Twin 3D*: Mengembangkan dashboard berbasis web modern menggunakan Next.js 14 dan React Three Fiber yang memvisualisasikan model tabung reservoir kaca 3D dengan fluida air berombak realistis serta menyajikan grafik hidrograf telemetri dan kurva proyeksi masa depan secara _real-time_.

== Manfaat Proyek

Hasil perancangan dan implementasi proyek ini diharapkan memberikan manfaat nyata pada berbagai dimensi:
1. *Manfaat Akademis*: Memberikan kontribusi berupa kerangka kerja integrasi komputasi tepi IoT dengan kecerdasan buatan prediktif (LSTM) dan preskriptif (GenAI) dalam satu kesatuan sistem mitigasi bencana hidrologi yang dapat dijadikan referensi riset lanjutan.
2. *Manfaat Praktis bagi Pengambil Kebijakan*: Menjadi sistem pendukung keputusan (*decision support system*) bagi instansi mitigasi bencana (BPBD, posko pengendali banjir, pengelola pintu air) dalam menetapkan status siaga darurat secara lebih dini dan terukur berbasis estimasi waktu luapan konkret.
3. *Manfaat Sosial bagi Masyarakat*: Memperluas jendela waktu evakuasi (*evacuation lead time*) bagi warga di sekitar zona rawan banjir serta mempercepat penerimaan instruksi keselamatan melalui pesan darurat naratif otomatis yang mudah dipahami.

== Luaran yang Diharapkan

Luaran utama yang ditargetkan dari pelaksanaan proyek ini meliputi:
1. *Unit Prototipe Fisik Fungsional*: Rangkaian perangkat keras berbasis ESP32 dan sensor HC-SR04 yang terpasang di atas wadah uji referensi $100$ cm dengan sistem peringatan dini multi-indera (LCD strobo, 5 LED, dan buzzer alarm).
2. *Aplikasi Web Dashboard Terpadu*: Antarmuka monitoring interaktif berbasis Next.js 14 yang menyajikan visualisasi kembar digital 3D reservoir, grafik hidrograf telemetri live, kurva proyeksi LSTM dengan interval kepercayaan 95%, dan panel konsol GenAI Sitrep Advisor.
3. *Model AI dan Pipeline Prompt Terintegrasi*: Bobot model deep learning LSTM teroptimasi untuk peramalan time-series air dan berkas konfigurasi *system prompt* LLM berbahasa Indonesia.
4. *Dokumentasi Teknis dan Kode Sumber Lengkap*: Berkas kode program firmware C++, server ingestion Go, modul analitik AI Python, dan laporan teknis proposal serta laporan akhir proyek.
