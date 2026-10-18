// Server lokal tanpa dependensi: melayani berkas statis + /api/firms.  Jalankan: node server.js
const http = require('http'), fs = require('fs'), path = require('path');
try { // muat .env sederhana
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(l => {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  });
} catch (_) { /* .env opsional */ }
const firms = require('./api/firms.js');
const TIPE = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json' };
http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/api/firms') {
    res.status = c => { res.statusCode = c; return res; };
    res.send = b => res.end(b);
    res.json = o => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
    return firms(req, res);
  }
  const f = path.join(__dirname, path.normalize(url === '/' ? '/index.html' : url).replace(/^(\.\.[\/\\])+/, ''));
  if (!f.startsWith(__dirname) || /[\\/]\.(env|git)/.test(f)) { res.statusCode = 404; return res.end('Not found'); }
  fs.readFile(f, (e, d) => {
    if (e) { res.statusCode = 404; return res.end('Not found'); }
    res.setHeader('Content-Type', TIPE[path.extname(f)] || 'application/octet-stream'); res.end(d);
  });
}).listen(process.env.PORT || 8080, () => console.log('http://localhost:' + (process.env.PORT || 8080)));
