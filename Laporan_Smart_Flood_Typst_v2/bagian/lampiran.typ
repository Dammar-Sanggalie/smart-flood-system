#import "/template/components.typ": *

#heading(numbering: none)[Lampiran]

#heading(level: 2, numbering: none)[Lampiran 1. Kode Program ESP32]

Kode program lengkap pada berkas `sketch.ino` yang diunggah dan dijalankan pada simulasi Wokwi disajikan sebagai berikut.

#raw(read("/lampiran/kode-program.ino"), block: true)

#heading(level: 2, numbering: none)[Lampiran 2. Konfigurasi Proyek dan Rangkaian Wokwi]

Seluruh perancangan sirkuit disimulasikan menggunakan platform Wokwi. Informasi spesifikasi berkas proyek adalah sebagai berikut:

- *Tautan Proyek Wokwi:* https://wokwi.com/projects/477733466285817857
- *Pustaka Eksternal (libraries.txt):*
  + `PubSubClient` (oleh Nick O'Leary) — Klien komunikasi MQTT untuk ESP32
  + `LiquidCrystal I2C` (oleh Frank de Brabander) — Pengendali modul LCD 16×2 berbasis antarmuka I2C PCF8574
- *Berkas Konfigurasi Sirkuit (`diagram.json`):*

#raw(read("/lampiran/diagram.json"), block: true)

