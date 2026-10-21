# Glass: the look

What the engine draws in Glass, from `src/packs/glass.json`. You never set any of it; it's here so you know what
the stills should show. A premium gradient style: Sora headlines and Inter text over a drifting violet, blue and pink mesh, frosted glass cards and captions, the hero word glowing in mint, duotone icons, the camera softly blended in, and everything arriving out of a blur.

## Type

| Voice | Face | Case | Tracking | Used for | Layout |
|---|---|---|---|---|---|
| display | Sora Bold | as written | -0.035 em | headlines, quotes | keeps its size ×1, shrinks to fit; line pitch 1.2 cap heights |
| accent | Sora Regular | as written | -0.01 em | lead-ins |  |
| body | Inter Medium | as written | -0.01 em | running text, captions | 38 characters a line; line pitch 2.7 x-heights |
| label | Inter Bold | caps | 0.16 em | eyebrows, counters, fact labels |  |
| code | JetBrains Mono Regular | as written | 0 em | code |  |

Every face is scaled to the engine's reference face (cap height 0.7 em for headlines and labels, the x-height for body
text and lead-ins), so a size means the same in every style.

## Colour

| Name | Value | Role |
|---|---|---|
| base | #07061A | the dark ground |
| text / textSoft | #FFFFFF / #C4C0F2 | type on dark: headlines / step-back |
| ink / inkSoft | #120F2E / #5F5A8F | type on light: headlines / step-back |
| win | #6EF2D1 | the win, the after, the pick |
| friction | #FF7A9A | the friction, the before |
| violet | #8B5CF6 | hero colour option |
| blue | #3B82F6 | hero colour option |
| pink | #EC4899 | hero colour option |
| amber | #FBBF24 | hero colour option |

Hero rotation, one per video: `win`, `amber` and `pink`.

## Grounds

- **Dark** (the default): #07061A, drifting colour fields filling the frame and a vignette.
- **Light**: #F3F1FF and drifting colour fields filling the frame.

Scenes are centred, with 100 px side margins, the stack starting
250 px down.

## Cards

- On dark: #1B1840, flat, 40 px corners, a soft shadow 30 px down.
- On light: #FFFFFF, flat, 40 px corners, a soft shadow 30 px down.

## Signature

- Cards: frosted glass cards with a bright edge.
- The hero word and the winning number: glowing in the hero colour.
- Icons: duotone icons (the list and before/after scenes take an `icon`).
- Arrivals: lines rise out of a blur.

## Captions

Inter Bold at 50 px, a hard shadow, on a frosted glass pill, centred in the lane at y 1470. The key word: it's set in Inter ExtraBold in the hero colour at 50 px.

## The presenter

- **Full frame**: the presenter's room filling the frame, the only layout that punches in.
- **The half band**: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, its top edge feathered over 90 px; captions ride that top edge.
- **The tile**: the camera in a square tile, the eye line on its upper third, with 56 px corners and a 2 px rgba(255,255,255,0.4) ring.

## Motion

- Arrivals: each line over 20 frames, 4 frames apart, rising 40 px (bezier 0.16, 1, 0.3, 1).
- The landing spring: frequency 0.32 a frame, damping 0.78 (a little overshoot).
- Punch-in: 5% over 10 frames.
- Joins: cut; blur: the old shot blurs away as the new one comes into focus, over 14 frames.
- Captions: each line comes up out of a blur.
