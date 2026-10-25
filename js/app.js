(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NAMA = Object.fromEntries(WILAYAH.map(w => [w.id, w.nama]));
  const LBL = { rendah: 'Rendah', sedang: 'Sedang', tinggi: 'Tinggi' };
  const COL = { rendah: '#e8b230', sedang: '#ec7a1f', tinggi: '#b3261e' };
  const DEF = () => ({ tgl: '120', yakin: 'semua', wil: 'semua', frp: 0 });
  const NOTIF0 = () => ({ step: 1, id: null, wil: [], yakin: '', frp: 50, email: '', saved: null });
  const S = { loggedIn: false, filter: DEF(), sel: null, query: '', notif: NOTIF0() };
  const fmt = d => new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace('.', ':') + ' WIB';
  const show = (el, on) => { el.hidden = !on; };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const bersihTeks = s => String(s).replace(/\s+/g, ' ').trim();
  const normEmail = s => String(s).trim().toLowerCase();
  const emailOk = s => /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(s) && s.length <= 120;
  const namaList = ids => ids.map(i => NAMA[i] || i).join(', ') || '-';
  const ringkas = n => [['Wilayah', namaList(n.wil)], ['Ambang notifikasi', `Keyakinan ${LBL[n.yakin] || '-'}, FRP ≥ ${n.frp} MW`], ['Metode', n.email ? 'Email ke ' + n.email : '-']]
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');

  // ---------- toast (pengganti alert) ----------
  function toast(pesan, tipe = 'ok') {
    const t = document.createElement('div'); t.className = 'toast' + (tipe === 'err' ? ' err' : ''); t.setAttribute('role', tipe === 'err' ? 'alert' : 'status');
    const p = document.createElement('span'); p.textContent = pesan;
    const x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', 'Tutup notifikasi');
    const tutup = () => t.remove(); x.onclick = tutup; t.append(p, x); $('#toasts').append(t); setTimeout(tutup, tipe === 'err' ? 6000 : 4000);
  }
  // ---------- dialog konfirmasi (promise) ----------
  let askRes;
  function ask(judul, teks, ok = 'Ya') {
    $('#m-title').textContent = judul; $('#m-text').textContent = teks; $('#m-ok').textContent = ok; show($('#modal'), true); $('#m-ok').focus();
    return new Promise(r => { askRes = r; });
  }
  function endAsk(v) { show($('#modal'), false); if (askRes) { askRes(v); askRes = null; } }
  $('#m-ok').onclick = () => endAsk(true); $('#m-batal').onclick = () => endAsk(false);
  const busy = (btn, on, teks) => { if (on) { btn.dataset.t = btn.textContent; btn.textContent = teks; } else if (btn.dataset.t) btn.textContent = btn.dataset.t; btn.disabled = on; btn.setAttribute('aria-busy', on); };

  // ---------- penyimpanan langganan: database (Supabase via /api/langganan) atau localStorage ----------
  const Repo = (() => {
    const KEY = 'lwt:langganan', OWN = 'lwt:owner';
    const uid = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
    let owner = null; try { owner = localStorage.getItem(OWN); } catch (_) {}
    if (!owner) { owner = uid(); try { localStorage.setItem(OWN, owner); } catch (_) {} }
    let mode = null; // 'database' | 'lokal'
    const baca = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (_) { return []; } };
    const tulis = a => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (_) { throw new Error('Penyimpanan di perangkat ini penuh atau dinonaktifkan.'); } };
    async function remote(method, id, body) {
      let r;
      try { r = await fetch('/api/langganan' + (id ? '?id=' + encodeURIComponent(id) : ''), { method, headers: { 'Content-Type': 'application/json', 'X-Owner': owner }, body: body ? JSON.stringify(body) : undefined }); }
      catch (_) { throw Object.assign(new Error('Tidak dapat terhubung ke server.'), { jaringan: true }); }
      if (r.status === 204) return null;
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw Object.assign(new Error(j.error || 'Terjadi kesalahan (HTTP ' + r.status + ').'), { status: r.status, fields: j.fields });
      return j;
    }
    function lokal(op, id, body) {
      const a = baca();
      if (op === 'list') return a.sort((x, y) => y.dibuat.localeCompare(x.dibuat));
      if (op === 'create') { const r = { id: uid(), ...body, dibuat: new Date().toISOString() }; tulis([r, ...a]); return r; }
      const i = a.findIndex(x => x.id === id); if (i < 0) throw Object.assign(new Error('Data tidak ditemukan.'), { status: 404 });
      if (op === 'update') { a[i] = { ...a[i], ...body }; tulis(a); return a[i]; }
      a.splice(i, 1); tulis(a); return null;
    }
    const peta = { list: ['GET'], create: ['POST'], update: ['PUT'], remove: ['DELETE'] };
    async function jalan(op, id, body) {
      if (mode !== 'lokal') {
        try { const r = await remote(peta[op][0], id, body); mode = 'database'; return r; }
        catch (e) { if (e.status === 501 || (e.status === 404 || e.jaringan) && mode === null) mode = 'lokal'; else throw e; }
      }
      return lokal(op, id, body);
    }
    return { mode: () => mode, list: () => jalan('list'), create: b => jalan('create', null, b), update: (id, b) => jalan('update', id, b), remove: id => jalan('remove', id) };
  })();

  // ---------- routing ----------
  const VIEWS = ['login', 'peta', 'notifikasi', 'sukses', 'tentang', 'tidak-ditemukan', 'langganan'];
  function route() {
    const r = location.hash.replace('#/', '');
    const view = VIEWS.includes(r) ? r : 'beranda';
    if (!S.loggedIn && !['login', 'beranda', 'tentang'].includes(view)) { location.hash = '#/login'; return; }
    $$('[data-view]').forEach(v => v.classList.toggle('show', v.dataset.view === view));
    $$('[data-nav]').forEach(a => a.classList.toggle('cur', a.dataset.nav === (view === 'beranda' ? '' : view)));
    closeNav(); closeDrawer(); window.scrollTo(0, 0);
    if (view === 'peta') renderMap();
    if (view === 'notifikasi') renderNotif();
    if (view === 'sukses') renderSukses();
    if (view === 'langganan') muatLangganan();
    if (view === 'tidak-ditemukan') { $('#q-err').value = S.query; $('#err-count').textContent = `0 hasil untuk “${S.query}”`; $('#btn-cari-lagi').disabled = !S.query.trim(); }
    document.title = ({ login: 'Masuk', peta: 'Peta Pemantauan', notifikasi: 'Aktifkan Notifikasi', sukses: 'Notifikasi Aktif', langganan: 'Notifikasi Saya', tentang: 'Tentang Data', 'tidak-ditemukan': 'Wilayah Tidak Ditemukan' }[view] || 'Beranda') + ' — Live Wildfire Tracker';
  }
  addEventListener('hashchange', route);
  $('#features').innerHTML = FITUR.map(f => `<li><img src="${f.ikon}" alt="" width="36" height="36"><h3>${f.judul}</h3><p>${f.isi}</p></li>`).join('');

  // ---------- hamburger ----------
  const nav = $('#nav'), burger = $('#burger');
  function closeNav() { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Buka menu'); }
  burger.onclick = () => { const o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o); burger.setAttribute('aria-label', o ? 'Tutup menu' : 'Buka menu'); };

  // ---------- login ----------
  $('#f-login').onsubmit = e => {
    e.preventDefault();
    const ok = emailOk(normEmail($('#email').value)) && $('#pw').value === 'wildfire26';
    show($('#login-err'), !ok);
    if (ok) { S.loggedIn = true; toast('Berhasil masuk. Selamat datang!'); location.hash = '#/peta'; }
  };
  $('.nav-out').onclick = () => { S.loggedIn = false; };

  // ---------- pencarian wilayah ----------
  function cari(q) {
    q = bersihTeks(q).toLowerCase(); S.query = q;
    if (!q) return;
    if (!S.loggedIn) { location.hash = '#/login'; return; }
    const w = WILAYAH.find(w => w.nama.toLowerCase().includes(q));
    if (w) { S.filter.wil = w.id; S.fit = true; location.hash === '#/peta' ? route() : (location.hash = '#/peta'); } else location.hash = '#/tidak-ditemukan';
  }
  $('#f-cari-home').onsubmit = e => { e.preventDefault(); cari($('#q-home').value); };
  $('#f-cari-err').onsubmit = e => { e.preventDefault(); cari($('#q-err').value); };
  $('#q-err').oninput = e => { $('#btn-cari-lagi').disabled = !e.target.value.trim(); };
  $('#reset-cari').onclick = () => { S.query = ''; $('#q-home').value = ''; S.filter = DEF(); location.hash = '#/'; };

  // ---------- dashboard (data asli NASA FIRMS) ----------
  let DATA = { status: 'loading', list: [] }, map, layer, selMarker;
  function muat() { DATA = { status: 'loading', list: [] }; if (location.hash === '#/peta') renderMap(); muatData().then(d => { DATA = d; if (location.hash === '#/peta') renderMap(); }); }
  muat();
  $('#f-wil').innerHTML = '<option value="semua">Semua wilayah</option>' + WILAYAH.map(w => `<option value="${w.id}">${w.nama}</option>`).join('');
  const ago = d => { const m = Math.max(0, Math.round((Date.now() - d) / 60000)); return m < 60 ? m + ' mnt lalu' : m < 1440 ? Math.round(m / 60) + ' jam lalu' : Math.round(m / 1440) + ' hari lalu'; };
  function cutoff(f) {
    if (f.tgl === 'today') { const d = new Date(Date.now() + 7 * 3600e3); d.setUTCHours(0, 0, 0, 0); return d.getTime() - 7 * 3600e3; }
    return Date.now() - (+f.tgl) * 3600e3;
  }
  const filtered = () => { const f = S.filter, c = cutoff(f);
    return DATA.list.filter(t => t.waktu >= c && (f.yakin === 'semua' || t.yakin === f.yakin) && (f.wil === 'semua' || t.wil === f.wil) && t.frp >= f.frp); };
  let tmr;
  function refresh() { show($('#updating'), true); clearTimeout(tmr); tmr = setTimeout(() => { show($('#updating'), false); renderMap(); }, 250); }
  function initMap() {
    if (map) return;
    map = L.map('map', { preferCanvas: true, minZoom: 4 }).fitBounds(ID_BOUNDS);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 14, attribution: '&copy; kontributor <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
    layer = L.layerGroup().addTo(map);
  }
  function renderMap() {
    initMap(); map.invalidateSize();
    const f = S.filter, siap = DATA.status === 'ready', list = siap ? filtered() : [];
    $('#f-wil').value = f.wil; $('#f-frp').value = f.frp; $('#frp-out').textContent = f.frp + ' MW';
    $$('[data-group=tgl] button').forEach(b => b.classList.toggle('on', b.dataset.v === f.tgl));
    $$('[data-group=yakin] button').forEach(b => b.classList.toggle('on', b.dataset.v === f.yakin));
    const tinggi = list.filter(t => t.yakin === 'tinggi').length, wils = new Set(list.map(t => t.wil)).size;
    const terbaru = DATA.list.length ? new Date(Math.max(...DATA.list.map(t => +t.waktu))) : null;
    $('#stats').innerHTML = siap
      ? [[list.length.toLocaleString('id-ID'), 'Deteksi titik api'], [tinggi.toLocaleString('id-ID'), 'Keyakinan tinggi'], [wils, 'Wilayah dengan deteksi'], [terbaru ? ago(terbaru) : '-', 'Deteksi terakhir']].map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('')
      : '<div class="stat" aria-hidden="true"><div class="sk"></div><div class="sk"></div></div>'.repeat(4);
    $('#stats').setAttribute('aria-busy', !siap);
    layer.clearLayers(); selMarker = null;
    list.forEach(t => L.circleMarker([t.lat, t.lon], { radius: 3 + Math.min(t.frp, 100) / 100 * 7, color: '#fff', weight: 1, fillColor: COL[t.yakin], fillOpacity: .85 })
      .on('click', e => bukaDrawer(t, e.target)).addTo(layer));
    show($('#loading'), !siap); show($('#empty'), siap && list.length === 0);
    const sm = $('#sumber'); sm.classList.toggle('warn', siap && !DATA.live);
    sm.innerHTML = !siap ? '' : DATA.live ? `Data langsung NASA FIRMS (VIIRS), 5 hari terakhir. Deteksi terbaru: ${fmt(terbaru)}.`
      : `Gagal memuat data satelit, jadi yang tampil adalah <b>data contoh</b>. <button type="button" class="linkbtn" id="retry">Coba lagi ↻</button><br><small>Penyebab: ${esc(DATA.reason)}</small>`;
    if (S.fit) { S.fit = false; const w = WILAYAH.find(w => w.id === f.wil); map.fitBounds(w && w.bbox ? [[w.bbox[1], w.bbox[0]], [w.bbox[3], w.bbox[2]]] : ID_BOUNDS); }
  }
  $('#sumber').onclick = e => { if (e.target.id === 'retry') muat(); };
  $$('.chips[data-group]').forEach(g => g.onclick = e => { const b = e.target.closest('button'); if (!b) return; S.filter[g.dataset.group] = b.dataset.v; refresh(); });
  $('#f-wil').onchange = e => { S.filter.wil = e.target.value; S.fit = true; refresh(); };
  $('#f-frp').oninput = e => { S.filter.frp = +e.target.value; $('#frp-out').textContent = e.target.value + ' MW'; };
  $('#f-frp').onchange = refresh;
  $('#reset-filter').onclick = () => { S.filter = DEF(); S.fit = true; renderMap(); };
  $('#filter-toggle').onclick = e => { const o = $('#filter-body').classList.toggle('open'); e.target.setAttribute('aria-expanded', o); };

  // ---------- drawer detail ----------
  function bukaDrawer(t, m) {
    if (selMarker) selMarker.setStyle({ weight: 1, color: '#fff' });
    selMarker = m; m.setStyle({ weight: 3, color: '#14212b' }); m.bringToFront(); S.sel = t;
    $('#dr-body').innerHTML = [['Wilayah', NAMA[t.wil]], ['Koordinat', `${t.lat.toFixed(4)}, ${t.lon.toFixed(4)}`], ['Waktu deteksi', fmt(t.waktu)],
      ['Tingkat keyakinan', `<span class="badge" style="background:${COL[t.yakin]}">${LBL[t.yakin]}</span>`], ['Fire Radiative Power (FRP)', t.frp.toFixed(1) + ' MW']]
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    $('#drawer').classList.add('open'); $('#drawer').setAttribute('aria-hidden', 'false'); show($('#scrim'), true); $('#dr-close').focus();
  }
  function closeDrawer() {
    const d = $('#drawer'); if (!d.classList.contains('open')) return;
    d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); show($('#scrim'), false);
    if (selMarker) selMarker.setStyle({ weight: 1, color: '#fff' }); selMarker = null; S.sel = null;
  }
  $('#dr-close').onclick = $('#dr-tutup').onclick = $('#scrim').onclick = closeDrawer;
  $('#dr-notif').onclick = () => { const t = S.sel; S.notif = { ...NOTIF0(), wil: t.wil === 'lain' ? [] : [t.wil], email: S.notif.email, saved: S.notif.saved }; location.hash = '#/notifikasi'; };

  // ---------- form bertahap: validasi, sanitasi, kirim ----------
  function renderNotif() {
    const n = S.notif;
    $('#n-wil').innerHTML = WILAYAH.filter(w => w.bbox).map(w => `<button type="button" data-v="${w.id}" class="${n.wil.includes(w.id) ? 'on' : ''}" aria-pressed="${n.wil.includes(w.id)}">${w.nama}</button>`).join('');
    $$('#n-yakin button').forEach(b => b.classList.toggle('on', b.dataset.v === n.yakin));
    $('#n-frp').value = n.frp; $('#n-frp-out').textContent = n.frp + ' MW'; $('#n-email').value = n.email;
    $$('[data-step]').forEach(s => { s.hidden = +s.dataset.step !== n.step; });
    $$('#steps li').forEach((li, i) => { li.classList.toggle('on', i + 1 === n.step); li.classList.toggle('done', i + 1 < n.step); li.setAttribute('aria-current', i + 1 === n.step ? 'step' : 'false'); });
    $('#n-back').style.visibility = n.step === 1 ? 'hidden' : 'visible';
    $('#n-next').textContent = n.step === 3 ? (n.id ? 'Simpan Perubahan' : 'Simpan Pengaturan') : 'Lanjut';
    $('#n-next').disabled = (n.step === 1 && !n.wil.length) || (n.step === 2 && !n.yakin);
    $('#n-sum').innerHTML = ringkas(n);
    $('h1', $('[data-view=notifikasi]')).textContent = n.id ? 'Ubah notifikasi wilayah' : 'Aktifkan notifikasi wilayah';
    galatEmail('');
  }
  function galatEmail(pesan) { const e = $('#e3'), i = $('#n-email'); e.textContent = pesan; show(e, !!pesan); i.setAttribute('aria-invalid', !!pesan); }
  $('#n-wil').onclick = e => { const b = e.target.closest('button'); if (!b) return; const w = S.notif.wil, i = w.indexOf(b.dataset.v); i < 0 ? w.push(b.dataset.v) : w.splice(i, 1); renderNotif(); };
  $('#n-yakin').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.notif.yakin = b.dataset.v; renderNotif(); };
  $('#n-frp').oninput = e => { S.notif.frp = +e.target.value; $('#n-frp-out').textContent = e.target.value + ' MW'; };
  $('#n-email').oninput = e => { S.notif.email = e.target.value; $('#n-sum').innerHTML = ringkas({ ...S.notif, email: normEmail(e.target.value) }); if ($('#n-email').getAttribute('aria-invalid') === 'true') galatEmail(''); };
  $('#n-back').onclick = () => { S.notif.step--; renderNotif(); };
  $('#batal').onclick = () => { location.hash = S.notif.id ? '#/langganan' : '#/peta'; };
  $('#f-notif').onsubmit = async e => {
    e.preventDefault(); const n = S.notif;
    if (n.step < 3) { n.step++; renderNotif(); return; }
    n.email = normEmail(n.email); $('#n-email').value = n.email;
    if (!n.email) return galatEmail('Email wajib diisi.');
    if (!emailOk(n.email)) return galatEmail('Format email belum benar, contoh: nia@email.com.');
    galatEmail('');
    if (!await ask(n.id ? 'Simpan perubahan?' : 'Aktifkan notifikasi?', `Notifikasi untuk ${namaList(n.wil)} akan dikirim ke ${n.email}.`, n.id ? 'Simpan' : 'Aktifkan')) return;
    const btn = $('#n-next'); busy(btn, true, 'Mengirim…');
    try {
      const body = { email: n.email, wilayah: n.wil, keyakinan: n.yakin, frp_min: n.frp };
      const rec = n.id ? await Repo.update(n.id, body) : await Repo.create(body);
      n.id = rec.id; n.saved = { id: rec.id, wil: rec.wilayah, yakin: rec.keyakinan, frp: rec.frp_min, email: rec.email };
      toast(Repo.mode() === 'database' ? 'Pengaturan notifikasi tersimpan di database ✅' : 'Pengaturan notifikasi tersimpan di perangkat ini ✅');
      location.hash = '#/sukses';
    } catch (err) {
      if (err.fields && err.fields.email) galatEmail(err.fields.email);
      toast(err.message || 'Gagal menyimpan. Coba lagi.', 'err');
    } finally { busy(btn, false); renderNotif(); }
  };

  // ---------- sukses ----------
  function renderSukses() { $('#ok-sum').innerHTML = ringkas(S.notif.saved || S.notif); show($('#ubah'), !!S.notif.saved); }
  $('#ubah').onclick = () => { S.notif.step = 3; };

  // ---------- Notifikasi Saya: baca / cari / filter / ubah / hapus ----------
  const Lst = { status: 'idle', items: [], q: '', yakin: 'semua', err: '' };
  async function muatLangganan() {
    Lst.status = 'loading'; renderL();
    try { Lst.items = await Repo.list(); Lst.status = 'ready'; } catch (e) { Lst.status = 'error'; Lst.err = e.message; }
    renderL();
  }
  function renderL() {
    const box = $('#l-list'); box.setAttribute('aria-busy', Lst.status === 'loading');
    $('#l-mode').textContent = Repo.mode() === 'database' ? 'Disimpan di database.' : Repo.mode() === 'lokal' ? 'Database belum terhubung, jadi data disimpan di perangkat ini (localStorage).' : '';
    if (Lst.status === 'loading') { box.innerHTML = '<div class="card item sk-card sk" aria-hidden="true"></div>'.repeat(3); return; }
    if (Lst.status === 'error') { box.innerHTML = `<div class="card state"><h2>Gagal memuat data</h2><p class="hint">${esc(Lst.err)}</p><button class="btn" id="l-retry">Coba lagi ↻</button></div>`; return; }
    const q = bersihTeks(Lst.q).toLowerCase();
    const hasil = Lst.items.filter(r => (Lst.yakin === 'semua' || r.keyakinan === Lst.yakin) && (!q || (namaList(r.wilayah) + ' ' + r.email).toLowerCase().includes(q)));
    if (!Lst.items.length) { box.innerHTML = '<div class="card state"><h2>Belum ada notifikasi</h2><p class="hint">Tambahkan notifikasi untuk dikabari saat ada titik api baru di wilayahmu.</p><button class="btn" id="l-kosong-tambah">Tambah notifikasi</button></div>'; return; }
    if (!hasil.length) { box.innerHTML = '<div class="card state"><h2>Yah, notifikasi tidak ditemukan 🔍</h2><p class="hint">Coba kata kunci lain atau tampilkan semuanya.</p><button class="btn" id="l-reset">Reset pencarian</button></div>'; return; }
    box.innerHTML = hasil.map(r => `<article class="card item"><div><h3>${esc(namaList(r.wilayah))}</h3>
      <p><span class="badge" style="background:${COL[r.keyakinan]}">${LBL[r.keyakinan]}</span> FRP ≥ ${Number(r.frp_min)} MW</p>
      <p class="hint">${esc(r.email)} · dibuat ${fmt(r.dibuat)}</p></div>
      <div class="item-actions"><button class="btn ghost" data-act="ubah" data-id="${esc(r.id)}" aria-label="Ubah notifikasi ${esc(namaList(r.wilayah))}">Ubah</button>
      <button class="btn ghost danger" data-act="hapus" data-id="${esc(r.id)}" aria-label="Hapus notifikasi ${esc(namaList(r.wilayah))}">Hapus</button></div></article>`).join('');
  }
  $('#l-q').oninput = e => { Lst.q = e.target.value; renderL(); };
  $('#l-yakin').onclick = e => { const b = e.target.closest('button'); if (!b) return; Lst.yakin = b.dataset.v; $$('#l-yakin button').forEach(x => x.classList.toggle('on', x === b)); renderL(); };
  const tambah = () => { S.notif = { ...NOTIF0(), saved: S.notif.saved }; location.hash = '#/notifikasi'; };
  $('#l-tambah').onclick = tambah;
  $('#l-list').onclick = async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'l-retry') return muatLangganan();
    if (b.id === 'l-kosong-tambah') return tambah();
    if (b.id === 'l-reset') { Lst.q = ''; Lst.yakin = 'semua'; $('#l-q').value = ''; $$('#l-yakin button').forEach(x => x.classList.toggle('on', x.dataset.v === 'semua')); return renderL(); }
    const r = Lst.items.find(x => x.id === b.dataset.id); if (!r) return;
    if (b.dataset.act === 'ubah') { S.notif = { step: 1, id: r.id, wil: [...r.wilayah], yakin: r.keyakinan, frp: r.frp_min, email: r.email, saved: S.notif.saved }; location.hash = '#/notifikasi'; }
    if (b.dataset.act === 'hapus') {
      if (!await ask('Hapus notifikasi?', `Notifikasi untuk ${namaList(r.wilayah)} akan dihapus permanen.`, 'Hapus')) return;
      busy(b, true, 'Menghapus…');
      try { await Repo.remove(r.id); Lst.items = Lst.items.filter(x => x.id !== r.id); if (S.notif.id === r.id) S.notif = NOTIF0(); toast('Notifikasi dihapus.'); }
      catch (err) { toast(err.message || 'Gagal menghapus. Coba lagi.', 'err'); }
      renderL();
    }
  };

  addEventListener('keydown', e => { if (e.key === 'Escape') { endAsk(false); closeDrawer(); closeNav(); } });
  route();
})();
