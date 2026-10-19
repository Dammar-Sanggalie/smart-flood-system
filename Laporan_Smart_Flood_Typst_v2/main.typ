// =====================================================================
// Laporan Praktikum IoT — Smart Flood Detection and Early Warning System
// Kompilasi (Typst 0.13 atau lebih baru):
//   typst compile main.typ laporan-smart-flood.pdf
// Isi laporan ada di folder bagian/, gaya di template/, data di config/.
// =====================================================================
#import "/template/style.typ": laporan
#import "/config/identitas.typ": judul-dokumen, anggota

#show: laporan.with(
  judul: judul-dokumen,
  penulis: anggota.map(a => a.nama),
)

// ---- Sampul (tanpa nomor halaman) ----
#include "/bagian/00-cover.typ"

// ---- Bagian awal: nomor halaman romawi kecil (i, ii, iii, ...) ----
#set page(numbering: "i")
#counter(page).update(1)
#include "/bagian/01-kata-pengantar.typ"
#include "/bagian/02-abstrak.typ"
#include "/bagian/03-daftar.typ"

// ---- Isi: nomor halaman angka (1, 2, 3, ...) ----
#set page(numbering: "1")
#counter(page).update(1)
#include "/bagian/bab1-pendahuluan.typ"
#include "/bagian/bab2-landasan-teori.typ"
#include "/bagian/bab3-perancangan.typ"
#include "/bagian/bab4-hasil.typ"
#include "/bagian/bab5-penutup.typ"

// ---- Bagian akhir ----
#include "/bagian/daftar-pustaka.typ"
#include "/bagian/lampiran.typ"
