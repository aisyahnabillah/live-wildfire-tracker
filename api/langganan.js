// CRUD langganan notifikasi -> Supabase (REST/PostgREST). Kunci service hanya ada di server.
// Tanpa SUPABASE_URL/SUPABASE_SERVICE_KEY, endpoint membalas 501 dan klien beralih ke localStorage.
const WIL = ['riau', 'jambi', 'sumsel', 'kaltim', 'kalteng', 'kalbar']; // samakan dengan js/data.js
const YAKIN = ['rendah', 'sedang', 'tinggi'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/; // tanpa karakter HTML/spasi
const MAKS = 20; // maksimum langganan per perangkat

function bersih(b) {
  b = b || {}; const f = {};
  const email = String(b.email || '').trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 120) f.email = 'Masukkan alamat email yang valid.';
  const wilayah = Array.isArray(b.wilayah) ? [...new Set(b.wilayah)] : [];
  if (!wilayah.length || wilayah.some(w => !WIL.includes(w))) f.wilayah = 'Pilih minimal satu wilayah yang tersedia.';
  if (!YAKIN.includes(b.keyakinan)) f.keyakinan = 'Pilih tingkat keyakinan.';
  const frp = Number(b.frp_min);
  if (!Number.isInteger(frp) || frp < 0 || frp > 150) f.frp_min = 'FRP minimum harus 0 sampai 150 MW.';
  return { f, data: { email, wilayah, keyakinan: b.keyakinan, frp_min: frp } };
}
const publik = ({ owner, ...sisa }) => sisa; // jangan bocorkan identitas pemilik

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const base = (process.env.SUPABASE_URL || '').replace(/\/$/, ''), key = process.env.SUPABASE_SERVICE_KEY;
  if (!base || !key) return res.status(501).json({ error: 'Database belum dikonfigurasi.' });
  const owner = String(req.headers['x-owner'] || '');
  if (!UUID.test(owner)) return res.status(400).json({ error: 'Identitas perangkat tidak valid.' });
  const id = req.query && req.query.id;
  if (id !== undefined && !UUID.test(id)) return res.status(400).json({ error: 'ID tidak valid.' });
  const H = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'return=representation' };
  const T = `${base}/rest/v1/langganan`;
  const db = async (url, opt) => { const r = await fetch(url, { headers: H, ...opt }); if (!r.ok) throw new Error('db ' + r.status); return r.json(); };
  try {
    if (req.method === 'GET') {
      const rows = await db(`${T}?owner=eq.${owner}&order=dibuat.desc&limit=50`);
      return res.status(200).json(rows.map(publik));
    }
    if (req.method === 'POST' || req.method === 'PUT') {
      const { f, data } = bersih(req.body);
      if (Object.keys(f).length) return res.status(400).json({ error: 'Data tidak valid.', fields: f });
      if (req.method === 'POST') {
        const ada = await db(`${T}?owner=eq.${owner}&select=id`);
        if (ada.length >= MAKS) return res.status(429).json({ error: `Maksimal ${MAKS} notifikasi per perangkat.` });
        const [row] = await db(T, { method: 'POST', body: JSON.stringify({ ...data, owner }) });
        return res.status(201).json(publik(row));
      }
      if (!id) return res.status(400).json({ error: 'ID wajib diisi.' });
      const rows = await db(`${T}?id=eq.${id}&owner=eq.${owner}`, { method: 'PATCH', body: JSON.stringify(data) });
      return rows.length ? res.status(200).json(publik(rows[0])) : res.status(404).json({ error: 'Data tidak ditemukan.' });
    }
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'ID wajib diisi.' });
      const rows = await db(`${T}?id=eq.${id}&owner=eq.${owner}`, { method: 'DELETE' });
      return rows.length ? res.status(204).end() : res.status(404).json({ error: 'Data tidak ditemukan.' });
    }
    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Metode tidak didukung.' });
  } catch (e) {
    return res.status(502).json({ error: 'Database tidak dapat dijangkau. Coba lagi sebentar lagi.' });
  }
};
