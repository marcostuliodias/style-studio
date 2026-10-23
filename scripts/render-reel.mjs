// Render a reel plan (src/reel/plan.ts) through the reel entry. The plan is the input props, so its `pack` and `hero`
// pick the pack and the hero colour.
//   node scripts/render-reel.mjs plans/<video>.json                    the video: out/reels/<video>.mp4
//   node scripts/render-reel.mjs plans/<video>.json --stills auto      a still per shot once it has landed (after its
//                                                                      hit, for a scene that lands on a word), plus the
//                                                                      middle of each join: out/reels/<video>/*.png
//   node scripts/render-reel.mjs plans/<video>.json --stills 0,45,90   those reel frames
//   ... --pack <file>                                                    a pack that isn't in src/packs
// --out <folder or .mp4> writes somewhere else. The engine refuses a plan it can't render, by name, before any frame.
import fs from 'node:fs';
import path from 'node:path';
import { landed } from './lib/plan-frames.mjs';
import { arg, errorText, renderer, ROOT, withRemotion } from './lib/remotion.mjs';

const planPath = process.argv[2];
if (!planPath || planPath.startsWith('--')) {
  console.log('usage: node scripts/render-reel.mjs <plan.json> [--stills auto|<frames>] [--out <path>]');
  process.exit(1);
}
const plan = JSON.parse(fs.readFileSync(path.resolve(planPath), 'utf8'));
// --pack <file>: a pack from outside src/packs (the web app's draft) goes to the render whole, as `packData`
const packFile = arg('pack', null);
const pack = JSON.parse(fs.readFileSync(packFile ? path.resolve(packFile) : path.join(ROOT, 'src/packs', `${plan.pack}.json`), 'utf8'));
const name = path.basename(planPath, '.json');
const stills = arg('stills', null);
const out = path.resolve(ROOT, arg('out', stills ? `out/reels/${name}` : `out/reels/${name}.mp4`));

/** Reel frames to look at: each shot once it has landed, and the middle of each join that isn't a cut. */
const autoFrames = () => {
  const T = pack.transitions;
  const joinLen = { cut: 0, ease: T.ease.frames, zoom: T.zoomThrough.frames, flash: T.flash.frames, wipe: T.wipe?.frames, blur: T.blur?.frames, glitch: T.glitch?.frames, whip: T.whip?.frames };
  const picks = [];
  let start = 0;
  plan.shots.forEach((s, i) => {
    const tag = `s${String(i + 1).padStart(2, '0')}-${s.scene}`;
    const join = s.in ?? 'cut';
    if (joinLen[join]) picks.push({ frame: start + Math.floor(joinLen[join] / 2), tag: `${tag}-${join}` });
    picks.push({ frame: start + landed(s), tag });
    start += s.frames;
  });
  return picks;
};

await withRemotion('src/reel/entry.tsx', async ({ serveUrl, browser, browserExecutable, sweep }) => {
  const inputProps = packFile ? { ...plan, packData: pack } : plan;
  const composition = await renderer.selectComposition({ serveUrl, id: 'Reel', inputProps, browserExecutable, puppeteerInstance: browser });
  console.log(`${name}: ${plan.pack}, hero ${plan.hero ?? pack.palette.heroRotation[0]}, ${plan.shots.length} shots, ${composition.durationInFrames} frames (${(composition.durationInFrames / 30).toFixed(1)} s)`);
  if (stills) {
    const picks = stills === 'auto' ? autoFrames() : stills.split(',').map((f) => ({ frame: Number(f), tag: 'reel' }));
    fs.mkdirSync(out, { recursive: true });
    for (const f of fs.readdirSync(out)) if (/^(s\d\d-.*|reel)-f\d{4}\.png$/.test(f)) fs.rmSync(path.join(out, f));
    for (const { frame, tag } of picks) {
      const output = path.join(out, `${tag}-f${String(frame).padStart(4, '0')}.png`);
      await renderer.renderStill({ composition, serveUrl, output, frame, inputProps, browserExecutable, puppeteerInstance: browser, overwrite: true });
      console.log(path.relative(ROOT, output));
      sweep();
    }
  } else {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    let shown = -1;
    await renderer.renderMedia({
      composition, serveUrl, codec: 'h264', outputLocation: out, inputProps, browserExecutable, puppeteerInstance: browser, overwrite: true,
      onProgress: ({ progress }) => {
        const p = Math.floor(progress * 10);
        if (p > shown) console.log(`${(shown = p) * 10}%`);
      },
    });
    console.log(path.relative(ROOT, out));
  }
}).catch((e) => {
  // the engine's refusal names what's wrong, by shot; the stack trace under it only buries that (and the Studio shows
  // a render's last lines as its error)
  console.error(errorText(e));
  process.exit(1);
});
