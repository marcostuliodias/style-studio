// Bring a creator's video in from wherever it is (Downloads, the desktop, a phone export) as the raw edit the clean-up
// starts from: public/footage/<name>/original.mp4, H.264 at 30 fps with its sound.
//   node scripts/importar.mjs <video> [--nome <name>]        name: a slug of the file's name when left out
// Prints the folder, the size and the length. Then: node scripts/limpar.mjs public/footage/<name>/original.mp4
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { arg, ROOT } from './lib/remotion.mjs';
import { hasAudio, probe } from './lib/video.mjs';

const src = process.argv[2];
if (!src || src.startsWith('--')) {
  console.log('uso: node scripts/importar.mjs <video> [--nome <nome>]');
  process.exit(1);
}
const file = path.resolve(src.replace(/^~(?=\/|$)/, process.env.HOME ?? ''));
if (!fs.existsSync(file)) {
  console.log(`não achei ${file}`);
  process.exit(1);
}
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'video';
const name = slug(arg('nome', path.basename(file, path.extname(file))));
const dir = path.join(ROOT, 'public/footage', name);
const out = path.join(dir, 'original.mp4');
if (fs.existsSync(out)) {
  console.log(`já existe ${path.relative(ROOT, out)}: use --nome <outro>, ou apague a pasta para importar de novo`);
  process.exit(1);
}
const info = probe(file);
if (!info.width) {
  console.log(`${file} não parece um vídeo (ffprobe não achou imagem)`);
  process.exit(1);
}
if (!hasAudio(file)) {
  console.log(`${file} não tem som: o skill precisa da voz para legendar e cortar`);
  process.exit(1);
}
fs.mkdirSync(dir, { recursive: true });
console.log(`importando ${path.basename(file)} (${info.width}x${info.height}, ${info.fps.toFixed(2)} fps, ${info.duration.toFixed(1)} s) para ${path.relative(ROOT, dir)}/`);
// H.264 and AAC at 30 fps, so the engine's frame maths and the browser agree; a phone's HDR or 60 fps comes in flat
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-map', '0:v:0', '-map', '0:a:0', '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out], { stdio: 'inherit' });
const done = probe(out);
console.log(`ok: ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1e6).toFixed(0)} MB, ${done.duration.toFixed(1)} s)`);
console.log(`próximo: node scripts/limpar.mjs ${path.relative(ROOT, out)}`);
