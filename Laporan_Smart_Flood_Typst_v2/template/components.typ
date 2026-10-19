// Komponen kecil yang dipakai ulang di banyak bab (semua hitam-putih).

#let th(x) = strong(x)

// tabel((kolom...), ("Judul 1", "Judul 2", ...), sel, sel, ...)
#let tabel(kolom, kepala, ..baris) = table(
  columns: kolom,
  align: (x, y) => if y == 0 { center + horizon } else { left + horizon },
  table.header(..kepala.map(th)),
  ..baris,
)

// Kotak untuk diagram blok
#let blok(isi) = box(
  stroke: 0.75pt + black,
  inset: (x: 6pt, y: 8pt),
  width: 100%,
  align(center + horizon, isi),
)

// Panah untuk diagram blok: arah "r" (kanan) atau "b" (bawah)
#let panah(arah: "r") = align(
  center + horizon,
  text(size: 14pt, if arah == "r" { sym.arrow.r } else { sym.arrow.b }),
)
