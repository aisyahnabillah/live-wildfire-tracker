# Live Wildfire Tracker — Prototipe Web Interaktif (Modul 7)

Prototipe web untuk memantau titik api kebakaran hutan Indonesia, dibangun dari rancangan Figma Modul 5 dan struktur HTML semantik Modul 6. Proyek ini bagian dari **VINIX Batch 5 — Modul 7: Transformasi Desain Figma ke Prototipe Web Interaktif**.

- **Repositori:** https://github.com/aisyahnabillah/live-wildfire-tracker
- **Demo (opsional):** `[ISI: URL GitHub Pages bila diaktifkan]`
- **Figma Modul 5 (desain hi-fi):** https://www.figma.com/design/3lHNfBfneuMaeOYvDXB9A8
- **Figma Modul 4 (wireframe):** https://www.figma.com/design/8UF4vOJ2qEslm11hNTrVNw/Live-Wildfire-Tracker---Wireframes
- **PRD:** [`docs/PRD-Live-Wildfire-Tracker.pdf`](docs/PRD-Live-Wildfire-Tracker.pdf)

## Teknologi

HTML5 + CSS + JavaScript murni (tanpa framework dan tanpa langkah build), karena Modul 6 sudah berupa HTML semantik. Komponen pendukung:

- **Leaflet 1.9.4** (disimpan lokal di `vendor/leaflet/`) untuk peta yang bisa di-zoom, dengan tile OpenStreetMap.
- **NASA FIRMS** (`area/csv`, sensor VIIRS SNPP NRT) sebagai sumber data titik api asli.
- **Fungsi serverless `api/firms.js`** sebagai proxy: MAP_KEY disimpan di environment server sehingga tidak terlihat di browser, dan masalah CORS terhindar.
- Google Fonts (Bricolage Grotesque, Public Sans); jika offline, browser memakai font sistem.

## Cara menjalankan lokal

Dapatkan MAP_KEY gratis di https://firms.modaps.eosdis.nasa.gov/api/map_key/

```bash
git clone https://github.com/aisyahnabillah/live-wildfire-tracker.git
cd live-wildfire-tracker
cp .env.example .env        # lalu isi FIRMS_MAP_KEY di .env
node server.js              # buka http://localhost:8080 (perlu Node 18+, tanpa npm install)
```

> `index.html` tidak bisa dibuka langsung lewat `file://` untuk data asli karena `/api/firms` butuh server. Jika API tidak tersedia, aplikasi tetap jalan dengan **data contoh** yang diberi label merah di bawah peta.

**Akun demo:** email apa saja yang valid, kata sandi `wildfire26`.

## Deploy ke Vercel

1. Impor repositori di Vercel (preset **Other**, tanpa build command).
2. Di *Settings > Environment Variables* tambahkan `FIRMS_MAP_KEY` (dan opsional `FIRMS_SOURCE`).
3. Deploy ulang. Fungsi `api/firms.js` otomatis menjadi endpoint `/api/firms` dengan cache 10 menit.

**Jangan pernah meng-commit `.env` atau menaruh key di kode klien.** `.env` sudah ada di `.gitignore`.

## Alur data

1. Browser memanggil `/api/firms`.
2. Fungsi serverless meminta `area/csv/{KEY}/VIIRS_SNPP_NRT/94,-11.5,141.5,6.5/5` (bounding box Indonesia, 5 hari terakhir, batas maksimum endpoint) dan memvalidasi bahwa balasan benar-benar CSV.
3. `parseFirms()` di `js/data.js` mengubah CSV menjadi objek deteksi (waktu UTC diubah ke WIB, confidence `l/n/h` menjadi Rendah/Sedang/Tinggi, titik diberi wilayah).
4. Filter dijalankan di sisi klien sehingga peta berubah seketika tanpa memanggil ulang API.

## Fitur interaktif

| # | Fitur | Lokasi |
|---|-------|--------|
| 1 | Menu hamburger mobile (buka-tutup, `aria-expanded`, tutup dengan Esc) | Header, layar ≤ 760 px |
| 2 | Filter data dinamis: tanggal, tingkat keyakinan, wilayah, FRP minimum; peta dan statistik ikut berubah | Peta Pemantauan |
| 3 | Peta Leaflet (zoom/geser) dan drawer detail titik api saat titik diklik; ukuran titik = FRP, warna = keyakinan | Peta Pemantauan |
| 4 | Form notifikasi 3 langkah dengan validasi dan tombol "Lanjut" yang dinonaktifkan sampai input valid | Aktifkan Notifikasi |
| 5 | Modal konfirmasi sebelum menyimpan notifikasi | Form langkah 3 |
| 6 | Validasi login (pesan error) dan pencarian wilayah (layar "Wilayah Tidak Ditemukan") | Login, Beranda |
| 7 | State kosong saat filter tidak menghasilkan deteksi, dengan tombol "Reset filter" | Peta Pemantauan |

Alur utama: Login → Beranda → Peta Pemantauan → klik titik api → Detail → Aktifkan Notifikasi (3 langkah) → Modal → Sukses.

## Struktur proyek

```
index.html            # semua layar (single page, routing via hash #/...)
api/firms.js          # proxy serverless ke NASA FIRMS (menyimpan MAP_KEY di server)
server.js             # server lokal tanpa dependensi (statis + /api/firms)
vendor/leaflet/       # Leaflet 1.9.4 (disimpan lokal)
css/styles.css        # token warna, tipografi, layout responsif
js/data.js            # wilayah, parser CSV FIRMS, pemuat data, data contoh cadangan
js/app.js             # routing, filter, drawer, stepper, modal, validasi
assets/images/        # logo, ikon SVG, ilustrasi peta Beranda (dari Modul 6)
docs/                 # PRD (PDF)
```

## Keterbatasan

- **Wilayah hanya perkiraan.** FIRMS tidak menyediakan kolom provinsi, sehingga wilayah ditentukan dari kotak koordinat kasar (`WILAYAH` di `js/data.js`), bukan batas administratif resmi. Titik di perbatasan dapat salah label; titik di luar kotak masuk "Wilayah lain Indonesia".
- **Maksimum 5 hari.** Endpoint `area` FIRMS menolak `DAY_RANGE` lebih dari 5, sehingga pilihan "5 hari terakhir" adalah rentang terjauh yang tersedia.
- **Confidence VIIRS** hanya tiga tingkat (l/n/h). Jika `FIRMS_SOURCE` diganti ke MODIS, angka 0-100 dipetakan ke tiga tingkat yang sama (<30, <80, selebihnya), sebuah penyederhanaan.
- **Marker peta tidak bisa difokus dengan keyboard** (digambar di canvas Leaflet). Filter dan form tetap dapat dioperasikan dengan keyboard.
- **Tile OpenStreetMap** dipakai untuk demo berskala kecil sesuai kebijakan penggunaannya; untuk trafik tinggi gunakan penyedia tile berbayar.
- **Notifikasi belum dikirim sungguhan.** Pengaturan hanya disimpan di memori selama sesi (belum ada backend).
- Deteksi satelit adalah anomali termal, bukan konfirmasi kebakaran; disclaimer ini ditampilkan di drawer.

## Kontribusi anggota

| Nama | Peran | Kontribusi |
|------|-------|------------|
| Aisyah Nabillah | Pengerjaan individu | PRD, wireframe (Modul 4), desain Figma (Modul 5), HTML semantik (Modul 6), implementasi prototipe dan dokumentasi (Modul 7) |

> Jika dikerjakan berkelompok, tambahkan baris anggota lain beserta bagian yang mereka kerjakan.

## Log prompt AI

AI yang dipakai: **Claude (Anthropic)** sebagai pair-programmer dalam sesi chat. Prompt disusun bertahap, bukan satu prompt besar.

| Tahap | Ringkasan prompt | Hasil |
|-------|------------------|-------|
| 1. Konteks | Mengunggah brief Modul 7, rubrik, PDF Modul 4 dan 5, serta ZIP HTML Modul 6; meminta jawaban Modul 7 berdasarkan materi sebelumnya. | Claude membaca konten, alur 8 layar, dan data (Kalimantan Tengah/Timur, FRP, WIB). |
| 2. Rencana | "Pilih teknologi paling sederhana yang memenuhi rubrik: minimal 2 aksi interaktif, responsif, tanpa crash." | HTML/CSS/JS murni, satu halaman dengan routing hash. |
| 3. Generasi | "Buat tampilan dari konten Modul 6, tokens visual konsisten, peta dengan titik yang bisa difilter, drawer detail, form 3 langkah, modal, state error/kosong." | Berkas `index.html`, `css/styles.css`, `js/data.js`, `js/app.js`. |
| 4b. Data asli | "Pakai data asli NASA FIRMS dengan key milikku; pola dari repo demo (area/csv, proxy untuk CORS)." | `api/firms.js`, `server.js`, parser CSV, peta Leaflet, label sumber data. |
| 4. Uji | "Jalankan alur login sampai sukses di browser headless dan periksa error konsol serta tampilan mobile." | Dua masalah ditemukan (lihat di bawah). |
| 5. Dokumentasi | "Susun README, PRD PDF, dan riwayat komit." | README ini dan `docs/PRD-Live-Wildfire-Tracker.pdf`. |

## Catatan perbaikan manual

| Temuan | Perbaikan |
|--------|-----------|
| Titik Riau dan Sumatera Selatan saling menimpa sehingga sebagian titik tidak bisa diklik (tes klik gagal). | Ukuran titik diperkecil (10–20 px), sebaran vertikal dipersempit, dan posisi pusat wilayah digeser. |
| Di layar 375 px, peta menjadi sangat kecil dan pesan "Tidak ada deteksi" terpotong. | Pada ≤ 600 px, legenda dan pesan kosong dipindah ke aliran normal di bawah peta. |
| Gambar peta dasar sudah memuat titik oranye bawaan yang membingungkan dengan titik interaktif. | Peta dasar diberi filter grayscale dan opacity 45% agar hanya titik interaktif yang berwarna. |
| Elemen `hidden` tertimpa `display:grid` pada modal dan pesan kosong. | Ditambah aturan `[hidden]{display:none!important}`. |
| Peta gambar statis dan data contoh belum memenuhi tujuan "data asli". | Diganti peta Leaflet dan data NASA FIRMS lewat proxy serverless; data contoh hanya cadangan berlabel. |
| FIRMS dapat membalas HTTP 200 berisi pesan teks (mis. key tidak valid). | Proxy memeriksa bahwa balasan diawali header CSV, jika tidak, aplikasi memakai cadangan dengan alasan yang tampil di layar. |
| Layer peta Leaflet menimpa header dan drawer (z-index). | `.mapbox` diberi `isolation:isolate` dan z-index elemen overlay diatur ulang. |

## Pemetaan ke rubrik

| Pilar | Bukti |
|-------|-------|
| Git dan workflow | Riwayat komit bertahap dengan pesan deskriptif (`git log --oneline`). |
| Fidelitas dan responsif | Token warna/tipografi di `:root`; breakpoint 900 px, 760 px, dan 600 px. |
| Interaktivitas | 7 aksi dinamis pada tabel di atas; tanpa error konsol dalam uji alur penuh (dengan server FIRMS tiruan di sandbox; uji dengan key asli dilakukan di mesin penulis). |
| Dokumentasi dan PRD | README ini dan PRD PDF. |
