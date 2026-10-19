// =====================================================================
// Proposal Proyek IoT — Smart Flood Detection and Early Warning System
// Format Resmi Sesuai Arahan Dosen:
//   1. Latar Belakang
//   2. Rumusan Masalah
//   3. Tujuan Proyek
//   4. Arsitektur dan Komponen IoT
//   5. Cara Kerja Sistem
//   6. Jadwal Pelaksanaan (Timeline)
//   7. Penutup & Daftar Pustaka
//
// Kompilasi:
//   typst compile main.typ proposal-smart-flood.pdf
// =====================================================================

#import "/template/style.typ": proposal
#import "/config/identitas.typ": judul-dokumen, anggota

#show: proposal.with(
  judul: judul-dokumen,
  penulis: anggota.map(a => a.nama),
)

// ---- Sampul Dokumen (tanpa nomor halaman) ----
#include "/bagian/00-cover.typ"

// ---- Bagian Awal: Daftar Isi (nomor halaman romawi kecil: i, ii, ...) ----
#set page(numbering: "i")
#counter(page).update(1)
#include "/bagian/01-daftar-isi.typ"

// ---- Isi Utama: 7 Poin Ketentuan Dosen (nomor halaman latin: 1, 2, 3, ...) ----
#set page(numbering: "1")
#counter(page).update(1)
#include "/bagian/bab1-latar-belakang.typ"
#include "/bagian/bab2-rumusan-masalah.typ"
#include "/bagian/bab3-tujuan-proyek.typ"
#include "/bagian/bab4-arsitektur-dan-komponen.typ"
#include "/bagian/bab5-cara-kerja-sistem.typ"
#include "/bagian/bab6-jadwal-pelaksanaan.typ"
#include "/bagian/bab7-penutup.typ"

// ---- Bagian Akhir: Daftar Pustaka & Lampiran Kode Hardware ----
#include "/bagian/daftar-pustaka.typ"
#include "/bagian/lampiran.typ"
