# Sketch: the look

What the engine draws in Sketch, from `src/packs/sketch.json`. You never set any of it; it's here so you know what
the stills should show. A hand-drawn whiteboard style: Caveat headlines and Virgil text on a paper grid, a yellow marker highlight on the word that matters, cards with hand-drawn borders and tape, hand-drawn icons, the camera taped to the page under a torn edge, and lines that arrive like drawn animation.

## Type

| Voice | Face | Case | Tracking | Used for | Layout |
|---|---|---|---|---|---|
| display | Caveat Bold | as written | 0 em | headlines, quotes, captions | keeps its size ×1.3, shrinks to fit; line pitch 1.28 cap heights |
| accent | Caveat Regular | as written | 0 em | lead-ins |  |
| body | Virgil Regular | as written | 0 em | running text | 34 characters a line; line pitch 2.7 x-heights |
| label | Virgil Regular | caps | 0.06 em | eyebrows, counters, fact labels |  |
| code | JetBrains Mono Regular | as written | 0 em | code |  |

Every face is scaled to the engine's reference face (cap height 0.7 em for headlines and labels, the x-height for body
text and lead-ins), so a size means the same in every style.

## Colour

| Name | Value | Role |
|---|---|---|
| base | #22282B | the dark ground |
| text / textSoft | #F5F1E6 / #C9C2B0 | type on dark: headlines / step-back |
| ink / inkSoft | #1F2328 / #5A6068 | type on light: headlines / step-back |
| win | #FFD43B | the win, the after, the pick |
| friction | #E5484D | the friction, the before |
| blue | #3B82F6 | hero colour option |
| green | #22C55E | hero colour option |
| pink | #FF7AB6 | hero colour option |
| orange | #FF8A3D | hero colour option |

Hero rotation, one per video: `win`, `pink`, `green` and `orange`.

## Grounds

- **Dark**: #22282B and a sheet of paper (its lines, grain and edges).
- **Light** (the default): #FBF7EE and a sheet of paper (its lines, grain and edges).

Scenes are set left, with 96 px side margins, the stack starting
230 px down.

## Cards

- On dark: #2B3236, flat, 4 px corners, a soft shadow 12 px down.
- On light: #FFFFFF, flat, 4 px corners, a soft shadow 10 px down.

## Signature

- Cards: paper cards with a hand-drawn border, taped to the page, rows ruled by hand, leaning -1.2°.
- The hero word and the winning number: on a marker highlight in the hero colour.
- Icons: hand-drawn icons (the list and before/after scenes take an `icon`).
- Arrivals: lines arrive in steps, twelve drawings a second.
- The tile wears tape on its corners.
- The camera band sits under a torn paper edge.
- Hand-drawn strokes wobble 2.6 px and redraw every 4 frames, so they shimmer.

## Captions

Caveat Bold at 72 px, a hard shadow, centred in the lane at y 1470. The key word: it's set in Caveat Bold, on a marker highlight in the hero colour.

## The presenter

- **Full frame**: the presenter's room filling the frame, the only layout that punches in.
- **The half band**: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, under a torn paper edge; captions ride that top edge.
- **The tile**: the camera in a square tile, the eye line on its upper third, with 4 px corners and a 12 px white ring.

## Motion

- Arrivals: each line over 14 frames, 4 frames apart, rising 40 px (bezier 0.3, 1.25, 0.5, 1).
- The landing spring: frequency 0.4 a frame, damping 0.5 (a little overshoot).
- Punch-in: 8% over 4 frames.
- Joins: cut; wipe: the new shot wipes in from the right behind a torn paper edge while the old one drifts left, over 12 frames.
- Captions: each line arrives in steps, like drawn animation.
