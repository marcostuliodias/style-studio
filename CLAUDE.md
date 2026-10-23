# The style-pack engine

A Remotion engine that edits talking-head shorts in an editing style. Each style is a pack, `src/packs/<id>.json`, and
an editing skill written from it, `skills/<id>/SKILL.md`: six ship with the engine (volt, ledger, sketch, terminal,
glass, pop), and a style made in Style Studio adds its own pair when its download is unzipped here.

When you're asked to edit, plan or render a video in a style, find its skill in `skills/`: the folder is the style's
id (`my-volt`), and its SKILL.md names the style in its first heading ("My Volt: editing skill"). Read that SKILL.md
in full and follow it; it says what you need from the creator, how to plan the shots, and which commands check and
render the plan. If the style they name isn't in `skills/`, say so and list the ones that are, rather than editing in
another style.

Before the first step, check that `ffmpeg` and `ffprobe` run, and ask the creator for whatever the skill's "What you
need" lists that you don't have yet. The video can be raw and anywhere on the disk: `node scripts/importar.mjs <file>
--nome <video>` brings it in as `public/footage/<video>/original.mp4`, and `node scripts/limpar.mjs
public/footage/<video>/original.mp4` transcribes it with a time for every word (faster-whisper, through the Python in
`.whisper-python` at this root or any Python that has it), takes out silences, pauses, stutters and retakes, and writes
the cut the engine edits, `plate.mp4`, with its word timings in `plate.json`. The engine itself never cuts footage.

The creator's profile, `plans/perfil.json` (name, @, what they talk about, their photo and their prints with a line
each), is made once with `node scripts/perfil.mjs` and read by every skill: the badge on the opening and the end, a
print as proof, their closing line. When it isn't there yet, the skill makes it before planning the first video.

Between the plan and the render, the skill opens the storyboard (`node scripts/storyboard.mjs plans/<video>.json`): a
local page where the creator approves the plan, picks between the options a shot offers, marks cuts and says what to
change. Wait for the creator there; never approve in their place. What they mark "always" lands in `plans/regras.json`,
and every skill reads that file before planning.

Run every command from this folder. Footage lives in `public/footage/<video>/` (the raw `original.mp4`, the cut
`plate.mp4`, their timings) and plans in `plans/`; both stay out of git. Renders land in `out/`. The board (`npm run studio`, board
stills) and the skills' example plans play demo footage that isn't in this folder: any landscape talking-head clip at
`public/footage/demo/plate.mp4`, its face measured in `src/board/demo-shoot.json`.
