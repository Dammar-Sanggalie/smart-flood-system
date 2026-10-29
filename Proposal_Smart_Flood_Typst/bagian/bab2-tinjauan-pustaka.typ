#import "/template/components.typ": *

= Tinjauan Pustaka dan Landasan Teori

== Penelitian Terdahulu

Penelitian dan pengembangan sistem deteksi dini banjir telah mengalami evolusi signifikan dalam satu dekade terakhir, bergeser dari metode observasi manual menuju sistem pemantauan otomatis berbasis _Wireless Sensor Network_ (WSN) dan _Internet of Things_ (IoT). Untuk memetakan kebaruan ilmiah (_scientific novelty_) dan posisi penelitian ini secara akademis, sejumlah studi relevan dianalisis secara komprehensif.

Penelitian terdahulu yang dilakukan oleh para peneliti sistem tertanam berfokus pada perancangan instrumen ukur lokal. Sistem pemantauan banjir konvensional berbasis sensor pelampung kontak mekanik (_float switch_) atau batang konduktivitas sering kali mengalami kegagalan fungsi di lapangan akibat korosi elektroda, pengendapan lumpur, dan sampah air. Penggunaan sensor ultrasonik nir-sentuh diperkenalkan untuk mengatasi kelemahan fisik tersebut karena transduser tidak bersentuhan langsung dengan media air. Namun, sebagian besar prototipe awal hanya mengandalkan indikator lokal sederhana (buzzer tunggal atau LCD statis) tanpa dilengkapi transmisi telemetri nirkabel ke peladen pusat.

Seiring matangnya platform mikrokontroler berkemampuan Wi-Fi seperti ESP8266 dan ESP32, penelitian generasi kedua mulai mengintegrasikan kanal komunikasi nirkabel berbasis protokol HTTP REST atau MQTT untuk mentransmisikan nilai elevasi air menuju peladen awan atau aplikasi seluler. Meskipun data dapat dipantau dari jarak jauh, sistem-sistem tersebut memiliki keterbatasan kritis: sistem bersifat murni reaktif (*purely reactive*), di mana status bahaya baru terpicu saat ketinggian air telah melewati garis ambang batas fisik wadah. Ketiadaan modul analisis prediktif menyisakan jendela waktu evakuasi (*evacuation lead time*) yang sangat sempit bagi warga dan petugas penanggulangan bencana.

Pada dimensi kecerdasan buatan, pemodelan hidrologi menggunakan algoritma pembelajaran mesin konvensional (seperti _Support Vector Regression_ atau _Multilayer Perceptron_) mulai diuji coba untuk memproyeksikan debit air. Namun, model regresi statis kurang mampu menangkap ketergantungan sekuensial jangka panjang (*long-term temporal dependencies*) dari dinamika hidrograf aliran air yang dinamis. Di sisi lain, antarmuka pemantauan pada penelitian terdahulu umumnya terbatas pada tabel data angka mentah atau grafik dua dimensi statis yang menyulitkan operator dalam memahami kondisi spasial tanggul penampung secara intuitif.

Perbandingan komprehensif antara penelitian-penelitian terdahulu dengan sistem terpadu yang diusulkan pada proyek ini dirangkum dalam @tbl-penelitian-terdahulu.

#figure(
  tabel(
    (1.2fr, 1.3fr, 1.8fr, 2fr),
    ("Peneliti & Tahun", "Platform & Sensor", "Metode & Arsitektur", "Keterbatasan / Research Gap"),
    [Suryono et al. (2020)], [Arduino Uno & HC-SR04], [Pemantauan lokal mandiri dengan LCD statis dan buzzer], [Bersifat lokal murni tanpa telemetri nirkabel, tidak ada komputasi awan],
    [Pratama & Suroni (2022)], [NodeMCU ESP8266 & HC-SR04], [Telemetri IoT via HTTP REST ke dashboard web PHP], [Sistem murni reaktif tanpa prediksi, antarmuka tabel grafik 2D konvensional],
    [Kratzert et al. (2018)], [Server komputasi hidrologi], [Pemodelan _rainfall-runoff_ berbasis model deret waktu LSTM], [Pemodelan offline murni, tidak terhubung sirkuit fisik sensor IoT real-time],
    [Proyek Ini (2026)], [ESP32 DevKit-C V4 & HC-SR04], [Arsitektur 5-Tingkat: Tepi _Non-Blocking_, Dual-Engine AI (LSTM & GenAI Sitrep), 3D Digital Twin], [Mengatasi seluruh gap: Komputasi tepi instan, prediksi horizon 60 menit, kalkulasi ETTF, otomasi laporan BNPB, dan kembar digital 3D],
  ),
  caption: [Perbandingan penelitian terdahulu dengan sistem smart flood yang diusulkan],
  kind: table,
) <tbl-penelitian-terdahulu>

== Landasan Teori

=== Karakteristik Bencana Hidrologi dan Kebutuhan Peringatan Proaktif
Banjir limpasan (*flash flood*) dan genangan luapan drainase perkotaan memiliki karakteristik percepatan kenaikan muka air yang sangat tinggi (*high rate of rise*), terutama ketika saluran air mengalami penyumbatan sampah atau sedimentasi parah. Pada kondisi konvensional, peringatan darurat baru disampaikan setelah air melimpas melewati tanggul penampung. Padahal, keselamatan warga di zona pemukiman padat sangat bergantung pada ketersediaan jendela waktu persiapan evakuasi (*lead time*). Oleh karena itu, sistem mitigasi modern memerlukan transformasi paradigma dari sistem pemantauan pasif menjadi sistem mitigasi proaktif yang mampu memproyeksikan lintasan ketinggian air beberapa puluh menit ke depan serta menghitung waktu kritis sebelum luapan terjadi.

=== Prinsip Pengukuran Akustik Ultrasonik (Time-of-Flight)
Sensor ultrasonik HC-SR04 mengukur jarak permukaan cairan secara nir-sentuh berdasarkan waktu tempuh pantulan gelombang akustik bolak-balik (*time-of-flight*). Mikrokontroler memancarkan pulsa pemicu logika tinggi selama $10$ $mu$s melalui pin `TRIG`, yang menyebabkan transduser memancarkan semburan gelombang suara ultrasonik berfrekuensi $40$ kHz.

Gelombang suara merambat melalui medium udara, mengenai antarmuka fluida, dan dipantulkan kembali menuju transduser penerima (`ECHO`). Durasi pulsa logika tinggi pada pin `ECHO` ($t$) merepresentasikan waktu tempuh pergi-pulang gelombang suara. Dengan asumsi laju rambat suara di udara kering pada suhu kamar ($20 degree$C) adalah $v approx 343$ m/s, jarak sensor ke permukaan air dihitung melalui @eq-jarak:

$ d = frac(t, 58.0) quad ["cm"] $ <eq-jarak>

Ketinggian air aktual ($h_("air")$) di dalam tangki ukur dengan tinggi referensi $T_("ref") = 100.0$ cm diformulasikan pada @eq-tinggi:

$ h_("air") = cases(
  T_("ref") & "jika" d <= 2.0 "cm",
  0 & "jika" (T_("ref") - d) < 0,
  T_("ref") & "jika" (T_("ref") - d) > T_("ref"),
  T_("ref") - d & "lainnya."
) $ <eq-tinggi>

Untuk memitigasi derau pantulan sekunder dan riak air sesaat, diterapkan filter rata-rata bergerak (*moving average filter*) berukuran $k = 5$ sampel sebelum nilai dievaluasi oleh logika pengendali.

=== Mikrokontroler ESP32 dan Arsitektur Komputasi Tepi Non-Blocking
ESP32 DevKit-C V4 ditenagai oleh prosesor Xtensa Dual-Core 32-bit LX6 dengan kecepatan clock hingga 240 MHz dan memori SRAM 520 KB. Dalam perancangan sistem tanggap darurat, mikrokontroler tepi harus memiliki keandalan tinggi dan respon seketika tanpa terpengaruh latensi jaringan.

Penggunaan fungsi penahan eksekusi `delay()` konvensional menyebabkan mikrokontroler mengalami kondisi beku (*blocking/freeze*), di mana pembacaan sensor dan kedipan alarm terhenti selama transmisi jaringan berlangsung. Untuk mengatasi hal tersebut, diterapkan penjadwalan multi-interval mandiri berbasis fungsi pelacak waktu milidetik `millis()`. Pendekatan ini memungkinkan mikrokontroler menjalankan mesin status bahaya (*Finite State Machine* / FSM) lokal yang mengatur animasi strobo LED merah dan buzzer secara mulus bersamaan dengan pengiriman data telemetri.

=== Protokol Komunikasi Telemetri IoT (HTTP REST, SSE, dan JSON)
Transmisi data telemetri dari mikrokontroler menuju peladen *backend* memanfaatkan protokol HTTP REST POST dengan format serialisasi data JSON (*JavaScript Object Notation*). Format JSON memiliki bobot muatan ringan (*lightweight overhead*) dan mudah diparsing oleh berbagai platform perangkat lunak. Pada sisi peladen, data yang masuk dialirkan menuju antarmuka web secara waktu-nyata (*real-time*) melalui protokol *Server-Sent Events* (SSE). Protokol SSE memungkinkan transmisi data satu arah secara kontinu melalui saluran koneksi HTTP persisten tanpa memerlukan mekanisme *polling* berulang yang memboroskan sumber daya jaringan.

=== Deep Learning Deret Waktu (Long Short-Term Memory / LSTM)
Model *Long Short-Term Memory* (LSTM) merupakan varian khusus dari arsitektur *Recurrent Neural Network* (RNN) yang dirancang oleh Hochreiter dan Schmidhuber (1997) untuk mengatasi permasalahan gradien hilang (*vanishing gradient*) pada pembelajaran sekuensial jangka panjang. Sel LSTM mengatur aliran informasi melalui tiga gerbang utama (*gates*): gerbang lupa (*forget gate* $f_t$), gerbang masukan (*input gate* $i_t$), dan gerbang keluaran (*output gate* $o_t$).

Persamaan matematis aliran informasi internal sel LSTM dirumuskan sebagai berikut:

$ f_t = sigma(W_f dot [h_(t-1), x_t] + b_f) $ <eq-lstm-forget>

$ i_t = sigma(W_i dot [h_(t-1), x_t] + b_i) $ <eq-lstm-input>

$ tilde(C)_t = tanh(W_c dot [h_(t-1), x_t] + b_c) $ <eq-lstm-candidate>

$ C_t = f_t dot C_(t-1) + i_t dot tilde(C)_t $ <eq-lstm-cell>

$ o_t = sigma(W_o dot [h_(t-1), x_t] + b_o) $ <eq-lstm-output>

$ h_t = o_t dot tanh(C_t) $ <eq-lstm-hidden>

Dalam domain hidrologi, model dilatih menggunakan deret waktu historis ketinggian air sepanjang $N = 30$ sampel ($X_t = [h_(t-N+1), dots, h_t]$) untuk memproyeksikan nilai masa depan pada horizon $15$, $30$, dan $60$ menit ($\hat{h}_{t+15}, \hat{h}_{t+30}, \hat{h}_{t+60}$). Dari lintasan peramalan tersebut, laju kenaikan air dihitung melalui turunan numerik:

$ frac(d h, d t) = frac(hat(h)_(t + Delta t) - h_t, Delta t) quad ["cm/menit"] $ <eq-laju-air>

Jika laju kenaikan bernilai positif dan elevasi air mengarah melampaui batas kritis ($h_("kritis") = 80.0$ cm), estimasi waktu menuju luapan (*Estimated Time to Flood* / ETTF) dihitung melalui:

$ "ETTF" = cases(
  frac(h_("kritis") - h_t, d h / d t) & "jika" d h / d t > 0 "dan" h_t < h_("kritis"),
  0 & "jika" h_t >= h_("kritis"),
  infinity & "jika" d h / d t <= 0
) $ <eq-ettf>

Pita ketidakpastian proyeksi dilengkapi dengan batas interval kepercayaan 95% ($hat(h)_(t+k) plus.minus 1.96 dot sigma_k$).

=== Generative AI dan LLM Situational Report Advisory
Pemanfaatan model bahasa besar (*Large Language Model* / LLM) membuka peluang baru dalam sintesis informasi kebencanaan secara otonom. Dengan menyuplai parameter telemetri waktu-nyata (elevasi air, laju pertambahan $d h / d t$, ETTF, dan histori tren) ke dalam *system prompt pipeline* berstruktur formal, model LLM mampu menyusun dokumen laporan situasi (*Situational Report* / Sitrep) berstandar BNPB/BPBD dalam hitungan detik. Pendekatan ini menghilangkan hambatan birokrasi penulisan manual dan mempercepat distribusi instruksi tanggap darurat kepada relawan dan masyarakat.

=== Visualisasi Spasial Kembar Digital 3D (React Three Fiber)
Teknologi kembar digital (*Digital Twin*) menghadirkan replika virtual tiga dimensi dari reservoir fisik secara sinkron. Menggunakan pustaka grafis Three.js dan React Three Fiber, tabung wadah kaca transparan dimodelkan dengan fluida air dinamis. Permukaan air dirender dengan algoritma pergeseran riak ombak matematis berbasis superposisi fungsi gelombang harmonik:

$ z(x, y, t) = A(t) dot [sin(22 r - 3.4 t) + 0.45 cos(16 x + 2.5 t) + 0.45 sin(18 y - 2.0 t)] $ <eq-riak-3d>

Amplitudo gelombang ($A(t)$) bergejolak ketika terjadi fluktuasi air yang cepat dan mereda menuju ketenangan riak alami ($0.75$ mm) ketika elevasi stabil, memberikan persepsi visual yang sangat intuitif bagi operator pemantau.
