// What the render scripts share: the engine's root, Remotion loaded from it, a bundle of one entry with the public
// folder, a browser, and a sweep of the temp copies Remotion makes of the footage (it doesn't remove them on Windows),
// only ever its own: each run keeps its temp files in a folder of its own, so two renders at once (an export from the
// Studio and stills from a terminal) never delete each other's footage mid-frame.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(ROOT, 'package.json'));
export const renderer = require('@remotion/renderer');
const { bundle } = require('@remotion/bundler');

export const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};

/**
 * An error's whole message. Remotion keeps only the first line of an error from the page in `message`; the rest of it
 * (the engine's reasons, one a line) is at the top of `stack`, above the frames.
 */
export const errorText = (e) => {
  if (!(e instanceof Error)) return String(e);
  const lines = (e.stack ?? e.message).split('\n');
  const frames = lines.findIndex((l) => /^\s+at /.test(l));
  return lines.slice(0, frames < 0 ? undefined : frames).join('\n').replace(/^\w*Error: /, '');
};

/**
 * Bundle `entry` (relative to the root), open a browser, run `work({ serveUrl, browser, browserExecutable, sweep })`,
 * then close the browser and remove the bundle and the temp footage. BROWSER=<path to chrome-headless-shell> reuses a
 * browser already on disk.
 */
export const withRemotion = async (entry, work) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'style-pack-engine-'));
  // os.tmpdir() reads these on every call, so the bundle, the browser's profile and Remotion's copies of the footage
  // all land in this run's folder
  const env = { TEMP: process.env.TEMP, TMP: process.env.TMP, TMPDIR: process.env.TMPDIR };
  Object.assign(process.env, { TEMP: tmp, TMP: tmp, TMPDIR: tmp });
  const assets = () => fs.readdirSync(tmp).filter((d) => /^remotion-v.*-assets/.test(d));
  const sweep = () => {
    for (const d of assets()) try { fs.rmSync(path.join(tmp, d), { recursive: true, force: true }); } catch {}
  };
  const browserExecutable = process.env.BROWSER || null;
  let browser = null;
  try {
    const serveUrl = await bundle({ entryPoint: path.join(ROOT, entry), publicDir: path.join(ROOT, 'public') });
    browser = await renderer.openBrowser('chrome', { browserExecutable });
    // a composition that refuses to render (a pack-brought scene in a pack without it) leaves its tab closed under the browser
    process.on('unhandledRejection', (e) => { if (!/Target closed/.test(String(e))) throw e; });
    return await work({ serveUrl, browser, browserExecutable, sweep });
  } finally {
    await browser?.close({ silent: true }).catch(() => {});
    // the video compositor can hold its copy of the footage for a moment after the browser closes
    for (let i = 0; i < 10 && fs.existsSync(tmp); i++) {
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { await new Promise((r) => setTimeout(r, 500)); }
    }
    for (const [k, v] of Object.entries(env)) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
};
