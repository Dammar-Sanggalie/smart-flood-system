# Smart Flood Detection System — Frontend Design System

> Dokumen spesifikasi desain frontend untuk memastikan tampilan dashboard tetap konsisten, profesional, bersih, dan berstandar enterprise IoT.

---

## 1. Filosofi & Karakter Visual

- **Dominan Putih & Bersih (Luminous White Canvas):** Menghilangkan kesan "AI template" yang biasanya penuh warna-warni berlebihan, gradasi murahan, dan badge badge tebal. Dashboard didesain bernuansa ruang kerja teknik/engineering modern (seperti Vercel, Linear, Apple, Stripe, dan Grafana Next).
- **Presisi Engineering & Telemetri:** Mengutamakan tipografi data tabular (`font-mono`, `tabular-nums`), garis pembatas tipis 1px (`border-slate-200/80`), dan tata letak modular dengan hierarki informasi yang teratur.
- **Warna Aksen Semantik yang Matang:** Menggunakan aksen warna fungsional yang lembut namun tegas (Emerald untuk aman, Amber untuk waspada, Rose untuk bahaya, dan Sky/Cyan untuk air & teknologi), bukan warna neon yang melelahkan mata.
- **Digital Twin 3D Realistis:** Visualisasi tangki 3D disajikan sebagai model laboratorium/industri presisi tinggi dengan kaca optik transparan, skala graduasi pengukuran laser, dan studio lighting netral, bukan model kartun atau akuarium mainan.

---

## 2. Palet Warna (Color Palette)

### 2.1 Background & Kartu (Dominan Putih)
| Token | Nilai Hex | Penggunaan |
|---|---|---|
| `bg-page` | `#FFFFFF` | Background utama seluruh halaman (pure white) |
| `bg-card` | `#FFFFFF` | Background kartu komponen dengan elevasi halus |
| `bg-card-subtle` | `#F8FAFC` | Sub-panel, header tabel, dan area input dalam kartu |
| `bg-hover` | `#F1F5F9` | Hover state tombol dan item list |

### 2.2 Border & Pembatas
| Token | Nilai Hex | Penggunaan |
|---|---|---|
| `border-subtle` | `#F1F5F9` | Pembatas garis dalam atau baris tabel |
| `border-default` | `#E2E8F0` | Border standar kartu dan input (1px) |
| `border-strong` | `#CBD5E1` | Garis fokus, divider aktif, dan outline tertekan |

### 2.3 Tipografi & Teks
| Token | Nilai Hex | Penggunaan |
|---|---|---|
| `text-primary` | `#0F172A` (Slate-900) | Judul utama, angka metrik besar, label aktif |
| `text-secondary` | `#475569` (Slate-600) | Label kartu, deskripsi, nilai sekunder |
| `text-muted` | `#94A3B8` (Slate-400) | Satuan unit, timestamp, placeholder, hint |
| `text-faint` | `#CBD5E1` (Slate-300) | Ikon non-aktif, grid chart, garis bantu |

### 2.4 Status Semantik (Air & Koneksi)
| Status | Text Color | Dot / Badge Bg | Border |
|---|---|---|---|
| **SAFE (Aman)** | `#059669` (Emerald-600) | `#ECFDF5` (Emerald-50) | `#A7F3D0` (Emerald-200) |
| **WARNING (Waspada)** | `#D97706` (Amber-600) | `#FFFBEB` (Amber-50) | `#FDE68A` (Amber-200) |
| **DANGER (Bahaya/Banjir)** | `#E11D48` (Rose-600) | `#FFF1F2` (Rose-50) | `#FECDD3` (Rose-200) |
| **INVALID / STALE** | `#64748B` (Slate-500) | `#F1F5F9` (Slate-100) | `#E2E8F0` (Slate-200) |
| **CONNECTED / LIVE** | `#0284C7` (Sky-600) | `#F0F9FF` (Sky-50) | `#BAE6FD` (Sky-200) |

---

## 3. Tipografi

- **Font Utama (Sans-serif):** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`
  - Body text: 13px / 14px dengan letter-spacing normal.
  - Heading: 14px s.d. 18px semi-bold (`font-semibold` / `tracking-tight`).
- **Font Telemetri (Monospace):** `SFMono-Regular`, `JetBrains Mono`, `Menlo`, `monospace`
  - Angka metrik (cm, %, volume, distance): `font-mono tracking-tight font-bold tabular-nums`.
  - ID Perangkat, timestamp, dan serial payload: `font-mono text-xs`.

---

## 4. Komponen & Pedoman Desain

### 4.1 Header Dashboard
- Latar belakang putih dengan garis batas bawah 1px (`border-b border-slate-200/80`).
- Logo/Brand mark sederhana berbentuk droplet geometris dengan aksen Cyan/Sky halus.
- Telemetri status IoT: Indikator titik berkedip halus (*soft pulse ring*) untuk koneksi MQTT dan status backend live.
- Badge status mode (LIVE vs DEMO) dengan warna netral terukur.

### 4.2 Kartu Metrik (Metric Cards)
- Background putih bersih, rounded-xl (12px), border 1px `border-slate-200/80`, bayangan sangat lembut (`shadow-xs` / `shadow-[0_1px_2px_rgba(0,0,0,0.03)]`).
- Label huruf kapital kecil (`text-[11px] font-medium tracking-wider text-slate-500 uppercase`).
- Nilai utama besar dan tegas dengan font mono tabular (`text-2xl font-bold font-mono text-slate-900`).
- Satuan unit diletakkan di samping nilai dengan warna abu-abu netral (`text-sm font-medium text-slate-400`).
- Indikator status berupa strip mikro atau pill minimalis yang rapi di pojok atas, bukan border samping yang mencolok.

### 4.3 Visualisasi 3D Tangki (Precision Reservoir)
- Latar canvas studio putih netral bersih (menghilangkan gradasi biru neon).
- Dinding tangki kaca optik tipis dengan transmisi tinggi dan edge line halus.
- Tangga skala ukuran (graduated measurement tick marks) dengan angka level air (0%, 25%, 50%, 75%, 100%) tercetak presisi di sisi tangki.
- Sensor HC-SR04 terpasang rapi di atas dengan garis berkas ultrasonik tipis ke permukaan air.
- Permukaan air memiliki animasi ripple halus yang realistis dan warna dinamis sesuai status peringatan.
- Kontrol kamera 3D responsif (orbit rotation, auto-rotate lambat yang elegan).

### 4.4 Grafik Riwayat (Telemetry Chart)
- Background kartu putih dengan padding yang lega.
- Area chart dengan gradasi linear halus dari warna air transparan menuju putih.
- Garis grid horizontal tipis titik-titik (`stroke="#E2E8F0" strokeDasharray="3 3"`), tanpa garis vertikal berlebih.
- Garis ambang batas peringatan (*Warning*) dan bahaya (*Danger*) menggunakan garis putus-putus tipis yang elegan.
- Custom tooltip melayang berlatar putih dengan bayangan lembut dan sudut membulat.

### 4.5 Panel Konfigurasi & Status Koneksi
- Menggunakan input field bernuansa clean putih (`bg-white border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500`).
- Slider dan bar pratinjau kapasitas tangki yang proporsional.
- Tombol aksi utama (*primary button*) menggunakan solid dark-slate/sky elegan dengan transisi hover halus.

---

## 5. Aturan Layout & Spacing

- **Container Utama:** Lebar maksimal 1600px dengan padding horizontal responsif (`px-4 sm:px-6 lg:px-8`).
- **Sistem Grid:**
  - Desktop (>1024px): 3 Kolom (2 Kolom kiri untuk Metrik, 3D View, dan Chart; 1 Kolom kanan untuk Koneksi, Pengaturan Tangki, dan Log).
  - Tablet & Mobile: Responsif bertumpuk 1 kolom vertikal yang teratur.
- **Konsistensi Jarak:** Jarak antar elemen menggunakan kelipatan 4px/8px (`gap-4`, `gap-5`, `space-y-4`).

---

## 6. Checklist Kepatuhan Frontend
Setiap perubahan komponen di masa mendatang harus memenuhi kriteria berikut:
- [x] Latar belakang utama tetap dominan putih bersih.
- [x] Tidak menggunakan badge neon atau border berwarna tebal yang berlebihan.
- [x] Nilai telemetri sensor menggunakan angka tabular monospace.
- [x] Animasi halus dan tidak mengganggu performa rendering 3D.
- [x] Tampilan mobile responsif dan bebas horizontal overflow.
