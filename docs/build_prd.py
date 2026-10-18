from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether
INK=colors.HexColor('#14212b'); EMB=colors.HexColor('#c2410c'); LINE=colors.HexColor('#d3d9d8'); BG=colors.HexColor('#eef0ef')
ss=getSampleStyleSheet()
B=ParagraphStyle('B',parent=ss['Normal'],fontName='Helvetica',fontSize=10,leading=14.5,textColor=INK)
S=ParagraphStyle('S',parent=B,fontSize=8.8,leading=12)
H1=ParagraphStyle('H1',parent=B,fontName='Helvetica-Bold',fontSize=14,leading=18,spaceBefore=14,spaceAfter=6,textColor=EMB)
H2=ParagraphStyle('H2',parent=B,fontName='Helvetica-Bold',fontSize=11,spaceBefore=8,spaceAfter=3)
T=ParagraphStyle('T',parent=B,fontName='Helvetica-Bold',fontSize=26,leading=30)
C=ParagraphStyle('C',parent=S,textColor=colors.HexColor('#5a6770'),alignment=1)
def P(t,s=B): return Paragraph(t,s)
def tbl(rows,w,head=True):
    d=[[P(str(c),S) for c in r] for r in rows]
    if head: d[0]=[P('<b>%s</b>'%c,S) for c in rows[0]]
    t=Table(d,colWidths=[x*cm for x in w],repeatRows=1 if head else 0)
    st=[('GRID',(0,0),(-1,-1),.5,LINE),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4)]
    if head: st.append(('BACKGROUND',(0,0),(-1,0),BG))
    t.setStyle(TableStyle(st)); return t
def img(p,w):
    from PIL import Image as I
    a,b=I.open(p).size; return Image(p,width=w*cm,height=w*cm*b/a)
def foot(c,d):
    c.saveState(); c.setFont('Helvetica',8); c.setFillColor(colors.grey)
    c.drawString(2*cm,1.2*cm,'PRD - Live Wildfire Tracker - VINIX Batch 5, Modul 7'); c.drawRightString(19*cm,1.2*cm,'Halaman %d'%d.page); c.restoreState()
s=[]
s+= [Spacer(1,3*cm),P('Product Requirement Document',ParagraphStyle('k',parent=S,textColor=EMB,fontName='Helvetica-Bold',fontSize=11)),P('Live Wildfire Tracker',T),Spacer(1,.3*cm),
 P('Prototipe web interaktif pemantauan titik api kebakaran hutan Indonesia',ParagraphStyle('sub',parent=B,fontSize=13,leading=18)),Spacer(1,1*cm),
 tbl([['Penyusun','Aisyah Nabillah (Entry) - BINUS University'],['Program','VINIX Batch 5 - Modul 7: Transformasi Desain Figma ke Prototipe Web Interaktif'],
 ['Versi / tanggal','1.0 / 18 Oktober 2026'],['Status','Prototipe fungsional (data asli NASA FIRMS)'],
 ['Repositori GitHub','https://github.com/aisyahnabillah/live-wildfire-tracker'],['Figma Modul 5','https://www.figma.com/design/3lHNfBfneuMaeOYvDXB9A8'],
 ['Figma wireframe Modul 4','https://www.figma.com/design/8UF4vOJ2qEslm11hNTrVNw/Live-Wildfire-Tracker---Wireframes']],[4,12.5],head=False),PageBreak()]

s+= [P('1. Ringkasan produk',H1),
 P('Live Wildfire Tracker adalah web yang menampilkan deteksi titik api (hotspot) dari satelit NASA FIRMS (VIIRS/MODIS) di atas peta Indonesia. Pengguna dapat menyaring deteksi berdasarkan tanggal, tingkat keyakinan, wilayah, dan FRP minimum, melihat detail satu titik, lalu mengaktifkan notifikasi untuk wilayah yang dipantau.'),
 P('Dokumen ini menjadi acuan implementasi prototipe Modul 7, yang mengubah desain Figma (Modul 5) dan HTML semantik (Modul 6) menjadi aplikasi web yang dapat diuji.'),
 P('2. Masalah dan tujuan',H1),
 P('<b>Masalah.</b> Data titik api dari satelit tersedia, tetapi penyajiannya penuh istilah teknis (confidence, FRP) dan menyulitkan petugas lapangan atau pemantau wilayah untuk cepat memutuskan wilayah mana yang perlu ditindaklanjuti.'),
 P('<b>Tujuan produk.</b>'),
 tbl([['Tujuan','Ukuran keberhasilan'],
 ['Pengguna memahami fungsi web dalam 5 detik pertama','Hero menampilkan judul, penjelasan satu kalimat, dan tombol utama di layar pertama'],
 ['Pengguna menyaring titik api tanpa bingung','Filter langsung memperbarui peta tanpa tombol submit; maksimal 4 kontrol'],
 ['Pengguna dapat berlangganan notifikasi wilayah','Form 3 langkah selesai tanpa error; ringkasan ditampilkan di layar sukses'],
 ['Tidak ada jalan buntu','Setiap kondisi gagal/kosong punya tombol keluar (reset/cari lagi)']],[6.5,10]),
 P('3. Target pengguna',H1),
 P('<b>Persona utama: Nia, pemantau wilayah di instansi kebencanaan (contoh email nia@bmkg.go.id).</b> Membuka web di laptop kantor dan ponsel saat di lapangan. Butuh melihat sebaran titik api terbaru, menilai seberapa serius satu deteksi, dan diberi tahu otomatis bila ada deteksi baru di wilayahnya. Tidak ingin membaca istilah teknis tanpa penjelasan.'),
 P('4. Ruang lingkup',H1),
 tbl([['Termasuk (Modul 7)','Tidak termasuk'],
 ['8 layar dari Modul 5: Login, Login error, Beranda, Peta, Detail, Form notifikasi (3 langkah), Modal konfirmasi, Sukses; plus Tentang Data dan Wilayah Tidak Ditemukan; data asli NASA FIRMS lewat proxy serverless','Riwayat deteksi lebih dari 5 hari; prediksi dan analisis risiko'],
 ['Filter, drawer, stepper, modal, hamburger menu, validasi, state kosong','Autentikasi server dan penyimpanan basis data'],
 ['Responsif 375 px sampai 1440 px','Pengiriman email notifikasi sungguhan']],[8.5,8]),
 P('5. User flow',H1),
 P('Alur mengikuti diagram Modul 4 dan memuat tiga titik keputusan:'),
 tbl([['Langkah','Keputusan / hasil'],
 ['1. Buka Beranda, ketik wilayah, tekan Cari','Keputusan 1 - Wilayah ditemukan? Ya: Peta dengan filter wilayah terisi. Tidak: layar "Wilayah Tidak Ditemukan" dengan Cari Lagi dan Reset Pencarian'],
 ['2. Atur filter tanggal, keyakinan, wilayah, FRP','Keputusan 2 - Ada deteksi sesuai filter? Ya: titik tampil. Tidak: state kosong dengan tombol Reset filter'],
 ['3. Klik satu titik api','Drawer Detail: wilayah, koordinat, waktu, keyakinan, FRP, disclaimer'],
 ['4. Klik "Aktifkan Notifikasi Wilayah Ini"','Keputusan 3 - Lanjut? Ya: form 3 langkah (wilayah, ambang, email) lalu modal konfirmasi lalu layar Sukses. Tidak: Tutup/Batal kembali ke peta']],[6,10.5]),
 ]

s+= [P('6. Kebutuhan fungsional',H1),
 tbl([['ID','Kebutuhan','Prioritas','Kriteria penerimaan'],
 ['F1','Login dengan validasi','Tinggi','Email tidak valid atau sandi salah menampilkan pesan error; berhasil menuju Peta'],
 ['F2','Pencarian wilayah (Beranda dan layar error)','Tinggi','Wilayah cocok membuka Peta ter-filter; tidak cocok membuka layar error; tombol Cari Lagi nonaktif bila kosong; maksimal 60 karakter'],
 ['F3','Filter peta','Tinggi','Satu pilihan aktif per grup chip; peta dan 4 kartu statistik berubah; indikator "Memperbarui..." tampil singkat'],
 ['F4','Titik api pada peta (data asli)','Tinggi','Titik berasal dari NASA FIRMS (VIIRS, 5 hari, Indonesia); peta dapat di-zoom; ukuran = FRP, warna = keyakinan; klik membuka drawer'],
 ['F11','Sumber dan cadangan data','Tinggi','Label sumber tampil; bila API gagal, data contoh ditampilkan dengan label peringatan dan alasan kegagalan'],
 ['F5','Drawer detail','Tinggi','Terbuka dari kanan; ditutup via tombol x, Tutup, area gelap, atau Esc; fokus kembali ke titik'],
 ['F6','Form notifikasi 3 langkah','Tinggi','Wilayah terisi otomatis dari drawer; Lanjut nonaktif sampai input valid; langkah terakhir berlabel "Simpan Pengaturan"'],
 ['F7','Modal konfirmasi','Sedang','Menampilkan ringkasan; Batal menutup modal; Aktifkan menuju Sukses'],
 ['F8','Layar Sukses','Sedang','Ringkasan wilayah, ambang, metode; tombol ke Dashboard; link "Ubah pengaturan" hanya bila sudah tersimpan'],
 ['F9','Menu hamburger mobile','Tinggi','Muncul pada layar sampai 760 px; membuka dan menutup menu; label aksesibel berubah'],
 ['F10','State kosong filter','Sedang','Pesan jelas dan tombol Reset filter mengembalikan filter bawaan']],[1,3.8,1.6,10.1]),
 P('7. Kebutuhan non-fungsional',H1),
 tbl([['Aspek','Target'],
 ['Responsif','Tanpa layout rusak pada 375, 768, 1280, dan 1440 px; breakpoint 900, 760, 600 px'],
 ['Aksesibilitas','HTML semantik, label pada semua input, fokus terlihat, area sentuh minimal 40-44 px, menghormati prefers-reduced-motion, kontras teks memadai'],
 ['Keandalan','Tidak ada error JavaScript pada alur penuh Login sampai Sukses'],
 ['Performa','Tanpa framework dan build; filter di sisi klien; respons API di-cache 10 menit; marker digambar di canvas'],
 ['Keamanan','MAP_KEY hanya di environment server; .env tidak di-commit; proxy memvalidasi balasan'],
 ['Bahasa','Antarmuka Bahasa Indonesia; tombol memakai kata kerja jelas (Cari, Simpan Pengaturan)']],[3.5,13]),
 P('8. Desain dan token visual',H1),
 P('Desain mengikuti rancangan Figma Modul 5 dan struktur wireframe Modul 4 (tata letak, hierarki, perilaku komponen). Token berikut didefinisikan sebagai CSS custom properties di <font face="Courier">css/styles.css</font>.'),
 tbl([['Token','Nilai','Penggunaan'],
 ['--ink','#14212B','Teks, header, chip aktif'],['--ember','#C2410C','Tombol utama, aksen navigasi'],['--bg / --card','#EEF0EF / #FFFFFF','Latar halaman / kartu'],
 ['--r / --s / --t','#E8B230 / #EC7A1F / #B3261E','Keyakinan Rendah / Sedang / Tinggi (juga legenda)'],
 ['Tipografi','Bricolage Grotesque (judul), Public Sans (isi)','Dengan font cadangan sistem']],[3,5.5,8]),
 P('<b>Catatan jujur:</b> berkas PDF Modul 5 hanya memuat tautan Figma, sehingga nilai token di atas ditetapkan dari wireframe Modul 4 dan konten Modul 6. Sebelum pengumpulan, bandingkan dengan nilai warna/tipografi di file Figma Modul 5 dan perbarui token bila berbeda.',S),
 ]

s+= [P('9. Teknologi dan arsitektur',H1),
 P('HTML5, CSS, dan JavaScript murni; peta memakai Leaflet 1.9.4 (disimpan lokal) dengan tile OpenStreetMap. Satu halaman (<font face="Courier">index.html</font>) berisi semua layar dan routing memakai hash. Browser memanggil <font face="Courier">/api/firms</font>, fungsi serverless (<font face="Courier">api/firms.js</font>) meneruskan permintaan ke NASA FIRMS dengan MAP_KEY dari environment, lalu <font face="Courier">parseFirms()</font> mengubah CSV menjadi objek deteksi yang difilter di sisi klien.'),
 tbl([['Parameter FIRMS','Nilai'],['Endpoint','area/csv/{MAP_KEY}/VIIRS_SNPP_NRT/94,-11.5,141.5,6.5/5'],['Cakupan','Indonesia, 5 hari terakhir (batas maksimum endpoint)'],['Confidence','VIIRS l/n/h menjadi Rendah/Sedang/Tinggi'],['Waktu','acq_date + acq_time (UTC) ditampilkan dalam WIB'],['Wilayah','Kotak koordinat kasar per provinsi (bukan batas resmi)']],[4,12.5]),
 P('10. Hasil implementasi',H1),
 img('docs/img/beranda-desktop.png',13),P('Gambar 1. Beranda (desktop)',C),Spacer(1,.3*cm),
 img('docs/img/form-langkah2.png',13),P('Gambar 2. Form notifikasi langkah 2 (atur ambang)',C),
 PageBreak(),
 img('docs/img/sukses.png',13),P('Gambar 3. Layar sukses dengan ringkasan pengaturan',C),Spacer(1,.3*cm),
 img('docs/img/mobile-menu.png',5.2),P('Gambar 4. Menu hamburger pada layar 375 px',C),
 PageBreak(),
 P('11. Strategi AI dan log prompt',H1),
 P('AI yang dipakai: Claude (Anthropic) sebagai pair-programmer. Prompt dibuat bertahap; log lengkap ada di README.'),
 tbl([['Tahap','Prompt (ringkas)','Hasil'],
 ['Konteks','Unggah brief Modul 7, rubrik, PDF Modul 4 dan 5, ZIP Modul 6; minta jawaban Modul 7','AI membaca alur 8 layar, konten, dan data'],
 ['Rencana','Pilih teknologi paling sederhana yang memenuhi rubrik','HTML/CSS/JS murni dengan routing hash'],
 ['Generasi','Buat tampilan dari konten Modul 6 dengan filter, drawer, stepper, modal, state error/kosong','4 berkas kode'],
 ['Data asli','Pakai NASA FIRMS dengan key milik penulis; pola dari repo demo (area/csv, proxy CORS)','Proxy serverless, parser CSV, peta Leaflet'],
 ['Uji','Jalankan alur login sampai sukses di browser headless; cek error dan mobile','2 bug ditemukan lalu diperbaiki'],
 ['Dokumentasi','Susun README, PRD, riwayat komit','Dokumen ini']],[2.3,8,6.2]),
 P('12. Catatan perbaikan manual',H1),
 tbl([['Temuan','Perbaikan'],
 ['Titik Riau dan Sumatera Selatan saling menimpa; sebagian tidak bisa diklik','Titik diperkecil, sebaran dipersempit, pusat wilayah digeser'],
 ['Peta mobile terlalu kecil dan pesan kosong terpotong','Legenda dan pesan kosong dipindah ke bawah peta pada layar sampai 600 px'],
 ['Peta dasar memuat titik oranye yang mirip titik interaktif','Peta diberi grayscale dan opacity 45%'],
 ['Elemen hidden tertimpa display:grid','Aturan [hidden]{display:none!important}'],
 ['Peta statis dan data contoh belum memenuhi tujuan data asli','Leaflet dan data NASA FIRMS lewat proxy; data contoh hanya cadangan berlabel'],
 ['FIRMS bisa membalas HTTP 200 berisi pesan teks','Proxy memeriksa header CSV; aplikasi menampilkan alasan kegagalan']],[8,8.5]),
 P('13. Rencana pengujian',H1),
 tbl([['Skenario','Hasil yang diharapkan','Status'],
 ['Login sandi salah lalu benar','Error tampil lalu masuk ke Peta','Lulus'],
 ['Muat data dari proxy (FIRMS tiruan, 600 titik)','Peta, statistik, dan label sumber tampil','Lulus'],
 ['Filter keyakinan Tinggi dan wilayah Kalimantan Tengah','Jumlah titik dan statistik menyesuaikan','Lulus'],
 ['Key salah atau tidak ada','Data contoh tampil dengan label peringatan dan alasan','Lulus'],
 ['Klik titik lalu Aktifkan Notifikasi','Form terbuka dengan wilayah terisi','Lulus'],
 ['Form 3 langkah, modal, Aktifkan','Layar Sukses dengan ringkasan','Lulus'],
  ['Layar 375 px, buka hamburger','Menu terbuka tanpa layout rusak','Lulus'],
 ['Error konsol JavaScript pada alur penuh','Nol error aplikasi','Lulus']],[6,7.5,3]),
 P('Pengujian dijalankan otomatis dengan Chromium headless (1280 px dan 375 px) terhadap server FIRMS tiruan; pengujian dengan MAP_KEY asli dilakukan penulis pada deployment.',S),
 P('14. Risiko dan pengembangan lanjutan',H1),
 tbl([['Risiko / ide','Mitigasi / rencana'],
 ['Deteksi disalahartikan sebagai kebakaran terkonfirmasi','Disclaimer pada drawer dan halaman Tentang Data'],
 ['Wilayah memakai kotak kasar, bukan batas resmi','Ganti dengan poligon batas administratif (GeoJSON)'],
 ['Kuota MAP_KEY FIRMS dapat habis','Cache 10 menit pada proxy; bila gagal, data contoh berlabel'],
 ['Notifikasi belum tersimpan permanen','Tambah backend ringan dan layanan email']],[8,8.5]),
 P('15. Kontribusi',H1),
 tbl([['Nama','Kontribusi'],['Aisyah Nabillah','PRD, wireframe, desain Figma, HTML semantik, implementasi prototipe, pengujian, dokumentasi']],[4,12.5]),
 P('16. Tautan',H1),
 tbl([['Item','Tautan'],['Repositori GitHub','https://github.com/aisyahnabillah/live-wildfire-tracker'],['Figma Modul 5','https://www.figma.com/design/3lHNfBfneuMaeOYvDXB9A8'],['Figma wireframe Modul 4','https://www.figma.com/design/8UF4vOJ2qEslm11hNTrVNw/Live-Wildfire-Tracker---Wireframes']],[4,12.5])]
SimpleDocTemplate('docs/PRD-Live-Wildfire-Tracker.pdf',pagesize=A4,leftMargin=2*cm,rightMargin=2*cm,topMargin=2*cm,bottomMargin=2*cm,title='PRD Live Wildfire Tracker',author='Aisyah Nabillah').build(s,onFirstPage=lambda c,d:None,onLaterPages=foot)
