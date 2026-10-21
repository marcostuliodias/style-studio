# Pop: the look

What the engine draws in Pop, from `src/packs/pop.json`. You never set any of it; it's here so you know what
the stills should show. A neo-brutalist sticker style: Archivo Black headlines and Space Grotesk text on lemon yellow with halftone dots, white cards with thick ink borders and hard shadows, leaning a little, the hero word on a hot-pink block, sticker icons, boxed captions, and springy arrivals with word-pop.

## Type

| Voice | Face | Case | Tracking | Used for | Layout |
|---|---|---|---|---|---|
| display | Archivo Black Regular | as written | -0.025 em | headlines, quotes, word-pop, the caption key word | keeps its size ×1.05, shrinks to fit; line pitch 1.14 cap heights |
| accent | Space Grotesk Bold | as written | -0.01 em | lead-ins |  |
| body | Space Grotesk Regular | as written | -0.01 em | running text, captions | 36 characters a line; line pitch 2.7 x-heights |
| label | Space Grotesk Bold | caps | 0.08 em | eyebrows, counters, fact labels |  |
| code | JetBrains Mono Regular | as written | 0 em | code |  |

Every face is scaled to the engine's reference face (cap height 0.7 em for headlines and labels, the x-height for body
text and lead-ins), so a size means the same in every style.

## Colour

| Name | Value | Role |
|---|---|---|
| base | #141414 | the dark ground |
| text / textSoft | #FFFFFF / #D4D4D4 | type on dark: headlines / step-back |
| ink / inkSoft | #111111 / #3D3D3D | type on light: headlines / step-back |
| win | #FF4D8D | the win, the after, the pick |
| friction | #111111 | the friction, the before |
| blue | #2F6BFF | hero colour option |
| green | #00C26E | hero colour option |
| orange | #FF7A1A | hero colour option |
| violet | #8E5CFF | hero colour option |

Hero rotation, one per video: `win`, `blue`, `green` and `orange`.

## Grounds

- **Dark**: #141414 and printed halftone dots growing toward a corner.
- **Light** (the default): #FFE14D and printed halftone dots growing toward a corner.

Scenes are set left, with 84 px side margins, the stack starting
220 px down.

## Cards

- On dark: #1E1E1E, flat, 22 px corners, a hard shadow 0 px down.
- On light: #FFFFFF, flat, 22 px corners, a hard shadow 0 px down.

## Signature

- Cards: cards with a thick ink border and a hard offset shadow, leaning -2°.
- The hero word and the winning number: on a filled block in the hero colour.
- Icons: sticker icons with a white edge (the list and before/after scenes take an `icon`).
- Arrivals: lines rise in.

## Captions

Space Grotesk Bold at 52 px, in caps, in a white box with an ink border and a hard shadow, centred in the lane at y 1470. The key word: it sits on a box in the hero colour with an ink border, tilted -3°, in Archivo Black Regular.

## The presenter

- **Full frame**: the presenter's room filling the frame, the only layout that punches in.
- **The half band**: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, with a hard top edge and a 10 px rule in #111111 along it; captions ride that top edge.
- **The tile**: the camera in a square tile, the eye line on its upper third, with 24 px corners and a 6 px #111111 ring.

## Motion

- Arrivals: each line over 12 frames, 3 frames apart, rising 70 px (bezier 0.34, 1.56, 0.64, 1).
- The landing spring: frequency 0.5 a frame, damping 0.35 (bouncy).
- Punch-in: 12% over 3 frames.
- Joins: cut; flash: 2 frames of the hero colour over the cut; whip: a whip pan: the old shot flies out to the left, smeared, as the new one flies in, over 8 frames.
- Captions: each line pops in on the spring.
