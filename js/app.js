(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NAMA = Object.fromEntries(WILAYAH.map(w => [w.id, w.nama]));
  const LBL = { rendah: 'Rendah', sedang: 'Sedang', tinggi: 'Tinggi' };
  const WARNA = { rendah: 'var(--r)', sedang: 'var(--s)', tinggi: 'var(--t)' };
  const DEF = () => ({ tgl: 5, yakin: 'semua', wil: 'semua', frp: 0 });
  const S = { loggedIn: false, filter: DEF(), sel: null, query: '',
    notif: { step: 1, wil: [], yakin: '', frp: 50, email: '', saved: null } };
  const fmt = d => d.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace('.', ':') + ' WIB';
  const show = (el, on) => { el.hidden = !on; };
  const ringkas = n => [['Wilayah', n.wil.map(i => NAMA[i]).join(', ') || '-'], ['Ambang notifikasi', `Keyakinan ${LBL[n.yakin] || '-'}, FRP ≥ ${n.frp} MW`], ['Metode', n.email ? 'Email ke ' + n.email : '-']]
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');

  // ---------- routing ----------
  function route() {
    const r = (location.hash.replace('#/', '') || '');
    const view = ['login', 'peta', 'notifikasi', 'sukses', 'tentang', 'tidak-ditemukan'].includes(r) ? r : 'beranda';
    if (!S.loggedIn && !['login', 'beranda', 'tentang'].includes(view)) { location.hash = '#/login'; return; }
    $$('[data-view]').forEach(v => v.classList.toggle('show', v.dataset.view === view));
    $$('[data-nav]').forEach(a => a.classList.toggle('cur', a.dataset.nav === (view === 'beranda' ? '' : view)));
    closeNav(); closeDrawer(); window.scrollTo(0, 0);
    if (view === 'peta') renderMap();
    if (view === 'notifikasi') renderNotif();
    if (view === 'sukses') renderSukses();
    if (view === 'tidak-ditemukan') { $('#q-err').value = S.query; $('#err-count').textContent = `0 hasil untuk “${S.query}”`; $('#btn-cari-lagi').disabled = !S.query.trim(); }
    document.title = ({ login: 'Masuk', peta: 'Peta Pemantauan', notifikasi: 'Aktifkan Notifikasi', sukses: 'Notifikasi Aktif', tentang: 'Tentang Data', 'tidak-ditemukan': 'Wilayah Tidak Ditemukan' }[view] || 'Beranda') + ' — Live Wildfire Tracker';
  }
  addEventListener('hashchange', route);

  // ---------- hamburger ----------
  const nav = $('#nav'), burger = $('#burger');
  function closeNav() { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Buka menu'); }
  burger.onclick = () => { const o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o); burger.setAttribute('aria-label', o ? 'Tutup menu' : 'Buka menu'); };

  // ---------- login ----------
  $('#f-login').onsubmit = e => {
    e.preventDefault();
    const ok = /\S+@\S+\.\S+/.test($('#email').value) && $('#pw').value === 'wildfire26';
    show($('#login-err'), !ok);
    if (ok) { S.loggedIn = true; location.hash = '#/peta'; }
  };
  $('.nav-out').onclick = () => { S.loggedIn = false; };

  // ---------- pencarian wilayah ----------
  function cari(q) {
    q = q.trim().toLowerCase(); S.query = q;
    if (!q) return;
    if (!S.loggedIn) { location.hash = '#/login'; return; }
    const w = WILAYAH.find(w => w.nama.toLowerCase().includes(q));
    if (w) { S.filter.wil = w.id; location.hash === '#/peta' ? route() : (location.hash = '#/peta'); } else location.hash = '#/tidak-ditemukan';
  }
  $('#f-cari-home').onsubmit = e => { e.preventDefault(); cari($('#q-home').value); };
  $('#f-cari-err').onsubmit = e => { e.preventDefault(); cari($('#q-err').value); };
  $('#q-err').oninput = e => { $('#btn-cari-lagi').disabled = !e.target.value.trim(); };
  $('#reset-cari').onclick = () => { S.query = ''; $('#q-home').value = ''; S.filter = DEF(); location.hash = '#/'; };

  // ---------- dashboard ----------
  $('#f-wil').innerHTML = '<option value="semua">Semua wilayah</option>' + WILAYAH.map(w => `<option value="${w.id}">${w.nama}</option>`).join('');
  const filtered = () => { const f = S.filter;
    return TITIK.filter(t => t.jam <= f.tgl * 24 && (f.yakin === 'semua' || t.yakin === f.yakin) && (f.wil === 'semua' || t.wil === f.wil) && t.frp >= f.frp); };
  let tmr;
  function refresh() { show($('#updating'), true); clearTimeout(tmr); tmr = setTimeout(() => { show($('#updating'), false); renderMap(); }, 350); }
  function renderMap() {
    const f = S.filter, list = filtered();
    $('#f-wil').value = f.wil; $('#f-frp').value = f.frp; $('#frp-out').textContent = f.frp + ' MW';
    $$('[data-group=tgl] button').forEach(b => b.classList.toggle('on', +b.dataset.v === f.tgl));
    $$('[data-group=yakin] button').forEach(b => b.classList.toggle('on', b.dataset.v === f.yakin));
    const tinggi = list.filter(t => t.yakin === 'tinggi').length, wils = new Set(list.map(t => t.wil)).size;
    $('#stats').innerHTML = [[list.length, 'Deteksi titik api'], [tinggi, 'Keyakinan tinggi'], [wils, 'Wilayah dengan deteksi'], ['3 mnt lalu', 'Pembaruan terakhir']]
      .map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('');
    $('#dots').innerHTML = list.map(t => { const d = 10 + Math.min(t.frp, 150) / 150 * 10;
      return `<button class="dot c-${t.yakin}${S.sel === t.id ? ' sel' : ''}" data-id="${t.id}" style="left:${t.x}%;top:${t.y}%;width:${d}px;height:${d}px" aria-label="Titik api ${NAMA[t.wil]}, keyakinan ${LBL[t.yakin]}, ${t.frp} MW"></button>`; }).join('');
    show($('#empty'), list.length === 0);
  }
  $$('.chips[data-group]').forEach(g => g.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    S.filter[g.dataset.group] = g.dataset.group === 'tgl' ? +b.dataset.v : b.dataset.v; refresh();
  });
  $('#f-wil').onchange = e => { S.filter.wil = e.target.value; refresh(); };
  $('#f-frp').oninput = e => { S.filter.frp = +e.target.value; $('#frp-out').textContent = e.target.value + ' MW'; };
  $('#f-frp').onchange = refresh;
  $('#reset-filter').onclick = () => { S.filter = DEF(); renderMap(); };
  $('#filter-toggle').onclick = e => { const o = $('#filter-body').classList.toggle('open'); e.target.setAttribute('aria-expanded', o); };

  // ---------- drawer detail ----------
  let lastDot;
  $('#dots').onclick = e => {
    const d = e.target.closest('.dot'); if (!d) return;
    lastDot = d; S.sel = +d.dataset.id; const t = TITIK[S.sel];
    $('#dr-body').innerHTML = [['Wilayah', NAMA[t.wil]], ['Koordinat', `${t.lat}, ${t.lon}`], ['Waktu deteksi', fmt(t.waktu)],
      ['Tingkat keyakinan', `<span class="badge" style="background:${WARNA[t.yakin]}">${LBL[t.yakin]}</span>`], ['Fire Radiative Power (FRP)', t.frp + ' MW']]
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    $$('.dot').forEach(x => x.classList.toggle('sel', x === d));
    $('#drawer').classList.add('open'); $('#drawer').setAttribute('aria-hidden', 'false'); show($('#scrim'), true); $('#dr-close').focus();
  };
  function closeDrawer() {
    const d = $('#drawer'); if (!d.classList.contains('open')) return;
    d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); show($('#scrim'), false);
    S.sel = null; $$('.dot.sel').forEach(x => x.classList.remove('sel')); if (lastDot && lastDot.focus) lastDot.focus();
  }
  $('#dr-close').onclick = $('#dr-tutup').onclick = $('#scrim').onclick = closeDrawer;
  $('#dr-notif').onclick = () => { const t = TITIK[S.sel]; S.notif = { step: 1, wil: [t.wil], yakin: '', frp: 50, email: S.notif.email, saved: S.notif.saved }; location.hash = '#/notifikasi'; };

  // ---------- form bertahap ----------
  function renderNotif() {
    const n = S.notif;
    $('#n-wil').innerHTML = WILAYAH.map(w => `<button type="button" data-v="${w.id}" class="${n.wil.includes(w.id) ? 'on' : ''}" aria-pressed="${n.wil.includes(w.id)}">${w.nama}</button>`).join('');
    $$('#n-yakin button').forEach(b => b.classList.toggle('on', b.dataset.v === n.yakin));
    $('#n-frp').value = n.frp; $('#n-frp-out').textContent = n.frp + ' MW'; $('#n-email').value = n.email;
    $$('[data-step]').forEach(s => { s.hidden = +s.dataset.step !== n.step; });
    $$('#steps li').forEach((li, i) => { li.classList.toggle('on', i + 1 === n.step); li.classList.toggle('done', i + 1 < n.step); li.setAttribute('aria-current', i + 1 === n.step ? 'step' : 'false'); });
    $('#n-back').style.visibility = n.step === 1 ? 'hidden' : 'visible';
    $('#n-next').textContent = n.step === 3 ? 'Simpan Pengaturan' : 'Lanjut';
    $('#n-next').disabled = (n.step === 1 && !n.wil.length) || (n.step === 2 && !n.yakin);
    $('#n-sum').innerHTML = ringkas(n);
    show($('#e1'), false); show($('#e3'), false);
  }
  $('#n-wil').onclick = e => { const b = e.target.closest('button'); if (!b) return; const w = S.notif.wil, i = w.indexOf(b.dataset.v); i < 0 ? w.push(b.dataset.v) : w.splice(i, 1); renderNotif(); };
  $('#n-yakin').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.notif.yakin = b.dataset.v; renderNotif(); };
  $('#n-frp').oninput = e => { S.notif.frp = +e.target.value; $('#n-frp-out').textContent = e.target.value + ' MW'; };
  $('#n-email').oninput = e => { S.notif.email = e.target.value; $('#n-sum').innerHTML = ringkas(S.notif); };
  $('#n-back').onclick = () => { S.notif.step--; renderNotif(); };
  $('#batal').onclick = () => { location.hash = '#/peta'; };
  $('#f-notif').onsubmit = e => {
    e.preventDefault(); const n = S.notif;
    if (n.step < 3) { n.step++; renderNotif(); return; }
    const ok = /\S+@\S+\.\S+/.test(n.email); show($('#e3'), !ok); if (!ok) return;
    $('#m-text').textContent = `Kamu akan menerima notifikasi untuk ${n.wil.map(i => NAMA[i]).join(', ')} ke ${n.email}.`;
    show($('#modal'), true); $('#m-ok').focus();
  };
  $('#m-batal').onclick = () => show($('#modal'), false);
  $('#m-ok').onclick = () => { S.notif.saved = JSON.parse(JSON.stringify(S.notif)); show($('#modal'), false); location.hash = '#/sukses'; };
  addEventListener('keydown', e => { if (e.key === 'Escape') { show($('#modal'), false); closeDrawer(); closeNav(); } });

  // ---------- sukses ----------
  function renderSukses() { $('#ok-sum').innerHTML = ringkas(S.notif.saved || S.notif); show($('#ubah'), !!S.notif.saved); }
  $('#ubah').onclick = () => { S.notif.step = 3; };

  route();
})();
