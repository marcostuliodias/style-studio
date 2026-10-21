# Volt: scenes

The scenes a Volt plan can use, their props, and how each one comes out in Volt. Generated from the scene catalogue
(`src/reel/scenes.json`) and `src/packs/volt.json`. The engine gives a scene the presenter (`shoot` and `at`)
itself, so never put those in props; nor `sub`: captions are the plan's.

## title

A lead-in, two or three headline lines with one word in the hero colour (it lands on the pack's spring), and the presenter in the half band below when the plan has a shoot.

**Use it for:** The hook, and the start of a new section.

**In Volt:**

- Lines in Anton Regular, in caps (the pack sets them; write normal case), centred; the lead-in in Inter SemiBold Italic.
- Volt's fit rule keeps a line's size (times 1.35) and only shrinks one that would run past the measure, so `sizes` set the hierarchy: about 260 for a one-word punch line, 110 to 160 for a longer one.
- The hero word lands on Volt's spring, with a bounce.
- With a shoot, the presenter sits in the half band: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, with a hard top edge and a 10 px rule in the hero colour along it; captions ride that top edge.

| Prop | Type | | What |
|---|---|---|---|
| `lead` | `string` | required | The lead-in, set in the accent voice: the set-up, 2 to 5 words. |
| `lines` | `{ t: string, hero?: true }[][]` | required | Two or three headline lines of 1 to 3 words each, as words. Mark the one word that matters `hero: true`. |
| `sizes` | `number[]` | required | A reference size per line (a size of 100 is a cap height of 70 px). |
| `theme` | `"dark" \| "light"` |  | The ground; leave it out for the pack's. |

A shot:

```json
{"scene":"title","frames":45,"props":{"lead":"Claude Code just got","lines":[[{"t":"Mods"}],[{"t":"5","hero":true},{"t":"to install now"}]],"sizes":[260,110]}}
```

## talk

The presenter talking, in one of the pack's layouts: full frame on their room, the half band under a heading, or a tile under a heading.

**Use it for:** Most of a video: whenever the words carry the beat and no graphic would prove the point better.

**In Volt:**

- `full`: the presenter's room filling the frame, the only layout that punches in.
- `halfBand`: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, with a hard top edge and a 10 px rule in the hero colour along it; captions ride that top edge.
- `tile`: the camera in a square tile, the eye line on its upper third, with 44 px corners and a 6 px white ring.
- A punch is 16% over 2 frames; punch on every new caption line.
- The heading (`label`, `head`) is centred; `head` follows the fit rule: it keeps its size and shrinks only to fit.

| Prop | Type | | What |
|---|---|---|---|
| `layout` | `"full" \| "halfBand" \| "tile"` | required | The presenter layout; Volt uses `full`, `halfBand` or `tile`. |
| `punches` | `number[]` |  | Full frame only: frames inside the shot where the frame punches in, then back out at the next one, and so on, on the pack's punch-in. |
| `label` | `string` |  | Half band and tile only: an eyebrow over the heading, 1 to 4 words. |
| `head` | `string` |  | Half band and tile only: one headline line held over the presenter, 1 to 3 words: the point being made. |
| `theme` | `"dark" \| "light"` |  | Half band and tile only: the ground above the presenter. |

A shot:

```json
{"scene":"talk","frames":45,"props":{"layout":"full","punches":[9,27]}}
```

## list

One item of a list: where it is in the list, its name, a line on what it does, and a card of facts with the one that matters in the hero colour. Graphic only.

**Use it for:** Each item of a list video (tools, steps, mistakes), when the item has a name and two to four facts worth showing.

**In Volt:**

- The counter in Inter Bold, the name in Anton Regular in caps (the pack sets them; write normal case), the line in Inter Medium, all centred.
- The card: 28 px corners, a fine ring; the win fact sits on a box in the hero colour.

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
{"scene":"list","frames":60,"in":"zoom","props":{"index":1,"of":5,"kind":"Mod","name":"Token Ledger","line":"Every turn's cost, live, in the status line.","facts":[{"k":"Context used","v":"41%"},{"k":"Tokens saved","v":"128k","win":true},{"k":"Turns","v":"17"}]}}
```

## stat

Before and after: a lead-in and a headline, a short paragraph, then a card with the old number struck through and the new one in the hero colour. Graphic only.

**Use it for:** A number that changed: a cost, a time, a count. The payoff of a claim.

**In Volt:**

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
{"scene":"stat","frames":60,"props":{"lead":"What it costs you","title":"Per month","text":"Same tools and the same team. The bill went from a line on every invoice to nothing at all.","before":{"k":"Before","v":"$240"},"after":{"k":"After","v":"$0"}}}
```

## quote

A quote: the words in the headline voice, one size for every line, the open and close marks in the hero colour, the name and role under it. Graphic only; its words are on screen, so captions hide.

**Use it for:** Someone else's words: a customer, a review, a line from a source.

**In Volt:**

- In Anton Regular, in caps (the pack sets them; write normal case), one size for every line (the longest line sets it), centred. Keep the lines about the same length.

| Prop | Type | | What |
|---|---|---|---|
| `lines` | `string[]` | required | The quote broken by hand into 2 to 4 lines of about 15 to 20 characters, at the breaths. |
| `name` | `string` | required | Who said it. |
| `role` | `string` | required | Their role and company, or where it was said. |
| `theme` | `"dark" \| "light"` |  | The ground; leave it out for the pack's. |

A shot:

```json
{"scene":"quote","frames":45,"in":"zoom","props":{"lines":["Invoicing took my","whole Friday. Now","it runs overnight."],"name":"Client name","role":"Founder · Their company"}}
```

## word-pop (Volt's own)

Land the spoken line word by word: big words popping in over the speaker, the key word on a coloured box with a quick punch-in, a soft flash and a small shake.

**Use it for:** The line that matters most in a stretch of talk: the hook's payoff, a reveal, a verdict. Its words are the captions, so the caption track hides under it.

**In Volt:**

- Words in Anton Regular, in caps, popping in on Volt's spring, in white or ink, whichever reads on the footage under them (the shoot's `tone`) with an edge in the opposite tone; the key word lands on a box in the hero colour with a quick punch-in, a soft 2-frame flash and a small shake (the scene's `energy`, calm by default).
- Groups of 1 to 2 words, and the key word alone in the last group, held to the end of the shot. Time each word to when it's said.

| Prop | Type | | What |
|---|---|---|---|
| `groups` | `{ from: number, to: number, words: { text: string, at: number, key?: true }[] }[]` | required | The words on screen together, from frame `from` to `to` inside the shot; each word lands at its own frame `at` (when it's said). One key word per shot, usually last and on its own. |
| `size` | `number` |  | The word size (default 170). Lower it for a long word. |
| `y` | `number` |  | Where the words sit, px from the top (default 1340, on the presenter's chest). |

A shot:

```json
{"scene":"word-pop","frames":75,"props":{"groups":[{"from":0,"to":18,"words":[{"text":"and","at":0},{"text":"this","at":9}]},{"from":18,"to":36,"words":[{"text":"one","at":18},{"text":"is","at":27}]},{"from":36,"to":45,"words":[{"text":"basically","at":36}]},{"from":45,"to":75,"words":[{"text":"cheating","at":45,"key":true}]}]}}
```

## slam (Volt's own)

One number or word that hits, as big as the frame allows: the old value above it struck out, then the new one slamming down on the spoken word with a shake, a shockwave in the hero colour and the pack's flash, and a short line under it. Graphic only.

**Use it for:** The payoff number: the cost that went to zero, the 10x, the one figure the video exists for. Once or twice a video, never two in a row.

**In Volt:**

- The value in Anton Regular in caps (the pack sets them; write normal case), as wide as the frame allows (up to a cap height of about 570 px), set in the hero colour with a glow; it lands at `at` from almost twice its size on Volt's spring, with a shake, a shockwave and a flash.
- `was` waits above it in the step-back colour and is struck out in friction (#FF3B30) just before `at`; `label` rises in under it in Inter Bold.
- Start the shot about 24 frames before the word that lands it (so `at` is about 24) and hold it about a second after: the presenter carries the set-up before it.

| Prop | Type | | What |
|---|---|---|---|
| `value` | `string` | required | The number or word that lands, up to about 6 characters: $0, 10x, FREE. |
| `was` | `string` |  | The old value, waiting above and struck out just before the new one lands ($240). |
| `label` | `string` |  | A short line under it, 1 to 4 words: per month, saved every week. |
| `at` | `number` |  | The frame inside the shot where the value lands: the word that says it (default 10). |
| `theme` | `"dark" \| "light"` |  | The ground; leave it out for the pack's. |

A shot:

```json
{"scene":"slam","frames":54,"in":"flash","props":{"value":"$0","was":"$240","label":"per month","at":24}}
```

## Not in Volt

- `chart`: a scene type other styles bring; the engine refuses it in Volt.
- `doodle`: a scene type other styles bring; the engine refuses it in Volt.
- `command`: a scene type other styles bring; the engine refuses it in Volt.
- `float`: a scene type other styles bring; the engine refuses it in Volt.
- `sticker`: a scene type other styles bring; the engine refuses it in Volt.
