#import "/template/components.typ": *

= Jadwal Pelaksanaan (Timeline)

Pelaksanaan proyek _Smart Flood Detection and Early Warning System_ dirancang berlangsung selama delapan pekan perkuliahan semester ganjil tahun akademik 2026/2027, dengan puncak evaluasi paruh waktu berupa Demo Prototipe Fisik pada Ujian Tengah Semester (UTS), Senin 19 Oktober 2026. Rincian pembagian waktu kerja disajikan pada @tbl-timeline.

#figure(
  tabel(
    (0.4fr, 2.2fr, 0.4fr, 0.4fr, 0.4fr, 0.4fr, 0.4fr, 0.4fr, 0.4fr, 0.4fr),
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
