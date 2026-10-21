# Terminal: the look

What the engine draws in Terminal, from `src/packs/terminal.json`. You never set any of it; it's here so you know what
the stills should show. A code style: VT323 headlines and JetBrains Mono text in phosphor green on a CRT with scan lines, panels with corner marks, the key word inverted with a blinking cursor, pixel icons, the camera in a window, and type that arrives as if typed.

## Type

| Voice | Face | Case | Tracking | Used for | Layout |
|---|---|---|---|---|---|
| display | VT323 Regular | caps | 0.02 em | headlines, quotes, word-pop | keeps its size ×1.3, shrinks to fit; line pitch 1.12 cap heights |
| accent | JetBrains Mono Regular | as written | -0.01 em | lead-ins |  |
| body | JetBrains Mono Regular | as written | -0.01 em | running text, captions | 34 characters a line; line pitch 2.6 x-heights |
| label | JetBrains Mono Bold | caps | 0.1 em | eyebrows, counters, fact labels |  |
| code | JetBrains Mono Regular | as written | 0 em | code |  |

Every face is scaled to the engine's reference face (cap height 0.7 em for headlines and labels, the x-height for body
text and lead-ins), so a size means the same in every style.

## Colour

| Name | Value | Role |
|---|---|---|
| base | #050806 | the dark ground |
| text / textSoft | #D4FFE3 / #7CD9A3 | type on dark: headlines / step-back |
| ink / inkSoft | #06100A / #2F5E45 | type on light: headlines / step-back |
| win | #3DFF8F | the win, the after, the pick |
| friction | #FF5F56 | the friction, the before |
| amber | #FFB000 | hero colour option |
| cyan | #59F3FF | hero colour option |
| magenta | #FF4FD8 | hero colour option |

Hero rotation, one per video: `win`, `amber` and `cyan`.

## Grounds

- **Dark** (the default): #050806 and a CRT: scan lines, a phosphor glow and a rolling band.
- **Light**: #E9F7EE and a CRT: scan lines, a phosphor glow and a rolling band.

Scenes are set left, with 80 px side margins, the stack starting
220 px down.

## Cards

- On dark: #07100B, flat, 0 px corners, a 2 px ring, a hard shadow 0 px down.
- On light: #F4FBF6, flat, 0 px corners, a 2 px ring, a hard shadow 0 px down.

## Signature

- Cards: flat terminal panels with a fine border and corner marks.
- The hero word and the winning number: inverted: the ground colour on a hero-colour block.
- Icons: pixel icons (the list and before/after scenes take an `icon`).
- Arrivals: lines are typed in from the left.
- The tile wears a window's title bar.

## Captions

JetBrains Mono Bold at 46 px, on a flat dark block, centred in the lane at y 1470. The key word: it sits on a box in the hero colour, tilted 0°, in JetBrains Mono Bold.

## The presenter

- **Full frame**: the presenter's room filling the frame, the only layout that punches in.
- **The half band**: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, with a hard top edge and a 3 px rule in the hero colour along it; captions ride that top edge.
- **The tile**: the camera in a square tile, the eye line on its upper third, with 0 px corners and a 2 px #1F7A4A ring.

## Motion

- Arrivals: each line over 14 frames, 5 frames apart, rising 0 px (bezier 0.2, 0.6, 0.35, 1).
- The landing spring: frequency 0.55 a frame, damping 0.9 (no overshoot).
- Punch-in: 10% over 1 frames.
- Joins: cut; flash: 2 frames of the hero colour over the cut; glitch: the frame tears into offset slices with colour fringes for 5 frames, then settles on the new shot.
- Captions: each line is typed in from the left.
