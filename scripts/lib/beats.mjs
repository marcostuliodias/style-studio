// A style's beats table: the kinds of beat a talking-head video is made of, and the scene (and join) a pack carries
// each with. make-skill writes it into the skill and builds the example plan from it; check-plan holds a plan to it,
// so the two never disagree. Pure functions of a pack and the scene catalogue (src/reel/scenes.json).

export const LAYOUTS = ['full', 'halfBand', 'tile'];
export const JOINS = ['cut', 'ease', 'zoom', 'flash', 'wipe', 'blur', 'glitch', 'whip'];
/** Joins that soften a change, a style's own before the shared ease; the rest are hits. */
export const SOFT = ['wipe', 'blur', 'ease'];
/** Joins that hit: a style with any of them on is loud between its shots. */
export const HITS = ['zoom', 'flash', 'glitch', 'whip'];

/** A join's settings in the pack (the newer joins are optional: left out, off). */
export const joinSpec = (pack, j) => {
  const T = pack.transitions;
  if (j === 'cut') return { enabled: T.cut, frames: 0 };
  if (j === 'zoom') return T.zoomThrough;
  return T[j] ?? { enabled: false, frames: 0 };
};

/** What a pack can put in a plan: the scenes it brings, its layouts, the joins it has on and the scenes it can render. */
export const packCan = (pack, SCENES) => {
  const own = pack.scenes.brings.filter((id) => SCENES[id]);
  const layouts = LAYOUTS.filter((l) => pack.presenter.layouts[l]);
  const joinsOn = Object.fromEntries(JOINS.map((j) => [j, !!joinSpec(pack, j).enabled]));
  const scenes = Object.keys(SCENES).filter((id) => {
    if (pack.scenes.avoid.includes(id)) return false;
    if (SCENES[id].kind === 'pack') return own.includes(id) && (!SCENES[id].needsShoot || layouts.includes(SCENES[id].presenter));
    return id !== 'talk' || layouts.length > 0;
  });
  return { own, layouts, joinsOn, scenes };
};

/** A scene ref ("list", "talk:tile") as its scene and, for talk, its layout (full frame when it names none, as the skill writes it). */
export const refOf = (ref) => {
  const [scene, layout] = ref.split(':');
  return { scene, layout: scene === 'talk' ? (layout || 'full') : null };
};
/** A plan's shot as a ref. */
export const shotRef = (shot) => (shot.scene === 'talk' ? `talk:${shot.props?.layout ?? 'full'}` : shot.scene);

/** The presenter layout a ref shows, or null for a graphic. */
export const shows = (SCENES, ref) => {
  const { scene, layout } = refOf(ref);
  const p = SCENES[scene]?.presenter;
  return p === 'layout' ? layout : (p ?? null);
};

/**
 * The kinds of beat (pack `scenes.beats`), what each is in a transcript, what carries it when a pack names nothing
 * (shared scenes, and the scenes a pack may bring that suit it), the hits a pack that names nothing comes in on, and
 * whether it comes round again in a video (a list's items, a second number, the points between).
 */
export const BEAT_KINDS = {
  hook: { name: 'Hook', what: 'the first line: what the video promises', fallback: ['title', 'talk:halfBand', 'talk:full'] },
  payoff: { name: 'Payoff', what: 'the line that pays the hook off: the reveal, the verdict, the twist', fallback: ['word-pop', 'doodle', 'talk:full'] },
  item: { name: 'Item', what: 'one thing in a list (a tool, a step, a mistake) with a name and a few facts', fallback: ['command', 'list'], joins: ['zoom', 'whip', 'glitch'], recurs: true },
  number: { name: 'Number', what: 'a figure that changed or that matters: a cost, a time, a count', fallback: ['slam', 'chart', 'float', 'sticker', 'stat'], joins: ['flash', 'zoom'], recurs: true },
  point: { name: 'Point', what: 'a claim or a bridge in the presenter\'s own words', fallback: ['talk:full'], recurs: true },
  proof: { name: 'Proof', what: 'someone else\'s words: a customer, a review, a source', fallback: ['quote', 'print'], joins: ['zoom', 'whip', 'glitch'] },
  end: { name: 'End', what: 'the last line: the follow, the next video, the takeaway', fallback: ['talk:full'] },
};

/**
 * How the style carries each kind of beat: `use`, the scenes in the order to try them, and `in`, the join into the
 * beat (null for the hook, which opens the video).
 *
 * `use`: a scene the pack brings that its recipe never names (one the creator just turned on in the Studio) comes first
 * wherever it suits, so it shows; then the pack's own picks, then the shared scenes, keeping only what this pack can
 * render. A hook keeps only what the style opens on.
 *
 * `in`: a beat the recipe names comes in on the recipe's join if the pack has it on, else on a cut. A beat it doesn't
 * name comes in on a hit if the kind takes one and the pack has it on; in a quiet style, a graphic comes in on its
 * soft join; anything else on a cut.
 */
export const beatsOf = (pack, SCENES) => {
  const { scenes, layouts, joinsOn } = packCan(pack, SCENES);
  const asked = pack.scenes.beats ?? {};
  const named = new Set(Object.values(asked).flatMap((b) => b.use ?? []).map((r) => refOf(r).scene));
  const unnamed = pack.scenes.brings.filter((id) => SCENES[id]?.kind === 'pack' && !named.has(id));
  const can = (ref) => {
    const { scene, layout } = refOf(ref);
    return scenes.includes(scene) && (!layout || layouts.includes(layout));
  };
  const loud = HITS.some((j) => joinsOn[j]);
  const soft = SOFT.find((j) => joinsOn[j]);
  return Object.fromEntries(Object.entries(BEAT_KINDS).map(([kind, k]) => {
    const fresh = k.fallback.filter((x) => unnamed.includes(x));
    let use = [...fresh, ...(asked[kind]?.use ?? []), ...k.fallback].filter((x, i, a) => a.indexOf(x) === i && can(x));
    if (kind === 'hook') use = use.filter((x) => pack.presenter.openOn.includes(shows(SCENES, x)));
    if (!use.length) use = [kind === 'hook' ? `talk:${pack.presenter.openOn[0]}` : `talk:${layouts.includes('full') ? 'full' : layouts[0]}`];
    let join = null;
    if (kind !== 'hook' && asked[kind]) join = asked[kind].in && joinsOn[asked[kind].in] ? asked[kind].in : 'cut';
    else if (kind !== 'hook') join = (k.joins ?? []).find((j) => joinsOn[j]) ?? (!loud && soft && !shows(SCENES, use[0]) ? soft : 'cut');
    return [kind, { use, in: join }];
  }));
};

/**
 * How many times each join may come in in one video: once into each beat the table gives it, and twice into a beat
 * that comes round again (the first and the one that matters most; the rest cut). Never under three, which is also
 * what a join no beat names gets, for the change that needs it.
 */
export const joinBudget = (table) => {
  const n = {};
  for (const [kind, b] of Object.entries(table)) if (b.in && b.in !== 'cut') n[b.in] = (n[b.in] ?? 0) + (BEAT_KINDS[kind].recurs ? 2 : 1);
  return Object.fromEntries(JOINS.filter((j) => j !== 'cut').map((j) => [j, Math.max(3, n[j] ?? 0)]));
};

/**
 * Where a plan leans on one join of its own: the non-cut joins that come in more times than the style's budget for
 * them, or on three shots in a row. A style's own join is punctuation; on every change it becomes the template.
 */
export const joinRuns = (shots, budget) => {
  const joins = shots.slice(1).map((s) => s.in ?? 'cut');
  const out = [];
  for (const j of new Set(joins)) {
    if (j === 'cut') continue;
    const n = joins.filter((x) => x === j).length;
    let run = 0;
    let longest = 0;
    for (const x of joins) longest = Math.max(longest, (run = x === j ? run + 1 : 0));
    if (n > budget[j] || longest >= 3) out.push({ join: j, count: n, budget: budget[j], run: longest });
  }
  return out;
};
