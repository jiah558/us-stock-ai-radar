"""Render the three wordmark drafts (?logo=a|b|c) as PNGs.
usage: .venv/bin/python tools/wordmarks.py [--base http://127.0.0.1:8765/]
Writes screenshots/wordmark-{v}.png (poster on the Morandi background: wordmark + app-icon concept)
and screenshots/wordmark-{v}-transparent.png (wordmark only, transparent background)."""
import sys, os
from playwright.sync_api import sync_playwright
base = sys.argv[sys.argv.index('--base') + 1] if '--base' in sys.argv else 'http://127.0.0.1:8765/'
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'screenshots')
INFO = {
  'a': ('A · 书法手写', 'Ma Shan Zheng · SIL OFL 1.1', '图标：砖红印章「绿」，米灰底', '#f3efe9'),
  'b': ('B · 圆润可爱', 'ZCOOL KuaiLe · SIL OFL 1.1', '图标：小屋 + 鼠尾草绿叶，浅鼠尾草底', '#dde5da'),
  'c': ('C · 编辑衬线', 'ZCOOL XiaoWei · SIL OFL 1.1', '图标：细双环「绿」字 monogram，象牙底', '#fbf9f6'),
}
POSTER = '''
<style>
html,body{margin:0;background:#f3efe9}
.pst{width:1200px;height:600px;box-sizing:border-box;padding:70px 80px;display:grid;grid-template-columns:1fr 260px;gap:40px;align-items:center;font-family:-apple-system,"PingFang SC","Noto Sans CJK SC",sans-serif;color:#2f2b27;background:#f3efe9}
.pst .l{display:flex;flex-direction:column;gap:34px}
#w .wm{transform:scale(2.3);transform-origin:0 50%;height:90px}
.pst .cap{display:flex;flex-direction:column;gap:8px;border-top:.5px solid rgba(96,80,64,.2);padding-top:22px;max-width:560px}
.pst .cap b{font-weight:500;font-size:20px;letter-spacing:.04em}
.pst .cap span{font-size:14px;color:#8c8279;letter-spacing:.02em}
.pst .sw{display:flex;gap:8px;margin-top:6px}.pst .sw i{width:22px;height:22px;border-radius:50%}
.pst .icw{display:flex;flex-direction:column;align-items:center;gap:14px}
.aic-tile{flex:none;width:220px;height:220px;border-radius:50px;display:flex;align-items:center;justify-content:center;box-shadow:0 18px 40px rgba(60,45,30,.14),0 0 0 .5px rgba(96,80,64,.12)}
.aic-tile .mark{width:132px!important;height:132px!important;margin:0!important}
.pst .icw small{white-space:nowrap;font-size:13px;color:#8c8279}
.solo{display:inline-block;padding:16px 22px;background:transparent}
.solo .wm{transform:none}
</style>
<div class="pst"><div class="l"><div id="w"></div>
<div class="cap"><b>{t}</b><span>{f}</span><span>{i}</span><div class="sw"><i style="background:#b5615a"></i><i style="background:#7f9c86"></i><i style="background:#6f8494"></i><i style="background:#e9dccd"></i><i style="background:#3b3632"></i></div></div></div>
<div class="icw"><div class="aic-tile" style="background:{bg}" id="t"></div><small>App icon concept</small></div></div>
<div class="solo" id="solo"></div>'''
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    errs = []
    for v, (t, f, i, bg) in INFO.items():
        pg = b.new_page(viewport={'width': 1200, 'height': 800}, device_scale_factor=2, color_scheme='light')
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(f'{base}?noanim=1&logo={v}#/'); pg.wait_for_selector('.appbar .wm')
        wm = pg.eval_on_selector('.appbar .wm', 'e => e.outerHTML')
        mk = pg.eval_on_selector('.appbar .wm .mark', 'e => e.outerHTML')
        html = POSTER.replace('{t}', t).replace('{f}', f).replace('{i}', i).replace('{bg}', bg)
        pg.evaluate('''([h, wm, mk, v]) => { const css = [...document.querySelectorAll('link[rel=stylesheet]')].map(l => l.outerHTML).join('');
          document.body.className = ''; document.body.innerHTML = h; document.documentElement.dataset.logo = v;
          document.getElementById('w').innerHTML = wm.replace('class="wm ', 'class="wm wm-lg ');
          document.getElementById('solo').innerHTML = wm.replace('class="wm ', 'class="wm wm-lg ');
          const t = document.getElementById('t'); t.className = `wm wm-${v} aic-tile`; t.innerHTML = mk; }''', [html, wm, mk, v])
        pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(400)
        if os.environ.get('DBG'): print(pg.evaluate("[...document.querySelectorAll('.pst,.icw,#t,#t .mark')].map(e=>{const r=e.getBoundingClientRect();return e.className.baseVal??e.className, [r.x,r.y,r.width,r.height].map(Math.round)})"))
        pg.locator('.pst').screenshot(path=f'{out}/wordmark-{v}.png')
        pg.evaluate("document.documentElement.style.background='transparent';document.body.style.background='transparent'")
        pg.locator('#solo').screenshot(path=f'{out}/wordmark-{v}-transparent.png', omit_background=True)
        pg.close()
    b.close()
print('errors:', errs or 'none')
sys.exit(1 if errs else 0)
