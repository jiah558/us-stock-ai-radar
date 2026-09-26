#!/usr/bin/env python3
"""Convert a daily report (Markdown, Simplified Chinese) + fetched prices into site JSON.

Usage:
  python tools/md2json.py --md ../usstock/report-2026-09-25.md [--date 2026-09-25]
         [--prices data/prices/2026-09-25.json] [--watchlist ../usstock/watchlist.csv]

Outputs:
  data/reports/<date>.json   one self-contained report (text + chart data)
  data/index.json            list of available reports, newest first (updated in place)

Privacy: the public site must never expose position size / cost / P&L. The Markdown is
expected not to contain them; in addition, wording like "持仓" is rewritten to "重点关注",
the broker name is removed, and a guard aborts if suspicious fields appear.
"""
import argparse, csv, datetime as dt, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOCUS = ["IREN", "SPCX", "NBIS", "MU", "LUNL", "RKLX", "RKLB"]
ALIAS = {".SPX": "^GSPC", "BRK.B": "BRK-B"}
INDICES = [("^GSPC", "标普500"), ("^IXIC", "纳斯达克"), ("^DJI", "道琼斯"),
           ("^SOX", "费城半导体"), ("^VIX", "VIX 恐慌指数"), ("^TNX", "10年期美债")]
SCHOOLS = ["价值派", "成长派", "技术派", "宏观派"]
CHART_DAYS = 23  # ~1 month of sessions

# ---------------------------------------------------------------- privacy
SCRUB = [
    (r"一句话看持仓", "一句话看重点"),
    (r"全部持仓", "全部重点关注股"),
    (r"不含持仓", "不含重点关注"),
    (r"持仓股", "重点关注"),
    (r"持仓", "重点关注"),
    (r"仓位需与风险承受力匹配", "需与自身风险承受力匹配"),
    (r"App 截图逐一核对", "行情逐一核对"),
]
# optional private rules (e.g. broker names), kept out of git: [["regex", "replacement"], ...]
_local = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scrub_local.json")
if os.path.exists(_local):
    SCRUB = [tuple(r) for r in json.load(open(_local, encoding="utf-8"))] + SCRUB
FORBIDDEN = re.compile(r"(持股数|持仓数量|成本价|持仓成本|盈亏|浮盈|浮亏|市值占比|cost basis|P&L)", re.I)


def scrub(s):
    for a, b in SCRUB:
        s = re.sub(a, b, s)
    return s


# ---------------------------------------------------------------- helpers
def pct(s):
    m = re.search(r"([+-]?\d+(?:\.\d+)?)\s*%", s.replace("*", ""))
    return float(m.group(1)) if m else None


def num(s):
    m = re.search(r"-?\d[\d,]*(?:\.\d+)?", s.replace("*", ""))
    return float(m.group(0).replace(",", "")) if m else None


def plain(s):
    return re.sub(r"\*\*(.+?)\*\*", r"\1", s).strip()


def table(lines):
    rows = [l.strip().strip("|").split("|") for l in lines if l.strip().startswith("|")]
    rows = [[c.strip() for c in r] for r in rows if not re.match(r"^[\s|:-]+$", "|".join(r))]
    return rows[0], rows[1:]


def sentences(text):
    """split into sentences on 。 (outside brackets)"""
    out, buf, depth = [], "", 0
    for ch in text:
        buf += ch
        if ch in "（(“":
            depth += 1
        elif ch in "）)”":
            depth = max(0, depth - 1)
        elif ch == "。" and depth == 0:
            out.append(buf.strip()); buf = ""
    if buf.strip():
        out.append(buf.strip())
    return out


def split_sections(md):
    secs, cur = {}, None
    for line in md.splitlines():
        m = re.match(r"^## (.+)", line)
        if m:
            cur = m.group(1).strip(); secs[cur] = []
        elif cur:
            secs[cur].append(line)
    return secs


def bullets(lines):
    """top-level '- ' bullets with nested '  - ' children"""
    items = []
    for l in lines:
        if re.match(r"^- ", l):
            items.append({"text": l[2:].strip(), "children": []})
        elif re.match(r"^\s{2,}- ", l) and items:
            items[-1]["children"].append(l.strip()[2:].strip())
        elif l.strip() and items and not l.startswith(("#", ">", "|", "---")):
            items[-1]["text"] += l.strip()
    return items


def kv(text):
    m = re.match(r"^\*\*([^*]+?)\*\*\s*$", text)
    if m:
        return m.group(1).strip(), ""
    m = re.match(r"^\*\*(.+?)\*\*[：:]\s*(.*)$", text)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    m = re.match(r"^([^：:]{1,14})[：:]\s*(.*)$", text)
    return (m.group(1).strip(), m.group(2).strip()) if m else (None, text)


DATE_RE = re.compile(r"(?<![\d/$])(\d{1,2})/(\d{1,2})(?:\s*[–-]\s*(?:\d{1,2}/)?\d{1,2})?(?![\d/])")


def split_top(text, seps="，"):
    out, buf, depth = [], "", 0
    for i, ch in enumerate(text):
        if ch in "（(“":
            depth += 1
        elif ch in "）)”":
            depth = max(0, depth - 1)
        comma = ch in seps or (ch == "," and not text[i + 1:i + 2].isdigit())
        if comma and depth == 0:
            out.append(buf); buf = ""
        else:
            buf += ch
    return out + [buf]


def event_label(clause, token, limit=48):
    subs = split_top(plain(clause))
    i = next((k for k, x in enumerate(subs) if token in x), 0)
    lab = subs[i]
    # drop parenthetical asides unless they carry the date itself
    lab = re.sub(r"（[^（）]*）", lambda mm: mm.group(0) if token in mm.group(0) else " ", lab)
    lab = re.sub(r"\s+", " ", lab)
    lab = re.sub(r"^[、：:\s]+|[、：:\s]+$", "", lab)
    if lab.startswith(token) and len(lab) - len(token) >= 6:
        lab = lab[len(token):].lstrip(" ：:")
    if len(lab) < 14 and i + 1 < len(subs):
        lab += "，" + re.sub(r"（[^（）]*）", "", subs[i + 1])
    return lab if len(lab) <= limit else lab[:limit - 1] + "…"


def find_events(text, report_date):
    evs = []
    for clause in re.split(r"[。；;]", text):
        for m in DATE_RE.finditer(clause):
            mo, d = int(m.group(1)), int(m.group(2))
            if not (1 <= mo <= 12 and 1 <= d <= 31):
                continue
            y = report_date.year
            try:
                day = dt.date(y, mo, d)
            except ValueError:
                continue
            if day > report_date + dt.timedelta(days=60):
                day = day.replace(year=y - 1)
            label = event_label(clause, m.group(0))
            evs.append({"date": day.isoformat(), "label": label})
    return evs


def debate(children):
    out = {"opening": [], "rebuttal": [], "consensus": ""}
    for c in children:
        k, v = kv(c)
        if k in SCHOOLS:
            out["opening"].append({"school": k, "text": v})
        elif k and k.startswith("反驳"):
            for part in re.split(r"[；;]", v):
                part = part.strip().rstrip("。")
                if not part:
                    continue
                sp = next((s for s in SCHOOLS if part.startswith(s)), None)
                rest = part[len(sp):] if sp else part
                tgt = next((s for s in SCHOOLS if s in rest[:8] and s != sp), None)
                out["rebuttal"].append({"school": sp or "主持人", "target": tgt, "text": part + "。"})
        elif k and "共识" in k:
            out["consensus"] = v
    return out


def sentiment(text):
    m = re.search(r"(\d+)\s*条[^\d]{0,4}?中\s*(\d+)\s*条?\s*看多、\s*(\d+)\s*条?\s*看空", plain(text))
    if not m:
        return None
    return {"total": int(m.group(1)), "bull": int(m.group(2)), "bear": int(m.group(3))}


def moves(series, date):
    s = [p for p in series if p[0] <= date]
    if len(s) < 2:
        return None, None, None
    last = s[-1][1]
    day = (last / s[-2][1] - 1) * 100
    wk_ref = [p for p in s if p[0] <= (dt.date.fromisoformat(s[-1][0]) - dt.timedelta(days=7)).isoformat()]
    week = (last / wk_ref[-1][1] - 1) * 100 if wk_ref else None
    return last, day, week


def r2(x):
    from decimal import Decimal, ROUND_HALF_UP
    return None if x is None else float(Decimal(repr(x)).quantize(Decimal("0.01"), ROUND_HALF_UP))


# ---------------------------------------------------------------- main
def convert(md, date, prices, wl_rows):
    md = scrub(md)
    rd = dt.date.fromisoformat(date)
    secs = split_sections(md)
    title = plain(re.search(r"^# (.+)$", md, re.M).group(1))
    note = next((plain(l[1:].strip()) for l in md.splitlines() if l.startswith(">")), "")

    # market -------------------------------------------------------------
    mk = [l for l in secs.get("大盘概况", []) if l.strip() and not l.startswith("---")]
    overview, headline = "", ""
    for l in mk:
        m = re.match(r"^\*\*一句话看重点\*\*[：:]\s*(.*)", l)
        if m:
            headline = m.group(1).strip()
        else:
            overview += l.strip()
    indices = []
    for sym, name in INDICES:
        q = prices.get(sym)
        if q and q["series"]:
            last, day, week = moves(q["series"], date)
            indices.append({"symbol": sym, "name": name, "price": r2(last), "day": r2(day), "week": r2(week)})

    # focus ----------------------------------------------------------------
    fsec = secs.get("重点关注", [])
    hdr, rows = table(fsec)
    one = {}
    for r in rows:
        tk = re.match(r"[A-Z.]+", r[0]).group(0)
        one[tk] = {"label": r[0], "oneLiner": r[4] if len(r) > 4 else "",
                   "price_md": num(r[1]), "day_md": pct(r[2]), "week_md": pct(r[3])}
    blocks, cur = {}, None
    for l in fsec:
        m = re.match(r"^### \d+\.\s*([A-Z.]+)[（(](.+?)[）)]", l)
        if m:
            cur = m.group(1); blocks[cur] = {"name": m.group(2).strip(), "lines": []}
        elif cur and not l.startswith(">"):
            blocks[cur]["lines"].append(l)
    focus = []
    for tk in [t for t in one] + [t for t in blocks if t not in one]:
        b = blocks.get(tk, {"name": tk, "lines": []})
        st = {"ticker": tk, "name": b["name"], **{k: v for k, v in one.get(tk, {}).items() if not k.endswith("_md")},
              "intro": [], "reasons": [], "analysts": [], "sentimentText": "", "sentiment": None,
              "notes": [], "debate": None, "underlying": None}
        um = re.search(r"2x\s*([A-Z]+)", one.get(tk, {}).get("label", "")) or re.search(r"做多\s*([A-Z]+)", b["name"])
        if um:
            st["underlying"] = um.group(1)
        evtext = ""
        for it in bullets(b["lines"]):
            k, v = kv(it["text"])
            if k is None:
                continue
            if k.startswith("流派辩论"):
                st["debate"] = debate(it["children"])
            elif k.startswith("主要原因"):
                st["reasons"] += sentences(v)
                if "/" not in k:  # combined "主要原因 / 机构观点 / 情绪" = pointer to another stock
                    evtext += v + "。"
                st["notes"] += [plain(c) for c in it["children"]]
            elif k.startswith("机构观点"):
                st["analysts"] += [p.strip() for p in re.split(r"[；;]", v) if p.strip()]
                evtext += v + "。"
            elif k.startswith("市场情绪"):
                st["sentimentText"] = v; st["sentiment"] = sentiment(v)
            else:
                st["intro"].append({"title": k, "text": v})
                st["notes"] += [plain(c) for c in it["children"]]
                if k.startswith("底层资产"):
                    evtext += v + "。"
        # prices
        q = prices.get(tk)
        if q and q["series"]:
            last, day, week = moves(q["series"], date)
            st.update(price=r2(last), day=r2(day), week=r2(week))
            st["chart"] = [[d, round(c, 4)] for d, c in q["series"][-CHART_DAYS:]]
        else:
            o = one.get(tk, {})
            st.update(price=o.get("price_md"), day=o.get("day_md"), week=o.get("week_md"), chart=[])
        evs = find_events(evtext, rd)
        first = st["chart"][0][0] if st["chart"] else date
        seen, past, upcoming = set(), [], []
        for e in evs:
            if e["date"] in seen:
                continue
            seen.add(e["date"])
            (upcoming if e["date"] > date else past).append(e) if e["date"] >= first else None
        st["events"] = sorted(past, key=lambda e: e["date"])[-6:]
        st["upcoming"] = sorted(upcoming, key=lambda e: e["date"])
        focus.append(st)
    # leveraged ETFs inherit events of their underlying if they have none
    by = {s["ticker"]: s for s in focus}
    for s in focus:
        u = by.get(s["underlying"] or "")
        if u and not s["events"]:
            s["events"] = [dict(e, label=f"{u['ticker']}：{e['label']}") for e in u["events"]]
            s["eventsFrom"] = u["ticker"]

    # watchlist --------------------------------------------------------------
    wsec = secs.get("自选股速览", [])
    movers, weekly, sectors, anomalies = [], [], [], ""
    sub, buf = None, {}
    for l in wsec:
        m = re.match(r"^### (.+)", l)
        if m:
            sub = m.group(1); buf[sub] = []
        elif sub:
            buf[sub].append(l)
    for name, lines in buf.items():
        if name.startswith("当日大涨大跌"):
            h, rs = table(lines)
            for r in rs:
                movers.append({"ticker": r[0], "name": plain(r[1]), "day": pct(r[2]), "week": pct(r[3]), "reason": r[4]})
        elif name.startswith("本周异动"):
            weekly = [it["text"] for it in bullets(lines)]
        elif name.startswith("其余自选股"):
            for it in bullets(lines):
                k, v = kv(it["text"])
                if k and k.startswith("数据异常"):
                    anomalies = v; continue
                parts = re.split(r"\s+——\s+", v, maxsplit=1)
                items = [{"ticker": t, "day": float(p)} for t, p in re.findall(r"([A-Z][A-Z.]{0,5})\s*([+-]\d+(?:\.\d+)?)%", parts[0])]
                sectors.append({"name": k, "items": items, "note": parts[1] if len(parts) > 1 else "", "raw": v})
    reason = {m["ticker"]: m["reason"] for m in movers}
    allw = []
    for r in wl_rows:
        tk = r["ticker"]
        if tk in FOCUS or tk.startswith("."):
            continue
        q = prices.get(ALIAS.get(tk, tk))
        last, day, week = moves(q["series"], date) if q and q["series"] else (num(r["last_price"]), pct(r["pct_change"]), None)
        allw.append({"ticker": tk, "name": r["name"].replace("(延时)", "").strip(), "price": r2(last),
                     "day": r2(day), "week": r2(week), "reason": reason.get(tk, "")})
    allw.sort(key=lambda x: -abs(x["day"] or 0))
    px = {w["ticker"]: w["price"] for w in allw}
    for m in movers:
        m["price"] = px.get(m["ticker"])

    # next week / sources ------------------------------------------------------
    nxt = [it["text"] for it in bullets(secs.get("下周关注", []))]
    sources = []
    for it in bullets(secs.get("信息来源", [])):
        k, v = kv(it["text"])
        urls = re.findall(r"https?://[^\s；;，,）)]+", v)
        sources.append({"label": k or "", "text": re.sub(r"https?://\S+", "", v).strip(" ；;"), "urls": urls})
    disc = re.search(r"^\*免责声明[：:](.+?)\*$", md, re.M)

    rep = {
        "schema": 1, "date": date, "title": title, "note": note,
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "market": {"headline": headline, "overview": overview, "indices": indices},
        "focus": focus,
        "watch": {"movers": movers, "weekly": weekly, "sectors": sectors, "anomalies": anomalies, "all": allw},
        "nextWeek": nxt, "sources": sources,
        "disclaimer": disc.group(1).strip() if disc else "本内容由 AI 自动生成，不构成任何投资建议。",
    }
    blob = json.dumps(rep, ensure_ascii=False)
    bad = FORBIDDEN.search(blob)
    if bad:
        sys.exit(f"PRIVACY GUARD: found '{bad.group(0)}' in output – refusing to write. Clean the source first.")
    return rep


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--md", required=True)
    ap.add_argument("--date")
    ap.add_argument("--prices")
    ap.add_argument("--watchlist", default=os.path.join(ROOT, "..", "usstock", "watchlist.csv"))
    a = ap.parse_args()
    date = a.date or re.search(r"(\d{4}-\d{2}-\d{2})", os.path.basename(a.md)).group(1)
    ppath = a.prices or os.path.join(ROOT, "data", "prices", f"{date}.json")
    prices = json.load(open(ppath, encoding="utf-8")) if os.path.exists(ppath) else {}
    if not prices:
        print("WARNING: no price file, charts will be empty:", ppath, file=sys.stderr)
    wl = list(csv.DictReader(open(a.watchlist, encoding="utf-8"))) if os.path.exists(a.watchlist) else []
    rep = convert(open(a.md, encoding="utf-8").read(), date, prices, wl)
    out = os.path.join(ROOT, "data", "reports", f"{date}.json")
    json.dump(rep, open(out, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    # index
    ipath = os.path.join(ROOT, "data", "index.json")
    idx = json.load(open(ipath, encoding="utf-8")) if os.path.exists(ipath) else {"reports": []}
    idx["reports"] = [r for r in idx["reports"] if r["date"] != date]
    idx["reports"].append({"date": date, "headline": rep["market"]["headline"][:80],
                           "file": f"data/reports/{date}.json"})
    idx["reports"].sort(key=lambda r: r["date"], reverse=True)
    idx["latest"] = idx["reports"][0]["date"]
    idx["updatedAt"] = rep["generatedAt"]
    json.dump(idx, open(ipath, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"wrote {out} ({len(rep['focus'])} focus, {len(rep['watch']['all'])} watchlist) and {ipath}")


if __name__ == "__main__":
    main()
