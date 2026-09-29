/* 持仓全景图 — zero-dependency. Data: data/quotes.json (public quotes only) + data/panorama-weights.json (percentages only).
   Polls every 60 s. Colors follow the site convention: red = up, green = down. */
(() => {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const REFRESH_MS = 60000;
const RAW = 'https://raw.githubusercontent.com/jiah558/us-stock-ai-radar/quotes-data/quotes.json';   // fresh copy pushed by the cron workflow (CORS *)
const LOCAL = '../data/quotes.json';                                                                    // same-origin copy on Pages (fallback / offline)
const WEIGHTS = '../data/panorama-weights.json';
const NAMES = { IREN: 'IREN', SPCX: 'SpaceX', NBIS: 'Nebius', MU: '美光科技', LUNL: '2 倍做多 LUNR', RKLX: '2 倍做多 RKLB', RKLB: 'Rocket Lab' };
const INDEX_NAMES = { '^GSPC': ['标普 500', 'S&P 500'], '^NDX': ['纳斯达克 100', 'Nasdaq 100'], '^DJI': ['道琼斯', 'Dow Jones'] };
const SECTOR_NAMES = { XLK: '科技', SMH: '半导体', XLC: '通信', XLY: '可选消费', XLV: '医疗', XLP: '必需消费', XLE: '能源', XLF: '金融', XLI: '工业', XLU: '公用事业', XLB: '材料', XLRE: '地产', GLD: '黄金', SLV: '白银' };
const LOGO_COL = ['#7d93a3', '#b5817a', '#7f9a86', '#b39a6b', '#9a86a3', '#6f9499', '#a67d8b', '#8d857d'];   // muted, no bright hues
const HOLIDAYS = new Set(['2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03', '2026-05-25', '2026-06-19', '2026-07-03', '2026-09-07', '2026-11-26', '2026-12-25',
  '2027-01-01', '2027-01-18', '2027-02-15', '2027-03-26', '2027-05-31', '2027-06-18', '2027-07-05', '2027-09-06', '2027-11-25', '2027-12-24']);
const S = { q: null, w: null, showW: true, loading: false };

/* ---------- helpers ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cls = v => v == null || Math.abs(v) < 0.005 ? 'flat' : v > 0 ? 'up' : 'dn';
const pct = v => v == null ? '—' : (v > 0.004 ? '+' : v < -0.004 ? '−' : '') + Math.abs(v).toFixed(2) + '%';
const px = v => v == null ? '—' : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const hue = t => { let h = 0; for (const c of String(t)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % LOGO_COL.length; };
function etParts(d = new Date()) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' });
  const o = {}; f.formatToParts(d).forEach(p => { o[p.type] = p.value; });
  return { date: `${o.year}-${o.month}-${o.day}`, mins: (+o.hour) * 60 + (+o.minute), wd: o.weekday, hm: `${o.hour}:${o.minute}` };
}
/** US market session in Eastern time: pre 04:00-09:30, regular 09:30-16:00, post 16:00-20:00 */
function session(d = new Date()) {
  const e = etParts(d);
  if (e.wd === 'Sat' || e.wd === 'Sun' || HOLIDAYS.has(e.date)) return 'closed';
  if (e.mins >= 240 && e.mins < 570) return 'pre';
  if (e.mins >= 570 && e.mins < 960) return 'regular';
  if (e.mins >= 960 && e.mins < 1200) return 'post';
  return 'closed';
}
const SESS = { pre: '盘前', regular: '盘中', post: '盘后', closed: '休市' };
const fmtT = (ts, tz) => new Intl.DateTimeFormat('zh-CN', { timeZone: tz, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ts * 1000)).replace(/\//g, '-');
const ago = sec => sec < 90 ? '刚刚' : sec < 3600 ? Math.round(sec / 60) + ' 分钟前' : sec < 86400 ? Math.round(sec / 3600) + ' 小时前' : Math.round(sec / 86400) + ' 天前';

/* ---------- data ---------- */
async function getJSON(u) { const r = await fetch(u, { cache: 'no-store' }); if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); }
async function loadQuotes() {
  const bust = Math.floor(Date.now() / REFRESH_MS);
  const res = await Promise.allSettled([getJSON(`${RAW}?t=${bust}`), getJSON(`${LOCAL}?t=${bust}`)]);
  const ok = res.filter(r => r.status === 'fulfilled').map(r => r.value);
  if (!ok.length) throw new Error('行情数据加载失败');
  return ok.sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt))[0];   // newest wins
}
async function loadWeights() {
  try { S.w = await getJSON(`${WEIGHTS}?t=${Math.floor(Date.now() / 600000)}`); } catch (e) { S.w = { placeholder: true, weights: {} }; }
  let pref = null; try { pref = localStorage.getItem('pn.showW'); } catch (e) { /* ignore */ }
  S.showW = pref == null ? S.w.showWeights !== false : pref === '1';
}
/** normalised weights (sum = 1) for the holdings; missing / non-positive entries fall back to equal */
function weights(equal) {
  const hs = S.q.holdings, raw = S.w?.weights || {};
  const v = hs.map(t => (!equal && +raw[t] > 0) ? +raw[t] : (equal || !Object.keys(raw).length ? 1 : 0));
  const sum = v.reduce((a, b) => a + b, 0) || 1;
  return Object.fromEntries(hs.map((t, i) => [t, v[i] / sum]));
}

/* ---------- treemap (squarified) ---------- */
function squarify(items, x, y, w, h) {
  const out = [], total = items.reduce((a, b) => a + b.v, 0);
  let rest = items.map(i => ({ ...i, a: i.v / total * w * h })).sort((a, b) => b.a - a.a);
  const worst = (row, side) => { const s = row.reduce((a, b) => a + b.a, 0); const mx = Math.max(...row.map(r => r.a)), mn = Math.min(...row.map(r => r.a)); return Math.max(side * side * mx / (s * s), s * s / (side * side * mn)); };
  while (rest.length) {
    const side = Math.min(w, h), row = [rest[0]]; let i = 1;
    while (i < rest.length && worst([...row, rest[i]], side) <= worst(row, side)) row.push(rest[i++]);
    rest = rest.slice(row.length);
    const s = row.reduce((a, b) => a + b.a, 0);
    if (w >= h) { const rw = s / h; let cy = y; row.forEach(r => { const rh = r.a / rw; out.push({ ...r, x, y: cy, w: rw, h: rh }); cy += rh; }); x += rw; w -= rw; }
    else { const rh = s / w; let cx = x; row.forEach(r => { const rw = r.a / rh; out.push({ ...r, x: cx, y, w: rw, h: rh }); cx += rw; }); y += rh; h -= rh; }
  }
  return out;
}

/* ---------- render ---------- */
function extLine(q) {
  if (!q.ext) return '';
  return `${q.ext.k === 'pre' ? '盘前' : '盘后'} ${px(q.ext.price)} <span class="${cls(q.ext.chg)}">${pct(q.ext.chg)}</span>`;
}
function renderStatus() {
  const s = session(), e = $('#status');
  e.dataset.s = s; e.querySelector('b').textContent = SESS[s] + (s === 'regular' ? ' · 交易中' : '');
  const ep = etParts();
  $('#clock').textContent = `美东 ${ep.date.slice(5)} ${ep.hm} ${SESS[s]}`;
  const q = S.q; if (!q) return;
  const dt = q.dataTime;
  $('#dtime').textContent = `数据时间 美东 ${fmtT(dt, 'America/New_York')} · 北京 ${fmtT(dt, 'Asia/Shanghai')}`;
  const gen = Date.parse(q.generatedAt) / 1000, age = Date.now() / 1000 - gen;
  $('#footTime').textContent = `最后更新：北京时间 ${fmtT(gen, 'Asia/Shanghai')}（${ago(age)}）· 美东 ${fmtT(gen, 'America/New_York')} · 数据来源 Yahoo Finance`;
  const warn = $('#warn');
  const lag = (Date.now() / 1000 - dt) / 60;
  if ((s === 'regular' || s === 'pre' || s === 'post') && age > 20 * 60) { warn.hidden = false; warn.textContent = `行情更新有延迟：最近一次数据生成于 ${ago(age)}，后台刷新任务可能被 GitHub 延后，请稍候。`; }
  else if (s === 'regular' && lag > 30) { warn.hidden = false; warn.textContent = `部分行情时间较旧（约 ${Math.round(lag)} 分钟前），可能是数据源延迟。`; }
  else warn.hidden = true;
}
function renderCards(hs, wt) {
  const Q = S.q.quotes, rows = hs.map(t => ({ t, q: Q[t], w: wt[t] })).filter(r => r.q && r.q.chg != null);
  const avg = rows.reduce((a, r) => a + r.q.chg * r.w, 0);
  const up = rows.filter(r => r.q.chg > 0.005).length, dn = rows.filter(r => r.q.chg < -0.005).length;
  const best = [...rows].sort((a, b) => b.q.chg - a.q.chg)[0], worst = [...rows].sort((a, b) => a.q.chg - b.q.chg)[0];
  const card = (k, v, s, c = '') => `<div class="pn-cd"><div class="pn-cd-k">${k}</div><div class="pn-cd-v num ${c}">${v}</div><div class="pn-cd-s">${s}</div></div>`;
  const label = S.showW ? (S.w?.placeholder ? '示例占比加权' : '按占比加权') : '等权平均';
  $('#cards').innerHTML =
    card('持仓当日涨跌', pct(avg), label, cls(avg)) +
    card('涨跌家数', `<span class="up">${up}</span><small>涨</small> <span class="dn">${dn}</span><small>跌</small>`, `共 ${rows.length} 只${rows.length - up - dn ? `，${rows.length - up - dn} 只持平` : ''}`) +
    card('领涨', best ? esc(best.t) : '—', best ? `${pct(best.q.chg)} · ${esc(NAMES[best.t] || '')}` : '', best ? cls(best.q.chg) : '') +
    card('领跌', worst ? esc(worst.t) : '—', worst ? `${pct(worst.q.chg)} · ${esc(NAMES[worst.t] || '')}` : '', worst ? cls(worst.q.chg) : '');
}
function sparkSVG(v) {
  if (!v || v.length < 2) return '<svg class="spark"></svg>';
  const w = 120, h = 30, mn = Math.min(...v), mx = Math.max(...v), rg = mx - mn || 1;
  const pts = v.map((y, i) => [(i / (v.length - 1) * w).toFixed(1), (h - 3 - (y - mn) / rg * (h - 6)).toFixed(1)]);
  const col = v[v.length - 1] >= v[0] ? 'var(--up)' : 'var(--dn)';
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join('')}" fill="none" stroke="${col}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" opacity=".85"/></svg>`;
}
function renderMarket() {
  const Q = S.q.quotes;
  $('#market').innerHTML = S.q.indices.map(s => {
    const q = Q[s]; if (!q) return '';
    const [cn, en] = INDEX_NAMES[s] || [s, s];
    const per = (l, v) => `<div class="pn-per ${cls(v)}"><small>${l}</small><b class="num ${cls(v)}">${pct(v)}</b></div>`;
    return `<div class="pn-ix"><div class="pn-ix-t"><span class="pn-ix-n">${cn} <small class="faint">${en}</small></span><span class="pn-ix-p num">${px(q.price)}</span></div>
      <div class="pn-ix-row">${sparkSVG(q.spark)}<span class="pn-pill num ${cls(q.chg)}">${pct(q.chg)}</span></div>
      <div class="pn-ix-per">${per('本周', q.wk)}${per('本月', q.mo)}${per('今年', q.ytd)}</div></div>`;
  }).join('');
}
function renderSectors() {
  const Q = S.q.quotes;
  const rows = S.q.sectors.map(t => ({ t, q: Q[t] })).filter(r => r.q && r.q.chg != null).sort((a, b) => b.q.chg - a.q.chg);
  const mx = Math.max(1, ...rows.map(r => Math.abs(r.q.chg)));
  $('#sectors').innerHTML = rows.map(({ t, q }) => {
    const wd = Math.min(50, Math.abs(q.chg) / mx * 50).toFixed(1), c = cls(q.chg);
    return `<div class="pn-sr"><div class="n"><b>${t}</b><span>${SECTOR_NAMES[t] || ''}</span></div>
      <div class="pn-bars" role="img" aria-label="${t} ${pct(q.chg)}"><i class="pn-bar-f ${c}" style="width:${wd}%"></i></div>
      <div class="v num ${c}">${pct(q.chg)}</div></div>`;
  }).join('') || '<div class="pn-empty">暂无板块数据</div>';
}
function renderMap() {
  const box = $('#treemap'), hs = S.q.holdings, Q = S.q.quotes;
  const wt = weights(!S.showW);              // weights hidden -> equal areas too, so nothing leaks through tile sizes
  const W = box.clientWidth || 600, narrow = W < 560;
  const H = Math.round(narrow ? Math.max(360, W * 1.12) : Math.max(340, Math.min(520, W * 0.6)));
  box.style.height = H + 'px';
  const tiles = squarify(hs.filter(t => Q[t]).map(t => ({ t, v: wt[t] })), 0, 0, W, H);
  box.innerHTML = tiles.map(r => {
    const q = Q[r.t], c = cls(q.chg), mag = Math.min(1, Math.abs(q.chg || 0) / 5);
    const tp = c === 'flat' ? 16 : Math.round(20 + mag * 34);
    const size = r.w * r.h < 9000 || r.w < 96 ? 's' : (r.w > 210 && r.h > 150 ? 'l' : 'm');
    const col = LOGO_COL[hue(r.t)];
    return `<div class="pn-tile ${c} ${size}" role="listitem" style="left:${r.x.toFixed(1)}px;top:${r.y.toFixed(1)}px;width:${r.w.toFixed(1)}px;height:${r.h.toFixed(1)}px">
      <a href="https://finance.yahoo.com/quote/${encodeURIComponent(r.t)}" target="_blank" rel="noopener" style="--tp:${tp}%" aria-label="${r.t} ${pct(q.chg)}${S.showW ? ' 占比 ' + (wt[r.t] * 100).toFixed(1) + '%' : ''}">
        <div class="pn-th"><span class="pn-lg" style="background:color-mix(in srgb,${col} 26%,var(--card));color:${col}">${esc(r.t.slice(0, 2))}</span><span class="pn-tk">${esc(r.t)}</span></div>
        <div class="pn-tb"><div class="pn-tc num">${pct(q.chg)}</div>${S.showW ? `<div class="pn-tw num">占比 ${(wt[r.t] * 100).toFixed(1)}%</div>` : ''}<div class="pn-tp num">${px(q.price)}</div>${q.ext ? `<div class="pn-te num">${extLine(q)}</div>` : ''}</div>
      </a></div>`;
  }).join('');
  $('#areaNote').textContent = S.showW ? '持仓占比' : '等分（占比已隐藏）';
  // list under the map (also the readable view on phones)
  $('#holdlist').className = 'pn-table' + (S.showW ? '' : ' nw');
  $('#holdlist').innerHTML = `<div class="pn-tr hd"><span>标的</span><span style="text-align:right">现价</span><span style="text-align:right">当日</span>${S.showW ? '<span style="text-align:right">占比</span>' : ''}</div>` +
    [...hs].filter(t => Q[t]).sort((a, b) => wt[b] - wt[a] || Q[b].chg - Q[a].chg).map(t => {
      const q = Q[t], col = LOGO_COL[hue(t)];
      return `<a class="pn-tr" href="https://finance.yahoo.com/quote/${encodeURIComponent(t)}" target="_blank" rel="noopener">
        <span class="c1"><span class="pn-lg" style="background:color-mix(in srgb,${col} 26%,var(--card));color:${col}">${esc(t.slice(0, 2))}</span><span style="min-width:0"><b>${esc(t)}</b><span>${esc(NAMES[t] || q.name)}</span></span></span>
        <span class="c2 num">${px(q.price)}${q.ext ? `<small>${extLine(q)}</small>` : ''}</span>
        <span class="c3"><span class="pn-pill num ${cls(q.chg)}">${pct(q.chg)}</span></span>
        ${S.showW ? `<span class="c4 num">${(wt[t] * 100).toFixed(1)}%</span>` : ''}</a>`;
    }).join('');
}
function render() {
  if (!S.q) return;
  const wt = weights(!S.showW);
  renderCards(S.q.holdings, wt); renderMarket(); renderMap(); renderSectors(); renderStatus();
  const badge = $('#badge'); badge.hidden = !(S.w?.placeholder && S.showW);
  $('#wtoggle').checked = S.showW;
  $('#wnote').textContent = S.w?.placeholder ? '当前持仓占比为等权示例数据（并非真实占比），仅用于展示布局；' : '持仓占比仅以百分比示意；';
}

/* ---------- loop ---------- */
async function refresh(manual) {
  if (S.loading) return; S.loading = true;
  const btn = $('#refresh'); btn.classList.add('spin');
  try { S.q = await loadQuotes(); render(); }
  catch (e) { console.warn(e); if (!S.q) { $('#main').insertAdjacentHTML('afterbegin', '<div class="pn-warn">行情数据加载失败，请检查网络后重试。</div>'); } else { const w = $('#warn'); w.hidden = false; w.textContent = '刷新失败，显示的是上一次数据。'; } }
  finally { S.loading = false; setTimeout(() => btn.classList.remove('spin'), manual ? 500 : 0); }
}
(async function init() {
  await loadWeights();
  $('#wtoggle').addEventListener('change', e => { S.showW = e.target.checked; try { localStorage.setItem('pn.showW', S.showW ? '1' : '0'); } catch (x) { /* ignore */ } render(); });
  $('#refresh').addEventListener('click', () => refresh(true));
  await refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, REFRESH_MS);
  setInterval(() => { if (S.q && !document.hidden) renderStatus(); }, 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (S.q) renderMap(); }, 120); });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') addEventListener('load', () => navigator.serviceWorker.register('../sw.js').catch(() => {}));
})();
})();
