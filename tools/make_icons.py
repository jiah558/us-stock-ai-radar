#!/usr/bin/env python3
"""Generate PWA icons (radar + rising line) with Pillow. Run once: python tools/make_icons.py"""
import math, os
from PIL import Image, ImageDraw, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "icons"); os.makedirs(OUT, exist_ok=True)
S = 1024

def base(maskable=False):
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    bg = Image.new("RGBA", (S, S))
    px = bg.load()
    for y in range(S):
        for x in range(S):
            t = (x + y) / (2 * S)
            px[x, y] = (int(10 + 14 * t), int(14 + 12 * t), int(28 + 30 * (1 - t)), 255)
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=0 if maskable else 230, fill=255)
    im.paste(bg, (0, 0), mask)
    d = ImageDraw.Draw(im)
    c = S // 2; sc = 0.78 if maskable else 1.0
    R = lambda r: int(r * sc)
    for r, a in [(360, 60), (260, 80), (160, 110)]:
        d.ellipse([c - R(r), c - R(r), c + R(r), c + R(r)], outline=(91, 160, 255, a), width=R(10))
    # sweep
    sweep = Image.new("RGBA", (S, S), (0, 0, 0, 0)); sd = ImageDraw.Draw(sweep)
    sd.pieslice([c - R(360), c - R(360), c + R(360), c + R(360)], 250, 310, fill=(34, 211, 238, 70))
    im.alpha_composite(sweep.filter(ImageFilter.GaussianBlur(18)))
    # rising line (red = up, Chinese convention) with glow
    pts = [(-300, 150), (-150, 40), (-40, 110), (90, -60), (190, -10), (300, -210)]
    pts = [(c + R(x), c + R(y)) for x, y in pts]
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
    gd.line(pts, fill=(255, 77, 94, 200), width=R(56), joint="curve")
    im.alpha_composite(glow.filter(ImageFilter.GaussianBlur(28)))
    d.line(pts, fill=(255, 92, 108, 255), width=R(34), joint="curve")
    x, y = pts[-1]; d.ellipse([x - R(34), y - R(34), x + R(34), y + R(34)], fill=(255, 255, 255, 255))
    return im

for name, size, mk in [("icon-512.png", 512, False), ("icon-192.png", 192, False), ("apple-touch-icon.png", 180, True),
                       ("favicon-32.png", 32, False), ("icon-maskable-512.png", 512, True)]:
    base(mk).resize((size, size), Image.LANCZOS).save(os.path.join(OUT, name))
# social preview
og = Image.new("RGBA", (1200, 630), (7, 9, 15, 255)); ic = base().resize((360, 360), Image.LANCZOS)
og.alpha_composite(ic, (420, 135)); og.convert("RGB").save(os.path.join(OUT, "og.png"))
print("icons written to", OUT)
