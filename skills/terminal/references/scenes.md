# Terminal: scenes

The scenes a Terminal plan can use, their props, and how each one comes out in Terminal. Generated from the scene catalogue
(`src/reel/scenes.json`) and `src/packs/terminal.json`. The engine gives a scene the presenter (`shoot` and `at`)
itself, so never put those in props; nor `sub`: captions are the plan's.

## title

A lead-in, two or three headline lines with one word in the hero colour (it lands on the pack's spring), and the presenter in the half band below when the plan has a shoot.

**Use it for:** The hook, and the start of a new section.

**In Terminal:**

- Lines in VT323 Regular, in caps (the pack sets them; write normal case), set left; the lead-in in JetBrains Mono Regular.
- Terminal's fit rule keeps a line's size (times 1.3) and only shrinks one that would run past the measure, so `sizes` set the hierarchy: about 260 for a one-word punch line, 110 to 160 for a longer one.
- The hero word lands on Terminal's spring, with no overshoot.
- With a shoot, the presenter sits in the half band: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, with a hard top edge and a 3 px rule in the hero colour along it; captions ride that top edge.

| Prop | Type | | What |
|---|---|---|---|
| `lead` | `string` | required | The lead-in, set in the accent voice: the set-up, 2 to 5 words. |
| `lines` | `{ t: string, hero?: true }[][]` | required | Two or three headline lines of 1 to 3 words each, as words. Mark the one word that matters `hero: true`. |
| `sizes` | `number[]` | required | A reference size per line (a size of 100 is a cap height of 70 px). |
| `theme` | `"dark" \| "light"` |  | The ground; leave it out for the pack's. |

A shot:

```json
{"scene":"title","frames":60,"props":{"lead":"O Claude Code ganhou","lines":[[{"t":"Mods"}],[{"t":"5","hero":true},{"t":"para instalar agora"}]],"sizes":[260,110]}}
```

## talk

The presenter talking, in one of the pack's layouts: full frame on their room, the half band under a heading, or a tile under a heading.

**Use it for:** Most of a video: whenever the words carry the beat and no graphic would prove the point better.

**In Terminal:**

- `full`: the presenter's room filling the frame, the only layout that punches in.
- `halfBand`: the camera filling the frame below the graphics to the bottom edge, the eye line on its upper third, with a hard top edge and a 3 px rule in the hero colour along it; captions ride that top edge.
- `tile`: the camera in a square tile, the eye line on its upper third, with 0 px corners and a 2 px #1F7A4A ring.
- A punch is 10% over 1 frames; punch on stressed words.
- The heading (`label`, `head`) is set left; `head` follows the fit rule: it keeps its size and shrinks only to fit.

| Prop | Type | | What |
|---|---|---|---|
| `layout` | `"full" \| "halfBand" \| "tile"` | required | The presenter layout; Terminal uses `full`, `halfBand` or `tile`. |
| `punches` | `number[]` |  | Full frame only: frames inside the shot where the frame punches in, then back out at the next one, and so on, on the pack's punch-in. |
| `label` | `string` |  | Half band and tile only: an eyebrow over the heading, 1 to 4 words. |
| `head` | `string` |  | Half band and tile only: one headline line held over the presenter, 1 to 3 words: the point being made. |
| `theme` | `"dark" \| "light"` |  | Half band and tile only: the ground above the presenter. |

A shot:

```json
{"scene":"talk","frames":44,"props":{"layout":"full"}}
```

## list

One item of a list: where it is in the list, its name, a line on what it does, and a card of facts with the one that matters in the hero colour. Graphic only.

**Use it for:** Each item of a list video (tools, steps, mistakes), when the item has a name and two to four facts worth showing.

**In Terminal:**

- The counter in JetBrains Mono Bold, the name in VT323 Regular in caps (the pack sets them; write normal case), the line in JetBrains Mono Regular, all set left.
- The card: 0 px corners, a fine ring; the win fact sits on a box in the hero colour.

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
{"scene":"list","frames":75,"props":{"index":1,"of":5,"kind":"Mod","name":"Token Ledger","line":"O custo de cada turno, ao vivo, na barra de status.","facts":[{"k":"Contexto usado","v":"41%"},{"k":"Tokens poupados","v":"128k","win":true},{"k":"Turnos","v":"17"}]}}
```

## stat

Before and after: a lead-in and a headline, a short paragraph, then a card with the old number struck through and the new one in the hero colour. Graphic only.

**Use it for:** A number that changed: a cost, a time, a count. The payoff of a claim.

**In Terminal:**

- The paragraph breaks at about 34 characters a line in JetBrains Mono Regular: keep it under about 102 characters, three lines.
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
{"scene":"stat","frames":60,"in":"flash","props":{"lead":"O que te custa","title":"Por mês","text":"Mesmas ferramentas e o mesmo time. A conta foi de uma linha em toda fatura para nada.","before":{"k":"Antes","v":"$240"},"after":{"k":"Depois","v":"$0"},"icon":"coin"}}
```

## quote

A quote: the words in the headline voice, one size for every line, the open and close marks in the hero colour, the name and role under it. Graphic only; its words are on screen, so captions hide.

**Use it for:** Someone else's words: a customer, a review, a line from a source.

**In Terminal:**

- In VT323 Regular, in caps (the pack sets them; write normal case), one size for every line (the longest line sets it), set left. Keep the lines about the same length.

| Prop | Type | | What |
|---|---|---|---|
| `lines` | `string[]` | required | The quote broken by hand into 2 to 4 lines of about 15 to 20 characters, at the breaths. |
| `name` | `string` | required | Who said it. |
| `role` | `string` | required | Their role and company, or where it was said. |
| `theme` | `"dark" \| "light"` |  | The ground; leave it out for the pack's. |

A shot:

```json
{"scene":"quote","frames":85,"in":"glitch","props":{"lines":["Faturar tomava minha","sexta inteira. Agora","roda de madrugada."],"name":"Nome do cliente","role":"Fundador · A empresa dele"}}
```

## print

A screenshot the creator supplied (a DM, a review, a dashboard, a post) on a card of the pack's surface above the presenter in the half band, with an optional lead-in over it. The proof in someone else's pixels.

**Use it for:** Proof the creator has a print of: a client's message, a review, a result on a dashboard, a post that did well. One print per shot; the words about it stay in the captions.

**In Terminal:**


| Prop | Type | | What |
|---|---|---|---|
| `src` | `string` | required | The image, in public/: one of the creator's prints from plans/perfil.json (public/prints/<file>). Pick it by its description. |
| `shape` | `"phone" \| "wide" \| "square"` |  | The print's shape: a phone screenshot (tall, the default), a desktop one (wide) or a square post. It sets the card's size; the image is cropped from its top to fit. |
| `lead` | `string` |  | A lead-in over the print, 2 to 5 words: what it is (O que ela mandou, O resultado do mês). |
| `theme` | `"dark" \| "light"` |  | The ground; leave it out for the pack's. |

A shot:

```json
{"scene":"print","frames":75,"props":{"src":"prints/exemplo.jpg","shape":"wide","lead":"O que o painel mostrou"}}
```

## word-pop (Terminal's own)

Land the spoken line word by word: big words popping in over the speaker, the key word on a coloured box with a quick punch-in, a soft flash and a small shake.

**Use it for:** The line that matters most in a stretch of talk: the hook's payoff, a reveal, a verdict. Its words are the captions, so the caption track hides under it.

**In Terminal:**

- Words in VT323 Regular, in caps, popping in on Terminal's spring, in white or ink, whichever reads on the footage under them (the shoot's `tone`) with an edge in the opposite tone; the key word lands on a box in the hero colour with a quick punch-in, a soft 2-frame flash and a small shake (the scene's `energy`, calm by default).
- Groups of 1 to 2 words, and the key word alone in the last group, held to the end of the shot. Time each word to when it's said.

| Prop | Type | | What |
|---|---|---|---|
| `groups` | `{ from: number, to: number, words: { text: string, at: number, key?: true }[] }[]` | required | The words on screen together, from frame `from` to `to` inside the shot; each word lands at its own frame `at` (when it's said). One key word per shot, usually last and on its own. |
| `size` | `number` |  | The word size (default 170). Lower it for a long word. |
| `y` | `number` |  | Where the words sit, px from the top (default 1340, on the presenter's chest). |

A shot:

```json
{"scene":"word-pop","frames":78,"props":{"groups":[{"from":0,"to":19,"words":[{"text":"e","at":0},{"text":"esse","at":10}]},{"from":19,"to":38,"words":[{"text":"aqui","at":19},{"text":"é","at":29}]},{"from":38,"to":48,"words":[{"text":"basicamente","at":38}]},{"from":48,"to":78,"words":[{"text":"trapaça","at":48,"key":true}]}]}}
```

## command (Terminal's own)

A terminal window types a command at the prompt, then prints its output a line at a time, the line that matters picked out with the pack's mark, and ends on a fresh prompt with the cursor blinking. With a shoot the presenter sits under it in the tile, as a second window.

**Use it for:** Anything a viewer could run, install or set up: the command, and what it prints. A list item told as an install, a result read off the screen.

**In Terminal:**

- A window (a flat terminal panel with a fine border and corner marks) with a title bar, the command and its output in JetBrains Mono Regular, sized so the longest line fits.
- It types the command at about 66 letters a second from about frame 6, then prints a line every 4 frames; the `win` line is inverted: the ground colour on a hero-colour block. A 28-letter command and three lines take about 1.2 s, so hold the shot at least 2 s.
- With a shoot, the presenter sits under it in the tile, in its own window, and the captions run over the tile.

| Prop | Type | | What |
|---|---|---|---|
| `command` | `string` | required | The command as typed, under about 34 characters: claude mods add token-ledger. |
| `output` | `{ t: string, win?: true }[]` | required | Two to five lines it prints, each under about 34 characters; mark the line that matters `win: true`. Plain words read best: resolved 3 packages, tokens saved: 128k. |
| `title` | `string` |  | The window's title (default: the command's first word). |
| `theme` | `"dark" \| "light"` |  | The ground; leave it out for the pack's. |

A shot:

```json
{"scene":"command","frames":60,"in":"glitch","props":{"command":"claude mods add token-ledger","output":[{"t":"✓ token-ledger 1.4 instalado"},{"t":"✓ barra de status ajustada"},{"t":"tokens poupados: 128k","win":true}]}}
```

## Not in Terminal

- `slam`: a scene type other styles bring; the engine refuses it in Terminal.
- `chart`: a scene type other styles bring; the engine refuses it in Terminal.
- `doodle`: a scene type other styles bring; the engine refuses it in Terminal.
- `float`: a scene type other styles bring; the engine refuses it in Terminal.
- `sticker`: a scene type other styles bring; the engine refuses it in Terminal.
