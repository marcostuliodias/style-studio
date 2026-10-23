import type { Backdrop, FontFace, Signature, StylePack, Subtitles } from '../../src/engine/pack';
import { SHIPPED } from './packs';

// The panel's choices and what each one changes in the pack. Every control reads its current value off the pack (so
// the panel always shows what the JSON says, hand edits included) and applies a choice by mutating a copy of it.

export type Preview = { kind: 'face' | 'ground' | 'backdrop' | 'surface' | 'mark' | 'icon' | 'caption'; id?: string; font?: string; sample?: string };
export type Option = { id: string; label: string; hint?: string; swatch?: string; font?: string; preview?: Preview };
/** Which scenes a control changes, for the preview to outline while the pointer is on it. */
export type Affects = string[] | 'all';
const GRAPHIC = ['title', 'list', 'stat', 'quote', 'slam', 'chart'];
const CAPTIONED = ['title', 'list', 'stat', 'word-pop', 'doodle', 'command', 'float', 'sticker'];
export type PickControl = { kind: 'pick'; key: string; title: string; hint: string; options: Option[]; affects: Affects; layout?: 'cards' | 'segmented' | 'chips'; read: (p: StylePack) => string; apply: (p: StylePack, id: string) => void };
export type MultiControl = { kind: 'multi'; key: string; title: string; hint: string; options: Option[]; affects: Affects; read: (p: StylePack) => string[]; apply: (p: StylePack, ids: string[]) => void };
export type RangeControl = { kind: 'range'; key: string; title: string; hint: string; affects: Affects; min: number; max: number; step: number; ends: [string, string]; name: (v: number) => string; read: (p: StylePack) => number; apply: (p: StylePack, v: number) => void };
export type ColourControl = { kind: 'colour'; key: string; title: string; hint: string; options: Option[]; affects: Affects; read: (p: StylePack) => string; apply: (p: StylePack, hex: string) => void };
export type Control = PickControl | MultiControl | RangeControl | ColourControl;
export type Section = { id: string; title: string; summary: (p: StylePack) => string; controls: Control[] };

// ── Fonts ──────────────────────────────────────────────────────────────────────────────────────────────────────────

const FILES: Record<string, FontFace[]> = {
  Anton: [{ family: 'Anton', file: 'fonts/volt/Anton-Regular.woff2', weight: '100 900' }],
  Inter: [
    ...[400, 500, 600, 700, 800, 900].map((w) => ({ family: 'Inter', file: `fonts/volt/Inter-${w}.woff2`, weight: String(w) })),
    { family: 'Inter', file: 'fonts/volt/Inter-600-Italic.woff2', weight: '100 900', style: 'italic' as const },
  ],
  'EB Garamond': [
    { family: 'EB Garamond', file: 'fonts/ledger/EBGaramond-400.woff2', weight: '400' },
    { family: 'EB Garamond', file: 'fonts/ledger/EBGaramond-700.woff2', weight: '700' },
  ],
  Newsreader: [{ family: 'Newsreader', file: 'fonts/ledger/Newsreader-Variable.woff2', weight: '200 800' }],
  Caveat: [
    { family: 'Caveat', file: 'fonts/sketch/Caveat-400.woff2', weight: '400' },
    { family: 'Caveat', file: 'fonts/sketch/Caveat-700.woff2', weight: '700' },
  ],
  Virgil: [{ family: 'Virgil', file: 'fonts/sketch/Virgil-Regular.woff2', weight: '400' }],
  VT323: [{ family: 'VT323', file: 'fonts/terminal/VT323-Regular.woff2', weight: '400' }],
  Sora: [
    { family: 'Sora', file: 'fonts/glass/Sora-400.woff2', weight: '400' },
    { family: 'Sora', file: 'fonts/glass/Sora-700.woff2', weight: '700' },
  ],
  'Archivo Black': [{ family: 'Archivo Black', file: 'fonts/pop/ArchivoBlack-Regular.ttf', weight: '400' }],
  'Space Grotesk': [
    { family: 'Space Grotesk', file: 'fonts/pop/SpaceGrotesk-400.woff2', weight: '400' },
    { family: 'Space Grotesk', file: 'fonts/pop/SpaceGrotesk-700.woff2', weight: '700' },
  ],
  'JetBrains Mono': [
    { family: 'JetBrains Mono', file: 'fonts/shared/JetBrainsMono-400.woff2', weight: '400' },
    { family: 'JetBrains Mono', file: 'fonts/shared/JetBrainsMono-700.woff2', weight: '700' },
  ],
};

/** Every @font-face the panel itself needs, to show a face by its own letters (studio.css loads them as "Pick <family>"). */
export const PICK_FONTS = FILES;

const ensureFonts = (p: StylePack, family: string) => {
  const have = new Set(p.fonts.map((f) => f.file));
  for (const f of FILES[family] ?? []) if (!have.has(f.file)) p.fonts.push({ ...f });
};

/** Drop font files no voice uses any more. */
const pruneFonts = (p: StylePack) => {
  const used = new Set(Object.values(p.type).map((v) => v.family));
  p.fonts = p.fonts.filter((f) => used.has(f.family));
};

type Face = { id: string; label: string; family: string; weight: number; fallback: string; tracking: number };
const HEADLINES: Face[] = [
  { id: 'anton', label: 'Anton', family: 'Anton', weight: 400, fallback: 'sans-serif', tracking: 0.01 },
  { id: 'inter-900', label: 'Inter Black', family: 'Inter', weight: 900, fallback: 'sans-serif', tracking: -0.02 },
  { id: 'inter-700', label: 'Inter Bold', family: 'Inter', weight: 700, fallback: 'sans-serif', tracking: -0.015 },
  { id: 'eb-garamond-700', label: 'Garamond', family: 'EB Garamond', weight: 700, fallback: 'serif', tracking: -0.01 },
  { id: 'caveat-700', label: 'Caveat', family: 'Caveat', weight: 700, fallback: 'cursive', tracking: 0 },
  { id: 'vt323', label: 'VT323', family: 'VT323', weight: 400, fallback: 'monospace', tracking: 0.02 },
  { id: 'sora-700', label: 'Sora', family: 'Sora', weight: 700, fallback: 'sans-serif', tracking: -0.035 },
  { id: 'archivo-black', label: 'Archivo Black', family: 'Archivo Black', weight: 400, fallback: 'sans-serif', tracking: -0.025 },
  { id: 'space-grotesk-700', label: 'Space Grotesk', family: 'Space Grotesk', weight: 700, fallback: 'sans-serif', tracking: -0.01 },
];

const headline: PickControl = {
  kind: 'pick',
  key: 'headline',
  title: 'Títulos',
  hint: 'As palavras grandes de cada cena',
  affects: 'all',
  layout: 'cards',
  options: HEADLINES.map((f) => ({ id: f.id, label: f.label, preview: { kind: 'face', font: `'Pick ${f.family}'`, sample: 'Aa' } })),
  read: (p) => p.type.display.metrics,
  apply: (p, id) => {
    const f = HEADLINES.find((x) => x.id === id);
    if (!f) return;
    p.type.display = { ...p.type.display, family: f.family, fallback: f.fallback, weight: f.weight, style: 'normal', metrics: f.id, tracking: f.tracking };
    ensureFonts(p, f.family);
    pruneFonts(p);
  },
};

const headlineCase: PickControl = {
  kind: 'pick',
  key: 'headline-case',
  title: 'Caixa dos títulos',
  hint: 'Como escrito, ou tudo em maiúsculas',
  affects: 'all',
  layout: 'segmented',
  options: [
    { id: 'none', label: 'Como escrito' },
    { id: 'uppercase', label: 'MAIÚSCULAS' },
  ],
  read: (p) => (p.type.display.case === 'uppercase' ? 'uppercase' : 'none'),
  apply: (p, id) => {
    p.type.display.case = id === 'uppercase' ? 'uppercase' : 'none';
  },
};

const TEXT_SETS: Array<{ id: string; label: string; hint: string; from: string }> = [
  { id: 'sans', label: 'Sans', hint: 'Inter em tudo', from: 'volt' },
  { id: 'serif', label: 'Serifa', hint: 'Newsreader, rótulos em mono', from: 'ledger' },
  { id: 'hand', label: 'Mão', hint: 'Virgil e Caveat', from: 'sketch' },
  { id: 'mono', label: 'Mono', hint: 'JetBrains Mono', from: 'terminal' },
  { id: 'geometric', label: 'Geométrica', hint: 'Sora e Inter', from: 'glass' },
  { id: 'grotesk', label: 'Grotesk', hint: 'Space Grotesk', from: 'pop' },
];

const textSet: PickControl = {
  kind: 'pick',
  key: 'text',
  title: 'Texto',
  hint: 'Entradas, rótulos e texto pequeno',
  affects: GRAPHIC,
  layout: 'cards',
  options: TEXT_SETS.map((t) => ({ id: t.id, label: t.label, hint: t.hint, preview: { kind: 'face', font: `'Pick ${SHIPPED[t.from].type.body.family}'`, sample: 'Ag' } })),
  read: (p) => TEXT_SETS.find((t) => SHIPPED[t.from].type.body.metrics === p.type.body.metrics && SHIPPED[t.from].type.accent.metrics === p.type.accent.metrics)?.id ?? '',
  apply: (p, id) => {
    const t = TEXT_SETS.find((x) => x.id === id);
    if (!t) return;
    const src = SHIPPED[t.from];
    for (const v of ['accent', 'body', 'label', 'code'] as const) {
      p.type[v] = JSON.parse(JSON.stringify(src.type[v]));
      ensureFonts(p, src.type[v].family);
    }
    pruneFonts(p);
  },
};

// ── Colour ─────────────────────────────────────────────────────────────────────────────────────────────────────────

const ACCENTS: Option[] = [
  { id: '#FFE600', label: 'Amarelo' },
  { id: '#FFB000', label: 'Ouro' },
  { id: '#B6FF00', label: 'Lima' },
  { id: '#6EF2D1', label: 'Menta' },
  { id: '#59F3FF', label: 'Água' },
  { id: '#00E5FF', label: 'Ciano' },
  { id: '#2F6BFF', label: 'Azul' },
  { id: '#8B5CF6', label: 'Violeta' },
  { id: '#FF2E88', label: 'Magenta' },
  { id: '#FF4D8D', label: 'Rosa' },
  { id: '#D7261E', label: 'Vermelho' },
  { id: '#FF7A00', label: 'Laranja' },
  { id: '#B9861A', label: 'Ocre' },
  { id: '#1E7A4C', label: 'Floresta' },
].map((o) => ({ ...o, swatch: o.id }));

const accent: ColourControl = {
  kind: 'colour',
  key: 'accent',
  title: 'Cor de destaque',
  hint: 'A cor que pinça uma palavra: o "win" da paleta, primeira da rotação',
  affects: 'all',
  options: ACCENTS,
  read: (p) => p.palette.win.toUpperCase(),
  apply: (p, hex) => {
    p.palette.win = hex.toUpperCase();
    p.palette.heroRotation = ['win', ...p.palette.heroRotation.filter((c) => c !== 'win')];
  },
};

const ground: PickControl = {
  kind: 'pick',
  key: 'ground',
  title: 'Fundo',
  hint: 'O chão atrás de cada gráfico',
  affects: GRAPHIC,
  layout: 'cards',
  options: [
    { id: 'dark', label: 'Escuro', preview: { kind: 'ground', id: 'dark' } },
    { id: 'light', label: 'Claro', preview: { kind: 'ground', id: 'light' } },
  ],
  read: (p) => p.composition.ground,
  apply: (p, id) => {
    p.composition.ground = id === 'light' ? 'light' : 'dark';
  },
};

const rotation = (p: StylePack, n: number) => {
  const names = p.palette.heroRotation.filter((c) => c === 'win' || c === 'friction' || c in p.palette.extended);
  const out = [...new Set(['win', ...names, ...Object.keys(p.palette.extended)])].slice(0, n);
  return out.length ? out : ['win'];
};

const BACKDROPS: Array<{ id: string; label: string; hint: string; make: (p: StylePack) => Backdrop; is: (b: Backdrop) => boolean }> = [
  { id: 'grid', label: 'Grade', hint: 'Grade fina, brilho suave, grão', make: () => ({ kind: 'grid', size: 72, alpha: 0.06, fade: 0.6, glow: 0.3, grain: 0.1 }), is: (b) => b.kind === 'grid' },
  { id: 'dots', label: 'Blueprint', hint: 'Grade de pontos, marcas nos cantos', make: () => ({ kind: 'dots', size: 48, alpha: 0.12, fade: 0.5, ticks: true, glow: 0.2, grain: 0 }), is: (b) => b.kind === 'dots' },
  { id: 'horizon', label: 'Horizonte', hint: 'Grade de chão em perspectiva', make: () => ({ kind: 'horizon', size: 90, alpha: 0.14, horizon: 0.62, speed: 0.3, glow: 0.4 }), is: (b) => b.kind === 'horizon' },
  { id: 'aurora', label: 'Aurora', hint: 'Campos de cor que derivam', make: (p) => ({ kind: 'aurora', colours: rotation(p, 3), alpha: 0.35, speed: 0.1, grain: 0.15 }), is: (b) => b.kind === 'aurora' },
  { id: 'spotlight', label: 'Spot', hint: 'Uma luz suave vinda de cima', make: () => ({ kind: 'spotlight', alpha: 0.5, sway: 0.3 }), is: (b) => b.kind === 'spotlight' },
  { id: 'rings', label: 'Anéis', hint: 'Anéis que se espalham', make: () => ({ kind: 'rings', size: 160, alpha: 0.1, speed: 0.2, glow: 0.3 }), is: (b) => b.kind === 'rings' },
  { id: 'paper', label: 'Papel', hint: 'Papel quadriculado com grão', make: () => ({ kind: 'paper', size: 56, alpha: 0.1, lines: 'grid', margin: false, grain: 0.45 }), is: (b) => b.kind === 'paper' && b.lines !== 'ruled' },
  { id: 'notebook', label: 'Caderno', hint: 'Linhas pautadas, uma margem', make: () => ({ kind: 'paper', size: 64, alpha: 0.14, lines: 'ruled', margin: true, grain: 0.3 }), is: (b) => b.kind === 'paper' && b.lines === 'ruled' },
  { id: 'scanlines', label: 'CRT', hint: 'Linhas de varredura e brilho', make: () => ({ kind: 'scanlines', size: 4, alpha: 0.09, glow: 0.14, roll: 0.12 }), is: (b) => b.kind === 'scanlines' },
  { id: 'halftone', label: 'Meio-tom', hint: 'Pontos impressos num canto', make: () => ({ kind: 'halftone', size: 30, alpha: 0.14, from: 'corner' }), is: (b) => b.kind === 'halftone' },
  { id: 'mesh', label: 'Mesh', hint: 'Campos de cor saturados', make: (p) => ({ kind: 'mesh', colours: rotation(p, 3), alpha: 0.62, speed: 0.12, grain: 0.22 }), is: (b) => b.kind === 'mesh' },
];

const backdrops: MultiControl = {
  kind: 'multi',
  key: 'backdrops',
  title: 'Cenários',
  hint: 'O que é desenhado atrás dos gráficos. Marque mais de um e eles se revezam, um por plano. Nenhum: só o chão do estilo.',
  affects: GRAPHIC,
  options: BACKDROPS.map((b) => ({ id: b.id, label: b.label, hint: b.hint, preview: { kind: 'backdrop', id: b.id } })),
  read: (p) => (p.backdrops ?? []).map((b) => BACKDROPS.find((x) => x.is(b))?.id ?? '').filter(Boolean),
  apply: (p, ids) => {
    const keep = (p.backdrops ?? []).filter((b) => ids.some((id) => BACKDROPS.find((x) => x.id === id)?.is(b)));
    const add = ids.filter((id) => !keep.some((b) => BACKDROPS.find((x) => x.id === id)?.is(b))).map((id) => BACKDROPS.find((x) => x.id === id)!.make(p));
    const list = [...keep, ...add];
    if (list.length) p.backdrops = list;
    else delete p.backdrops;
  },
};

// ── Look ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const sig = (p: StylePack): Partial<Signature> => (p.signature ??= {});

const sigPick = (key: keyof Signature, title: string, hint: string, options: Option[], fallback: string, affects: Affects, preview?: Preview['kind']): PickControl => ({
  kind: 'pick',
  key: `sig-${key}`,
  title,
  hint,
  affects,
  layout: preview ? 'cards' : 'segmented',
  options: preview ? options.map((o) => ({ ...o, preview: { kind: preview, id: o.id } })) : options,
  read: (p) => String(p.signature?.[key] ?? fallback),
  apply: (p, id) => {
    (sig(p) as Record<string, unknown>)[key] = id;
  },
});

const surface = sigPick(
  'surface',
  'Cartões',
  'Do que cartões e painéis são feitos',
  [
    { id: 'solid', label: 'Sólido', hint: 'Cartões iluminados' },
    { id: 'glass', label: 'Vidro', hint: 'Fosco, borda clara' },
    { id: 'sketch', label: 'Rascunho', hint: 'Papel, feito à mão' },
    { id: 'brutal', label: 'Brutal', hint: 'Borda de tinta, sombra dura' },
    { id: 'terminal', label: 'Terminal', hint: 'Painel, marcas nos cantos' },
  ],
  'solid',
  ['list', 'stat', 'command', 'float', 'quote'],
  'surface',
);

const mark = sigPick(
  'mark',
  'Marcas',
  'Como a palavra-chave e o número vencedor são destacados',
  [
    { id: 'none', label: 'Cor' },
    { id: 'highlight', label: 'Marca-texto' },
    { id: 'underline', label: 'Sublinhado' },
    { id: 'circle', label: 'Círculo' },
    { id: 'box', label: 'Bloco' },
    { id: 'invert', label: 'Invertido' },
    { id: 'glow', label: 'Brilho' },
  ],
  'none',
  ['title', 'list', 'stat', 'slam', 'chart'],
  'mark',
);

const icons = sigPick(
  'icons',
  'Ícones',
  'Os ícones nos itens de lista e nos números',
  [
    { id: 'none', label: 'Nenhum' },
    { id: 'line', label: 'Linha' },
    { id: 'duotone', label: 'Duotone' },
    { id: 'solid', label: 'Sólido' },
    { id: 'sketch', label: 'Rascunho' },
    { id: 'pixel', label: 'Pixel' },
    { id: 'sticker', label: 'Adesivo' },
  ],
  'none',
  ['list', 'stat', 'float', 'sticker'],
  'icon',
);

const reveal = sigPick(
  'reveal',
  'Chegada',
  'Como as linhas entram na tela',
  [
    { id: 'rise', label: 'Sobe' },
    { id: 'stepped', label: 'Desenhado' },
    { id: 'type', label: 'Digitado' },
    { id: 'blur', label: 'Desfoque' },
  ],
  'rise',
  'all',
);

const camera: PickControl = {
  kind: 'pick',
  key: 'camera',
  title: 'Moldura da câmera',
  hint: 'O tile do apresentador e a borda da faixa',
  affects: ['title', 'command', 'doodle'],
  layout: 'segmented',
  options: [
    { id: 'plain', label: 'Lisa' },
    { id: 'window', label: 'Janela' },
    { id: 'tape', label: 'Fita' },
    { id: 'torn', label: 'Rasgada' },
  ],
  read: (p) => (p.signature?.edge === 'torn' ? 'torn' : p.signature?.chrome === 'window' ? 'window' : p.signature?.chrome === 'tape' ? 'tape' : 'plain'),
  apply: (p, id) => {
    const s = sig(p);
    s.chrome = id === 'window' ? 'window' : id === 'tape' ? 'tape' : 'none';
    s.edge = id === 'torn' ? 'torn' : 'straight';
  },
};

// ── Captions ───────────────────────────────────────────────────────────────────────────────────────────────────────

type CaptionLook = Omit<Subtitles, 'key' | 'laneY' | 'words' | 'enter'> & { key: Pick<Subtitles['key'], 'voice' | 'weight' | 'style' | 'size'> };
const fromPack = (id: string): CaptionLook => {
  const s = SHIPPED[id].subtitles;
  return { voice: s.voice, weight: s.weight, size: s.size, case: s.case, tracking: s.tracking, colour: s.colour, outline: s.outline, shadow: s.shadow, backing: s.backing, key: { voice: s.key.voice, weight: s.key.weight, style: s.key.style, size: s.key.size } };
};
const CAPTIONS: Array<{ id: string; label: string; hint: string; sample: string; look: () => CaptionLook; is: (s: Subtitles) => boolean }> = [
  { id: 'bold', label: 'Bold', hint: 'Caixa alta pesada com contorno', sample: 'RÁPIDO', look: () => fromPack('volt'), is: (s) => s.backing.kind === 'none' && !!s.outline },
  { id: 'pill', label: 'Pílula', hint: 'Uma linha sobre uma pílula suave', sample: 'rápido', look: () => fromPack('ledger'), is: (s) => s.backing.kind === 'pill' },
  {
    id: 'clean',
    label: 'Limpa',
    hint: 'Palavras simples, sombra suave',
    sample: 'rápido',
    look: () => ({ voice: 'body', weight: 700, size: 52, case: 'none', tracking: -0.01, colour: { dark: '#FFFFFF', light: '#111111' }, outline: null, shadow: { dark: '0 3px 14px rgba(0,0,0,0.7)', light: '0 2px 12px rgba(255,255,255,0.7)' }, backing: { kind: 'none', dark: '', light: '' }, key: { voice: 'body', weight: 800, style: 'normal', size: 54 } }),
    is: (s) => s.backing.kind === 'none' && !s.outline && s.voice !== 'display',
  },
  { id: 'glass', label: 'Vidro', hint: 'Uma pílula fosca', sample: 'rápido', look: () => fromPack('glass'), is: (s) => s.backing.kind === 'glass' },
  { id: 'box', label: 'Caixa', hint: 'Borda de tinta, sombra dura', sample: 'RÁPIDO', look: () => fromPack('pop'), is: (s) => s.backing.kind === 'box' },
  { id: 'block', label: 'Bloco', hint: 'Um bloco chapado de terminal', sample: 'rápido', look: () => fromPack('terminal'), is: (s) => s.backing.kind === 'block' },
  { id: 'headline', label: 'Título', hint: 'Palavras grandes na fonte dos títulos', sample: 'rápido', look: () => fromPack('sketch'), is: (s) => s.backing.kind === 'none' && !s.outline && s.voice === 'display' },
];

const KEYWORDS: Array<{ id: string; label: string; apply: (s: Subtitles, p: StylePack) => void; is: (s: Subtitles) => boolean }> = [
  {
    id: 'box',
    label: 'Caixa',
    apply: (s, p) => {
      s.key.box = { colour: 'hero', radius: p.cards.dark.radius > 0 ? 12 : 0, padX: 0.2, padY: 0.06, tilt: -2.5 };
      s.key.mark = null;
      s.key.colour = null;
    },
    is: (s) => !!s.key.box,
  },
  { id: 'marker', label: 'Marca-texto', apply: (s) => { s.key.box = null; s.key.mark = 'highlight'; s.key.colour = null; }, is: (s) => !s.key.box && s.key.mark === 'highlight' },
  { id: 'underline', label: 'Sublinhado', apply: (s) => { s.key.box = null; s.key.mark = 'underline'; s.key.colour = null; }, is: (s) => !s.key.box && s.key.mark === 'underline' },
  { id: 'colour', label: 'Cor', apply: (s) => { s.key.box = null; s.key.mark = null; s.key.colour = 'hero'; }, is: (s) => !s.key.box && !s.key.mark && !!s.key.colour },
  { id: 'plain', label: 'Simples', apply: (s) => { s.key.box = null; s.key.mark = null; s.key.colour = null; }, is: (s) => !s.key.box && !s.key.mark && !s.key.colour },
];

const captionStyle: PickControl = {
  kind: 'pick',
  key: 'captions',
  title: 'Estilo',
  hint: 'As palavras faladas ao longo da base',
  affects: CAPTIONED,
  layout: 'cards',
  options: CAPTIONS.map((c) => ({ id: c.id, label: c.label, hint: c.hint, preview: { kind: 'caption', id: c.id, sample: c.sample } })),
  read: (p) => CAPTIONS.find((c) => c.is(p.subtitles))?.id ?? '',
  apply: (p, id) => {
    const c = CAPTIONS.find((x) => x.id === id);
    if (!c) return;
    const keyword = KEYWORDS.find((k) => k.is(p.subtitles)) ?? KEYWORDS[0];
    const look = c.look();
    p.subtitles = { ...p.subtitles, ...look, key: { ...p.subtitles.key, ...look.key } };
    keyword.apply(p.subtitles, p);
  },
};

const captionKey: PickControl = {
  kind: 'pick',
  key: 'caption-key',
  title: 'Palavra-chave',
  hint: 'Como a palavra marcada com *asteriscos* aparece',
  affects: CAPTIONED,
  layout: 'segmented',
  options: KEYWORDS.map((k) => ({ id: k.id, label: k.label })),
  read: (p) => KEYWORDS.find((k) => k.is(p.subtitles))?.id ?? 'plain',
  apply: (p, id) => KEYWORDS.find((k) => k.id === id)?.apply(p.subtitles, p),
};

const captionEnter: PickControl = {
  kind: 'pick',
  key: 'caption-enter',
  title: 'Entrada',
  hint: 'Como cada linha de legenda chega',
  affects: CAPTIONED,
  layout: 'segmented',
  options: [
    { id: 'cut', label: 'Corte' },
    { id: 'pop', label: 'Pop' },
    { id: 'rise', label: 'Sobe' },
    { id: 'type', label: 'Digitada' },
    { id: 'blur', label: 'Desfoque' },
    { id: 'stepped', label: 'Em passos' },
  ],
  read: (p) => p.subtitles.enter ?? 'cut',
  apply: (p, id) => {
    p.subtitles.enter = id as Subtitles['enter'];
  },
};

// ── Motion ─────────────────────────────────────────────────────────────────────────────────────────────────────────

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

const energy: RangeControl = {
  kind: 'range',
  key: 'energy',
  title: 'Energia',
  hint: 'Como as coisas chegam, dão punch-in e cortam. As cenas tocam enquanto você está aqui.',
  affects: 'all',
  min: 0,
  max: 1,
  step: 0.05,
  ends: ['Calma', 'Punchy'],
  name: (v) => (v < 0.34 ? 'Calma' : v < 0.67 ? 'Firme' : 'Punchy'),
  read: (p) => r1(clamp01((p.motion.punch.amount - 0.04) / 0.14)) ,
  apply: (p, e) => {
    e = clamp01(e);
    p.motion.reveal.frames = Math.round(24 - 14 * e);
    p.motion.reveal.stagger = Math.round(6 - 4 * e);
    p.motion.spring = { w: +(0.28 + 0.27 * e).toFixed(2), z: +(0.9 - 0.6 * e).toFixed(2) };
    p.motion.punch = { amount: +(0.04 + 0.14 * e).toFixed(3), frames: Math.round(10 - 8 * e) };
    p.motion.rise = Math.round(24 + 70 * e);
    p.pace.short.secondsPerChange = [r1(3 - 1.5 * e), r1(4 - 2 * e)];
    p.pace.short.punchIns = e < 0.34 ? 'payoffs' : e < 0.67 ? 'stressed-words' : 'every-line';
    p.pace.endHoldMax = r1(3 - 2 * e);
    p.transitions.zoomThrough.enabled = e >= 0.67;
    p.transitions.flash.enabled = e >= 0.5;
  },
};

// ── Layout ─────────────────────────────────────────────────────────────────────────────────────────────────────────

const align: PickControl = {
  kind: 'pick',
  key: 'align',
  title: 'Alinhamento',
  hint: 'Onde títulos e texto se alinham',
  affects: GRAPHIC,
  layout: 'segmented',
  options: [
    { id: 'left', label: 'Esquerda' },
    { id: 'center', label: 'Centro' },
  ],
  read: (p) => p.composition.align,
  apply: (p, id) => {
    p.composition.align = id === 'left' ? 'left' : 'center';
  },
};

const corners: PickControl = {
  kind: 'pick',
  key: 'corners',
  title: 'Cantos',
  hint: 'Cartões e o tile do apresentador',
  affects: ['list', 'stat', 'quote', 'float'],
  layout: 'segmented',
  options: [
    { id: 'round', label: 'Redondos' },
    { id: 'square', label: 'Retos' },
  ],
  read: (p) => (p.cards.dark.radius > 0 ? 'round' : 'square'),
  apply: (p, id) => {
    const round = id === 'round';
    p.cards.dark.radius = round ? 28 : 0;
    p.cards.light.radius = round ? 28 : 0;
    p.presenter.tile.radius = round ? 44 : 0;
    if (p.subtitles.key.box) p.subtitles.key.box.radius = round ? 12 : 0;
  },
};

// ── Signature scene ────────────────────────────────────────────────────────────────────────────────────────────────

const wordPop: PickControl = {
  kind: 'pick',
  key: 'word-pop',
  title: 'Word-pop',
  hint: 'As palavras batem uma a uma sobre o apresentador. Só estilos que ligam isso ganham a cena.',
  affects: ['word-pop'],
  layout: 'segmented',
  options: [
    { id: 'on', label: 'Ligado' },
    { id: 'off', label: 'Desligado' },
  ],
  read: (p) => (p.scenes.brings.includes('word-pop') ? 'on' : 'off'),
  apply: (p, id) => {
    const on = id === 'on';
    p.scenes.brings = on ? [...new Set(['word-pop', ...p.scenes.brings])] : p.scenes.brings.filter((s) => s !== 'word-pop');
    const payoff = (p.scenes.beats ??= {}).payoff ?? { use: ['talk:full'] };
    payoff.use = on ? [...new Set(['word-pop', ...payoff.use])] : payoff.use.filter((s) => s !== 'word-pop');
    if (!payoff.use.length) payoff.use = ['talk:full'];
    p.scenes.beats.payoff = payoff;
  },
};

const wordPopWords: PickControl = {
  kind: 'pick',
  key: 'word-pop-words',
  title: 'Palavras',
  hint: 'Auto escolhe branco ou preto pelo tom da roupa sob as palavras',
  affects: ['word-pop'],
  layout: 'segmented',
  options: [
    { id: 'auto', label: 'Auto' },
    { id: 'white', label: 'Branco' },
    { id: 'black', label: 'Preto' },
    { id: 'hero', label: 'Destaque' },
  ],
  read: (p) => p.wordPop?.words ?? 'auto',
  apply: (p, id) => {
    (p.wordPop ??= {}).words = id as NonNullable<StylePack['wordPop']>['words'];
  },
};

const wordPopKey: PickControl = {
  kind: 'pick',
  key: 'word-pop-key',
  title: 'Palavra-chave',
  hint: 'A última palavra, a que importa',
  affects: ['word-pop'],
  layout: 'segmented',
  options: [
    { id: 'box', label: 'Caixa' },
    { id: 'marker', label: 'Marca-texto' },
    { id: 'colour', label: 'Cor' },
  ],
  read: (p) => p.wordPop?.key ?? (p.subtitles.key.box ? 'box' : p.subtitles.key.mark === 'highlight' ? 'marker' : 'colour'),
  apply: (p, id) => {
    (p.wordPop ??= {}).key = id as NonNullable<StylePack['wordPop']>['key'];
  },
};

// ── The panel ──────────────────────────────────────────────────────────────────────────────────────────────────────

const label = (c: PickControl, p: StylePack) => c.options.find((o) => o.id === c.read(p))?.label ?? '—';

export const SECTIONS: Section[] = [
  { id: 'type', title: 'Tipo', summary: (p) => `${label(headline, p)}${p.type.display.case === 'uppercase' ? ' em caixa alta' : ''} · ${label(textSet, p)}`, controls: [headline, headlineCase, textSet] },
  { id: 'colour', title: 'Cor', summary: (p) => `${ACCENTS.find((a) => a.id === p.palette.win.toUpperCase())?.label ?? p.palette.win} · ${label(ground, p)}${p.backdrops?.length ? ` · ${backdrops.read(p).length} cenário(s)` : ''}`, controls: [accent, ground, backdrops] },
  { id: 'look', title: 'Visual', summary: (p) => `${label(surface, p)} · marcas ${label(mark, p).toLowerCase()} · ícones ${label(icons, p).toLowerCase()}`, controls: [surface, mark, icons, reveal, camera] },
  { id: 'captions', title: 'Legendas', summary: (p) => `${label(captionStyle, p)} · palavra-chave ${label(captionKey, p).toLowerCase()}`, controls: [captionStyle, captionKey, captionEnter] },
  { id: 'motion', title: 'Movimento', summary: (p) => energy.name(energy.read(p)), controls: [energy] },
  { id: 'layout', title: 'Layout', summary: (p) => `${label(align, p)} · cantos ${label(corners, p).toLowerCase()}`, controls: [align, corners] },
  { id: 'signature', title: 'Cena assinatura', summary: (p) => `Word-pop ${label(wordPop, p).toLowerCase()}`, controls: [wordPop, wordPopWords, wordPopKey] },
];
