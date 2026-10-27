// =====================================================================
// Template komponen bantuan untuk Proposal Proyek IoT
// =====================================================================

#let th(x) = strong(x)

// Komponen tabel formal bergaris standar akademik
#let tabel(kolom, kepala, ..baris) = table(
  columns: kolom,
  align: (x, y) => if y == 0 { center + horizon } else { left + horizon },
  table.header(..kepala.map(th)),
  ..baris,
)

// Kotak untuk diagram blok arsitektur
#let blok(isi) = box(
  stroke: 0.75pt + black,
  inset: (x: 6pt, y: 8pt),
  width: 100%,
  align(center + horizon, isi),
)

// Panah konektor diagram blok
#let panah(arah: "r") = align(
  center + horizon,
  text(size: 14pt, if arah == "r" { sym.arrow.r } else { sym.arrow.b }),
)

// Kotak sorotan teknis (Callout Box)
#let kotak-info(judul: "Catatan Teknis", isi) = block(
  width: 100%,
  stroke: (left: 3pt + black, rest: 0.5pt + luma(120)),
  inset: (x: 10pt, y: 8pt),
  fill: luma(250),
  breakable: false,
)[
  #set par(first-line-indent: 0pt, justify: true)
  *#judul:* \
  #isi
]

// Komponen Bingkai Placeholder Foto Asli yang Rapi & Akademik
#let placeholder-gambar(
  label: "DOKUMENTASI FOTO PERANGKAT KERAS FISIK",
  petunjuk: "Tempatkan foto dokumentasi prototipe fisik asli (tampak atas perakitan breadboard ESP32, sensor HC-SR04, LCD 16x2, 5 LED, dan wadah uji) pada direktori figure/",
  file-target: "figure/foto-hardware.jpg",
  tinggi: 7.2cm,
) = block(
  width: 100%,
  height: tinggi,
  stroke: (dash: "dashed", thickness: 1.2pt, paint: luma(100)),
  fill: luma(252),
  radius: 6pt,
  inset: 14pt,
)[
  #set align(center + horizon)
  #set par(first-line-indent: 0pt, justify: false, leading: 0.6em)
  #block(
    width: 36pt,
    height: 28pt,
    radius: 4pt,
    stroke: 1pt + luma(120),
    fill: luma(240),
  )[
    #set align(center + horizon)
    #text(size: 13pt)[📷]
  ]
  #v(8pt)
  #text(weight: "bold", size: 11pt, fill: luma(30))[#label] \
  #v(5pt)
  #text(size: 9.5pt, fill: luma(80))[#petunjuk] \
  #v(8pt)
  #rect(
    stroke: 0.5pt + luma(160),
    fill: luma(255),
    radius: 3pt,
    inset: (x: 8pt, y: 4pt),
  )[
    #text(font: ("Courier New", "Menlo", "Courier"), size: 9pt, weight: "bold", fill: rgb("#0369a1"))[File target: #file-target]
  ]
  #v(5pt)
  #text(size: 8pt, style: "italic", fill: luma(120))[(Apabila file foto telah tersedia di direktori di atas, sistem dapat langsung merender foto asli Anda)]
]

