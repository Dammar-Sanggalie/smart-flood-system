#import "/config/identitas.typ": *
#import "/config/gambar.typ": fig-logo

#page(numbering: none)[
  #set par(first-line-indent: 0pt, justify: false, leading: 0.65em)
  #set align(center)

  *PROPOSAL PROYEK UJIAN TENGAH SEMESTER (UTS)* \
  *MATA KULIAH INTERNET OF THINGS*

  #v(0.6cm)

  *#judul-lengkap*

  #v(1fr)
  #image(fig-logo, width: 5.2cm)
  #v(1fr)

  *Dosen Pengampu:* \
  #dosen

  #v(0.5cm)

  *Disusun oleh #kelompok (#kelas):*

  #v(0.3cm)
  #align(center)[
    #table(
      columns: 2,
      stroke: none,
      align: (left, left),
      inset: (x: 14pt, y: 3.5pt),
      ..anggota.map(a => (a.nama, a.nim)).flatten(),
    )
  ]

  #v(1fr)

  *#program-studi* \
  *#fakultas* \
  *#universitas* \
  *#tahun*
]
