#!/usr/bin/env python3
"""Generate PWA icons for 绿仔的投资小屋 (logo B: greige cottage + sage leaf on a pale sage rounded square).
Renders crisp SVG with headless Chrome (Playwright). Run: .venv/bin/python tools/make_icons.py"""
import os, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'icons'; OUT.mkdir(exist_ok=True)
BG, HOUSE, DOOR, LEAF = '#dde5da', '#e2cfba', '#a88f77', '#8aa591'

def icon_svg(size, maskable=False, radius=True):
    # the cottage mark lives in a 40x40 box (same geometry as MARKS.b in app.js); art spans x 7..33, y 6..34
    k = 0.60 if maskable else 0.74          # maskable keeps the art inside the 80% safe zone
    s = 40 / k; o = (s - 40) / 2
    rx = 0 if (maskable or not radius) else s * 0.225
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="{-o} {-o+0.6} {s} {s}">
<rect x="{-o}" y="{-o+0.6}" width="{s}" height="{s}" rx="{rx}" fill="{BG}"/>
<path d="M7 19.5L20 9l13 10.5V31a3 3 0 01-3 3H10a3 3 0 01-3-3z" fill="{HOUSE}"/>
<path d="M16.5 34v-7.2a3.5 3.5 0 017 0V34" fill="none" stroke="{DOOR}" stroke-width="1.8" stroke-linecap="round"/>
<path d="M26.5 12.5c.2-3.6 2.6-6 6.6-6.3-.1 3.9-2.6 6.4-6.6 6.3z" fill="{LEAF}"/>
<path d="M26.5 12.5c1.5-1.9 3.2-3.3 5-4.3" fill="none" stroke="{BG}" stroke-width="1" stroke-linecap="round"/></svg>'''

import base64
fonts = 'data:font/woff2;base64,' + base64.b64encode((ROOT / 'assets' / 'fonts' / 'ZCOOLKuaiLe-Regular-wordmark.woff2').read_bytes()).decode()
OG = f'''<style>@font-face{{font-family:R;src:url({fonts})}}html,body{{margin:0}}
.og{{width:1200px;height:630px;background:#f3efe9;display:flex;align-items:center;justify-content:center;gap:48px;font-family:R}}
.og .t{{display:flex;flex-direction:column;gap:18px}}.og b{{font-weight:400;font-size:84px;letter-spacing:.06em;color:#6b5a4c}}
.og span{{font:400 28px -apple-system,"PingFang SC","Noto Sans CJK SC",sans-serif;color:#8c8279;letter-spacing:.08em}}
.og svg{{filter:drop-shadow(0 18px 36px rgba(60,45,30,.16))}}</style>
<div class="og">{icon_svg(260)}<div class="t"><b>绿仔的投资小屋</b><span>每天用中文读懂美股涨跌 · AI 多流派辩论</span></div></div>'''

TARGETS = [('icon-512.png', 512, False, True), ('icon-192.png', 192, False, True),
           ('icon-maskable-512.png', 512, True, False), ('apple-touch-icon.png', 180, False, False),  # iOS rounds corners itself
           ('favicon-32.png', 32, False, True)]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for name, size, mk, rad in TARGETS:
        pg = b.new_page(viewport={'width': size, 'height': size})
        pg.set_content(f'<style>html,body{{margin:0;background:transparent}}svg{{display:block}}</style>{icon_svg(size, mk, rad)}')
        pg.screenshot(path=str(OUT / name), omit_background=True, clip={'x': 0, 'y': 0, 'width': size, 'height': size}); pg.close()
    pg = b.new_page(viewport={'width': 1200, 'height': 630}); pg.set_content(OG); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(300)
    pg.screenshot(path=str(OUT / 'og.png')); pg.close()
    # preview sheet
    pg = b.new_page(viewport={'width': 900, 'height': 360}, device_scale_factor=2)
    cells = ''.join(f'<figure>{icon_svg(sz, mk, rad)}<figcaption>{n}</figcaption></figure>' for n, sz, mk, rad in
                    [('icon 512 → 180', 180, False, True), ('maskable (safe zone)', 180, True, False), ('192 → 96', 96, False, True), ('favicon 32', 32, False, True)])
    pg.set_content('<style>body{margin:0;background:#f3efe9;font:13px -apple-system,"Noto Sans CJK SC",sans-serif;color:#8c8279}'
                   '.w{display:flex;gap:44px;align-items:flex-end;justify-content:center;height:360px;padding-bottom:50px;box-sizing:border-box}'
                   'figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:12px}svg{filter:drop-shadow(0 8px 20px rgba(60,45,30,.14))}</style>'
                   f'<div class="w">{cells}</div>')
    pg.screenshot(path=str(ROOT / 'screenshots' / 'icon-preview.png')); pg.close()
    b.close()
print('icons written to', OUT)
