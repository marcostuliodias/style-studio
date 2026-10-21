import React from 'react';
import type { Shoot } from '../kit/Presenter';
import { Chart } from '../pack-scenes/Chart';
import { Command } from '../pack-scenes/Command';
import { Doodle } from '../pack-scenes/Doodle';
import { Float } from '../pack-scenes/Float';
import { Slam } from '../pack-scenes/Slam';
import { Sticker } from '../pack-scenes/Sticker';
import { WordPop, type PopGroup } from '../pack-scenes/WordPop';
import { ListItem } from '../scenes/ListItem';
import { QuoteCard } from '../scenes/QuoteCard';
import { StatCompare } from '../scenes/StatCompare';
import { TitleStack } from '../scenes/TitleStack';
import demoShoot from './demo-shoot.json';

// The review board: the same scenes with the same words in whichever pack the render asks for (input prop `pack`).
// Nothing here names a colour, a face or a position: it all comes through the pack.

/**
 * Demo footage, never in the repo (public/footage is gitignored): a landscape plate, nothing else. Put any
 * talking-head shoot here and measure its face (px in the footage) to match, in demo-shoot.json (the editing skills'
 * example plans use it too).
 */
const handedShoot = typeof window === 'undefined' ? undefined : (window as unknown as { __STYLE_SHOOT__?: { shoot: Shoot; at: number } }).__STYLE_SHOOT__;
/** The footage the board shows: the web app's preview can hand over someone's own (with the frame to start on). */
export const DEMO: Shoot = handedShoot?.shoot ?? demoShoot;
const AT = handedShoot?.at ?? 820;

export const BoardTitle: React.FC = () => (
  <TitleStack
    lead="Claude Code just got"
    lines={[[{ t: 'Mods' }], [{ t: '5', hero: true }, { t: 'to install now' }]]}
    sizes={[260, 110]}
    sub={{ text: 'five mods that feel', key: 'illegal' }}
    shoot={DEMO}
    at={AT}
  />
);

export const BoardList: React.FC = () => (
  <ListItem
    index={1}
    of={5}
    kind="Mod"
    name="Token Ledger"
    line="Every turn's cost, live, in the status line."
    facts={[{ k: 'Context used', v: '41%' }, { k: 'Tokens saved', v: '128k', win: true }, { k: 'Turns', v: '17' }]}
    icon="gauge"
    sub={{ text: 'it never forgets', key: 'anything' }}
  />
);

export const BoardStat: React.FC = () => (
  <StatCompare
    lead="What it costs you"
    title="Per month"
    text="Same tools and the same team. The bill went from a line on every invoice to nothing at all."
    before={{ k: 'Before', v: '$240' }}
    after={{ k: 'After', v: '$0' }}
    icon="coin"
    sub={{ text: 'you pay', key: 'nothing' }}
  />
);

export const BoardQuote: React.FC = () => (
  <QuoteCard lines={['Invoicing took my', 'whole Friday. Now', 'it runs overnight.']} name="Client name" role="Founder · Their company" />
);

const POP: PopGroup[] = [
  { from: 0, to: 22, words: [{ text: 'this', at: 0 }, { text: 'mod', at: 7 }] },
  { from: 22, to: 46, words: [{ text: 'is', at: 22 }, { text: 'basically', at: 28 }] },
  { from: 46, to: 96, words: [{ text: 'cheating', at: 46, key: true }] },
];

export const BoardWordPop: React.FC = () => <WordPop shoot={DEMO} at={AT - 20} groups={POP} />;

// The scene types packs bring, each with the board's words; a pack that doesn't bring one refuses to render it.

export const BoardSlam: React.FC = () => <Slam value="$0" was="$240" label="per month" at={12} />;

export const BoardChart: React.FC = () => (
  <Chart lead="What it costs you" title="Per month" bars={[{ k: 'Before', v: 240, label: '$240' }, { k: 'After', v: 0, label: '$0', win: true }]} source="Source: my invoices, January to June" />
);

export const BoardDoodle: React.FC = () => <Doodle shoot={DEMO} at={AT} note="basically *cheating*" from={6} />;

export const BoardCommand: React.FC = () => (
  <Command command="claude mods add token-ledger" output={[{ t: '✓ installed token-ledger 1.4' }, { t: '✓ status line patched' }, { t: 'tokens saved: 128k', win: true }]} shoot={DEMO} at={AT} />
);

export const BoardFloat: React.FC = () => <Float shoot={DEMO} at={AT} lead="What it costs you" title="Per month" value="$0" was="$240" icon="coin" />;

export const BoardSticker: React.FC = () => (
  <Sticker shoot={DEMO} at={AT} stickers={[{ text: '$240', at: 6, strike: true, icon: 'coin' }, { text: '$0', at: 30, kind: 'burst' }, { text: 'every month', at: 46 }]} />
);
