// The storyboard: a local page where the creator approves a reel plan before the render.
//   node scripts/storyboard.mjs plans/<video>.json [--pack <file>] [--port 3495] [--no-open] [--out out/storyboard/<video>]
// Renders a still per shot (and one per option a shot offers), serves the page at http://localhost:<port>, opens the
// browser and waits. The creator watches the cut with the shots marked on it, picks between the options, marks
// speech errors and breaths to cut, writes what to change (for this video, or always), and approves or asks for
// changes. Then this script:
//   - applies the chosen options to the plan (plans/<video>.json; the version before goes to plans/<video>.antes.json),
//   - appends the "always" notes to plans/regras.json, the creator's rules every skill reads before planning,
//   - writes everything the creator said to plans/<video>.storyboard.json,
//   - prints a summary and exits 0 when approved, 2 when the creator asked for changes (fix the plan and run it again).
// A shot offers options as `options: [{ scene, props, in?, why }]` in the plan; each is a whole shot of the same length.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { landed, starts } from './lib/plan-frames.mjs';
import { arg, errorText, renderer, ROOT, withRemotion } from './lib/remotion.mjs';

const FPS = 30;
const planPath = process.argv[2];
if (!planPath || planPath.startsWith('--')) {
  console.log('uso: node scripts/storyboard.mjs plans/<video>.json [--pack <file>] [--port 3495] [--no-open]');
  process.exit(1);
}
const planFile = path.resolve(planPath);
const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
const packFile = arg('pack', null);
const pack = JSON.parse(fs.readFileSync(packFile ? path.resolve(packFile) : path.join(ROOT, 'src/packs', `${plan.pack}.json`), 'utf8'));
const name = path.basename(planFile, '.json');
const out = path.resolve(ROOT, arg('out', `out/storyboard/${name}`));
const port = Number(arg('port', '3495'));
const noOpen = process.argv.includes('--no-open');
const rulesFile = path.join(path.dirname(planFile), 'regras.json');
const SCENES = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/reel/scenes.json'), 'utf8'));
const PAGE = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'lib/storyboard.html'), 'utf8');

const shots = plan.shots ?? [];
const at = starts(shots);
const total = shots.reduce((a, s) => a + s.frames, 0);
const sceneName = (id) => SCENES[id] ? `${id}` : id;

/** A shot with one of its options in place: same length, beat and note; the option's scene, props and join. */
const withOption = (shot, opt) => {
  const { options, ...base } = shot;
  const next = { ...base, scene: opt.scene ?? shot.scene, props: opt.props ?? shot.props };
  if (opt.in) next.in = opt.in;
  return next;
};
const planWith = (i, shot) => ({ ...plan, shots: shots.map((s, j) => (j === i ? shot : s)) });

// ── Stills: one per shot, one per option ──
const stillOf = (i, k) => `s${String(i + 1).padStart(2, '0')}${k == null ? '' : `-op${k + 1}`}.png`;
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (/^s\d\d(-op\d+)?\.png$/.test(f)) fs.rmSync(path.join(out, f));
const jobs = [];
shots.forEach((s, i) => {
  jobs.push({ file: stillOf(i), frame: at[i] + landed(s), plan });
  (s.options ?? []).forEach((opt, k) => {
    const shot = withOption(s, opt);
    jobs.push({ file: stillOf(i, k), frame: at[i] + landed(shot), plan: planWith(i, shot) });
  });
});
console.log(`${name}: ${pack.name}, ${shots.length} planos, ${(total / FPS).toFixed(1)} s; ${jobs.length} imagens para o storyboard`);
const failed = {};
await withRemotion('src/reel/entry.tsx', async ({ serveUrl, browser, browserExecutable, sweep }) => {
  for (const [n, job] of jobs.entries()) {
    const inputProps = packFile ? { ...job.plan, packData: pack } : job.plan;
    try {
      const composition = await renderer.selectComposition({ serveUrl, id: 'Reel', inputProps, browserExecutable, puppeteerInstance: browser });
      await renderer.renderStill({ composition, serveUrl, output: path.join(out, job.file), frame: job.frame, inputProps, browserExecutable, puppeteerInstance: browser, overwrite: true, scale: 0.5 });
      process.stdout.write(`\r  ${n + 1}/${jobs.length} ${job.file}      `);
    } catch (e) {
      failed[job.file] = errorText(e).split('\n')[0];
      process.stdout.write(`\r  ${n + 1}/${jobs.length} ${job.file}: FALHOU (${failed[job.file]})\n`);
    }
    sweep();
  }
}).catch((e) => {
  console.error(errorText(e));
  process.exit(1);
});
process.stdout.write('\n');

// ── Data for the page ──
const heroHex = () => {
  const h = plan.hero ?? pack.palette.heroRotation[0];
  return /^#/.test(h) ? h : pack.palette[h] ?? pack.palette.extended?.[h] ?? pack.palette.win;
};
const rules = () => (fs.existsSync(rulesFile) ? JSON.parse(fs.readFileSync(rulesFile, 'utf8')) : { regras: [] });
// the clean-up's record, beside the plate (scripts/limpar.mjs): what was cut from the raw edit, for the creator to keep
const footageDir = plan.shoot?.plate ? path.join(ROOT, 'public', path.dirname(plan.shoot.plate)) : null;
const cortesFile = footageDir ? path.join(footageDir, 'cortes.json') : null;
const limpeza = () => {
  if (!cortesFile || !fs.existsSync(cortesFile)) return null;
  const c = JSON.parse(fs.readFileSync(cortesFile, 'utf8'));
  return { aplicados: c.aplicados ?? [], mantidos: c.mantidos ?? [], duracaoOriginal: c.duracaoOriginal, duracaoFinal: c.duracaoFinal, original: fs.existsSync(path.join(footageDir, c.original)) ? `/original${path.extname(c.original)}` : null, originalFile: c.original };
};
const dados = () => ({
  nome: name,
  titulo: plan.title ?? name,
  estilo: pack.name,
  hero: heroHex(),
  fps: FPS,
  from: plan.from ?? 0,
  total,
  plate: plan.shoot?.plate ? `/plate${path.extname(plan.shoot.plate)}` : null,
  audio: plan.audio && plan.audio !== plan.shoot?.plate ? `/audio${path.extname(plan.audio)}` : null,
  captions: plan.captions ?? [],
  regras: rules().regras,
  limpeza: limpeza(),
  shots: shots.map((s, i) => ({
    n: i + 1,
    scene: sceneName(s.scene),
    layout: s.props?.layout ?? null,
    beat: s.beat ?? null,
    note: s.note ?? '',
    in: s.in ?? 'cut',
    start: at[i],
    frames: s.frames,
    still: failed[stillOf(i)] ? null : `/stills/${stillOf(i)}`,
    erro: failed[stillOf(i)] ?? null,
    options: (s.options ?? []).map((o, k) => ({ scene: o.scene ?? s.scene, why: o.why ?? '', still: failed[stillOf(i, k)] ? null : `/stills/${stillOf(i, k)}`, erro: failed[stillOf(i, k)] ?? null })),
  })),
});

// ── Serving ──
const TYPES = { '.png': 'image/png', '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.aac': 'audio/aac' };
const sendFile = (req, res, file) => {
  if (!file || !fs.existsSync(file)) { res.writeHead(404); return res.end('não achei'); }
  const size = fs.statSync(file).size;
  const type = TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
  if (m) {
    const a = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
    const b = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${size}`, 'Content-Length': b - a + 1, 'Accept-Ranges': 'bytes' });
    return fs.createReadStream(file, { start: a, end: b }).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
  fs.createReadStream(file).pipe(res);
};
const body = (req) => new Promise((resolve) => { let s = ''; req.on('data', (c) => (s += c)); req.on('end', () => resolve(s)); });

let decided = null;
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(PAGE); }
  if (url.pathname === '/dados') { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); return res.end(JSON.stringify(dados())); }
  if (url.pathname.startsWith('/stills/')) return sendFile(req, res, path.join(out, path.basename(url.pathname)));
  if (url.pathname.startsWith('/plate')) return sendFile(req, res, plan.shoot?.plate ? path.join(ROOT, 'public', plan.shoot.plate) : null);
  if (url.pathname.startsWith('/original')) { const l = limpeza(); return sendFile(req, res, l ? path.join(footageDir, l.originalFile) : null); }
  if (url.pathname.startsWith('/audio')) return sendFile(req, res, plan.audio ? path.join(ROOT, 'public', plan.audio) : null);
  if (url.pathname === '/decidir' && req.method === 'POST') {
    try { decided = JSON.parse(await body(req)); } catch { res.writeHead(400); return res.end('json?'); }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"ok":true}');
    setTimeout(finish, 300);
    return;
  }
  res.writeHead(404); res.end('não achei');
});
server.listen(port, '127.0.0.1', () => {
  const link = `http://localhost:${port}/`;
  console.log(`Storyboard em ${link}  (esperando o criador aprovar; Ctrl+C cancela)`);
  if (!noOpen) {
    const cmd = process.platform === 'darwin' ? ['open', [link]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', link]] : ['xdg-open', [link]];
    try { spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true }).unref(); } catch {}
  }
});
server.on('error', (e) => { console.error(e.code === 'EADDRINUSE' ? `a porta ${port} está em uso: passe --port <outra>` : e.message); process.exit(1); });

// ── The decision ──
const sec = (f) => `${(f / FPS).toFixed(1)} s`;
function finish() {
  const d = decided;
  const when = new Date().toISOString();
  const escolhas = (d.escolhas ?? []).filter((e) => e.option != null);
  const ajustes = (d.ajustes ?? []).filter((a) => a.texto?.trim());
  const cortes = (d.cortes ?? []).sort((a, b) => a.from - b.from);
  const notas = (d.notas ?? '').trim();
  const manter = (d.manter ?? []).map(Number).filter((x) => x > 0).sort((a, b) => a - b);

  // the chosen options go into the plan; the plan as it was is kept beside it
  if (escolhas.length) {
    fs.writeFileSync(path.join(path.dirname(planFile), `${name}.antes.json`), JSON.stringify(plan, null, 2) + '\n');
    for (const e of escolhas) shots[e.shot] = withOption(shots[e.shot], shots[e.shot].options[e.option]);
  }
  if (d.status === 'aprovado') for (const s of shots) delete s.options;
  fs.writeFileSync(planFile, JSON.stringify({ ...plan, shots }, null, 2) + '\n');

  // "always" notes become the creator's rules
  const sempre = ajustes.filter((a) => a.sempre);
  if (sempre.length) {
    const r = rules();
    for (const a of sempre) r.regras.push({ texto: a.texto.trim(), de: name, em: when.slice(0, 10), ...(a.shot != null ? { plano: a.shot + 1, cena: shots[a.shot].scene } : {}) });
    fs.writeFileSync(rulesFile, JSON.stringify(r, null, 2) + '\n');
  }

  const record = { status: d.status, em: when, manter, escolhas: escolhas.map((e) => ({ plano: e.shot + 1, opcao: e.option + 1 })), ajustes: ajustes.map((a) => ({ plano: a.shot != null ? a.shot + 1 : null, texto: a.texto.trim(), sempre: !!a.sempre })), cortes, notas };
  fs.writeFileSync(path.join(path.dirname(planFile), `${name}.storyboard.json`), JSON.stringify(record, null, 2) + '\n');

  console.log('');
  console.log(d.status === 'aprovado' ? `APROVADO pelo criador (${when.slice(11, 16)}).` : `MUDANÇAS pedidas pelo criador (${when.slice(11, 16)}).`);
  if (escolhas.length) console.log(`Opções escolhidas e já aplicadas em ${path.relative(ROOT, planFile)}: ${escolhas.map((e) => `plano ${e.shot + 1} → opção ${e.option + 1} (${shots[e.shot].scene})`).join('; ')}.`);
  for (const a of ajustes) console.log(`- ${a.shot != null ? `Plano ${a.shot + 1} (${shots[a.shot].scene}, ${sec(at[a.shot])}): ` : ''}${a.texto.trim()}${a.sempre ? '  [SEMPRE: gravado em plans/regras.json]' : ''}`);
  const l = limpeza();
  for (const id of manter) { const c = l?.aplicados.find((x) => x.id === id); console.log(`- MANTER o trecho que a limpeza tirou #${id}${c ? ` (${c.tipo}: ${c.texto})` : ''}`); }
  for (const c of cortes) console.log(`- CORTAR do vídeo (${c.tipo}): ${c.from.toFixed(2)} s a ${c.to.toFixed(2)} s`);
  if (notas) console.log(`- Notas: ${notas}`);
  if (manter.length || cortes.length) {
    const orig = l ? path.join(path.dirname(plan.shoot.plate), l.originalFile) : null;
    const flags = [manter.length ? `--manter ${manter.join(',')}` : '', cortes.length ? `--cortar ${cortes.map((c) => `${c.from.toFixed(2)}-${c.to.toFixed(2)}`).join(',')}` : ''].filter(Boolean).join(' ');
    console.log(orig
      ? `Rode: node scripts/limpar.mjs public/${orig} ${flags}  (o plate.mp4 e o plate.json mudam de tempo: refaça from, as legendas e os planos a partir do plate.json novo, e abra o storyboard de novo)`
      : 'Os cortes são tempos do vídeo em public/footage (não do reel): tire esses trechos com o ffmpeg, refaça os tempos das palavras e ajuste o plano.');
  }
  console.log(d.status === 'aprovado' ? (ajustes.length || cortes.length || manter.length ? 'Aplique os ajustes e renderize o vídeo.' : 'Pode renderizar o vídeo.') : 'Ajuste o plano e rode o storyboard de novo.');
  server.close();
  process.exit(d.status === 'aprovado' ? 0 : 2);
}
