# Ledger: scenes

The scenes a Ledger plan can use, their props, and how each one comes out in Ledger. Generated from the scene catalogue
(`src/reel/scenes.json`) and `src/packs/ledger.json`. The engine gives a scene the presenter (`shoot` and `at`)
itself, so never put those in props; nor `sub`: captions are the plan's.

## title

A lead-in, two or three headline lines with one word in the hero colour (it lands on the pack's spring), and the presenter in the half band below when the plan has a shoot.

**Use it for:** The hook, and the start of a new section.

**In Ledger:**

- Lines in EB Garamond Bold, in the case you write, set left; the lead-in in EB Garamond Regular.
- Ledger's fit rule fills the measure: every headline line sets 82% of the stack's width whatever its size, so a short line sets huge and a long one small. Keep the lines of a stack about the same length; `sizes` hardly matter.
- The hero word lands on Ledger's spring, with no overshoot.
- With a shoot, the presenter sits in the half band: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, with a hard top edge and a 3 px rule in ink (#141414) along it; captions ride that top edge.

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

**In Ledger:**

- `full`: the presenter's room filling the frame, the only layout that punches in.
- `halfBand`: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, with a hard top edge and a 3 px rule in ink (#141414) along it; captions ride that top edge.
- `tile`: the camera in a square tile, the eye line on its upper third, with 4 px corners and a 3 px #141414 ring.
- A punch is 4% over 8 frames; punch only on payoffs, at most once a shot.
- The heading (`label`, `head`) is set left; `head` follows the fit rule: it fills the measure, so one short word sets very large.

| Prop | Type | | What |
|---|---|---|---|
| `layout` | `"full" \| "halfBand" \| "tile"` | required | The presenter layout; Ledger uses `full`, `halfBand` or `tile`. |
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

**In Ledger:**

- The counter in JetBrains Mono Regular, the name in EB Garamond Bold in the case you write, the line in Newsreader Regular, all set left.
- The card: 4 px corners, a fine ring; the win fact sits on a box in the hero colour.

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
{"scene":"list","frames":98,"in":"wipe","props":{"index":1,"of":5,"kind":"Mod","name":"Token Ledger","line":"Every turn's cost, live, in the status line.","facts":[{"k":"Context used","v":"41%"},{"k":"Tokens saved","v":"128k","win":true},{"k":"Turns","v":"17"}]}}
```

## stat

Before and after: a lead-in and a headline, a short paragraph, then a card with the old number struck through and the new one in the hero colour. Graphic only.

**Use it for:** A number that changed: a cost, a time, a count. The payoff of a claim.

**In Ledger:**

- The paragraph breaks at about 46 characters a line in Newsreader Regular: keep it under about 138 characters, three lines.
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
{"scene":"stat","frames":120,"props":{"lead":"What it costs you","title":"Per month","text":"Same tools and the same team. The bill went from a line on every invoice to nothing at all.","before":{"k":"Before","v":"$240"},"after":{"k":"After","v":"$0"}}}
```

## quote

A quote: the words in the headline voice, one size for every line, the open and close marks in the hero colour, the name and role under it. Graphic only; its words are on screen, so captions hide.

**Use it for:** Someone else's words: a customer, a review, a line from a source.

**In Ledger:**

- In EB Garamond Bold, in the case you write, one size for every line (the longest line sets it), set left. Keep the lines about the same length.

| Prop | Type | | What |
|---|---|---|---|
| `lines` | `string[]` | required | The quote broken by hand into 2 to 4 lines of about 15 to 20 characters, at the breaths. |
| `name` | `string` | required | Who said it. |
| `role` | `string` | required | Their role and company, or where it was said. |
| `theme` | `"dark" \| "light"` |  | The ground; leave it out for the pack's. |

A shot:

```json
{"scene":"quote","frames":98,"in":"wipe","props":{"lines":["Invoicing took my","whole Friday. Now","it runs overnight."],"name":"Client name","role":"Founder · Their company"}}
```

## chart (Ledger's own)

An editorial chart on the page: a lead-in and a headline, a hairline rule drawn across, then two to five bars drawn in one after another from a hairline axis, each value counting up at its bar's end, the bar that matters in the hero colour, and a source line. Graphic only.

**Use it for:** Numbers worth comparing: before and after, this against that, a ranking. The evidence behind a claim, shown rather than said.

**In Ledger:**

- Set on the page, set left, no card: the lead-in in EB Garamond Regular, the headline in EB Garamond Bold by the fit rule, a rule drawn across, then the bars from a hairline axis.
- Bars are a quiet tint of the type and the `win` bar the hero colour; each value is set in EB Garamond Bold at its bar's end and counts up as the bar draws (the number inside `label` counts, so write it as shown: $240, 12 h, 1,200). A bar at 0 is a tick on the axis.
- With two bars, the change from the first to the second is set at the far end of the second row (−100%).
- The bars draw one after another from about frame 18, 38 frames each; hold the shot at least 2.5 s so the last value settles.

| Prop | Type | | What |
|---|---|---|---|
| `lead` | `string` | required | The lead-in: what's measured, 2 to 5 words. |
| `title` | `string` | required | The headline, 1 to 3 words: the unit or the frame (Per month, Hours a week). |
| `bars` | `{ k: string, v: number, label: string, win?: true }[]` | required | Two to five bars, in the order they draw: a name, the number that sets the bar's length, and the value as shown ($240, 12 h). Mark the one that matters `win: true`. |
| `source` | `string` |  | Where the numbers come from, set small under the chart: Source: my invoices, January to June. |
| `theme` | `"dark" \| "light"` |  | The ground; leave it out for the pack's. |

A shot:

```json
{"scene":"chart","frames":120,"props":{"lead":"What it costs you","title":"Per month","bars":[{"k":"Before","v":240,"label":"$240"},{"k":"After","v":0,"label":"$0","win":true}],"source":"Source: my invoices, January to June"}}
```

## Not in Ledger

- `word-pop`: a scene type other styles bring; the engine refuses it in Ledger.
- `slam`: a scene type other styles bring; the engine refuses it in Ledger.
- `doodle`: a scene type other styles bring; the engine refuses it in Ledger.
- `command`: a scene type other styles bring; the engine refuses it in Ledger.
- `float`: a scene type other styles bring; the engine refuses it in Ledger.
- `sticker`: a scene type other styles bring; the engine refuses it in Ledger.
