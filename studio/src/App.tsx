import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { StylePack } from '../../src/engine/pack';
import type { Shoot } from '../../src/kit/Presenter';
import type { ReelPlan } from '../../src/reel/plan';
import { claudePrompt, makeSkill, measureTone, pollRender, serverInfo, skillZip, startRender, uploadFootage, type Footage, type RenderJob, type ServerInfo, type SkillFiles } from './api';
import { hasDraft, useDraft, useFootage, usePreviewRev } from './draft';
import { BLURB, SHIPPED, SHIPPED_IDS, slug } from './packs';
import { examplePlanFor } from './plan';
import { SECTIONS, type Affects, type Control, type Option } from './recipes';

// The Studio: a header (where the style started, its name, undo and redo, compare, the download), the panel of choices
// on the left, and the stage on the right: the scenes, the example reel (an iframe that reloads the engine with the
// pack on every change) or the skill. The skill itself comes from the engine's generator through the local API.

type PreviewState = { status: 'loading' | 'ready' | 'error'; message?: string };
type Stage = 'scenes' | 'reel' | 'skill';
/** One of the two preview iframes: the revision it holds and whether the engine in it has drawn. */
type Buffer = { rev: number | null; src: string; ready: boolean };
type Buffers = { a: Buffer; b: Buffer; front: 'a' | 'b' };

/**
 * The footage, fetched once and held as blob: URLs the preview iframes read (window.parent.__STYLE_PLATES__), so a
 * preview that reloads on every change never fetches the video again.
 */
const PLATES: Record<string, string> = {};
(window as unknown as { __STYLE_PLATES__?: Record<string, string> }).__STYLE_PLATES__ = PLATES;
const holdPlate = async (plate: string) => {
  if (!plate || PLATES[plate]) return;
  try {
    const r = await fetch(`/${plate}`);
    if (r.ok) PLATES[plate] = URL.createObjectURL(await r.blob());
  } catch {
    // the preview falls back to the file itself
  }
};
type SkillState = { files: SkillFiles | null; notes: string[]; error: string | null; loading: boolean };

/** Black or white, whichever reads on a colour. */
const onColour = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#0d0d0f';
  const n = parseInt(m[1], 16);
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return lum > 0.55 ? '#0d0d0f' : '#ffffff';
};

const saveBlob = (blob: Blob, name: string) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

/** The skill for the pack, written by the engine's generator as the pack changes. */
const useSkill = (pack: StylePack): SkillState => {
  const [state, set] = useState<SkillState>({ files: null, notes: [], error: null, loading: true });
  useEffect(() => {
    const ctl = new AbortController();
    set((s) => ({ ...s, loading: true }));
    const t = window.setTimeout(async () => {
      try {
        const r = await makeSkill(pack, ctl.signal);
        set({ files: r.files, notes: r.notes, error: null, loading: false });
      } catch (e) {
        if (ctl.signal.aborted) return;
        set((s) => ({ ...s, error: e instanceof Error ? e.message : String(e), loading: false }));
      }
    }, 300);
    return () => {
      window.clearTimeout(t);
      ctl.abort();
    };
  }, [pack]);
  return state;
};

export const App: React.FC = () => {
  const d = useDraft();
  const pack = d.draft.pack;
  const [footage, setFootage] = useFootage();
  const skill = useSkill(pack);
  const generated = useMemo<ReelPlan | null>(() => {
    try {
      return skill.files ? (JSON.parse(skill.files['example-plan.json']) as ReelPlan) : null;
    } catch {
      return null;
    }
  }, [skill.files]);
  const rev = usePreviewRev(d.draft, generated, footage);
  const [preview, setPreview] = useState<PreviewState>({ status: 'loading' });
  const [bufs, setBufs] = useState<Buffers>({ a: { rev: null, src: 'about:blank', ready: false }, b: { rev: null, src: 'about:blank', ready: false }, front: 'a' });
  const [stage, setStage] = useState<Stage>('scenes');
  const [playing, setPlaying] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [gallery, setGallery] = useState(() => !hasDraft());
  const [modal, setModal] = useState<'footage' | 'export' | null>(null);
  const [json, setJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({ type: true });
  const [server, setServer] = useState<ServerInfo | null>(null);
  const frameA = useRef<HTMLIFrameElement>(null);
  const frameB = useRef<HTMLIFrameElement>(null);
  const frameC = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    void serverInfo().then(setServer);
    void holdPlate('footage/demo/plate.mp4');
  }, []);
  useEffect(() => {
    if (footage?.shoot.plate) void holdPlate(footage.shoot.plate);
  }, [footage]);

  // A new revision loads in the back iframe while the front one stays up, dimmed; they swap once it has drawn.
  useEffect(() => {
    if (!rev) return;
    setBufs((s) => {
      const back = s.front === 'a' ? 'b' : 'a';
      return { ...s, [back]: { rev, src: `/preview.html?rev=${rev}`, ready: false } };
    });
    setPreview({ status: 'loading' });
  }, [rev]);

  // The UI wears the draft's accent colour.
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--accent', pack.palette.win);
    root.setProperty('--on-accent', onColour(pack.palette.win));
  }, [pack.palette.win]);

  // What a preview iframe says about the revision it loaded: the back one, ready, comes to the front.
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.data?.source !== 'style-preview' || e.data.card || e.data.compare) return;
      if (String(e.data.rev) !== String(rev)) return;
      if (e.data.type === 'error') return setPreview({ status: 'error', message: e.data.message });
      setBufs((s) => {
        const back = s.front === 'a' ? 'b' : 'a';
        if (s[back].rev !== rev) return s;
        return { ...s, [back]: { ...s[back], ready: true }, front: back };
      });
      setPreview({ status: 'ready' });
    };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
  }, [rev]);

  const say = useCallback((msg: Record<string, unknown>) => {
    for (const f of [frameA, frameB, frameC]) f.current?.contentWindow?.postMessage({ source: 'style-studio', ...msg }, location.origin);
  }, []);
  useEffect(() => say({ type: 'play', on: playing }), [playing, preview.status, say]);
  useEffect(() => say({ type: 'view', view: stage === 'reel' ? 'reel' : 'scenes' }), [stage, preview.status, say]);
  const hint = useCallback((scenes: Affects | null) => say({ type: 'hint', scenes }), [say]);

  // The motion section plays the scenes while it's open, so the choice shows.
  useEffect(() => {
    if (open.motion) setPlaying(true);
  }, [open.motion]);

  // The JSON editor follows the pack unless it's being edited.
  const packJson = useMemo(() => JSON.stringify(pack, null, 2), [pack]);
  useEffect(() => {
    setJson(packJson);
    setJsonError(null);
  }, [packJson]);

  const applyJson = () => {
    try {
      const next = JSON.parse(json) as StylePack;
      if (!next || typeof next !== 'object' || Array.isArray(next)) throw new Error('O pack é um objeto JSON com suas partes');
      d.replace(next);
      setJsonError(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : String(e));
    }
  };

  const rename = (name: string) =>
    d.edit((p) => {
      p.name = name;
      p.id = slug(name) || d.draft.base;
    });

  const downloadSkill = async () => {
    if (!skill.files) return;
    saveBlob(await skillZip(pack, skill.files), `${pack.id}-skill.zip`);
  };
  const downloadPack = () => saveBlob(new Blob([packJson], { type: 'application/json' }), `${pack.id || 'style'}.json`);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT') return;
      e.preventDefault();
      if (e.shiftKey) d.redo();
      else d.undo();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [d]);

  const base = SHIPPED[d.draft.base];
  // What the panel's previews draw with: the pack's ground, its type colour on it, its ink, hero and cards, and
  // the headline face, so every thumbnail shows the choice as it would land in this style.
  const panelVars = useMemo(() => {
    const g = pack.composition.ground;
    const ground = pack.grounds[g];
    const cards = pack.cards[g];
    return {
      ['--pv-ground' as string]: ground.colour,
      ['--pv-on-ground' as string]: g === 'dark' ? pack.palette.text : pack.palette.ink,
      ['--pv-soft' as string]: g === 'dark' ? pack.palette.textSoft : pack.palette.inkSoft,
      ['--pv-ink' as string]: pack.palette.ink,
      ['--pv-hero' as string]: pack.palette.win,
      ['--pv-dark' as string]: pack.grounds.dark.colour,
      ['--pv-light' as string]: pack.grounds.light.colour,
      ['--pv-card-top' as string]: cards.top,
      ['--pv-card-fill' as string]: cards.fill,
      ['--pv-card-bottom' as string]: cards.bottom,
      ['--pv-card-ring' as string]: cards.ring?.colour ?? 'transparent',
      ['--pv-card-line' as string]: cards.ring?.colour ?? pack.palette.line,
      ['--pv-display' as string]: `'Pick ${pack.type.display.family}'`,
      ['--pv-display-weight' as string]: String(pack.type.display.weight),
      ['--pv-body' as string]: `'Pick ${pack.type.body.family}'`,
      ['--pv-mesh-a' as string]: Object.values(pack.palette.extended)[0] ?? pack.palette.win,
      ['--pv-mesh-b' as string]: Object.values(pack.palette.extended)[1] ?? pack.palette.friction,
    } as React.CSSProperties;
  }, [pack]);
  const plan = useMemo(() => {
    try {
      return examplePlanFor(d.draft.base, pack, generated, footage);
    } catch {
      return null;
    }
  }, [d.draft.base, pack, generated, footage]);
  useEffect(() => {
    if (plan) say({ type: 'plan', plan });
  }, [plan, preview.status, say]);

  return (
    <div className="studio">
      <header className="top">
        <div className="brand">
          <span className="brand-mark" />
          <span>Style Studio</span>
        </div>
        <button type="button" className="base" onClick={() => setGallery(true)} title="Escolher outro ponto de partida">
          <span className="eyebrow">Começou de</span>
          <span className="base-name">
            <span className="dot" style={{ background: base.palette.win }} />
            {base.name}
            <span className="chev">⌄</span>
          </span>
        </button>
        <label className="name">
          <span className="sr-only">Nome do estilo</span>
          <input value={pack.name ?? ''} onChange={(e) => rename(e.target.value)} placeholder="Nome do estilo" />
          <code>skills/{pack.id || '…'}</code>
        </label>
        <div className="history">
          <button type="button" onClick={d.undo} disabled={!d.canUndo} title="Desfazer (⌘Z)" aria-label="Desfazer">↶</button>
          <button type="button" onClick={d.redo} disabled={!d.canRedo} title="Refazer (⇧⌘Z)" aria-label="Refazer">↷</button>
        </div>
        <p className="muted summary">{pack.description}</p>
        <button
          type="button"
          className={`compare ${comparing ? 'on' : ''}`}
          disabled={!d.changed || stage === 'skill'}
          onPointerDown={() => setComparing(true)}
          onPointerUp={() => setComparing(false)}
          onPointerLeave={() => setComparing(false)}
          onPointerCancel={() => setComparing(false)}
          title={d.changed ? `Segure para ver o ${base.name} como veio` : 'Faça uma mudança primeiro'}
        >
          Segurar para comparar
        </button>
        <button type="button" className="primary" onClick={downloadSkill} disabled={!skill.files || skill.loading} title={skill.error ?? (skill.loading ? 'O engine está escrevendo o skill…' : `Baixa ${pack.id}-skill.zip: o skill, o pack e os passos`)}>
          ⤓ Baixar skill
        </button>
      </header>

      <aside className="panel" style={panelVars} data-ground={pack.composition.ground}>
        {d.problem && <p className="note bad">O rascunho salvo não abriu ({d.problem}); o Studio começou do {base.name}.</p>}
        {SECTIONS.map((s) => (
          <section key={s.id} className={`sec ${open[s.id] ? 'open' : ''}`}>
            <h2>
              <button type="button" onClick={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))} aria-expanded={!!open[s.id]}>
                <span className="eyebrow">{s.title}</span>
                <span className="sec-summary">
                  {s.id === 'colour' && <span className="dot" style={{ background: pack.palette.win }} />}
                  {s.summary(pack)}
                </span>
                <span className="chev">{open[s.id] ? '⌃' : '⌄'}</span>
              </button>
            </h2>
            {open[s.id] && s.controls.map((c) => <ControlView key={c.key} control={c} pack={pack} edit={d.edit} hint={hint} />)}
          </section>
        ))}
        <section className="sec open advanced">
          <h2>
            <span className="eyebrow">Avançado</span>
            <span className="sec-summary">O arquivo do estilo (JSON)</span>
          </h2>
          <textarea value={json} onChange={(e) => setJson(e.target.value)} spellCheck={false} rows={14} aria-label="Pack JSON" />
          {jsonError && <p className="note bad">{jsonError}</p>}
          <div className="row">
            <button type="button" onClick={applyJson} disabled={json === packJson}>Aplicar</button>
            <button type="button" className="ghost" onClick={() => d.startFrom(d.draft.base)}>Voltar ao {base.name}</button>
            <button type="button" className="ghost" onClick={downloadPack} title="Só o pack, como JSON">Baixar pack</button>
          </div>
        </section>
      </aside>

      <main className="stage">
        <div className="stage-bar">
          <div className="tabs" role="tablist">
            {(['scenes', 'reel', 'skill'] as Stage[]).map((t) => (
              <button key={t} type="button" role="tab" aria-selected={stage === t} className={stage === t ? 'on' : ''} onClick={() => setStage(t)}>
                {t === 'scenes' ? 'Cenas' : t === 'reel' ? 'Reel de exemplo' : 'Skill'}
              </button>
            ))}
          </div>
          {stage !== 'skill' && (
            <label className="toggle">
              <input type="checkbox" checked={playing} onChange={(e) => setPlaying(e.target.checked)} />
              <span className="switch" />
              Tocar
            </label>
          )}
          {stage !== 'skill' && (server?.uploads ?? true) && (
            <button type="button" className="ghost footage-btn" onClick={() => setModal('footage')} title={footage ? `Agora: ${footage.name}` : 'O vídeo de demo do engine'}>
              <span className="dot" style={{ background: footage ? 'var(--accent)' : 'var(--faint)' }} />
              {footage ? footage.name : 'Usar meu footage'}
            </button>
          )}
          {stage === 'reel' && (server?.exports ?? true) && (
            <button type="button" onClick={() => setModal('export')} disabled={!plan} title="Renderiza o reel de exemplo em 1080x1920 com o engine">
              Exportar vídeo
            </button>
          )}
          <span className={`status ${preview.status}`}>{preview.status === 'loading' ? 'Atualizando…' : preview.status === 'ready' ? 'Pronto' : 'Erro'}</span>
        </div>
        {preview.status === 'error' && stage !== 'skill' && (
          <div className="note bad stage-error">
            <strong>Este estilo não renderiza.</strong> {preview.message}
          </div>
        )}
        <div className={`stage-body ${stage === 'skill' ? 'skill-on' : ''}`}>
          <iframe ref={frameA} className={`preview buffer ${bufs.front === 'a' ? 'front' : 'back'} ${preview.status === 'loading' ? 'updating' : ''}`} title="Prévia do estilo" src={bufs.a.src} aria-hidden={bufs.front !== 'a'} />
          <iframe ref={frameB} className={`preview buffer ${bufs.front === 'b' ? 'front' : 'back'} ${preview.status === 'loading' ? 'updating' : ''}`} title="Prévia do estilo" src={bufs.b.src} aria-hidden={bufs.front !== 'b'} />
          {d.changed && <iframe ref={frameC} className={`preview compare-frame ${comparing ? 'show' : ''}`} title={`Prévia do ${base.name}`} src={`/preview.html?compare=1&rev=${d.draft.base}-${footage ? footage.at : 'demo'}`} aria-hidden={!comparing} />}
          {comparing && <div className="compare-tag">{base.name}, como veio</div>}
          {stage === 'skill' && <SkillView pack={pack} json={packJson} skill={skill} onDownload={downloadSkill} />}
        </div>
      </main>

      {gallery && (
        <Gallery
          current={d.draft.base}
          onPick={(id) => {
            d.startFrom(id);
            setGallery(false);
          }}
          onClose={() => setGallery(false)}
        />
      )}
      {modal === 'footage' && (
        <FootageModal
          current={footage}
          onUse={(f) => {
            setFootage(f);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'export' && plan && <ExportModal pack={pack} plan={plan} onClose={() => setModal(null)} />}
    </div>
  );
};

// ── The panel's controls ───────────────────────────────────────────────────────────────────────────────────────

const Bolt: React.FC<{ variant: string }> = ({ variant }) => {
  const d = 'M13 2 4 14h7l-2 8 9-12h-7z';
  const px = '5,2 11,2 11,8 15,8 15,10 13,10 13,14 9,14 9,20 7,20 7,22 5,22 5,16 9,16 9,10 5,10 7,8 5,8';
  if (variant === 'none') return <svg viewBox="0 0 24 24" className="pv-svg"><path d="M6 12h12" stroke="currentColor" strokeWidth="2" opacity=".5" /></svg>;
  if (variant === 'pixel') return <svg viewBox="0 0 24 24" className="pv-svg" style={{ shapeRendering: 'crispEdges' }}><polygon points={px} fill="currentColor" /></svg>;
  if (variant === 'sketch')
    return (
      <svg viewBox="0 0 24 24" className="pv-svg">
        <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" transform="rotate(-3 12 12)" />
        <path d={d} fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" opacity=".6" transform="translate(.8 .6) rotate(2 12 12)" />
      </svg>
    );
  if (variant === 'sticker') return <svg viewBox="0 0 24 24" className="pv-svg pv-sticker"><path d={d} fill="var(--accent)" stroke="#fff" strokeWidth="3" strokeLinejoin="round" paintOrder="stroke" /></svg>;
  if (variant === 'duotone') return <svg viewBox="0 0 24 24" className="pv-svg"><path d={d} fill="var(--accent)" fillOpacity=".45" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
  if (variant === 'solid') return <svg viewBox="0 0 24 24" className="pv-svg"><path d={d} fill="currentColor" /></svg>;
  return <svg viewBox="0 0 24 24" className="pv-svg"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
};

const PreviewBox: React.FC<{ option: Option }> = ({ option: o }) => {
  const p = o.preview;
  if (!p) return null;
  if (p.kind === 'face') return <span className="pv pv-face" style={{ fontFamily: p.font }}>{p.sample}</span>;
  if (p.kind === 'ground') return <span className={`pv pv-ground pv-ground-${p.id}`}><span>Aa</span></span>;
  if (p.kind === 'backdrop') return <span className={`pv pv-bd pv-bd-${p.id}`} />;
  if (p.kind === 'surface') return <span className={`pv pv-surf pv-surf-${p.id}`}><i /></span>;
  if (p.kind === 'mark') return <span className="pv pv-markbox"><span className={`pv-mark pv-mark-${p.id}`}>key</span></span>;
  if (p.kind === 'icon') return <span className="pv pv-iconbox"><Bolt variant={p.id ?? 'line'} /></span>;
  if (p.kind === 'caption')
    return (
      <span className={`pv pv-capbox pv-cap-${p.id}`}>
        <span className="pv-cap">
          so <b>{p.sample}</b>
        </span>
      </span>
    );
  return null;
};

const ControlView: React.FC<{ control: Control; pack: StylePack; edit: (fn: (p: StylePack) => void) => void; hint: (a: Affects | null) => void }> = ({ control: c, pack, edit, hint }) => {
  const head = (
    <div className="ctl-head">
      <span className="ctl-title">{c.title}</span>
      <span className="ctl-hint">{c.hint}</span>
    </div>
  );
  const hover = { onPointerEnter: () => hint(c.affects), onPointerLeave: () => hint(null) };
  if (c.kind === 'pick') {
    const value = c.read(pack);
    const layout = c.layout ?? 'chips';
    return (
      <div className={`ctl ctl-${layout}`} role="radiogroup" aria-label={c.title} {...hover}>
        {head}
        <div className={layout === 'cards' ? 'cards-grid' : layout === 'segmented' ? 'segmented' : 'chips'}>
          {c.options.map((o) => (
            <button key={o.id} type="button" role="radio" aria-checked={o.id === value} className={`${layout === 'cards' ? 'pcard' : layout === 'segmented' ? 'seg' : 'chip'} ${o.id === value ? 'on' : ''}`} onClick={() => edit((p) => c.apply(p, o.id))} title={o.hint}>
              <PreviewBox option={o} />
              <span className="opt-label">{o.label}</span>
              {o.hint && layout === 'cards' && <small>{o.hint}</small>}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (c.kind === 'multi') {
    const value = c.read(pack);
    const toggle = (id: string) => edit((p) => c.apply(p, value.includes(id) ? value.filter((v) => v !== id) : [...value, id]));
    return (
      <div className="ctl ctl-cards" role="group" aria-label={c.title} {...hover}>
        {head}
        <div className="cards-grid">
          {c.options.map((o) => (
            <button key={o.id} type="button" aria-pressed={value.includes(o.id)} className={`pcard ${value.includes(o.id) ? 'on' : ''}`} onClick={() => toggle(o.id)} title={o.hint}>
              <PreviewBox option={o} />
              {value.length > 1 && value.includes(o.id) && <span className="order">{value.indexOf(o.id) + 1}</span>}
              <span className="opt-label">{o.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (c.kind === 'colour') {
    const value = c.read(pack);
    return (
      <div className="ctl" role="radiogroup" aria-label={c.title} {...hover}>
        {head}
        <div className="swatches">
          {c.options.map((o) => (
            <button key={o.id} type="button" role="radio" aria-checked={o.id === value} className={`swatch ${o.id === value ? 'on' : ''}`} style={{ background: o.swatch }} onClick={() => edit((p) => c.apply(p, o.id))} title={o.label} aria-label={o.label} />
          ))}
          <label className="swatch custom" title="Qualquer cor">
            <input type="color" value={value} onChange={(e) => edit((p) => c.apply(p, e.target.value))} aria-label="Qualquer cor" />
          </label>
        </div>
      </div>
    );
  }
  const v = c.read(pack);
  return (
    <div className="ctl" {...hover}>
      {head}
      <div className="range">
        <input type="range" min={c.min} max={c.max} step={c.step} value={v} onChange={(e) => edit((p) => c.apply(p, Number(e.target.value)))} aria-label={c.title} style={{ ['--fill' as string]: `${((v - c.min) / (c.max - c.min)) * 100}%` }} />
        <div className="range-ends">
          <span>{c.ends[0]}</span>
          <strong>{c.name(v)}</strong>
          <span>{c.ends[1]}</span>
        </div>
      </div>
    </div>
  );
};

// ── The skill ──────────────────────────────────────────────────────────────────────────────────────────────────

const SKILL_FILES = ['SKILL.md', 'references/scenes.md', 'references/plan.md', 'references/look.md', 'example-plan.json', 'pack.json'];

/** The `description` of the skill's frontmatter: what Claude Code reads to pick it. */
const skillDescription = (md: string | undefined) => {
  const m = md && /^description:\s*"?([\s\S]*?)"?\s*$/m.exec(md.split('---')[1] ?? '');
  return m ? m[1] : null;
};

const SkillView: React.FC<{ pack: StylePack; json: string; skill: SkillState; onDownload: () => void }> = ({ pack, json, skill, onDownload }) => {
  const [file, setFile] = useState('SKILL.md');
  const [copied, setCopied] = useState(false);
  const prompt = claudePrompt(pack);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  const body = file === 'pack.json' ? json : (skill.files?.[file] ?? (skill.loading ? 'O engine está escrevendo o skill…' : (skill.error ?? '')));
  return (
    <div className="skill">
      <div className="skill-card">
        <h2>Um skill de edição para o Claude Code</h2>
        <p className="muted">
          O Claude Code lê o skill para editar seus vídeos de talking-head em <strong>{pack.name}</strong>: escolhe uma cena para cada beat, cronometra os planos e as legendas, checa o plano e renderiza. O engine escreve o skill a partir das suas escolhas, então ele muda junto com você.
        </p>
        <button type="button" className="primary" onClick={onDownload} disabled={!skill.files || skill.loading}>⤓ Baixar skill</button>
        {skill.error && <p className="note bad">O skill não pôde ser escrito: {skill.error}</p>}
        <ol className="how">
          <li>
            <span><strong>Baixe o skill.</strong> Ele salva <code>{pack.id}-skill.zip</code>, em geral na pasta Downloads. Não precisa abrir.</span>
          </li>
          <li>
            <span><strong>Cole isto no Claude Code.</strong> Na primeira vez ele busca o engine em que o skill roda; depois adiciona o seu estilo e começa no seu vídeo.</span>
            <pre className="prompt">{prompt}</pre>
            <button type="button" onClick={copy}>{copied ? 'Copiado' : 'Copiar prompt'}</button>
            <span className="muted small">Prefere fazer à mão? Os passos estão em <code>INSTALL-{pack.id}.md</code> dentro do zip.</span>
          </li>
        </ol>
      </div>
      <div className="skill-card">
        <div className="file-tabs" role="tablist">
          {SKILL_FILES.map((f) => (
            <button key={f} type="button" role="tab" aria-selected={file === f} className={file === f ? 'on' : ''} onClick={() => setFile(f)}>
              {f.replace('references/', '')}
            </button>
          ))}
        </div>
        <p className="eyebrow">Como o Claude Code o encontra</p>
        <p className="muted">{skillDescription(skill.files?.['SKILL.md']) ?? (skill.loading ? '…' : pack.description)}</p>
        {skill.notes.length > 0 && <p className="muted small">{skill.notes.join(' · ')}</p>}
        <pre className="file-body">{body}</pre>
      </div>
    </div>
  );
};

// ── The creator's footage ──────────────────────────────────────────────────────────────────────────────────────

type Marks = { crown?: number; eyes?: [number, number]; chin?: number };
const STEPS: Array<{ key: keyof Marks; label: string }> = [
  { key: 'crown', label: 'o topo da cabeça' },
  { key: 'eyes', label: 'a linha dos olhos' },
  { key: 'chin', label: 'o queixo' },
];

const FootageModal: React.FC<{ current: Footage | null; onUse: (f: Footage | null) => void; onClose: () => void }> = ({ current, onUse, onClose }) => {
  const [step, setStep] = useState<'pick' | 'uploading' | 'mark' | 'measuring'>('pick');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [plate, setPlate] = useState<{ plate: string; name: string; width: number; height: number; duration: number } | null>(null);
  const [time, setTime] = useState(1);
  const [marks, setMarks] = useState<Marks>({});
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  const pick = async (file: File) => {
    if (!file.type.startsWith('video/') && !/\.(mp4|mov|webm|m4v)$/i.test(file.name)) return setError(`"${file.name}" não é um vídeo. Tente um MP4, MOV ou WebM.`);
    setError(null);
    setProgress(0);
    setStep('uploading');
    try {
      const r = await uploadFootage(file, setProgress);
      setPlate(r);
      setMarks({});
      setTime(Math.min(1, r.duration / 2));
      setStep('mark');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStep('pick');
    }
  };

  // The frame at `time`, drawn with the marks over it.
  const draw = useCallback(() => {
    const v = video.current;
    const c = canvas.current;
    if (!v || !c || !v.videoWidth) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const g = c.getContext('2d')!;
    g.drawImage(v, 0, 0);
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#ffe600';
    g.lineWidth = Math.max(2, c.width / 400);
    g.strokeStyle = accent;
    g.fillStyle = accent;
    g.font = `${Math.max(14, c.width / 50)}px system-ui, sans-serif`;
    const line = (y: number, label: string) => {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(c.width, y);
      g.stroke();
      g.fillText(label, 12, y - 8);
    };
    if (marks.crown != null) line(marks.crown, 'topo');
    if (marks.chin != null) line(marks.chin, 'queixo');
    if (marks.eyes) {
      line(marks.eyes[1], 'olhos');
      g.beginPath();
      g.moveTo(marks.eyes[0], 0);
      g.lineTo(marks.eyes[0], c.height);
      g.stroke();
    }
  }, [marks]);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.currentTime = time;
  }, [time, plate]);
  useEffect(draw, [draw, marks]);

  const next = STEPS.find((s) => marks[s.key] == null);
  const click = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvas.current!;
    const r = c.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * c.width);
    const y = Math.round(((e.clientY - r.top) / r.height) * c.height);
    if (!next) return;
    setMarks((m) => (next.key === 'eyes' ? { ...m, eyes: [x, y] } : { ...m, [next.key]: y }));
  };

  const use = async () => {
    if (!plate || marks.crown == null || !marks.eyes || marks.chin == null) return;
    setStep('measuring');
    setError(null);
    try {
      const { chest } = await measureTone(plate.plate, marks.eyes[0], marks.eyes[1], marks.chin, time);
      const shoot: Shoot = { plate: plate.plate, width: plate.width, height: plate.height, faceX: marks.eyes[0], crown: marks.crown, eyes: marks.eyes[1], chin: marks.chin, tone: { chest } };
      onUse({ shoot, at: Math.round(time * 30), name: plate.name, duration: plate.duration });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStep('mark');
    }
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal modal-footage" role="dialog" aria-label="Usar meu footage" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>Usar meu footage</h2>
            <p className="muted">Um clipe de talking-head, horizontal ou vertical. Ele fica nesta máquina, na pasta de footage do engine.</p>
          </div>
          <button type="button" className="close" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        {error && <p className="note bad">{error}</p>}
        {step === 'pick' && (
          <div
            className={`drop ${dragging ? 'over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) void pick(f);
            }}
          >
            <p>Arraste um vídeo aqui, ou</p>
            <label className="primary-label">
              <input type="file" accept="video/*,.mov,.mp4,.webm,.m4v" onChange={(e) => e.target.files?.[0] && void pick(e.target.files[0])} />
              Escolher arquivo
            </label>
            <p className="muted small">Já cortado: tomadas escolhidas, sem ar morto, um arquivo só. O Studio converte para H.264 a 30 fps.</p>
            {current && (
              <button type="button" className="ghost" onClick={() => onUse(null)}>
                Voltar ao footage de demo (agora: {current.name})
              </button>
            )}
          </div>
        )}
        {step === 'uploading' && (
          <div className="progress-box">
            <p>Enviando e convertendo…</p>
            <div className="bar"><span style={{ width: `${Math.round(progress * 100)}%` }} /></div>
            <p className="muted small">{progress < 1 ? `${Math.round(progress * 100)}%` : 'Convertendo com o ffmpeg…'}</p>
          </div>
        )}
        {(step === 'mark' || step === 'measuring') && plate && (
          <div className="mark">
            <div className="mark-frame">
              <video ref={video} src={`/${plate.plate}`} muted preload="auto" onSeeked={draw} onLoadedData={draw} style={{ display: 'none' }} />
              <canvas ref={canvas} onClick={click} className={next ? 'marking' : ''} />
            </div>
            <div className="mark-side">
              <p className="eyebrow">Escolha um frame</p>
              <input type="range" min={0} max={Math.max(0.1, plate.duration - 0.1)} step={0.1} value={time} onChange={(e) => { setTime(Number(e.target.value)); setMarks({}); }} aria-label="Frame" />
              <p className="muted small">{time.toFixed(1)} s de {plate.duration.toFixed(1)} s. O reel de exemplo começa daqui. Escolha um frame com o rosto de frente e a roupa como fica na maior parte do vídeo.</p>
              <p className="eyebrow">Marque o rosto</p>
              <ol className="marks">
                {STEPS.map((s) => (
                  <li key={s.key} className={marks[s.key] != null ? 'done' : next?.key === s.key ? 'now' : ''}>
                    Clique em {s.label}
                    {s.key === 'eyes' && <span className="muted"> (o centro do rosto vem daí)</span>}
                  </li>
                ))}
              </ol>
              <div className="row">
                <button type="button" className="ghost" onClick={() => setMarks({})} disabled={!Object.keys(marks).length}>Refazer</button>
                <button type="button" className="primary" onClick={use} disabled={!!next || step === 'measuring'}>
                  {step === 'measuring' ? 'Medindo o tom…' : 'Usar este footage'}
                </button>
              </div>
              <p className="muted small">
                {plate.width}×{plate.height}. O tom da roupa sob o queixo decide se as palavras soltas saem brancas ou em tinta.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Export a video ─────────────────────────────────────────────────────────────────────────────────────────────

const ExportModal: React.FC<{ pack: StylePack; plan: ReelPlan; onClose: () => void }> = ({ pack, plan, onClose }) => {
  const [job, setJob] = useState<RenderJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);

  const start = useCallback(async () => {
    setError(null);
    setJob({ status: 'rendering', progress: 0, log: [], url: null, error: null });
    try {
      const r = await startRender(pack, plan);
      setId(r.id);
    } catch (e) {
      setJob(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [pack, plan]);

  useEffect(() => {
    void start();
  }, [start]);

  useEffect(() => {
    if (!id) return;
    let stop = false;
    let misses = 0;
    const tick = async () => {
      try {
        const j = await pollRender(id);
        if (stop) return;
        misses = 0;
        setJob(j);
        if (j.status === 'rendering' || j.status === 'queued') setTimeout(tick, 1200);
      } catch (e) {
        if (stop) return;
        if (++misses < 3) return void setTimeout(tick, 2000);
        setError(e instanceof Error ? e.message : String(e));
      }
    };
    void tick();
    return () => {
      stop = true;
    };
  }, [id]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  const pct = Math.round((job?.progress ?? 0) * 100);
  const seconds = plan.shots.reduce((a, s) => a + s.frames, 0) / 30;
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal modal-export" role="dialog" aria-label="Exportar vídeo" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>Exportar o reel de exemplo</h2>
            <p className="muted">
              O reel de exemplo do <strong>{pack.name}</strong> ({seconds.toFixed(1)} s), renderizado pelo engine em 1080×1920. Leva um ou dois minutos nesta máquina.
            </p>
          </div>
          <button type="button" className="close" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        {error && <p className="note bad">{error}</p>}
        {job?.status === 'queued' && (
          <div className="progress-box">
            <p>Na fila: {job.position ?? 1}º lugar. Outro render está rodando; o seu começa em seguida.</p>
            <div className="bar"><span style={{ width: '2%' }} /></div>
          </div>
        )}
        {job?.status === 'rendering' && (
          <div className="progress-box">
            <p>{pct < 5 ? 'Preparando o engine (empacotando e abrindo o Chrome)…' : `Renderizando… ${pct}%`}</p>
            <div className="bar"><span style={{ width: `${pct}%` }} /></div>
            <pre className="log">{job.log.slice(-6).join('\n')}</pre>
          </div>
        )}
        {job?.status === 'error' && <pre className="note bad log">{job.error}</pre>}
        {job?.status === 'done' && job.url && (
          <div className="done">
            <video src={job.url} controls playsInline className="export-video" />
            <div className="row">
              <a className="button primary" href={job.url} download={`${pack.id}-exemplo.mp4`}>⤓ Baixar MP4</a>
              <button type="button" className="ghost" onClick={start}>Renderizar de novo</button>
            </div>
          </div>
        )}
        {(job?.status === 'error' || error) && (
          <div className="row">
            <button type="button" onClick={start}>Tentar de novo</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── The gallery ────────────────────────────────────────────────────────────────────────────────────────────────

const Gallery: React.FC<{ current: string; onPick: (id: string) => void; onClose: () => void }> = ({ current, onPick, onClose }) => {
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" role="dialog" aria-label="Escolher um estilo" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>Faça um estilo de edição seu</h2>
            <p className="muted">Seis pontos de partida, cada um com seu visual: tipo, cor, cartões, marcas, ícones e movimento.</p>
          </div>
          <button type="button" className="close" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <ol className="steps">
          <li><span><strong>Escolha um</strong> dos seis abaixo para começar</span></li>
          <li><span><strong>Faça do seu jeito</strong>: cada escolha mostra o que muda</span></li>
          <li><span><strong>Baixe o skill</strong>, e o Claude Code edita seus vídeos nele</span></li>
        </ol>
        <div className="cards">
          {SHIPPED_IDS.map((id) => (
            <button key={id} type="button" className={`card ${id === current ? 'current' : ''}`} onClick={() => onPick(id)}>
              <div className="card-frame">
                <iframe title={`${SHIPPED[id].name}`} src={`/preview.html?card=${id}`} tabIndex={-1} loading="lazy" />
              </div>
              <div className="card-text">
                <span className="dot" style={{ background: SHIPPED[id].palette.win }} />
                <strong>{SHIPPED[id].name}</strong>
                {id === current && <span className="tag">atual</span>}
                <p className="muted">{BLURB[id]}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
