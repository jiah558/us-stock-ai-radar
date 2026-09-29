#!/usr/bin/env python3
"""Screenshots of /panorama/ (desktop 1440, mobile 390, dark mobile) + console-error check.
Usage: python tools/shot_panorama.py [--base http://127.0.0.1:8765/] [--prefix local-]"""
import argparse, os, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument("--base", default="http://127.0.0.1:8765/"); ap.add_argument("--prefix", default="")
a = ap.parse_args()
out = os.path.join(ROOT, "screenshots"); os.makedirs(out, exist_ok=True)
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    for name, vp, dsf, mob, scheme, full in [("panorama-desktop", (1440, 900), 1, False, "light", True), ("panorama-mobile", (390, 844), 3, True, "light", True),
                                            ("panorama-mobile-dark", (390, 844), 3, True, "dark", False), ("panorama-tablet", (820, 1100), 2, True, "light", False)]:
        ctx = b.new_context(viewport={"width": vp[0], "height": vp[1]}, device_scale_factor=dsf, is_mobile=mob, has_touch=mob, color_scheme=scheme, locale="zh-CN", timezone_id="Asia/Shanghai")
        pg = ctx.new_page()
        pg.on("console", lambda m, n=name: errs.append((n, m.text)) if m.type in ("error", "warning") else None)
        pg.on("pageerror", lambda e, n=name: errs.append((n, str(e))))
        pg.on("requestfailed", lambda r, n=name: errs.append((n, "requestfailed " + r.url)))
        pg.goto(a.base + "panorama/", wait_until="networkidle"); pg.wait_for_selector(".pn-tile", timeout=15000); pg.wait_for_timeout(600)
        pg.screenshot(path=os.path.join(out, f"{a.prefix}{name}.png"))
        if full: pg.screenshot(path=os.path.join(out, f"{a.prefix}{name}-full.png"), full_page=True)
        n = pg.eval_on_selector_all(".pn-tile", "e=>e.length"); ov = pg.evaluate("document.documentElement.scrollWidth > innerWidth + 1")
        print(name, "tiles", n, "h-overflow", ov, "status", pg.inner_text("#status"), "|", pg.inner_text("#dtime"))
        if name == "panorama-mobile":  # weights toggle off
            pg.click(".pn-sw"); pg.wait_for_timeout(400)
            pg.screenshot(path=os.path.join(out, f"{a.prefix}panorama-mobile-noweights.png"))
            txt = pg.inner_text("body"); print("weights hidden -> '占比' in text:", "占比" in txt.replace("示例占比", "").replace("显示占比", "").replace("持仓占比", ""), "badge hidden:", pg.is_hidden("#badge"))
        ctx.close()
    b.close()
print("CONSOLE/NETWORK ISSUES:", errs or "none")
sys.exit(1 if errs else 0)
