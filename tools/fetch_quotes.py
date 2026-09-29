#!/usr/bin/env python3
"""Fetch live-ish quotes for the 持仓全景图 page from Yahoo Finance's free chart API (same source as fetch_prices.py).

Writes data/quotes.json (only public market data — tickers, prices, % changes; nothing about positions).
Run by .github/workflows/panorama-quotes.yml on a cron; can also be run by hand:

  python3 tools/fetch_quotes.py            # always fetch + write
  python3 tools/fetch_quotes.py --auto     # cron mode: skip if the market is closed / data is still fresh enough
  python3 tools/fetch_quotes.py --dry-run  # print summary only

Per symbol per run: ONE request (5-min bars incl. pre/post market -> price, prev close, extended-hours price).
Week/month/YTD baselines + sparkline come from a 1y daily request that is repeated only when the session date changes.
"""
import argparse, datetime as dt, json, os, sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", "quotes.json")
ET = ZoneInfo("America/New_York")
HOLDINGS = ["IREN", "SPCX", "NBIS", "MU", "LUNL", "RKLX", "RKLB"]
INDICES = ["^GSPC", "^NDX", "^DJI"]
SECTORS = ["XLK", "SMH", "XLC", "XLY", "XLV", "XLP", "XLE", "XLF", "XLI", "XLU", "XLB", "XLRE", "GLD", "SLV"]
SPARK = set(INDICES) | set(HOLDINGS)
MAX_ERR = 4
# NYSE full-day holidays (2026-2027). Early closes (13:00 ET) are not modelled.
HOLIDAYS = {"2026-01-01", "2026-01-19", "2026-02-16", "2026-04-03", "2026-05-25", "2026-06-19", "2026-07-03",
            "2026-09-07", "2026-11-26", "2026-12-25", "2027-01-01", "2027-01-18", "2027-02-15", "2027-03-26",
            "2027-05-31", "2027-06-18", "2027-07-05", "2027-09-06", "2027-11-25", "2027-12-24"}
HOSTS = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"]


def get(sym, params):
    q = urllib.parse.urlencode(params)
    err = None
    for i in range(4):
        host = HOSTS[i % 2]
        url = f"https://{host}/v8/finance/chart/{urllib.parse.quote(sym)}?{q}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            return json.load(urllib.request.urlopen(req, timeout=20))["chart"]["result"][0]
        except Exception as e:  # noqa
            err = e
            time.sleep(2 * (i + 1))
    raise RuntimeError(f"{sym}: {err}")


def et_date(ts):
    return dt.datetime.fromtimestamp(ts, ET).date()


def pct(a, b):
    return round((a / b - 1) * 100, 3) if a is not None and b else None


def one(args):
    """Live call (5-min bars incl. pre/post) every run: 1 request per symbol.
    Daily-history baselines (week/month/YTD/sparkline) are only re-fetched when the trading session changes."""
    sym, old = args
    time.sleep(0.15)  # be gentle: Yahoo answers bursts with 429
    try:
        m = get(sym, {"range": "1d", "interval": "5m", "includePrePost": "true"})
        meta = m["meta"]
        price, rt = meta.get("regularMarketPrice"), meta.get("regularMarketTime")
        if price is None or rt is None:
            return sym, {"err": "no price"}
        sess = et_date(rt)  # the regular session this price belongs to
        b = (old or {}).get("base")
        if sym in SECTORS:  # sector bars only need the day change: no history request
            b = {"sess": sess.isoformat(), "wk": None, "mo": None, "ytd": None, "spark": None}
        elif not b or b.get("sess") != sess.isoformat():
            d = get(sym, {"range": "1y", "interval": "1d"})
            hist = [(et_date(t), c) for t, c in zip(d.get("timestamp") or [], ((d.get("indicators") or {}).get("quote") or [{}])[0].get("close") or []) if c is not None]
            hist = [(dd, c) for dd, c in hist if dd < sess]
            monday = sess - dt.timedelta(days=sess.weekday())

            def base(cut):
                h = [c for dd, c in hist if dd < cut]
                return round(h[-1], 4) if h else None
            b = {"sess": sess.isoformat(), "wk": base(monday), "mo": base(sess.replace(day=1)), "ytd": base(dt.date(sess.year, 1, 1)),
                 "spark": [round(c, 2) for _, c in hist[-30:]] if sym in SPARK else None}
    except Exception as e:  # noqa
        return sym, {"err": str(e)}
    prev = meta.get("chartPreviousClose") or meta.get("previousClose")
    q = {"name": meta.get("longName") or meta.get("shortName") or sym, "price": round(price, 4), "prev": round(prev, 4) if prev else None,
         "chg": pct(price, prev), "wk": pct(price, b["wk"]), "mo": pct(price, b["mo"]), "ytd": pct(price, b["ytd"]), "t": rt, "base": b}
    # extended hours: newest 5-min bar after the regular close (post) or before the open (pre)
    ts = m.get("timestamp") or []
    cl = ((m.get("indicators") or {}).get("quote") or [{}])[0].get("close") or []
    for t, c in zip(reversed(ts), reversed(cl)):
        if c is None:
            continue
        if t > rt:
            hm = dt.datetime.fromtimestamp(t, ET)
            mins = hm.hour * 60 + hm.minute
            kind = "pre" if mins < 9 * 60 + 30 else ("post" if mins >= 16 * 60 else None)
            if kind and not sym.startswith("^"):
                q["ext"] = {"k": kind, "price": round(c, 4), "chg": pct(c, price), "t": t}
        break
    if b.get("spark"):
        q["spark"] = b["spark"] + [round(price, 2)]
    return sym, q


def session_now(now=None):
    """(state, et_datetime): state in pre/regular/post/closed — same rules as the page."""
    n = (now or dt.datetime.now(ET)).astimezone(ET)
    if n.weekday() >= 5 or n.date().isoformat() in HOLIDAYS:
        return "closed", n
    mins = n.hour * 60 + n.minute
    if 4 * 60 <= mins < 9 * 60 + 30:
        return "pre", n
    if 9 * 60 + 30 <= mins < 16 * 60:
        return "regular", n
    if 16 * 60 <= mins < 20 * 60:
        return "post", n
    return "closed", n


def strip(j):
    j = dict(j)
    j.pop("generatedAt", None)
    return j


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--auto", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    old = None
    if os.path.exists(OUT):
        try:
            old = json.load(open(OUT, encoding="utf-8"))
        except Exception:  # noqa
            old = None
    if a.auto:
        state, n = session_now()
        age = (time.time() - dt.datetime.fromisoformat(old["generatedAt"]).timestamp()) / 60 if old else 1e9
        need = {"regular": 0, "pre": 25, "post": 25, "closed": 720}[state]
        if state == "closed" and old and old.get("state") != "closed":
            need = 0  # one final fetch after the 20:00 ET close so the last extended-hours print + "closed" state get published
        if age < need:
            print(f"skip: market={state}, data age {age:.0f} min < {need}")
            return
    syms = HOLDINGS + INDICES + SECTORS
    with ThreadPoolExecutor(4) as ex:
        oldq = (old or {}).get("quotes", {})
        res = dict(ex.map(one, [(x, oldq.get(x)) for x in syms]))
    bad = [s for s, q in res.items() if "err" in q]
    if any(s in bad for s in HOLDINGS + INDICES) or len(bad) > 4:
        print("FAILED symbols:", {s: res[s]["err"] for s in bad}, file=sys.stderr)
        sys.exit(1)  # keep the previous file rather than publishing partial data
    quotes = {s: q for s, q in res.items() if "err" not in q}
    if bad:  # a few sector ETFs failed: carry over previous values if we have them
        for s in bad:
            if old and s in old.get("quotes", {}):
                quotes[s] = old["quotes"][s]
    latest = max(max(q["t"], q.get("ext", {}).get("t", 0)) for q in quotes.values())
    out = {"state": session_now()[0], "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"), "dataTime": latest,
           "source": "Yahoo Finance chart API", "holdings": HOLDINGS, "indices": INDICES, "sectors": SECTORS, "quotes": quotes}
    print(f"ok: {len(quotes)} symbols, failed: {bad or 'none'}, dataTime={dt.datetime.fromtimestamp(latest, ET):%Y-%m-%d %H:%M} ET")
    if a.dry_run:
        for s in HOLDINGS + INDICES:
            q = quotes[s]
            print(f"  {s:6} {q['price']:>10} chg {q['chg']}% wk {q['wk']} mo {q['mo']} ytd {q['ytd']} ext {q.get('ext')}")
        return
    if old and strip(old) == strip(out):
        print("unchanged (ignoring generatedAt) - not rewriting")
        return
    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("wrote", OUT)


if __name__ == "__main__":
    main()
