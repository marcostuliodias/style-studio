# Ledger: the look

What the engine draws in Ledger, from `src/packs/ledger.json`. You never set any of it; it's here so you know what
the stills should show. A quiet editorial style: EB Garamond headlines set left on warm newsprint, Newsreader text, mono labels, hairline cards, subtitles on a pill, one red accent, slow and exact motion with no overshoot.

## Type

| Voice | Face | Case | Tracking | Used for | Layout |
|---|---|---|---|---|---|
| display | EB Garamond Bold | as written | -0.01 em | headlines, quotes, the caption key word | fills 82% of the measure; line pitch 1.45 cap heights |
| accent | EB Garamond Regular | as written | 0 em | lead-ins |  |
| body | Newsreader Regular | as written | 0 em | running text, captions in Newsreader Medium | 46 characters a line; line pitch 3.1 x-heights |
| label | JetBrains Mono Regular | caps | 0.12 em | eyebrows, counters, fact labels |  |
| code | JetBrains Mono Regular | as written | 0 em | code |  |

Every face is scaled to the engine's reference face (cap height 0.7 em for headlines and labels, the x-height for body
text and lead-ins), so a size means the same in every style.

## Colour

| Name | Value | Role |
|---|---|---|
| base | #121212 | the dark ground |
| text / textSoft | #F2EEE6 / #B8B2A6 | type on dark: headlines / step-back |
| ink / inkSoft | #141414 / #6B665E | type on light: headlines / step-back |
| win | #D7261E | the win, the after, the pick |
| friction | #8A8478 | the friction, the before |
| blue | #1F4FD8 | hero colour option |
| ochre | #B9861A | hero colour option |
| green | #1E7A4C | hero colour option |

Hero rotation, one per video: `win`, `blue`, `ochre` and `green`.

## Grounds

- **Dark**: flat #121212.
- **Light** (the default): #F4F1EA, a 30 px dot pattern in #141414 at 7% and a vignette.

Scenes are set left, with 110 px side margins, the stack starting
230 px down.

## Cards

- On dark: #1C1C1C, flat, 4 px corners, a 1 px ring, a hard shadow 2 px down.
- On light: #FFFFFF, flat, 4 px corners, a 1 px ring, a hard shadow 3 px down.

## Signature

- Cards: lit solid cards.
- The hero word and the winning number: set in the hero colour.
- Icons: no icons.
- Arrivals: lines rise in.

## Captions

Newsreader Medium at 44 px, on a pill, centred in the lane at y 1480. The key word: it's set in EB Garamond Bold in win (#D7261E) at 50 px.

## The presenter

- **Full frame**: the presenter's room filling the frame, the only layout that punches in.
- **The half band**: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, with a hard top edge and a 3 px rule in ink (#141414) along it; captions ride that top edge.
- **The tile**: the camera in a square tile, the eye line on its upper third, with 4 px corners and a 3 px #141414 ring.

## Motion

- Arrivals: each line over 24 frames, 6 frames apart, rising 24 px (bezier 0.25, 0.1, 0.25, 1).
- The landing spring: frequency 0.28 a frame, damping 0.85 (no overshoot).
- Punch-in: 4% over 8 frames.
- Joins: cut; ease: the new shot rises 24 px over 12 frames while the old one sinks back 1%; wipe: the new shot wipes in from the right behind a rule in ink (#141414) while the old one drifts left, over 16 frames.
- Captions: each line rises in softly.
