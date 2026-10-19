# Laporan Praktikum IoT — Smart Flood Detection and Early Warning System

Kelompok 3 · TI 2024I · Universitas Negeri Surabaya

## Kompilasi
Butuh **Typst 0.13 atau lebih baru** (untuk paragraf menjorok di semua paragraf).
```bash
typst compile main.typ laporan-smart-flood.pdf
```
Font: Times New Roman; otomatis memakai Liberation Serif/Tinos bila tidak tersedia.

## Struktur folder
```
main.typ                 file utama: urutan bagian laporan
template/
  style.typ              gaya: hitam, 12 pt, margin, spasi, paragraf menjorok
  components.typ         komponen: tabel, kotak diagram, panah
config/
  identitas.typ          judul, anggota, dosen, tahun, tanggal
  gambar.typ             path semua gambar
bagian/
  00-cover.typ           sampul
  01-kata-pengantar.typ
  02-abstrak.typ
  03-daftar.typ          daftar isi, daftar gambar, daftar tabel (otomatis)
  bab1-pendahuluan.typ
  bab2-landasan-teori.typ
  bab3-perancangan.typ
  bab4-hasil.typ
  bab5-penutup.typ
  daftar-pustaka.typ
  lampiran.typ
lampiran/kode-program.ino  tempel kode ESP32 di sini (tampil di Lampiran 1)
figure/                  logo UNESA dan placeholder gambar
```

## Pengaturan format
- Warna: hitam penuh (teks, garis tabel, diagram, kode).
- Font: Times New Roman 12 pt (kode program 10 pt agar tidak terpotong).
- Margin: kiri 4 cm, atas 3 cm, kanan 3 cm, bawah 3 cm.
- Paragraf: rata kiri-kanan, baris pertama menjorok 1,25 cm, spasi 1,5.
- Nomor halaman: sampul tanpa nomor, bagian awal i, ii, iii, isi mulai 1.
- Ubah semua itu di `template/style.typ`.

## Mengganti gambar
Salin screenshot ke `figure/`, lalu ubah path di `config/gambar.typ`.
`logo-unesa.png` adalah logo asli; jangan diganti.

## Sinkronisasi Proyek Wokwi (SMART FLOOD)
Laporan ini telah disesuaikan sepenuhnya dengan proyek simulasi Wokwi (`SMART FLOOD`):
- *Tautan Proyek Wokwi:* https://wokwi.com/projects/477733466285817857
- *Penetapan Pin:* TRIG GPIO 5, ECHO GPIO 18, LED Hijau GPIO 25, LED Kuning GPIO 26, LED Merah GPIO 27, Buzzer GPIO 14, LCD SDA GPIO 21, LCD SCL GPIO 22.
- *Logika Ambang Batas:* SAFE (< 50 cm), WARNING (50–79 cm), DANGER ($>= 80$ cm & $< 2$ cm), SENSOR_ERROR ($> 400$ cm / timeout).
- *Antarmuka LCD:* 3 halaman rotasi berkala (telemetri fisis, status siaga, konektivitas).
- *Telemetri MQTT:* Broker `test.mosquitto.org:1883`, topik `ti2024i/kelompok3/smartflood/data`.
- *Lampiran:* Lampiran 1 memuat kode lengkap `sketch.ino`, Lampiran 2 memuat berkas konfigurasi sirkuit `diagram.json` dan pustaka.

