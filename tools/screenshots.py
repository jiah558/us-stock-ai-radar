#!/usr/bin/env python3
"""Serve the site locally and capture screenshots with system Chrome + Playwright.
Mobile 390x844 @3x and desktop 1440x900 @1x. Fails loudly on console errors.
Usage: python tools/screenshots.py [--base http://127.0.0.1:8765/] [--full] [--prefix live-] [--only mobile|desktop]"""
import argparse, os, subprocess, sys, time
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument("--base"); ap.add_argument("--full", action="store_true")
ap.add_argument("--prefix", default=""); ap.add_argument("--only"); a = ap.parse_args()
srv = None
base = a.base
if not base:
    srv = subprocess.Popen([sys.executable, "-m", "http.server", "8765", "--bind", "127.0.0.1"], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1); base = "http://127.0.0.1:8765/"
out = os.path.join(ROOT, "screenshots"); os.makedirs(out, exist_ok=True)
MOBILE = [("01-home", "#/", None), ("02-stock-IREN", "#/s/IREN", None), ("03-stock-IREN-debate", "#/s/IREN", "#debate"),
          ("04-stock-RKLB", "#/s/RKLB", None), ("05-watchlist", "#/w", None), ("06-about", "#/about", None),
          ("07-sources", "#/sources", None), ("08-search", "#/", "search"), ("09-stock-RKLX", "#/s/RKLX", None), ("10-quote-BE", "#/s/BE", None), ("14-consensus", "#/s/IREN", ".consensus")]
DARK = [("11-dark-home", "#/", None), ("12-dark-stock-IREN", "#/s/IREN", None), ("13-dark-debate", "#/s/IREN", "#debate")]
DESKTOP = [("d1-home", "#/", None), ("d2-stock-IREN", "#/s/IREN", None), ("d3-watchlist", "#/w", None), ("d4-about", "#/about", None)]
errors = []

def run(pg, shots, full):
    for name, h, anchor in shots:
        pg.goto(base + "?noanim=1" + h); pg.wait_for_selector(".appbar"); pg.wait_for_timeout(700)
        if anchor == "search":
            pg.locator(".search .q >> visible=true").first.click(); pg.keyboard.type("n"); pg.wait_for_timeout(300)
        elif anchor:
            pg.eval_on_selector(anchor, "e => window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 56)"); pg.wait_for_timeout(400)
        pg.screenshot(path=os.path.join(out, a.prefix + name + ".png"))
        if full and not anchor:
            pg.screenshot(path=os.path.join(out, a.prefix + name + "-full.png"), full_page=True)
        print("saved", a.prefix + name)

try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        for kind, vp, dsf, mob, shots, scheme in [("mobile", (390, 844), 3, True, MOBILE, "light"), ("mobile", (390, 844), 3, True, DARK, "dark"),
                                                 ("desktop", (1440, 900), 1, False, DESKTOP, "light"), ("desktop", (1440, 900), 1, False, [("d5-dark-home", "#/", None)], "dark")]:
            if a.only and a.only != kind:
                continue
            ctx = b.new_context(viewport={"width": vp[0], "height": vp[1]}, device_scale_factor=dsf, is_mobile=mob, has_touch=mob, locale="zh-CN", color_scheme=scheme)
            pg = ctx.new_page()
            pg.on("console", lambda m: m.type == "error" and errors.append(m.text))
            pg.on("pageerror", lambda e: errors.append(str(e)))
            run(pg, shots, a.full)
            ctx.close()
        b.close()
finally:
    if srv: srv.terminate()
print("console errors:", errors or "none")
sys.exit(1 if errors else 0)
