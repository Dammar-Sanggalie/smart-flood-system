#import "/template/components.typ": *

= Jadwal Pelaksanaan (Timeline)

== Rencana Tahapan Pelaksanaan Proyek

Pelaksanaan proyek _Smart Flood Detection and Early Warning System_ dirancang berlangsung selama delapan pekan perkuliahan semester ganjil tahun akademik 2026/2027, dengan puncak evaluasi paruh waktu berupa Demo Prototipe Fisik pada Ujian Tengah Semester (UTS), Senin 19 Oktober 2026. Rincian pembagian waktu kerja disajikan pada @tbl-timeline.

#figure(
  tabel(
    (0.4fr, 2fr, 0.4fr, 0.4fr, 0.4fr, 0.4fr, 0.4fr, 0.4fr, 0.4fr, 0.4fr),
    ("No", "Uraian Aktivitas Proyek", "M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8"),
    [1], [Studi literatur hidrologi & riset sensor ultrasonik IoT], [X], [X], [], [], [], [], [], [],
    [2], [Perancangan skematik & simulasi sirkuit pada Wokwi], [], [X], [X], [], [], [], [], [],
    [3], [Pengadaan komponen fisik & perakitan breadboard], [], [], [X], [X], [], [], [], [],
    [4], [Pengembangan firmware C++ non-blocking (ESP32)], [], [], [], [X], [X], [], [], [],
    [5], [Pengembangan backend daemon Go & jalur telemetri HTTP/SSE], [], [], [], [], [X], [X], [], [],
    [6], [Pengembangan frontend dashboard Next.js & 3D Digital Twin], [], [], [], [], [X], [X], [X], [],
    [7], [*Uji integrasi end-to-end & Demo Fisik UTS (19 Okt 2026)*], [], [], [], [], [], [], [*X*], [],
    [8], [Penyusunan laporan lengkap & penyempurnaan sistem], [], [], [], [], [], [], [], [X],
  ),
  caption: [Matriks jadwal pelaksanaan proyek (Timeline Gantt Chart)],
  kind: table,
) <tbl-timeline>

== Pembagian Peran dan Tanggung Jawab Anggota Kelompok

Untuk menjamin efektivitas dan sinergi kerja tim, tugas dan tanggung jawab didistribusikan secara proporsional kepada seluruh anggota Kelompok 3 sebagaimana dirinci pada @tbl-peran.

#figure(
  tabel(
    (1fr, 0.9fr, 1.1fr, 1.8fr),
    ("Nama Anggota", "NIM", "Peran / Tanggung Jawab", "Rincian Tugas Fungsional"),
    [Fathan Orvala], [25051204271], [Project Lead & Frontend Engineer], [Mengorkestrasi arsitektur sistem, merancang dashboard Next.js, mengimplementasikan kembar digital 3D (React Three Fiber) dengan dinamika riak gelombang fluida, dan memimpin integrasi tampilan UI/UX.],
    [Kevin Dzaky Hendratama], [25051204293], [Embedded Systems Firmware Lead], [Mengembangkan kode firmware ESP32, menyusun algoritma kontrol waktu multi-interval `millis()`, mengimplementasikan animasi strobo LCD 16×2 dan running LED merah.],
    [Dammar Sanggalie], [25051204254], [Backend & Cloud Telemetry Specialist], [Membangun server backend berbasis Go, merancang endpoint HTTP POST `/api/readings`, mengonfigurasi jalur transmisi SSE real-time, dan mengelola sinkronisasi data.],
    [Aditya Putra Wicaksana], [25051204384], [Hardware & Calibration Specialist], [Merakit sirkuit pengkabelan fisik breadboard, melakukan kalibrasi akurasi jarak sensor ultrasonik HC-SR04, pengujian toleransi catu daya, dan pengujian keandalan aktuator.],
  ),
  caption: [Pembagian peran dan tanggung jawab anggota tim pengembang],
  kind: table,
) <tbl-peran>
