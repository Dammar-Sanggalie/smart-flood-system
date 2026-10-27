= Latar Belakang

Banjir merupakan salah satu bencana hidrometeorologis tahunan yang paling sering melanda wilayah perkotaan dan kawasan Daerah Aliran Sungai (DAS) di Indonesia. Tingginya intensitas curah hujan akibat fenomena anomali iklim global, laju sedimentasi drainase, serta penyusutan daerah resapan air sering kali memicu kenaikan volume genangan secara drastis dalam kurun waktu yang singkat. Dalam konteks penanggulangan bencana, keterlambatan diseminasi informasi kenaikan muka air ke tingkat kritis menjadi faktor determinan timbulnya kerugian harta benda, lumpuhnya aktivitas sosial-ekonomi, hingga ancaman langsung terhadap keselamatan jiwa warga.

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
