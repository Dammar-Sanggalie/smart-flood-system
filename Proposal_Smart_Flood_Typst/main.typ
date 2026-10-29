// =====================================================================
// Master File Proposal Proyek IoT — Smart Flood Early Warning System
// Format Standar Skripsi / Proposal Universitas Negeri Surabaya (UNESA)
// Sesuai Struktur Referensi Proposal UNESA:
//   - Bagian Awal: Sampul, Daftar Isi, Daftar Gambar, Daftar Tabel
//   - BAB I: Pendahuluan
//   - BAB II: Tinjauan Pustaka dan Landasan Teori
//   - BAB III: Metodologi Perancangan dan Implementasi Sistem
//   - Bagian Akhir: Daftar Pustaka & Lampiran
// =====================================================================

#import "/template/style.typ": proposal
#import "/config/identitas.typ": judul-lengkap, anggota

#show: proposal.with(
  judul: judul-lengkap,
  penulis: anggota.map(m => m.nama),
)

// ---------------------------------------------------------------------
// 1. BAGIAN AWAL (Cover & Halaman Depan)
// ---------------------------------------------------------------------
#include "/bagian/00-cover.typ"

#pagebreak()
#set page(numbering: "i")
#counter(page).update(1)
#include "/bagian/01-daftar-isi.typ"

// ---------------------------------------------------------------------
// 2. BAGIAN UTAMA (BAB I, BAB II, BAB III)
// ---------------------------------------------------------------------
#pagebreak()
#set page(
  numbering: "1",
  header: none,
)
#counter(page).update(1)

#include "/bagian/bab1-pendahuluan.typ"
#include "/bagian/bab2-tinjauan-pustaka.typ"
#include "/bagian/bab3-metodologi-penelitian.typ"

// ---------------------------------------------------------------------
// 3. BAGIAN AKHIR (Daftar Pustaka & Lampiran)
// ---------------------------------------------------------------------
#pagebreak()
#include "/bagian/daftar-pustaka.typ"

#pagebreak()
#include "/bagian/lampiran.typ"
