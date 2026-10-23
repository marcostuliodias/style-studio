# Volt: the reel plan

A reel plan is a whole video as JSON, in `plans/<video>.json` (plans are per creator, like footage, and stay out of
git). The reel entry (`src/reel/entry.tsx`) renders it; `scripts/check-plan.mjs` checks it against Volt's rules. The
types are in `src/reel/plan.ts`.

## Fields

| Field | What it is |
|---|---|
| `pack` | `"volt"`. It picks the pack when the plan renders. |
| `hero` | The video's hero colour, from the rotation: `win`, `cyan`, `pink`, `lime` or `orange`. |
| `title` | A name for the video (optional). |
| `shoot` | The edit and the face: `{ plate, width, height, faceX, crown, eyes, chin, tone }`. Paths are in `public/`; measurements in the edit's pixels; `tone` from `scripts/footage-tone.mjs`. |
| `from` | The edit's frame the reel starts on (0 for the whole edit). |
| `audio` | The voice: a file in `public/` lined up with the edit, played from `from`. |
| `captions` | `[{ from, to, text }]` on the reel's timeline. |
| `shots` | `[{ scene, frames, in?, beat?, props?, note? }]`, in order. `beat` is the kind of beat the shot belongs to (`hook`, `payoff`, `item`, `number`, `point`, `proof`, `end`), on every shot of the beat, so check-plan can hold it to Volt's beats table; `note` says what the shot is for. Neither is rendered. |
| `shots[].options` | `[{ scene, props, in?, why }]` (optional): alternatives for that shot, each a whole shot of the same length, for the creator to pick on the storyboard (`scripts/storyboard.mjs`). `why` is one line for the creator. The storyboard writes the pick into the shot and drops the options. |

## Timing

- 30 fps: seconds × 30 = frames. A shot's `frames` is its length; shots run back to back, and their frames add up to
  the reel's length.
- A word said at *t* seconds into the edit is at reel frame `round(t × 30) − from`.
- Times inside a shot (talk `punches`, word-pop `groups`, a slam's or a sticker's `at`, a doodle's `from`) count
  from the shot's first frame.
- Volt in frames: a change every 45 to 60 frames, no shot under 23; zoom-through 4 frames and flash 2 frames; the end within 30 frames of the last word.

## Captions

`{ "from": 120, "to": 138, "text": "five mods that feel *illegal*" }`: frames on the reel; `*word*` marks the key
word, at most one a line. 1 to 3 words a line in Volt. Captions run back to back and never
overlap. The reel draws each one for what's under the lane: over footage, or over the ground in its colour.

## The example

[`skills/volt/example-plan.json`](../example-plan.json) is one short video laid out by Volt's rules: the same script the
other styles' examples use, so the differences are the style's. It uses the engine's demo footage
(`public/footage/demo/`, not in the repo; measured in `src/board/demo-shoot.json`) and no audio. Its captions are timed at Volt's speaking pace rather
than from a transcript; a real plan's come from the word timings.

| # | Starts | Frames | Scene | Join | Punches | For |
|---|---|---|---|---|---|---|
| 1 | 0 | 50 | `title` | cut |  | The hook |
| 2 | 50 | 49 | `talk` full | cut | 4, 31 | Back to the presenter, to keep the pace |
| 3 | 99 | 75 | `word-pop` | cut |  | The hook's payoff |
| 4 | 174 | 45 | `list` | zoom |  | List item 1 |
| 5 | 219 | 42 | `talk` full | cut | 15 | Back to the presenter, to keep the pace |
| 6 | 261 | 57 | `talk` full | cut | 27, 54 | The number: the set-up |
| 7 | 318 | 54 | `slam` | flash |  | The number |
| 8 | 372 | 42 | `talk` full | cut | 6, 24 | Bridge to the proof |
| 9 | 414 | 45 | `quote` | zoom |  | The proof, in someone else's words |
| 10 | 459 | 36 | `talk` full | cut | 9 | Back to the presenter, to keep the pace |
| 11 | 495 | 69 | `talk` full | cut | 27 | The end |

Render it, if the demo footage is on this machine: `node scripts/render-reel.mjs skills/volt/example-plan.json --stills auto`.
