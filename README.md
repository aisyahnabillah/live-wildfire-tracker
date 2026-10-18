# Live Wildfire Tracker — Prototipe Web Interaktif (Modul 7)

Prototipe web untuk memantau titik api kebakaran hutan Indonesia, dibangun dari rancangan Figma Modul 5 dan struktur HTML semantik Modul 6. Proyek ini bagian dari **VINIX Batch 5 — Modul 7: Transformasi Desain Figma ke Prototipe Web Interaktif**.

- **Repositori:** `[ISI: URL repositori GitHub publik]`
- **Demo (opsional):** `[ISI: URL GitHub Pages bila diaktifkan]`
- **Figma Modul 5 (desain hi-fi):** https://www.figma.com/design/3lHNfBfneuMaeOYvDXB9A8
- **Figma Modul 4 (wireframe):** https://www.figma.com/design/8UF4vOJ2qEslm11hNTrVNw/Live-Wildfire-Tracker---Wireframes
- **PRD:** [`docs/PRD-Live-Wildfire-Tracker.pdf`](docs/PRD-Live-Wildfire-Tracker.pdf)

## Teknologi

HTML5 + CSS + JavaScript murni (tanpa framework dan tanpa langkah build). Alasannya: Modul 6 sudah berupa HTML semantik, jadi Modul 7 cukup menambahkan gaya visual dan perilaku. Satu-satunya sumber daya eksternal adalah Google Fonts (Bricolage Grotesque dan Public Sans); jika offline, browser memakai font sistem.

## Cara menjalankan lokal

```bash
git clone <URL-repositori>
cd wildfire-tracker
# Opsi 1: buka index.html langsung di browser
# Opsi 2: server lokal
python3 -m http.server 8080     # lalu buka http://localhost:8080
```

**Akun demo:** email apa saja yang valid, kata sandi `wildfire26`.

## Fitur interaktif

| # | Fitur | Lokasi |
|---|-------|--------|
| 1 | Menu hamburger mobile (buka-tutup, `aria-expanded`, tutup dengan Esc) | Header, layar ≤ 760 px |
| 2 | Filter data dinamis: tanggal, tingkat keyakinan, wilayah, FRP minimum; peta dan statistik ikut berubah | Peta Pemantauan |
| 3 | Drawer detail titik api (klik titik pada peta) | Peta Pemantauan |
| 4 | Form notifikasi 3 langkah dengan validasi dan tombol "Lanjut" yang dinonaktifkan sampai input valid | Aktifkan Notifikasi |
| 5 | Modal konfirmasi sebelum menyimpan notifikasi | Form langkah 3 |
| 6 | Validasi login (pesan error) dan pencarian wilayah (layar "Wilayah Tidak Ditemukan") | Login, Beranda |
| 7 | State kosong saat filter tidak menghasilkan deteksi, dengan tombol "Reset filter" | Peta Pemantauan |

Alur utama: Login → Beranda → Peta Pemantauan → klik titik api → Detail → Aktifkan Notifikasi (3 langkah) → Modal → Sukses.

## Struktur proyek

```
index.html            # semua layar (single page, routing via hash #/...)
css/styles.css        # token warna, tipografi, layout responsif
js/data.js            # wilayah dan data contoh titik api (deterministik)
js/app.js             # routing, filter, drawer, stepper, modal, validasi
assets/images/        # logo, ikon SVG, peta dasar (dari Modul 6)
docs/                 # PRD (PDF)
```

## Catatan data dan keterbatasan

- Titik api pada peta adalah **data contoh** yang dibangkitkan secara deterministik, bukan data langsung NASA FIRMS. Integrasi API FIRMS masuk pengembangan lanjutan.
- Peta dasar memakai gambar dari Modul 6 yang dilunakkan (grayscale) agar titik interaktif terbaca; ini bukan peta tile yang bisa di-zoom.
- Pengaturan notifikasi hanya disimpan di memori selama sesi (belum ada backend). Muat ulang halaman akan menghapusnya.

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
| 4. Uji | "Jalankan alur login sampai sukses di browser headless dan periksa error konsol serta tampilan mobile." | Dua masalah ditemukan (lihat di bawah). |
| 5. Dokumentasi | "Susun README, PRD PDF, dan riwayat komit." | README ini dan `docs/PRD-Live-Wildfire-Tracker.pdf`. |

## Catatan perbaikan manual

| Temuan | Perbaikan |
|--------|-----------|
| Titik Riau dan Sumatera Selatan saling menimpa sehingga sebagian titik tidak bisa diklik (tes klik gagal). | Ukuran titik diperkecil (10–20 px), sebaran vertikal dipersempit, dan posisi pusat wilayah digeser. |
| Di layar 375 px, peta menjadi sangat kecil dan pesan "Tidak ada deteksi" terpotong. | Pada ≤ 600 px, legenda dan pesan kosong dipindah ke aliran normal di bawah peta. |
| Gambar peta dasar sudah memuat titik oranye bawaan yang membingungkan dengan titik interaktif. | Peta dasar diberi filter grayscale dan opacity 45% agar hanya titik interaktif yang berwarna. |
| Elemen `hidden` tertimpa `display:grid` pada modal dan pesan kosong. | Ditambah aturan `[hidden]{display:none!important}`. |

## Pemetaan ke rubrik

| Pilar | Bukti |
|-------|-------|
| Git dan workflow | Riwayat komit bertahap dengan pesan deskriptif (`git log --oneline`). |
| Fidelitas dan responsif | Token warna/tipografi di `:root`; breakpoint 900 px, 760 px, dan 600 px. |
| Interaktivitas | 7 aksi dinamis pada tabel di atas; tanpa error konsol dalam uji alur penuh. |
| Dokumentasi dan PRD | README ini dan PRD PDF. |
