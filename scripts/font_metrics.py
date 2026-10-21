"""Letter metrics for a pack's face.

The engine lays some type out letter by letter (per-letter pops, fitted sizes) from advance widths instead of
measuring in the browser, so the layout is identical on every frame of a render, and it sizes every face by its cap
height or x-height (src/engine/reference.ts). Both come from here:

    python scripts/font_metrics.py <out.json> <weight>=<font file>[@<wght>] [...]

e.g. python scripts/font_metrics.py src/engine/metrics/anton.json 400=public/fonts/volt/Anton-Regular.woff2

Advances are in em. A variable font takes its weight from the wght axis ("400=Newsreader.woff2@400") and every other
axis at its default (src/engine/fonts.ts pins optical sizing, so an opsz face renders at that default). Kerning isn't
read: a face that kerns lays out a touch differently letter by letter than as a whole word, which is close enough for
a per-letter move. Register the file in src/engine/metrics.ts.
"""
import json
import string
import sys

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

CHARS = string.ascii_letters + string.digits + string.punctuation + ' ' + '’‘“”–—…·×£€'


def load(spec):
    path, _, wght = spec.partition('@')
    font = TTFont(path)
    if 'fvar' in font:
        font = instantiateVariableFont(font, {a.axisTag: (float(wght) if a.axisTag == 'wght' and wght else a.defaultValue) for a in font['fvar'].axes})
    return font


def advances(font):
    upm = font['head'].unitsPerEm
    cmap = font.getBestCmap()
    hmtx = font['hmtx']
    return {ch: round(hmtx[cmap[ord(ch)]][0] / upm, 4) for ch in CHARS if ord(ch) in cmap}


def main():
    out_path, *pairs = sys.argv[1:]
    if not pairs:
        sys.exit(__doc__)
    data = {}
    first = None
    for pair in pairs:
        weight, spec = pair.split('=', 1)
        font = load(spec)
        first = first or font
        data[weight] = {'advance': advances(font), 'kern': {}}
    upm = first['head'].unitsPerEm
    os2 = first['OS/2']
    data['capHeight'] = round(getattr(os2, 'sCapHeight', 0) / upm, 4)
    data['xHeight'] = round(getattr(os2, 'sxHeight', 0) / upm, 4)
    data['ascent'] = round(first['hhea'].ascent / upm, 4)
    data['descent'] = round(-first['hhea'].descent / upm, 4)
    with open(out_path, 'w', encoding='utf8') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    w0 = pairs[0].split('=')[0]
    print(f'{out_path}: {", ".join(k for k in data if k[0].isdigit())}, {len(data[w0]["advance"])} glyphs, cap {data["capHeight"]}, x {data["xHeight"]}')


if __name__ == '__main__':
    main()
