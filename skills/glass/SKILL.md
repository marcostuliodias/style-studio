---
name: glass
description: "Edit a talking-head short in Glass, a premium gradient style, with the style-pack engine. Plans the shots, captions and joins by Glass's rules, writes a reel plan, checks it, reviews stills and renders the video. Use when asked to edit, plan or render a video in Glass, or to add Glass's graphics, captions or transitions to a talking-head edit."
---

# Glass: editing skill

Generated from `src/packs/glass.json` by `scripts/make-skill.mjs`. To change a rule, change the pack and generate
the skill again (`node scripts/make-skill.mjs glass`); don't edit these files by hand.

You edit talking-head shorts in **Glass**. A premium gradient style: Sora headlines and Inter text over a drifting violet, blue and pink mesh, frosted glass cards and captions, the hero word glowing in mint, duotone icons, the camera softly blended in, and everything arriving out of a blur.

**How it feels.** Glass is measured and quiet, and it is led by its graphics and floats cards in front of the presenter: in its example, 29% of the running time is graphics alone, 28% the presenter framed in the band or a tile, 24% the presenter full frame and 19% graphics drawn over the presenter. Something changes every 3 to 3.5 s. Lines arrive unhurried (20 frames each, 4 apart) and settle with a little overshoot. Punch-ins are gentle (5% over 10 frames) and come only on payoffs. Shots meet on hard cuts or blur dissolves. Captions run 2 to 5 words, and each line comes up out of a blur. And it brings `float` of its own: that's where the style's identity lives.

**What you decide.** The look is in the pack, and the engine applies it to every scene: faces, colours, grounds, cards,
the caption styling, every motion curve. You never set a colour, a font, a size or a position. You decide the edit:
which scene carries each beat and for how long, how shots join, where the punch-ins land, how the captions break, and
the video's hero colour. The rules below are Glass's for those decisions.

Run every command from the engine's root folder (the one with `package.json` and `src/packs/glass.json`).

## What you need

- **The video**: the talking-head recording, wherever the creator has it (Downloads, the desktop, a phone export),
  raw is fine. `node scripts/importar.mjs <file> --nome <video>` brings it in as
  `public/footage/<video>/original.mp4` (H.264, 30 fps), and `node scripts/limpar.mjs public/footage/<video>/original.mp4`
  makes the cut the engine edits, `plate.mp4`: it transcribes the raw video with a time for every word (once), takes out
  the silences and long pauses, the stutters, the retakes (a phrase started over: the first try goes) and the dead air
  at both ends, and writes the word timings already on the cut to `plate.json` and what it took out to
  `cortes.json`. Read its report and tell the creator in a line what went (they see and can keep any of it on the
  storyboard). A video the creator has already cut goes through the same two commands: the clean-up then finds little.
- **Word timings**: `public/footage/<video>/plate.json` from the clean-up (segments with `words[]`, `start` and
  `end` in seconds of `plate.mp4`). Captions and punch-ins are all placed on them. Never
  on the raw video's timings (`original.json`): those are before the cuts.
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
   it were written in this file; where one contradicts Glass's rules, the creator wins, and say so in the plan's notes.
   Read `plans/perfil.json` too, and put the creator in the plan: `creator: { name, handle, photo }` from `nome`,
   `arroba` and `foto`; `badge: true` on the first full-frame presenter shot after the hook and on the end shot
   (never on a title, a graphic or the band: the engine refuses it there); `nicho` shapes the words you choose, and
   `cta` is what the end says. Where a beat is proof and one of their prints shows it (read each `descricao`),
   carry it with the `print` scene (`src` the print's `file`, `shape` its shape) rather than a quote.
1. **Find the beats.** Read the transcript into beats, one point each, and name each one's kind: a hook, a payoff,
   an item, a number, a point, a proof or the end ([Glass's beats](#the-beats), below).
2. **Pick the hero colour** (below).
3. **Lay out the shots** on the edit's timeline: each beat on the scene Glass carries it with, joined the way the
   beats table says, at Glass's pace (below). Shot lengths add up to the reel, and the reel's frame n shows the edit's
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
   - Headlines in Sora Bold, in the case you write, centred; lead-ins in Sora Regular; labels in Inter Bold.
   - Graphic scenes on the dark ground: #07061A, drifting colour fields filling the frame and a vignette.
   - The hero colour shows only in the title's hero word, the list's win fact, the after number, the quote marks, the floating card's number and the caption key word.
   - Captions: Inter Bold at 50 px, a hard shadow, on a frosted glass pill; at most one key word, and it's set in Inter ExtraBold in the hero colour at 50 px.
   - The half band: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, its top edge feathered over 90 px; captions ride that top edge, the whole head inside.
   - The tile: the camera in a square tile, the eye line on its upper third, with 56 px corners and a 2 px rgba(255,255,255,0.4) ring, the whole head inside.
   - The float: the face soft but there, the eyes above the card; the card whole, over the mouth and chest and clear of the caption lane.
   - Mid-join stills show the join (blur), not a broken or empty frame.
   - Its signature shows: cards: frosted glass cards with a bright edge; the hero word and the winning number: glowing in the hero colour; icons: duotone icons (the list and before/after scenes take an `icon`); arrivals: lines rise out of a blur.
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
   - **Kept and cut** (`manter`: cuts of the clean-up the creator wants back; `cortes`: ranges they marked, in
     seconds of `plate.mp4`): run the `limpar.mjs` command the storyboard prints (it adds `--manter` and
     `--cortar`, starting over from the original). `plate.mp4` and `plate.json` change length: redo `from`,
     the captions and the shots from the new `plate.json`, check, and run the storyboard again so the creator sees it.
   - **Adjustments** (`ajustes`): change the plan accordingly, check it, render the stills again. A note marked always
     is now a rule: follow it in this plan too.
   - Exit code 0 is approved: apply any adjustments and render. Exit code 2 is changes asked: fix the plan and run the
     storyboard again until the creator approves.
8. **Render the video**: `node scripts/render-reel.mjs plans/<video>.json` writes `out/reels/<video>.mp4`.

## Glass's rules

### The beats

| Beat | What it is | Glass carries it with | Join in |
|---|---|---|---|
| **Hook** | the first line: what the video promises | `title`; else `talk` in the half band, `float` or `talk` full frame | opens the video |
| **Payoff** | the line that pays the hook off: the reveal, the verdict, the twist | `talk` full frame | cut |
| **Item** | one thing in a list (a tool, a step, a mistake) with a name and a few facts | `float`; else `list` | cut |
| **Number** | a figure that changed or that matters: a cost, a time, a count | `float`; else `stat` | blur (`"in": "blur"`) into the first and the one that matters most; the rest cut |
| **Point** | a claim or a bridge in the presenter's own words | `talk` in the half band; else `talk` full frame | cut |
| **Proof** | someone else's words: a customer, a review, a source | `quote`; else `print` | blur (`"in": "blur"`) |
| **End** | the last line: the follow, the next video, the takeaway | `talk` full frame | cut |

- Read the transcript into beats of these kinds, one point each, then give each beat Glass's first choice. Take the next one only when the first can't carry it: the words don't fit its props, it ran in the beat before (two of the same scene back to back read as one long shot), or the pace needs a change.
- A beat of a kind not in the table is a point.
- A beat whose scene is a graphic and runs past the pace gets a second shot, on a cut: the presenter (full frame) for the rest of it.
- Tag every shot with its beat (`"beat": "number"`, on each shot of the beat): check-plan then warns when a beat isn't on a scene this table gives it, comes in on a join the table doesn't give it, or never gets its join. A beat that cuts where the table gives a join is fine: that is how a join is kept to the changes that matter (see Joins).
- [example-plan.json](example-plan.json) is one video built this way, shot by shot in [references/plan.md](references/plan.md).

### Pace

- Something on screen changes every **3 to 3.5 s** (90 to 105 frames). A change is a new shot or a punch-in; a caption changing doesn't count.
- Keep every shot longer than 1.5 s (45 frames).
- Let a shot hold its beat; don't cut sooner than the beat asks just to keep things moving. When a beat runs past 4.4 s, give it a second shot: another layout, or a scene that shows the point.
- **Punch in only on payoffs**: the reveal, the number, the last line, at the word that lands it. At most one punch in a shot, and most shots have none. The punch is a slow push (5% over 10 frames) and holds to the end of the shot.
- The presenter speaks at about 150 to 180 words a minute (2.5 to 3 words a second). Use it to sanity-check a timing you estimate; the transcript's timings always win.
- Long form (16x9) changes every 6 to 8 s, but the engine renders 9x16 only for now.

### The presenter

- Layouts: **full frame** (`full`): the presenter's room filling the frame, the only layout that punches in; **the half band** (`halfBand`): the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, its top edge feathered over 90 px; captions ride that top edge; **the tile** (`tile`): the camera in a square tile, the eye line on its upper third, with 56 px corners and a 2 px rgba(255,255,255,0.4) ring.
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
| `float` (Glass's own) | A number, or a list item's few facts, while the presenter keeps talking: the card carries the point and the person stays on screen. The style's way to show a figure or a tool without cutting away from the face. | yes: full frame |

- **Glass's own: `float`.** A number, or a list item's few facts, while the presenter keeps talking: the card carries the point and the person stays on screen. The style's way to show a figure or a tool without cutting away from the face. Use it at least once a video: without it a video reads as the shared scenes in Glass's colours, not as Glass.
- Graphic scenes stand on the dark ground (#07061A, drifting colour fields filling the frame and a vignette). Set `"theme": "light"` only to set a whole section apart (the light ground: #F3F1FF and drifting colour fields filling the frame), never shot by shot.
- Not in Glass: `word-pop`, `slam`, `chart`, `doodle`, `command` and `sticker`, scene types other styles bring. The engine refuses them in Glass.
- Every scene's props, how it comes out in this style, and an example shot: [references/scenes.md](references/scenes.md).

### Joins

- **Cut** (leave `in` out) between two talk shots, inside a beat, and into the payoff, the item, the point and the end.
- **Blur** (`"in": "blur"`: the old shot blurs away as the new one comes into focus, over 14 frames) into the number and the proof.
- **Everything else cuts.** A join is punctuation. The blur comes in on the beats above, and when one of those beats comes round again (a second number), only on the first and the one that matters most. Cut the rest, the way back to the presenter included: on every change a join stops meaning anything, and the video reads as a template. check-plan warns when the blur comes in more than 3 times a video, or when one join comes in on three shots in a row.
- Never ease (`ease`), zoom-through (`zoom`), flash (`flash`), wipe (`wipe`), glitch (`glitch`) or whip (`whip`): Glass has them off, and the engine refuses them.
- Blur keeps the shot before on screen under the new one for its frames; the reel's length doesn't change. The shot before must be longer than the join.

### Captions

- Captions are a track on the reel's timeline (`captions`), placed on the word timings: **2 to 5 words a line**, broken at phrase boundaries, never mid-phrase. Back to back and never overlapping; a gap only where the presenter pauses.
- Mark at most one **key word** a line with asterisks (`"text": "five mods that feel *illegal*"`): it's set in Inter ExtraBold in the hero colour at 50 px. Not every line needs one: the stressed word, the number, the turn.
- Write them as spoken; they keep the case you write.
- Captions hide under `quote`: it shows its own words.
- You never style or animate them; the pack does: Inter Bold at 50 px, a hard shadow, on a frosted glass pill, and each line comes up out of a blur as it comes on.

### Hero colour

- **One hero colour per video**, from Glass's rotation, in order: win (#6EF2D1), amber (#FBBF24) and pink (#EC4899). Never the last video's: take the next one after it. `check-plan` finds the newest other plan for Glass in the same folder and warns on a match, so keep a creator's plans together in `plans/`.
- It colours the title's hero word, the list's win fact, the after number, the quote marks, the floating card's number and the caption key word. You never pick a colour for anything else.

### The end

- **Hold the end**: the last shot can run up to 2.5 s (75 frames) past the last word, then the video ends.

## Rendering

- **A reel**: `node scripts/render-reel.mjs plans/<video>.json`, or `--stills auto` / `--stills 0,45,90` for
  frames. The reel entry is `src/reel/entry.tsx` (composition `Reel`) and the plan is its input props, so the plan's
  `pack` and `hero` pick the pack and the colour.
  `npx remotion render src/reel/entry.tsx Reel out/<video>.mp4 --props=plans/<video>.json` works too, but on Windows
  it leaves Remotion's temp copies of the footage behind; the script removes them.
- **Scrub it in the Studio**: `npx remotion studio src/reel/entry.tsx --props=plans/<video>.json`.
- **The board** shows the style itself, its scenes with fixed words:
  `node scripts/render-stills.mjs --packs glass --scenes Title,List,Stat,Quote,Float` (stills in `out/stills/glass/`), or one
  still: `npx remotion still src/board/entry.tsx Board-Title out/title.png --frame=60 --props="{\"pack\":\"glass\",\"hero\":\"amber\"}"`.
  The board entry is `src/board/entry.tsx` (`npm run studio`).
- The engine refuses a plan it can't render before drawing a frame, and says why, by shot: a scene Glass doesn't bring,
  a missing or unknown prop, a join or a layout Glass has off.
- `BROWSER=<path to chrome-headless-shell>` reuses a browser already on disk.
- The example plan renders with the engine's demo footage, if it's on this machine:
  `node scripts/render-reel.mjs skills/glass/example-plan.json --stills auto`.
