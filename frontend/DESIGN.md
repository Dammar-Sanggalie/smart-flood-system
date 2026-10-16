# Smart Flood Detection System — Frontend Design System

> Dokumen spesifikasi desain frontend untuk memastikan tampilan dashboard tetap konsisten, profesional, bersih, tidak sesak, dan berstandar enterprise IoT.

---

## 1. Filosofi & Karakter Visual

- **Arsitektur Informasi Bertahap (Progressive Disclosure):** Menghilangkan *cognitive overload* (tidak menumpuk puluhan angka, grafik, dan form teknis sekaligus di awal). Pengguna disajikan ringkasan eksekutif (*Executive Hero Status*) yang langsung menjawab: **"Apakah saat ini aman atau bahaya? Berapa ketinggian air sekarang?"**.
- **Navigasi Tab Interaktif:**
  - 🌊 **Live Digital Twin & Metrik** (Fokus utama pemantauan visual tangki 3D dan kartu metrik inti).
  - 📈 **Grafik Hidrograf & Tren** (Fokus analisis historis fluktuasi air dari waktu ke waktu).
  - ⚙️ **Hardware & Pengaturan** (Diagnostik koneksi jaringan, kalibrasi tangki, dan log kejadian).
  - 🔲 **Tampilkan Semua** (Mode tampilan penuh untuk layar monitor besar/Command Center).
- **Nuansa Warna Berdimensi (Soft Canvas & Elevated Pure White Cards):**
  - Background halaman menggunakan warna lembut bernuansa sejuk `bg-[#f8fafc]` (Slate-50) dengan aksen cahaya ambient.
  - Kartu komponen menggunakan elevated pure white (`bg-white`) dengan sudut membulat elegan (`rounded-2xl`), border tipis (`border-slate-200/80`), dan bayangan lembut bergradasi (`shadow-soft`).
  - Menghilangkan kesan monoton "serba putih datar" dengan variasi aksen warna yang kaya dan terkurasi (Sky Blue, Indigo, Cyan, Emerald, Amber, dan Slate).
- **Single Unified Header:**
  - Cukup satu header bersih di bagian atas (menghapus double header/banner bertingkat).
  - Indikator simulasi demo diintegrasikan secara cerdas dalam bentuk pill badge interaktif di header utama.
  - Logo kustom berkarakter tinggi: lambang hydro-sonar radar dengan gradasi Cyan ke Electric Blue.

---

## 2. Palet Warna (Color Palette)

### 2.1 Background & Kartu
| Token | Nilai Hex | Penggunaan |
|---|---|---|
| `bg-page` | `#F8FAFC` | Latar belakang kanvas seluruh dashboard |
| `bg-card` | `#FFFFFF` | Background kartu utama (elevated pure white) |
| `bg-card-subtle` | `#F1F5F9` | Sub-panel, header tabel, dan area input |
| `bg-hover` | `#F8FAFC` | Hover state tombol dan item list |

### 2.2 Border & Bayangan
| Token | Definisi | Penggunaan |
|---|---|---|
| `border-slate-200/80` | `rgba(226, 232, 240, 0.8)` | Garis batas kartu dan input field (1px) |
| `shadow-soft` | `0 2px 15px -3px rgba(0,0,0,0.04)` | Elevasi standar kartu komponen |
| `shadow-elevated` | `0 10px 30px -5px rgba(0,0,0,0.06)` | Popover, modal, dan kartu aktif |

### 2.3 Status Semantik Air & Bahaya Banjir
| Status | Warna Teks | Badge Bg & Border | Aksen Dot |
|---|---|---|---|
| **SAFE (Aman)** | `#065F46` (Emerald-800) | `bg-emerald-50 border-emerald-200` | `#10B981` (Emerald-500) |
| **WARNING (Waspada)** | `#92400E` (Amber-800) | `bg-amber-50 border-amber-200` | `#F59E0B` (Amber-500) |
| **DANGER (Kritis/Bahaya)** | `#9F1239` (Rose-800) | `bg-rose-50 border-rose-200` | `#E11D48` (Rose-600) |
| **STALE / INVALID** | `#334155` (Slate-700) | `bg-slate-100 border-slate-200` | `#94A3B8` (Slate-400) |

### 2.4 Aksen Kategori Metrik
| Kategori | Background Ikon | Warna Ikon |
|---|---|---|
| **Water Level** | `bg-sky-50 border-sky-200/80` | `#0284C7` (Sky-600) |
| **Fill Capacity** | `bg-indigo-50 border-indigo-200/80` | `#4F46E5` (Indigo-600) |
| **Surface Clearance** | `bg-cyan-50 border-cyan-200/80` | `#0891B2` (Cyan-600) |
| **Water Volume** | `bg-blue-50 border-blue-200/80` | `#2563EB` (Blue-600) |
| **Reservoir Size** | `bg-slate-100 border-slate-200` | `#475569` (Slate-600) |

---

## 3. Tipografi & Hierarki Teks

- **Sans-serif (UI & Narasi):** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`
  - Judul: Bold / Extrabold dengan `tracking-tight`.
  - Body: Teks abu-abu netral (`text-slate-600` / `text-slate-500`).
- **Monospace Tabular (Data Sensor):** `JetBrains Mono`, `SFMono-Regular`, `Menlo`, `monospace`
  - Angka metrik (cm, %, liter): `font-mono tabular-nums font-extrabold`. Mencegah angka bergeser saat live stream diperbarui.

---

## 4. Struktur Tata Letak (Layout & Spacing)

- **Margin & Padding yang Lega:** Container berjarak `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8`. Tidak lagi mepet atau berdesakan.
- **Kartu Memiliki Sudut Halus:** `rounded-2xl` (16px) dengan padding lapang `p-5 sm:p-7`.
- **Kompatibilitas Backend & Hardware:**
  - Layout frontend 100% independen dari backend Go dan firmware ESP32.
  - Perubahan UI tidak mengubah payload MQTT, REST endpoint `/api/readings`, maupun stream SSE.
