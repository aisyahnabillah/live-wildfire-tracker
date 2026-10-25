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
    c.drawString(2*cm,1.2*cm,'Dokumentasi Modul 8 - Live Wildfire Tracker - VINIX Batch 5'); c.drawRightString(19*cm,1.2*cm,'Halaman %d'%d.page); c.restoreState()
s=[]
M='docs/img/m8/'
s+=[Spacer(1,2.5*cm),P('Dokumentasi Penugasan',ParagraphStyle('k',parent=S,textColor=EMB,fontName='Helvetica-Bold',fontSize=11)),P('Modul 8: Data Dinamis dan Logika Aplikasi',T),Spacer(1,.3*cm),
 P('Live Wildfire Tracker - VINIX Batch 5',ParagraphStyle('sub',parent=B,fontSize=13,leading=18)),Spacer(1,.8*cm),
 tbl([['Penyusun','Aisyah Nabillah (Entry) - BINUS University'],['Tanggal','25 Oktober 2026'],
 ['Repositori GitHub','https://github.com/aisyahnabillah/live-wildfire-tracker'],['Branch / PR','feat/dynamic-data  (Pull Request ke main: [ISI: URL PR])'],
 ['Link live web','[ISI: URL Vercel]'],['Sumber data','NASA FIRMS (baca) dan Supabase (CRUD langganan), cadangan localStorage'],
 ['Layanan form','Supabase lewat API serverless /api/langganan'],['Akun demo','email apa saja yang valid / sandi wildfire26'],
 ['PRD','docs/PRD-Live-Wildfire-Tracker.pdf']],[4,12.5],head=False),
 P('1. Ringkasan perubahan',H1),
 P('Pada Modul 7 tampilan dan interaksi dasar sudah jadi. Modul 8 menambahkan data dinamis dan logika aplikasi: halaman <b>Notifikasi Saya</b> dengan operasi CRUD, form 3 langkah yang tervalidasi dan benar-benar menyimpan data, serta state UX (skeleton, kosong, error, toast). Seluruh pekerjaan dilakukan di branch <font face="Courier">feat/dynamic-data</font> tanpa mengubah desain Modul 7.'),
 tbl([['Target / bobot','Bukti implementasi'],
 ['1. Data dinamis dan search/filter (25%)','Kartu fitur, statistik, titik peta, opsi wilayah, langkah form, dan daftar notifikasi dibuat dengan array dan .map(). Peta: filter tanggal, keyakinan, wilayah, FRP. Daftar: cari kata kunci + filter keyakinan.'],
 ['2. Form, validasi, sanitasi (25%)','Form notifikasi 3 langkah menyimpan ke Supabase (atau localStorage). Trim, normalisasi email, validasi format, pesan error di bawah kolom, tombol terkunci saat mengirim. Validasi diulang di server.'],
 ['3. UX states (20%)','Skeleton, spinner, empty state + Reset, error state + Coba lagi, toast sukses/gagal. Tanpa alert().'],
 ['4. Kode, .env, alur Git (15%)','Kode modular per fitur; .env di .gitignore; branch feat/dynamic-data, komit bertahap, Pull Request.'],
 ['5. Dokumentasi (15%)','README.md dan dokumen ini; link produksi pada tabel di atas.']],[5,11.5]),
 PageBreak(),
 P('2. Sumber data dan layanan',H1),
 tbl([['Komponen','Peran','Catatan'],
 ['NASA FIRMS (area/csv)','Baca titik api, 5 hari, Indonesia','Lewat api/firms.js; MAP_KEY di environment server'],
 ['Supabase (tabel langganan)','Create, read, update, delete notifikasi','Lewat api/langganan.js; service key di environment server; RLS aktif tanpa policy'],
 ['localStorage','Cadangan form dan daftar','Otomatis bila API menjawab 501/404 atau jaringan gagal; label mode tampil di halaman'],
 ['Leaflet + OpenStreetMap','Peta interaktif','Leaflet disimpan lokal di vendor/']],[4,5.5,7]),
 P('Skema tabel (docs/supabase.sql): id (uuid), owner (uuid anonim per perangkat), email, wilayah (array), keyakinan (rendah/sedang/tinggi), frp_min (0-150), dibuat (timestamp).',S),
 P('3. Validasi dan sanitasi',H1),
 tbl([['Input','Aturan','Pesan'],
 ['Email','trim + huruf kecil; maks 120 karakter; hanya huruf, angka, ._%+-; wajib berformat nama@domain.tld','"Email wajib diisi." / "Format email belum benar, contoh: nia@email.com."'],
 ['Wilayah','minimal 1; hanya wilayah yang tersedia (server memeriksa daftar putih)','Tombol Lanjut nonaktif / pesan dari server'],
 ['Keyakinan','wajib salah satu: rendah, sedang, tinggi','Tombol Lanjut nonaktif'],
 ['FRP minimum','bilangan bulat 0-150','Pesan dari server'],
 ['Pencarian','spasi dipadatkan dan dipangkas; maks 60 karakter','-'],
 ['Output','semua teks dinamis di-escape sebelum masuk innerHTML','-']],[2.6,8,5.9]),
 img(M+'validasi.png',13),P('Gambar 1. Pesan error tepat di bawah kolom email; tombol aksi tetap terlihat.',C),
 PageBreak(),
 P('4. UX states',H1),
 tbl([['State','Perilaku','Gambar'],['Loading','Skeleton berdenyut pada kartu statistik dan daftar; spinner pada peta; tombol berubah "Mengirim..." / "Menghapus..." dan terkunci','2'],
 ['Empty','Daftar kosong: ajakan Tambah notifikasi. Pencarian tanpa hasil: "Yah, notifikasi tidak ditemukan" + Reset pencarian. Peta tanpa deteksi: Reset filter','3'],
 ['Error','try/catch pada semua pemanggilan; pesan manusiawi + "Coba lagi"; data FIRMS gagal tampil sebagai data contoh berlabel + Coba lagi','4'],
 ['Toast','Sukses/gagal simpan, hapus, dan login; dapat ditutup; role status/alert','5']],[2.2,12.3,2]),
 img(M+'skeleton.png',12),P('Gambar 2. Skeleton saat daftar dimuat',C),Spacer(1,.2*cm),
 img(M+'empty.png',12),P('Gambar 3. Empty state saat pencarian tanpa hasil',C),
 PageBreak(),
 img(M+'error.png',12),P('Gambar 4. Error state dengan tombol Coba lagi',C),Spacer(1,.2*cm),
 img(M+'toast-sukses.png',12),P('Gambar 5. Toast setelah simpan berhasil',C),Spacer(1,.2*cm),
 img(M+'daftar.png',12),P('Gambar 6. Halaman Notifikasi Saya (Read, Update, Delete)',C),
 PageBreak(),
 P('5. Keamanan',H1),
 tbl([['Risiko','Penanganan'],
 ['Kunci API bocor ke GitHub/browser','Semua kunci di environment server; .env di .gitignore; hanya .env.example yang di-commit; kunci tidak ada di kode klien'],
 ['Tabel dibaca langsung lewat kunci publik','RLS aktif tanpa policy; hanya service key di server yang dapat mengakses'],
 ['Akses data milik orang lain','Setiap permintaan menyertakan UUID perangkat; server memfilter owner dan menolak (404) ubah/hapus data bukan miliknya (teruji)'],
 ['XSS lewat data tersimpan','Escape semua nilai dinamis; email ditolak bila mengandung karakter HTML; ID divalidasi UUID'],
 ['Penyalahgunaan','Batas 20 notifikasi per perangkat; ukuran isi permintaan dibatasi; belum ada rate limit penuh (keterbatasan)']],[5,11.5]),
 P('6. Alur Git',H1),
 P('Branch <font face="Courier">feat/dynamic-data</font> dibuat dari <font face="Courier">main</font>. Komit dikerjakan bertahap (API dan SQL, markup dan CSS state, logika aplikasi, dokumentasi), lalu digabung ke main lewat Pull Request. Tautan PR: [ISI: URL PR].'),
 P('7. Panduan mencoba untuk mentor',H1),
 tbl([['Langkah','Yang dicoba','Hasil yang diharapkan'],
 ['1','Login (email valid / wildfire26)','Toast sambutan, masuk ke Peta'],
 ['2','Peta: ubah filter, klik titik','Titik dan statistik berubah; detail terbuka'],
 ['3','Notifikasi Saya: cari "riau", filter keyakinan, cari "zzz"','Daftar menyaring; empty state + Reset'],
 ['4','Tambah notifikasi: kosongkan email, isi "salah@email", lalu email valid','Error tepat di bawah kolom; tombol "Mengirim..." lalu toast'],
 ['5','Ubah dan Hapus pada kartu','Data berubah; hapus meminta konfirmasi; toast']],[1.6,8,6.9]),
 PageBreak(),
 P('8. Log prompt AI',H1),
 P('AI: Claude (Anthropic). Prompt dibuat bertahap sesuai tips brief: kunci visual dulu, kerjakan dicicil, cek layar HP.'),
 tbl([['Tahap','Prompt (ringkas)','Hasil'],
 ['1','Unggah brief Modul 8; minta bantuan menyelesaikannya di atas repo Modul 7','Rencana: halaman CRUD Notifikasi Saya + Supabase + cadangan localStorage'],
 ['2','"Pertahankan seluruh class dan token visual Modul 7. Buat API CRUD langganan dengan validasi server, RLS, dan isolasi per perangkat."','api/langganan.js, supabase.sql, pembaruan server.js'],
 ['3','"Ubah daftar statis jadi array + .map(); tambah halaman daftar dengan cari dan filter."','Halaman Notifikasi Saya, kartu fitur Beranda dinamis'],
 ['4','"Form: trim, validasi format, error di bawah kolom, tombol Mengirim..., toast, tanpa alert()."','Validasi klien-server, komponen toast'],
 ['5','"Tambahkan skeleton, empty, error + retry; uji di mobile."','State UX lengkap'],
 ['6','"Uji CRUD di dua mode dengan Supabase tiruan; cek XSS dan akses silang."','Lulus; satu temuan (lihat bagian 9)'],
 ['7','"Susun README dan dokumentasi PDF."','Dokumen ini']],[1.2,9,6.3]),
 P('9. Catatan perbaikan manual',H1),
 tbl([['Temuan','Perbaikan'],
 ['Email berisi tag HTML (<b>x</b>@mail.co) lolos validasi','Regex diperketat di klien dan server'],
 ['Hosting statis tanpa /api membuat form gagal total','Beralih otomatis ke localStorage + label mode'],
 ['Data tersimpan dirender via innerHTML','Semua nilai di-escape; ID divalidasi']],[8,8.5]),
 P('10. Hasil pengujian',H1),
 tbl([['Skenario','Mode localStorage','Mode database (Supabase tiruan)'],
 ['Create lewat form (email dinormalisasi)','Lulus','Lulus'],['Read + persisten setelah reload','Lulus','Lulus'],
 ['Cari kata kunci, filter keyakinan, empty + Reset','Lulus','Lulus'],['Update lewat Ubah','Lulus','Lulus'],['Delete + konfirmasi + toast','Lulus','Lulus'],
 ['Validasi: kosong, format salah, tag HTML','Lulus','Lulus'],['API menolak data tidak valid (400), identitas tidak valid (400), metode lain (405)','-','Lulus'],
 ['Ubah/hapus data milik perangkat lain','-','Ditolak (404)'],['Skeleton tampil saat lambat; error + Coba lagi saat 502','-','Lulus'],
 ['Penggunaan alert() / error JavaScript','Tidak ada','Tidak ada']],[7.5,4,5]),
 P('Pengujian otomatis memakai Chromium headless (1280 px dan 375 px) dan server Supabase tiruan. Pengujian dengan project Supabase asli dan URL produksi dilakukan penulis setelah deploy.',S),
 P('11. Keterbatasan',H1),
 P('Login hanya demo dan belum memakai akun sungguhan; langganan dipisahkan per perangkat (UUID anonim) sehingga belum aman untuk produksi. Notifikasi belum dikirim sebagai email/push. Email pengguna adalah data pribadi, sehingga akses ke dashboard Supabase harus dibatasi. Toast dibuat sendiri karena proyek tanpa React.')]
SimpleDocTemplate('docs/Dokumentasi-Modul-8.pdf',pagesize=A4,leftMargin=2*cm,rightMargin=2*cm,topMargin=2*cm,bottomMargin=2*cm,title='Dokumentasi Modul 8 - Live Wildfire Tracker',author='Aisyah Nabillah').build(s,onFirstPage=lambda c,d:None,onLaterPages=foot)
