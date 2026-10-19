// =====================================================================
// Template gaya proposal: Times New Roman 12 pt, margin 4-3-3-3 cm,
// paragraf menjorok 1,25 cm, spasi 1,5, standar akademik UNESA.
// =====================================================================

#let font-utama = ("Times New Roman", "Times")
#let font-kode = ("Courier New", "Menlo", "Courier")

// Penomoran judul: "BAB I" untuk level 1, "1.1", "1.1.1" untuk sub-bab
#let nomor-judul(..n) = {
  let angka = n.pos()
  if angka.len() == 1 {
    "BAB " + numbering("I", angka.at(0))
  } else {
    angka.map(str).join(".")
  }
}

#let proposal(judul: "", penulis: (), body) = {
  set document(title: judul, author: penulis)

  // Standar format A4: Kiri 4 cm, Atas/Kanan/Bawah 3 cm
  set page(
    paper: "a4",
    margin: (left: 4cm, right: 3cm, top: 3cm, bottom: 3cm),
  )

  // Tipografi teks utama
  set text(font: font-utama, size: 12pt, fill: black, lang: "id", hyphenate: false)

  // Paragraf: Rata kanan-kiri (justify), indent 1,25 cm, spasi 1,5 (leading 0.85em)
  set par(
    justify: true,
    leading: 0.85em,
    spacing: 0.85em,
    first-line-indent: (amount: 1.25cm, all: true),
  )

  // Penomoran heading & styling bab
  set heading(numbering: nomor-judul, supplement: [Bab])
  show heading: set text(size: 12pt, weight: "bold", fill: black)
  show heading: set par(first-line-indent: 0pt, justify: false)
  show heading: set block(above: 1.3em, below: 0.9em)
  show heading.where(level: 3): set text(style: "italic")
  show heading.where(level: 1): it => {
    pagebreak(weak: true)
    set align(center)
    block(above: 0pt, below: 1.4em)[
      #if it.numbering != none [
        #context counter(heading).display(it.numbering) \
      ]
      #upper(it.body)
    ]
  }

  // Pengaturan Gambar dan Tabel
  show figure.where(kind: image): set figure(supplement: [Gambar])
  show figure.where(kind: table): set figure(supplement: [Tabel])
  show figure.where(kind: table): set figure.caption(position: top)
  show figure.where(kind: table): set block(breakable: true)
  set figure.caption(separator: ". ")
  set figure(gap: 0.8em)
  show figure: set block(above: 1.2em, below: 1.2em)
  show figure: set par(first-line-indent: 0pt)

  set table(stroke: 0.5pt + black, inset: 6pt)
  show table: set par(first-line-indent: 0pt, justify: false)

  // Penomoran Daftar (List & Enum)
  set enum(numbering: "1.", indent: 1.25cm, body-indent: 0.6em)
  set list(indent: 1.25cm, body-indent: 0.6em)
  show enum: set par(first-line-indent: 0pt)
  show list: set par(first-line-indent: 0pt)

  // Persamaan Matematika
  set math.equation(numbering: "(1)", supplement: [Persamaan])

  // Blok Kode Sumber
  show raw: set text(font: font-kode, size: 9.5pt, fill: black)
  show raw.where(block: true): it => block(
    width: 100%,
    stroke: 0.5pt + black,
    inset: 8pt,
    fill: luma(252),
    breakable: true,
    it,
  )
  show raw.where(block: true): set par(first-line-indent: 0pt, justify: false)

  // Daftar Isi
  show outline: set par(first-line-indent: 0pt, justify: false, leading: 0.65em)
  show outline.entry.where(level: 1): set text(weight: "bold")
  show outline.entry.where(level: 1): set block(above: 0.9em)

  body
}
