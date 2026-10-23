---
name: terminal
description: "Edit a talking-head short in Terminal, a code style, with the style-pack engine. Plans the shots, captions and joins by Terminal's rules, writes a reel plan, checks it, reviews stills and renders the video. Use when asked to edit, plan or render a video in Terminal, or to add Terminal's graphics, captions or transitions to a talking-head edit."
---

# Terminal: editing skill

Generated from `src/packs/terminal.json` by `scripts/make-skill.mjs`. To change a rule, change the pack and generate
the skill again (`node scripts/make-skill.mjs terminal`); don't edit these files by hand.

You edit talking-head shorts in **Terminal**. A code style: VT323 headlines and JetBrains Mono text in phosphor green on a CRT with scan lines, panels with corner marks, the key word inverted with a blinking cursor, pixel icons, the camera in a window, and type that arrives as if typed.

**How it feels.** Terminal is fast and loud, and it lives on the face and pops the key words over the speaker: in its example, 32% of the running time is the presenter full frame, 31% the presenter framed in the band or a tile, 24% graphics alone and 13% graphics drawn over the presenter. Something changes every 2 to 2.5 s. Lines snap in (14 frames each, 5 apart) and land with no overshoot. Punch-ins are hard (10% over 1 frame) and come on stressed words. Shots meet on hard cuts, a flash in the hero colour or glitches. Captions run 2 to 5 words, the key word on a box, and each line is typed in from the left. And it brings `word-pop` and `command` of its own: that's where the style's identity lives.

**What you decide.** The look is in the pack, and the engine applies it to every scene: faces, colours, grounds, cards,
the caption styling, every motion curve. You never set a colour, a font, a size or a position. You decide the edit:
which scene carries each beat and for how long, how shots join, where the punch-ins land, how the captions break, and
the video's hero colour. The rules below are Terminal's for those decisions.

Run every command from the engine's root folder (the one with `package.json` and `src/packs/terminal.json`).

## What you need

- **The edit**: the talking-head video, already cut (takes chosen, dead air out), as one continuous file in
  `public/footage/<video>/`. The reel is 1080x1920 at 30 fps; the edit can be landscape.
- **Word timings**: the transcript with a time for each word (an SRT, VTT or JSON from the creator, or a local Whisper
  run with word timestamps). Captions, word-pop and punch-ins are all placed on them.
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
   an item, a number, a point, a proof or the end ([Terminal's beats](#the-beats), below).
2. **Pick the hero colour** (below).
3. **Lay out the shots** on the edit's timeline: each beat on the scene Terminal carries it with, joined the way the
   beats table says, at Terminal's pace (below). Shot lengths add up to the reel, and the reel's frame n shows the edit's
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
   - Headlines in VT323 Regular, in caps, set left; lead-ins in JetBrains Mono Regular; labels in JetBrains Mono Bold.
   - Graphic scenes on the dark ground: #050806 and a CRT: scan lines, a phosphor glow and a rolling band.
   - The hero colour shows only in the title's hero word, the list's win fact, the after number, the quote marks, the prompt and the output line that matters, the half band's rule, the caption key word, the flash and the glitch's colour bars.
   - Captions: JetBrains Mono Bold at 46 px, on a flat dark block; at most one key word, and it sits on a box in the hero colour, tilted 0°, in JetBrains Mono Bold.
   - The half band: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, with a hard top edge and a 3 px rule in the hero colour along it; captions ride that top edge, the whole head inside.
   - The tile: the camera in a square tile, the eye line on its upper third, with 0 px corners and a 2 px #1F7A4A ring, the whole head inside.
   - Word-pop: the words on the chest, clear of the chin, the key word alone in the last group.
   - The command: every line inside the window, the line that matters marked, the window clear of the tile.
   - Mid-join stills show the join (flash and glitch), not a broken or empty frame.
   - Its signature shows: cards: flat terminal panels with a fine border and corner marks; the hero word and the winning number: inverted: the ground colour on a hero-colour block; icons: pixel icons (the list and before/after scenes take an `icon`); arrivals: lines are typed in from the left; the tile wears a window's title bar.
   - Each still makes its beat's point on its own.

   Fix the plan and render the stills again until every one reads.
7. **Render the video**: `node scripts/render-reel.mjs plans/<video>.json` writes `out/reels/<video>.mp4`.

## Terminal's rules

### The beats

| Beat | What it is | Terminal carries it with | Join in |
|---|---|---|---|
| **Hook** | the first line: what the video promises | `title`; else `talk` in the half band | opens the video |
| **Payoff** | the line that pays the hook off: the reveal, the verdict, the twist | `word-pop`; else `talk` full frame | cut |
| **Item** | one thing in a list (a tool, a step, a mistake) with a name and a few facts | `command`; else `list` | glitch (`"in": "glitch"`) into the first and the one that matters most; the rest cut |
| **Number** | a figure that changed or that matters: a cost, a time, a count | `stat` | flash (`"in": "flash"`) into the first and the one that matters most; the rest cut |
| **Point** | a claim or a bridge in the presenter's own words | `talk` in the tile; else `talk` full frame | cut |
| **Proof** | someone else's words: a customer, a review, a source | `quote` | glitch (`"in": "glitch"`) |
| **End** | the last line: the follow, the next video, the takeaway | `talk` full frame | glitch (`"in": "glitch"`) |

- Read the transcript into beats of these kinds, one point each, then give each beat Terminal's first choice. Take the next one only when the first can't carry it: the words don't fit its props, it ran in the beat before (two of the same scene back to back read as one long shot), or the pace needs a change.
- A beat of a kind not in the table is a point.
- A beat whose scene is a graphic and runs past the pace gets a second shot, on a cut: the presenter (full frame) for the rest of it. `word-pop` lands on a word: hold it about a second past that word, into the next beat, so the hit reads.
- Tag every shot with its beat (`"beat": "number"`, on each shot of the beat): check-plan then warns when a beat isn't on a scene this table gives it, comes in on a join the table doesn't give it, or never gets its join. A beat that cuts where the table gives a join is fine: that is how a join is kept to the changes that matter (see Joins).
- [example-plan.json](example-plan.json) is one video built this way, shot by shot in [references/plan.md](references/plan.md).

### Pace

- Something on screen changes every **2 to 2.5 s** (60 to 75 frames). A change is a new shot, a punch-in or a new word-pop group; a caption changing doesn't count.
- Keep every shot longer than 1 s (30 frames).
- When a beat runs longer than 2.5 s, change something inside it: a punch-in, a cut to another layout, or a scene that shows the point. Never let the frame sit still past 3.1 s.
- **Punch in on stressed words**: at a caption line's key word, not on every line; roughly one line in two or three. A punch is 10% over 1 frame.
- The presenter speaks at about 170 to 210 words a minute (2.83 to 3.5 words a second). Use it to sanity-check a timing you estimate; the transcript's timings always win.
- Long form (16x9) changes every 4 to 5 s, but the engine renders 9x16 only for now.

### The presenter

- Layouts: **full frame** (`full`): the presenter's room filling the frame, the only layout that punches in; **the half band** (`halfBand`): the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, with a hard top edge and a 3 px rule in the hero colour along it; captions ride that top edge; **the tile** (`tile`): the camera in a square tile, the eye line on its upper third, with 0 px corners and a 2 px #1F7A4A ring.
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
| `word-pop` (Terminal's own) | The line that matters most in a stretch of talk: the hook's payoff, a reveal, a verdict. Its words are the captions, so the caption track hides under it. | yes: full frame |
| `command` (Terminal's own) | Anything a viewer could run, install or set up: the command, and what it prints. A list item told as an install, a result read off the screen. | with a shoot: the tile |

- **Terminal's own: `word-pop`.** The line that matters most in a stretch of talk: the hook's payoff, a reveal, a verdict. Its words are the captions, so the caption track hides under it. Use it at least once a video: without it a video reads as the shared scenes in Terminal's colours, not as Terminal.
- **Terminal's own: `command`.** Anything a viewer could run, install or set up: the command, and what it prints. A list item told as an install, a result read off the screen. Use it at least once a video: without it a video reads as the shared scenes in Terminal's colours, not as Terminal.
- Graphic scenes stand on the dark ground (#050806 and a CRT: scan lines, a phosphor glow and a rolling band). Set `"theme": "light"` only to set a whole section apart (the light ground: #E9F7EE and a CRT: scan lines, a phosphor glow and a rolling band), never shot by shot.
- Not in Terminal: `slam`, `chart`, `doodle`, `float` and `sticker`, scene types other styles bring. The engine refuses them in Terminal.
- Every scene's props, how it comes out in this style, and an example shot: [references/scenes.md](references/scenes.md).

### Joins

- **Cut** (leave `in` out) between two talk shots, inside a beat, and into the payoff and the point.
- **Flash** (`"in": "flash"`: 2 frames of the hero colour over the cut) into the number. Keep it for hits, or it stops hitting.
- **Glitch** (`"in": "glitch"`: the frame tears into offset slices with colour fringes for 5 frames, then settles on the new shot) into the item, the proof and the end.
- **Everything else cuts.** A join is punctuation. The flash and the glitch come in on the beats above, and when one of those beats comes round again (the items of a list or a second number), only on the first and the one that matters most. Cut the rest, the way back to the presenter included: on every change a join stops meaning anything, and the video reads as a template. check-plan warns when the glitch comes in more than 4 times a video or the flash more than 3, or when one join comes in on three shots in a row.
- Never ease (`ease`), zoom-through (`zoom`), wipe (`wipe`), blur (`blur`) or whip (`whip`): Terminal has them off, and the engine refuses them.
- Glitch keeps the shot before on screen under the new one for its frames; the reel's length doesn't change. The shot before must be longer than the join.

### Captions

- Captions are a track on the reel's timeline (`captions`), placed on the word timings: **2 to 5 words a line**, broken at phrase boundaries, never mid-phrase. Back to back and never overlapping; a gap only where the presenter pauses.
- Mark at most one **key word** a line with asterisks (`"text": "five mods that feel *illegal*"`): it sits on a box in the hero colour, tilted 0°, in JetBrains Mono Bold. Not every line needs one: the stressed word, the number, the turn.
- Write them as spoken; they keep the case you write.
- Captions hide under `quote` and `word-pop`: those show their own words. Leave captions out over word-pop; its groups are the captions there.
- You never style or animate them; the pack does: JetBrains Mono Bold at 46 px, on a flat dark block, and each line is typed in from the left as it comes on.

### Hero colour

- **One hero colour per video**, from Terminal's rotation, in order: win (#3DFF8F), amber (#FFB000) and cyan (#59F3FF). Never the last video's: take the next one after it. `check-plan` finds the newest other plan for Terminal in the same folder and warns on a match, so keep a creator's plans together in `plans/`.
- It colours the title's hero word, the list's win fact, the after number, the quote marks, the prompt and the output line that matters, the half band's rule, the caption key word, the flash and the glitch's colour bars. You never pick a colour for anything else.
- The caption key word is always #050806, whatever the hero colour.

### The end

- **Hold the end**: the last shot can run up to 1.5 s (45 frames) past the last word, then the video ends.

## Rendering

- **A reel**: `node scripts/render-reel.mjs plans/<video>.json`, or `--stills auto` / `--stills 0,45,90` for
  frames. The reel entry is `src/reel/entry.tsx` (composition `Reel`) and the plan is its input props, so the plan's
  `pack` and `hero` pick the pack and the colour.
  `npx remotion render src/reel/entry.tsx Reel out/<video>.mp4 --props=plans/<video>.json` works too, but on Windows
  it leaves Remotion's temp copies of the footage behind; the script removes them.
- **Scrub it in the Studio**: `npx remotion studio src/reel/entry.tsx --props=plans/<video>.json`.
- **The board** shows the style itself, its scenes with fixed words:
  `node scripts/render-stills.mjs --packs terminal --scenes Title,List,Stat,Quote,WordPop,Command` (stills in `out/stills/terminal/`), or one
  still: `npx remotion still src/board/entry.tsx Board-Title out/title.png --frame=60 --props="{\"pack\":\"terminal\",\"hero\":\"amber\"}"`.
  The board entry is `src/board/entry.tsx` (`npm run studio`).
- The engine refuses a plan it can't render before drawing a frame, and says why, by shot: a scene Terminal doesn't bring,
  a missing or unknown prop, a join or a layout Terminal has off.
- `BROWSER=<path to chrome-headless-shell>` reuses a browser already on disk.
- The example plan renders with the engine's demo footage, if it's on this machine:
  `node scripts/render-reel.mjs skills/terminal/example-plan.json --stills auto`.
