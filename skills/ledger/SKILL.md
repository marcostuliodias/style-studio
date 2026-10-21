---
name: ledger
description: "Edit a talking-head short in Ledger, a quiet editorial style, with the style-pack engine. Plans the shots, captions and joins by Ledger's rules, writes a reel plan, checks it, reviews stills and renders the video. Use when asked to edit, plan or render a video in Ledger, or to add Ledger's graphics, captions or transitions to a talking-head edit."
---

# Ledger: editing skill

Generated from `src/packs/ledger.json` by `scripts/make-skill.mjs`. To change a rule, change the pack and generate
the skill again (`node scripts/make-skill.mjs ledger`); don't edit these files by hand.

You edit talking-head shorts in **Ledger**. A quiet editorial style: EB Garamond headlines set left on warm newsprint, Newsreader text, mono labels, hairline cards, subtitles on a pill, one red accent, slow and exact motion with no overshoot.

**How it feels.** Ledger is measured and quiet, and it is led by its graphics, the presenter framed beside them: in its example, 46% of the running time is graphics alone, 45% the presenter framed in the band or a tile and 9% the presenter full frame. Something changes every 3 to 4 s. Lines arrive unhurried (24 frames each, 6 apart) and land with no overshoot. Punch-ins are gentle (4% over 8 frames) and come only on payoffs. Shots meet on hard cuts, a gentle ease or wipes led by a rule. Captions run 3 to 7 words, and each line rises in softly. And it brings `chart` of its own: that's where the style's identity lives.

**What you decide.** The look is in the pack, and the engine applies it to every scene: faces, colours, grounds, cards,
the caption styling, every motion curve. You never set a colour, a font, a size or a position. You decide the edit:
which scene carries each beat and for how long, how shots join, where the punch-ins land, how the captions break, and
the video's hero colour. The rules below are Ledger's for those decisions.

Run every command from the engine's root folder (the one with `package.json` and `src/packs/ledger.json`).

## What you need

- **The edit**: the talking-head video, already cut (takes chosen, dead air out), as one continuous file in
  `public/footage/<video>/`. The reel is 1080x1920 at 30 fps; the edit can be landscape.
- **Word timings**: the transcript with a time for each word (an SRT, VTT or JSON from the creator, or a local Whisper
  run with word timestamps). Captions and punch-ins are all placed on them.
- **The face, measured** in the edit's own pixels. Pull a frame with a grid on it, a line every 100 px
  (`ffmpeg -ss 5 -i public/footage/<video>/plate.mp4 -frames:v 1 -vf "drawgrid=w=100:h=100:t=2:c=red@0.6" out/face.png`),
  look at it, and read off the face's centre x, the top of the head (crown), the eye line and the chin by counting
  grid lines. They go in the plan's `shoot`, with the edit's `width` and `height` (`ffprobe` prints them).
- **How light the footage is under the face**: `node scripts/footage-tone.mjs public/footage/<video>/plate.mp4 <faceX> <eyes> <chin>`
  prints the shoot's `tone` (`{ "chest": 0.01 }` for a black shirt, near 1 for a white one). Words straight on the
  footage (word-pop, captions with no box) take white or ink from it, with an edge in the opposite tone, so they read
  on any shirt. Measure it on a frame that shows the shirt as it is for most of the video.
- **The voice**: an audio file lined up with the edit (or the edit itself, if it has sound), as the plan's `audio`.

## How you work

1. **Find the beats.** Read the transcript into beats, one point each, and name each one's kind: a hook, a payoff,
   an item, a number, a point, a proof or the end ([Ledger's beats](#the-beats), below).
2. **Pick the hero colour** (below).
3. **Lay out the shots** on the edit's timeline: each beat on the scene Ledger carries it with, joined the way the
   beats table says, at Ledger's pace (below). Shot lengths add up to the reel, and the reel's frame n shows the edit's
   frame `from + n`. Write the plan to `plans/<video>.json` (make the folder if it isn't there; it stays out of
   git). Scenes and their props: [references/scenes.md](references/scenes.md). The plan format:
   [references/plan.md](references/plan.md). A whole video in this style: [example-plan.json](example-plan.json).
4. **Write the captions** from the word timings (below).
5. **Check the plan**: `node scripts/check-plan.mjs plans/<video>.json`. Fix every error; weigh every warning.
6. **Render stills and look at every one**: `node scripts/render-reel.mjs plans/<video>.json --stills auto` writes a
   still per shot once it has landed, plus the middle of each join, to `out/reels/<video>/`. Check each against
   [references/look.md](references/look.md):
   - Nothing collides or runs off the frame; captions clear the chin and any card.
   - Words straight on footage (word-pop, captions with no box) contrast with what is under them: white on a dark shirt, ink on a light one, each with an edge. If not, the shoot's `tone` is wrong: measure it again.
   - Headlines in EB Garamond Bold, in the case you write, set left; lead-ins in EB Garamond Regular; labels in JetBrains Mono Regular.
   - Graphic scenes on the light ground: #F4F1EA, a 30 px dot pattern in #141414 at 7% and a vignette.
   - The hero colour shows only in the title's hero word, the list's win fact, the after number, the quote marks and the chart's bar that matters.
   - Captions: Newsreader Medium at 44 px, on a pill; at most one key word, and it's set in EB Garamond Bold in win (#D7261E) at 50 px.
   - The half band: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, with a hard top edge and a 3 px rule in ink (#141414) along it; captions ride that top edge, the whole head inside.
   - The tile: the camera in a square tile, the eye line on its upper third, with 4 px corners and a 3 px #141414 ring, the whole head inside.
   - The chart: every bar from the one axis, the one that matters in the hero colour, each value readable at its bar's end, the source under it.
   - Mid-join stills show the join (ease and wipe), not a broken or empty frame.
   - Each still makes its beat's point on its own.

   Fix the plan and render the stills again until every one reads.
7. **Render the video**: `node scripts/render-reel.mjs plans/<video>.json` writes `out/reels/<video>.mp4`.

## Ledger's rules

### The beats

| Beat | What it is | Ledger carries it with | Join in |
|---|---|---|---|
| **Hook** | the first line: what the video promises | `title`; else `talk` in the half band | opens the video |
| **Payoff** | the line that pays the hook off: the reveal, the verdict, the twist | `talk` full frame | cut |
| **Item** | one thing in a list (a tool, a step, a mistake) with a name and a few facts | `list` | wipe (`"in": "wipe"`) into the first and the one that matters most; the rest cut |
| **Number** | a figure that changed or that matters: a cost, a time, a count | `chart`; else `stat` | cut |
| **Point** | a claim or a bridge in the presenter's own words | `talk` in the half band; else `talk` in the tile or `talk` full frame | ease (`"in": "ease"`) into the first and the one that matters most; the rest cut |
| **Proof** | someone else's words: a customer, a review, a source | `quote` | wipe (`"in": "wipe"`) |
| **End** | the last line: the follow, the next video, the takeaway | `talk` in the tile; else `talk` in the half band or `talk` full frame | cut |

- Read the transcript into beats of these kinds, one point each, then give each beat Ledger's first choice. Take the next one only when the first can't carry it: the words don't fit its props, it ran in the beat before (two of the same scene back to back read as one long shot), or the pace needs a change.
- A beat of a kind not in the table is a point.
- A beat whose scene is a graphic and runs past the pace gets a second shot, on a cut: the presenter (full frame) for the rest of it.
- Tag every shot with its beat (`"beat": "number"`, on each shot of the beat): check-plan then warns when a beat isn't on a scene this table gives it, comes in on a join the table doesn't give it, or never gets its join. A beat that cuts where the table gives a join is fine: that is how a join is kept to the changes that matter (see Joins).
- [example-plan.json](example-plan.json) is one video built this way, shot by shot in [references/plan.md](references/plan.md).

### Pace

- Something on screen changes every **3 to 4 s** (90 to 120 frames). A change is a new shot or a punch-in; a caption changing doesn't count.
- Keep every shot longer than 1.5 s (45 frames).
- Let a shot hold its beat; don't cut sooner than the beat asks just to keep things moving. When a beat runs past 5 s, give it a second shot: another layout, or a scene that shows the point.
- **Punch in only on payoffs**: the reveal, the number, the last line, at the word that lands it. At most one punch in a shot, and most shots have none. The punch is a slow push (4% over 8 frames) and holds to the end of the shot.
- The presenter speaks at about 150 to 180 words a minute (2.5 to 3 words a second). Use it to sanity-check a timing you estimate; the transcript's timings always win.
- Long form (16x9) changes every 7 to 9 s, but the engine renders 9x16 only for now.

### The presenter

- Layouts: **full frame** (`full`): the presenter's room filling the frame, the only layout that punches in; **the half band** (`halfBand`): the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, with a hard top edge and a 3 px rule in ink (#141414) along it; captions ride that top edge; **the tile** (`tile`): the camera in a square tile, the eye line on its upper third, with 4 px corners and a 3 px #141414 ring.
- **Open on the half band**: the first shot is a `title` (it shows the half band) or a `talk` shot in that layout. Never open full frame.
- Full frame when the face and the delivery carry the beat; the half band or the tile when a short heading (the point, 1 to 3 words, in `head`) should hold on screen while the presenter makes it.
- The band and the tile show the camera as shot, filled edge to edge, centred on the face, and zoomed in as far as it takes to put the eye line on their upper third line: no cutouts or background removal. Over the band, captions sit on its top edge so they never cross the face; plan caption lines there short enough to read across the seam.

### Scenes

| Scene | For | Shows the presenter |
|---|---|---|
| `title` | The hook, and the start of a new section. | with a shoot: the half band |
| `talk` | Most of a video: whenever the words carry the beat and no graphic would prove the point better. | yes, in a layout you pick |
| `list` | Each item of a list video (tools, steps, mistakes), when the item has a name and two to four facts worth showing. | no |
| `stat` | A number that changed: a cost, a time, a count. The payoff of a claim. | no |
| `quote` | Someone else's words: a customer, a review, a line from a source. | no |
| `chart` (Ledger's own) | Numbers worth comparing: before and after, this against that, a ranking. The evidence behind a claim, shown rather than said. | no |

- **Ledger's own: `chart`.** Numbers worth comparing: before and after, this against that, a ranking. The evidence behind a claim, shown rather than said. Use it at least once a video: without it a video reads as the shared scenes in Ledger's colours, not as Ledger.
- Graphic scenes stand on the light ground (#F4F1EA, a 30 px dot pattern in #141414 at 7% and a vignette). Set `"theme": "dark"` only to set a whole section apart (the dark ground: flat #121212), never shot by shot.
- Not in Ledger: `word-pop`, `slam`, `doodle`, `command`, `float` and `sticker`, scene types other styles bring. The engine refuses them in Ledger.
- Every scene's props, how it comes out in this style, and an example shot: [references/scenes.md](references/scenes.md).

### Joins

- **Cut** (leave `in` out) between two talk shots, inside a beat, and into the payoff, the number and the end.
- **Ease** (`"in": "ease"`: the new shot rises 24 px over 12 frames while the old one sinks back 1%) into the point.
- **Wipe** (`"in": "wipe"`: the new shot wipes in from the right behind a rule in ink (#141414) while the old one drifts left, over 16 frames) into the item and the proof.
- **Everything else cuts.** A join is punctuation. The ease and the wipe come in on the beats above, and when one of those beats comes round again (the items of a list or the points between), only on the first and the one that matters most. Cut the rest, the way back to the presenter included: on every change a join stops meaning anything, and the video reads as a template. check-plan warns when the ease or the wipe comes in more than 3 times a video, or when one join comes in on three shots in a row.
- Never zoom-through (`zoom`), flash (`flash`), blur (`blur`), glitch (`glitch`) or whip (`whip`): Ledger has them off, and the engine refuses them.
- Ease and wipe keep the shot before on screen under the new one for their frames; the reel's length doesn't change. The shot before must be longer than the join.

### Captions

- Captions are a track on the reel's timeline (`captions`), placed on the word timings: **3 to 7 words a line**, broken at phrase boundaries, never mid-phrase. Back to back and never overlapping; a gap only where the presenter pauses.
- Mark at most one **key word** a line with asterisks (`"text": "five mods that feel *illegal*"`): it's set in EB Garamond Bold in win (#D7261E) at 50 px. Not every line needs one: the stressed word, the number, the turn.
- Write them as spoken; they keep the case you write.
- Captions hide under `quote`: it shows its own words.
- You never style or animate them; the pack does: Newsreader Medium at 44 px, on a pill, a light pill over the ground and a dark one over footage, and each line rises in softly as it comes on.

### Hero colour

- **One hero colour per video**, from Ledger's rotation, in order: win (#D7261E), blue (#1F4FD8), ochre (#B9861A) and green (#1E7A4C). Never the last video's: take the next one after it. `check-plan` finds the newest other plan for Ledger in the same folder and warns on a match, so keep a creator's plans together in `plans/`.
- It colours the title's hero word, the list's win fact, the after number, the quote marks and the chart's bar that matters. You never pick a colour for anything else.
- The caption key word is always win (#D7261E), whatever the hero colour.

### The end

- **Hold the end**: the last shot can run up to 3 s (90 frames) past the last word, then the video ends.

## Rendering

- **A reel**: `node scripts/render-reel.mjs plans/<video>.json`, or `--stills auto` / `--stills 0,45,90` for
  frames. The reel entry is `src/reel/entry.tsx` (composition `Reel`) and the plan is its input props, so the plan's
  `pack` and `hero` pick the pack and the colour.
  `npx remotion render src/reel/entry.tsx Reel out/<video>.mp4 --props=plans/<video>.json` works too, but on Windows
  it leaves Remotion's temp copies of the footage behind; the script removes them.
- **Scrub it in the Studio**: `npx remotion studio src/reel/entry.tsx --props=plans/<video>.json`.
- **The board** shows the style itself, its scenes with fixed words:
  `node scripts/render-stills.mjs --packs ledger --scenes Title,List,Stat,Quote,Chart` (stills in `out/stills/ledger/`), or one
  still: `npx remotion still src/board/entry.tsx Board-Title out/title.png --frame=60 --props="{\"pack\":\"ledger\",\"hero\":\"blue\"}"`.
  The board entry is `src/board/entry.tsx` (`npm run studio`).
- The engine refuses a plan it can't render before drawing a frame, and says why, by shot: a scene Ledger doesn't bring,
  a missing or unknown prop, a join or a layout Ledger has off.
- `BROWSER=<path to chrome-headless-shell>` reuses a browser already on disk.
- The example plan renders with the engine's demo footage, if it's on this machine:
  `node scripts/render-reel.mjs skills/ledger/example-plan.json --stills auto`.
