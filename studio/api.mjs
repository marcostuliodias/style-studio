// The Studio's local API, shared by the Vite dev server (studio/vite.config.ts) and the standalone server
// (studio/serve.mjs). Everything runs the engine's own scripts in this folder:
//   POST /api/skill    { pack }          -> { files, notes }   scripts/make-skill.mjs --pack --out, read back
//   POST /api/render   { pack, plan }    -> { id }             scripts/render-reel.mjs, a job in memory
//   GET  /api/render?id=                 -> { status, progress, log, url }
//   GET  /renders/<id>.mp4                                       the rendered video (with Range, for seeking)
//   POST /api/footage  (raw video body, x-file-name) -> { plate, width, height, duration }  into public/footage/<slug>/
//   POST /api/tone     { plate, faceX, eyes, chin, at } -> { chest }   scripts/footage-tone.mjs
import { execFile, spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = /^[a-z0-9][a-z0-9-]{0,40}$/;
const jobs = new Map();

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
};

const readJson = (req, limit = 8 << 20) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('O corpo da requisição é grande demais'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(new Error('O corpo da requisição não é JSON'));
      }
    });
    req.on('error', reject);
  });

const readToFile = (req, file) =>
  new Promise((resolve, reject) => {
    const out = fs.createWriteStream(file);
    let size = 0;
    req.on('data', (c) => (size += c.length));
    req.pipe(out);
    out.on('finish', () => resolve(size));
    out.on('error', reject);
    req.on('error', reject);
  });

/** Run a command, collecting its output line by line; resolves with the exit code and every line. */
const run = (cmd, args, { cwd = ROOT, onLine } = {}) =>
  new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: process.env });
    const lines = [];
    let buf = '';
    const feed = (chunk) => {
      buf += chunk.toString('utf8');
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).replace(/\r$/, '');
        buf = buf.slice(i + 1);
        if (line.trim()) {
          lines.push(line);
          onLine?.(line);
        }
      }
    };
    child.stdout.on('data', feed);
    child.stderr.on('data', feed);
    child.on('close', (code) => {
      if (buf.trim()) {
        lines.push(buf);
        onLine?.(buf);
      }
      resolve({ code: code ?? 1, lines });
    });
    child.on('error', (e) => {
      lines.push(String(e));
      resolve({ code: 1, lines });
    });
  });

const probe = (file) =>
  new Promise((resolve, reject) => {
    execFile('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', file], (err, out) => {
      if (err) return reject(new Error('ffprobe não conseguiu ler o vídeo'));
      try {
        const j = JSON.parse(out);
        resolve({ width: j.streams?.[0]?.width, height: j.streams?.[0]?.height, duration: Number(j.format?.duration ?? 0) });
      } catch {
        reject(new Error('ffprobe devolveu algo inesperado'));
      }
    });
  });

const walk = (dir, base = dir) => {
  const out = {};
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) Object.assign(out, walk(p, base));
    else out[path.relative(base, p).replace(/\\/g, '/')] = fs.readFileSync(p, 'utf8');
  }
  return out;
};

const slug = (name) =>
  String(name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'footage';

const checkPack = (pack) => {
  if (!pack || typeof pack !== 'object' || Array.isArray(pack)) throw new Error('Mande o pack como um objeto JSON');
  if (!ID.test(pack.id ?? '')) throw new Error(`O id "${pack.id ?? ''}" não serve: letras minúsculas, números e traços, até 41 caracteres`);
  return pack;
};

// ── Handlers ─────────────────────────────────────────────────────────────────────────────────────────────────────

const skill = async (req, res) => {
  const { pack } = await readJson(req);
  checkPack(pack);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'style-studio-skill-'));
  try {
    fs.writeFileSync(path.join(tmp, 'pack.json'), JSON.stringify(pack, null, 2));
    const { code, lines } = await run(process.execPath, ['scripts/make-skill.mjs', '--pack', path.join(tmp, 'pack.json'), '--out', path.join(tmp, 'skills')]);
    if (code !== 0) return json(res, 400, { error: lines.join('\n') || 'O gerador de skill falhou' });
    const dir = path.join(tmp, 'skills', pack.id);
    if (!fs.existsSync(dir)) return json(res, 500, { error: `O gerador não escreveu skills/${pack.id}` });
    // the generator writes links relative to the engine's root; in the creator's folder the skill lives in skills/<id>
    const rel = path.relative(ROOT, dir).replace(/\\/g, '/');
    const files = Object.fromEntries(Object.entries(walk(dir)).map(([f, text]) => [f, text.split(rel).join(`skills/${pack.id}`)]));
    json(res, 200, { files, notes: lines.filter((l) => !l.includes(tmp) && !l.includes(rel)) });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
};

const startRender = async (req, res) => {
  const { pack, plan } = await readJson(req);
  checkPack(pack);
  if (!plan || typeof plan !== 'object' || !Array.isArray(plan.shots)) throw new Error('Mande o plano do reel como um objeto JSON com shots');
  const id = crypto.randomBytes(6).toString('hex');
  const dir = path.join(ROOT, 'out', 'studio', id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pack.json'), JSON.stringify(pack, null, 2));
  fs.writeFileSync(path.join(dir, 'plan.json'), JSON.stringify({ ...plan, pack: pack.id }, null, 2));
  const job = { id, status: 'rendering', progress: 0, log: [], url: null, error: null, started: Date.now() };
  jobs.set(id, job);
  const out = path.join(dir, 'reel.mp4');
  run(process.execPath, ['scripts/render-reel.mjs', path.join(dir, 'plan.json'), '--pack', path.join(dir, 'pack.json'), '--out', out], {
    onLine: (line) => {
      const m = /^(\d{1,3})%$/.exec(line.trim());
      if (m) job.progress = Math.min(1, Number(m[1]) / 100);
      job.log = [...job.log, line].slice(-60);
    },
  }).then(({ code }) => {
    if (code === 0 && fs.existsSync(out)) {
      job.status = 'done';
      job.progress = 1;
      job.url = `/renders/${id}.mp4`;
    } else {
      job.status = 'error';
      job.error = job.log.slice(-8).join('\n') || `O render terminou com código ${code}`;
    }
  });
  json(res, 200, { id });
};

const getRender = (url, res) => {
  const job = jobs.get(url.searchParams.get('id') ?? '');
  if (!job) return json(res, 404, { error: 'Não existe esse render (o Studio reiniciou?). Exporte de novo.' });
  json(res, 200, { status: job.status, progress: job.progress, log: job.log, url: job.url, error: job.error });
};

const serveRender = (url, req, res) => {
  const m = /^\/renders\/([a-f0-9]{12})\.mp4$/.exec(url.pathname);
  const file = m && path.join(ROOT, 'out', 'studio', m[1], 'reel.mp4');
  if (!file || !fs.existsSync(file)) {
    res.statusCode = 404;
    return res.end('not found');
  }
  const size = fs.statSync(file).size;
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Accept-Ranges', 'bytes');
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
    res.setHeader('Content-Length', end - start + 1);
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.setHeader('Content-Length', size);
    fs.createReadStream(file).pipe(res);
  }
};

const footage = async (req, res) => {
  const name = decodeURIComponent(req.headers['x-file-name'] ?? 'footage.mp4');
  const id = slug(name);
  const dir = path.join(ROOT, 'public', 'footage', id);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(os.tmpdir(), `style-studio-upload-${crypto.randomBytes(4).toString('hex')}`);
  try {
    const size = await readToFile(req, tmp);
    if (!size) return json(res, 400, { error: 'O arquivo chegou vazio' });
    const plate = path.join(dir, 'plate.mp4');
    const { code, lines } = await run('ffmpeg', ['-v', 'error', '-y', '-i', tmp, '-r', '30', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', plate]);
    if (code !== 0) return json(res, 400, { error: `O ffmpeg não converteu "${name}": ${lines.slice(-3).join(' ')}` });
    const info = await probe(plate);
    json(res, 200, { plate: `footage/${id}/plate.mp4`, name, ...info });
  } finally {
    fs.rmSync(tmp, { force: true });
  }
};

const tone = async (req, res) => {
  const { plate, faceX, eyes, chin, at } = await readJson(req);
  if (typeof plate !== 'string' || !/^footage\/[a-z0-9-]+\/plate\.mp4$/.test(plate)) throw new Error('O plate tem que ser footage/<nome>/plate.mp4');
  const file = path.join(ROOT, 'public', plate);
  if (!fs.existsSync(file)) throw new Error(`Não achei ${plate} em public/`);
  const n = (v) => String(Math.round(Number(v) || 0));
  const { code, lines } = await run(process.execPath, ['scripts/footage-tone.mjs', file, n(faceX), n(eyes), n(chin), '--at', String(Math.max(0, Number(at) || 0))]);
  const out = lines.find((l) => l.startsWith('{'));
  if (code !== 0 || !out) return json(res, 400, { error: lines.join('\n') || 'footage-tone falhou' });
  json(res, 200, JSON.parse(out));
};

/** A connect-style middleware: handles the Studio's API and the renders, passes everything else on. */
export const api = async (req, res, next) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const is = (p, m) => url.pathname === p && req.method === m;
  try {
    if (is('/api/skill', 'POST')) return await skill(req, res);
    if (is('/api/render', 'POST')) return await startRender(req, res);
    if (is('/api/render', 'GET')) return getRender(url, res);
    if (is('/api/footage', 'POST')) return await footage(req, res);
    if (is('/api/tone', 'POST')) return await tone(req, res);
    if (url.pathname.startsWith('/renders/') && req.method === 'GET') return serveRender(url, req, res);
    if (url.pathname.startsWith('/api/')) return json(res, 404, { error: `Não existe ${req.method} ${url.pathname}` });
    return next();
  } catch (e) {
    return json(res, 500, { error: e instanceof Error ? e.message : String(e) });
  }
};
