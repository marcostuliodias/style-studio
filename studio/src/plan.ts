import type { StylePack } from '../../src/engine/pack';
import demoShoot from '../../src/board/demo-shoot.json';
import type { Shoot } from '../../src/kit/Presenter';
import type { ReelPlan, Shot } from '../../src/reel/plan';
import glass from '../../skills/glass/example-plan.json';
import ledger from '../../skills/ledger/example-plan.json';
import pop from '../../skills/pop/example-plan.json';
import sketch from '../../skills/sketch/example-plan.json';
import terminal from '../../skills/terminal/example-plan.json';
import volt from '../../skills/volt/example-plan.json';
import { clone } from './packs';

// The example reel the Studio plays: until the skill generator runs for the draft (the server, phase 2), it's the base
// style's shipped example plan, fitted to the draft: on the demo footage here, in the draft's pack, and without any
// scene or join the draft turned off.

const EXAMPLES: Record<string, ReelPlan> = {
  volt: volt as unknown as ReelPlan,
  ledger: ledger as unknown as ReelPlan,
  sketch: sketch as unknown as ReelPlan,
  terminal: terminal as unknown as ReelPlan,
  glass: glass as unknown as ReelPlan,
  pop: pop as unknown as ReelPlan,
};

const PACK_SCENES = ['word-pop', 'slam', 'chart', 'doodle', 'command', 'float', 'sticker'];

const joinOn = (join: string, pack: StylePack) => {
  const T = pack.transitions as unknown as Record<string, { enabled?: boolean } | boolean | undefined>;
  if (join === 'cut') return true;
  const spec = T[join === 'zoom' ? 'zoomThrough' : join];
  return typeof spec === 'object' && !!spec?.enabled;
};

/**
 * The example reel fitted to the draft: the generator's plan for it when the server has written one, else the base
 * style's shipped plan; on the creator's footage when they gave one (from the frame they marked), else the demo's;
 * and without any scene or join the draft turned off.
 */
export const examplePlanFor = (base: string, pack: StylePack, source?: ReelPlan | null, footage?: { shoot: Shoot; at: number } | null): ReelPlan => {
  const plan = clone(source ?? EXAMPLES[base] ?? EXAMPLES.volt);
  plan.pack = pack.id;
  plan.hero = pack.palette.heroRotation[0] ?? 'win';
  plan.title = `${pack.name} example`;
  plan.shoot = clone(footage?.shoot ?? demoShoot);
  plan.from = footage?.at ?? 0;
  plan.shots = plan.shots.map((s): Shot => {
    const shot = { ...s };
    if (PACK_SCENES.includes(shot.scene) && !pack.scenes.brings.includes(shot.scene)) {
      shot.scene = 'talk';
      shot.props = { layout: pack.presenter.layouts.full ? 'full' : 'halfBand' };
    }
    if (shot.scene === 'talk') {
      const layout = (shot.props?.layout as keyof StylePack['presenter']['layouts']) ?? 'full';
      if (!pack.presenter.layouts[layout]) shot.props = { ...shot.props, layout: (['full', 'halfBand', 'tile'] as const).find((l) => pack.presenter.layouts[l]) ?? 'full' };
    }
    if (shot.in && !joinOn(shot.in, pack)) delete shot.in;
    return shot;
  });
  // captions over a word-pop shot would double its words; the plan's already leave them out, and a replaced word-pop
  // shot gets none either, which is fine for an example
  return plan;
};

export const planFrames = (plan: ReelPlan) => plan.shots.reduce((a, s) => a + s.frames, 0);
export const shotStarts = (plan: ReelPlan) => plan.shots.reduce<number[]>((a, s, i) => [...a, i ? a[i - 1] + plan.shots[i - 1].frames : 0], []);
