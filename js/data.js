// Data contoh titik api (deterministik) — bukan data NASA FIRMS langsung.
const WILAYAH = [
  { id: 'kalteng', nama: 'Kalimantan Tengah', x: 36, y: 44, lat: -1.6815, lon: 113.3824 },
  { id: 'kaltim', nama: 'Kalimantan Timur', x: 46, y: 36, lat: 0.5387, lon: 116.4194 },
  { id: 'riau', nama: 'Riau', x: 19, y: 37, lat: 0.5071, lon: 101.4478 },
  { id: 'sumsel', nama: 'Sumatera Selatan', x: 21, y: 49, lat: -3.3194, lon: 103.9144 }
];
const TITIK = [];
(function () {
  let seed = 26;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const now = new Date('2026-09-26T14:32:00+07:00').getTime();
  for (let i = 0; i < 60; i++) {
    const w = WILAYAH[i % WILAYAH.length];
    const frp = Math.round(rnd() * 140 + 3);
    const yakin = frp > 50 ? 'tinggi' : frp >= 20 ? 'sedang' : 'rendah';
    const jam = Math.round(rnd() * 120);
    TITIK.push({
      id: i, wil: w.id, frp, yakin, jam,
      x: w.x + (rnd() - 0.5) * 8, y: w.y + (rnd() - 0.5) * 5,
      lat: +(w.lat + (rnd() - 0.5) * 2).toFixed(4), lon: +(w.lon + (rnd() - 0.5) * 2).toFixed(4),
      waktu: new Date(now - jam * 3600000)
    });
  }
})();
