// Write a Claude Code editing skill for a style pack: how to plan and build a video in that style with this engine.
// The pack's skill fields (layouts, joins, pace, captions, hero rotation, scene picks) become plain rules; its engine
// fields become a description of the look, to review stills against.
//   node scripts/make-skill.mjs <pack id> [--out skills]      writes skills/<pack>/
//   node scripts/make-skill.mjs --all
// Writes SKILL.md, references/scenes.md, references/plan.md, references/look.md and example-plan.json. Everything comes
// from the pack (src/packs/<id>.json), the scene catalogue (src/reel/scenes.json) and the demo shoot
// (src/board/demo-shoot.json), so a pack the web app makes gets its skill the same way. Same pack in, same files out.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BEAT_KINDS, beatsOf, joinBudget, joinSpec, packCan, refOf, shotRef, shows as showsIn } from './lib/beats.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FPS = 30;
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const SCENES = read('src/reel/scenes.json');
const DEMO = read('src/board/demo-shoot.json');
/** The demo edit's frame the example reels start on. */
const DEMO_FROM = 790;
/** The board's compositions, by the scene each one shows. */
const BOARD = { Title: 'title', List: 'list', Stat: 'stat', Quote: 'quote', WordPop: 'word-pop', Slam: 'slam', Chart: 'chart', Doodle: 'doodle', Command: 'command', Float: 'float', Sticker: 'sticker' };

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
// --pack <file>: a pack that isn't in src/packs yet (the web app's draft), written under its own id
const packFile = arg('pack', null);
const ids = packFile
  ? [JSON.parse(fs.readFileSync(path.resolve(packFile), 'utf8')).id]
  : process.argv.includes('--all')
    ? fs.readdirSync(path.join(ROOT, 'src/packs')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5))
    : [process.argv[2]].filter((x) => x && !x.startsWith('--'));
if (!ids.length) {
  console.log('usage: node scripts/make-skill.mjs <pack id> | --all | --pack <file> [--out skills]');
  process.exit(1);
}
// an id names the skill's folder and its frontmatter, so a pack from anywhere can't climb out of skills/ with it
const badId = ids.findIndex((id) => typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,40}$/.test(id));
if (badId >= 0) {
  const id = ids[badId];
  console.log(`${id === undefined ? 'The pack has no id' : `${JSON.stringify(id)} can't be a pack id`}: an id is a string of lowercase letters, numbers and dashes`);
  process.exit(1);
}
const outRoot = path.resolve(ROOT, arg('out', 'skills'));

// ── Words ────────────────────────────────────────────────────────────────────────────────────────────────────────

const code = (s) => `\`${s}\``;
const num = (x) => +x.toFixed(2);
const range = ([a, b], unit = '') => (a === b ? `${num(a)}${unit}` : `${num(a)} to ${num(b)}${unit}`);
const and = (xs, word = 'and') => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} ${word} ${xs[xs.length - 1]}`);
const pct = (x) => `${Math.round(x * 100)}%`;
const fr = (sec) => Math.round(sec * FPS);
const frames = (n) => `${n} frame${n === 1 ? '' : 's'}`;
const cell = (s) => String(s).replace(/\|/g, '\\|');
const WEIGHTS = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };
const face = (family, weight, style = 'normal') => `${family} ${WEIGHTS[weight] ?? weight}${style === 'italic' ? ' Italic' : ''}`;
const voiceFace = (pack, v, weight) => face(pack.type[v].family, weight ?? pack.type[v].weight, pack.type[v].style);
const plainHex = (c) => ({ '#FFFFFF': 'white', '#000000': 'black' })[String(c).toUpperCase()] ?? c;
const LAYOUT = { full: 'full frame', halfBand: 'the half band', tile: 'the tile' };
const JOIN = { cut: 'cut', ease: 'ease', zoom: 'zoom-through', flash: 'flash', wipe: 'wipe', blur: 'blur', glitch: 'glitch', whip: 'whip' };
/** A pack colour by role, as a reader needs it: "the hero colour", "win (#FFE600)", or the value itself. */
const colourOf = (pack, name) => {
  if (name === 'hero') return 'the hero colour';
  if (typeof pack.palette[name] === 'string') return `${name} (${pack.palette[name]})`;
  if (pack.palette.extended[name]) return `${name} (${pack.palette.extended[name]})`;
  return plainHex(name);
};
const heroName = (pack, n) => `${n} (${n === 'win' || n === 'friction' ? pack.palette[n] : pack.palette.extended[n] ?? n})`;

// ── What the pack says, read for the skill ───────────────────────────────────────────────────────────────────────

/** The presenter layout a ref shows, or null for a graphic. */
const shows = (ref) => showsIn(SCENES, ref);
const refName = (ref) => {
  const { scene, layout } = refOf(ref);
  return scene === 'talk' ? `\`talk\` ${layout === 'full' ? 'full frame' : `in ${LAYOUT[layout]}`}` : code(scene);
};

const read4 = (pack) => {
  const P = pack.pace;
  const M = pack.motion;
  const T = pack.transitions;
  const S = pack.subtitles;
  const [lo, hi] = P.short.secondsPerChange;
  const mid = (lo + hi) / 2;
  const { own, layouts, joinsOn, scenes } = packCan(pack, SCENES);
  const joins = Object.keys(joinsOn).filter((j) => joinsOn[j]);
  // where this video's hero colour shows: the scenes it can use, plus whatever the pack paints with it
  const SITES = {
    title: 'the title\'s hero word', list: 'the list\'s win fact', stat: 'the after number', quote: 'the quote marks', slam: 'the slammed value and its shockwave',
    chart: 'the chart\'s bar that matters', doodle: 'the doodle\'s marker, arrow and strokes', command: 'the prompt and the output line that matters',
    float: 'the floating card\'s number', sticker: 'the starbursts and strike-outs',
  };
  const heroSites = scenes.filter((id) => SITES[id]).map((id) => SITES[id]);
  if ([...pack.grounds.dark.glows, ...pack.grounds.light.glows].some((g) => g.colour === 'hero')) heroSites.push('the glow on the ground');
  if (pack.presenter.halfBand.rule?.colour === 'hero') heroSites.push('the half band\'s rule');
  if (S.key.box?.colour === 'hero' || S.key.colour === 'hero') heroSites.push('the caption key word');
  if (T.flash.enabled && T.flash.colour === 'hero') heroSites.push('the flash');
  if (joinsOn.glitch) heroSites.push('the glitch\'s colour bars');
  return {
    P, M, T, S, lo, hi, own, layouts, joins, joinsOn, scenes, heroSites, beats: beatsOf(pack, SCENES),
    tempo: mid < 2.5 ? 'fast' : mid <= 4.5 ? 'measured' : 'slow',
    loud: M.punch.amount >= 0.1 || T.flash.enabled,
    other: pack.composition.ground === 'dark' ? 'light' : 'dark',
    hidden: Object.keys(SCENES).filter((id) => SCENES[id].lane === 'none' && scenes.includes(id)),
  };
};

const BACKDROP = {
  plain: 'nothing drawn',
  grid: 'a fine grid faded toward the edges',
  dots: 'a dot grid',
  horizon: 'a perspective floor grid running to a glowing horizon',
  aurora: 'soft drifting colour fields',
  spotlight: 'a soft spotlight from above',
  rings: 'rings spreading slowly from behind the stack',
  paper: 'a sheet of paper (its lines, grain and edges)',
  scanlines: 'a CRT: scan lines, a phosphor glow and a rolling band',
  halftone: 'printed halftone dots growing toward a corner',
  mesh: 'drifting colour fields filling the frame',
};
/** The pack's backdrops, in the order a video takes them. */
const describeBackdrops = (pack) => {
  const names = pack.backdrops.map((b) => (b.kind === 'dots' && b.ticks ? 'a dot grid with corner ticks' : BACKDROP[b.kind] ?? b.kind));
  return names.length === 1 ? names[0] : `${and(names, 'then')}, taken in turn, one per shot that shows the ground`;
};

const describeGround = (pack, g) => {
  const parts = [g.colour];
  if (g.texture) parts.push(`a photo texture (${g.texture})`);
  if (pack.backdrops?.length) parts.push(describeBackdrops(pack));
  else if (g.pattern) parts.push(`a ${g.pattern.size} px ${g.pattern.kind === 'grid' ? 'grid' : 'dot pattern'} in ${plainHex(g.pattern.colour)} at ${pct(g.pattern.alpha)}`);
  if (g.glows.length) parts.push(`${g.glows.length === 1 ? 'a glow' : `${g.glows.length} glows`} in ${and([...new Set(g.glows.map((x) => (x.colour === 'hero' ? 'the hero colour' : x.colour)))])}`);
  if (g.vignette) parts.push('a vignette');
  return parts.length === 1 ? `flat ${parts[0]}` : and(parts);
};

const captionLook = (pack) => {
  const S = pack.subtitles;
  const bits = [`${face(pack.type[S.voice].family, S.weight)} at ${S.size} px`];
  if (S.case === 'uppercase') bits.push('in caps');
  if (S.outline) bits.push(`a ${S.outline.width} px ${plainHex(S.outline.dark)} outline over footage`);
  if (S.shadow.dark) bits.push('a hard shadow');
  if (S.backing.kind === 'pill') bits.push('on a pill');
  if (S.backing.kind === 'scrim') bits.push('on a soft scrim');
  if (S.backing.kind === 'glass') bits.push('on a frosted glass pill');
  if (S.backing.kind === 'box') bits.push('in a white box with an ink border and a hard shadow');
  if (S.backing.kind === 'block') bits.push('on a flat dark block');
  return bits.join(', ');
};

/** The pack's signature (src/engine/pack.ts): the details that make it its own, as the engine draws them. */
const SIGNATURE = { surface: 'solid', mark: 'none', icons: 'none', reveal: 'rise', chrome: 'none', edge: 'straight', tilt: 0, rough: 0, boil: 0 };
const sigOf = (pack) => ({ ...SIGNATURE, ...pack.signature });
const SURFACE = {
  solid: 'lit solid cards',
  glass: 'frosted glass cards with a bright edge',
  sketch: 'paper cards with a hand-drawn border, taped to the page, rows ruled by hand',
  brutal: 'cards with a thick ink border and a hard offset shadow',
  terminal: 'flat terminal panels with a fine border and corner marks',
};
/** One card of each surface, for a scene that shows one. */
const SURFACE_ONE = {
  solid: 'a lit solid card',
  glass: 'a frosted glass card with a bright edge',
  sketch: 'a paper card with a hand-drawn border, taped down',
  brutal: 'a card with a thick ink border and a hard offset shadow',
  terminal: 'a flat terminal panel with a fine border and corner marks',
};
const MARK = {
  none: 'set in the hero colour',
  highlight: 'on a marker highlight in the hero colour',
  underline: 'underlined by hand in the hero colour',
  circle: 'circled by hand in the hero colour',
  box: 'on a filled block in the hero colour',
  invert: 'inverted: the ground colour on a hero-colour block',
  glow: 'glowing in the hero colour',
};
const ICON_LOOK = { none: 'no icons', line: 'line icons', duotone: 'duotone icons', solid: 'solid icons', sketch: 'hand-drawn icons', pixel: 'pixel icons', sticker: 'sticker icons with a white edge' };
const REVEAL_LOOK = { rise: 'lines rise in', stepped: 'lines arrive in steps, twelve drawings a second', type: 'lines are typed in from the left', blur: 'lines rise out of a blur' };
const signatureLines = (pack) => {
  const g = sigOf(pack);
  const lines = [
    `Cards: ${SURFACE[g.surface]}${g.tilt ? `, leaning ${g.tilt}°` : ''}.`,
    `The hero word and the winning number: ${MARK[g.mark]}.`,
    `Icons: ${ICON_LOOK[g.icons]}${g.icons !== 'none' ? ' (the list and before/after scenes take an `icon`)' : ''}.`,
    `Arrivals: ${REVEAL_LOOK[g.reveal]}.`,
  ];
  if (g.chrome !== 'none') lines.push(`The tile wears ${g.chrome === 'window' ? "a window's title bar" : 'tape on its corners'}.`);
  if (g.edge === 'torn') lines.push('The camera band sits under a torn paper edge.');
  if (g.boil) lines.push(`Hand-drawn strokes wobble ${g.rough} px and redraw every ${g.boil} frames, so they shimmer.`);
  return lines;
};

const keyLook = (pack) => {
  const k = pack.subtitles.key;
  const f = face(pack.type[k.voice].family, k.weight, k.style);
  if (k.box) return `it sits on a box in ${colourOf(pack, k.box.colour)}${k.box.border ? ' with an ink border' : ''}, tilted ${k.box.tilt}°, in ${f}`;
  if (k.mark) return `it's set in ${f}, ${k.mark === 'highlight' ? 'on a marker highlight' : 'underlined by hand'} in the hero colour`;
  return `it's set in ${f}${k.colour ? ` in ${colourOf(pack, k.colour)}` : ''} at ${k.size} px`;
};

const layoutLook = (pack, l) => {
  const PR = pack.presenter;
  if (l === 'full') return "the presenter's room filling the frame, the only layout that punches in";
  if (l === 'halfBand') {
    const r = PR.halfBand.rule;
    const edge = sigOf(pack).edge === 'torn' ? 'under a torn paper edge' : PR.halfBand.feather ? `its top edge feathered over ${PR.halfBand.feather} px` : `with a hard top edge${r ? ` and a ${r.width} px rule in ${colourOf(pack, r.colour)} along it` : ''}`;
    return `the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, ${edge}; captions ride that top edge`;
  }
  const t = PR.tile;
  return `the camera in a square tile, the eye line on its upper third, with ${t.radius} px corners${t.ring ? ` and a ${t.ring.width} px ${colourOf(pack, t.ring.colour)} ring` : ''}`;
};

const fitNote = (pack) => {
  const L = pack.type.display.layout;
  if (L.fit === 'width') {
    return `${pack.name}'s fit rule fills the measure: every headline line sets ${L.measure != null && L.measure < 1 ? `${pct(L.measure)} of` : 'as wide as'} the stack's width whatever its size, so a short line sets huge and a long one small. Keep the lines of a stack about the same length; \`sizes\` hardly matter.`;
  }
  return `${pack.name}'s fit rule keeps a line's size (times ${L.fitScale}) and only shrinks one that would run past the measure, so \`sizes\` set the hierarchy: about 260 for a one-word punch line, 110 to 160 for a longer one.`;
};

/** What a join does on screen, and over how long. */
const joinLook = (pack, j) => {
  const T = pack.transitions;
  const n = frames(joinSpec(pack, j).frames);
  return {
    cut: 'a hard cut',
    ease: `the new shot rises ${T.ease.dy} px over ${n} while the old one sinks back ${pct(T.ease.sink)}`,
    zoom: `the old shot blows past and the new one settles in, over ${n}`,
    flash: `${n} of ${colourOf(pack, T.flash.colour)} over the cut`,
    wipe: `the new shot wipes in from the right behind ${sigOf(pack).edge === 'torn' ? 'a torn paper edge' : `a rule in ${colourOf(pack, pack.presenter.halfBand.rule?.colour ?? 'hero')}`} while the old one drifts left, over ${n}`,
    blur: `the old shot blurs away as the new one comes into focus, over ${n}`,
    glitch: `the frame tears into offset slices with colour fringes for ${n}, then settles on the new shot`,
    whip: `a whip pan: the old shot flies out to the left, smeared, as the new one flies in, over ${n}`,
  }[j];
};
const joinWord = (pack, j) => ({
  cut: 'hard cuts', ease: 'a gentle ease', zoom: 'zoom-throughs', flash: `a flash in ${colourOf(pack, pack.transitions.flash.colour)}`,
  wipe: sigOf(pack).edge === 'torn' ? 'torn-paper wipes' : 'wipes led by a rule', blur: 'blur dissolves', glitch: 'glitches', whip: 'whip pans',
})[j];

/**
 * Where a shot puts the presenter: on the face (talk full frame), under graphics drawn over the full-frame footage
 * (word-pop, a doodle, stickers, a float), framed in the band or a tile, or off screen behind a graphic.
 */
const placeOf = (ref) => {
  const s = shows(ref);
  if (s === 'full') return refOf(ref).scene === 'talk' ? 'face' : 'over';
  return s ? 'framed' : 'graphic';
};
const PLACE = { face: 'the presenter full frame', over: 'graphics drawn over the presenter', framed: 'the presenter framed in the band or a tile', graphic: 'graphics alone' };
/** What a style that leans on a place does there, and what each scene drawn over the footage does to the presenter. */
const LEANS = { face: 'lives on the face', over: 'puts its graphics on the presenter, over the footage', framed: 'keeps the presenter framed beside its graphics', graphic: 'is led by its graphics' };
const OVER = { 'word-pop': 'pops the key words over the speaker', doodle: 'draws on the footage', sticker: 'slaps stickers on around the head', float: 'floats cards in front of the presenter' };

/**
 * How the style shares its running time between the face, graphics over it, the framed presenter and graphics alone,
 * read off its example plan (the same script in every style, laid out by its beats and pace), as a clause: what it
 * leans on, then the shares.
 */
const carriage = (pack) => {
  const ex = examplePlan(pack);
  const total = ex.shots.reduce((a, x) => a + x.frames, 0);
  const share = { face: 0, over: 0, framed: 0, graphic: 0 };
  for (const x of ex.shots) share[placeOf(shotRef(x))] += x.frames / total;
  const [top, second] = Object.keys(share).sort((a, b) => share[b] - share[a]);
  const over = [...new Set(ex.shots.map((x) => x.scene))].filter((id) => OVER[id]);
  const also = top !== 'over' && share.over >= 0.12 && over.length ? ` and ${and(over.map((id) => OVER[id]))}` : top === 'graphic' && second === 'framed' && share.framed >= 0.3 ? ', the presenter framed beside them' : '';
  const parts = Object.keys(share).filter((k) => share[k] >= 0.01).sort((a, b) => share[b] - share[a]).map((k, i) => `${pct(share[k])}${i ? '' : ' of the running time is'} ${PLACE[k]}`);
  return `${LEANS[top]}${also}: in its example, ${and(parts)}`;
};

/** The join into a beat (null for the hook, which opens the video). */
const beatJoin = (r, kind) => r.beats[kind].in;

const CAPTION_ENTER = {
  cut: 'cuts in',
  pop: 'pops in on the spring',
  rise: 'rises in softly',
  type: 'is typed in from the left',
  blur: 'comes up out of a blur',
  stepped: 'arrives in steps, like drawn animation',
};

const caseNote = (pack, v) => ({ uppercase: 'in caps (the pack sets them; write normal case)', lowercase: 'in lower case (the pack sets it)', none: 'in the case you write' })[pack.type[v].case];

// ── The example plan: the same script in any pack, laid out by that pack's rules ──────────────────────────────────

/**
 * One script, a beat of each kind. `gist` is what a note or a sticker says, `head` a heading held over the presenter,
 * `was` the word the old value is said on.
 */
const BEATS = [
  { kind: 'hook', say: 'O Claude Code ganhou *cinco* mods que você precisa instalar agora', note: 'The hook' },
  { kind: 'payoff', say: 'e esse aqui é basicamente *trapaça*', note: 'The hook\'s payoff', gist: 'vantagem *injusta*', from: 'basicamente', head: 'Basicamente trapaça' },
  { kind: 'item', say: 'o Token Ledger mostra o que cada turno te custa, ao *vivo*', note: 'List item 1', head: 'Token Ledger' },
  { kind: 'number', say: 'minha conta foi de duzentos e quarenta dólares para *nada*', note: 'The number', head: 'Caiu para $0', was: 'duzentos' },
  { kind: 'point', say: 'e quem usa diz a *mesma* coisa', note: 'Bridge to the proof', head: 'Mesmo veredito' },
  { kind: 'proof', say: 'faturar tomava minha sexta inteira, agora roda de *madrugada*', note: 'The proof, in someone else\'s words' },
  { kind: 'end', say: 'segue para ver os outros *quatro*', note: 'The end', gist: 'faltam *4*', from: 'outros', head: 'Mais quatro' },
];

/** How long a slam shows before its value lands (the old value reads, then gets struck). */
const SLAM_LEAD = 24;
/** How long a scene that lands on a beat's last word holds after it, into the next beat. */
const MOMENT = 30;

/** Split n words into lines of at most `max` words, as even as can be. */
const chunk = (words, max) => {
  const n = Math.ceil(words.length / max);
  const out = [];
  let i = 0;
  for (let k = 0; k < n; k++) {
    const size = Math.floor(words.length / n) + (k < words.length % n ? 1 : 0);
    out.push(words.slice(i, (i += size)));
  }
  return out;
};

/** A scene's props for a beat in the example: the catalogue's example, or the beat's own words. `t` is the frame inside the shot a word is said. */
const exampleProps = (pack, scene, beat, t, icons) => {
  const plain = beat.say.replace(/\*/g, '').split(' ');
  const key = beat.say.split(' ').findIndex((w) => w.includes('*'));
  if (scene === 'list' || scene === 'stat') return { ...SCENES[scene].example, ...(icons ? { icon: scene === 'list' ? 'gauge' : 'coin' } : {}) };
  if (scene === 'float' && beat.kind === 'hook') return { lead: 'O Claude Code ganhou', title: '5 mods novos' };
  if (scene === 'sticker' && beat.kind === 'hook') return { stickers: [{ text: 'Claude Code', at: 2, ...(icons ? { icon: 'code' } : {}) }, { text: '5', at: t(key), kind: 'burst' }, { text: 'mods novos', at: t(plain.indexOf('mods')) }] };
  if (scene === 'float' && beat.kind === 'item') return { lead: 'Mod 1 de 5', title: 'Token Ledger', facts: SCENES.list.example.facts.slice(0, 2), ...(icons ? { icon: 'gauge' } : {}) };
  if (scene === 'float') return { ...SCENES.float.example, ...(icons ? { icon: 'coin' } : {}) };
  if (scene === 'slam') return { value: '$0', was: '$240', label: 'por mês', at: t(key) };
  if (scene === 'sticker') return { stickers: [{ text: '$240', at: Math.max(2, t(plain.indexOf(beat.was))), strike: true, ...(icons ? { icon: 'coin' } : {}) }, { text: '$0', at: t(key), kind: 'burst' }] };
  if (scene === 'doodle') return { note: beat.gist, from: Math.max(4, t(plain.indexOf(beat.from))) };
  if (scene === 'word-pop') {
    const groups = [];
    const per = Math.max(1, Math.min(pack.subtitles.words[1], 2));
    let i = 0;
    while (i < plain.length) {
      const n = i === key ? 1 : Math.min(per, (key > i ? key : plain.length) - i);
      groups.push({ from: t(i), words: plain.slice(i, i + n).map((text, j) => ({ text, at: t(i + j), ...(i + j === key ? { key: true } : {}) })) });
      i += n;
    }
    return { groups: groups.map((g, j) => ({ from: g.from, to: groups[j + 1]?.from ?? null, words: g.words })) };
  }
  return SCENES[scene].example ?? {};
};

const examplePlan = (pack) => {
  const r = read4(pack);
  const icons = sigOf(pack).icons !== 'none';
  const wps = (r.P.wordsPerMinute[0] + r.P.wordsPerMinute[1]) / 2 / 60;
  const maxShot = Math.floor(r.hi * FPS * 1.2);
  const minShot = fr(r.lo / 2);
  const talkLayout = r.layouts.includes('full') ? 'full' : r.layouts[0];
  const shots = [];
  const captions = [];
  let t = 0;
  // where the next shot starts: a scene that lands on a beat's last word holds past it, into the next beat
  let cursor = 0;
  BEATS.forEach((beat, b) => {
    const words = beat.say.split(' ');
    const D = Math.round((words.length / wps) * FPS);
    const at = (i) => Math.round((D * i) / words.length); // frame inside the beat each word is said
    const keyAt = at(words.findIndex((w) => w.includes('*')));
    const recipe = r.beats[beat.kind];
    // the style's first choice, unless that scene is the shot just before: two of a scene back to back read as one
    // long shot (as the skill says), so take the next (the presenter can follow the presenter: that's a cut)
    const prev = shots[shots.length - 1]?.scene;
    const ref = recipe.use.find((x) => refOf(x).scene === 'talk' || refOf(x).scene !== prev) ?? recipe.use[0];
    const { scene, layout } = refOf(ref);
    // captions, unless the scene shows its own words
    const lines = chunk(words, r.S.words[1]);
    const beatCaptions = lines.map((line, k) => {
      const w = lines.slice(0, k).flat().length;
      return { from: t + at(w), to: t + at(w + line.length), text: line.join(' ') };
    });
    if (SCENES[scene].lane !== 'none') captions.push(...beatCaptions);
    // the beat's shots on the reel's timeline: the scene, then the presenter when it runs past the pace; a slam comes
    // on its word with the presenter carrying the set-up; scenes that change inside themselves hold the whole beat
    const whole = ['word-pop', 'sticker', 'doodle'].includes(scene) || (scene === 'talk' && layout === 'full' && r.P.short.punchIns === 'every-line');
    const after = `talk:${talkLayout === layout ? (r.layouts.find((l) => l !== layout) ?? talkLayout) : talkLayout}`;
    let pieces;
    if (scene === 'slam') pieces = [{ ref: `talk:${talkLayout}`, from: t, to: t + keyAt - SLAM_LEAD }, { ref, from: t + keyAt - SLAM_LEAD, to: t + D, main: true }];
    else {
      const n = whole ? 1 : Math.ceil(D / maxShot);
      pieces = Array.from({ length: n }, (_, p) => ({ ref: p ? after : ref, from: t + Math.round((D * p) / n), to: t + Math.round((D * (p + 1)) / n), main: p === 0 }));
    }
    // it starts where the last beat's shots ended; a presenter piece left too short goes to its neighbour, and the
    // beat's own scene takes the room it needs (a change's worth, at least) from the presenter after it
    pieces[0].from = Math.max(pieces[0].from, cursor);
    const keep = [];
    pieces.forEach((x, p) => {
      const next = pieces[p + 1];
      if (x.from >= x.to || (!x.main && x.to - x.from < minShot && (keep.length || next))) {
        if (keep.length) keep[keep.length - 1].to = x.to;
        else next.from = x.from;
        return;
      }
      if (x.main && x.to - x.from < fr(r.lo) && next) {
        x.to = Math.min(next.to, x.from + fr(r.lo));
        next.from = x.to;
      }
      keep.push(x);
    });
    pieces = keep;
    // a scene that lands on the beat's key word holds a beat past it
    const last = pieces[pieces.length - 1];
    if (last.main && ['slam', 'sticker', 'word-pop', 'doodle'].includes(scene)) last.to = Math.max(last.to, t + keyAt + MOMENT);
    pieces.forEach((piece, p) => {
      const { scene: sc, layout: lay } = refOf(piece.ref);
      const frames = piece.to - piece.from;
      // the beats table's join into the beat's own scene; the set-up before it and the presenter after it cut
      const join = b > 0 && piece.main ? recipe.in : 'cut';
      const shot = { scene: sc, frames, ...(join !== 'cut' ? { in: join } : {}), beat: beat.kind, note: piece.main ? beat.note : p === 0 ? `${beat.note}: the set-up` : 'Back to the presenter, to keep the pace' };
      const inShot = (i) => t + at(i) - piece.from;
      if (sc === 'talk') {
        shot.props = { layout: lay };
        if (lay === 'full') {
          const inside = (f) => f >= piece.from + 4 && f < piece.to;
          let punches = [];
          if (r.P.short.punchIns === 'every-line') punches = beatCaptions.map((c) => c.from).filter(inside);
          else if (r.P.short.punchIns === 'stressed-words' || ['payoff', 'end'].includes(beat.kind)) punches = [t + keyAt].filter(inside);
          if (punches.length) shot.props.punches = punches.map((f) => f - piece.from);
        } else {
          shot.props.head = beat.head ?? beat.say.replace(/\*/g, '').split(' ').slice(-2).join(' ');
        }
      } else {
        shot.props = exampleProps(pack, sc, beat, inShot, icons);
        if (sc === 'word-pop') shot.props.groups.forEach((g) => (g.to ??= frames));
      }
      shots.push(shot);
    });
    cursor = last.to;
    t += D;
  });
  // the end hold, inside what the pack allows
  const hold = fr(Math.min(r.P.endHoldMax, Math.max(0.5, r.P.endHoldMax / 2)));
  shots[shots.length - 1].frames += Math.max(0, t + hold - cursor);
  return {
    pack: pack.id,
    hero: pack.palette.heroRotation[0],
    title: `${pack.name} example`,
    shoot: DEMO,
    from: DEMO_FROM,
    captions,
    shots,
  };
};

// ── SKILL.md ─────────────────────────────────────────────────────────────────────────────────────────────────────

const skillMd = (pack, rel) => {
  const r = read4(pack);
  const N = pack.name;
  const id = pack.id;
  const kind = pack.description.split(':')[0].replace(/^A /, 'a ');
  const description = `Edit a talking-head short in ${N}, ${kind}, with the style-pack engine. Plans the shots, captions and joins by ${N}'s rules, writes a reel plan, checks it, reviews stills and renders the video. Use when asked to edit, plan or render a video in ${N}, or to add ${N}'s graphics, captions or transitions to a talking-head edit.`;
  const { P, M, T, S, lo, hi } = r;
  const punchWhere = { 'every-line': 'come on every line', 'stressed-words': 'come on stressed words', payoffs: 'come only on payoffs' }[P.short.punchIns];
  // how the seven kinds of beat split between the face, the presenter framed beside graphics, and graphics alone
  const feel = [
    `${N} is ${r.tempo} and ${r.loud ? 'loud' : 'quiet'}, and it ${carriage(pack)}.`,
    `Something changes every ${range([lo, hi], ' s')}.`,
    `Lines ${M.reveal.frames <= 14 ? 'snap in' : M.reveal.frames >= 20 ? 'arrive unhurried' : 'arrive steadily'} (${frames(M.reveal.frames)} each, ${M.reveal.stagger} apart) and ${M.spring.z < 0.5 ? 'land with a bounce' : M.spring.z < 0.8 ? 'settle with a little overshoot' : 'land with no overshoot'}.`,
    `Punch-ins are ${M.punch.amount >= 0.1 ? 'hard' : M.punch.amount >= 0.06 ? 'firm' : 'gentle'} (${pct(M.punch.amount)} over ${frames(M.punch.frames)}) and ${punchWhere}.`,
    `Shots meet on ${and(r.joins.map((j) => joinWord(pack, j)), 'or')}.`,
    `Captions run ${range(S.words)} words${S.key.box ? ', the key word on a box' : ''}, and each line ${CAPTION_ENTER[S.enter ?? 'cut']}.`,
    r.own.length
      ? `And it brings ${and(r.own.map(code))} of its own: that's where the style's identity lives.`
      : `It brings no scene type of its own, so its identity is in ${r.loud ? 'its pace, its joins and its type' : 'its restraint: the pace, the joins and the type'}.`,
  ].join(' ');

  // the review list for stills: the style's look, then what each of its own scenes must show
  const OWN_REVIEW = {
    slam: 'The slam: the value as wide as the frame allows and landed on its word, the old value struck out above it.',
    chart: 'The chart: every bar from the one axis, the one that matters in the hero colour, each value readable at its bar\'s end, the source under it.',
    doodle: 'The doodle: the note above the head and never over the face; the arrow points at the head, not into it.',
    command: 'The command: every line inside the window, the line that matters marked, the window clear of the tile.',
    float: 'The float: the face soft but there, the eyes above the card; the card whole, over the mouth and chest and clear of the caption lane.',
    sticker: 'The stickers: each landed on its word, none over the face, the caption lane or off the frame.',
    'word-pop': 'Word-pop: the words on the chest, clear of the chin, the key word alone in the last group.',
  };
  const review = [
    'Nothing collides or runs off the frame; captions clear the chin and any card.',
    'Words straight on footage (word-pop, captions with no box) contrast with what is under them: white on a dark shirt, ink on a light one, each with an edge. If not, the shoot\'s `tone` is wrong: measure it again.',
    `Headlines in ${voiceFace(pack, 'display')}, ${caseNote(pack, 'display').split(' (')[0]}, ${pack.composition.align === 'center' ? 'centred' : 'set left'}; lead-ins in ${voiceFace(pack, 'accent')}; labels in ${voiceFace(pack, 'label')}.`,
    `Graphic scenes on the ${pack.composition.ground} ground: ${describeGround(pack, pack.grounds[pack.composition.ground])}.`,
    `The hero colour shows only in ${and(r.heroSites)}.`,
    `Captions: ${captionLook(pack)}; at most one key word, and ${keyLook(pack)}.`,
    ...r.layouts.filter((l) => l !== 'full').map((l) => `${LAYOUT[l][0].toUpperCase()}${LAYOUT[l].slice(1)}: ${layoutLook(pack, l)}, the whole head inside.`),
    ...r.own.filter((s) => OWN_REVIEW[s]).map((s) => OWN_REVIEW[s]),
    ...(r.joins.some((j) => j !== 'cut') ? [`Mid-join stills show the join (${and(r.joins.filter((j) => j !== 'cut').map((j) => JOIN[j]))}), not a broken or empty frame.`] : []),
    ...(pack.signature ? [`Its signature shows: ${signatureLines(pack).map((l) => l.replace(/\.$/, '').toLowerCase()).join('; ')}.`] : []),
    ...(r.scenes.includes('print') ? ['The print: the whole card above the band, the image inside it cropped from its top and readable, its lead-in over it; the badge (where a shot has one) in the top left, the photo in a ring, the @ in the headline voice, clear of the face.'] : []),
    'Each still makes its beat\'s point on its own.',
  ];

  // the beats: how the style carries each kind
  const landers = ['slam', 'sticker', 'word-pop', 'doodle'].filter((s) => r.scenes.includes(s));
  const beats = [
    `| Beat | What it is | ${N} carries it with | Join in |`,
    '|---|---|---|---|',
    ...Object.entries(BEAT_KINDS).map(([kind, k]) => {
      const b = r.beats[kind];
      const join = beatJoin(r, kind);
      // a beat that comes round again takes its join on the first and the one that matters, and cuts the rest
      const into = join && join !== 'cut' ? ` (\`"in": "${join}"\`)${k.recurs ? ' into the first and the one that matters most; the rest cut' : ''}` : '';
      return `| **${k.name}** | ${cell(k.what)} | ${refName(b.use[0])}${b.use.length > 1 ? `; else ${and(b.use.slice(1).map(refName), 'or')}` : ''} | ${join ? `${JOIN[join]}${into}` : 'opens the video'} |`;
    }),
    '',
    `- Read the transcript into beats of these kinds, one point each, then give each beat ${N}'s first choice. Take the next one only when the first can't carry it: the words don't fit its props, it ran in the beat before (two of the same scene back to back read as one long shot), or the pace needs a change.`,
    '- A beat of a kind not in the table is a point.',
    `- A beat whose scene is a graphic and runs past the pace gets a second shot, on a cut: the presenter (${r.layouts.includes('full') ? 'full frame' : LAYOUT[r.layouts[0]]}) for the rest of it.${landers.length ? ` ${and(landers.map(code))} land${landers.length > 1 ? '' : 's'} on a word: hold ${landers.length > 1 ? 'them' : 'it'} about a second past that word, into the next beat, so the hit reads.` : ''}`,
    '- Tag every shot with its beat (`"beat": "number"`, on each shot of the beat): check-plan then warns when a beat isn\'t on a scene this table gives it, comes in on a join the table doesn\'t give it, or never gets its join. A beat that cuts where the table gives a join is fine: that is how a join is kept to the changes that matter (see Joins).',
    '- [example-plan.json](example-plan.json) is one video built this way, shot by shot in [references/plan.md](references/plan.md).',
  ];

  // pace
  const pace = [
    `- Something on screen changes every **${range([lo, hi], ' s')}** (${fr(lo)} to ${fr(hi)} frames). A change is ${and(['a new shot', 'a punch-in', ...(r.own.includes('word-pop') ? ['a new word-pop group'] : []), ...(r.own.includes('slam') ? ['a slam landing'] : []), ...(r.own.includes('sticker') ? ['a sticker landing'] : [])], 'or')}; a caption changing doesn't count.`,
    `- Keep every shot longer than ${num(lo / 2)} s (${frames(fr(lo / 2))}).`,
    r.tempo === 'fast'
      ? `- When a beat runs longer than ${hi} s, change something inside it: a punch-in, a cut to another layout, or a scene that shows the point. Never let the frame sit still past ${+(hi * 1.25).toFixed(1)} s.`
      : `- Let a shot hold its beat; don't cut sooner than the beat asks just to keep things moving. When a beat runs past ${+(hi * 1.25).toFixed(1)} s, give it a second shot: another layout, or a scene that shows the point.`,
    {
      'every-line': `- **Punch in on every line** of full-frame talk: a punch where each new caption line starts (talk \`punches\`), so the frame moves with the speech. Each punch flips between wide and pushed in, ${pct(M.punch.amount)} over ${frames(M.punch.frames)}${M.punch.frames <= 3 ? ', close to a cut' : ''}.`,
      'stressed-words': `- **Punch in on stressed words**: at a caption line's key word, not on every line; roughly one line in two or three. A punch is ${pct(M.punch.amount)} over ${frames(M.punch.frames)}.`,
      payoffs: `- **Punch in only on payoffs**: the reveal, the number, the last line, at the word that lands it. At most one punch in a shot, and most shots have none. The punch is a slow push (${pct(M.punch.amount)} over ${frames(M.punch.frames)}) and holds to the end of the shot.`,
    }[P.short.punchIns],
    `- The presenter speaks at about ${range(P.wordsPerMinute)} words a minute (${num(P.wordsPerMinute[0] / 60)} to ${num(P.wordsPerMinute[1] / 60)} words a second). Use it to sanity-check a timing you estimate; the transcript's timings always win.`,
    `- Long form (16x9) changes every ${range(P.long.secondsPerChange, ' s')}, but the engine renders 9x16 only for now.`,
  ];

  // the presenter
  const off = Object.keys(LAYOUT).filter((l) => !r.layouts.includes(l));
  const presenter = [
    `- Layouts: ${r.layouts.map((l) => `**${LAYOUT[l]}** (${code(l)}): ${layoutLook(pack, l)}`).join('; ')}.`,
    `- **Open on ${and(pack.presenter.openOn.map((l) => LAYOUT[l]), 'or')}**: the first shot is ${pack.presenter.openOn.includes('halfBand') && r.scenes.includes('title') ? 'a `title` (it shows the half band) or ' : ''}a \`talk\` shot in ${pack.presenter.openOn.length > 1 ? 'one of those layouts' : 'that layout'}.${!pack.presenter.openOn.includes('full') && r.layouts.includes('full') ? ' Never open full frame.' : ''}`,
    ...(r.layouts.length > 1 ? [`- ${r.layouts.includes('full') ? 'Full frame when the face and the delivery carry the beat; ' : ''}${and(r.layouts.filter((l) => l !== 'full').map((l) => LAYOUT[l]), 'or')} when a short heading (the point, 1 to 3 words, in \`head\`) should hold on screen while the presenter makes it.`] : []),
    ...(off.length ? [`- Never ${and(off.map((l) => LAYOUT[l]), 'or')}: ${N} has ${off.length > 1 ? 'them' : 'it'} off, and the engine refuses ${off.length > 1 ? 'them' : 'it'}.`] : []),
    '- The band and the tile show the camera as shot, filled edge to edge, centred on the face, and zoomed in as far as it takes to put the eye line on their upper third line: no cutouts or background removal. Over the band, captions sit on its top edge so they never cross the face; plan caption lines there short enough to read across the seam.',
  ];

  // scenes
  const notIn = Object.keys(SCENES).filter((id2) => !r.scenes.includes(id2));
  const scenes = [
    '| Scene | For | Shows the presenter |',
    '|---|---|---|',
    ...r.scenes.map((s) => `| ${code(s)}${r.own.includes(s) ? ` (${N}'s own)` : ''} | ${cell(SCENES[s].use)} | ${SCENES[s].presenter === 'layout' ? 'yes, in a layout you pick' : SCENES[s].presenter ? `${SCENES[s].needsShoot ? 'yes' : 'with a shoot'}: ${LAYOUT[SCENES[s].presenter]}` : 'no'} |`),
    '',
    ...r.own.map((s) => `- **${N}'s own: ${code(s)}.** ${SCENES[s].use} Use it at least once a video: without it a video reads as the shared scenes in ${N}'s colours, not as ${N}.`),
    `- Graphic scenes stand on the ${pack.composition.ground} ground (${describeGround(pack, pack.grounds[pack.composition.ground])}). Set \`"theme": "${r.other}"\` only to set a whole section apart (the ${r.other} ground: ${describeGround(pack, pack.grounds[r.other])}), never shot by shot.`,
    ...(pack.scenes.avoid.length ? [`- Never ${and(pack.scenes.avoid.map(code), 'or')}: ${N} avoids ${pack.scenes.avoid.length > 1 ? 'them' : 'it'}, and check-plan refuses ${pack.scenes.avoid.length > 1 ? 'them' : 'it'}.`] : []),
    ...(notIn.filter((s) => SCENES[s].kind === 'pack').length ? [`- Not in ${N}: ${and(notIn.filter((s) => SCENES[s].kind === 'pack').map(code))}, scene types other styles bring. The engine refuses them in ${N}.`] : []),
    '- Every scene\'s props, how it comes out in this style, and an example shot: [references/scenes.md](references/scenes.md).',
  ];

  // joins: each one the style has on, where its beats use it
  const usedBy = (j) => Object.keys(BEAT_KINDS).filter((k) => beatJoin(r, k) === j).map((k) => BEAT_KINDS[k].name.toLowerCase());
  const offJoins = Object.keys(JOIN).filter((j) => j !== 'cut' && !r.joinsOn[j]);
  const joins = [];
  if (T.cut) joins.push(`- **Cut** (leave \`in\` out) between two talk shots, inside a beat${usedBy('cut').length ? `, and into ${and(usedBy('cut').map((k) => `the ${k}`))}` : ''}.`);
  for (const j of r.joins.filter((x) => x !== 'cut')) {
    const where = usedBy(j);
    joins.push(`- **${JOIN[j][0].toUpperCase()}${JOIN[j].slice(1)}** (\`"in": "${j}"\`: ${joinLook(pack, j)})${where.length ? ` into ${and(where.map((k) => `the ${k}`))}` : ', when a change needs it'}.${j === 'flash' ? ' Keep it for hits, or it stops hitting.' : ''}`);
  }
  const own = r.joins.filter((j) => j !== 'cut');
  if (own.length) {
    // where a beat comes round again its join goes on the first and the one that matters; check-plan's budget is that
    const AGAIN = { item: 'the items of a list', number: 'a second number', point: 'the points between' };
    const again = Object.keys(AGAIN).filter((k) => own.includes(beatJoin(r, k))).map((k) => AGAIN[k]);
    const budget = joinBudget(r.beats);
    const caps = [...new Set(own.map((j) => budget[j]))].sort((a, b) => b - a).map((n) => ({ n, js: own.filter((j) => budget[j] === n).map((j) => `the ${JOIN[j]}`) }));
    const over = caps.map(({ n, js }, i) => (i ? `${and(js, 'or')} more than ${n}` : `${and(js, 'or')} comes in more than ${n} times a video`)).join(' or ');
    const list = and(own.map((j) => `the ${JOIN[j]}`));
    joins.push(`- **Everything else cuts.** A join is punctuation. ${list[0].toUpperCase()}${list.slice(1)} come${own.length > 1 ? '' : 's'} in on the beats above${again.length ? `, and when one of those beats comes round again (${and(again, 'or')}), only on the first and the one that matters most` : ''}. Cut the rest, the way back to the presenter included: on every change a join stops meaning anything, and the video reads as a template. check-plan warns when ${over}, or when one join comes in on three shots in a row.`);
  }
  if (offJoins.length) joins.push(`- Never ${and(offJoins.map((j) => `${JOIN[j]} (\`${j}\`)`), 'or')}: ${N} has ${offJoins.length > 1 ? 'them' : 'it'} off, and the engine refuses ${offJoins.length > 1 ? 'them' : 'it'}.`);
  const overlapping = r.joins.filter((j) => j !== 'cut' && j !== 'flash');
  if (overlapping.length) joins.push(`- ${(([a, ...rest]) => a[0].toUpperCase() + and([a, ...rest]).slice(1))(overlapping.map((j) => JOIN[j]))} keep${overlapping.length > 1 ? '' : 's'} the shot before on screen under the new one for ${overlapping.length > 1 ? 'their' : 'its'} frames; the reel's length doesn't change. The shot before must be longer than the join.`);

  // captions
  const casing = { uppercase: 'Write them as spoken, in normal case: the pack sets them in caps.', lowercase: 'Write them as spoken: the pack sets them in lower case.', none: 'Write them as spoken; they keep the case you write.' }[S.case];
  const captions = [
    `- Captions are a track on the reel's timeline (\`captions\`), placed on the word timings: **${range(S.words)} words a line**, ${S.words[1] <= 3 ? 'a new line at every stress, so the words keep pace with the voice' : 'broken at phrase boundaries, never mid-phrase'}. Back to back and never overlapping; a gap only where the presenter pauses.`,
    `- Mark at most one **key word** a line with asterisks (\`"text": "five mods that feel *illegal*"\`): ${keyLook(pack)}. Not every line needs one: the stressed word, the number, the turn.`,
    `- ${casing}`,
    ...(r.hidden.length ? [`- Captions hide under ${and(r.hidden.map(code))}: ${r.hidden.length > 1 ? 'those show' : 'it shows'} ${r.hidden.length > 1 ? 'their' : 'its'} own words.${r.own.includes('word-pop') ? ' Leave captions out over word-pop; its groups are the captions there.' : ''}`] : []),
    `- You never style or animate them; the pack does: ${captionLook(pack)}${S.backing.kind === 'pill' ? `, a ${pack.composition.ground === 'light' ? 'light' : 'dark'} pill over the ground and a dark one over footage` : ''}, and each line ${CAPTION_ENTER[S.enter ?? 'cut']}${(S.enter ?? 'cut') !== 'cut' ? ' as it comes on' : ''}.`,
  ];

  // hero
  const hero = [
    `- **One hero colour per video**, from ${N}'s rotation, in order: ${and(pack.palette.heroRotation.map((n) => heroName(pack, n)))}. Never the last video's: take the next one after it. \`check-plan\` finds the newest other plan for ${N} in the same folder and warns on a match, so keep a creator's plans together in \`plans/\`.`,
    `- It colours ${and(r.heroSites)}. You never pick a colour for anything else.`,
    ...(S.key.colour && S.key.colour !== 'hero' ? [`- The caption key word is always ${colourOf(pack, S.key.colour)}, whatever the hero colour.`] : []),
  ];

  const E = P.endHoldMax;
  const ending = E <= 1
    ? `- **End within ${E} s of the last word**: the last shot runs at most ${fr(E)} frames past the last caption.`
    : `- **Hold the end**: the last shot can run up to ${E} s (${fr(E)} frames) past the last word, then the video ends.`;

  const boardScenes = Object.entries(BOARD).filter(([, s]) => r.scenes.includes(s)).map(([b]) => b);
  const secondHero = pack.palette.heroRotation[1] ?? pack.palette.heroRotation[0];

  return `---
name: ${id}
description: ${JSON.stringify(description)}
---

# ${N}: editing skill

Generated from \`src/packs/${id}.json\` by \`scripts/make-skill.mjs\`. To change a rule, change the pack and generate
the skill again (\`node scripts/make-skill.mjs ${id}\`); don't edit these files by hand.

You edit talking-head shorts in **${N}**. ${pack.description}

**How it feels.** ${feel}

**What you decide.** The look is in the pack, and the engine applies it to every scene: faces, colours, grounds, cards,
the caption styling, every motion curve. You never set a colour, a font, a size or a position. You decide the edit:
which scene carries each beat and for how long, how shots join, where the punch-ins land, how the captions break, and
the video's hero colour. The rules below are ${N}'s for those decisions.

Run every command from the engine's root folder (the one with \`package.json\` and \`src/packs/${id}.json\`).

## What you need

- **The edit**: the talking-head video, already cut (takes chosen, dead air out), as one continuous file in
  \`public/footage/<video>/\`. The reel is 1080x1920 at 30 fps; the edit can be landscape.
- **Word timings**: the transcript with a time for each word (an SRT, VTT or JSON from the creator, or a local Whisper
  run with word timestamps). Captions${r.own.includes('word-pop') ? ', word-pop' : ''}${r.own.includes('sticker') ? ', stickers' : ''}${r.own.includes('slam') ? ', the slam' : ''} and punch-ins are all placed on them.
- **The face, measured** in the edit's own pixels. Pull a frame with a grid on it, a line every 100 px
  (\`ffmpeg -ss 5 -i public/footage/<video>/plate.mp4 -frames:v 1 -vf "drawgrid=w=100:h=100:t=2:c=red@0.6" out/face.png\`),
  look at it, and read off the face's centre x, the top of the head (crown), the eye line and the chin by counting
  grid lines. They go in the plan's \`shoot\`, with the edit's \`width\` and \`height\` (\`ffprobe\` prints them).
- **How light the footage is under the face**: \`node scripts/footage-tone.mjs public/footage/<video>/plate.mp4 <faceX> <eyes> <chin>\`
  prints the shoot's \`tone\` (\`{ "chest": 0.01 }\` for a black shirt, near 1 for a white one). Words straight on the
  footage (word-pop, captions with no box) take white or ink from it, with an edge in the opposite tone, so they read
  on any shirt. Measure it on a frame that shows the shirt as it is for most of the video.
- **The voice**: an audio file lined up with the edit (or the edit itself, if it has sound), as the plan's \`audio\`.
- **The creator's profile**, \`plans/perfil.json\`, made once per creator: their name and @ (\`nome\`, \`arroba\`), what
  they talk about and to whom (\`nicho\`), the line they end on (\`cta\`), their photo (\`foto\`, in \`public/\`) and
  their prints (\`prints[]\`: \`file\` in \`public/\`, \`descricao\`, \`shape\`). When the file isn't there, run
  \`node scripts/perfil.mjs\` (a page opens in their browser; wait for it to finish) or, if they'd rather answer in the
  chat, ask for the name and @ at least and write the file yourself (the photo and prints can come later).

## How you work

0. **Read the creator's rules.** \`plans/regras.json\`, when it exists, holds what this creator has asked for
   "always" on earlier storyboards (\`regras[].texto\`, with the video and shot it came from). Follow each one as if
   it were written in this file; where one contradicts ${N}'s rules, the creator wins, and say so in the plan's notes.
   Read \`plans/perfil.json\` too, and put the creator in the plan: \`creator: { name, handle, photo }\` from \`nome\`,
   \`arroba\` and \`foto\`; \`badge: true\` on the first full-frame presenter shot after the hook and on the end shot
   (never on a title, a graphic or the band: the engine refuses it there); \`nicho\` shapes the words you choose, and
   \`cta\` is what the end says. Where a beat is proof and one of their prints shows it (read each \`descricao\`),
   carry it with the \`print\` scene (\`src\` the print's \`file\`, \`shape\` its shape) rather than a quote.
1. **Find the beats.** Read the transcript into beats, one point each, and name each one's kind: a hook, a payoff,
   an item, a number, a point, a proof or the end ([${N}'s beats](#the-beats), below).
2. **Pick the hero colour** (below).
3. **Lay out the shots** on the edit's timeline: each beat on the scene ${N} carries it with, joined the way the
   beats table says, at ${N}'s pace (below). Shot lengths add up to the reel, and the reel's frame n shows the edit's
   frame \`from + n\`. Write the plan to \`plans/<video>.json\` (make the folder if it isn't there; it stays out of
   git). Scenes and their props: [references/scenes.md](references/scenes.md). The plan format:
   [references/plan.md](references/plan.md). A whole video in this style: [example-plan.json](example-plan.json).
   Where you hesitate between two scenes for a beat, plan one and offer the other as \`options\` on that shot
   (\`[{ scene, props, in?, why }]\`, each a whole shot of the same length, \`why\` one line in the creator's language):
   the storyboard (step 7) shows them side by side and the creator picks. Two or three shots with options a video,
   not every shot.
4. **Write the captions** from the word timings (below).
5. **Check the plan**: \`node scripts/check-plan.mjs plans/<video>.json\`. Fix every error; weigh every warning.
6. **Render stills and look at every one**: \`node scripts/render-reel.mjs plans/<video>.json --stills auto\` writes a
   still per shot once it has landed, plus the middle of each join, to \`out/reels/<video>/\`. Check each against
   [references/look.md](references/look.md):
${review.map((x) => `   - ${x}`).join('\n')}

   Fix the plan and render the stills again until every one reads.
7. **Storyboard: the creator approves before the render**: \`node scripts/storyboard.mjs plans/<video>.json\`
   renders a still per shot (and per option), opens a page in the creator's browser and waits. There the creator
   watches the cut with the shots marked on it, picks between the options, marks speech errors and breaths to cut,
   writes what to change (for this video, or always) and approves or asks for changes. Tell the creator the page is
   open and wait for the command to finish; never approve for them. When it ends:
   - It has already written the chosen options into the plan (the plan as it was: \`plans/<video>.antes.json\`) and
     the "always" notes into \`plans/regras.json\`; everything the creator said is in \`plans/<video>.storyboard.json\`
     and in the command's output.
   - **Cuts** (\`cortes\`, in seconds of the edit in \`public/footage\`, not the reel): remove those ranges from the
     edit with ffmpeg (keep the original beside it), make the word timings again, shift \`from\`, the captions and the
     shots, and run the storyboard again so the creator sees the cut.
   - **Adjustments** (\`ajustes\`): change the plan accordingly, check it, render the stills again. A note marked always
     is now a rule: follow it in this plan too.
   - Exit code 0 is approved: apply any adjustments and render. Exit code 2 is changes asked: fix the plan and run the
     storyboard again until the creator approves.
8. **Render the video**: \`node scripts/render-reel.mjs plans/<video>.json\` writes \`out/reels/<video>.mp4\`.

## ${N}'s rules

### The beats

${beats.join('\n')}

### Pace

${pace.join('\n')}

### The presenter

${presenter.join('\n')}

### Scenes

${scenes.join('\n')}

### Joins

${joins.join('\n')}

### Captions

${captions.join('\n')}

### Hero colour

${hero.join('\n')}

### The end

${ending}

## Rendering

- **A reel**: \`node scripts/render-reel.mjs plans/<video>.json\`, or \`--stills auto\` / \`--stills 0,45,90\` for
  frames. The reel entry is \`src/reel/entry.tsx\` (composition \`Reel\`) and the plan is its input props, so the plan's
  \`pack\` and \`hero\` pick the pack and the colour.
  \`npx remotion render src/reel/entry.tsx Reel out/<video>.mp4 --props=plans/<video>.json\` works too, but on Windows
  it leaves Remotion's temp copies of the footage behind; the script removes them.
- **Scrub it in the Studio**: \`npx remotion studio src/reel/entry.tsx --props=plans/<video>.json\`.
- **The board** shows the style itself, its scenes with fixed words:
  \`node scripts/render-stills.mjs --packs ${id} --scenes ${boardScenes.join(',')}\` (stills in \`out/stills/${id}/\`), or one
  still: \`npx remotion still src/board/entry.tsx Board-Title out/title.png --frame=60 --props="{\\"pack\\":\\"${id}\\",\\"hero\\":\\"${secondHero}\\"}"\`.
  The board entry is \`src/board/entry.tsx\` (\`npm run studio\`).
- The engine refuses a plan it can't render before drawing a frame, and says why, by shot: a scene ${N} doesn't bring,
  a missing or unknown prop, a join or a layout ${N} has off.
- \`BROWSER=<path to chrome-headless-shell>\` reuses a browser already on disk.
- The example plan renders with the engine's demo footage, if it's on this machine:
  \`node scripts/render-reel.mjs ${rel}/example-plan.json --stills auto\`.
`;
};

// ── references/scenes.md ─────────────────────────────────────────────────────────────────────────────────────────

const sceneNotes = (pack, id) => {
  const r = read4(pack);
  const T = pack.type;
  const M = pack.motion;
  const align = pack.composition.align === 'center' ? 'centred' : 'set left';
  const notes = {
    title: [
      `Lines in ${voiceFace(pack, 'display')}, ${caseNote(pack, 'display')}, ${align}; the lead-in in ${voiceFace(pack, 'accent')}.`,
      fitNote(pack),
      `The hero word lands on ${pack.name}'s spring, ${M.spring.z < 0.5 ? 'with a bounce' : M.spring.z < 0.8 ? 'with a little overshoot' : 'with no overshoot'}.`,
      pack.presenter.layouts.halfBand ? `With a shoot, the presenter sits in the half band: ${layoutLook(pack, 'halfBand')}.` : `${pack.name} has the half band off, so leave the shoot out of a plan whose title shows it (check-plan flags it).`,
    ],
    talk: [
      ...r.layouts.map((l) => `\`${l}\`: ${layoutLook(pack, l)}.`),
      `A punch is ${pct(M.punch.amount)} over ${M.punch.frames} frames; ${{ 'every-line': 'punch on every new caption line', 'stressed-words': 'punch on stressed words', payoffs: 'punch only on payoffs, at most once a shot' }[pack.pace.short.punchIns]}.`,
      ...(r.layouts.some((l) => l !== 'full') ? [`The heading (\`label\`, \`head\`) is ${align}; \`head\` follows the fit rule: ${T.display.layout.fit === 'width' ? 'it fills the measure, so one short word sets very large' : 'it keeps its size and shrinks only to fit'}.`] : []),
    ],
    list: [
      `The counter in ${voiceFace(pack, 'label')}, the name in ${voiceFace(pack, 'display')} ${caseNote(pack, 'display')}, the line in ${voiceFace(pack, 'body')}, all ${align}.`,
      `The card: ${pack.cards[pack.composition.ground].radius} px corners${pack.cards[pack.composition.ground].ring ? ', a fine ring' : ''}; the win fact sits on a box in the hero colour.`,
    ],
    stat: [
      `The paragraph breaks at about ${T.body.layout.measure ?? 40} characters a line in ${voiceFace(pack, 'body')}: keep it under about ${(T.body.layout.measure ?? 40) * 3} characters, three lines.`,
      `The old number is struck through in the step-back colour; the new one is in the hero colour.`,
    ],
    quote: [
      `In ${voiceFace(pack, 'display')}, ${caseNote(pack, 'display')}, one size for every line (the longest line sets it), ${align}. Keep the lines about the same length.`,
    ],
    'word-pop': [
      `Words in ${voiceFace(pack, 'display')}, ${pack.type.display.case === 'uppercase' ? 'in caps' : 'in caps (word-pop asks for them)'}, popping in on ${pack.name}'s spring, ${({ auto: 'in white or ink, whichever reads on the footage under them (the shoot\'s `tone`)', white: 'in white', black: 'in ink', hero: 'in the hero colour' })[pack.wordPop?.words ?? 'auto']} with an edge in the opposite tone; the key word lands ${({ box: 'on a box in the hero colour', marker: 'on a marker highlight', colour: 'in the hero colour' })[pack.wordPop?.key ?? (pack.subtitles.key.box ? 'box' : pack.subtitles.key.mark === 'highlight' ? 'marker' : 'colour')]} with a quick punch-in${pack.transitions.flash.enabled ? `, a soft ${pack.transitions.flash.frames}-frame flash` : ''} and a small shake (the scene's \`energy\`, calm by default).`,
      `Groups of ${range([1, Math.min(2, pack.subtitles.words[1])])} words, and the key word alone in the last group, held to the end of the shot. Time each word to when it's said.`,
    ],
    slam: [
      `The value in ${voiceFace(pack, 'display')} ${caseNote(pack, 'display')}, as wide as the frame allows (up to a cap height of about 570 px), ${MARK[sigOf(pack).mark]}${sigOf(pack).mark === 'none' ? ' with a glow' : ''}; it lands at \`at\` from almost twice its size on ${pack.name}'s spring, with a shake, a shockwave${pack.transitions.flash.enabled ? ' and a flash' : ''}.`,
      `\`was\` waits above it in the step-back colour and is struck out in ${colourOf(pack, 'friction')} just before \`at\`; \`label\` rises in under it in ${voiceFace(pack, 'label')}.`,
      `Start the shot about ${frames(24)} before the word that lands it (so \`at\` is about 24) and hold it about a second after: the presenter carries the set-up before it.`,
    ],
    chart: [
      `Set on the page, ${align}, no card: the lead-in in ${voiceFace(pack, 'accent')}, the headline in ${voiceFace(pack, 'display')} by the fit rule, a rule drawn across, then the bars from a hairline axis.`,
      `Bars are a quiet tint of the type and the \`win\` bar the hero colour; each value is set in ${voiceFace(pack, 'display')} at its bar's end and counts up as the bar draws (the number inside \`label\` counts, so write it as shown: $240, 12 h, 1,200). A bar at 0 is a tick on the axis.`,
      'With two bars, the change from the first to the second is set at the far end of the second row (−100%).',
      `The bars draw one after another from about frame 18, ${frames(Math.round(pack.motion.reveal.frames * 1.6))} each; hold the shot at least 2.5 s so the last value settles.`,
    ],
    doodle: [
      `The note in ${voiceFace(pack, 'display')} on a scrap of paper with a hand-drawn border and a strip of tape, leaning, above the head; \`*word*\` sits on a marker in the hero colour. Keep it to about 16 characters or it sets smaller.`,
      `About ${frames(8)} after \`from\` an arrow is drawn from the note down to the side of the head, and the hero-coloured strokes of emphasis follow; all of it wobbles and redraws the signature's way.`,
      'It shows the presenter full frame (no punch-ins) and the captions run under it as usual.',
    ],
    command: [
      `A window (${SURFACE_ONE[sigOf(pack).surface]}) with a title bar, the command and its output in ${voiceFace(pack, 'code')}, sized so the longest line fits.`,
      `It types the command at about ${Math.round(2.2 * FPS)} letters a second from about frame ${Math.round(pack.motion.reveal.frames * 0.4)}, then prints a line every ${frames(4)}; the \`win\` line is ${MARK[sigOf(pack).mark]}. A 28-letter command and three lines take about 1.2 s, so hold the shot at least 2 s.`,
      pack.presenter.layouts.tile ? `With a shoot, the presenter sits under it in the tile${sigOf(pack).chrome === 'window' ? ', in its own window' : ''}, and the captions run over the tile.` : `${pack.name} has the tile off, so leave the shoot out of a plan that uses it.`,
    ],
    float: [
      `The footage pulls gently out of focus over about ${frames(16)} (soft, not gone) and pushes in slowly; the card is ${SURFACE_ONE[sigOf(pack).surface]}, standing on the caption lane over the mouth and chest, never above the eye line, and breathing up and down.`,
      `The lead-in in ${voiceFace(pack, 'accent')} beside the icon, the headline in ${voiceFace(pack, 'display')}; \`value\` large under it, ${MARK[sigOf(pack).mark]}, with \`was\` struck out beside it; or \`facts\` as rows, the \`win\` one in the hero colour.`,
      'Give it `value` or `facts`, not both, and keep it short: a headline and a number, or two or three facts. A taller card is drawn smaller to stay under the eyes. The captions run under it over the soft footage.',
    ],
    sticker: [
      `Tags are ${pack.cards.light.fill === '#FFFFFF' ? 'white' : pack.cards.light.fill} blocks with an ink border and a hard shadow, the text in ${voiceFace(pack, 'display')}; a \`burst\` is a starburst in the hero colour with an ink edge.`,
      'Each lands at its `at` from almost twice its size, settles on the spring and kicks the frame with a small shake. They fill three places in order: above the head on one side, above it on the other, low beside the chest.',
      'A `strike` tag is crossed out in the hero colour as the next sticker lands: the old price, then the new one in a burst on its word.',
    ],
  };
  return notes[id] ?? [];
};

const scenesMd = (pack) => {
  const r = read4(pack);
  const N = pack.name;
  const example = examplePlan(pack);
  const exampleShot = (id) => {
    const s = example.shots.find((x) => x.scene === id);
    const props = s?.props ?? SCENES[id].example;
    const shot = { scene: id, frames: s?.frames ?? fr(r.hi), ...(s?.in ? { in: s.in } : {}), props };
    return JSON.stringify(shot);
  };
  const out = [
    `# ${N}: scenes`,
    '',
    `The scenes a ${N} plan can use, their props, and how each one comes out in ${N}. Generated from the scene catalogue`,
    `(\`src/reel/scenes.json\`) and \`src/packs/${pack.id}.json\`. The engine gives a scene the presenter (\`shoot\` and \`at\`)`,
    'itself, so never put those in props; nor `sub`: captions are the plan\'s.',
    '',
  ];
  for (const id of r.scenes) {
    const S = SCENES[id];
    out.push(`## ${id}${r.own.includes(id) ? ` (${N}'s own)` : ''}`, '', S.job, '', `**Use it for:** ${S.use}`, '');
    out.push(`**In ${N}:**`, '', ...sceneNotes(pack, id).map((n) => `- ${n}`), '');
    out.push('| Prop | Type | | What |', '|---|---|---|---|');
    for (const [k, p] of Object.entries(S.props)) {
      if (id === 'talk' && k === 'layout') {
        out.push(`| \`layout\` | \`${cell(r.layouts.map((l) => `"${l}"`).join(' | '))}\` | required | ${cell(`The presenter layout; ${N} uses ${and(r.layouts.map(code), 'or')}.`)} |`);
        continue;
      }
      out.push(`| \`${k}\` | \`${cell(p.type)}\` | ${p.required ? 'required' : ''} | ${cell(p.note)} |`);
    }
    out.push('', 'A shot:', '', '```json', exampleShot(id), '```', '');
  }
  const notIn = Object.keys(SCENES).filter((id) => !r.scenes.includes(id));
  if (notIn.length) {
    out.push(`## Not in ${N}`, '');
    for (const id of notIn) {
      const why = pack.scenes.avoid.includes(id) ? `${N} avoids it (check-plan refuses it)` : SCENES[id].kind === 'pack' ? `a scene type other styles bring; the engine refuses it in ${N}` : `${N} has no presenter layout for it`;
      out.push(`- \`${id}\`: ${why}.`);
    }
    out.push('');
  }
  return out.join('\n');
};

// ── references/plan.md ───────────────────────────────────────────────────────────────────────────────────────────

const planMd = (pack, rel) => {
  const r = read4(pack);
  const N = pack.name;
  const ex = examplePlan(pack);
  const T = pack.transitions;
  const joinFrames = r.joins.filter((j) => j !== 'cut').map((j) => `${JOIN[j]} ${frames(joinSpec(pack, j).frames)}`);
  let start = 0;
  const rows = ex.shots.map((s, i) => {
    const row = `| ${i + 1} | ${start} | ${s.frames} | \`${s.scene}\`${s.props?.layout ? ` ${s.props.layout}` : ''} | ${s.in ?? 'cut'} | ${s.props?.punches ? s.props.punches.join(', ') : ''} | ${cell(s.note)} |`;
    start += s.frames;
    return row;
  });
  return `# ${N}: the reel plan

A reel plan is a whole video as JSON, in \`plans/<video>.json\` (plans are per creator, like footage, and stay out of
git). The reel entry (\`src/reel/entry.tsx\`) renders it; \`scripts/check-plan.mjs\` checks it against ${N}'s rules. The
types are in \`src/reel/plan.ts\`.

## Fields

| Field | What it is |
|---|---|
| \`pack\` | \`"${pack.id}"\`. It picks the pack when the plan renders. |
| \`hero\` | The video's hero colour, from the rotation: ${and(pack.palette.heroRotation.map(code), 'or')}. |
| \`title\` | A name for the video (optional). |
| \`creator\` | The creator, for the badge: \`{ name, handle, photo? }\` from \`plans/perfil.json\` (\`photo\` in \`public/\`). |
| \`shoot\` | The edit and the face: \`{ plate, width, height, faceX, crown, eyes, chin, tone }\`. Paths are in \`public/\`; measurements in the edit's pixels; \`tone\` from \`scripts/footage-tone.mjs\`. |
| \`from\` | The edit's frame the reel starts on (0 for the whole edit). |
| \`audio\` | The voice: a file in \`public/\` lined up with the edit, played from \`from\`. |
| \`captions\` | \`[{ from, to, text }]\` on the reel's timeline. |
| \`shots\` | \`[{ scene, frames, in?, beat?, props?, note? }]\`, in order. \`beat\` is the kind of beat the shot belongs to (\`hook\`, \`payoff\`, \`item\`, \`number\`, \`point\`, \`proof\`, \`end\`), on every shot of the beat, so check-plan can hold it to ${N}'s beats table; \`note\` says what the shot is for. Neither is rendered. |
| \`shots[].badge\` | \`true\` shows the creator's badge (photo, @, name) over that shot: a full-frame presenter shot only, the opening and the end. |
| \`shots[].options\` | \`[{ scene, props, in?, why }]\` (optional): alternatives for that shot, each a whole shot of the same length, for the creator to pick on the storyboard (\`scripts/storyboard.mjs\`). \`why\` is one line for the creator. The storyboard writes the pick into the shot and drops the options. |

## Timing

- 30 fps: seconds × 30 = frames. A shot's \`frames\` is its length; shots run back to back, and their frames add up to
  the reel's length.
- A word said at *t* seconds into the edit is at reel frame \`round(t × 30) − from\`.
- Times inside a shot (talk \`punches\`, word-pop \`groups\`, a slam's or a sticker's \`at\`, a doodle's \`from\`) count
  from the shot's first frame.
- ${N} in frames: a change every ${fr(r.lo)} to ${fr(r.hi)} frames, no shot under ${fr(r.lo / 2)}${joinFrames.length ? `; ${and(joinFrames)}` : ''}; the end within ${fr(pack.pace.endHoldMax)} frames of the last word.

## Captions

\`{ "from": 120, "to": 138, "text": "five mods that feel *illegal*" }\`: frames on the reel; \`*word*\` marks the key
word, at most one a line. ${range(pack.subtitles.words)} words a line in ${N}. Captions run back to back and never
overlap. The reel draws each one for what's under the lane: over footage, or over the ground in its colour.

## The example

[\`${rel}/example-plan.json\`](../example-plan.json) is one short video laid out by ${N}'s rules: the same script the
other styles' examples use, so the differences are the style's. It uses the engine's demo footage
(\`public/footage/demo/\`, not in the repo; measured in \`src/board/demo-shoot.json\`) and no audio. Its captions are timed at ${N}'s speaking pace rather
than from a transcript; a real plan's come from the word timings.

| # | Starts | Frames | Scene | Join | Punches | For |
|---|---|---|---|---|---|---|
${rows.join('\n')}

Render it, if the demo footage is on this machine: \`node scripts/render-reel.mjs ${rel}/example-plan.json --stills auto\`.
`;
};

// ── references/look.md ───────────────────────────────────────────────────────────────────────────────────────────

const lookMd = (pack) => {
  const N = pack.name;
  const T = pack.type;
  const P = pack.palette;
  const S = pack.subtitles;
  const M = pack.motion;
  const PR = pack.presenter;
  const voices = { display: 'headlines, quotes', accent: 'lead-ins', body: 'running text', label: 'eyebrows, counters, fact labels', code: 'code' };
  if (pack.scenes.brings.includes('word-pop')) voices.display += ', word-pop';
  // captions and their key word take a voice's family at a weight of their own (src/kit/Subtitle.tsx), so where that
  // isn't the voice's face, the row names the face they're drawn in
  const drawnIn = (v, weight, style = 'normal') => (weight === T[v].weight && style === (T[v].style ?? 'normal') ? '' : ` in ${face(T[v].family, weight, style)}`);
  voices[S.voice] += `, captions${drawnIn(S.voice, S.weight)}`;
  if (S.key.voice !== S.voice) voices[S.key.voice] += `, the caption key word${drawnIn(S.key.voice, S.key.weight, S.key.style)}`;
  const layoutRule = (v) => {
    const L = T[v].layout;
    const bits = [];
    if (v === 'display') bits.push(L.fit === 'width' ? `fills ${L.measure != null && L.measure < 1 ? `${pct(L.measure)} of ` : ''}the measure` : `keeps its size ×${L.fitScale}, shrinks to fit`);
    if (v === 'body' && L.measure) bits.push(`${L.measure} characters a line`);
    if (L.lineHeight) bits.push(`line pitch ${L.lineHeight} ${v === 'body' || v === 'accent' ? 'x-heights' : 'cap heights'}`);
    return bits.join('; ');
  };
  const card = (g) => {
    const c = pack.cards[g];
    return `${c.fill}${c.top !== c.bottom ? ` (lit, ${c.top} to ${c.bottom})` : ', flat'}, ${c.radius} px corners${c.ring ? `, a ${c.ring.width} px ring` : ''}, a ${c.shadow.blur ? 'soft' : 'hard'} shadow ${c.shadow.dy} px down`;
  };
  return `# ${N}: the look

What the engine draws in ${N}, from \`src/packs/${pack.id}.json\`. You never set any of it; it's here so you know what
the stills should show. ${pack.description}

## Type

| Voice | Face | Case | Tracking | Used for | Layout |
|---|---|---|---|---|---|
${Object.keys(voices).map((v) => `| ${v} | ${voiceFace(pack, v)} | ${T[v].case === 'none' ? 'as written' : T[v].case === 'uppercase' ? 'caps' : 'lower'} | ${T[v].tracking} em | ${voices[v]} | ${layoutRule(v)} |`).join('\n')}

Every face is scaled to the engine's reference face (cap height 0.7 em for headlines and labels, the x-height for body
text and lead-ins), so a size means the same in every style.

## Colour

| Name | Value | Role |
|---|---|---|
| base | ${P.base} | the dark ground |
| text / textSoft | ${P.text} / ${P.textSoft} | type on dark: headlines / step-back |
| ink / inkSoft | ${P.ink} / ${P.inkSoft} | type on light: headlines / step-back |
| win | ${P.win} | the win, the after, the pick |
| friction | ${P.friction} | the friction, the before |
${Object.entries(P.extended).map(([k, v]) => `| ${k} | ${v} | hero colour option |`).join('\n')}

Hero rotation, one per video: ${and(P.heroRotation.map(code))}.

## Grounds

- **Dark**${pack.composition.ground === 'dark' ? ' (the default)' : ''}: ${describeGround(pack, pack.grounds.dark)}.
- **Light**${pack.composition.ground === 'light' ? ' (the default)' : ''}: ${describeGround(pack, pack.grounds.light)}.

Scenes are ${pack.composition.align === 'center' ? 'centred' : 'set left'}, with ${pack.composition.margin} px side margins, the stack starting
${pack.composition.top} px down.

## Cards

- On dark: ${card('dark')}.
- On light: ${card('light')}.

## Signature

${signatureLines(pack).map((l) => `- ${l}`).join('\n')}

## Captions

${captionLook(pack)}, centred in the lane at y ${S.laneY}. The key word: ${keyLook(pack)}.

## The presenter

${Object.keys(LAYOUT).filter((l) => PR.layouts[l]).map((l) => `- **${LAYOUT[l][0].toUpperCase()}${LAYOUT[l].slice(1)}**: ${layoutLook(pack, l)}.`).join('\n')}

## Motion

- Arrivals: each line over ${M.reveal.frames} frames, ${M.reveal.stagger} frames apart, rising ${M.rise} px (bezier ${M.reveal.bezier.join(', ')}).
- The landing spring: frequency ${M.spring.w} a frame, damping ${M.spring.z} (${M.spring.z < 0.5 ? 'bouncy' : M.spring.z < 0.8 ? 'a little overshoot' : 'no overshoot'}).
- Punch-in: ${pct(M.punch.amount)} over ${M.punch.frames} frames.
- Joins: ${Object.keys(JOIN).filter((j) => joinSpec(pack, j).enabled).map((j) => (j === 'cut' ? 'cut' : `${JOIN[j]}: ${joinLook(pack, j)}`)).join('; ')}.
- Captions: each line ${CAPTION_ENTER[S.enter ?? 'cut']}.
`;
};

// ── Write ────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Where a pack has a line break, in a name or a value, or null. The skill puts its names and values in headings, tables
 * and lists, where a new line could open a section of its own. */
const lineBreak = (v, at = '') => {
  if (typeof v === 'string') return /[\r\n\u2028\u2029]/.test(v) ? at : null;
  if (!v || typeof v !== 'object') return null;
  for (const [k, x] of Object.entries(v)) {
    const part = /^[\w-]+$/.test(k) ? k : JSON.stringify(k);
    const where = at ? `${at}.${part}` : part;
    const found = /[\r\n\u2028\u2029]/.test(k) ? where : lineBreak(x, where);
    if (found) return found;
  }
  return null;
};

for (const id of ids) {
  const file = packFile ? path.resolve(packFile) : path.join(ROOT, 'src/packs', `${id}.json`);
  if (!fs.existsSync(file)) {
    console.log(`no pack "${id}" in src/packs`);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  // the name and the description go into headings, table cells and the frontmatter: one line each, so neither can open
  // a section of its own in the skill
  const oneLine = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
  const pack = { ...raw, name: oneLine(raw.name), description: oneLine(raw.description) };
  // everything else is one line already, or the pack is refused
  const broken = lineBreak({ ...pack, name: '', description: '' });
  if (broken) {
    console.log(`${broken} in the pack runs over more than one line: a name or a value in a style pack is one line`);
    process.exit(1);
  }
  const dir = path.join(outRoot, id);
  const rel = path.relative(ROOT, dir).replace(/\\/g, '/');
  fs.mkdirSync(path.join(dir, 'references'), { recursive: true });
  const files = {
    'SKILL.md': skillMd(pack, rel),
    'references/scenes.md': scenesMd(pack),
    'references/plan.md': planMd(pack, rel),
    'references/look.md': lookMd(pack),
    'example-plan.json': `${JSON.stringify(examplePlan(pack), null, 2)}\n`,
  };
  for (const [f, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, f), text);
  console.log(`${rel}/: ${Object.keys(files).join(', ')}`);
}
