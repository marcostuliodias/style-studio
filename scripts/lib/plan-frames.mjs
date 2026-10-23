// Frames worth looking at in a reel plan, shared by render-reel (--stills auto) and the storyboard.

/**
 * The frame inside a shot where it has landed: 70% through, or for a scene that lands on a word (a slam, the last
 * sticker, word-pop's key word, a doodle's arrow) just after that, so the still shows the hit.
 */
export const landed = (s) => {
  const p = s.props ?? {};
  const late = {
    slam: (p.at ?? 10) + 16,
    sticker: Math.max(0, ...(p.stickers ?? []).map((x) => x.at)) + 16,
    'word-pop': Math.max(0, ...(p.groups ?? []).flatMap((g) => g.words.map((w) => w.at))) + 12,
    doodle: (p.from ?? 4) + 26,
  }[s.scene];
  return Math.max(0, Math.min(s.frames - 2, late ?? Math.round(s.frames * 0.7)));
};

/** Where each shot starts on the reel's timeline. */
export const starts = (shots) => shots.reduce((a, s, i) => [...a, i ? a[i - 1] + shots[i - 1].frames : 0], []);
