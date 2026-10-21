// How light the footage is where words sit over it: the area under the chin (usually the shirt), as relative luminance
// from 0 (black) to 1 (white). The engine takes white or ink type for words straight on the footage from it (the
// shoot's `tone.chest`, src/kit/contrast.ts). Needs only ffmpeg.
//   node scripts/footage-tone.mjs <video> <faceX> <eyes> <chin> [--at <seconds>]
// faceX, eyes and chin are the shoot's own measurements, in the footage's pixels. Prints the shoot's `tone` as JSON.
import { execFileSync } from 'node:child_process';

const [video, faceX, eyes, chin] = process.argv.slice(2, 6);
if (!video || !chin) {
  console.log('usage: node scripts/footage-tone.mjs <video> <faceX> <eyes> <chin> [--at <seconds>]');
  process.exit(1);
}
const i = process.argv.indexOf('--at');
const at = i > 0 ? process.argv[i + 1] : '1';
const face = Number(chin) - Number(eyes);
// the same patch the web app samples: below the chin, about the width of the shoulders
const x = Math.max(0, Math.round(Number(faceX) - face * 1.2));
const y = Math.round(Number(chin) + face * 0.35);
const w = Math.round(face * 2.4);
const h = Math.round(face * 1.25);
const raw = execFileSync('ffmpeg', ['-v', 'error', '-ss', at, '-i', video, '-frames:v', '1', '-vf', `crop=min(${w}\\,iw-${x}):min(${h}\\,ih-${y}):${x}:${y},scale=60:40`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 20 });
const lin = (c) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
let sum = 0;
for (let p = 0; p < raw.length; p += 3) sum += 0.2126 * lin(raw[p]) + 0.7152 * lin(raw[p + 1]) + 0.0722 * lin(raw[p + 2]);
const chest = +(sum / (raw.length / 3)).toFixed(3);
console.log(JSON.stringify({ chest }));
console.error(chest > 0.179 ? 'light: words over it go ink with a white edge' : 'dark: words over it go white with a black edge');
