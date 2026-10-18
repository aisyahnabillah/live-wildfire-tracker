// Proxy serverless (Vercel / server.js lokal): meneruskan permintaan ke NASA FIRMS
// dengan MAP_KEY yang disimpan di environment variable, sehingga key tidak sampai ke browser
// dan masalah CORS terhindar.
const BBOX = '94,-11.5,141.5,6.5'; // barat,selatan,timur,utara (Indonesia)
const HARI = 5;                    // batas maksimum endpoint area FIRMS

module.exports = async function handler(req, res) {
  const key = process.env.FIRMS_MAP_KEY;
  if (!key) return res.status(503).json({ error: 'FIRMS_MAP_KEY belum diatur di environment.' });
  const base = process.env.FIRMS_BASE || 'https://firms.modaps.eosdis.nasa.gov';
  const sumber = process.env.FIRMS_SOURCE || 'VIIRS_SNPP_NRT';
  try {
    const r = await fetch(`${base}/api/area/csv/${key}/${sumber}/${BBOX}/${HARI}`);
    const teks = await r.text();
    // FIRMS kadang membalas 200 berisi pesan teks (mis. key tidak valid), jadi periksa header CSV.
    if (!r.ok || !teks.startsWith('latitude,')) {
      return res.status(502).json({ error: 'Respons FIRMS tidak valid (cek MAP_KEY atau kuota).', status: r.status });
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
    res.setHeader('X-Firms-Source', sumber);
    return res.status(200).send(teks);
  } catch (e) {
    return res.status(502).json({ error: 'Gagal menghubungi FIRMS.' });
  }
};
