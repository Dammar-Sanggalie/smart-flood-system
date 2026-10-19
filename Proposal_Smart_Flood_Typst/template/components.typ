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
