import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { StylePack } from '../../src/engine/pack';
import type { ReelPlan } from '../../src/reel/plan';
import type { Footage } from './api';
import { SHIPPED, clone } from './packs';
import { examplePlanFor } from './plan';

// The draft: the pack being made, which shipped style it started from, and an undo history. Saved in this browser.

export type Draft = { base: string; pack: StylePack };

const DRAFT_KEY = 'style-studio:draft:v1';
/** What the preview iframe reads: the pack handed over whole, the hero colour and the example plan. */
export const PREVIEW_KEY = 'style-studio:preview';
/** The same for the style the draft started from, for "hold to compare". */
export const COMPARE_KEY = 'style-studio:compare';

export const fresh = (base = 'volt'): Draft => ({ base, pack: clone(SHIPPED[base]) });

const load = (): { draft: Draft; problem?: string } => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return { draft: fresh() };
    const d = JSON.parse(raw) as Draft;
    if (!d || typeof d !== 'object' || !d.pack || !SHIPPED[d.base]) return { draft: fresh(), problem: 'o rascunho salvo não tinha a forma esperada' };
    return { draft: d };
  } catch (e) {
    return { draft: fresh(), problem: e instanceof Error ? e.message : String(e) };
  }
};

const save = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // a full or blocked storage only loses persistence
  }
};

export const hasDraft = () => !!localStorage.getItem(DRAFT_KEY);

const FOOTAGE_KEY = 'style-studio:footage';

/** The creator's own footage (uploaded to the engine's public/footage and measured), or null for the demo's. */
export const useFootage = () => {
  const [footage, set] = useState<Footage | null>(() => {
    try {
      const raw = localStorage.getItem(FOOTAGE_KEY);
      const f = raw ? (JSON.parse(raw) as Footage) : null;
      return f?.shoot?.plate ? f : null;
    } catch {
      return null;
    }
  });
  const setFootage = useCallback((f: Footage | null) => {
    set(f);
    try {
      if (f) localStorage.setItem(FOOTAGE_KEY, JSON.stringify(f));
      else localStorage.removeItem(FOOTAGE_KEY);
    } catch {
      // persistence only
    }
  }, []);
  return [footage, setFootage] as const;
};

export const useDraft = () => {
  const [{ draft: first, problem }] = useState(load);
  const [history, setHistory] = useState<Draft[]>([first]);
  const [index, setIndex] = useState(0);
  const draft = history[index];

  useEffect(() => save(DRAFT_KEY, draft), [draft]);

  /** A new pack, as the next step of the history (dropping any redo steps). */
  const commit = useCallback(
    (next: Draft) => {
      setHistory((h) => [...h.slice(0, index + 1), next].slice(-80));
      setIndex((i) => Math.min(i + 1, 79));
    },
    [index],
  );

  /** Change the pack in place (on a copy): `fn` mutates, the result is committed. */
  const edit = useCallback(
    (fn: (p: StylePack) => void) => {
      const pack = clone(draft.pack);
      fn(pack);
      commit({ ...draft, pack });
    },
    [draft, commit],
  );

  const replace = useCallback((pack: StylePack, base = draft.base) => commit({ base, pack }), [draft, commit]);
  const startFrom = useCallback((base: string) => commit(fresh(base)), [commit]);
  const undo = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const redo = useCallback(() => setIndex((i) => Math.min(history.length - 1, i + 1)), [history.length]);
  const changed = useMemo(() => JSON.stringify(draft.pack) !== JSON.stringify(SHIPPED[draft.base]), [draft]);

  return useMemo(
    () => ({ draft, problem, edit, replace, startFrom, undo, redo, changed, canUndo: index > 0, canRedo: index < history.length - 1 }),
    [draft, problem, edit, replace, startFrom, undo, redo, changed, index, history.length],
  );
};

/**
 * Hands the draft to the preview (localStorage, same origin) and bumps a revision the iframe reloads on, debounced;
 * the base style goes to the compare key whenever it changes.
 */
export const usePreviewRev = (draft: Draft, generated: ReelPlan | null, footage: Footage | null, delay = 250) => {
  const [rev, setRev] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const pack = draft.pack;
      let plan: unknown = null;
      try {
        plan = examplePlanFor(draft.base, pack, generated, footage);
      } catch {
        plan = null;
      }
      save(PREVIEW_KEY, { pack, hero: pack.palette?.heroRotation?.[0] ?? 'win', plan, shoot: footage?.shoot ?? null, at: footage?.at ?? 0 });
      setRev((r) => r + 1);
    }, delay);
    return () => window.clearTimeout(timer.current);
  }, [draft, generated, footage, delay]);
  useEffect(() => {
    const base = SHIPPED[draft.base];
    save(COMPARE_KEY, { pack: base, hero: base.palette.heroRotation[0] ?? 'win', plan: examplePlanFor(draft.base, base, null, footage), shoot: footage?.shoot ?? null, at: footage?.at ?? 0 });
  }, [draft.base, footage]);
  return rev;
};
