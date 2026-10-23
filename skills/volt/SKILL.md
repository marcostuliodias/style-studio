---
name: volt
description: "Edit a talking-head short in Volt, a loud creator style, with the style-pack engine. Plans the shots, captions and joins by Volt's rules, writes a reel plan, checks it, reviews stills and renders the video. Use when asked to edit, plan or render a video in Volt, or to add Volt's graphics, captions or transitions to a talking-head edit."
---

# Volt: editing skill

Generated from `src/packs/volt.json` by `scripts/make-skill.mjs`. To change a rule, change the pack and generate
the skill again (`node scripts/make-skill.mjs volt`); don't edit these files by hand.

You edit talking-head shorts in **Volt**. A loud creator style: Anton caps centred over flat black and a fine grid, Inter Black subtitles with the key word on an electric-yellow box, cool flat cards with a ring, a hard-edged band, snappy springs, hard punch-ins, and word-pop captions.

**How it feels.** Volt is fast and loud, and it lives on the face and pops the key words over the speaker: in its example, 52% of the running time is the presenter full frame, 26% graphics alone, 13% graphics drawn over the presenter and 9% the presenter framed in the band or a tile. Something changes every 1.5 to 2 s. Lines snap in (12 frames each, 2 apart) and land with a bounce. Punch-ins are hard (16% over 2 frames) and come on every line. Shots meet on hard cuts, zoom-throughs or a flash in the hero colour. Captions run 1 to 3 words, the key word on a box, and each line pops in on the spring. And it brings `word-pop` and `slam` of its own: that's where the style's identity lives.

**What you decide.** The look is in the pack, and the engine applies it to every scene: faces, colours, grounds, cards,
the caption styling, every motion curve. You never set a colour, a font, a size or a position. You decide the edit:
which scene carries each beat and for how long, how shots join, where the punch-ins land, how the captions break, and
the video's hero colour. The rules below are Volt's for those decisions.

Run every command from the engine's root folder (the one with `package.json` and `src/packs/volt.json`).

## What you need

- **The edit**: the talking-head video, already cut (takes chosen, dead air out), as one continuous file in
  `public/footage/<video>/`. The reel is 1080x1920 at 30 fps; the edit can be landscape.
- **Word timings**: the transcript with a time for each word (an SRT, VTT or JSON from the creator, or a local Whisper
  run with word timestamps). Captions, word-pop, the slam and punch-ins are all placed on them.
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
   an item, a number, a point, a proof or the end ([Volt's beats](#the-beats), below).
2. **Pick the hero colour** (below).
3. **Lay out the shots** on the edit's timeline: each beat on the scene Volt carries it with, joined the way the
   beats table says, at Volt's pace (below). Shot lengths add up to the reel, and the reel's frame n shows the edit's
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
   - Headlines in Anton Regular, in caps, centred; lead-ins in Inter SemiBold Italic; labels in Inter Bold.
   - Graphic scenes on the dark ground: #0B0B0E, a 72 px grid in white at 5%, a glow in the hero colour and a vignette.
   - The hero colour shows only in the title's hero word, the list's win fact, the after number, the quote marks, the slammed value and its shockwave, the glow on the ground, the half band's rule, the caption key word and the flash.
   - Captions: Inter Black at 60 px, in caps, a 10 px black outline over footage, a hard shadow; at most one key word, and it sits on a box in the hero colour, tilted -2.5°, in Inter Black.
   - The half band: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, with a hard top edge and a 10 px rule in the hero colour along it; captions ride that top edge, the whole head inside.
   - The tile: the camera in a square tile, the eye line on its upper third, with 44 px corners and a 6 px white ring, the whole head inside.
   - Word-pop: the words on the chest, clear of the chin, the key word alone in the last group.
   - The slam: the value as wide as the frame allows and landed on its word, the old value struck out above it.
   - Mid-join stills show the join (zoom-through and flash), not a broken or empty frame.
   - Each still makes its beat's point on its own.

   Fix the plan and render the stills again until every one reads.
7. **Render the video**: `node scripts/render-reel.mjs plans/<video>.json` writes `out/reels/<video>.mp4`.

## Volt's rules

### The beats

| Beat | What it is | Volt carries it with | Join in |
|---|---|---|---|
| **Hook** | the first line: what the video promises | `title`; else `talk` in the half band or `talk` full frame | opens the video |
| **Payoff** | the line that pays the hook off: the reveal, the verdict, the twist | `word-pop`; else `talk` full frame | cut |
| **Item** | one thing in a list (a tool, a step, a mistake) with a name and a few facts | `list` | zoom-through (`"in": "zoom"`) into the first and the one that matters most; the rest cut |
| **Number** | a figure that changed or that matters: a cost, a time, a count | `slam`; else `stat` | flash (`"in": "flash"`) into the first and the one that matters most; the rest cut |
| **Point** | a claim or a bridge in the presenter's own words | `talk` full frame | cut |
| **Proof** | someone else's words: a customer, a review, a source | `quote` | zoom-through (`"in": "zoom"`) |
| **End** | the last line: the follow, the next video, the takeaway | `talk` full frame | cut |

- Read the transcript into beats of these kinds, one point each, then give each beat Volt's first choice. Take the next one only when the first can't carry it: the words don't fit its props, it ran in the beat before (two of the same scene back to back read as one long shot), or the pace needs a change.
- A beat of a kind not in the table is a point.
- A beat whose scene is a graphic and runs past the pace gets a second shot, on a cut: the presenter (full frame) for the rest of it. `slam` and `word-pop` land on a word: hold them about a second past that word, into the next beat, so the hit reads.
- Tag every shot with its beat (`"beat": "number"`, on each shot of the beat): check-plan then warns when a beat isn't on a scene this table gives it, comes in on a join the table doesn't give it, or never gets its join. A beat that cuts where the table gives a join is fine: that is how a join is kept to the changes that matter (see Joins).
- [example-plan.json](example-plan.json) is one video built this way, shot by shot in [references/plan.md](references/plan.md).

### Pace

- Something on screen changes every **1.5 to 2 s** (45 to 60 frames). A change is a new shot, a punch-in, a new word-pop group or a slam landing; a caption changing doesn't count.
- Keep every shot longer than 0.75 s (23 frames).
- When a beat runs longer than 2 s, change something inside it: a punch-in, a cut to another layout, or a scene that shows the point. Never let the frame sit still past 2.5 s.
- **Punch in on every line** of full-frame talk: a punch where each new caption line starts (talk `punches`), so the frame moves with the speech. Each punch flips between wide and pushed in, 16% over 2 frames, close to a cut.
- The presenter speaks at about 180 to 220 words a minute (3 to 3.67 words a second). Use it to sanity-check a timing you estimate; the transcript's timings always win.
- Long form (16x9) changes every 3.5 to 4.5 s, but the engine renders 9x16 only for now.

### The presenter

- Layouts: **full frame** (`full`): the presenter's room filling the frame, the only layout that punches in; **the half band** (`halfBand`): the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, with a hard top edge and a 10 px rule in the hero colour along it; captions ride that top edge; **the tile** (`tile`): the camera in a square tile, the eye line on its upper third, with 44 px corners and a 6 px white ring.
- **Open on full frame or the half band**: the first shot is a `title` (it shows the half band) or a `talk` shot in one of those layouts.
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
| `word-pop` (Volt's own) | The line that matters most in a stretch of talk: the hook's payoff, a reveal, a verdict. Its words are the captions, so the caption track hides under it. | yes: full frame |
| `slam` (Volt's own) | The payoff number: the cost that went to zero, the 10x, the one figure the video exists for. Once or twice a video, never two in a row. | no |

- **Volt's own: `word-pop`.** The line that matters most in a stretch of talk: the hook's payoff, a reveal, a verdict. Its words are the captions, so the caption track hides under it. Use it at least once a video: without it a video reads as the shared scenes in Volt's colours, not as Volt.
- **Volt's own: `slam`.** The payoff number: the cost that went to zero, the 10x, the one figure the video exists for. Once or twice a video, never two in a row. Use it at least once a video: without it a video reads as the shared scenes in Volt's colours, not as Volt.
- Graphic scenes stand on the dark ground (#0B0B0E, a 72 px grid in white at 5%, a glow in the hero colour and a vignette). Set `"theme": "light"` only to set a whole section apart (the light ground: #FFFFFF and a 72 px grid in black at 6%), never shot by shot.
- Not in Volt: `chart`, `doodle`, `command`, `float` and `sticker`, scene types other styles bring. The engine refuses them in Volt.
- Every scene's props, how it comes out in this style, and an example shot: [references/scenes.md](references/scenes.md).

### Joins

- **Cut** (leave `in` out) between two talk shots, inside a beat, and into the payoff, the point and the end.
- **Zoom-through** (`"in": "zoom"`: the old shot blows past and the new one settles in, over 4 frames) into the item and the proof.
- **Flash** (`"in": "flash"`: 2 frames of the hero colour over the cut) into the number. Keep it for hits, or it stops hitting.
- **Everything else cuts.** A join is punctuation. The zoom-through and the flash come in on the beats above, and when one of those beats comes round again (the items of a list or a second number), only on the first and the one that matters most. Cut the rest, the way back to the presenter included: on every change a join stops meaning anything, and the video reads as a template. check-plan warns when the zoom-through or the flash comes in more than 3 times a video, or when one join comes in on three shots in a row.
- Never ease (`ease`), wipe (`wipe`), blur (`blur`), glitch (`glitch`) or whip (`whip`): Volt has them off, and the engine refuses them.
- Zoom-through keeps the shot before on screen under the new one for its frames; the reel's length doesn't change. The shot before must be longer than the join.

### Captions

- Captions are a track on the reel's timeline (`captions`), placed on the word timings: **1 to 3 words a line**, a new line at every stress, so the words keep pace with the voice. Back to back and never overlapping; a gap only where the presenter pauses.
- Mark at most one **key word** a line with asterisks (`"text": "five mods that feel *illegal*"`): it sits on a box in the hero colour, tilted -2.5°, in Inter Black. Not every line needs one: the stressed word, the number, the turn.
- Write them as spoken, in normal case: the pack sets them in caps.
- Captions hide under `quote` and `word-pop`: those show their own words. Leave captions out over word-pop; its groups are the captions there.
- You never style or animate them; the pack does: Inter Black at 60 px, in caps, a 10 px black outline over footage, a hard shadow, and each line pops in on the spring as it comes on.

### Hero colour

- **One hero colour per video**, from Volt's rotation, in order: win (#FFE600), cyan (#00E5FF), pink (#FF2E88), lime (#B6FF00) and orange (#FF7A00). Never the last video's: take the next one after it. `check-plan` finds the newest other plan for Volt in the same folder and warns on a match, so keep a creator's plans together in `plans/`.
- It colours the title's hero word, the list's win fact, the after number, the quote marks, the slammed value and its shockwave, the glow on the ground, the half band's rule, the caption key word and the flash. You never pick a colour for anything else.

### The end

- **End within 1 s of the last word**: the last shot runs at most 30 frames past the last caption.

## Rendering

- **A reel**: `node scripts/render-reel.mjs plans/<video>.json`, or `--stills auto` / `--stills 0,45,90` for
  frames. The reel entry is `src/reel/entry.tsx` (composition `Reel`) and the plan is its input props, so the plan's
  `pack` and `hero` pick the pack and the colour.
  `npx remotion render src/reel/entry.tsx Reel out/<video>.mp4 --props=plans/<video>.json` works too, but on Windows
  it leaves Remotion's temp copies of the footage behind; the script removes them.
- **Scrub it in the Studio**: `npx remotion studio src/reel/entry.tsx --props=plans/<video>.json`.
- **The board** shows the style itself, its scenes with fixed words:
  `node scripts/render-stills.mjs --packs volt --scenes Title,List,Stat,Quote,WordPop,Slam` (stills in `out/stills/volt/`), or one
  still: `npx remotion still src/board/entry.tsx Board-Title out/title.png --frame=60 --props="{\"pack\":\"volt\",\"hero\":\"cyan\"}"`.
  The board entry is `src/board/entry.tsx` (`npm run studio`).
- The engine refuses a plan it can't render before drawing a frame, and says why, by shot: a scene Volt doesn't bring,
  a missing or unknown prop, a join or a layout Volt has off.
- `BROWSER=<path to chrome-headless-shell>` reuses a browser already on disk.
- The example plan renders with the engine's demo footage, if it's on this machine:
  `node scripts/render-reel.mjs skills/volt/example-plan.json --stills auto`.
