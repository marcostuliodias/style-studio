// Stills of the review board in one or more packs:
//   node scripts/render-stills.mjs [--packs volt,ledger] [--scenes Title,List] [--frames 60] [--out out/stills]
// Writes out/stills/<pack>/<scene>-f<frame>.png. BROWSER=<path to chrome-headless-shell> reuses a browser already on
// disk; without it Remotion fetches its own on first run.
import fs from 'node:fs';
import path from 'node:path';
import { arg, renderer, ROOT, withRemotion } from './lib/remotion.mjs';

const packs = arg('packs', 'volt,ledger').split(',');
const scenes = arg('scenes', 'Title,List,Stat,Quote,WordPop').split(',');
const frames = arg('frames', '60').split(',').map(Number);
const out = path.resolve(ROOT, arg('out', 'out/stills'));

let ok = 0;
const failed = [];
await withRemotion('src/board/entry.tsx', async ({ serveUrl, browser, browserExecutable, sweep }) => {
  for (const pack of packs) {
    for (const scene of scenes) {
      for (const frame of frames) {
        const inputProps = { pack };
        const output = path.join(out, pack, `${scene.toLowerCase()}-f${String(frame).padStart(3, '0')}.png`);
        try {
          const composition = await renderer.selectComposition({ serveUrl, id: `Board-${scene}`, inputProps, browserExecutable, puppeteerInstance: browser });
          fs.mkdirSync(path.dirname(output), { recursive: true });
          await renderer.renderStill({ composition, serveUrl, output, frame, inputProps, browserExecutable, puppeteerInstance: browser, overwrite: true });
          console.log(`${pack}/${path.basename(output)}`);
          ok++;
        } catch (e) {
          console.log(`FAIL ${pack} ${scene} f${frame}: ${e.message.split('\n')[0]}`);
          failed.push(`${pack}/${scene}`);
        }
        sweep();
      }
    }
  }
});
console.log(`done ${ok}/${packs.length * scenes.length * frames.length}${failed.length ? `; failed: ${failed.join(', ')}` : ''}`);
