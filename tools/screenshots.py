#!/usr/bin/env python3
"""Serve the site locally and capture 390x844 @3x mobile screenshots with system Chrome + Playwright.
Usage: python tools/screenshots.py [--base http://127.0.0.1:8765/]"""
import argparse, os, subprocess, sys, time
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument("--base"); ap.add_argument("--full", action="store_true"); a = ap.parse_args()
srv = None
base = a.base
if not base:
    srv = subprocess.Popen([sys.executable, "-m", "http.server", "8765", "--bind", "127.0.0.1"], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1); base = "http://127.0.0.1:8765/"
out = os.path.join(ROOT, "screenshots"); os.makedirs(out, exist_ok=True)
shots = [("01-home", "#/", None), ("02-stock-IREN", "#/s/IREN", None), ("03-stock-IREN-debate", "#/s/IREN", "#debate"),
         ("04-stock-RKLB", "#/s/RKLB", None), ("05-watchlist", "#/w", None), ("06-about", "#/about", None)]
errors = []
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=3, is_mobile=True, has_touch=True, locale="zh-CN")
        pg = ctx.new_page()
        pg.on("console", lambda m: m.type == "error" and errors.append(m.text))
        pg.on("pageerror", lambda e: errors.append(str(e)))
        for name, h, anchor in shots:
            pg.goto(base + "?noanim=1" + h); pg.wait_for_selector(".tabbar"); pg.wait_for_timeout(700)
            if anchor:
                pg.eval_on_selector(anchor, "e => window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 70)"); pg.wait_for_timeout(400)
            pg.screenshot(path=os.path.join(out, name + ".png"))
            if a.full and not anchor:
                pg.screenshot(path=os.path.join(out, name + "-full.png"), full_page=True)
            print("saved", name)
        b.close()
finally:
    if srv: srv.terminate()
print("console errors:", errors or "none")
