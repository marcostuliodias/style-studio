// What the import and the clean-up share: ffmpeg/ffprobe calls, the whisper Python, word timings on disk.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './remotion.mjs';

export const probe = (file) => {
  const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate,codec_name:format=duration', '-of', 'json', file], { encoding: 'utf8' });
  const j = JSON.parse(out);
  const s = j.streams?.[0] ?? {};
  const [a, b] = (s.r_frame_rate ?? '30/1').split('/').map(Number);
  return { width: s.width, height: s.height, fps: b ? a / b : 30, codec: s.codec_name, duration: Number(j.format?.duration ?? 0) };
};

export const hasAudio = (file) => execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0', file], { encoding: 'utf8' }).trim().length > 0;

/** The Python with faster-whisper: the installer's (.whisper-python at the root), else python3/python. */
export const whisperPython = () => {
  const f = path.join(ROOT, '.whisper-python');
  if (fs.existsSync(f)) {
    const p = fs.readFileSync(f, 'utf8').trim();
    if (p && fs.existsSync(p)) return p;
  }
  for (const c of ['python3', 'python']) {
    const r = spawnSync(c, ['-c', 'import faster_whisper'], { stdio: 'ignore' });
    if (r.status === 0) return c;
  }
  return null;
};

/** Word timings for a video: <video>.json beside it, made with scripts/transcrever.py when missing. */
export const wordTimings = (video, { modelo = 'small', idioma = 'pt', quiet = false } = {}) => {
  const json = video.replace(/\.[^.]+$/, '.json');
  if (!fs.existsSync(json)) {
    const py = whisperPython();
    if (!py) throw new Error('faster-whisper não está instalado: rode o instalador, ou pip install faster-whisper');
    if (!quiet) console.log(`  transcrevendo ${path.relative(ROOT, video)} (faster-whisper ${modelo}, uma vez só)`);
    const r = spawnSync(py, [path.join(ROOT, 'scripts/transcrever.py'), video, '--modelo', modelo, '--idioma', idioma], { encoding: 'utf8' });
    if (r.status !== 0 || !fs.existsSync(json)) throw new Error(`a transcrição falhou:\n${(r.stderr || r.stdout || '').trim().split('\n').slice(-6).join('\n')}`);
    if (!quiet) console.log(`  ${(r.stdout || '').trim().split('\n').pop()}`);
  }
  return JSON.parse(fs.readFileSync(json, 'utf8'));
};

/** Every word in order, flattened, with its segment index: { w (as spoken), n (normalised), start, end, seg }. */
export const flatWords = (t) => {
  const out = [];
  (t.segments ?? []).forEach((seg, si) => {
    for (const x of seg.words ?? []) {
      const w = (x.word ?? '').trim();
      if (!w) continue;
      out.push({ w, n: norm(w), start: x.start, end: x.end, seg: si });
    }
  });
  return out;
};
export const norm = (w) => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
