#import "/template/components.typ": *

= Pendahuluan

== Latar Belakang

Banjir merupakan bencana hidrometeorologis tahunan yang kerap melanda wilayah perkotaan dan Daerah Aliran Sungai (DAS) di Indonesia. Tingginya intensitas curah hujan ekstrem, sedimentasi drainase, serta berkurangnya resapan air memicu kenaikan genangan air secara drastis dalam waktu singkat. Keterlambatan diseminasi informasi elevasi air kritis menjadi faktor utama kerugian harta benda dan keselamatan jiwa. Hingga kini, pemantauan pintu air dan saluran drainase mayoritas masih mengandalkan pengamatan visual manual mistar peilskal yang bersifat diskret, berlatensi lambat, rentan bias pembacaan (_human error_), serta membahayakan personel saat cuaca ekstrem.

Pemanfaatan _Internet of Things_ (IoT) dengan mikrokontroler ESP32 dan sensor ultrasonik HC-SR04 memungkinkan pengukuran jarak air secara nir-sentuh, kontinu, dan akurat tanpa risiko korosi. Namun demikian, telaah terhadap sistem pemantauan banjir berbasis IoT terdahulu menunjukkan tiga kesenjangan mendasar:
1. *Murni Reaktif*: Alarm peringatan dini baru terpicu saat air telah melewati batas kritis fisik, menyisakan jendela waktu evakuasi (_evacuation lead time_) yang sangat sempit.
2. *Penyajian Data Mentah Tanpa Analisis Taktis*: Mayoritas antarmuka hanya menampilkan tabel angka atau grafik statis tanpa estimasi laju kenaikan air ($d h / d t$) dan waktu luap (_Estimated Time to Flood_ / ETTF).
3. *Ketiadaan Otomasi Diseminasi*: Operator masih menyusun laporan situasi secara manual sehingga memperlambat diseminasi informasi ke masyarakat.

Menjawab kesenjangan tersebut, proyek ini mengusulkan kebaruan (_novelty_) berupa rancang bangun *_Smart Flood Early Warning System_* terpadu yang memadukan komputasi tepi IoT, kecerdasan buatan (*AI-Augmented Dashboard*), dan visualisasi *3D Digital Twin*. Pada aplikasi web Next.js 14, sistem mengintegrasikan: (1) model _Deep Learning_ LSTM untuk memproyeksikan fluktuasi air $15$–$60$ menit ke depan dengan interval kepercayaan 95% dan estimasi waktu sebelum wadah meluap (ETTF); serta (2) agen _GenAI Sitrep Advisor_ yang secara otomatis menyintesis telemetri mentah menjadi narasi laporan kebencanaan resmi berstandar BNPB/BPBD yang siap disebarkan ke publik melalui satu klik.

== Rumusan Masalah

Rumusan masalah dalam proyek rekayasa sistem ini adalah:
1. Bagaimana merancang subsistem perangkat keras ESP32 dan sensor ultrasonik HC-SR04 untuk akuisisi elevasi air nir-sentuh secara presisi pada wadah referensi uji?
2. Bagaimana menyusun algoritma kontrol _non-blocking_ berbasis `millis()` untuk menggerakkan mesin status bahaya (_Finite State Machine_) yang mengatur display LCD 16×2 I2C strobo teks, 5 LED multi-warna, dan buzzer secara simultan tanpa _freezing_?
3. Bagaimana membangun transmisi telemetri nirkabel dari ESP32 menuju server _backend_ melalui protokol HTTP REST POST berformat JSON dengan latensi rendah?
4. Bagaimana memodelkan algoritma _Deep Learning_ LSTM untuk memproyeksikan kenaikan air $15$–$60$ menit ke depan serta menghitung laju kenaikan ($d h / d t$) dan estimasi waktu luapan (ETTF)?
5. Bagaimana merancang agen _GenAI Sitrep Advisor_ untuk otomasi laporan situasi darurat BNPB dan memvisualisasikan model kembar digital 3D reservoir pada dashboard web Next.js?

== Batasan Masalah

Batasan masalah proyek pada skala laboratorium ditetapkan sebagai berikut:
1. Wadah penampung uji berskala laboratorium menggunakan tinggi referensi sensor $100$ cm dari dasar wadah dengan sensor HC-SR04 (rentang efektif $2$–$400$ cm).
2. Ambang batas peringatan dini: status *SAFE* ($h < 50$ cm), *WARNING* ($50 <= h < 80$ cm), dan *DANGER* ($h >= 80$ cm).
3. Model peramalan deret waktu menggunakan arsitektur LSTM dengan horizon prediksi maksimal $60$ menit ke depan.
4. Modul _GenAI Sitrep Advisor_ diimplementasikan melalui pemanggilan API LLM dengan teknik _system prompt engineering_ terstruktur berbahasa Indonesia.
5. Kanal transmisi nirkabel beroperasi pada pita Wi-Fi $2,4$ GHz IEEE 802.11 b/g/n menuju server _backend_ lokal.

== Tujuan Proyek

Tujuan umum proyek ini adalah merekayasa dan mengimplementasikan prototipe fungsional _Smart Flood Early Warning System_ terpadu berbasis komputasi tepi IoT ESP32, model prediktif LSTM, asisten _GenAI Sitrep Advisor_, dan visualisasi _3D Digital Twin Reservoir_. Secara khusus, sasaran teknis yang dicapai mencakup:
1. Merakit sirkuit fisik terintegrasi ESP32 DevKit-C V4, sensor ultrasonik HC-SR04, LCD 16×2 I2C, 5 unit LED indikator, dan buzzer alarm $1000$ Hz secara modular.
2. Mengembangkan _firmware_ C++ _non-blocking_ berbasis `millis()` untuk eksekusi FSM lokal, animasi strobo LED/LCD, dan pengiriman telemetri JSON tanpa hambatan `delay()`.
3. Membangun jalur telemetri Wi-Fi HTTP POST menuju server _backend_ Go dan penyaluran data real-time via _Server-Sent Events_ (SSE).
4. Melatih model _Deep Learning_ LSTM untuk memproyeksikan tren air $15$–$60$ menit ke depan, menghitung laju kenaikan air ($d h / d t$), dan mengkalkulasi waktu luapan (ETTF).
5. Merancang modul _GenAI Sitrep Advisor_ untuk otomasi laporan bencana BNPB serta antarmuka web Next.js 14 yang memvisualisasikan model tabung reservoir 3D dengan riak ombak fluida interaktif.

== Manfaat Proyek dan Luaran yang Diharapkan

Manfaat yang diharapkan mencakup: (1) *Akademis*, menjadi referensi ilmiah integrasi komputasi tepi IoT dengan model AI prediktif (LSTM) dan preskriptif (GenAI); (2) *Praktis*, menjadi sistem pendukung keputusan bagi pengelola pintu air dan BPBD untuk tindakan preventif; serta (3) *Sosial*, memperluas jendela evakuasi warga dan memangkas birokrasi komunikasi bencana. 

Adapun luaran utama proyek ini mencakup: unit prototipe fisik fungsional wadah referensi 100 cm, web dashboard terpadu Next.js 14 berfitur 3D Digital Twin dan konsol AI Sitrep, bobot model LSTM teroptimasi dan pipeline prompt LLM, serta berkas kode sumber dan dokumentasi proposal proyek.
