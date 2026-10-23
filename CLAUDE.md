# The style-pack engine

A Remotion engine that edits talking-head shorts in an editing style. Each style is a pack, `src/packs/<id>.json`, and
an editing skill written from it, `skills/<id>/SKILL.md`: six ship with the engine (volt, ledger, sketch, terminal,
glass, pop), and a style made in Style Studio adds its own pair when its download is unzipped here.

When you're asked to edit, plan or render a video in a style, find its skill in `skills/`: the folder is the style's
id (`my-volt`), and its SKILL.md names the style in its first heading ("My Volt: editing skill"). Read that SKILL.md
in full and follow it; it says what you need from the creator, how to plan the shots, and which commands check and
render the plan. If the style they name isn't in `skills/`, say so and list the ones that are, rather than editing in
another style.

Before the first step, check that `ffmpeg` and `ffprobe` run (the skill measures the footage with them), and ask the
creator for whatever the skill's "What you need" lists that you don't have yet. The engine doesn't cut footage, so the
video has to arrive cut. If they have no word timings, make them with `scripts/transcrever.py`: `<python> scripts/transcrever.py
public/footage/<video>/plate.mp4` writes `plate.json` beside it (a time for every word), where `<python>` is the path in
`.whisper-python` at this root (the installer's faster-whisper environment) or any Python with faster-whisper; without
either, `pip install -U openai-whisper` and `whisper plate.mp4 --model small --word_timestamps True --output_format json`.

Between the plan and the render, the skill opens the storyboard (`node scripts/storyboard.mjs plans/<video>.json`): a
local page where the creator approves the plan, picks between the options a shot offers, marks cuts and says what to
change. Wait for the creator there; never approve in their place. What they mark "always" lands in `plans/regras.json`,
and every skill reads that file before planning.

Run every command from this folder. The cut video goes in `public/footage/<video>/plate.mp4` (the skill's commands use
that name) and plans in `plans/`; both stay out of git. Renders land in `out/`. The board (`npm run studio`, board
stills) and the skills' example plans play demo footage that isn't in this folder: any landscape talking-head clip at
`public/footage/demo/plate.mp4`, its face measured in `src/board/demo-shoot.json`.
