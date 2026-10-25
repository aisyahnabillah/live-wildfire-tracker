# Live Wildfire Tracker — Prototipe Web Interaktif (Modul 7)

Prototipe web untuk memantau titik api kebakaran hutan Indonesia, dibangun dari rancangan Figma Modul 5 dan struktur HTML semantik Modul 6. Proyek ini bagian dari **VINIX Batch 5 — Modul 7: Transformasi Desain Figma ke Prototipe Web Interaktif**.

- **Repositori:** https://github.com/aisyahnabillah/live-wildfire-tracker
- **Live web (Modul 8):** `[ISI: URL Vercel setelah deploy]`
- **Figma Modul 5 (desain hi-fi):** https://www.figma.com/design/3lHNfBfneuMaeOYvDXB9A8
- **Figma Modul 4 (wireframe):** https://www.figma.com/design/8UF4vOJ2qEslm11hNTrVNw/Live-Wildfire-Tracker---Wireframes
- **PRD:** [`docs/PRD-Live-Wildfire-Tracker.pdf`](docs/PRD-Live-Wildfire-Tracker.pdf)
- **Dokumentasi Modul 8:** [`docs/Dokumentasi-Modul-8.pdf`](docs/Dokumentasi-Modul-8.pdf)

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
2. Di *Settings > Environment Variables* tambahkan `FIRMS_MAP_KEY`, `SUPABASE_URL`, dan `SUPABASE_SERVICE_KEY` (opsional `FIRMS_SOURCE`).
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

## Modul 8 — Data dinamis dan logika aplikasi

Dikerjakan di branch `feat/dynamic-data` di atas repositori Modul 7, lalu digabung ke `main` lewat Pull Request.

### Sumber data dan layanan form

| Kebutuhan | Layanan | Cara kerja |
|-----------|---------|------------|
| Baca (Read): titik api | NASA FIRMS lewat `api/firms.js` | Data asli 5 hari terakhir, difilter di klien |
| Baca/Tulis (CRUD): langganan notifikasi | **Supabase** (PostgREST) lewat `api/langganan.js` | Form 3 langkah menyimpan, halaman Notifikasi Saya membaca, mengubah, dan menghapus |
| Cadangan form | `localStorage` terstruktur | Dipakai otomatis bila database belum dikonfigurasi atau `/api/langganan` tidak ada; label di halaman menunjukkan mode aktif |

Kunci Supabase (`SUPABASE_SERVICE_KEY`) hanya ada di environment server dan tidak pernah dikirim ke browser. Tabel dibuat dengan `docs/supabase.sql` (RLS aktif tanpa policy, jadi kunci publik tidak bisa mengakses tabel).

### Setup Supabase (opsional tapi disarankan)

1. Buat project di https://supabase.com, lalu jalankan isi `docs/supabase.sql` di *SQL Editor*.
2. Salin *Project URL* dan *service_role key* (Settings > API) ke `.env` lokal atau Environment Variables Vercel sebagai `SUPABASE_URL` dan `SUPABASE_SERVICE_KEY`.
3. Muat ulang aplikasi. Halaman Notifikasi Saya akan menampilkan "Disimpan di database."

### Panduan mencoba (untuk mentor)

1. Masuk dengan email apa saja yang valid dan kata sandi `wildfire26`.
2. **Peta Pemantauan:** ubah filter tanggal, keyakinan, wilayah, dan FRP; klik titik untuk membuka detail. Matikan jaringan atau gunakan key salah untuk melihat state error dengan tombol "Coba lagi".
3. **Notifikasi Saya** (menu atas): cari kata kunci (mis. `riau`, `budi`), filter keyakinan, dan cari kata yang tidak ada (mis. `zzz`) untuk melihat state kosong dengan tombol Reset.
4. **Tambah notifikasi** (form 3 langkah): kosongkan email, isi `salah@email`, lalu isi email valid. Pesan error muncul tepat di bawah kolom, tombol berubah menjadi "Mengirim…" dan terkunci saat dikirim, lalu muncul toast.
5. **Ubah** dan **Hapus** pada kartu notifikasi (hapus meminta konfirmasi).

### Pemetaan ke target Modul 8

| Target | Implementasi |
|--------|--------------|
| Data dinamis dan filter | Kartu fitur Beranda, kartu statistik, titik peta, opsi wilayah, langkah form, dan daftar notifikasi semuanya dibuat dari array dengan `.map()` (tidak ada HTML berulang yang ditulis tangan). Pencarian kata kunci dan filter keyakinan pada daftar; filter lengkap pada peta. |
| Form dan validasi | `.trim()`, huruf kecil pada email, pemadatan spasi pada pencarian, validasi format email (tanpa karakter HTML), wilayah wajib, keyakinan wajib, FRP 0-150. Pesan error tepat di bawah kolom (`aria-invalid`, `role="alert"`). Validasi diulang di server (`api/langganan.js`). |
| Skeleton dan toast | Skeleton untuk kartu statistik dan daftar, spinner pada peta, tombol "Mengirim…/Menghapus…", state kosong, state error dengan "Coba lagi ↻", dan toast sendiri (tanpa `alert()`). |

### Keamanan

- `.env` ada di `.gitignore`; hanya `.env.example` yang di-commit.
- Semua teks dari data (email, nama wilayah) di-escape sebelum masuk ke `innerHTML`.
- API memeriksa identitas perangkat (UUID), membatasi 20 notifikasi per perangkat, dan tidak mengembalikan kolom `owner`.

## Struktur proyek

```
index.html            # semua layar (single page, routing via hash #/...)
api/firms.js          # proxy serverless ke NASA FIRMS (menyimpan MAP_KEY di server)
api/langganan.js      # CRUD langganan notifikasi ke Supabase (validasi di server)
server.js             # server lokal tanpa dependensi (statis + /api/firms)
vendor/leaflet/       # Leaflet 1.9.4 (disimpan lokal)
css/styles.css        # token warna, tipografi, layout responsif
js/data.js            # wilayah, parser CSV FIRMS, pemuat data, data contoh cadangan
js/app.js             # routing, filter, drawer, stepper, modal, validasi
assets/images/        # logo, ikon SVG, ilustrasi peta Beranda (dari Modul 6)
docs/                 # PRD, Dokumentasi Modul 8 (PDF), supabase.sql
```

## Keterbatasan

- **Wilayah hanya perkiraan.** FIRMS tidak menyediakan kolom provinsi, sehingga wilayah ditentukan dari kotak koordinat kasar (`WILAYAH` di `js/data.js`), bukan batas administratif resmi. Titik di perbatasan dapat salah label; titik di luar kotak masuk "Wilayah lain Indonesia".
- **Maksimum 5 hari.** Endpoint `area` FIRMS menolak `DAY_RANGE` lebih dari 5, sehingga pilihan "5 hari terakhir" adalah rentang terjauh yang tersedia.
- **Confidence VIIRS** hanya tiga tingkat (l/n/h). Jika `FIRMS_SOURCE` diganti ke MODIS, angka 0-100 dipetakan ke tiga tingkat yang sama (<30, <80, selebihnya), sebuah penyederhanaan.
- **Marker peta tidak bisa difokus dengan keyboard** (digambar di canvas Leaflet). Filter dan form tetap dapat dioperasikan dengan keyboard.
- **Tile OpenStreetMap** dipakai untuk demo berskala kecil sesuai kebijakan penggunaannya; untuk trafik tinggi gunakan penyedia tile berbayar.
- **Notifikasi belum dikirim sungguhan.** Pengaturan tersimpan (database atau localStorage), tetapi belum ada layanan pengiriman email/push.
- **Tanpa akun pengguna sungguhan.** Login hanya demo. Langganan dipisahkan per perangkat memakai UUID anonim di browser, bukan per akun; siapa pun yang mengetahui UUID itu dapat mengaksesnya. Untuk produksi gunakan Supabase Auth.
- **Email adalah data pribadi.** Tabel `langganan` menyimpannya; batasi akses dashboard Supabase dan hapus data uji.
- **Toast buatan sendiri.** Proyek ini tanpa React, sehingga Sonner/Hot-Toast tidak dipakai; komponen toast sendiri memakai `role="status"`/`role="alert"`.
- **Mode localStorage hanya berlaku per browser** dan hilang bila data situs dihapus.
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
| 5. Modul 8 | "Kunci tampilan lama (pertahankan seluruh class). Ubah daftar statis jadi data dinamis dengan .map(), tambah halaman CRUD Notifikasi Saya, validasi + sanitasi form, skeleton/empty/error/toast." Dikerjakan bertahap: API dan SQL, markup + CSS state, logika, lalu dokumentasi. | `api/langganan.js`, halaman Notifikasi Saya, komponen toast/skeleton. |
| 6. Dokumentasi | "Susun README, PRD PDF, dan riwayat komit." | README ini dan `docs/PRD-Live-Wildfire-Tracker.pdf`. |

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

## Catatan perbaikan manual (Modul 8)

| Temuan | Perbaikan |
|--------|-----------|
| Email seperti `<b>x</b>@mail.co` lolos validasi (aman karena di-escape, tetapi seharusnya ditolak). | Regex email diperketat di klien dan server (hanya huruf, angka, `._%+-`). |
| Hosting statis tanpa `/api` akan membuat form gagal total. | Klien beralih otomatis ke localStorage pada respons 501/404 atau jaringan gagal, dengan label mode di halaman. |
| Data dari penyimpanan dirender lewat `innerHTML`. | Semua nilai dinamis di-escape (`esc()`), dan ID divalidasi sebagai UUID di server. |

## Pemetaan ke rubrik

| Pilar | Bukti |
|-------|-------|
| Git dan workflow | Riwayat komit bertahap dengan pesan deskriptif (`git log --oneline`). |
| Fidelitas dan responsif | Token warna/tipografi di `:root`; breakpoint 900 px, 760 px, dan 600 px. |
| Interaktivitas | 7 aksi dinamis pada tabel di atas; tanpa error konsol dalam uji alur penuh (dengan server FIRMS tiruan di sandbox; uji dengan key asli dilakukan di mesin penulis). |
| Dokumentasi dan PRD | README ini, PRD PDF, dan Dokumentasi Modul 8 PDF. |
