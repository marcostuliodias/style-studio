import type { StylePack } from '../../src/engine/pack';
import type { Shoot } from '../../src/kit/Presenter';
import type { ReelPlan } from '../../src/reel/plan';
import { SHIPPED } from './packs';
import './preview.css';

// The preview page, inside the Studio's iframe. It hands the pack to the engine on `window` BEFORE the engine loads
// (src/engine/style.ts reads it once, at module level), then imports the app that mounts the players. The Studio
// reloads this page (?rev=N) on every change; ?compare=1 reads the base style instead, for "hold to compare";
// ?card=<id> shows one shipped style's title scene, for the gallery.

export type Handed = { pack: StylePack; hero?: string; plan?: ReelPlan | null; shoot?: Shoot | null; at?: number };
type W = Window & { __STYLE_PACK__?: { pack: StylePack; hero?: string }; __STYLE_SHOOT__?: unknown; __STYLE_PLATES__?: Record<string, string> };

const w = window as W;
// the footage the Studio already fetched, as blob: URLs (same origin), so this page never fetches it again
try {
  const held = (window.parent as unknown as W | undefined)?.__STYLE_PLATES__;
  if (held && window.parent !== window) w.__STYLE_PLATES__ = { ...held };
} catch {
  // a page opened on its own has no parent to read
}
const q = new URLSearchParams(location.search);
const rev = q.get('rev') ?? '0';
const card = q.get('card');
const compare = q.get('compare') === '1';
const root = document.getElementById('root')!;

const tell = (msg: Record<string, unknown>) => window.parent?.postMessage({ source: 'style-preview', rev, card, compare, ...msg }, location.origin);

const fail = (e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  root.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'preview-error';
  const h = document.createElement('strong');
  h.textContent = 'Este estilo não renderiza';
  const pre = document.createElement('pre');
  pre.textContent = message;
  box.append(h, pre);
  root.append(box);
  tell({ type: 'error', message });
};

const read = (key: string): Handed | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Handed) : null;
  } catch {
    return null;
  }
};

(async () => {
  try {
    if (card) {
      const pack = SHIPPED[card];
      if (!pack) throw new Error(`Não existe o estilo "${card}"`);
      w.__STYLE_PACK__ = { pack, hero: pack.palette.heroRotation[0] ?? 'win' };
      const app = await import('./PreviewApp');
      app.mountCard(root);
    } else {
      const handed = read(compare ? 'style-studio:compare' : 'style-studio:preview');
      if (!handed?.pack) throw new Error('Ainda sem rascunho: abra o Studio em / e esta página se preenche.');
      w.__STYLE_PACK__ = { pack: handed.pack, hero: handed.hero };
      if (handed.shoot) w.__STYLE_SHOOT__ = { shoot: handed.shoot, at: handed.at ?? 0 };
      const app = await import('./PreviewApp');
      app.mount(root, { playing: q.get('play') !== '0', view: q.get('view') === 'reel' ? 'reel' : 'scenes', plan: handed.plan ?? null, tell });
    }
    tell({ type: 'ready' });
  } catch (e) {
    fail(e);
  }
})();
