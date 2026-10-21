# Sketch: scenes

The scenes a Sketch plan can use, their props, and how each one comes out in Sketch. Generated from the scene catalogue
(`src/reel/scenes.json`) and `src/packs/sketch.json`. The engine gives a scene the presenter (`shoot` and `at`)
itself, so never put those in props; nor `sub`: captions are the plan's.

## title

A lead-in, two or three headline lines with one word in the hero colour (it lands on the pack's spring), and the presenter in the half band below when the plan has a shoot.

**Use it for:** The hook, and the start of a new section.

**In Sketch:**

- Lines in Caveat Bold, in the case you write, set left; the lead-in in Caveat Regular.
- Sketch's fit rule keeps a line's size (times 1.3) and only shrinks one that would run past the measure, so `sizes` set the hierarchy: about 260 for a one-word punch line, 110 to 160 for a longer one.
- The hero word lands on Sketch's spring, with a little overshoot.
- With a shoot, the presenter sits in the half band: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, under a torn paper edge; captions ride that top edge.

| Prop | Type | | What |
|---|---|---|---|
| `lead` | `string` | required | The lead-in, set in the accent voice: the set-up, 2 to 5 words. |
| `lines` | `{ t: string, hero?: true }[][]` | required | Two or three headline lines of 1 to 3 words each, as words. Mark the one word that matters `hero: true`. |
| `sizes` | `number[]` | required | A reference size per line (a size of 100 is a cap height of 70 px). |
| `theme` | `"dark" \| "light"` |  | The ground; leave it out for the pack's. |

A shot:

```json
{"scene":"title","frames":103,"props":{"lead":"Claude Code just got","lines":[[{"t":"Mods"}],[{"t":"5","hero":true},{"t":"to install now"}]],"sizes":[260,110]}}
```

## talk

The presenter talking, in one of the pack's layouts: full frame on their room, the half band under a heading, or a tile under a heading.

**Use it for:** Most of a video: whenever the words carry the beat and no graphic would prove the point better.

**In Sketch:**

- `full`: the presenter's room filling the frame, the only layout that punches in.
- `halfBand`: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, under a torn paper edge; captions ride that top edge.
- `tile`: the camera in a square tile, the eye line on its upper third, with 4 px corners and a 12 px white ring.
- A punch is 8% over 4 frames; punch on stressed words.
- The heading (`label`, `head`) is set left; `head` follows the fit rule: it keeps its size and shrinks only to fit.

| Prop | Type | | What |
|---|---|---|---|
| `layout` | `"full" \| "halfBand" \| "tile"` | required | The presenter layout; Sketch uses `full`, `halfBand` or `tile`. |
| `punches` | `number[]` |  | Full frame only: frames inside the shot where the frame punches in, then back out at the next one, and so on, on the pack's punch-in. |
| `label` | `string` |  | Half band and tile only: an eyebrow over the heading, 1 to 4 words. |
| `head` | `string` |  | Half band and tile only: one headline line held over the presenter, 1 to 3 words: the point being made. |
| `theme` | `"dark" \| "light"` |  | Half band and tile only: the ground above the presenter. |

A shot:

```json
{"scene":"talk","frames":93,"props":{"layout":"full","punches":[72]}}
```

## list

One item of a list: where it is in the list, its name, a line on what it does, and a card of facts with the one that matters in the hero colour. Graphic only.

**Use it for:** Each item of a list video (tools, steps, mistakes), when the item has a name and two to four facts worth showing.

**In Sketch:**

- The counter in Virgil Regular, the name in Caveat Bold in the case you write, the line in Virgil Regular, all set left.
- The card: 4 px corners; the win fact sits on a box in the hero colour.

| Prop | Type | | What |
|---|---|---|---|
| `index` | `number` | required | This item's number, from 1. |
| `of` | `number` | required | How many items the list has. |
| `kind` | `string` | required | The word before the counter: Tool, Step, Mod, Mistake. |
| `name` | `string` | required | The item's name, 1 or 2 words. |
| `line` | `string` | required | What it does, one short sentence (under about 50 characters). |
| `facts` | `{ k: string, v: string, win?: true }[]` | required | Two to four rows of a label and a short value; mark the one that matters `win: true`. |
| `icon` | `string` |  | An icon by name, drawn in the pack's icon style when it has one: bolt, clock, coin, chart, trend, spark, check, chat, code, star, heart, gauge, eye, target, layers, play, user, mail, lock. |
| `theme` | `"dark" \| "light"` |  | The ground; leave it out for the pack's. |

A shot:

```json
{"scene":"list","frames":73,"in":"wipe","props":{"index":1,"of":5,"kind":"Mod","name":"Token Ledger","line":"Every turn's cost, live, in the status line.","facts":[{"k":"Context used","v":"41%"},{"k":"Tokens saved","v":"128k","win":true},{"k":"Turns","v":"17"}],"icon":"gauge"}}
```

## stat

Before and after: a lead-in and a headline, a short paragraph, then a card with the old number struck through and the new one in the hero colour. Graphic only.

**Use it for:** A number that changed: a cost, a time, a count. The payoff of a claim.

**In Sketch:**

- The paragraph breaks at about 34 characters a line in Virgil Regular: keep it under about 102 characters, three lines.
- The old number is struck through in the step-back colour; the new one is in the hero colour.

| Prop | Type | | What |
|---|---|---|---|
| `lead` | `string` | required | The lead-in: what the number is, 2 to 5 words. |
| `title` | `string` | required | The headline, 1 to 3 words: the unit or the frame (Per month, Every week). |
| `text` | `string` | required | A short paragraph the engine breaks to the pack's measure: two or three lines. |
| `before` | `{ k: string, v: string }` | required | The old number: a label and the value (struck through). |
| `after` | `{ k: string, v: string }` | required | The new number: a label and the value (in the hero colour). |
| `icon` | `string` |  | An icon by name, drawn in the pack's icon style when it has one: bolt, clock, coin, chart, trend, spark, check, chat, code, star, heart, gauge, eye, target, layers, play, user, mail, lock. |
| `theme` | `"dark" \| "light"` |  | The ground; leave it out for the pack's. |

A shot:

```json
{"scene":"stat","frames":113,"props":{"lead":"What it costs you","title":"Per month","text":"Same tools and the same team. The bill went from a line on every invoice to nothing at all.","before":{"k":"Before","v":"$240"},"after":{"k":"After","v":"$0"},"icon":"coin"}}
```

## quote

A quote: the words in the headline voice, one size for every line, the open and close marks in the hero colour, the name and role under it. Graphic only; its words are on screen, so captions hide.

**Use it for:** Someone else's words: a customer, a review, a line from a source.

**In Sketch:**

- In Caveat Bold, in the case you write, one size for every line (the longest line sets it), set left. Keep the lines about the same length.

| Prop | Type | | What |
|---|---|---|---|
| `lines` | `string[]` | required | The quote broken by hand into 2 to 4 lines of about 15 to 20 characters, at the breaths. |
| `name` | `string` | required | Who said it. |
| `role` | `string` | required | Their role and company, or where it was said. |
| `theme` | `"dark" \| "light"` |  | The ground; leave it out for the pack's. |

A shot:

```json
{"scene":"quote","frames":93,"in":"wipe","props":{"lines":["Invoicing took my","whole Friday. Now","it runs overnight."],"name":"Client name","role":"Founder · Their company"}}
```

## doodle (Sketch's own)

The presenter full frame with the whiteboard drawn onto the footage: a scrap of paper taped above their head with a few handwritten words (the key one on the marker), an arrow drawn from it down to the side of their head, and three strokes of emphasis by the other ear. It never crosses the face; captions run under it.

**Use it for:** A verdict, a reaction or the one thing to remember while the presenter talks: the hook's payoff, the 'wait, what', the takeaway. It keeps the face on screen and puts the style on it.

**In Sketch:**

- The note in Caveat Bold on a scrap of paper with a hand-drawn border and a strip of tape, leaning, above the head; `*word*` sits on a marker in the hero colour. Keep it to about 16 characters or it sets smaller.
- About 8 frames after `from` an arrow is drawn from the note down to the side of the head, and the hero-coloured strokes of emphasis follow; all of it wobbles and redraws the signature's way.
- It shows the presenter full frame (no punch-ins) and the captions run under it as usual.

| Prop | Type | | What |
|---|---|---|---|
| `note` | `string` | required | 1 to 4 handwritten words, about 16 characters at most; `*word*` puts one on the marker. The gist, not the caption: = basically *cheating*. |
| `side` | `"left" \| "right"` |  | Which side of the head the note leans to and the arrow points at (default: the side with more room). |
| `from` | `number` |  | The frame inside the shot where the note lands, on the words it sums up (default 4); the arrow follows it. |

A shot:

```json
{"scene":"doodle","frames":82,"props":{"note":"*unfair* advantage","from":41}}
```

## Not in Sketch

- `word-pop`: a scene type other styles bring; the engine refuses it in Sketch.
- `slam`: a scene type other styles bring; the engine refuses it in Sketch.
- `chart`: a scene type other styles bring; the engine refuses it in Sketch.
- `command`: a scene type other styles bring; the engine refuses it in Sketch.
- `float`: a scene type other styles bring; the engine refuses it in Sketch.
- `sticker`: a scene type other styles bring; the engine refuses it in Sketch.
