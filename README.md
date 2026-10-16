# Smart Flood Detection System

> Sistem monitoring ketinggian air real-time berbasis ESP32 dengan dashboard web interaktif.

[![Go](https://img.shields.io/badge/Backend-Go-blue)](https://go.dev)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-black)](https://nextjs.org)
[![MQTT](https://img.shields.io/badge/IoT-MQTT-green)](https://mqtt.org)

---

## Gambaran Proyek

Smart Flood Detection System mengukur ketinggian air menggunakan sensor ultrasonik HC-SR04
yang dipasang di atas tangki, kemudian menampilkan data secara real-time di dashboard web.

**Aliran data:**
```
ESP32 + HC-SR04 → MQTT Broker → Backend Go → Frontend Next.js → Browser
```

---

## Arsitektur

Lihat [docs/architecture.md](./docs/architecture.md) untuk penjelasan lengkap.

---

## Teknologi

| Komponen | Teknologi |
|----------|-----------|
| Mikrokontroler | ESP32 DevKit-C V4 |
| Sensor | HC-SR04 (ultrasonik) |
| Protokol IoT | MQTT |
| Backend | Go 1.21 |
| Database | SQLite |
| Real-time | Server-Sent Events (SSE) |
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS |
| 3D Visualisasi | React Three Fiber, Three.js |
| Charts | Recharts |

---

## Persyaratan Instalasi

### Backend
- Go 1.21 atau lebih baru → https://go.dev/dl/
- Verifikasi: `go version`

### Frontend
- Node.js 18 atau lebih baru → https://nodejs.org
- Verifikasi: `node --version`

### Tools Opsional (untuk testing MQTT)
- Mosquitto tools → https://mosquitto.org/download/
- MQTT Explorer (GUI) → http://mqtt-explorer.com

---

## Cara Menjalankan (Development)

### Langkah 1 — Siapkan Backend

Buka **Terminal 1** (PowerShell):

```powershell
# Masuk ke folder backend
cd "c:\Users\mohre\Documents\Kuliah Dammar\Project\IOT\smart-flood-system\backend"

# Salin file environment
Copy-Item .env.example .env

# Edit .env jika perlu mengubah konfigurasi MQTT atau port
# (Buka dengan Notepad: notepad .env)

# Download dependencies
go mod tidy

# Buat folder data untuk SQLite
New-Item -ItemType Directory -Force -Path data

# Jalankan server
go run ./cmd/server/main.go
```

Output yang diharapkan:
```
[INFO] Smart Flood Detection System Backend starting...
[INFO] Loading config from environment...
[INFO] Database initialized at ./data/smartflood.db
[INFO] Connecting to MQTT broker: tcp://test.mosquitto.org:1883
[INFO] MQTT connected, subscribed to: ti2024i/kelompok3/smartflood/data
[INFO] HTTP server listening on :8080
```

### Langkah 2 — Siapkan Frontend

Buka **Terminal 2** (PowerShell baru):

```powershell
# Masuk ke folder frontend
cd "c:\Users\mohre\Documents\Kuliah Dammar\Project\IOT\smart-flood-system\frontend"

# Salin file environment
Copy-Item .env.example .env.local

# Install dependencies (pertama kali, butuh beberapa menit)
npm install

# Jalankan development server
npm run dev
```

Output yang diharapkan:
```
  ▲ Next.js 14.2.5
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 2.3s
```

### Langkah 3 — Buka Dashboard

1. Buka browser → http://localhost:3000
2. Dashboard akan menampilkan status koneksi
3. Jika backend aktif, status backend = Connected
4. Jika MQTT terhubung ke broker, status MQTT = Connected

---

## Mode DEMO (Tanpa ESP32)

Untuk menguji dashboard tanpa perangkat keras:

```powershell
# Di Terminal 1 (backend), set env var sebelum run:
$env:DEMO_MODE = "true"
go run ./cmd/server/main.go
```

Dashboard akan menampilkan banner **⚠ DEMO MODE** dan mensimulasikan
perubahan level air secara otomatis.

**Penting:** Data demo TIDAK disimpan ke database dan TIDAK tercampur dengan data nyata.

---

## Mode LIVE (Dengan ESP32)

Pastikan:
1. ESP32 terhubung ke Wi-Fi
2. ESP32 mengirim MQTT ke `test.mosquitto.org:1883`
3. Topic: `ti2024i/kelompok3/smartflood/data`
4. Payload minimal: `{"distanceCm": 40.0}`
5. Backend Go berjalan
6. Frontend Next.js berjalan

Lihat [docs/mqtt-payload.md](./docs/mqtt-payload.md) untuk format payload lengkap.

---

## Mengonfigurasi MQTT

Edit file `backend/.env`:

```env
MQTT_BROKER_URL=tcp://test.mosquitto.org:1883
MQTT_TOPIC=ti2024i/kelompok3/smartflood/data
MQTT_CLIENT_ID=smartflood-backend-001
MQTT_USERNAME=
MQTT_PASSWORD=
```

**⚠️ Jangan pernah commit file .env ke Git jika berisi password.**

---

## Mengatur Dimensi Tangki

1. Buka dashboard → klik ikon Settings (⚙️) di header
2. Isi dimensi tangki:
   - Panjang (cm)
   - Lebar (cm)
   - Kedalaman dalam (cm)
   - Tinggi sensor dari dasar (cm)
3. Atur ambang batas WARNING dan DANGER (% isian)
4. Klik **Simpan Konfigurasi**

Perubahan langsung diaplikasikan ke:
- Perhitungan ketinggian air
- Persentase isian
- Volume air
- Model tangki 3D

---

## Verifikasi Data Sensor Diterima

### Cara 1: Lihat Activity Log di Dashboard
Dashboard menampilkan log real-time. Jika data masuk, akan muncul:
```
[10:00:01] Reading received - Distance: 40.0cm, Water Level: 60.0cm (SAFE)
```

### Cara 2: Cek REST API
```powershell
# Status sistem
Invoke-RestMethod -Uri "http://localhost:8080/api/status"

# Pembacaan terbaru
Invoke-RestMethod -Uri "http://localhost:8080/api/readings/latest"

# Histori (10 terakhir)
Invoke-RestMethod -Uri "http://localhost:8080/api/readings/history?limit=10"
```

### Cara 3: Subscribe MQTT Langsung
```powershell
# Install mosquitto tools terlebih dahulu
mosquitto_sub -h test.mosquitto.org -p 1883 -t "ti2024i/kelompok3/smartflood/data" -v
```

---

## Menghubungkan ESP32

1. Upload kode firmware ke ESP32 (kode terpisah)
2. Pastikan library MQTT sudah terinstall di Arduino/PlatformIO
3. Atur konfigurasi Wi-Fi dan MQTT di firmware
4. Upload dan buka Serial Monitor untuk verifikasi koneksi
5. Pesan di Serial Monitor seperti:
   ```
   WiFi connected. IP: 192.168.x.x
   MQTT connected to test.mosquitto.org
   Published: {"distanceCm":40.0,"status":"SAFE"}
   ```

---

## Rumus Perhitungan

```
waterLevelCm   = clamp(sensorHeightCm - distanceCm, 0, tankDepthCm)
fillPercentage = clamp((waterLevelCm / tankDepthCm) × 100, 0, 100)
volumeLiters   = (length × width × waterLevelCm) / 1000
capacityLiters = (length × width × depth) / 1000
```

### Contoh:
- Tangki: 100cm × 50cm × 100cm
- Sensor height: 100cm, Distance: 40cm
- Water level = 100 - 40 = **60 cm**
- Fill = 60% → **300 liter** dari kapasitas 500 liter

---

## Menjalankan Unit Test

```powershell
# Backend tests
cd "c:\Users\mohre\Documents\Kuliah Dammar\Project\IOT\smart-flood-system\backend"
go test ./internal/calculation/... -v
```

Output yang diharapkan:
```
--- PASS: TestCalculateWaterLevel_EmptyTank (0.00s)
--- PASS: TestCalculateWaterLevel_HalfFull (0.00s)
--- PASS: TestCalculateWaterLevel_SixtyPercent (0.00s)
--- PASS: TestCalculateWaterLevel_ClampNegative (0.00s)
--- PASS: TestIsValidDistance_Zero (0.00s)
--- PASS: TestIsValidDistance_Negative (0.00s)
--- PASS: TestIsValidDistance_NaN (0.00s)
--- PASS: TestCalculateFillPercentage_ZeroDepth (0.00s)
PASS
ok  smartflood/backend/internal/calculation
```

---

## Troubleshooting

### Backend tidak bisa connect ke MQTT

Gejala: Log menampilkan "MQTT connection failed" atau terus "reconnecting"

Penyebab & solusi:
1. **Broker offline** → Test broker publik kadang tidak tersedia. Coba lagi setelah beberapa menit.
2. **Firewall memblokir port 1883** → Periksa Windows Firewall / antivirus.
3. **Topic salah** → Pastikan MQTT_TOPIC di .env sama dengan yang digunakan ESP32.

```powershell
# Test koneksi broker dari komputer
Test-NetConnection test.mosquitto.org -Port 1883
```

### Dashboard tidak update real-time

Gejala: Dashboard terbuka tapi angka tidak berubah

1. Pastikan backend berjalan: `Invoke-RestMethod http://localhost:8080/api/health`
2. Buka DevTools browser → Network → cari request ke `/api/events`
3. Status harus `200 OK` dengan `Content-Type: text/event-stream`
4. Jika CORS error: pastikan FRONTEND_URL di .env backend = `http://localhost:3000`

### Data tampil STALE

Gejala: Dashboard menampilkan indikator data lama

Artinya: tidak ada pesan MQTT baru dalam batas waktu yang dikonfigurasi (default 30 detik).

Cek:
1. Apakah ESP32 masih berjalan dan mengirim data?
2. Apakah koneksi Wi-Fi ESP32 stabil?
3. Apakah broker MQTT masih tersedia?

### Model 3D tangki tidak muncul

1. Pastikan browser mendukung WebGL: https://get.webgl.org
2. Refresh halaman
3. Buka DevTools → Console, cari error Three.js

### ESP32 mengirim data tapi tidak terdeteksi backend

1. Periksa topic MQTT — harus sama persis (case-sensitive)
2. Verifikasi format JSON payload dengan mosquitto_sub
3. Periksa log backend untuk error parsing

---

## Struktur Folder

```
smart-flood-system/
├── backend/
│   ├── cmd/server/main.go          # Entry point
│   ├── internal/
│   │   ├── config/config.go        # Environment config
│   │   ├── models/models.go        # Data structures
│   │   ├── calculation/water.go    # Water math formulas
│   │   ├── calculation/water_test.go # Unit tests
│   │   ├── mqtt/client.go          # MQTT subscriber
│   │   ├── service/service.go      # Business logic
│   │   ├── storage/sqlite.go       # SQLite operations
│   │   ├── api/handlers.go         # HTTP handlers
│   │   └── api/router.go           # Route setup
│   ├── data/                       # SQLite database (gitignored)
│   ├── go.mod
│   ├── .env.example
│   └── .env                        # Local config (gitignored)
├── frontend/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Dashboard page
│   │   └── globals.css
│   ├── components/
│   │   ├── DashboardHeader.tsx
│   │   ├── ConnectionStatus.tsx
│   │   ├── MetricCard.tsx
│   │   ├── MetricGrid.tsx
│   │   ├── TankVisualization.tsx   # R3F wrapper
│   │   ├── TankScene.tsx           # R3F scene
│   │   ├── WaterLevelChart.tsx
│   │   ├── ActivityLog.tsx
│   │   ├── TankConfigForm.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── DemoModeBanner.tsx
│   │   ├── LoadingState.tsx
│   │   └── ErrorState.tsx
│   ├── hooks/
│   │   ├── useSSE.ts
│   │   └── useTankData.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── calculations.ts
│   │   └── utils.ts
│   ├── types/index.ts
│   ├── package.json
│   ├── .env.example
│   └── .env.local                  # Local config (gitignored)
├── docs/
│   ├── architecture.md
│   ├── mqtt-payload.md
│   └── testing.md
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/health | Status kesehatan backend |
| GET | /api/status | Status koneksi + pembacaan terbaru |
| GET | /api/readings/latest | Pembacaan sensor terbaru |
| GET | /api/readings/history | Histori pembacaan (limit & offset) |
| GET | /api/config | Konfigurasi tangki saat ini |
| PUT | /api/config | Update konfigurasi tangki |
| GET | /api/events | SSE stream untuk update real-time |

---

## Catatan Keamanan

- Broker MQTT publik (test.mosquitto.org) tidak menjamin privasi data
- Jangan expose port backend ke internet tanpa autentikasi tambahan
- Jangan commit file .env yang berisi password
- Untuk penggunaan selain akademik, gunakan broker MQTT privat

---

## Lisensi

Proyek akademik — Sistem Informasi / Teknik Informatika
