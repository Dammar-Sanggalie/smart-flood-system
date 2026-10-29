#import "/template/components.typ": *

= Tinjauan Pustaka dan Landasan Teori

== Penelitian Terdahulu

Penelitian sistem pemantauan banjir telah berkembang dari metode observasi manual menuju sistem pemantauan otomatis berbasis _Internet of Things_ (IoT). Pada fase awal, instrumen lokal menggunakan sensor pelampung mekanik (_float switch_) atau sensor konduktivitas sering mengalami kegagalan akibat korosi dan sedimentasi lumpur. Penggunaan sensor ultrasonik nir-sentuh HC-SR04 diperkenalkan untuk mengatasi kendala fisik tersebut. Namun, prototipe generasi pertama umumnya bersifat lokal murni tanpa transmisi nirkabel jarak jauh.

Generasi berikutnya mengintegrasikan mikrokontroler berkemampuan Wi-Fi (ESP8266/ESP32) untuk menyalurkan data telemetri ke server awan via protokol HTTP atau MQTT. Meskipun data dapat diakses dari jarak jauh, sistem-sistem tersebut memiliki kelemahan kritis: bersifat murni reaktif (*purely reactive*), di mana alarm baru berbunyi saat air telah melewati garis bahaya fisik. Ketiadaan modul peramalan deret waktu dan otomasi diseminasi kebencanaan menyisakan jendela evakuasi yang sangat sempit bagi masyarakat. Perbandingan antara penelitian terdahulu dengan sistem yang diusulkan dirangkum pada @tbl-penelitian-terdahulu.

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
Banjir limpasan (*flash flood*) pada saluran drainase perkotaan memiliki percepatan peningkatan elevasi air yang sangat tinggi (*high rate of rise*). Pada pendekatan konvensional, alarm baru berbunyi saat air telah melimpas dari tanggul. Keselamatan warga menuntut adanya jendela waktu persiapan evakuasi (*lead time*) yang memadai, sehingga diperlukan sistem mitigasi proaktif yang mampu memproyeksikan lintasan elevasi air serta mengkalkulasi waktu kritis sebelum luapan terjadi.

=== Prinsip Pengukuran Akustik Ultrasonik (Time-of-Flight)
Sensor ultrasonik HC-SR04 mengukur jarak permukaan air secara nir-sentuh berdasarkan waktu tempuh pantulan gelombang akustik (*time-of-flight*). Pulsa pemicu logika tinggi selama $10$ $mu$s pada pin `TRIG` memancarkan semburan gelombang akustik $40$ kHz. Pantulan gema ditangkap pin `ECHO` dengan durasi logika tinggi ($t$). Jarak pantulan sensor ke permukaan air dihitung melalui @eq-jarak:

$ d = frac(t, 58.0) quad ["cm"] $ <eq-jarak>

Ketinggian air aktual ($h_("air")$) di dalam tangki ukur dengan tinggi referensi $T_("ref") = 100.0$ cm diformulasikan pada @eq-tinggi:

$ h_("air") = cases(
  T_("ref") & "jika" d <= 2.0 "cm",
  0 & "jika" (T_("ref") - d) < 0,
  T_("ref") & "jika" (T_("ref") - d) > T_("ref"),
  T_("ref") - d & "lainnya."
) $ <eq-tinggi>

Untuk mengeliminasi derau riak air sesaat, diterapkan filter rata-rata bergerak (*moving average filter*) berukuran $k = 5$ sampel sebelum nilai dievaluasi oleh mesin status.

=== Mikrokontroler ESP32 dan Arsitektur Komputasi Tepi Non-Blocking
ESP32 DevKit-C V4 ditenagai prosesor Xtensa Dual-Core 32-bit LX6 240 MHz dan memori SRAM 520 KB. Penggunaan fungsi penahan `delay()` konvensional menyebabkan mikrokontroler mengalami kondisi beku (*blocking*), sehingga pembacaan sensor dan kedipan alarm terhenti selama transmisi jaringan. Untuk menjamin keandalan lokal, diterapkan penjadwalan waktu mandiri berbasis fungsi `millis()`. Pendekatan ini memungkinkan mikrokontroler mengeksekusi mesin status bahaya (*Finite State Machine* / FSM) lokal yang mengatur animasi strobo LED merah dan buzzer secara mulus bersamaan dengan pengiriman data telemetri.

=== Protokol Komunikasi Telemetri IoT (HTTP REST, SSE, dan JSON)
Transmisi data telemetri mikrokontroler menuju server _backend_ memanfaatkan protokol HTTP REST POST dengan format serialisasi data JSON berbobot muatan ringan. Pada sisi server, data yang masuk dialirkan menuju antarmuka web secara waktu-nyata via protokol _Server-Sent Events_ (SSE) melalui saluran koneksi HTTP persisten tanpa memerlukan mekanisme _polling_ berulang yang memboroskan sumber daya jaringan.

=== Deep Learning Deret Waktu (Long Short-Term Memory / LSTM)
Model LSTM (Hochreiter & Schmidhuber, 1997) mengatasi permasalahan gradien hilang (*vanishing gradient*) pada pemodelan sekuensial jangka panjang melalui mekanisme gerbang internal: gerbang lupa ($f_t$), gerbang masukan ($i_t$), dan gerbang keluaran ($o_t$). Aliran informasi internal sel LSTM dirumuskan pada @eq-lstm:

$ f_t = sigma(W_f dot [h_(t-1), x_t] + b_f), quad i_t = sigma(W_i dot [h_(t-1), x_t] + b_i) \
tilde(C)_t = tanh(W_c dot [h_(t-1), x_t] + b_c), quad C_t = f_t dot C_(t-1) + i_t dot tilde(C)_t \
o_t = sigma(W_o dot [h_(t-1), x_t] + b_o), quad h_t = o_t dot tanh(C_t) $ <eq-lstm>

Model dilatih menggunakan jendela data historis $N = 30$ sampel ($X_t = [h_(t-N+1), dots, h_t]$) untuk memproyeksikan horizon masa depan $15$, $30$, dan $60$ menit ($hat(h)_(t+15), hat(h)_(t+30), hat(h)_(t+60)$). Laju perubahan elevasi air dihitung melalui turunan numerik:

$ frac(d h, d t) = frac(hat(h)_(t + Delta t) - h_t, Delta t) quad ["cm/menit"] $ <eq-laju-air>

Ketika laju bernilai positif ($d h / d t > 0$) dan elevasi mengarah melampaui batas kritis ($h_("kritis") = 80.0$ cm), estimasi waktu menuju luapan (*Estimated Time to Flood* / ETTF) dihitung melalui:

$ "ETTF" = cases(
  frac(h_("kritis") - h_t, d h / d t) & "jika" d h / d t > 0 "dan" h_t < h_("kritis"),
  0 & "jika" h_t >= h_("kritis"),
  infinity & "jika" d h / d t <= 0
) $ <eq-ettf>

Proyeksi masa depan dilengkapi batas interval kepercayaan 95% ($hat(h)_(t+k) plus.minus 1.96 dot sigma_k$).

=== Generative AI dan LLM Situational Report Advisory
Pemanfaatan model bahasa besar (*Large Language Model* / LLM) membuka peluang sintesis informasi kebencanaan secara otonom. Melalui injeksi parameter telemetri waktu-nyata (elevasi aktual, tren laju kenaikan $d h / d t$, dan nilai ETTF dari LSTM) ke dalam _system prompt pipeline_ terstruktur, agen LLM menyusun dokumen laporan situasi (*Situational Report* / Sitrep) resmi berstandar BNPB/BPBD dalam hitungan detik, memangkas birokrasi penulisan laporan manual dan mempercepat distribusi pesan darurat kepada warga.

=== Visualisasi Spasial Kembar Digital 3D (React Three Fiber)
Teknologi kembar digital (*Digital Twin*) menghadirkan replika virtual tiga dimensi dari reservoir fisik secara sinkron. Menggunakan pustaka Three.js dan React Three Fiber, tabung wadah kaca transparan dimodelkan dengan fluida air dinamis berombak berbasis fungsi superposisi gelombang harmonik:

$ z(x, y, t) = A(t) dot [sin(22 r - 3.4 t) + 0.45 cos(16 x + 2.5 t) + 0.45 sin(18 y - 2.0 t)] $ <eq-riak-3d>

Amplitudo riak ($A(t)$) bergejolak saat kenaikan air berlangsung cepat dan mereda menuju ketenangan ($0.75$ mm) ketika elevasi stabil, memberikan pemahaman situasi yang intuitif bagi operator posko.
