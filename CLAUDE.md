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
video has to arrive cut. If they have no word timings, offer to make them with Whisper: `pip install -U openai-whisper`,
then `whisper public/footage/<video>/plate.mp4 --model small --word_timestamps True --output_format json --output_dir
public/footage/<video>` (it writes `plate.json` there, a time for every word).

Run every command from this folder. The cut video goes in `public/footage/<video>/plate.mp4` (the skill's commands use
that name) and plans in `plans/`; both stay out of git. Renders land in `out/`. The board (`npm run studio`, board
stills) and the skills' example plans play demo footage that isn't in this folder: any landscape talking-head clip at
`public/footage/demo/plate.mp4`, its face measured in `src/board/demo-shoot.json`.
