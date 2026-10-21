// Check a reel plan against its style pack's rules, the ones the editing skill follows and the engine doesn't enforce:
// the opening layout, the pace, the punch-ins, caption lengths, the end hold, the scenes the style avoids and the hero
// rotation. Also catches early what the engine would refuse (joins and layouts the pack has off).
//   node scripts/check-plan.mjs plans/<video>.json [--pack <file>]      --pack: a pack not in src/packs (a Studio draft)
// Errors break the style; warnings are worth a look. Exits 1 on any error.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BEAT_KINDS, beatsOf, joinBudget, joinRuns, shotRef } from './lib/beats.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FPS = 30;
const planPath = process.argv[2];
if (!planPath || planPath.startsWith('--')) {
  console.log('usage: node scripts/check-plan.mjs <plan.json> [--pack <file>]');
  process.exit(1);
}
const plan = JSON.parse(fs.readFileSync(path.resolve(planPath), 'utf8'));
const packAt = process.argv.indexOf('--pack');
const packFile = packAt > 0 ? path.resolve(process.argv[packAt + 1]) : path.join(ROOT, 'src/packs', `${plan.pack}.json`);
if (!fs.existsSync(packFile)) {
  console.log(`ERROR  no pack "${plan.pack}" in ${packAt > 0 ? packFile : 'src/packs'}`);
  process.exit(1);
}
const pack = JSON.parse(fs.readFileSync(packFile, 'utf8'));
const SCENES = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/reel/scenes.json'), 'utf8'));
/** The icons the kit draws, by name: ICONS in src/kit/Icon.tsx (keep the two the same). */
const ICONS = ['bolt', 'clock', 'coin', 'chart', 'trend', 'spark', 'check', 'chat', 'code', 'star', 'heart', 'gauge', 'eye', 'target', 'layers', 'play', 'user', 'mail', 'lock'];

const errors = [];
const warnings = [];
const s = (frames) => `${(frames / FPS).toFixed(1)} s`;
const range = ([a, b], unit = '') => (a === b ? `${a}${unit}` : `${a} to ${b}${unit}`);
const shots = plan.shots ?? [];
const starts = shots.reduce((a, x, i) => [...a, i ? a[i - 1] + shots[i - 1].frames : 0], []);
const end = shots.reduce((a, x) => a + x.frames, 0);
const name = (i) => `shot ${i + 1} (${shots[i].scene}${shots[i].scene === 'talk' ? ` ${shots[i].props?.layout ?? 'with no layout'}` : ''})`;
const captions = [...(plan.captions ?? [])].sort((a, b) => a.from - b.from);
const words = (text) => text.replace(/\*/g, '').split(/\s+/).filter(Boolean);

/** The presenter layout a shot shows, or null for a graphic. */
const layoutOf = (shot) => {
  const def = SCENES[shot.scene];
  if (!def?.presenter) return null;
  if (def.presenter === 'layout') return shot.props?.layout ?? null;
  return def.needsShoot || plan.shoot ? def.presenter : null;
};

// ── Hero colour ──
const names = ['win', 'friction', ...Object.keys(pack.palette.extended)];
const rotation = pack.palette.heroRotation;
if (!plan.hero) warnings.push(`no hero colour: the render uses ${rotation[0]}, the first of the rotation (${rotation.join(', ')})`);
else if (!names.includes(plan.hero) && !/^#[0-9a-f]{6}$/i.test(plan.hero)) errors.push(`hero "${plan.hero}" isn't one of ${pack.name}'s colours (${names.join(', ')})`);
else if (!rotation.includes(plan.hero)) warnings.push(`hero "${plan.hero}" isn't in ${pack.name}'s rotation (${rotation.join(', ')})`);
const dir = path.dirname(path.resolve(planPath));
const others = fs.readdirSync(dir)
  .filter((f) => f.endsWith('.json') && path.join(dir, f) !== path.resolve(planPath))
  .map((f) => {
    try {
      const p = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      return p.pack === plan.pack && p.shots ? { f, hero: p.hero ?? rotation[0], t: fs.statSync(path.join(dir, f)).mtimeMs } : null;
    } catch {
      return null;
    }
  })
  .filter(Boolean)
  .sort((a, b) => b.t - a.t);
if (others.length && plan.hero) {
  const last = others[0];
  const next = rotation[(rotation.indexOf(last.hero) + 1) % rotation.length];
  if (last.hero === plan.hero) warnings.push(`hero "${plan.hero}" is the last video's too (${last.f}): one per video, never the last one's; next in the rotation is ${next}`);
}

// ── Scenes, joins, layouts ──
const T = pack.transitions;
const joinOn = { cut: T.cut, ease: T.ease.enabled, zoom: T.zoomThrough.enabled, flash: T.flash.enabled, wipe: !!T.wipe?.enabled, blur: !!T.blur?.enabled, glitch: !!T.glitch?.enabled, whip: !!T.whip?.enabled };
shots.forEach((shot, i) => {
  if (!SCENES[shot.scene]) return errors.push(`${name(i)}: no such scene; scenes: ${Object.keys(SCENES).join(', ')}`);
  if (pack.scenes.avoid.includes(shot.scene)) errors.push(`${name(i)}: ${pack.name} avoids the ${shot.scene} scene`);
  if (SCENES[shot.scene].kind === 'pack' && !pack.scenes.brings.includes(shot.scene)) errors.push(`${name(i)}: ${pack.name} doesn't bring the ${shot.scene} scene`);
  // the engine refuses an icon it doesn't have, so this says so before the render does
  const icon = shot.props?.icon;
  if (icon != null && !ICONS.includes(icon)) errors.push(`${name(i)}: no icon "${icon}" (icons: ${ICONS.join(', ')})`);
  const join = shot.in ?? 'cut';
  if (!(join in joinOn)) errors.push(`${name(i)}: no such join "${join}"`);
  else if (!joinOn[join]) errors.push(`${name(i)}: ${pack.name} doesn't use the ${join} join`);
  const layout = layoutOf(shot);
  if (shot.scene === 'talk' && !layout) errors.push(`${name(i)}: talk needs props.layout (full, halfBand or tile)`);
  if (layout && !pack.presenter.layouts[layout]) errors.push(`${name(i)}: ${pack.name} doesn't use the ${layout} layout`);
  if (shot.scene === 'talk' && shot.props?.layout !== 'full' && shot.props?.punches?.length) warnings.push(`${name(i)}: punches only work full frame; the engine ignores them here`);
});

for (const own of pack.scenes.brings) {
  if (SCENES[own] && !shots.some((x) => x.scene === own)) warnings.push(`${pack.name} brings ${own} and the plan never uses it: without it a video reads as the shared scenes in ${pack.name}'s colours`);
}

// ── The style's beats: a run of shots tagged with a beat uses a scene the style carries it with, joined its way ──
// (the skill's beats table, from the same code: scripts/lib/beats.mjs). A beat that cuts where the table gives a join
// is the rationing the skill asks for; a join the table doesn't give it is not, and neither is a beat that never gets
// its join at all.
const KINDS = Object.keys(BEAT_KINDS);
const recipe = pack.scenes.beats ?? {};
const table = beatsOf(pack, SCENES);
const an = (w) => `${/^[aeiou]/.test(w) ? 'an' : 'a'} ${w}`;
const joined = {};
for (let k = 0, e = 0; k < shots.length; k = e + 1) {
  const b = shots[k].beat;
  for (e = k; e + 1 < shots.length && shots[e + 1].beat === b; e++);
  if (!b) continue;
  const where = k === e ? name(k) : `shots ${k + 1} to ${e + 1}`;
  if (!KINDS.includes(b)) {
    warnings.push(`${where}: no such beat "${b}" (${KINDS.join(', ')})`);
    continue;
  }
  if (!recipe[b]) continue;
  const run = shots.slice(k, e + 1);
  const { use, in: join } = table[b];
  if (!run.some((x) => use.includes(shotRef(x)))) {
    warnings.push(`${where}, the ${b}: ${pack.name} carries ${an(b)} with ${use.join(', else ')}, and this uses ${[...new Set(run.map(shotRef))].join(' and ')}`);
    continue;
  }
  run.forEach((x, i) => {
    if (k + i === 0) return;
    const j = x.in ?? 'cut';
    const carries = use.includes(shotRef(x));
    if (carries && join && join !== 'cut') {
      joined[b] ??= { cut: [], on: 0 };
      if (j === 'cut') joined[b].cut.push(k + i);
      else if (j === join) joined[b].on++;
    }
    if (j === 'cut' || (carries && j === join)) return;
    warnings.push(carries
      ? `${name(k + i)}, the ${b}: comes in on ${an(j)}; ${pack.name} ${join && join !== 'cut' ? `joins into ${an(b)} with ${an(join)}, or cuts` : `cuts into ${an(b)}`}`
      : `${name(k + i)}, in the ${b}: comes in on ${an(j)}; inside a beat ${pack.name} cuts, the way back to the presenter included`);
  });
}
for (const [b, { cut, on }] of Object.entries(joined)) {
  if (on || !cut.length) continue;
  const into = `${pack.name} joins into ${BEAT_KINDS[b].recurs ? `the first ${b} and the one that matters most` : `the ${b}`} with ${an(table[b].in)}`;
  warnings.push(cut.length > 1 ? `${cut.length === 2 ? 'both' : `all ${cut.length}`} ${b}s cut in: ${into}` : `${name(cut[0])}, the ${b}, cuts in: ${into}`);
}

// ── Joins: a style's own join is punctuation, not the way every shot comes in ──
for (const { join, count, budget, run } of joinRuns(shots, joinBudget(table))) {
  warnings.push(count > budget
    ? `the ${join} join comes in ${count} times: ${pack.name} keeps it to ${budget} a video (the beats its table gives it, and where a beat comes round again, only the first and the one that matters most), so cut the rest`
    : `the ${join} join comes in on ${run} shots in a row: on every change it stops meaning anything, so cut some`);
}

// ── The opening ──
if (shots.length) {
  const open = layoutOf(shots[0]);
  const allowed = pack.presenter.openOn;
  if (!open) warnings.push(`the video opens on a graphic; ${pack.name} opens on the presenter (${allowed.join(' or ')})`);
  else if (!allowed.includes(open)) errors.push(`the video opens on the ${open} layout; ${pack.name} opens on ${allowed.join(' or ')}`);
}

// ── Pace ──
const [lo, hi] = pack.pace.short.secondsPerChange;
const changes = new Set(starts);
shots.forEach((shot, i) => {
  // what changes inside a shot: a punch-in, a word-pop group, a slam landing, a sticker slapped on
  for (const p of shot.props?.punches ?? []) changes.add(starts[i] + p);
  for (const g of shot.scene === 'word-pop' ? (shot.props?.groups ?? []) : []) changes.add(starts[i] + g.from);
  for (const x of shot.scene === 'sticker' ? (shot.props?.stickers ?? []) : []) changes.add(starts[i] + x.at);
  if (shot.scene === 'slam') changes.add(starts[i] + (shot.props?.at ?? 10));
  if (shot.frames < lo * FPS * 0.5 && i < shots.length - 1) warnings.push(`${name(i)} lasts ${s(shot.frames)}: short for ${pack.name}, which changes every ${range([lo, hi], ' s')}`);
});
const points = [...changes].filter((f) => f < end).sort((a, b) => a - b);
points.forEach((f, j) => {
  const next = points[j + 1] ?? end;
  if (next - f > hi * FPS * 1.25) warnings.push(`frames ${f} to ${next} (${s(next - f)}) hold without a change; ${pack.name} changes every ${range([lo, hi], ' s')} (a new shot, a punch-in, a word-pop group, a slam or a sticker landing)`);
});

// ── Punch-ins ──
const rule = pack.pace.short.punchIns;
shots.forEach((shot, i) => {
  if (shot.scene !== 'talk' || shot.props?.layout !== 'full') return;
  const punches = shot.props?.punches ?? [];
  const inside = captions.filter((c) => c.from >= starts[i] + 3 && c.from < starts[i] + shot.frames);
  if (rule === 'every-line' && punches.length < inside.length) warnings.push(`${name(i)}: ${pack.name} punches in on every line, and this shot has ${inside.length} new caption lines and ${punches.length} punches`);
  if (rule === 'payoffs' && punches.length > 1) warnings.push(`${name(i)}: ${punches.length} punches; ${pack.name} punches in only on payoffs, one at most per shot`);
  if (rule === 'stressed-words') {
    for (const p of punches) {
      const c = captions.find((x) => starts[i] + p >= x.from && starts[i] + p < x.to);
      if (!c || !c.text.includes('*')) warnings.push(`${name(i)}: the punch at frame ${p} lands on a line with no key word; ${pack.name} punches in on stressed words`);
    }
  }
});

// ── Captions ──
const [wlo, whi] = pack.subtitles.words;
const hidden = (f) => {
  let i = 0;
  while (i + 1 < starts.length && starts[i + 1] <= f) i++;
  return shots[i] && SCENES[shots[i].scene]?.lane === 'none';
};
const off = captions.filter((c) => !hidden(c.from) && (words(c.text).length < wlo || words(c.text).length > whi));
if (off.length) warnings.push(`${off.length} caption line${off.length > 1 ? 's' : ''} outside ${pack.name}'s ${range([wlo, whi])} words: ${off.slice(0, 4).map((c) => `"${c.text}"`).join(', ')}${off.length > 4 ? ', ...' : ''}`);
captions.forEach((c, j) => {
  if ((c.text.match(/\*[^*]+\*/g) ?? []).length > 1) warnings.push(`caption "${c.text}": more than one key word`);
  if (captions[j + 1] && captions[j + 1].from < c.to) warnings.push(`captions "${c.text}" and "${captions[j + 1].text}" overlap`);
});
shots.forEach((shot, i) => {
  for (const x of shot.scene === 'sticker' ? (shot.props?.stickers ?? []) : []) {
    if (x.at >= shot.frames) warnings.push(`${name(i)}: the sticker "${x.text}" lands at ${x.at}, after the shot ends (${shot.frames})`);
  }
  if (shot.scene === 'sticker' && (shot.props?.stickers?.length ?? 0) > 3) warnings.push(`${name(i)}: ${shot.props.stickers.length} stickers; the scene shows three at most`);
  if (shot.scene === 'slam' && (shot.props?.at ?? 10) >= shot.frames) warnings.push(`${name(i)}: the value lands at ${shot.props?.at ?? 10}, after the shot ends (${shot.frames})`);
  for (const g of shot.scene === 'word-pop' ? (shot.props?.groups ?? []) : []) {
    if (g.words.length > whi) warnings.push(`${name(i)}: a word-pop group of ${g.words.length} words ("${g.words.map((w) => w.text).join(' ')}"); ${pack.name}'s captions run ${range([wlo, whi])}`);
    if (g.to > shot.frames) warnings.push(`${name(i)}: a word-pop group runs past the shot (to ${g.to}, the shot is ${shot.frames})`);
  }
});
if (captions.length) {
  const spoken = captions.reduce((a, c) => a + words(c.text).length, 0);
  const span = captions[captions.length - 1].to - captions[0].from;
  const wpm = Math.round(spoken / (span / FPS / 60));
  const [slo, shi] = pack.pace.wordsPerMinute;
  if (span > 0 && (wpm < slo * 0.75 || wpm > shi * 1.25)) warnings.push(`the captions run at ${wpm} words a minute and ${pack.name}'s presenter speaks at ${range([slo, shi])}: check the timings against the transcript`);
  const hold = end - captions[captions.length - 1].to;
  if (hold > pack.pace.endHoldMax * FPS) warnings.push(`the video holds ${s(hold)} after the last caption; ${pack.name} ends within ${pack.pace.endHoldMax} s`);
}

// ── Report ──
console.log(`${path.basename(planPath)}: ${pack.name}, hero ${plan.hero ?? `${rotation[0]} (default)`}, ${shots.length} shots, ${end} frames (${s(end)}), ${captions.length} captions`);
for (const e of errors) console.log(`ERROR  ${e}`);
for (const w of warnings) console.log(`WARN   ${w}`);
console.log(errors.length ? `${errors.length} error${errors.length > 1 ? 's' : ''}: fix before rendering` : `no errors${warnings.length ? `, ${warnings.length} warning${warnings.length > 1 ? 's' : ''}` : ', no warnings'}`);
process.exit(errors.length ? 1 : 0);
