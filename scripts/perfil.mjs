// The creator's profile: a local page, filled once, that every skill reads before planning (plans/perfil.json).
//   node scripts/perfil.mjs [--port 3497] [--no-open] [--plans plans]
// Name, @, what they talk about and to whom, the line they end on (the CTA), a photo (public/perfil/foto.<ext>) and
// their prints (screenshots of messages, reviews, results, posts: public/prints/<file>), each with a line on what it
// shows, so the skill can pick one for a proof. Run it again to change anything; it opens filled in.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { arg, ROOT } from './lib/remotion.mjs';

const port = Number(arg('port', '3497'));
const noOpen = process.argv.includes('--no-open');
const plansDir = path.resolve(ROOT, arg('plans', 'plans'));
const file = path.join(plansDir, 'perfil.json');
const PUBLIC = path.join(ROOT, 'public');
const PRINTS = path.join(PUBLIC, 'prints');
const PERFIL = path.join(PUBLIC, 'perfil');
const PAGE = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'lib/perfil.html'), 'utf8');
const TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

const read = () => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { nome: '', arroba: '', nicho: '', cta: '', site: '', foto: null, prints: [] });
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, '');

/** An image's width and height from its header (PNG, JPEG, WebP), or null. */
const dims = (buf) => {
  if (buf.length > 24 && buf.toString('ascii', 1, 4) === 'PNG') return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    if (buf.toString('ascii', 12, 16) === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
    if (buf.toString('ascii', 12, 16) === 'VP8L') { const b = buf.readUInt32LE(21); return { w: 1 + (b & 0x3fff), h: 1 + ((b >> 14) & 0x3fff) }; }
    if (buf.toString('ascii', 12, 16) === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  }
  return null;
};
const shapeOf = (d) => (!d ? 'phone' : d.h / d.w > 1.3 ? 'phone' : d.w / d.h > 1.3 ? 'wide' : 'square');

/** Write an uploaded image ({ name, data: base64 }) into `dir` as <base>.<ext>, returning its path under public/. */
const save = (dir, base, up) => {
  const ext = (path.extname(up.name) || '.jpg').toLowerCase();
  if (!TYPES[ext]) throw new Error(`${up.name}: use PNG, JPG ou WebP`);
  fs.mkdirSync(dir, { recursive: true });
  const buf = Buffer.from(up.data, 'base64');
  let name = `${base}${ext}`;
  for (let n = 2; fs.existsSync(path.join(dir, name)) && dir === PRINTS; n++) name = `${base}-${n}${ext}`;
  fs.writeFileSync(path.join(dir, name), buf);
  return { rel: path.relative(PUBLIC, path.join(dir, name)).split(path.sep).join('/'), dims: dims(buf) };
};

const body = (req) => new Promise((resolve) => { const parts = []; req.on('data', (c) => parts.push(c)); req.on('end', () => resolve(Buffer.concat(parts).toString('utf8'))); });
let saved = null;
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(PAGE); }
  if (url.pathname === '/dados') { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); return res.end(JSON.stringify(read())); }
  if (url.pathname.startsWith('/public/')) {
    const f = path.join(PUBLIC, decodeURIComponent(url.pathname.slice(8)));
    if (!f.startsWith(PUBLIC) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] ?? 'application/octet-stream' });
    return fs.createReadStream(f).pipe(res);
  }
  if (url.pathname === '/salvar' && req.method === 'POST') {
    try {
      const d = JSON.parse(await body(req));
      const was = read();
      const p = { nome: (d.nome ?? '').trim(), arroba: (d.arroba ?? '').trim().replace(/^@/, ''), nicho: (d.nicho ?? '').trim(), cta: (d.cta ?? '').trim(), site: (d.site ?? '').trim(), foto: was.foto, prints: [] };
      if (d.foto?.data) {
        if (was.foto && fs.existsSync(path.join(PUBLIC, was.foto))) fs.rmSync(path.join(PUBLIC, was.foto));
        p.foto = save(PERFIL, 'foto', d.foto).rel;
      } else if (d.foto === null) {
        if (was.foto && fs.existsSync(path.join(PUBLIC, was.foto))) fs.rmSync(path.join(PUBLIC, was.foto));
        p.foto = null;
      }
      const keep = new Set();
      for (const x of d.prints ?? []) {
        if (x.upload?.data) {
          const { rel, dims: dd } = save(PRINTS, slug(path.basename(x.upload.name, path.extname(x.upload.name))) || 'print', x.upload);
          p.prints.push({ file: rel, descricao: (x.descricao ?? '').trim(), shape: shapeOf(dd) });
        } else if (x.file) {
          const old = was.prints.find((y) => y.file === x.file);
          p.prints.push({ file: x.file, descricao: (x.descricao ?? '').trim(), shape: old?.shape ?? 'phone' });
          keep.add(x.file);
        }
      }
      for (const old of was.prints) if (!keep.has(old.file) && !p.prints.some((x) => x.file === old.file) && fs.existsSync(path.join(PUBLIC, old.file))) fs.rmSync(path.join(PUBLIC, old.file));
      p.atualizado = new Date().toISOString().slice(0, 10);
      fs.mkdirSync(plansDir, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(p, null, 2) + '\n');
      saved = p;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
      setTimeout(finish, 300);
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ erro: e.message }));
    }
    return;
  }
  res.writeHead(404); res.end();
});
server.listen(port, '127.0.0.1', () => {
  const link = `http://localhost:${port}/`;
  console.log(`Perfil do criador em ${link}  (esperando salvar; Ctrl+C cancela)`);
  if (!noOpen) {
    const cmd = process.platform === 'darwin' ? ['open', [link]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', link]] : ['xdg-open', [link]];
    try { spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true }).unref(); } catch {}
  }
});
server.on('error', (e) => { console.error(e.code === 'EADDRINUSE' ? `a porta ${port} está em uso: passe --port <outra>` : e.message); process.exit(1); });

function finish() {
  const p = saved;
  console.log('');
  console.log(`PERFIL salvo em ${path.relative(ROOT, file)}: ${p.nome} (@${p.arroba})${p.foto ? `, foto em public/${p.foto}` : ', sem foto'}, ${p.prints.length} print${p.prints.length === 1 ? '' : 's'}.`);
  if (p.nicho) console.log(`- Fala sobre: ${p.nicho}`);
  if (p.cta) console.log(`- Fecha com: ${p.cta}`);
  for (const x of p.prints) console.log(`- public/${x.file} (${x.shape}): ${x.descricao || 'sem descrição'}`);
  server.close();
  process.exit(0);
}
