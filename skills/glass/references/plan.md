# Glass: the reel plan

A reel plan is a whole video as JSON, in `plans/<video>.json` (plans are per creator, like footage, and stay out of
git). The reel entry (`src/reel/entry.tsx`) renders it; `scripts/check-plan.mjs` checks it against Glass's rules. The
types are in `src/reel/plan.ts`.

## Fields

| Field | What it is |
|---|---|
| `pack` | `"glass"`. It picks the pack when the plan renders. |
| `hero` | The video's hero colour, from the rotation: `win`, `amber` or `pink`. |
| `title` | A name for the video (optional). |
| `shoot` | The edit and the face: `{ plate, width, height, faceX, crown, eyes, chin, tone }`. Paths are in `public/`; measurements in the edit's pixels; `tone` from `scripts/footage-tone.mjs`. |
| `from` | The edit's frame the reel starts on (0 for the whole edit). |
| `audio` | The voice: a file in `public/` lined up with the edit, played from `from`. |
| `captions` | `[{ from, to, text }]` on the reel's timeline. |
| `shots` | `[{ scene, frames, in?, beat?, props?, note? }]`, in order. `beat` is the kind of beat the shot belongs to (`hook`, `payoff`, `item`, `number`, `point`, `proof`, `end`), on every shot of the beat, so check-plan can hold it to Glass's beats table; `note` says what the shot is for. Neither is rendered. |

## Timing

- 30 fps: seconds × 30 = frames. A shot's `frames` is its length; shots run back to back, and their frames add up to
  the reel's length.
- A word said at *t* seconds into the edit is at reel frame `round(t × 30) − from`.
- Times inside a shot (talk `punches`, word-pop `groups`, a slam's or a sticker's `at`, a doodle's `from`) count
  from the shot's first frame.
- Glass in frames: a change every 90 to 105 frames, no shot under 45; blur 14 frames; the end within 75 frames of the last word.

## Captions

`{ "from": 120, "to": 138, "text": "five mods that feel *illegal*" }`: frames on the reel; `*word*` marks the key
word, at most one a line. 2 to 5 words a line in Glass. Captions run back to back and never
overlap. The reel draws each one for what's under the lane: over footage, or over the ground in its colour.

## The example

[`skills/glass/example-plan.json`](../example-plan.json) is one short video laid out by Glass's rules: the same script the
other styles' examples use, so the differences are the style's. It uses the engine's demo footage
(`public/footage/demo/`, not in the repo; measured in `src/board/demo-shoot.json`) and no audio. Its captions are timed at Glass's speaking pace rather
than from a transcript; a real plan's come from the word timings.

| # | Starts | Frames | Scene | Join | Punches | For |
|---|---|---|---|---|---|---|
| 1 | 0 | 120 | `title` | cut |  | The hook |
| 2 | 120 | 65 | `talk` full | cut | 54 | The hook's payoff |
| 3 | 185 | 131 | `float` | cut |  | List item 1 |
| 4 | 316 | 109 | `stat` | blur |  | The number |
| 5 | 425 | 76 | `talk` halfBand | cut |  | Bridge to the proof |
| 6 | 501 | 98 | `quote` | blur |  | The proof, in someone else's words |
| 7 | 599 | 103 | `talk` full | cut | 54 | The end |

Render it, if the demo footage is on this machine: `node scripts/render-reel.mjs skills/glass/example-plan.json --stills auto`.
