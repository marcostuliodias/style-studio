import type { StylePack } from '../../src/engine/pack';
import glass from '../../src/packs/glass.json';
import ledger from '../../src/packs/ledger.json';
import pop from '../../src/packs/pop.json';
import sketch from '../../src/packs/sketch.json';
import terminal from '../../src/packs/terminal.json';
import volt from '../../src/packs/volt.json';

// The six shipped packs, read straight from their JSON (never through src/engine/style.ts, which picks one pack for
// the whole page as soon as it loads: only the preview iframe does that).

export const SHIPPED: Record<string, StylePack> = {
  volt: volt as unknown as StylePack,
  ledger: ledger as unknown as StylePack,
  sketch: sketch as unknown as StylePack,
  terminal: terminal as unknown as StylePack,
  glass: glass as unknown as StylePack,
  pop: pop as unknown as StylePack,
};

export const SHIPPED_IDS = Object.keys(SHIPPED);

/** One line on each shipped style, for the gallery. */
export const BLURB: Record<string, string> = {
  volt: 'Creator alto: Anton em caixa alta, amarelo elétrico, word-pop',
  ledger: 'Editorial quieto: Garamond sobre papel-jornal, um vermelho',
  sketch: 'Quadro branco: desenhado à mão no papel, marca-texto',
  terminal: 'Código: verde fósforo num CRT, digitado',
  glass: 'Premium: vidro fosco sobre um gradiente que flutua',
  pop: 'Neo-brutal: bordas de tinta, sombras duras, adesivos',
};

export const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** A style's id from its name: lowercase words joined by dashes (it names the skill's folder). */
export const slug = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
