# Ledger: the reel plan

A reel plan is a whole video as JSON, in `plans/<video>.json` (plans are per creator, like footage, and stay out of
git). The reel entry (`src/reel/entry.tsx`) renders it; `scripts/check-plan.mjs` checks it against Ledger's rules. The
types are in `src/reel/plan.ts`.

## Fields

| Field | What it is |
|---|---|
| `pack` | `"ledger"`. It picks the pack when the plan renders. |
| `hero` | The video's hero colour, from the rotation: `win`, `blue`, `ochre` or `green`. |
| `title` | A name for the video (optional). |
| `shoot` | The edit and the face: `{ plate, width, height, faceX, crown, eyes, chin, tone }`. Paths are in `public/`; measurements in the edit's pixels; `tone` from `scripts/footage-tone.mjs`. |
| `from` | The edit's frame the reel starts on (0 for the whole edit). |
| `audio` | The voice: a file in `public/` lined up with the edit, played from `from`. |
| `captions` | `[{ from, to, text }]` on the reel's timeline. |
| `shots` | `[{ scene, frames, in?, beat?, props?, note? }]`, in order. `beat` is the kind of beat the shot belongs to (`hook`, `payoff`, `item`, `number`, `point`, `proof`, `end`), on every shot of the beat, so check-plan can hold it to Ledger's beats table; `note` says what the shot is for. Neither is rendered. |

## Timing

- 30 fps: seconds × 30 = frames. A shot's `frames` is its length; shots run back to back, and their frames add up to
  the reel's length.
- A word said at *t* seconds into the edit is at reel frame `round(t × 30) − from`.
- Times inside a shot (talk `punches`, word-pop `groups`, a slam's or a sticker's `at`, a doodle's `from`) count
  from the shot's first frame.
- Ledger in frames: a change every 90 to 120 frames, no shot under 45; ease 12 frames and wipe 16 frames; the end within 90 frames of the last word.

## Captions

`{ "from": 120, "to": 138, "text": "five mods that feel *illegal*" }`: frames on the reel; `*word*` marks the key
word, at most one a line. 3 to 7 words a line in Ledger. Captions run back to back and never
overlap. The reel draws each one for what's under the lane: over footage, or over the ground in its colour.

## The example

[`skills/ledger/example-plan.json`](../example-plan.json) is one short video laid out by Ledger's rules: the same script the
other styles' examples use, so the differences are the style's. It uses the engine's demo footage
(`public/footage/demo/`, not in the repo; measured in `src/board/demo-shoot.json`) and no audio. Its captions are timed at Ledger's speaking pace rather
than from a transcript; a real plan's come from the word timings.

| # | Starts | Frames | Scene | Join | Punches | For |
|---|---|---|---|---|---|---|
| 1 | 0 | 109 | `title` | cut |  | The hook |
| 2 | 109 | 65 | `talk` full | cut | 54 | The hook's payoff |
| 3 | 174 | 98 | `list` | wipe |  | List item 1 |
| 4 | 272 | 120 | `chart` | cut |  | The number |
| 5 | 392 | 98 | `talk` halfBand | ease |  | Bridge to the proof |
| 6 | 490 | 98 | `quote` | wipe |  | The proof, in someone else's words |
| 7 | 588 | 100 | `talk` tile | cut |  | The end |

Render it, if the demo footage is on this machine: `node scripts/render-reel.mjs skills/ledger/example-plan.json --stills auto`.
