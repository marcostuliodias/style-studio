# Glass: scenes

The scenes a Glass plan can use, their props, and how each one comes out in Glass. Generated from the scene catalogue
(`src/reel/scenes.json`) and `src/packs/glass.json`. The engine gives a scene the presenter (`shoot` and `at`)
itself, so never put those in props; nor `sub`: captions are the plan's.

## title

A lead-in, two or three headline lines with one word in the hero colour (it lands on the pack's spring), and the presenter in the half band below when the plan has a shoot.

**Use it for:** The hook, and the start of a new section.

**In Glass:**

- Lines in Sora Bold, in the case you write, centred; the lead-in in Sora Regular.
- Glass's fit rule keeps a line's size (times 1) and only shrinks one that would run past the measure, so `sizes` set the hierarchy: about 260 for a one-word punch line, 110 to 160 for a longer one.
- The hero word lands on Glass's spring, with a little overshoot.
- With a shoot, the presenter sits in the half band: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, its top edge feathered over 90 px; captions ride that top edge.

| Prop | Type | | What |
|---|---|---|---|
| `lead` | `string` | required | The lead-in, set in the accent voice: the set-up, 2 to 5 words. |
| `lines` | `{ t: string, hero?: true }[][]` | required | Two or three headline lines of 1 to 3 words each, as words. Mark the one word that matters `hero: true`. |
| `sizes` | `number[]` | required | A reference size per line (a size of 100 is a cap height of 70 px). |
| `theme` | `"dark" \| "light"` |  | The ground; leave it out for the pack's. |

A shot:

```json
{"scene":"title","frames":109,"props":{"lead":"Claude Code just got","lines":[[{"t":"Mods"}],[{"t":"5","hero":true},{"t":"to install now"}]],"sizes":[260,110]}}
```

## talk

The presenter talking, in one of the pack's layouts: full frame on their room, the half band under a heading, or a tile under a heading.

**Use it for:** Most of a video: whenever the words carry the beat and no graphic would prove the point better.

**In Glass:**

- `full`: the presenter's room filling the frame, the only layout that punches in.
- `halfBand`: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, its top edge feathered over 90 px; captions ride that top edge.
- `tile`: the camera in a square tile, the eye line on its upper third, with 56 px corners and a 2 px rgba(255,255,255,0.4) ring.
- A punch is 5% over 10 frames; punch only on payoffs, at most once a shot.
- The heading (`label`, `head`) is centred; `head` follows the fit rule: it keeps its size and shrinks only to fit.

| Prop | Type | | What |
|---|---|---|---|
| `layout` | `"full" \| "halfBand" \| "tile"` | required | The presenter layout; Glass uses `full`, `halfBand` or `tile`. |
| `punches` | `number[]` |  | Full frame only: frames inside the shot where the frame punches in, then back out at the next one, and so on, on the pack's punch-in. |
| `label` | `string` |  | Half band and tile only: an eyebrow over the heading, 1 to 4 words. |
| `head` | `string` |  | Half band and tile only: one headline line held over the presenter, 1 to 3 words: the point being made. |
| `theme` | `"dark" \| "light"` |  | Half band and tile only: the ground above the presenter. |

A shot:

```json
{"scene":"talk","frames":65,"props":{"layout":"full","punches":[54]}}
```

## list

One item of a list: where it is in the list, its name, a line on what it does, and a card of facts with the one that matters in the hero colour. Graphic only.

**Use it for:** Each item of a list video (tools, steps, mistakes), when the item has a name and two to four facts worth showing.

**In Glass:**

- The counter in Inter Bold, the name in Sora Bold in the case you write, the line in Inter Medium, all centred.
- The card: 40 px corners; the win fact sits on a box in the hero colour.

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
{"scene":"list","frames":105,"props":{"index":1,"of":5,"kind":"Mod","name":"Token Ledger","line":"Every turn's cost, live, in the status line.","facts":[{"k":"Context used","v":"41%"},{"k":"Tokens saved","v":"128k","win":true},{"k":"Turns","v":"17"}]}}
```

## stat

Before and after: a lead-in and a headline, a short paragraph, then a card with the old number struck through and the new one in the hero colour. Graphic only.

**Use it for:** A number that changed: a cost, a time, a count. The payoff of a claim.

**In Glass:**

- The paragraph breaks at about 38 characters a line in Inter Medium: keep it under about 114 characters, three lines.
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
{"scene":"stat","frames":120,"in":"blur","props":{"lead":"What it costs you","title":"Per month","text":"Same tools and the same team. The bill went from a line on every invoice to nothing at all.","before":{"k":"Before","v":"$240"},"after":{"k":"After","v":"$0"},"icon":"coin"}}
```

## quote

A quote: the words in the headline voice, one size for every line, the open and close marks in the hero colour, the name and role under it. Graphic only; its words are on screen, so captions hide.

**Use it for:** Someone else's words: a customer, a review, a line from a source.

**In Glass:**

- In Sora Bold, in the case you write, one size for every line (the longest line sets it), centred. Keep the lines about the same length.

| Prop | Type | | What |
|---|---|---|---|
| `lines` | `string[]` | required | The quote broken by hand into 2 to 4 lines of about 15 to 20 characters, at the breaths. |
| `name` | `string` | required | Who said it. |
| `role` | `string` | required | Their role and company, or where it was said. |
| `theme` | `"dark" \| "light"` |  | The ground; leave it out for the pack's. |

A shot:

```json
{"scene":"quote","frames":98,"in":"blur","props":{"lines":["Invoicing took my","whole Friday. Now","it runs overnight."],"name":"Client name","role":"Founder · Their company"}}
```

## float (Glass's own)

The presenter full frame with the focus pulled gently off them, soft and barely darker, while a card of the pack's surface floats up in front of them, breathing: a headline over a big number (the old one struck out beside it), or over two or three facts. The card stands on the caption lane, over the mouth and chest and never above the eye line, so the eyes stay in the shot above it; captions run under it.

**Use it for:** A number, or a list item's few facts, while the presenter keeps talking: the card carries the point and the person stays on screen. The style's way to show a figure or a tool without cutting away from the face.

**In Glass:**

- The footage pulls gently out of focus over about 16 frames (soft, not gone) and pushes in slowly; the card is a frosted glass card with a bright edge, standing on the caption lane over the mouth and chest, never above the eye line, and breathing up and down.
- The lead-in in Sora Regular beside the icon, the headline in Sora Bold; `value` large under it, glowing in the hero colour, with `was` struck out beside it; or `facts` as rows, the `win` one in the hero colour.
- Give it `value` or `facts`, not both, and keep it short: a headline and a number, or two or three facts. A taller card is drawn smaller to stay under the eyes. The captions run under it over the soft footage.

| Prop | Type | | What |
|---|---|---|---|
| `title` | `string` | required | The card's headline, 1 to 3 words: what the number or the facts are. |
| `lead` | `string` |  | A lead-in over the headline, 2 to 5 words. |
| `value` | `string` |  | A big number under the headline, in the hero colour, up to about 6 characters ($0, 3x). Give this or facts. |
| `was` | `string` |  | With value: the old number, struck out beside it ($240). |
| `facts` | `{ k: string, v: string, win?: true }[]` |  | Instead of value: two or three rows of a label and a short value (a fourth makes the card smaller, to keep it under the eyes); mark the one that matters `win: true`. |
| `icon` | `string` |  | An icon by name, drawn in the pack's icon style when it has one: bolt, clock, coin, chart, trend, spark, check, chat, code, star, heart, gauge, eye, target, layers, play, user, mail, lock. |

A shot:

```json
{"scene":"float","frames":98,"props":{"lead":"Mod 1 of 5","title":"Token Ledger","facts":[{"k":"Context used","v":"41%"},{"k":"Tokens saved","v":"128k","win":true}],"icon":"gauge"}}
```

## Not in Glass

- `word-pop`: a scene type other styles bring; the engine refuses it in Glass.
- `slam`: a scene type other styles bring; the engine refuses it in Glass.
- `chart`: a scene type other styles bring; the engine refuses it in Glass.
- `doodle`: a scene type other styles bring; the engine refuses it in Glass.
- `command`: a scene type other styles bring; the engine refuses it in Glass.
- `sticker`: a scene type other styles bring; the engine refuses it in Glass.
