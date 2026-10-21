"""Put the board's stills side by side, one row per pack: python scripts/sheet.py [out/stills] [out/sheet.jpg]

Reads out/stills/<pack>/<scene>-f<frame>.png (scripts/render-stills.mjs); a scene a pack doesn't bring shows as a gap.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

src = sys.argv[1] if len(sys.argv) > 1 else 'out/stills'
dst = sys.argv[2] if len(sys.argv) > 2 else 'out/sheet.jpg'
packs = sorted(d for d in os.listdir(src) if os.path.isdir(os.path.join(src, d)))
names = sorted({f for p in packs for f in os.listdir(os.path.join(src, p)) if f.endswith('.png')}, key=lambda n: ['title', 'list', 'stat', 'quote', 'wordpop'].index(n.split('-')[0]) if n.split('-')[0] in ['title', 'list', 'stat', 'quote', 'wordpop'] else 99)

W, H, pad, gap, head = 360, 640, 28, 12, 44
try:
    font = ImageFont.truetype('segoeuib.ttf', 26)
    small = ImageFont.truetype('segoeui.ttf', 22)
except OSError:
    font = small = ImageFont.load_default()

sheet = Image.new('RGB', (pad * 2 + 120 + len(names) * (W + gap), pad + len(packs) * (H + head) + pad), (24, 24, 26))
d = ImageDraw.Draw(sheet)
for r, p in enumerate(packs):
    y = pad + r * (H + head)
    d.text((pad, y + head + H // 2 - 14), p, fill=(235, 235, 235), font=font)
    for c, n in enumerate(names):
        x = pad + 120 + c * (W + gap)
        if r == 0:
            d.text((x, pad - 4), n.split('-')[0], fill=(170, 170, 176), font=small)
        f = os.path.join(src, p, n)
        if os.path.exists(f):
            sheet.paste(Image.open(f).convert('RGB').resize((W, H), Image.LANCZOS), (x, y + head))
        else:
            d.rectangle([x, y + head, x + W, y + head + H], outline=(70, 70, 76), width=2)
            d.text((x + 20, y + head + H // 2 - 12), 'not in this pack', fill=(120, 120, 126), font=small)
sheet.save(dst, quality=90)
print(dst, sheet.size)
