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
    lead="O Claude Code ganhou"
    lines={[[{ t: 'Mods' }], [{ t: '5', hero: true }, { t: 'para instalar agora' }]]}
    sizes={[260, 110]}
    sub={{ text: 'cinco mods que parecem', key: 'trapaça' }}
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
    line="O custo de cada turno, ao vivo, na barra de status."
    facts={[{ k: 'Contexto usado', v: '41%' }, { k: 'Tokens poupados', v: '128k', win: true }, { k: 'Turnos', v: '17' }]}
    icon="gauge"
    sub={{ text: 'ele nunca esquece', key: 'nada' }}
  />
);

export const BoardStat: React.FC = () => (
  <StatCompare
    lead="O que te custa"
    title="Por mês"
    text="Mesmas ferramentas e o mesmo time. A conta foi de uma linha em toda fatura para nada."
    before={{ k: 'Antes', v: '$240' }}
    after={{ k: 'Depois', v: '$0' }}
    icon="coin"
    sub={{ text: 'você paga', key: 'nada' }}
  />
);

export const BoardQuote: React.FC = () => (
  <QuoteCard lines={['Faturar tomava minha', 'sexta inteira. Agora', 'roda de madrugada.']} name="Nome do cliente" role="Fundador · A empresa dele" />
);

const POP: PopGroup[] = [
  { from: 0, to: 22, words: [{ text: 'esse', at: 0 }, { text: 'mod', at: 7 }] },
  { from: 22, to: 46, words: [{ text: 'é', at: 22 }, { text: 'basicamente', at: 28 }] },
  { from: 46, to: 96, words: [{ text: 'trapaça', at: 46, key: true }] },
];

export const BoardWordPop: React.FC = () => <WordPop shoot={DEMO} at={AT - 20} groups={POP} />;

// The scene types packs bring, each with the board's words; a pack that doesn't bring one refuses to render it.

export const BoardSlam: React.FC = () => <Slam value="$0" was="$240" label="por mês" at={12} />;

export const BoardChart: React.FC = () => (
  <Chart lead="O que te custa" title="Por mês" bars={[{ k: 'Antes', v: 240, label: '$240' }, { k: 'Depois', v: 0, label: '$0', win: true }]} source="Fonte: minhas faturas, de janeiro a junho" />
);

export const BoardDoodle: React.FC = () => <Doodle shoot={DEMO} at={AT} note="basicamente *trapaça*" from={6} />;

export const BoardCommand: React.FC = () => (
  <Command command="claude mods add token-ledger" output={[{ t: '✓ token-ledger 1.4 instalado' }, { t: '✓ barra de status ajustada' }, { t: 'tokens poupados: 128k', win: true }]} shoot={DEMO} at={AT} />
);

export const BoardFloat: React.FC = () => <Float shoot={DEMO} at={AT} lead="O que te custa" title="Por mês" value="$0" was="$240" icon="coin" />;

export const BoardSticker: React.FC = () => (
  <Sticker shoot={DEMO} at={AT} stickers={[{ text: '$240', at: 6, strike: true, icon: 'coin' }, { text: '$0', at: 30, kind: 'burst' }, { text: 'todo mês', at: 46 }]} />
);
