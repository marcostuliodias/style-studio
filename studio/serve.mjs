// The Studio without Vite: serves the built app (dist-studio/, from `npm run studio:build`), the engine's public/
// folder (fonts, footage) and the same API the dev server has. `node studio/serve.mjs [--port 3490]`.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { api, ROOT } from './api.mjs';

const port = Number(process.argv[process.argv.indexOf('--port') + 1] || 3490);
const DIST = path.join(ROOT, 'dist-studio');
const PUBLIC = path.join(ROOT, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.mp4': 'video/mp4', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.map': 'application/json' };

const send = (res, file) => {
  const size = fs.statSync(file).size;
  res.setHeader('Content-Type', MIME[path.extname(file)] ?? 'application/octet-stream');
  res.setHeader('Content-Length', size);
  fs.createReadStream(file).pipe(res);
};

const serveStatic = (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let p = decodeURIComponent(url.pathname);
  if (p === '/' || p === '/index.html') p = '/index.html';
  if (p === '/preview.html') p = '/preview.html';
  for (const base of [DIST, PUBLIC]) {
    const file = path.normalize(path.join(base, p));
    if (file.startsWith(base) && fs.existsSync(file) && fs.statSync(file).isFile()) return send(res, file);
  }
  res.statusCode = 404;
  res.end('not found');
};

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('Não achei dist-studio/index.html: rode `npm run studio:build` antes.');
  process.exit(1);
}

http
  .createServer((req, res) => {
    api(req, res, () => serveStatic(req, res));
  })
  .listen(port, '127.0.0.1', () => console.log(`Style Studio em http://localhost:${port}`));
