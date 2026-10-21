import React from 'react';
import { Composition, registerRoot } from 'remotion';
import '../engine/fonts';
import '../pack-scenes';
import { BoardChart, BoardCommand, BoardDoodle, BoardFloat, BoardList, BoardQuote, BoardSlam, BoardStat, BoardSticker, BoardTitle, BoardWordPop } from './Board';

// The review board's compositions. Pick the pack with the input prop `pack` ("volt" | "ledger") and the hero colour
// with `hero`, e.g. npx remotion still src/board/entry.tsx Board-Title out/title.png --frame=60 --props='{"pack":"ledger"}'
const SCENES = { Title: BoardTitle, List: BoardList, Stat: BoardStat, Quote: BoardQuote, WordPop: BoardWordPop, Slam: BoardSlam, Chart: BoardChart, Doodle: BoardDoodle, Command: BoardCommand, Float: BoardFloat, Sticker: BoardSticker };

const Root: React.FC = () => (
  <>
    {Object.entries(SCENES).map(([name, component]) => (
      <Composition key={name} id={`Board-${name}`} component={component} width={1080} height={1920} fps={30} durationInFrames={96} />
    ))}
  </>
);

registerRoot(Root);
