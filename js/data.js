// Wilayah (kotak pembatas kasar [barat, selatan, timur, utara], BUKAN batas administratif resmi)
// dan pemuat data titik api dari /api/firms (NASA FIRMS) dengan cadangan data contoh.
const WILAYAH = [
  { id: 'riau', nama: 'Riau', bbox: [100.0, -1.2, 104.6, 2.6] },
  { id: 'jambi', nama: 'Jambi', bbox: [101.1, -2.6, 104.6, -0.7] },
  { id: 'sumsel', nama: 'Sumatera Selatan', bbox: [102.0, -4.9, 106.2, -1.6] },
  { id: 'kaltim', nama: 'Kalimantan Timur', bbox: [115.0, -2.6, 119.1, 2.5] },
  { id: 'kalteng', nama: 'Kalimantan Tengah', bbox: [110.7, -3.6, 115.0, -0.7] },
  { id: 'kalbar', nama: 'Kalimantan Barat', bbox: [108.6, -3.1, 114.3, 2.1] },
  { id: 'lain', nama: 'Wilayah lain Indonesia', bbox: null }
];
const ID_BOUNDS = [[-11.5, 94], [6.5, 141.5]];

function regionOf(lat, lon) {
  const w = WILAYAH.find(w => w.bbox && lon >= w.bbox[0] && lon <= w.bbox[2] && lat >= w.bbox[1] && lat <= w.bbox[3]);
  return w ? w.id : 'lain';
}

// VIIRS: l/n/h; MODIS: 0-100.
function yakinOf(c) {
  c = String(c).trim().toLowerCase();
  if (c === 'l') return 'rendah'; if (c === 'n') return 'sedang'; if (c === 'h') return 'tinggi';
  const n = parseFloat(c); return n < 30 ? 'rendah' : n < 80 ? 'sedang' : 'tinggi';
}

function parseFirms(csv) {
  const baris = csv.trim().split(/\r?\n/), kol = baris.shift().split(',');
  const ix = n => kol.indexOf(n), iLat = ix('latitude'), iLon = ix('longitude'), iD = ix('acq_date'), iT = ix('acq_time'),
    iC = ix('confidence'), iF = ix('frp'), iS = ix('satellite');
  const out = [];
  baris.forEach(b => {
    const c = b.split(','), lat = parseFloat(c[iLat]), lon = parseFloat(c[iLon]), frp = parseFloat(c[iF]);
    const t = (c[iT] || '').padStart(4, '0'), waktu = new Date(`${c[iD]}T${t.slice(0, 2)}:${t.slice(2)}:00Z`); // acq_time = UTC
    if (!isFinite(lat) || !isFinite(lon) || isNaN(waktu)) return;
    out.push({ id: out.length, lat, lon, frp: isFinite(frp) ? frp : 0, yakin: yakinOf(c[iC]), waktu, sat: c[iS] || '', wil: regionOf(lat, lon) });
  });
  return out;
}

// Cadangan bila API tidak tersedia (tanpa key, offline, atau dibuka lewat file://). Selalu diberi label "contoh".
function dataContoh() {
  const pusat = { riau: [0.5, 101.4], jambi: [-1.6, 103.0], sumsel: [-3.3, 104.0], kaltim: [0.5, 116.4], kalteng: [-1.7, 113.4], kalbar: [-0.3, 111.0] };
  let seed = 26; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const out = [];
  for (let i = 0; i < 90; i++) {
    const k = Object.keys(pusat)[i % 6], frp = Math.round(rnd() * 120 + 3);
    const lat = pusat[k][0] + (rnd() - .5) * 2.4, lon = pusat[k][1] + (rnd() - .5) * 2.4;
    out.push({ id: i, lat: +lat.toFixed(4), lon: +lon.toFixed(4), frp, yakin: frp > 50 ? 'tinggi' : frp >= 20 ? 'sedang' : 'rendah',
      waktu: new Date(Date.now() - Math.round(rnd() * 118) * 3600000), sat: 'Contoh', wil: regionOf(lat, lon) });
  }
  return out;
}

async function muatData() {
  try {
    const r = await fetch('/api/firms');
    if (!r.ok) { let m = 'HTTP ' + r.status; try { m = (await r.json()).error || m; } catch (_) {} throw new Error(m); }
    const list = parseFirms(await r.text());
    if (!list.length) throw new Error('tidak ada deteksi pada rentang waktu ini');
    return { status: 'ready', live: true, list };
  } catch (e) {
    return { status: 'ready', live: false, reason: e.message, list: dataContoh() };
  }
}
