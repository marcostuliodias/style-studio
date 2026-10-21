# Volt: the look

What the engine draws in Volt, from `src/packs/volt.json`. You never set any of it; it's here so you know what
the stills should show. A loud creator style: Anton caps centred over flat black and a fine grid, Inter Black subtitles with the key word on an electric-yellow box, cool flat cards with a ring, a hard-edged band, snappy springs, hard punch-ins, and word-pop captions.

## Type

| Voice | Face | Case | Tracking | Used for | Layout |
|---|---|---|---|---|---|
| display | Anton Regular | caps | 0.01 em | headlines, quotes, word-pop | keeps its size ×1.35, shrinks to fit; line pitch 1.1 cap heights |
| accent | Inter SemiBold Italic | as written | -0.01 em | lead-ins |  |
| body | Inter Medium | as written | -0.01 em | running text, captions | 38 characters a line; line pitch 2.6 x-heights |
| label | Inter Bold | caps | 0.02 em | eyebrows, counters, fact labels |  |
| code | JetBrains Mono Regular | as written | 0 em | code |  |

Every face is scaled to the engine's reference face (cap height 0.7 em for headlines and labels, the x-height for body
text and lead-ins), so a size means the same in every style.

## Colour

| Name | Value | Role |
|---|---|---|
| base | #0B0B0E | the dark ground |
| text / textSoft | #FFFFFF / #B4B4C0 | type on dark: headlines / step-back |
| ink / inkSoft | #0B0B0E / #55555F | type on light: headlines / step-back |
| win | #FFE600 | the win, the after, the pick |
| friction | #FF3B30 | the friction, the before |
| cyan | #00E5FF | hero colour option |
| pink | #FF2E88 | hero colour option |
| lime | #B6FF00 | hero colour option |
| orange | #FF7A00 | hero colour option |

Hero rotation, one per video: `win`, `cyan`, `pink`, `lime` and `orange`.

## Grounds

- **Dark** (the default): #0B0B0E, a 72 px grid in white at 5%, a glow in the hero colour and a vignette.
- **Light**: #FFFFFF and a 72 px grid in black at 6%.

Scenes are centred, with 90 px side margins, the stack starting
250 px down.

## Cards

- On dark: #1A1A20, flat, 28 px corners, a 2 px ring, a soft shadow 18 px down.
- On light: #F3F3F6, flat, 28 px corners, a 2 px ring, a soft shadow 16 px down.

## Signature

- Cards: lit solid cards.
- The hero word and the winning number: set in the hero colour.
- Icons: no icons.
- Arrivals: lines rise in.

## Captions

Inter Black at 60 px, in caps, a 10 px black outline over footage, a hard shadow, centred in the lane at y 1465. The key word: it sits on a box in the hero colour, tilted -2.5°, in Inter Black.

## The presenter

- **Full frame**: the presenter's room filling the frame, the only layout that punches in.
- **The half band**: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, with a hard top edge and a 10 px rule in the hero colour along it; captions ride that top edge.
- **The tile**: the camera in a square tile, the eye line on its upper third, with 44 px corners and a 6 px white ring.

## Motion

- Arrivals: each line over 12 frames, 2 frames apart, rising 90 px (bezier 0.12, 1, 0.3, 1).
- The landing spring: frequency 0.5 a frame, damping 0.3 (bouncy).
- Punch-in: 16% over 2 frames.
- Joins: cut; zoom-through: the old shot blows past and the new one settles in, over 4 frames; flash: 2 frames of the hero colour over the cut.
- Captions: each line pops in on the spring.
