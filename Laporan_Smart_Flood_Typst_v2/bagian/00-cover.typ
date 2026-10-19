#import "/config/identitas.typ": *
#import "/config/gambar.typ": fig-logo

#page(numbering: none)[
  #set par(first-line-indent: 0pt, justify: false, leading: 0.65em)
  #set align(center)

  *LAPORAN PRAKTIKUM INTERNET OF THINGS*

  #v(0.5cm)

  *SMART FLOOD DETECTION AND EARLY WARNING SYSTEM BERBASIS ESP32, HC-SR04, MQTT, DAN LCD 16×2 I2C*

  #v(1fr)
  #image(fig-logo, width: 5.5cm)
  #v(1fr)

  *Dosen Pengampu:* \
  #dosen

  #v(0.6cm)

  *Disusun oleh #kelompok:*

  #v(0.2cm)
  #table(
    columns: 2,
    stroke: none,
    align: left,
    inset: (x: 10pt, y: 3pt),
    ..anggota.map(a => (a.nama, a.nim)).flatten(),
  )

  #v(1fr)

  *UNIVERSITAS NEGERI SURABAYA* \
  *FAKULTAS TEKNIK* \
  *PROGRAM STUDI TEKNIK INFORMATIKA* \
  *#tahun*
]
