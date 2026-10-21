# Terminal: the reel plan

A reel plan is a whole video as JSON, in `plans/<video>.json` (plans are per creator, like footage, and stay out of
git). The reel entry (`src/reel/entry.tsx`) renders it; `scripts/check-plan.mjs` checks it against Terminal's rules. The
types are in `src/reel/plan.ts`.

## Fields

| Field | What it is |
|---|---|
| `pack` | `"terminal"`. It picks the pack when the plan renders. |
| `hero` | The video's hero colour, from the rotation: `win`, `amber` or `cyan`. |
| `title` | A name for the video (optional). |
| `shoot` | The edit and the face: `{ plate, width, height, faceX, crown, eyes, chin, tone }`. Paths are in `public/`; measurements in the edit's pixels; `tone` from `scripts/footage-tone.mjs`. |
| `from` | The edit's frame the reel starts on (0 for the whole edit). |
| `audio` | The voice: a file in `public/` lined up with the edit, played from `from`. |
| `captions` | `[{ from, to, text }]` on the reel's timeline. |
| `shots` | `[{ scene, frames, in?, beat?, props?, note? }]`, in order. `beat` is the kind of beat the shot belongs to (`hook`, `payoff`, `item`, `number`, `point`, `proof`, `end`), on every shot of the beat, so check-plan can hold it to Terminal's beats table; `note` says what the shot is for. Neither is rendered. |

## Timing

- 30 fps: seconds × 30 = frames. A shot's `frames` is its length; shots run back to back, and their frames add up to
  the reel's length.
- A word said at *t* seconds into the edit is at reel frame `round(t × 30) − from`.
- Times inside a shot (talk `punches`, word-pop `groups`, a slam's or a sticker's `at`, a doodle's `from`) count
  from the shot's first frame.
- Terminal in frames: a change every 60 to 75 frames, no shot under 30; flash 2 frames and glitch 5 frames; the end within 45 frames of the last word.

## Captions

`{ "from": 120, "to": 138, "text": "five mods that feel *illegal*" }`: frames on the reel; `*word*` marks the key
word, at most one a line. 2 to 5 words a line in Terminal. Captions run back to back and never
overlap. The reel draws each one for what's under the lane: over footage, or over the ground in its colour.

## The example

[`skills/terminal/example-plan.json`](../example-plan.json) is one short video laid out by Terminal's rules: the same script the
other styles' examples use, so the differences are the style's. It uses the engine's demo footage
(`public/footage/demo/`, not in the repo; measured in `src/board/demo-shoot.json`) and no audio. Its captions are timed at Terminal's speaking pace rather
than from a transcript; a real plan's come from the word timings.

| # | Starts | Frames | Scene | Join | Punches | For |
|---|---|---|---|---|---|---|
| 1 | 0 | 60 | `title` | cut |  | The hook |
| 2 | 60 | 35 | `talk` full | cut |  | Back to the presenter, to keep the pace |
| 3 | 95 | 78 | `word-pop` | cut |  | The hook's payoff |
| 4 | 173 | 64 | `command` | glitch |  | List item 1 |
| 5 | 237 | 60 | `stat` | flash |  | The number |
| 6 | 297 | 44 | `talk` full | cut | 35 | Back to the presenter, to keep the pace |
| 7 | 341 | 85 | `talk` tile | cut |  | Bridge to the proof |
| 8 | 426 | 85 | `quote` | glitch |  | The proof, in someone else's words |
| 9 | 511 | 70 | `talk` full | glitch | 38 | The end |

Render it, if the demo footage is on this machine: `node scripts/render-reel.mjs skills/terminal/example-plan.json --stills auto`.
