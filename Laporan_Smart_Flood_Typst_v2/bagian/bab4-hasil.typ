#import "/template/components.typ": *
#import "/config/gambar.typ": *

= Hasil dan Pembahasan

== Skenario Pengujian Sistem

Pengujian prototipe dilakukan melalui simulasi interaktif pada Wokwi dengan memanipulasi slider jarak objek pada sensor ultrasonik HC-SR04 dari kondisi air tenang hingga kondisi kritis dan gangguan perangkat keras. Hasil respons sistem untuk setiap skenario dirangkum pada @tbl-uji.

#figure(
  tabel(
    (0.9fr, 0.9fr, 1.1fr, 0.9fr, 1fr, 1.4fr),
    ("Jarak Sensor", "Tinggi Air", "Status Sistem", "Indikator LED", "Alarm Buzzer", "Muatan Pesan MQTT (Payload)"),
    [70,0 cm], [30,0 cm], [SAFE], [Hijau (ON)], [Mati], [`{"distance_cm":70.0,"water_level_cm":30.0,"status":"SAFE"}`],
    [50,0 cm], [50,0 cm], [WARNING], [Kuning (ON)], [Mati], [`{"distance_cm":50.0,"water_level_cm":50.0,"status":"WARNING"}`],
    [40,0 cm], [60,0 cm], [WARNING], [Kuning (ON)], [Mati], [`{"distance_cm":40.0,"water_level_cm":60.0,"status":"WARNING"}`],
    [20,0 cm], [80,0 cm], [DANGER], [Merah (ON)], [Aktif (1000 Hz)], [`{"distance_cm":20.0,"water_level_cm":80.0,"status":"DANGER"}`],
    [10,0 cm], [90,0 cm], [DANGER], [Merah (ON)], [Aktif (1000 Hz)], [`{"distance_cm":10.0,"water_level_cm":90.0,"status":"DANGER"}`],
    [1,0 cm (< 2 cm)], [100,0 cm], [DANGER], [Merah (ON)], [Aktif (1000 Hz)], [`{"distance_cm":1.0,"water_level_cm":100.0,"status":"DANGER"}`],
    [> 400 cm / putus], [Invalid], [SENSOR_ERROR], [Merah (ON)], [Mati], [`{"status":"SENSOR_ERROR"}`],
  ),
  caption: [Skenario pengujian simulasi, respons aktuator, dan data telemetri MQTT],
  kind: table,
) <tbl-uji>

== Tampilan Keluaran Antarmuka Pengguna

Respons sistem dapat dipantau secara langsung melalui dua media utama: modul LCD 16×2 I2C pada perangkat fisik lokal dan antarmuka konsol Serial Monitor pada komputer pemantau.

=== Tampilan Layar LCD 16×2 I2C Tiga Halaman

Modul penampil LCD 16×2 secara berkesinambungan mengganti informasi setiap 2,5 detik (2500 ms) melalui tiga halaman berputar:
+ *Halaman Pengukuran:* Menampilkan jarak sensor dan kalkulasi tinggi air secara presisi dalam satuan sentimeter.
+ *Halaman Status:* Menampilkan status keamanan (`STATUS: SAFE`, `STATUS: WARNING`, atau `STATUS: DANGER`) beserta pesan peringatan singkat (`Air normal`, `Air meninggi!`, atau `BAHAYA BANJIR!`).
+ *Halaman Jaringan:* Menampilkan status koneksi nirkabel `WiFi: ONLINE` dan `MQTT: ONLINE` sehingga operator dapat langsung memverifikasi ketersediaan jalur komunikasi internet.

Visualisasi bentuk antarmuka ketiga halaman layar LCD 16×2 ditunjukkan pada @gbr-lcd.

#figure(
  image(fig-lcd, width: 85%),
  caption: [Visualisasi antarmuka tiga halaman berputar pada layar LCD 16×2 I2C],
) <gbr-lcd>

=== Tampilan Log Serial Monitor dan Telemetri MQTT

Konsol Serial Monitor (kecepatan baud 115200 bps) mencetak rekapitulasi status berkala setiap 1000 ms yang memuat pembacaan jarak, estimasi ketinggian air, status sistem, kondisi tautan Wi-Fi, serta koneksi broker MQTT. Selain itu, setiap 2000 ms, mikrokontroler mencetak laporan transaksi penerbitan data ke broker MQTT (`[MQTT] Publish: OK`) beserta nama topik `ti2024i/kelompok3/smartflood/data` dan isi string JSON. Tampilan log Serial Monitor dan data telemetri MQTT diilustrasikan pada @gbr-serial.

#figure(
  image(fig-serial, width: 85%),
  caption: [Rekaman konsol Serial Monitor dan pengiriman data telemetri MQTT],
) <gbr-serial>

== Pembahasan

Berdasarkan hasil pengujian simulasi pada @tbl-uji, sistem berhasil memenuhi seluruh spesifikasi fungsional yang dirancang:

+ *Peringatan Berjenjang yang Efektif:* Pembagian batas siaga menjadi tingkatan SAFE, WARNING, dan DANGER memberikan waktu antisipasi yang proporsional bagi warga. Pada level WARNING (ketinggian air 50–79 cm), LED kuning menyala tanpa membunyikan buzzer sehingga memberikan tanda awal siaga tanpa menimbulkan kepanikan suara. Saat memasuki level DANGER ($h >= 80$ cm), LED merah menyala bersamaan dengan nada buzzer 1000 Hz sebagai peringatan darurat evakuasi.
+ *Stabilitas Jalur Komunikasi Perangkat Keras:* Pemindahan alokasi pin buzzer ke GPIO 14 terbukti berhasil menjaga keutuhan sinyal bus I2C pada pin GPIO 21 (SDA) dan GPIO 22 (SCL). Komunikasi dengan chip adapter LCD PCF8574 berlangsung mulus tanpa ada data korup atau kedipan layar (_flicker_).
+ *Eksekusi Simultan Tanpa Delay Pemblokir:* Penggunaan fungsi pewaktu `millis()` untuk seluruh penjadwalan berkala (sensor 500 ms, LCD 250 ms/2500 ms, Serial 1000 ms, dan MQTT 2000 ms) memastikan mikrokontroler tetap responsif terhadap pembacaan sinyal ultrasonik tanpa jeda instruksi _blocking_.
+ *Penanganan Kondisi Anomali dan Kesalahan:* Perlakuan khusus terhadap jarak ekstrem di bawah 2 cm berhasil melindungi model dari zona buta sensor ultrasonik dengan langsung menetapkan status bahaya maksimal (100 cm). Selain itu, saat sensor mengalami kendala fisik (kabel terlepas atau di luar jangkauan 400 cm), program secara otomatis menerbitkan muatan darurat `{"status":"SENSOR_ERROR"}` dan menyalakan LED merah tanpa membunyikan buzzer, sehingga teknisi dapat membedakan kerusakan sensor dari peristiwa banjir nyata.

