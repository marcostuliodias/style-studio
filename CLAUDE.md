# The style-pack engine

A Remotion engine that edits talking-head shorts in an editing style. Each style is a pack, `src/packs/<id>.json`, and
an editing skill written from it, `skills/<id>/SKILL.md`: six ship with the engine (volt, ledger, sketch, terminal,
glass, pop), and a style made in Style Studio adds its own pair when its download is unzipped here.

When you're asked to edit, plan or render a video in a style, find its skill in `skills/`: the folder is the style's
id (`my-volt`), and its SKILL.md names the style in its first heading ("My Volt: editing skill"). Read that SKILL.md
in full and follow it; it says what you need from the creator, how to plan the shots, and which commands check and
render the plan. If the style they name isn't in `skills/`, say so and list the ones that are, rather than editing in
another style.

Run every command from this folder. Footage goes in `public/footage/<video>/` and plans in `plans/`; both stay out of
git. Renders land in `out/`.
