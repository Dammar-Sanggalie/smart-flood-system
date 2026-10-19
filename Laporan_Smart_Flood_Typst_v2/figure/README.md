# Panduan Gambar

Berkas SVG berikut telah disesuaikan dengan diagram sirkuit dan keluaran kode program Wokwi (`https://wokwi.com/projects/477733466285817857`):

| Berkas Gambar | Tujuan | Konten yang Ditampilkan |
|---|---|---|
| `placeholder-rangkaian-wokwi.svg` | Gambar pada Bab 3 | Skema rangkaian lengkap Wokwi: ESP32 DevKit-C V4, HC-SR04, LCD 16×2 I2C (0x27), 3 LED + resistor 220 Ω, Buzzer (GPIO 14), dan MQTT broker |
| `placeholder-lcd-16x2.svg` | Gambar pada Bab 4 | Visualisasi 3 halaman berputar pada LCD 16×2: Telemetri fisis, Status siaga, dan Status koneksi IoT |
| `placeholder-serial-monitor-mqtt.svg` | Gambar pada Bab 4 | Log konsol Serial Monitor (115200 baud) dan payload JSON MQTT pada subscriber client |

## Cara Mengganti dengan Screenshot Langsung

Jika Anda ingin menggunakan screenshot tangkapan layar langsung dari browser Wokwi:
1. Tangkap screenshot (format PNG atau JPG) dari simulasi Wokwi.
2. Simpan berkas ke dalam folder `figure/` (misalnya `figure/wokwi-screenshot.png`).
3. Buka berkas `config/gambar.typ` lalu ubah variabel path gambar terkait.
4. Kompilasi ulang dokumen Typst:
   ```bash
   typst compile main.typ laporan-smart-flood.pdf
   ```

`logo-unesa.png` adalah logo asli dari ZIP referensi; jangan diganti.
