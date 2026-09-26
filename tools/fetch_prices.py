#!/usr/bin/env python3
"""Fetch real daily closes from Yahoo Finance's free chart API (no key needed).

Usage:
  python tools/fetch_prices.py --date 2026-09-25 [--watchlist ../usstock/watchlist.csv]

Writes data/prices/<date>.json:
  { "SYMBOL": {"name": str, "series": [["YYYY-MM-DD", close], ...]}, ... }
Series are cut off at --date so a report is always paired with the prices of its own day.
"""
import argparse, csv, datetime as dt, json, os, sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOCUS = ["IREN", "SPCX", "NBIS", "MU", "LUNL", "RKLX", "RKLB"]
INDICES = ["^GSPC", "^IXIC", "^DJI", "^VIX", "^TNX", "^SOX"]
ALIAS = {".SPX": "^GSPC", "BRK.B": "BRK-B"}  # broker ticker -> Yahoo symbol


def yahoo(sym, rng="3mo"):
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(sym)}?range={rng}&interval=1d"
    err = None
    for _ in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            j = json.load(urllib.request.urlopen(req, timeout=20))["chart"]["result"][0]
            break
        except Exception as e:  # noqa
            err = e
            time.sleep(1.5)
    else:
        return sym, {"err": str(err)}
    meta = j["meta"]
    off = meta.get("gmtoffset", -14400)
    closes = j["indicators"]["quote"][0]["close"]
    series = [
        [dt.datetime.fromtimestamp(t + off, dt.timezone.utc).date().isoformat(), round(c, 4)]
        for t, c in zip(j.get("timestamp", []), closes) if c is not None
    ]
    return sym, {"name": meta.get("longName") or meta.get("shortName"), "series": series}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", required=True, help="report trading date (US Eastern), YYYY-MM-DD")
    ap.add_argument("--watchlist", default=os.path.join(ROOT, "..", "usstock", "watchlist.csv"))
    a = ap.parse_args()
    syms = list(FOCUS) + list(INDICES)
    if os.path.exists(a.watchlist):
        for r in csv.DictReader(open(a.watchlist, encoding="utf-8")):
            s = ALIAS.get(r["ticker"], r["ticker"])
            if s not in syms:
                syms.append(s)
    with ThreadPoolExecutor(8) as ex:
        res = dict(ex.map(yahoo, syms))
    out, bad = {}, []
    for s, q in res.items():
        if "err" in q:
            bad.append(s)
            continue
        q["series"] = [p for p in q["series"] if p[0] <= a.date]
        out[s] = q
    path = os.path.join(ROOT, "data", "prices", f"{a.date}.json")
    json.dump(out, open(path, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(f"wrote {path}: {len(out)} symbols; failed: {bad or 'none'}")
    missing = [s for s in FOCUS if s not in out or not out[s]["series"] or out[s]["series"][-1][0] != a.date]
    if missing:
        print("WARNING: focus symbols without a close on", a.date, missing, file=sys.stderr)


if __name__ == "__main__":
    main()
