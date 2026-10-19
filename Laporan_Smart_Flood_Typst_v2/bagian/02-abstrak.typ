#heading(numbering: none)[Abstrak]

Banjir sering terlambat disadari karena kenaikan muka air tidak dipantau secara terus-menerus. Praktikum ini membangun prototipe _Smart Flood Detection and Early Warning System_ untuk memantau ketinggian air dan memberi peringatan dini bertahap. Sistem memakai sensor ultrasonik HC-SR04 sebagai masukan, ESP32 sebagai pengolah, MQTT sebagai protokol pengiriman data melalui Wi-Fi, LCD 16×2 I2C sebagai tampilan lokal, serta LED hijau, kuning, merah dan buzzer sebagai indikator peringatan. ESP32 mengukur jarak sensor ke permukaan air, mengubahnya menjadi tinggi air, menentukan status SAFE, WARNING, atau DANGER, lalu menampilkan dan menerbitkan hasilnya ke MQTT broker. Sistem ini merupakan prototipe simulasi untuk praktikum IoT dan belum digunakan untuk memantau sungai atau banjir yang sebenarnya.

#block[
  #set par(first-line-indent: 0pt)
  *Kata kunci:* deteksi banjir, peringatan dini, ESP32, HC-SR04, MQTT, LCD 16×2 I2C, Wokwi
]
