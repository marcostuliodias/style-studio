---
name: sketch
description: "Edit a talking-head short in Sketch, a hand-drawn whiteboard style, with the style-pack engine. Plans the shots, captions and joins by Sketch's rules, writes a reel plan, checks it, reviews stills and renders the video. Use when asked to edit, plan or render a video in Sketch, or to add Sketch's graphics, captions or transitions to a talking-head edit."
---

# Sketch: editing skill

Generated from `src/packs/sketch.json` by `scripts/make-skill.mjs`. To change a rule, change the pack and generate
the skill again (`node scripts/make-skill.mjs sketch`); don't edit these files by hand.

You edit talking-head shorts in **Sketch**. A hand-drawn whiteboard style: Caveat headlines and Virgil text on a paper grid, a yellow marker highlight on the word that matters, cards with hand-drawn borders and tape, hand-drawn icons, the camera taped to the page under a torn edge, and lines that arrive like drawn animation.

**How it feels.** Sketch is measured and quiet, and it is led by its graphics and draws on the footage: in its example, 45% of the running time is graphics alone, 26% graphics drawn over the presenter, 17% the presenter framed in the band or a tile and 11% the presenter full frame. Something changes every 2.5 to 3.5 s. Lines snap in (14 frames each, 4 apart) and settle with a little overshoot. Punch-ins are firm (8% over 4 frames) and come on stressed words. Shots meet on hard cuts or torn-paper wipes. Captions run 2 to 4 words, and each line arrives in steps, like drawn animation. And it brings `doodle` of its own: that's where the style's identity lives.

**What you decide.** The look is in the pack, and the engine applies it to every scene: faces, colours, grounds, cards,
the caption styling, every motion curve. You never set a colour, a font, a size or a position. You decide the edit:
which scene carries each beat and for how long, how shots join, where the punch-ins land, how the captions break, and
the video's hero colour. The rules below are Sketch's for those decisions.

Run every command from the engine's root folder (the one with `package.json` and `src/packs/sketch.json`).

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
- **The creator's profile**, `plans/perfil.json`, made once per creator: their name and @ (`nome`, `arroba`), what
  they talk about and to whom (`nicho`), the line they end on (`cta`), their photo (`foto`, in `public/`) and
  their prints (`prints[]`: `file` in `public/`, `descricao`, `shape`). When the file isn't there, run
  `node scripts/perfil.mjs` (a page opens in their browser; wait for it to finish) or, if they'd rather answer in the
  chat, ask for the name and @ at least and write the file yourself (the photo and prints can come later).

## How you work

0. **Read the creator's rules.** `plans/regras.json`, when it exists, holds what this creator has asked for
   "always" on earlier storyboards (`regras[].texto`, with the video and shot it came from). Follow each one as if
   it were written in this file; where one contradicts Sketch's rules, the creator wins, and say so in the plan's notes.
   Read `plans/perfil.json` too, and put the creator in the plan: `creator: { name, handle, photo }` from `nome`,
   `arroba` and `foto`; `badge: true` on the first full-frame presenter shot after the hook and on the end shot
   (never on a title, a graphic or the band: the engine refuses it there); `nicho` shapes the words you choose, and
   `cta` is what the end says. Where a beat is proof and one of their prints shows it (read each `descricao`),
   carry it with the `print` scene (`src` the print's `file`, `shape` its shape) rather than a quote.
1. **Find the beats.** Read the transcript into beats, one point each, and name each one's kind: a hook, a payoff,
   an item, a number, a point, a proof or the end ([Sketch's beats](#the-beats), below).
2. **Pick the hero colour** (below).
3. **Lay out the shots** on the edit's timeline: each beat on the scene Sketch carries it with, joined the way the
   beats table says, at Sketch's pace (below). Shot lengths add up to the reel, and the reel's frame n shows the edit's
   frame `from + n`. Write the plan to `plans/<video>.json` (make the folder if it isn't there; it stays out of
   git). Scenes and their props: [references/scenes.md](references/scenes.md). The plan format:
   [references/plan.md](references/plan.md). A whole video in this style: [example-plan.json](example-plan.json).
   Where you hesitate between two scenes for a beat, plan one and offer the other as `options` on that shot
   (`[{ scene, props, in?, why }]`, each a whole shot of the same length, `why` one line in the creator's language):
   the storyboard (step 7) shows them side by side and the creator picks. Two or three shots with options a video,
   not every shot.
4. **Write the captions** from the word timings (below).
5. **Check the plan**: `node scripts/check-plan.mjs plans/<video>.json`. Fix every error; weigh every warning.
6. **Render stills and look at every one**: `node scripts/render-reel.mjs plans/<video>.json --stills auto` writes a
   still per shot once it has landed, plus the middle of each join, to `out/reels/<video>/`. Check each against
   [references/look.md](references/look.md):
   - Nothing collides or runs off the frame; captions clear the chin and any card.
   - Words straight on footage (word-pop, captions with no box) contrast with what is under them: white on a dark shirt, ink on a light one, each with an edge. If not, the shoot's `tone` is wrong: measure it again.
   - Headlines in Caveat Bold, in the case you write, set left; lead-ins in Caveat Regular; labels in Virgil Regular.
   - Graphic scenes on the light ground: #FBF7EE and a sheet of paper (its lines, grain and edges).
   - The hero colour shows only in the title's hero word, the list's win fact, the after number, the quote marks and the doodle's marker, arrow and strokes.
   - Captions: Caveat Bold at 72 px, a hard shadow; at most one key word, and it's set in Caveat Bold, on a marker highlight in the hero colour.
   - The half band: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, under a torn paper edge; captions ride that top edge, the whole head inside.
   - The tile: the camera in a square tile, the eye line on its upper third, with 4 px corners and a 12 px white ring, the whole head inside.
   - The doodle: the note above the head and never over the face; the arrow points at the head, not into it.
   - Mid-join stills show the join (wipe), not a broken or empty frame.
   - Its signature shows: cards: paper cards with a hand-drawn border, taped to the page, rows ruled by hand, leaning -1.2°; the hero word and the winning number: on a marker highlight in the hero colour; icons: hand-drawn icons (the list and before/after scenes take an `icon`); arrivals: lines arrive in steps, twelve drawings a second; the tile wears tape on its corners; the camera band sits under a torn paper edge; hand-drawn strokes wobble 2.6 px and redraw every 4 frames, so they shimmer.
   - The print: the whole card above the band, the image inside it cropped from its top and readable, its lead-in over it; the badge (where a shot has one) in the top left, the photo in a ring, the @ in the headline voice, clear of the face.
   - Each still makes its beat's point on its own.

   Fix the plan and render the stills again until every one reads.
7. **Storyboard: the creator approves before the render**: `node scripts/storyboard.mjs plans/<video>.json`
   renders a still per shot (and per option), opens a page in the creator's browser and waits. There the creator
   watches the cut with the shots marked on it, picks between the options, marks speech errors and breaths to cut,
   writes what to change (for this video, or always) and approves or asks for changes. Tell the creator the page is
   open and wait for the command to finish; never approve for them. When it ends:
   - It has already written the chosen options into the plan (the plan as it was: `plans/<video>.antes.json`) and
     the "always" notes into `plans/regras.json`; everything the creator said is in `plans/<video>.storyboard.json`
     and in the command's output.
   - **Cuts** (`cortes`, in seconds of the edit in `public/footage`, not the reel): remove those ranges from the
     edit with ffmpeg (keep the original beside it), make the word timings again, shift `from`, the captions and the
     shots, and run the storyboard again so the creator sees the cut.
   - **Adjustments** (`ajustes`): change the plan accordingly, check it, render the stills again. A note marked always
     is now a rule: follow it in this plan too.
   - Exit code 0 is approved: apply any adjustments and render. Exit code 2 is changes asked: fix the plan and run the
     storyboard again until the creator approves.
8. **Render the video**: `node scripts/render-reel.mjs plans/<video>.json` writes `out/reels/<video>.mp4`.

## Sketch's rules

### The beats

| Beat | What it is | Sketch carries it with | Join in |
|---|---|---|---|
| **Hook** | the first line: what the video promises | `title`; else `talk` in the half band or `talk` full frame | opens the video |
| **Payoff** | the line that pays the hook off: the reveal, the verdict, the twist | `doodle`; else `talk` full frame | cut |
| **Item** | one thing in a list (a tool, a step, a mistake) with a name and a few facts | `list` | wipe (`"in": "wipe"`) into the first and the one that matters most; the rest cut |
| **Number** | a figure that changed or that matters: a cost, a time, a count | `stat` | cut |
| **Point** | a claim or a bridge in the presenter's own words | `talk` full frame | cut |
| **Proof** | someone else's words: a customer, a review, a source | `quote`; else `print` | wipe (`"in": "wipe"`) |
| **End** | the last line: the follow, the next video, the takeaway | `doodle`; else `talk` full frame | cut |

- Read the transcript into beats of these kinds, one point each, then give each beat Sketch's first choice. Take the next one only when the first can't carry it: the words don't fit its props, it ran in the beat before (two of the same scene back to back read as one long shot), or the pace needs a change.
- A beat of a kind not in the table is a point.
- A beat whose scene is a graphic and runs past the pace gets a second shot, on a cut: the presenter (full frame) for the rest of it. `doodle` lands on a word: hold it about a second past that word, into the next beat, so the hit reads.
- Tag every shot with its beat (`"beat": "number"`, on each shot of the beat): check-plan then warns when a beat isn't on a scene this table gives it, comes in on a join the table doesn't give it, or never gets its join. A beat that cuts where the table gives a join is fine: that is how a join is kept to the changes that matter (see Joins).
- [example-plan.json](example-plan.json) is one video built this way, shot by shot in [references/plan.md](references/plan.md).

### Pace

- Something on screen changes every **2.5 to 3.5 s** (75 to 105 frames). A change is a new shot or a punch-in; a caption changing doesn't count.
- Keep every shot longer than 1.25 s (38 frames).
- Let a shot hold its beat; don't cut sooner than the beat asks just to keep things moving. When a beat runs past 4.4 s, give it a second shot: another layout, or a scene that shows the point.
- **Punch in on stressed words**: at a caption line's key word, not on every line; roughly one line in two or three. A punch is 8% over 4 frames.
- The presenter speaks at about 160 to 190 words a minute (2.67 to 3.17 words a second). Use it to sanity-check a timing you estimate; the transcript's timings always win.
- Long form (16x9) changes every 5 to 7 s, but the engine renders 9x16 only for now.

### The presenter

- Layouts: **full frame** (`full`): the presenter's room filling the frame, the only layout that punches in; **the half band** (`halfBand`): the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, under a torn paper edge; captions ride that top edge; **the tile** (`tile`): the camera in a square tile, the eye line on its upper third, with 4 px corners and a 12 px white ring.
- **Open on the half band or full frame**: the first shot is a `title` (it shows the half band) or a `talk` shot in one of those layouts.
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
| `print` | Proof the creator has a print of: a client's message, a review, a result on a dashboard, a post that did well. One print per shot; the words about it stay in the captions. | with a shoot: the half band |
| `doodle` (Sketch's own) | A verdict, a reaction or the one thing to remember while the presenter talks: the hook's payoff, the 'wait, what', the takeaway. It keeps the face on screen and puts the style on it. | yes: full frame |

- **Sketch's own: `doodle`.** A verdict, a reaction or the one thing to remember while the presenter talks: the hook's payoff, the 'wait, what', the takeaway. It keeps the face on screen and puts the style on it. Use it at least once a video: without it a video reads as the shared scenes in Sketch's colours, not as Sketch.
- Graphic scenes stand on the light ground (#FBF7EE and a sheet of paper (its lines, grain and edges)). Set `"theme": "dark"` only to set a whole section apart (the dark ground: #22282B and a sheet of paper (its lines, grain and edges)), never shot by shot.
- Not in Sketch: `word-pop`, `slam`, `chart`, `command`, `float` and `sticker`, scene types other styles bring. The engine refuses them in Sketch.
- Every scene's props, how it comes out in this style, and an example shot: [references/scenes.md](references/scenes.md).

### Joins

- **Cut** (leave `in` out) between two talk shots, inside a beat, and into the payoff, the number, the point and the end.
- **Wipe** (`"in": "wipe"`: the new shot wipes in from the right behind a torn paper edge while the old one drifts left, over 12 frames) into the item and the proof.
- **Everything else cuts.** A join is punctuation. The wipe comes in on the beats above, and when one of those beats comes round again (the items of a list), only on the first and the one that matters most. Cut the rest, the way back to the presenter included: on every change a join stops meaning anything, and the video reads as a template. check-plan warns when the wipe comes in more than 3 times a video, or when one join comes in on three shots in a row.
- Never ease (`ease`), zoom-through (`zoom`), flash (`flash`), blur (`blur`), glitch (`glitch`) or whip (`whip`): Sketch has them off, and the engine refuses them.
- Wipe keeps the shot before on screen under the new one for its frames; the reel's length doesn't change. The shot before must be longer than the join.

### Captions

- Captions are a track on the reel's timeline (`captions`), placed on the word timings: **2 to 4 words a line**, broken at phrase boundaries, never mid-phrase. Back to back and never overlapping; a gap only where the presenter pauses.
- Mark at most one **key word** a line with asterisks (`"text": "five mods that feel *illegal*"`): it's set in Caveat Bold, on a marker highlight in the hero colour. Not every line needs one: the stressed word, the number, the turn.
- Write them as spoken; they keep the case you write.
- Captions hide under `quote`: it shows its own words.
- You never style or animate them; the pack does: Caveat Bold at 72 px, a hard shadow, and each line arrives in steps, like drawn animation as it comes on.

### Hero colour

- **One hero colour per video**, from Sketch's rotation, in order: win (#FFD43B), pink (#FF7AB6), green (#22C55E) and orange (#FF8A3D). Never the last video's: take the next one after it. `check-plan` finds the newest other plan for Sketch in the same folder and warns on a match, so keep a creator's plans together in `plans/`.
- It colours the title's hero word, the list's win fact, the after number, the quote marks and the doodle's marker, arrow and strokes. You never pick a colour for anything else.

### The end

- **Hold the end**: the last shot can run up to 2 s (60 frames) past the last word, then the video ends.

## Rendering

- **A reel**: `node scripts/render-reel.mjs plans/<video>.json`, or `--stills auto` / `--stills 0,45,90` for
  frames. The reel entry is `src/reel/entry.tsx` (composition `Reel`) and the plan is its input props, so the plan's
  `pack` and `hero` pick the pack and the colour.
  `npx remotion render src/reel/entry.tsx Reel out/<video>.mp4 --props=plans/<video>.json` works too, but on Windows
  it leaves Remotion's temp copies of the footage behind; the script removes them.
- **Scrub it in the Studio**: `npx remotion studio src/reel/entry.tsx --props=plans/<video>.json`.
- **The board** shows the style itself, its scenes with fixed words:
  `node scripts/render-stills.mjs --packs sketch --scenes Title,List,Stat,Quote,Doodle` (stills in `out/stills/sketch/`), or one
  still: `npx remotion still src/board/entry.tsx Board-Title out/title.png --frame=60 --props="{\"pack\":\"sketch\",\"hero\":\"pink\"}"`.
  The board entry is `src/board/entry.tsx` (`npm run studio`).
- The engine refuses a plan it can't render before drawing a frame, and says why, by shot: a scene Sketch doesn't bring,
  a missing or unknown prop, a join or a layout Sketch has off.
- `BROWSER=<path to chrome-headless-shell>` reuses a browser already on disk.
- The example plan renders with the engine's demo footage, if it's on this machine:
  `node scripts/render-reel.mjs skills/sketch/example-plan.json --stills auto`.
