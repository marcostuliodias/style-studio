// The Studio without Vite: serves the built app (dist-studio/, from `npm run studio:build`), the engine's public/
// folder (fonts, footage) and the same API the dev server has. `node studio/serve.mjs [--port 3490]`.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { api, ROOT, sweep } from './api.mjs';

const portArg = process.argv.indexOf('--port');
const port = Number((portArg > 0 && process.argv[portArg + 1]) || process.env.PORT || 3490);
const host = process.env.STUDIO_HOST || '127.0.0.1';
const DIST = path.join(ROOT, 'dist-studio');
const PUBLIC = path.join(ROOT, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.mp4': 'video/mp4', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.map': 'application/json' };

const send = (req, res, file) => {
  const size = fs.statSync(file).size;
  const ext = path.extname(file);
  res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', /^\.(mp4|woff2|ttf|js|css)$/.test(ext) ? 'public, max-age=86400' : 'no-cache');
  // a video seeks with Range requests; without 206 the player can't scrub
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
  if (range && size) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
    res.setHeader('Content-Length', end - start + 1);
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
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
    if (file.startsWith(base) && fs.existsSync(file) && fs.statSync(file).isFile()) return send(req, res, file);
  }
  res.statusCode = 404;
  res.end('not found');
};

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('Não achei dist-studio/index.html: rode `npm run studio:build` antes.');
  process.exit(1);
}

sweep();
http
  .createServer((req, res) => {
    api(req, res, () => serveStatic(req, res));
  })
  .listen(port, host, () => console.log(`Style Studio em http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`));
