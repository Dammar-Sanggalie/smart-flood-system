#import "/template/components.typ": *

= Jadwal Pelaksanaan (Timeline)

Pelaksanaan proyek _Smart Flood Detection and Early Warning System_ terpadu dirancang berlangsung selama delapan pekan perkuliahan semester ganjil tahun akademik 2026/2027, dengan puncak evaluasi paruh waktu berupa Demo Prototipe Fisik pada Ujian Tengah Semester (UTS), Senin 19 Oktober 2026. Rincian pembagian waktu kerja seluruh tahapan rekayasa perangkat keras, kecerdasan buatan, dan aplikasi web disajikan pada @tbl-timeline.

#figure(
  {
    set text(size: 10pt)
    set table(inset: 4.5pt)
    tabel(
      (0.35fr, 2.3fr, 0.35fr, 0.35fr, 0.35fr, 0.35fr, 0.35fr, 0.35fr, 0.35fr, 0.35fr),
      ("No", "Uraian Aktivitas Proyek", "M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8"),
      [1], [Studi literatur hidrologi, sensor ultrasonik & model deret waktu AI], [X], [X], [], [], [], [], [], [],
      [2], [Perancangan skematik sirkuit & simulasi pada platform Wokwi], [], [X], [X], [], [], [], [], [],
      [3], [Pengadaan komponen perangkat keras & perakitan _breadboard_ fisik], [], [], [X], [X], [], [], [], [],
      [4], [Pengembangan _firmware_ ESP32 C++ _non-blocking_ & aktuasi FSM], [], [], [], [X], [X], [], [], [],
      [5], [Pengembangan _backend daemon_ Go, basis data SQLite & jalur HTTP/SSE], [], [], [], [], [X], [X], [], [],
      [6], [Pelatihan model peramalan LSTM & rekayasa _prompt_ GenAI Sitrep], [], [], [], [], [X], [X], [X], [],
      [7], [Pengembangan antarmuka web Next.js 14 & kembar digital 3D Three.js], [], [], [], [], [], [X], [X], [],
      [8], [*Uji integrasi menyeluruh (end-to-end) & Demo Prototipe UTS (19 Okt 2026)*], [], [], [], [], [], [], [*X*], [],
      [9], [Evaluasi performa, penyusunan laporan akhir & penyempurnaan sistem], [], [], [], [], [], [], [], [X],
    )
  },
  caption: [Matriks jadwal pelaksanaan proyek (Timeline Gantt Chart)],
  kind: table,
) <tbl-timeline>
