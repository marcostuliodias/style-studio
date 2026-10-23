import { Player, Thumbnail, type PlayerRef } from '@remotion/player';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
// The engine. Order matters: fonts first (they delay the render until the pack's faces are in), then the pack scenes'
// registry, which checks the pack brings only scene types the engine knows.
import '../../src/engine/fonts';
import '../../src/pack-scenes';
import { PACK } from '../../src/engine/style';
import * as Board from '../../src/board/Board';
import { Reel } from '../../src/reel/Reel';
import type { ReelPlan } from '../../src/reel/plan';
import { planFrames, shotStarts } from './plan';

// What the Studio's iframe shows: the scenes (stills, or playing), one scene large, or the example reel with its shots.

type Scene = { id: string; label: string; component: React.FC };
type View = 'scenes' | 'reel';
type Tell = (msg: Record<string, unknown>) => void;

const SHARED: Scene[] = [
  { id: 'title', label: 'Título', component: Board.BoardTitle },
  { id: 'list', label: 'Item de lista', component: Board.BoardList },
  { id: 'stat', label: 'Antes e depois', component: Board.BoardStat },
  { id: 'quote', label: 'Citação', component: Board.BoardQuote },
];

const BROUGHT: Record<string, Scene> = {
  'word-pop': { id: 'word-pop', label: 'Word-pop', component: Board.BoardWordPop },
  slam: { id: 'slam', label: 'Slam', component: Board.BoardSlam },
  chart: { id: 'chart', label: 'Gráfico', component: Board.BoardChart },
  doodle: { id: 'doodle', label: 'Rabisco', component: Board.BoardDoodle },
  command: { id: 'command', label: 'Comando', component: Board.BoardCommand },
  float: { id: 'float', label: 'Flutuante', component: Board.BoardFloat },
  sticker: { id: 'sticker', label: 'Adesivo', component: Board.BoardSticker },
};

const SCENE_LABEL: Record<string, string> = { title: 'Título', talk: 'Apresentador', list: 'Item de lista', stat: 'Antes e depois', quote: 'Citação', 'word-pop': 'Word-pop', slam: 'Slam', chart: 'Gráfico', doodle: 'Rabisco', command: 'Comando', float: 'Flutuante', sticker: 'Adesivo' };

/** The generator's shot notes, in Portuguese for the strip. */
const NOTE_PT: Record<string, string> = {
  'The hook': 'O gancho',
  "The hook's payoff": 'A virada do gancho',
  'List item 1': 'Item 1 da lista',
  'The number': 'O número',
  'Bridge to the proof': 'Ponte para a prova',
  "The proof, in someone else's words": 'A prova, na voz de outro',
  'The end': 'O fim',
  'Back to the presenter, to keep the pace': 'De volta ao apresentador, para manter o ritmo',
};
const notePt = (note: string | undefined) => {
  if (!note) return '';
  if (NOTE_PT[note]) return NOTE_PT[note];
  const m = /^(.*): the set-up$/.exec(note);
  return m ? `${NOTE_PT[m[1]] ?? m[1]}: a preparação` : note;
};

const FRAMES = 96;
const STILL = 60;
const SIZE = { compositionWidth: 1080, compositionHeight: 1920, fps: 30 } as const;

const Fallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="scene-error">
    <strong>Esta cena não renderiza</strong>
    <pre>{error.message}</pre>
  </div>
);

/** A scene: a still of its landed frame, or playing on a loop. */
const Tile: React.FC<{ scene: Scene; playing: boolean }> = ({ scene, playing }) =>
  playing ? (
    <Player component={scene.component} durationInFrames={FRAMES} {...SIZE} loop autoPlay initiallyMuted controls={false} clickToPlay={false} errorFallback={Fallback} acknowledgeRemotionLicense style={{ width: '100%' }} />
  ) : (
    <Thumbnail component={scene.component} frameToDisplay={STILL} durationInFrames={FRAMES} {...SIZE} errorFallback={Fallback} style={{ width: '100%' }} />
  );

const useStudioMessages = (on: (data: Record<string, unknown>) => void) => {
  useEffect(() => {
    const h = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.data?.source !== 'style-studio') return;
      on(e.data as Record<string, unknown>);
    };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, [on]);
};

const Scenes: React.FC<{ playing: boolean; hint: string[] | 'all' | null; zoom: string | null; onZoom: (id: string | null) => void }> = ({ playing, hint, zoom, onZoom }) => {
  const scenes = useMemo(() => [...SHARED, ...PACK.scenes.brings.map((id) => BROUGHT[id]).filter(Boolean)], []);
  const hinted = (id: string) => (hint === 'all' ? true : hint ? hint.includes(id) : false);
  const big = zoom ? scenes.find((s) => s.id === zoom) : null;
  if (big) {
    return (
      <div className="zoom">
        <div className="zoom-main">
          <button type="button" className="back" onClick={() => onZoom(null)}>← Todas as cenas</button>
          <figure className={`scene big ${hinted(big.id) ? 'hinted' : hint ? 'dim' : ''}`}>
            <div className="scene-frame">
              <Tile scene={big} playing={playing} />
            </div>
            <figcaption>{big.label}</figcaption>
          </figure>
        </div>
        <div className="zoom-strip">
          {scenes.map((s) => (
            <button key={s.id} type="button" className={`strip-item ${s.id === big.id ? 'on' : ''}`} onClick={() => onZoom(s.id)} title={s.label}>
              <Thumbnail component={s.component} frameToDisplay={STILL} durationInFrames={FRAMES} {...SIZE} errorFallback={Fallback} style={{ width: '100%' }} />
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="scenes-wrap">
      <div className="scenes">
        {scenes.map((s) => (
          <figure key={s.id} className={`scene ${hinted(s.id) ? 'hinted' : hint ? 'dim' : ''}`} onClick={() => onZoom(s.id)}>
            <div className="scene-frame">
              <Tile scene={s} playing={playing} />
            </div>
            <figcaption>
              {s.label}
              {BROUGHT[s.id] && <span className="own">do estilo</span>}
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="scenes-note">Clique numa cena para vê-la grande. Passe o mouse numa escolha à esquerda para ver o que ela muda.</p>
    </div>
  );
};

const mmss = (f: number) => {
  const s = Math.floor(f / 30);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const ReelView: React.FC<{ plan: ReelPlan; playing: boolean }> = ({ plan, playing }) => {
  const ref = useRef<PlayerRef>(null);
  const [frame, setFrame] = useState(0);
  const starts = useMemo(() => shotStarts(plan), [plan]);
  const total = planFrames(plan);
  const current = starts.findIndex((s, i) => frame >= s && frame < s + plan.shots[i].frames);

  useEffect(() => {
    const p = ref.current;
    if (!p) return;
    const on = (e: { detail: { frame: number } }) => setFrame(e.detail.frame);
    p.addEventListener('frameupdate', on);
    return () => p.removeEventListener('frameupdate', on);
  }, []);
  useEffect(() => {
    if (playing) ref.current?.play();
    else ref.current?.pause();
  }, [playing]);

  return (
    <div className="reel">
      <div className="reel-player">
        <Player ref={ref} component={Reel} inputProps={plan} durationInFrames={total} {...SIZE} autoPlay={playing} initiallyMuted={false} controls errorFallback={Fallback} acknowledgeRemotionLicense style={{ width: '100%' }} />
      </div>
      <div className="reel-shots">
        <div className="reel-head">
          <strong>Plano a plano</strong>
          <span className="muted">
            {plan.shots.length} planos · {(total / 30).toFixed(1)} s · clique num para tocar a partir dele
          </span>
        </div>
        <div className="shots">
          {plan.shots.map((s, i) => (
            <button
              key={i}
              type="button"
              className={`shot ${i === current ? 'on' : ''}`}
              onClick={() => {
                ref.current?.seekTo(starts[i]);
                ref.current?.play();
              }}
            >
              <div className="shot-frame">
                <Thumbnail component={Reel} inputProps={plan} frameToDisplay={starts[i] + Math.min(12, s.frames - 1)} durationInFrames={total} {...SIZE} errorFallback={Fallback} style={{ width: '100%' }} />
              </div>
              <div className="shot-text">
                <span className="shot-note">
                  <em>{i + 1}</em> {notePt(s.note) || SCENE_LABEL[s.scene] || s.scene}
                </span>
                <span className="muted">
                  {mmss(starts[i])} · {SCENE_LABEL[s.scene] ?? s.scene}
                  {s.in ? ` · ${s.in}` : ''}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const Preview: React.FC<{ initial: { playing: boolean; view: View; plan: ReelPlan | null } }> = ({ initial }) => {
  const [playing, setPlaying] = useState(initial.playing);
  const [view, setView] = useState<View>(initial.view);
  const [zoom, setZoom] = useState<string | null>(null);
  const [hint, setHint] = useState<string[] | 'all' | null>(null);
  const [plan, setPlan] = useState<ReelPlan | null>(initial.plan);
  useStudioMessages(
    React.useCallback((d) => {
      if (d.type === 'play') setPlaying(!!d.on);
      if (d.type === 'plan' && d.plan) setPlan(d.plan as ReelPlan);
      if (d.type === 'view') {
        setView(d.view === 'reel' ? 'reel' : 'scenes');
        setZoom(null);
      }
      if (d.type === 'hint') setHint((d.scenes as string[] | 'all' | null) ?? null);
    }, []),
  );
  if (view === 'reel') {
    if (!plan) return <div className="preview-error"><strong>Sem plano de exemplo</strong><pre>O Studio não conseguiu montar o reel de exemplo deste estilo.</pre></div>;
    return <ReelView plan={plan} playing={playing} />;
  }
  return <Scenes playing={playing} hint={hint} zoom={zoom} onZoom={setZoom} />;
};

/** The preview, in the pack the page was handed. */
export const mount = (root: HTMLElement, opts: { playing: boolean; view: View; plan: ReelPlan | null; tell: Tell }) => {
  document.documentElement.style.setProperty('--accent', PACK.palette.win);
  createRoot(root).render(<Preview initial={opts} />);
};

/** Three stills (the title, a list item, a before/after) side by side, for a gallery card. */
export const mountCard = (root: HTMLElement) => {
  document.documentElement.classList.add('card-page');
  createRoot(root).render(
    <div className="card-stills">
      {[Board.BoardTitle, Board.BoardList, Board.BoardStat].map((C, i) => (
        <div key={i} className="card-still">
          <Thumbnail component={C} frameToDisplay={STILL} durationInFrames={FRAMES} {...SIZE} style={{ width: '100%' }} errorFallback={Fallback} />
        </div>
      ))}
    </div>,
  );
};
