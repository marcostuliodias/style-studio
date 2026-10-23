// The clean-up: from the raw edit (public/footage/<name>/original.mp4) to the cut the engine edits (plate.mp4), by the
// word timings. It takes out the silences and long pauses between words, the stutters (a word said twice), the
// retakes (a phrase started over: the first try goes, the last stays) and the dead air at the start and the end, keeps
// the word timings in step (plate.json), and writes what it did to cortes.json, which the storyboard shows the creator
// so they can keep any of it.
//   node scripts/limpar.mjs public/footage/<name>/original.mp4
//   ... --manter 3,7            keep those cuts (ids from cortes.json or the storyboard); adds to the ones already kept
//   ... --cortar 12.3-13.1,...  cut those ranges too, in seconds of the current plate.mp4 (the storyboard's marks)
//   ... --so-propor             list the cuts without cutting
//   ... --pausa 0.5 --silencio 1.2   a pause from this long is shortened; from this long it counts as a silence
// Every run starts over from the original and its timings (transcribed once), so keeping a cut later is cheap.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { arg, ROOT } from './lib/remotion.mjs';
import { flatWords, probe, wordTimings } from './lib/video.mjs';

const src = process.argv[2];
if (!src || src.startsWith('--')) {
  console.log('uso: node scripts/limpar.mjs public/footage/<nome>/original.mp4 [--manter ids] [--cortar a-b,...] [--so-propor]');
  process.exit(1);
}
const original = path.resolve(src);
if (!fs.existsSync(original)) { console.log(`não achei ${original}`); process.exit(1); }
const dir = path.dirname(original);
const plate = path.join(dir, 'plate.mp4');
const plateJson = path.join(dir, 'plate.json');
const cortesFile = path.join(dir, 'cortes.json');
const PAUSA = Number(arg('pausa', '0.5'));
const SILENCIO = Number(arg('silencio', '1.2'));
const AFTER = 0.15; // kept after a word's end
const BEFORE = 0.1; // kept before the next word's start
const onlyList = process.argv.includes('--so-propor');
const rel = (f) => path.relative(ROOT, f);
const s2 = (x) => x.toFixed(2);

const was = fs.existsSync(cortesFile) ? JSON.parse(fs.readFileSync(cortesFile, 'utf8')) : { mantidos: [], manuais: [] };
const info = probe(original);
const dur = info.duration;
const t = wordTimings(original);
const W = flatWords(t);
if (W.length < 3) { console.log('a transcrição quase não tem palavras: o vídeo tem fala?'); process.exit(1); }

// ── Proposals ──
const props = [];
if (W[0].start > 0.8) props.push({ tipo: 'início', from: 0, to: W[0].start - 0.3, texto: '' });
if (dur - W[W.length - 1].end > 1.0) props.push({ tipo: 'fim', from: W[W.length - 1].end + 0.5, to: dur, texto: '' });
for (let k = 0; k + 1 < W.length; k++) {
  const gap = W[k + 1].start - W[k].end;
  if (gap >= PAUSA) {
    const from = W[k].end + AFTER;
    const to = W[k + 1].start - BEFORE;
    if (to - from > 0.1) props.push({ tipo: gap >= SILENCIO ? 'silêncio' : 'pausa', from, to, texto: `depois de "${W[k].w}"` });
  }
}
for (let k = 0; k + 1 < W.length; k++) {
  if (W[k].n.length >= 2 && W[k].n === W[k + 1].n && W[k + 1].start - W[k].end < 0.7) {
    props.push({ tipo: 'repetição', from: Math.max(0, W[k].start - 0.05), to: W[k + 1].start - 0.03, texto: W[k].w });
  }
}
// a retake: the same three words start again within 20 s, at a restart (after a breath or a new segment); the first
// try, from its first word up to the restart, goes
const boundary = (j) => j === 0 || W[j].seg !== W[j - 1].seg || W[j].start - W[j - 1].end >= 0.25;
for (let i = 0; i + 2 < W.length; i++) {
  const tri = W[i].n + W[i + 1].n + W[i + 2].n;
  if (tri.length < 8) continue;
  for (let j = i + 3; j + 2 < W.length && W[j].start - W[i].start <= 20; j++) {
    if (W[j].n === W[i].n && W[j + 1].n === W[i + 1].n && W[j + 2].n === W[i + 2].n && boundary(j)) {
      props.push({ tipo: 'refeito', from: Math.max(0, W[i].start - 0.05), to: W[j].start - BEFORE, texto: W.slice(i, j).map((x) => x.w).join(' ') });
      i = j - 1;
      break;
    }
  }
}
// manual ranges come in plate seconds (what the storyboard showed) and map back to the original through the cuts
// applied last time
const applied = (was.aplicados ?? []).slice().sort((a, b) => a.from - b.from);
const toOriginal = (tp) => {
  let removed = 0;
  for (const c of applied) {
    if (c.from - removed <= tp) removed += c.to - c.from; else break;
  }
  return tp + removed;
};
const manuais = [...(was.manuais ?? [])];
for (const r of (arg('cortar', '') || '').split(',').filter(Boolean)) {
  const [a, b] = r.split('-').map(Number);
  if (!(a < b)) { console.log(`--cortar: "${r}" não é um trecho a-b`); process.exit(1); }
  manuais.push({ tipo: 'marcado', from: toOriginal(a), to: toOriginal(b) });
}

// ids are stable: the proposals in time order, from the same transcript each run
props.sort((a, b) => a.from - b.from);
props.forEach((p, i) => (p.id = i + 1));
const mantidos = new Set([...(was.mantidos ?? []), ...(arg('manter', '') || '').split(',').filter(Boolean).map(Number)]);
for (const id of mantidos) if (!props.some((p) => p.id === id)) console.log(`aviso: não existe o corte ${id} para manter`);

// ── The cuts that apply: proposals not kept, plus the manual ones, merged where they touch ──
const chosen = [...props.filter((p) => !mantidos.has(p.id)), ...manuais.map((m, i) => ({ ...m, id: null, texto: m.texto ?? '' }))]
  .map((c) => ({ ...c, from: Math.max(0, c.from), to: Math.min(dur, c.to) }))
  .filter((c) => c.to - c.from > 0.04)
  .sort((a, b) => a.from - b.from);
const cuts = [];
for (const c of chosen) {
  const last = cuts[cuts.length - 1];
  if (last && c.from <= last.to + 0.02) { last.to = Math.max(last.to, c.to); if (c.tipo === 'refeito' || c.tipo === 'marcado') { last.tipo = c.tipo; last.texto = c.texto || last.texto; } }
  else cuts.push({ ...c });
}
const removed = cuts.reduce((a, c) => a + (c.to - c.from), 0);

// ── Report ──
const count = {};
for (const c of cuts) count[c.tipo] = (count[c.tipo] ?? 0) + 1;
console.log(`${rel(original)}: ${s2(dur)} s, ${W.length} palavras. ${cuts.length} cortes, ${s2(removed)} s fora → ${s2(dur - removed)} s${mantidos.size ? ` (mantidos: ${[...mantidos].join(', ')})` : ''}`);
for (const [k, n] of Object.entries(count)) console.log(`  ${n} ${k}`);
for (const c of cuts) console.log(`  ${c.id != null ? `#${c.id}` : ' m'} ${c.tipo.padEnd(9)} ${s2(c.from)} → ${s2(c.to)}  ${c.texto}`);
if (onlyList) process.exit(0);

// ── Apply: the segments between the cuts, concatenated ──
const keeps = [];
let at = 0;
for (const c of cuts) { if (c.from - at > 0.08) keeps.push([at, c.from]); at = c.to; }
if (dur - at > 0.08) keeps.push([at, dur]);
if (!cuts.length) {
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', original, '-c', 'copy', plate]);
} else {
  const script = keeps.map(([a, b], i) => `[0:v]trim=start=${s2(a)}:end=${s2(b)},setpts=PTS-STARTPTS[v${i}];[0:a]atrim=start=${s2(a)}:end=${s2(b)},asetpts=PTS-STARTPTS[a${i}]`).join(';')
    + ';' + keeps.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${keeps.length}:v=1:a=1[v][a]`;
  console.log(`  cortando (${keeps.length} trechos ficam)…`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', original, '-filter_complex', script, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', plate], { stdio: 'inherit' });
}

// ── The word timings, shifted onto the cut ──
const shift = (x) => { let r = 0; for (const c of cuts) { if (c.to <= x) r += c.to - c.from; else if (c.from < x) return null; } return x - r; };
const segs = [];
for (const seg of t.segments ?? []) {
  const words = [];
  for (const w of seg.words ?? []) {
    const mid = (w.start + w.end) / 2;
    const ns = shift(mid);
    if (ns == null) continue;
    const a = shift(w.start) ?? ns - (mid - w.start);
    const b = shift(w.end) ?? ns + (w.end - mid);
    words.push({ ...w, start: +Math.max(0, a).toFixed(3), end: +Math.max(a, b).toFixed(3) });
  }
  if (!words.length) continue;
  segs.push({ id: segs.length, start: words[0].start, end: words[words.length - 1].end, text: words.map((w) => w.word.trim()).join(' '), words });
}
const final = probe(plate).duration;
fs.writeFileSync(plateJson, JSON.stringify({ text: segs.map((s) => s.text).join(' '), language: t.language, duration: final, segments: segs }, null, 2) + '\n');
fs.writeFileSync(cortesFile, JSON.stringify({
  original: path.basename(original), duracaoOriginal: +dur.toFixed(3), duracaoFinal: +final.toFixed(3), em: new Date().toISOString().slice(0, 10),
  propostos: props, mantidos: [...mantidos].sort((a, b) => a - b), manuais, aplicados: cuts,
}, null, 2) + '\n');
console.log(`ok: ${rel(plate)} (${s2(final)} s) e ${rel(plateJson)} (tempo por palavra já no corte); o que saiu está em ${rel(cortesFile)}`);
