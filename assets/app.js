/* 绿仔的投资小屋 — zero-dependency SPA (Google-Finance layout, Morandi palette). Data: data/index.json + data/reports/<date>.json */
(() => {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $('#app');
const NOANIM = /noanim/.test(location.search) || matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- icons (hand-drawn, 24x24) ---------- */
const I = {
  value: '<path d="M12 3v17M6 20h12M5 7h14M12 5.5V7"/><path d="M5 7l-3 6.5a3.2 3.2 0 006 0L5 7zM19 7l-3 6.5a3.2 3.2 0 006 0L19 7z"/>',
  growth: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.1 2.1 0 00-2.9-.1z"/><path d="M12 15l-3-3a22 22 0 012-3.9A12.9 12.9 0 0122 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 01-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
  tech: '<path d="M7 3v4M7 17v4M17 2v4M17 15v5"/><rect x="4.5" y="7" width="5" height="10" rx="1"/><rect x="14.5" y="6" width="5" height="9" rx="1"/>',
  macro: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>',
  host: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
  back: '<path d="M20 12H4.5M11 5l-7 7 7 7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.6v.2"/>',
  down: '<path d="M6.5 9.5l5.5 5.5 5.5-5.5"/>',
  right: '<path d="M9.5 6l6 6-6 6"/>',
  replay: '<path d="M3.5 12a8.5 8.5 0 108.5-8.5A9 9 0 005.7 6.3L3.5 8.5"/><path d="M3.5 3.5v5h5"/>',
  why: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14.5 7H21v6.5"/>',
  bank: '<path d="M3 21h18M5 21V10M19 21V10M9.7 21V10M14.3 21V10M2.5 10L12 4l9.5 6"/>',
  crowd: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><path d="M16 4.5a3.5 3.5 0 010 7M21.5 20a6.5 6.5 0 00-4-6"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  layers: '<path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z"/><path d="M3 12l9 4.5 9-4.5M3 16.5L12 21l9-4.5"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/>',
  shield: '<path d="M12 21.5s7.5-3.7 7.5-9.5V5.5L12 2.8 4.5 5.5V12c0 5.8 7.5 9.5 7.5 9.5z"/><path d="M9 12l2 2 4-4"/>',
  users: '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2.5 20a5.5 5.5 0 0111 0M10.5 20a5.5 5.5 0 0111 0"/>',
  doc: '<path d="M14 2.5H6.5a2 2 0 00-2 2v15a2 2 0 002 2h11a2 2 0 002-2V8z"/><path d="M14 2.5V8h5.5M8.5 13h7M8.5 17h4.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  list: '<path d="M4 6.5h16M4 12h16M4 17.5h10"/>',
  pano: '<rect x="3.5" y="3.5" width="9" height="17" rx="2"/><rect x="14.5" y="3.5" width="6" height="7.5" rx="2"/><rect x="14.5" y="13" width="6" height="7.5" rx="2"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  link: '<path d="M14 4h6v6M20 4l-8.5 8.5"/><path d="M18 14v4.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 014 18.5v-11A1.5 1.5 0 015.5 6H10"/>',
  trend: '<path d="M3 17.5l5.5-5.5 4 4L21 7.5"/><path d="M15.5 7.5H21V13"/><path d="M3 21h18" opacity=".45"/>',
  share: '<path d="M12 3.5v11M8 7l4-3.5L16 7"/><path d="M7.5 10.5H6a1.5 1.5 0 00-1.5 1.5v7A1.5 1.5 0 006 20.5h12a1.5 1.5 0 001.5-1.5v-7a1.5 1.5 0 00-1.5-1.5h-1.5"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M4 17l5-4.5 3.5 3 3-2.5L20 17"/>',
  aup: '<path d="M12 18.5v-13M6.5 11L12 5.5l5.5 5.5"/>',
  adn: '<path d="M12 5.5v13M6.5 13l5.5 5.5 5.5-5.5"/>',
  home: '<path d="M4 10.5L12 4l8 6.5V19a1.5 1.5 0 01-1.5 1.5H15V15h-6v5.5H5.5A1.5 1.5 0 014 19z"/>',
};
const FILLED = {
  spark: '<path d="M11 2.5c.7 5 3.6 7.9 8.6 8.6-5 .7-7.9 3.6-8.6 8.6-.7-5-3.6-7.9-8.6-8.6 5-.7 7.9-3.6 8.6-8.6z"/><path d="M19.3 14.8c.3 2 1.5 3.2 3.4 3.5-2 .3-3.1 1.5-3.4 3.4-.3-2-1.5-3.1-3.5-3.4 2-.3 3.2-1.5 3.5-3.5z" opacity=".75"/>',
  up: '<circle cx="12" cy="12" r="10"/><path d="M12 17.2V7.3M7.6 11.4L12 7l4.4 4.4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  dn: '<circle cx="12" cy="12" r="10"/><path d="M12 6.8v9.9M7.6 12.6L12 17l4.4-4.4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',

  send: '<path d="M12 5.2l6.2 6.2-1.5 1.5-3.6-3.6V19h-2.2V9.3l-3.6 3.6-1.5-1.5z"/>',
};
const svg = (k, cls = '') => FILLED[k]
  ? `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${FILLED[k]}</svg>`
  : `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]}</svg>`;
const sparkSearch = `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M14.6 15.6L20 21" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M18 2.2c.3 2 1.4 3.1 3.4 3.4-2 .3-3.1 1.4-3.4 3.4-.3-2-1.4-3.1-3.4-3.4 2-.3 3.1-1.4 3.4-3.4z" fill="currentColor"/></svg>`;
const APP = '绿仔的投资小屋';
/* wordmark: B (rounded + cottage) is final. ?logo=a|c still previews the other drafts for this page load only (not persisted). */
const LOGO_V = (() => { try { localStorage.removeItem('logo'); } catch (e) {} const m = location.search.match(/[?&]logo=([abc])/); return m ? m[1] : 'b'; })();
document.documentElement.dataset.logo = LOGO_V;
const MARKS = {
  // A: brush seal — a soft brick-red square chop with the character 绿
  a: `<svg class="mark" viewBox="0 0 40 40" aria-hidden="true"><rect x="3" y="3" width="34" height="34" rx="7" class="mk-fill"/><rect x="6.5" y="6.5" width="27" height="27" rx="4.5" fill="none" class="mk-line" stroke-width="1"/><text x="20" y="28.6" text-anchor="middle" class="mk-ch">绿</text></svg>`,
  // B: rounded little house with a sprouting leaf on the roof
  b: `<svg class="mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M7 19.5L20 9l13 10.5V31a3 3 0 01-3 3H10a3 3 0 01-3-3z" class="mk-fill"/><path d="M16.5 34v-7.2a3.5 3.5 0 017 0V34" class="mk-door"/><path d="M26.5 12.5c.2-3.6 2.6-6 6.6-6.3-.1 3.9-2.6 6.4-6.6 6.3z" class="mk-leaf"/><path d="M26.5 12.5c1.5-1.9 3.2-3.3 5-4.3" class="mk-vein" fill="none" stroke-width="1" stroke-linecap="round"/></svg>`,
  // C: editorial monogram — thin double ring around a serif 绿
  c: `<svg class="mark" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17.5" fill="none" class="mk-line" stroke-width="1.1"/><circle cx="20" cy="20" r="15" fill="none" class="mk-line" stroke-width=".5"/><text x="20" y="27.2" text-anchor="middle" class="mk-ch">绿</text></svg>`,
};
const wordmark = (cls = '') => `<span class="wm wm-${LOGO_V} ${cls}" aria-label="${APP}">${MARKS[LOGO_V]}<span class="wm-t" aria-hidden="true">${LOGO_V === 'c' ? '<i class="wm-rule"></i>' : ''}绿仔的投资小屋${LOGO_V === 'c' ? '<i class="wm-rule"></i>' : ''}</span></span>`;

const SCHOOLS = {
  '价值派': { k: 'value', v: 'val', desc: '估值、安全边际、现金流' },
  '成长派': { k: 'growth', v: 'gro', desc: '收入增速、赛道、兑现' },
  '技术派': { k: 'tech', v: 'tec', desc: '趋势、均线、量价与波动' },
  '宏观派': { k: 'macro', v: 'mac', desc: '利率、流动性、政策周期' },
  '主持人': { k: 'host', v: 'hst', desc: '' },
};
const scVars = n => { const v = (SCHOOLS[n] || SCHOOLS['主持人']).v; return `--sc:var(--${v});--scb:var(--${v}-b)`; };
const avatar = (n, sm) => `<span class="av${sm ? ' sm' : ''}" style="${scVars(n)}" title="${n}">${svg((SCHOOLS[n] || SCHOOLS['主持人']).k)}</span>`;

/* ---------- formatting ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cls = v => v == null ? 'flat' : v > 0 ? 'up' : v < 0 ? 'dn' : 'flat';
const fmtPct = v => v == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2) + '%';
const fmtAbs = v => v == null ? '' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPx = v => v == null ? '—' : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** Material-style change pill: tonal background + arrow, unsigned percent */
const pill = (v, big) => `<span class="pill num ${cls(v)}${big ? ' lg' : ''}">${v ? svg(v > 0 ? 'aup' : 'adn') : ''}${v == null ? '—' : Math.abs(v).toFixed(2) + '%'}</span>`;
/** list-style change: colored signed % + small filled circle arrow */
const chgArrow = v => `<span class="ca num ${cls(v)}">${v ? svg(v > 0 ? 'aup' : 'adn') : ''}${fmtPct(v)}</span>`;
function md(s) {
  let h = esc(s);
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/(https?:\/\/[^\s<；，）]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  h = h.replace(/(^|[\s（(：:，、>])([+\-−]\d+(?:\.\d+)?%)/g, (m, p, v) => `${p}<span class="${v[0] === '+' ? 'up' : 'dn'}">${v}</span>`);
  return h;
}
const md2 = s => md(s).replace(/<\/?strong>/g, '');
const plain = s => String(s ?? '').replace(/\*\*/g, '');
const WD = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const dparts = iso => { const [y, m, d] = iso.split('-').map(Number); return { y, m, d, wd: WD[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] }; };
const shortD = iso => { const p = dparts(iso); return `${p.m}/${p.d}`; };
const cnD = iso => { const p = dparts(iso); return `${p.m}月${p.d}日`; };
const bjDate = iso => { const t = new Date(iso + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + 1); return t.toISOString().slice(0, 10); };
const dayDiff = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const relD = (iso, ref) => { const n = dayDiff(iso, ref); return n === 0 ? '当天' : n > 0 ? `${n} 天前` : `${-n} 天后`; };
const hue = t => { let h = 0; for (const c of String(t)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 8; };
const tkBadge = (t, sm) => `<span class="tkb h${hue(t)}${sm ? ' sm' : ''}">${esc(t)}</span>`;
const favi = t => `<span class="fav h${hue(t)}">${esc(String(t).replace(/^www\./, '').slice(0, 1).toUpperCase())}</span>`;
const DARK = matchMedia('(prefers-color-scheme: dark)');

/* ---------- data ---------- */
const state = { index: null, reports: {}, date: null, range: '1M' };
async function getJSON(u) { const r = await fetch(u, { cache: 'no-cache' }); if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); }
async function loadIndex() { if (!state.index) state.index = await getJSON('data/index.json'); return state.index; }
async function loadReport(date) {
  const idx = await loadIndex();
  date = date || state.date || idx.latest;
  state.date = date;
  if (!state.reports[date]) state.reports[date] = await getJSON(`data/reports/${date}.json`);
  return state.reports[date];
}
const prevClose = S => S && S.length > 1 ? S[S.length - 2][1] : null;

/* ---------- small charts ---------- */
let gid = 0;
/** area sparkline with dotted baseline at first value (index cards / lists); stretches to its box */
function spark(series, { w = 120, h = 40, base = true, fill = true } = {}) {
  if (!series || series.length < 2) return '';
  const v = series.map(p => p[1]), mn = Math.min(...v), mx = Math.max(...v), rg = mx - mn || 1;
  const Y = y => (h - 3 - ((y - mn) / rg) * (h - 8)).toFixed(2);
  const pts = v.map((y, i) => [((i / (v.length - 1)) * w).toFixed(2), Y(y)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join('');
  const col = v[v.length - 1] >= v[0] ? 'var(--up)' : 'var(--dn)';
  const id = 'sg' + (++gid);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">${fill ? `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${col};stop-opacity:.13"/><stop offset="1" style="stop-color:${col};stop-opacity:.02"/></linearGradient></defs><path d="${d}L${w} ${h}L0 ${h}Z" fill="url(#${id})"/>` : ''}${base ? `<line class="basel" x1="0" x2="${w}" y1="${Y(v[0])}" y2="${Y(v[0])}" stroke-width="1" stroke-dasharray="1 3" vector-effect="non-scaling-stroke"/>` : ''}<path d="${d}" fill="none" style="stroke:${col};color:${col}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}

/* ---------- main quote chart ---------- */
const RANGES = [['1D', '1天'], ['5D', '5天'], ['1M', '1个月'], ['3M', '3个月'], ['6M', '6个月'], ['1Y', '1年']];
function rangeSeries(s, k) {
  const C = s.chart || [], Hs = s.hist || [];
  if (k === '5D') return C.length >= 6 ? C.slice(-6) : null;
  if (k === '1M') return C.length >= 2 ? C : null;
  if (k === '3M') return Hs.length > C.length ? Hs : null;
  return null;
}
const RLABEL = { '5D': '近 5 个交易日', '1M': '近 1 个月', '3M': '近 3 个月' };
function mountChart(box, s) {
  const k = state.range, S = rangeSeries(s, k);
  const plot = $('.plot', box), tip = $('.tip', box), perf = $('.perf', box);
  $$('.rtabs button', box).forEach(b => { b.classList.toggle('on', b.dataset.r === k); b.setAttribute('aria-selected', b.dataset.r === k); });
  if (!S) { plot.innerHTML = '<div class="empty">暂无该区间行情数据</div>'; return; }
  const W = Math.max(280, plot.clientWidth), H = W < 560 ? 216 : 288;
  const pl = 2, pr = 48, pt = 30, pb = 26;
  const v = S.map(p => p[1]); let mn = Math.min(...v), mx = Math.max(...v); const pad = (mx - mn) * .12 || 1; mn -= pad; mx += pad;
  const X = i => pl + (i / (S.length - 1)) * (W - pl - pr), Y = y => pt + (1 - (y - mn) / (mx - mn)) * (H - pt - pb);
  const base = v[0], last = v[v.length - 1], up = last >= base, col = up ? 'var(--up)' : 'var(--dn)';
  const d = S.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('');
  let g = '';
  for (let j = 0; j <= 3; j++) { const y = mn + (mx - mn) * (j / 3), yy = Y(y).toFixed(1); g += `<line class="gl" x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}"/><text x="${W - 4}" y="${+yy + 4}" text-anchor="end" class="ax">${fmtPx(y)}</text>`; }
  const nx = W < 420 ? 3 : 5, xi = [...new Set(Array.from({ length: nx }, (_, j) => Math.round(j * (S.length - 1) / (nx - 1))))];
  const xl = xi.map(i => `<text x="${X(i)}" y="${H - 7}" class="ax" text-anchor="${i === 0 ? 'start' : i === S.length - 1 ? 'end' : 'middle'}">${shortD(S[i][0])}</text>`).join('');
  const bl = `<line class="basel" x1="${pl}" x2="${W - pr}" y1="${Y(base)}" y2="${Y(base)}" stroke-dasharray="1.5 3.5"/>`;
  const evIdx = (s.events || []).map(e => e.date >= S[0][0] ? S.findIndex(p => p[0] >= e.date) : -1);
  let lastX = -99, lastBy = 0;
  const mk = evIdx.map((i, n) => { if (i < 0) return ''; const x = X(i), y = Y(S[i][1]); let by = Math.max(11, y - 17);
    if (x - lastX < 19 && Math.abs(by - lastBy) < 19) by = lastBy - 19 < 9 ? lastBy + 19 : lastBy - 19;
    lastX = x; lastBy = by;
    return `<g class="mk" data-n="${n}"><line x1="${x}" x2="${x}" y1="${by + (by < y ? 8 : -8)}" y2="${y + (by < y ? -4 : 4)}" class="mks" stroke-width="1.2"/><circle class="mkd" cx="${x}" cy="${y}" r="3.6" stroke-width="2"/><g transform="translate(${x},${by})"><circle class="mkb" r="8.5"/><text y="3.7" text-anchor="middle" class="mkn">${n + 1}</text></g></g>`; }).join('');
  const id = 'cg' + (++gid);
  plot.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(s.ticker)} ${RLABEL[k]}价格走势">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${col};stop-opacity:.12"/><stop offset="1" style="stop-color:${col};stop-opacity:0"/></linearGradient></defs>
    ${g}${xl}<path d="${d}L${X(S.length - 1)} ${H - pb}L${X(0)} ${H - pb}Z" fill="url(#${id})"/>${bl}
    <path class="ln" d="${d}" fill="none" style="stroke:${col};color:${col};stroke-dasharray:1;stroke-dashoffset:${NOANIM ? 0 : 1}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" pathLength="1"/>
    <line class="cx" x1="0" x2="0" y1="${pt - 6}" y2="${H - pb}" stroke-width="1" opacity="0"/>
    ${mk}
    <circle class="cd" r="5.5" style="fill:${col}" stroke-width="2.5" opacity="0"/>
    <rect class="hit" x="0" y="0" width="${W - pr + 6}" height="${H}" fill="transparent"/></svg>`;
  const ln = $('.ln', plot);
  if (!NOANIM) requestAnimationFrame(() => requestAnimationFrame(() => { ln.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.32,.72,0,1)'; ln.style.strokeDashoffset = 0; }));
  const rc = (last / base - 1) * 100;
  perf.innerHTML = `<span class="faint">${RLABEL[k]}</span> <b class="num ${cls(rc)}">${fmtAbs(last - base)} (${fmtPct(rc)})</b>`;
  const svgEl = $('svg', plot), cx = $('.cx', plot), cd = $('.cd', plot);
  const at = i => {
    const x = X(i), y = Y(S[i][1]);
    cx.setAttribute('x1', x); cx.setAttribute('x2', x); cx.setAttribute('opacity', 1); cd.setAttribute('cx', x); cd.setAttribute('cy', y); cd.setAttribute('opacity', 1);
    const pv = i ? S[i - 1][1] : null, dd = pv ? (S[i][1] / pv - 1) * 100 : null, p = dparts(S[i][0]);
    const n = evIdx.indexOf(i), ev = n >= 0 ? s.events[n] : null;
    tip.innerHTML = `<div><b class="num">${fmtPx(S[i][1])}</b> <span class="faint">USD</span> ${dd == null ? '' : `<span class="num ${cls(dd)}">${fmtPct(dd)}</span>`}</div><div class="faint">${p.m}月${p.d}日 ${p.wd} 收盘</div>${ev ? `<div class="tev"><span class="n">${n + 1}</span>${md2(ev.label)}</div>` : ''}`;
    const r = svgEl.getBoundingClientRect(), bx = box.getBoundingClientRect();
    const px = r.left - bx.left + x / W * r.width;
    tip.style.opacity = 1;
    const tw = tip.offsetWidth; tip.style.left = Math.max(0, Math.min(bx.width - tw, px - tw / 2)) + 'px';
    $$('.news-row[data-n]').forEach(el => el.classList.toggle('on', +el.dataset.n === n));
  };
  const show = e => { const r = svgEl.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * W; at(Math.max(0, Math.min(S.length - 1, Math.round((sx - pl) / (W - pl - pr) * (S.length - 1))))); };
  const hide = () => { tip.style.opacity = 0; cx.setAttribute('opacity', 0); cd.setAttribute('opacity', 0); };
  const hit = $('.hit', plot);
  hit.addEventListener('pointermove', show); hit.addEventListener('pointerdown', show); hit.addEventListener('pointerleave', hide); hit.addEventListener('pointercancel', hide);
  $$('.mk', plot).forEach(m => m.addEventListener('click', () => { const i = evIdx[+m.dataset.n]; if (i >= 0) at(i); }));
  box._at = n => { const i = evIdx[n]; if (i >= 0) at(i); return i >= 0; };
}
function quoteChartHTML(s) {
  return `<section class="qchart" id="qchart">
    <div class="rtabs" role="tablist" aria-label="时间范围">${RANGES.map(([k, l]) => { const ok = !!rangeSeries(s, k); return `<button role="tab" data-r="${k}" ${ok ? '' : 'disabled title="暂无该区间数据（日报仅含日线收盘）"'}>${l}</button>`; }).join('')}</div>
    <div class="perf"></div>
    <div class="plot"></div><div class="tip" aria-live="polite"></div>
    ${s.eventsFrom ? `<div class="faint small" style="margin-top:4px">图上标注事件来自底层资产 ${esc(s.eventsFrom)}</div>` : ''}
  </section>`;
}
function wireQuoteChart(s) {
  const box = $('#qchart'); if (!box) return;
  if (!rangeSeries(s, state.range)) state.range = '1M';
  $$('.rtabs button:not([disabled])', box).forEach(b => b.addEventListener('click', () => { state.range = b.dataset.r; mountChart(box, s); }));
  mountChart(box, s);
  let w = box.clientWidth, t;
  const onR = () => { clearTimeout(t); t = setTimeout(() => { if (box.isConnected && box.clientWidth !== w) { w = box.clientWidth; mountChart(box, s); } }, 120); };
  addEventListener('resize', onR);
  return () => removeEventListener('resize', onR);
}

/* ---------- shell ---------- */
function universe(rep) {
  const seen = new Set(), out = [];
  rep.focus.forEach(s => { seen.add(s.ticker); out.push({ t: s.ticker, n: s.name, p: s.price, d: s.day, focus: true }); });
  rep.watch.all.forEach(w => { if (!seen.has(w.ticker)) { seen.add(w.ticker); out.push({ t: w.ticker, n: w.name, p: w.price, d: w.day }); } });
  return out;
}
const searchBox = m => `<div class="search${m ? ' sm-only' : ' sd-only'}" role="search">
      ${svg('search', 'si')}<input class="q" type="search" placeholder="搜索股票代码或名称，如 IREN" autocomplete="off" spellcheck="false" aria-label="搜索股票" aria-expanded="false">
      <button class="ib qx" type="button" aria-label="清除" hidden>${svg('close')}</button>
      <div class="sr" role="listbox" hidden></div></div>`;
function appbar(ctx, back, navTitle = '') {
  const { idx, rep } = ctx;
  const dsel = idx && rep ? `<label class="dsel press" title="选择日报日期">${svg('cal')}<select id="dateSel" aria-label="选择日报日期">${idx.reports.map(r => `<option value="${r.date}" ${r.date === rep.date ? 'selected' : ''}>${shortD(r.date)} ${dparts(r.date).wd}</option>`).join('')}</select>${svg('down', 'dd')}</label>` : '';
  return `<header class="appbar glass"><div class="ab">
    <div class="ab-l">${back ? `<a class="ib back press" href="${back}" aria-label="返回">${svg('back')}</a>` : ''}<a class="brand press" href="#/" aria-label="${APP} 首页">${wordmark()}</a></div>
    <div class="ab-t" aria-hidden="true">${navTitle}</div>
    <div class="ab-c">${searchBox(false)}</div>
    <div class="ab-r"><button class="ib sbtn press" type="button" aria-label="搜索">${svg('search')}</button>${dsel}<a class="ib hide-m press" href="#/about" aria-label="关于" title="关于项目">${svg('info')}</a></div>
  </div></header>`;
}
const TABS = [['#/', '首页'], ['#/w', '自选'], ['panorama/', '持仓全景'], ['#/about', '关于'], ['#/sources', '来源']];
const tabs = active => `<nav class="tabs" aria-label="页面">${TABS.map(([h, n]) => `<a href="${h}" class="${active === h ? 'on' : ''}" ${active === h ? 'aria-current="page"' : ''}>${n}</a>`).join('')}</nav>`;
function leftHTML(rep, cur) {
  if (!rep) return '';
  const row = (t, n, p, d, href, sp, on) => `<a class="lrow${on ? ' on' : ''}" href="${href}"><div class="lt"><b>${esc(t)}</b><span>${esc(n)}</span></div>${sp ? `<div class="lsp">${sp}</div>` : '<div class="lsp"></div>'}<div class="lp"><b class="num">${p}</b>${chgArrow(d)}</div></a>`;
  const ix = rep.market.indices;
  return `<div class="lhd"><h2>列表</h2></div>
    <section class="lsec"><div class="lsh"><h3>重点关注</h3><span class="faint">${rep.focus.length} 只</span></div>
      ${rep.focus.map(s => row(s.ticker, s.underlying ? `2 倍做多 ${s.underlying}` : s.name, fmtPx(s.price), s.day, `#/s/${s.ticker}`, spark(s.chart, { w: 44, h: 20, base: false, fill: false }), s.ticker === cur)).join('')}</section>
    <section class="lsec"><div class="lsh"><h3>自选异动</h3><a class="more" href="#/w">全部 ${rep.watch.all.length}</a></div>
      ${rep.watch.all.slice(0, 8).map(w => row(w.ticker, w.name, fmtPx(w.price), w.day, `#/s/${w.ticker}`, '', w.ticker === cur)).join('')}</section>
    <section class="lsec"><div class="lsh"><h3>指数</h3></div>
      ${ix.map(x => row(x.name, x.symbol.replace('^', ''), x.symbol === '^TNX' ? x.price.toFixed(2) + '%' : fmtPx(x.price), x.day, '#/', '', false)).join('')}</section>`;
}
const disclaimer = rep => `<footer class="foot"><p><b>免责声明</b>：本站内容由 AI 基于公开信息自动整理与生成，包括“流派辩论”在内的观点均为 AI 模拟，可能存在错误或遗漏；<b>不构成任何投资建议</b>。投资有风险，决策请独立判断。${rep ? `行情来源：Yahoo Finance 日线收盘；数据截至美东 ${rep.date} 收盘。颜色约定：红涨绿跌。` : ''}</p><div class="fl">© ${new Date().getFullYear()} Rein · ${APP}<span>·</span><a href="#/about">关于</a><span>·</span><a href="#/sources">信息来源</a></div></footer>`;
const TABBAR = [['#/', 'home', '首页'], ['#/w', 'grid', '自选'], ['panorama/', 'pano', '全景'], ['#/about', 'info', '关于'], ['#/sources', 'doc', '来源']];
const tabbar = active => `<nav class="tabbar glass" aria-label="主导航">${TABBAR.map(([h, k, n]) => `<a href="${h}" class="press${active === h ? ' on' : ''}" ${active === h ? 'aria-current="page"' : ''}>${svg(k)}<span>${n}</span></a>`).join('')}</nav>`;
function page(ctx, { tab, back, cur, center, right = '', rightMobile = false, after = '', title = '', sub = '', navTitle = '' }) {
  const lt = title ? `<div class="lt-block"><h1 class="ltitle">${title}</h1>${sub ? `<p class="lt-sub">${sub}</p>` : ''}${searchBox(true)}</div>` : '';
  return appbar(ctx, back, navTitle || title) + `<div class="layout pg-enter${back ? ' push' : ''}">
    <aside class="col-l" aria-label="列表">${leftHTML(ctx.rep, cur)}</aside>
    <main class="col-c">${lt}${tab ? tabs(tab) : ''}${center}</main>
    ${right ? `<aside class="col-r${rightMobile ? '' : ' hide-m'}" aria-label="AI 研究">${right}</aside>` : ''}
  </div>${after}${disclaimer(ctx.rep)}${tabbar(tab || '')}`;
}

/* ---------- search + prompt ---------- */
function findTickers(rep, text) {
  const U = universe(rep), up = String(text).toUpperCase();
  const toks = up.match(/[A-Z][A-Z.\-]{0,5}/g) || [];
  for (const t of toks) { const hit = U.find(u => u.t === t); if (hit) return hit; }
  const q = String(text).trim().toLowerCase();
  return q.length >= 2 ? U.find(u => u.n.toLowerCase().includes(q) || q.includes(u.n.toLowerCase())) : null;
}
function wireSearch(rep) {
  if (!rep) return;
  const U = universe(rep);
  $$('.search').forEach(box => {
    const inp = $('.q', box), sr = $('.sr', box), qx = $('.qx', box); let sel = -1, items = [];
    const rowH = (u, i) => `<a class="srow${i === sel ? ' on' : ''}" role="option" href="#/s/${esc(u.t)}">${tkBadge(u.t, true)}<div class="st"><b>${esc(u.n)}</b><span>${esc(u.t)}${u.focus ? ' · <em>AI 深度解读</em>' : ''}</span></div><div class="sp"><b class="num">${fmtPx(u.p)}</b>${pill(u.d)}</div></a>`;
    const render = () => {
      const q = inp.value.trim().toLowerCase(); qx.hidden = !q;
      items = q ? U.filter(u => u.t.toLowerCase().includes(q) || u.n.toLowerCase().includes(q)).sort((a, b) => (b.t.toLowerCase().startsWith(q) - a.t.toLowerCase().startsWith(q)) || (b.focus ? 1 : 0) - (a.focus ? 1 : 0)).slice(0, 8) : U.filter(u => u.focus);
      sr.innerHTML = (q ? '' : '<div class="srh">重点关注</div>') + (items.length ? items.map(rowH).join('') : `<div class="sre">未找到“${esc(inp.value.trim())}”。可输入代码（如 NBIS）或中文/英文名称。</div>`);
      sr.hidden = false; inp.setAttribute('aria-expanded', 'true'); box.classList.add('open'); document.body.classList.add('searching');
    };
    const close = () => { sr.hidden = true; sel = -1; inp.setAttribute('aria-expanded', 'false'); box.classList.remove('open'); document.body.classList.remove('searching'); };
    inp.addEventListener('focus', render);
    inp.addEventListener('input', () => { sel = -1; render(); });
    inp.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!items.length) return; sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; render(); }
      else if (e.key === 'Enter') { const u = items[sel < 0 ? 0 : sel]; if (u) { location.hash = '#/s/' + u.t; inp.blur(); close(); } }
      else if (e.key === 'Escape') { inp.blur(); close(); }
    });
    inp.addEventListener('blur', () => setTimeout(close, 150));
    sr.addEventListener('mousedown', e => e.preventDefault());
    sr.addEventListener('click', () => { inp.blur(); close(); });
    qx.addEventListener('mousedown', e => e.preventDefault());
    qx.addEventListener('click', () => { inp.value = ''; render(); inp.focus(); });
  });
  const sb = $('.sbtn');
  if (sb) sb.addEventListener('click', () => {
    const m = $('.search.sm-only .q');
    if (m) { scrollTo({ top: 0, behavior: NOANIM ? 'auto' : 'smooth' }); setTimeout(() => m.focus(), NOANIM ? 0 : 320); }
    else { state.focusSearch = true; location.hash = '#/'; }
  });
}
const visibleSearch = () => $$('.search .q').find(q => q.offsetParent);
function wirePrompt(rep) {
  $$('form.prompt').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault(); const inp = $('input', f), hint = $('.phint', f), v = inp.value.trim(); if (!v) { inp.focus(); return; }
    const u = findTickers(rep, v);
    if (u) location.hash = `#/s/${u.t}${u.focus ? '/debate' : ''}`;
    else hint.textContent = '暂时只能回答今日日报覆盖的股票，试试输入代码，例如 IREN、MU。';
  }));
}
addEventListener('keydown', e => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { const q = visibleSearch(); if (q) { e.preventDefault(); q.focus(); } } });

/* ---------- AI research panel ---------- */
function researchHTML(rep, mode) {
  const byMove = [...rep.focus].sort((a, b) => Math.abs(b.day || 0) - Math.abs(a.day || 0));
  const qs = byMove.slice(0, 3).map(s => ({ q: `为什么 ${s.ticker} 今天${cls(s.day) === 'up' ? '涨' : cls(s.day) === 'dn' ? '跌' : '走平'}？`, h: `#/s/${s.ticker}` }));
  const mu = rep.focus.find(s => s.ticker === 'MU');
  if (mu) qs.push({ q: '美光财报前，四大流派怎么看 MU？', h: '#/s/MU/debate' });
  const withDeb = byMove.filter(s => s.debate);
  const first = withDeb[0];
  const cons = first ? `<div class="cons-sw">
      <div class="cs-h"><span class="cs-t">${svg('spark')}今日共识</span><span class="avs">${['价值派', '成长派', '技术派', '宏观派'].map(n => avatar(n, true)).join('')}</span></div>
      <div class="chips cs-chips" role="tablist">${withDeb.map((s, i) => `<button role="tab" class="chip${i ? '' : ' on'}" data-t="${esc(s.ticker)}">${esc(s.ticker)}</button>`).join('')}</div>
      ${withDeb.map((s, i) => `<div class="cs-b" data-t="${esc(s.ticker)}" ${i ? 'hidden' : ''}><p>${md(s.debate.consensus)}</p><a class="tlink" href="#/s/${esc(s.ticker)}/debate">查看 ${esc(s.ticker)} 完整辩论 ${svg('right')}</a></div>`).join('')}
    </div>` : '';
  return `<div class="rs">
    <div class="rs-hd"><h2>AI 研究</h2>${mode === 'panel' ? `<a class="ib" href="#/about" title="工作原理" aria-label="工作原理">${svg('info')}</a>` : ''}</div>
    ${mode === 'panel' ? `<p class="greet">你好！今天 <span class="grad">${rep.focus.length} 只重点股</span>的涨跌原因和四派观点都整理好了</p>` : ''}
    <div class="sugg">${qs.map(x => `<a class="sg" href="${x.h}"><span>${esc(x.q)}</span><i>${sparkSearch}</i></a>`).join('')}</div>
    ${cons}
    ${mode === 'panel' ? `<div class="rs-sub">探索更多</div>
    <div class="xchips"><a class="xchip" href="#/w">${svg('grid')}自选速览与板块热力</a><a class="xchip" href="#/s/${esc(byMove[0].ticker)}/debate">${svg('users')}观看四派圆桌辩论</a><a class="xchip" href="#/about">${svg('layers')}AI 工作流是怎么做的</a><a class="xchip" href="#/sources">${svg('doc')}查看信息来源</a></div>
    <form class="prompt" autocomplete="off"><input type="text" placeholder="问问小屋 AI，如：NBIS 为什么大涨？" aria-label="输入问题或股票代码"><div class="pbar"><span class="faint small">基于今日日报 · 非投资建议</span><button class="send" type="submit" aria-label="发送">${svg('send')}</button></div><div class="phint small" aria-live="polite"></div></form>` : ''}
  </div>`;
}
function wireResearch() {
  $$('.cons-sw').forEach(root => $$('.cs-chips .chip', root).forEach(b => b.addEventListener('click', () => {
    $$('.cs-chips .chip', root).forEach(x => x.classList.toggle('on', x === b));
    $$('.cs-b', root).forEach(x => x.hidden = x.dataset.t !== b.dataset.t);
  })));
}

/* ---------- pages ---------- */
function indexCards(rep) {
  return `<div class="icards-wrap"><div class="icards">${rep.market.indices.map(x => {
    const pc = prevClose(x.chart), ab = pc != null ? x.price - pc : null, tnx = x.symbol === '^TNX';
    return `<div class="icard"><div class="in">${esc(x.name)}</div><div class="iv num">${tnx ? x.price.toFixed(2) + '%' : fmtPx(x.price)}</div><div class="ia num">${ab != null ? `(${fmtAbs(ab)})` : '&nbsp;'}</div><div class="ip">${chgArrow(x.day)}</div><div class="isp">${spark(x.chart)}</div></div>`; }).join('')}</div>
    <button class="ib icnext" type="button" aria-label="向右滚动">${svg('right')}</button></div>`;
}
function ringsCard(rep) {
  const F = rep.focus, ups = F.filter(s => s.day > 0), dns = F.filter(s => s.day < 0);
  const avg = a => a.length ? a.reduce((x, s) => x + Math.abs(s.day), 0) / a.length : 0;
  const au = avg(ups), ad = avg(dns), GOAL = 3;
  const ss = F.map(s => s.sentiment).filter(Boolean), bull = ss.reduce((a, x) => a + x.bull, 0), bear = ss.reduce((a, x) => a + x.bear, 0);
  const sent = bull + bear ? bull / (bull + bear) : null;
  const all = rep.watch.all, wu = all.filter(x => x.day > 0).length, wd = all.filter(x => x.day < 0).length;
  const rings = [['r-up', Math.min(1, au / GOAL), 52], ['r-dn', Math.min(1, ad / GOAL), 38], ['r-se', sent || 0, 24]];
  const ring = ([c, v, r], i) => `<circle class="trk ${c}" cx="64" cy="64" r="${r}"/><circle class="arc ${c}" cx="64" cy="64" r="${r}" pathLength="100" style="stroke-dasharray:${Math.max(.5, v * 100).toFixed(1)} 100;animation-delay:${i * 120}ms" transform="rotate(-90 64 64)"/>`;
  return `<section class="rings card" aria-label="今日强弱环">
    <svg class="rg-svg" viewBox="0 0 128 128" role="img" aria-label="涨势 ${fmtPct(au)}，跌势 ${fmtPct(-ad)}，散户看多 ${sent == null ? '—' : Math.round(sent * 100) + '%'}">${rings.map(ring).join('')}</svg>
    <div class="rg-lg">
      <div class="rgi"><span class="k"><i class="kd r-up"></i>涨势</span><b class="num up">${fmtPct(au)}</b><small>${ups.length} 只上涨 · 平均涨幅</small></div>
      <div class="rgi"><span class="k"><i class="kd r-dn"></i>跌势</span><b class="num dn">${fmtPct(-ad)}</b><small>${dns.length} 只下跌 · 平均跌幅</small></div>
      <div class="rgi"><span class="k"><i class="kd r-se"></i>情绪</span><b class="num se">${sent == null ? '—' : Math.round(sent * 100) + '%'}</b><small>散户看多占比 · StockTwits</small></div>
    </div>
    <div class="rg-foot"><div class="brd" role="img" aria-label="自选 ${all.length} 只，${wu} 涨 ${wd} 跌"><i class="up-bg" style="flex:${wu}"></i><i class="fl-bg" style="flex:${all.length - wu - wd}"></i><i class="dn-bg" style="flex:${wd}"></i></div><span>自选 ${all.length} 只 · ${wu} 涨 / ${wd} 跌<em>满环 = 平均涨跌 ${GOAL}%</em></span></div>
  </section>`;
}
function accItem(title, body, { open = false, ai = false, srcs = 0, extra = '' } = {}) {
  return `<details class="acc" ${open ? 'open' : ''}><summary><span class="at">${title}</span>${ai ? `<span class="aim"><span class="aib">${svg('spark')}AI</span>${srcs ? `<span class="faint">${srcs} 个来源</span>` : ''}</span>` : ''}<span class="chev">${svg('down')}</span></summary><div class="ab-body">${body}${extra}</div></details>`;
}
function newsList(rep, items, { limit = 6, showTk = true } = {}) {
  if (!items.length) return '';
  const row = (e, i) => `<a class="news-row${i >= limit ? ' more-row' : ''}" href="${e.href || '#'}" ${e.n != null ? `data-n="${e.n}"` : ''} ${i >= limit ? 'hidden' : ''}><span class="nd"></span><span class="nt">${e.fut ? `<em class="fut">${relD(e.date, rep.date)}</em>` : relD(e.date, rep.date)}</span><span class="ns">${e.n != null ? `<span class="nnum">${e.n + 1}</span>` : favi(e.tk)}${showTk ? `<b>${esc(e.tk)}</b><span class="sep">-</span>` : ''}<span class="nh">${md2(e.label)}</span><span class="ndt num">${shortD(e.date)}</span></span></a>`;
  return `<div class="news">${items.map(row).join('')}${items.length > limit ? `<button class="morebtn" type="button">显示更多内容 ${svg('down')}</button>` : ''}</div>`;
}
function wireMore() { $$('.morebtn').forEach(b => b.addEventListener('click', () => { $$('.more-row', b.parentElement).forEach(r => r.hidden = false); b.remove(); })); }
function focusRows(rep) {
  return `<div class="frows">${rep.focus.map((s, i) => `<a class="frow fade-in" href="#/s/${esc(s.ticker)}" style="animation-delay:${i * 35}ms">
      <div class="fl1">${tkBadge(s.ticker)}<div class="fn"><b>${s.underlying ? `${esc(s.underlying)} 2 倍做多 ETF` : esc(s.name)}</b><span>${s.underlying ? `${esc(s.name.split(/\s/)[0])} · ` : ''}本周 <span class="num ${cls(s.week)}">${fmtPct(s.week)}</span></span></div>
        <div class="fsp">${spark(s.chart, { w: 72, h: 30 })}</div><div class="fp"><b class="num">${fmtPx(s.price)}</b>${pill(s.day)}</div></div>
      <div class="fwhy">${svg('spark')}<span>${md2(s.oneLiner)}</span></div></a>`).join('')}</div>`;
}
function wlRow(x, reason) {
  return `<a class="wrow" href="#/s/${esc(x.ticker)}" data-q="${esc((x.ticker + ' ' + x.name).toLowerCase())}">${tkBadge(x.ticker, true)}<div class="wn"><b>${esc(x.name)}</b><span>${esc(x.ticker)} · 周 <span class="num ${cls(x.week)}">${fmtPct(x.week)}</span></span>${reason && x.reason ? `<p>${md2(x.reason)}</p>` : ''}</div><div class="wp"><b class="num">${fmtPx(x.price)}</b>${pill(x.day)}</div></a>`;
}

async function pageHome() {
  const idx = await loadIndex(), rep = await loadReport(), ctx = { idx, rep };
  const p = dparts(rep.date), bj = dparts(bjDate(rep.date)), m = rep.market;
  const hm = m.headline.match(/^(.+?)(——|；|。)([\s\S]*)$/);
  const hTitle = hm ? hm[1] : m.headline, hRest = hm ? (hm[2] === '——' ? hm[3] : hm[3]) : '';
  const nSrc = rep.sources.reduce((a, s) => a + s.urls.length, 0) || rep.sources.length;
  const nUp = rep.focus.filter(s => s.day > 0).length, nDn = rep.focus.filter(s => s.day < 0).length;
  const top = [...rep.focus].sort((a, b) => Math.abs(b.day || 0) - Math.abs(a.day || 0))[0];
  const acc = [accItem(md2(hTitle), `${hRest ? `<p>${md(hRest)}</p>` : ''}<p>${md(m.overview)}</p>`, { open: true, ai: true, srcs: nSrc,
      extra: `<a class="tonal" href="#/s/${esc(top.ticker)}/debate">${sparkSearch}借助 AI 流派辩论深入了解</a>` })]
    .concat(rep.watch.weekly.map(w => { const t = [...w.matchAll(/\*\*(.+?)\*\*/g)].map(x => x[1]).join(' · ') || plain(w).slice(0, 30); return accItem(md(' ' + t), `<p>${md(w)}</p>`); }))
    .concat(rep.watch.anomalies ? [accItem('数据提示：过期代码与低流动性报价', `<p>${md(rep.watch.anomalies)}</p>`)] : []);
  const seen = new Set(), evs = [];
  rep.focus.forEach(s => { if (s.eventsFrom) return; (s.events || []).forEach(e => { const k = e.label; if (seen.has(k)) return; seen.add(k); evs.push({ ...e, tk: s.ticker, href: `#/s/${s.ticker}` }); }); });
  evs.sort((a, b) => b.date.localeCompare(a.date));
  const nxt = rep.nextWeek.map(e => { const mm = e.match(/^\*\*(.+?)\*\*\s*(.*)$/); return mm ? { d: mm[1], t: mm[2] } : { d: '', t: e }; });
  const center = `
    <div class="dateline sd-only"><span class="live">${svg('spark')}AI 日报</span><span>美东 ${p.m}月${p.d}日 ${p.wd} 收盘</span><span class="dot-sep"></span><span>北京时间 ${bj.m}/${bj.d} ${bj.wd}</span></div>
    <div class="hero-grid">
      <section class="hero card"><div class="hero-k">今日 · 重点关注</div>
        <div class="hero-n"><span class="big num">${rep.focus.length}</span><span class="unit">只</span><span class="split"><span><em class="num up">${nUp}</em>涨</span><i></i><span><em class="num dn">${nDn}</em>跌</span></span></div>
        <p class="hero-p">${md2(hTitle)}</p><span class="live">${svg('spark')}AI 日报</span></section>
      ${ringsCard(rep)}
    </div>
    ${indexCards(rep)}
    <section class="sec"><h2 class="sh">美国市场概况</h2><div class="accs">${acc.join('')}</div></section>
    <section class="sec only-m">${researchHTML(rep, 'inline')}</section>
    <section class="sec"><div class="shr"><h2 class="sh">重点关注</h2><span class="faint small">${rep.focus.length} 只 · 点开看 AI 辩论</span></div>${focusRows(rep)}</section>
    ${evs.length ? `<section class="sec"><div class="shr"><h2 class="sh">最新动态</h2><span class="badge-live">AI 摘要</span></div>${newsList(rep, evs, { limit: 5 })}</section>` : ''}
    ${nxt.length ? `<section class="sec"><h2 class="sh">下周关注</h2><div class="cal">${nxt.map(e => `<div class="ce"><span class="cd">${svg('cal')}</span><div><b>${md2(e.d)}</b><p>${md(e.t)}</p></div></div>`).join('')}</div></section>` : ''}
    <section class="sec"><div class="shr"><h2 class="sh">自选异动</h2><a class="more" href="#/w">全部 ${rep.watch.all.length} 只 ${svg('right')}</a></div><div class="wlist">${rep.watch.all.slice(0, 5).map(x => wlRow(x, false)).join('')}</div></section>`;
  app.innerHTML = page(ctx, { tab: '#/', center, right: researchHTML(rep, 'panel'), title: wordmark('wm-lg'), navTitle: wordmark('wm-sm'), sub: `美东 ${p.m}月${p.d}日 ${p.wd}收盘 · 北京时间 ${bj.m}/${bj.d} ${bj.wd}` });
  const ic = $('.icards'), nb = $('.icnext');
  const upd = () => nb.classList.toggle('show', ic.scrollWidth - ic.clientWidth - ic.scrollLeft > 8);
  ic.addEventListener('scroll', upd, { passive: true }); upd(); nb.addEventListener('click', () => ic.scrollBy({ left: 320, behavior: 'smooth' }));
  wireMore(); wireResearch(); wirePrompt(rep);
}

function stripReb(x) {
  let t = x.text.replace(new RegExp('^' + x.school), '').replace(/^[：:，,\s]+/, '');
  if (x.target) t = t.replace(new RegExp('^(回应|提醒|反驳|指出|认为|补充|反问)?' + x.target + '[：:，,]?'), '');
  return t;
}
function debateHTML(s, rep) {
  const d = s.debate; if (!d) return '';
  const names = Object.keys(SCHOOLS).filter(n => n !== '主持人');
  const bubble = (x, round) => { const right = round === 2 && names.indexOf(x.school) % 2 === 1;
    return `<div class="msg ${right ? 'r' : ''} ${NOANIM ? '' : 'hide'}" data-who="${esc(x.school)}" style="${scVars(x.school)}">${avatar(x.school, true)}<div class="mb"><div class="mn"><b>${esc(x.school)}</b>${x.target ? `<span class="at-chip">回应 @${esc(x.target)}</span>` : ''}</div><div class="bub"><span class="tx">${md(round === 2 ? stripReb(x) : x.text)}</span></div></div></div>`; };
  return `<section class="debate" id="debate">
    <div class="rs-hd"><h2>AI 研究</h2><span class="aib">${svg('spark')}AI 模拟</span></div>
    <div class="dq"><div class="dq-b">${esc(s.ticker)} 接下来怎么看？请四大流派各自发表观点。</div></div>
    <div class="panel">${names.map(n => `<div class="who" data-who="${n}" style="${scVars(n)}">${avatar(n)}<span>${n}</span></div>`).join('')}</div>
    <div class="round"><span>第一轮 · 观点陈述</span></div>
    ${d.opening.map(x => bubble(x, 1)).join('')}
    ${d.rebuttal.length ? `<div class="round r2" ${NOANIM ? '' : 'style="display:none"'}><span>第二轮 · 交锋反驳</span></div>${d.rebuttal.map(x => bubble(x, 2)).join('')}` : ''}
    <div class="consensus share-card ${NOANIM ? '' : 'hide'}">
      <div class="sc-top"><span class="sc-brand">${wordmark('wm-xs')}</span><span class="sc-date num">美东 ${rep.date}</span></div>
      <div class="h"><span class="sc-tk">${esc(s.ticker)}</span><span>四大流派共识</span></div>
      <p>${md(d.consensus)}</p>
      <div class="sc-foot"><span class="avs">${names.map(n => avatar(n, true)).join('')}</span><span>价值 · 成长 · 技术 · 宏观 · AI 模拟，非投资建议</span></div>
    </div>
    <div class="dctl"><button class="tonal" id="shareCons" type="button">${svg('share')}分享</button><button class="tonal" id="saveCons" type="button">${svg('image')}存为图片</button><button class="tonal" id="replay" type="button">${svg('replay')}重播</button></div>
    <p class="faint small dnote">观点碰撞 ≠ 买卖建议</p>
  </section>`;
}
function playDebate(root) {
  const msgs = $$('.msg', root), cons = $('.consensus', root), who = $$('.panel .who', root);
  let timer = [];
  const clear = () => { timer.forEach(clearTimeout); timer = []; };
  const run = () => {
    clear();
    msgs.forEach(m => { m.classList.add('hide'); m.classList.remove('show'); });
    $$('.round.r2', root).forEach(r => r.style.display = 'none');
    cons.classList.add('hide'); cons.classList.remove('show');
    let t = 200;
    msgs.forEach(m => {
      const txt = $('.tx', m), orig = txt.dataset.orig || (txt.dataset.orig = txt.innerHTML), w = m.dataset.who;
      timer.push(setTimeout(() => {
        who.forEach(x => x.classList.toggle('speaking', x.dataset.who === w));
        txt.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
        const pr = m.previousElementSibling; if (pr && pr.classList.contains('r2')) pr.style.display = '';
        m.classList.remove('hide'); m.classList.add('show');
      }, t));
      t += 650;
      timer.push(setTimeout(() => { txt.innerHTML = orig; }, t));
      t += Math.min(1400, 350 + txt.textContent.length * 6);
    });
    timer.push(setTimeout(() => { who.forEach(x => x.classList.remove('speaking')); cons.classList.remove('hide'); cons.classList.add('show'); }, t));
  };
  if (NOANIM) return;
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); run(); } }, { threshold: .15 });
  io.observe(root);
  $('#replay', root).addEventListener('click', () => {
    run();
    const pnl = root.closest('.col-r');
    if (pnl && pnl.scrollHeight > pnl.clientHeight + 4 && getComputedStyle(pnl).overflowY !== 'visible') pnl.scrollTo({ top: 0, behavior: 'smooth' });
    else root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  return () => { clear(); io.disconnect(); };
}

function quoteHead(rep, name, tk, price, day, abs, sub) {
  return `<nav class="crumb"><a href="#/">首页</a>${svg('right')}<span>${esc(tk)}</span></nav>
    <h1 class="qn">${esc(name)}</h1>
    <div class="qpx"><span class="num">${fmtPx(price)}</span><small>USD</small></div>
    <div class="qchg">${pill(day, true)}<span class="num ${cls(day)}">${abs != null ? fmtAbs(abs) : ''}</span><span class="faint">今日</span></div>
    <div class="qmeta">美东 ${cnD(rep.date)} ${dparts(rep.date).wd} 收盘${sub ? ` · ${sub}` : ''} · <a href="#/about">免责声明</a></div>`;
}
function statsHTML(rows) { return `<div class="stats">${rows.filter(Boolean).map(([k, v]) => `<div class="kv"><span>${k}</span><b class="num">${v}</b></div>`).join('')}</div>`; }

async function pageStock(tk, anchor) {
  const idx = await loadIndex(), rep = await loadReport(), ctx = { idx, rep };
  const i = rep.focus.findIndex(s => s.ticker === tk), s = rep.focus[i];
  if (!s) return pageQuote(ctx, tk);
  const prev = rep.focus[(i - 1 + rep.focus.length) % rep.focus.length], next = rep.focus[(i + 1) % rep.focus.length];
  const C = s.chart || [], Hs = (s.hist && s.hist.length ? s.hist : C), pc = prevClose(C);
  const mm = S => S.length ? [Math.min(...S.map(p => p[1])), Math.max(...S.map(p => p[1]))] : null;
  const r1 = mm(C), r3 = mm(Hs), se = s.sentiment, neu = se ? se.total - se.bull - se.bear : 0;
  const stats = statsHTML([
    ['收盘价', fmtPx(s.price) + ' USD'], ['前收盘价', pc != null ? fmtPx(pc) : '—'],
    ['当日涨跌', `<span class="${cls(s.day)}">${fmtPct(s.day)}</span>`], ['本周涨跌', `<span class="${cls(s.week)}">${fmtPct(s.week)}</span>`],
    r1 && ['1 个月区间', `${fmtPx(r1[0])} - ${fmtPx(r1[1])}`], r3 && Hs.length > C.length && ['3 个月区间', `${fmtPx(r3[0])} - ${fmtPx(r3[1])}`],
    Hs.length > 1 && [`${Hs.length > C.length ? '3' : '1'} 个月涨跌`, (v => `<span class="${cls(v)}">${fmtPct(v)}</span>`)((s.price / Hs[0][1] - 1) * 100)],
    r3 && ['距区间高点', fmtPct((s.price / r3[1] - 1) * 100)],
    se && ['散户情绪', `<span class="up">${se.bull} 看多</span> / <span class="dn">${se.bear} 看空</span>`],
    ['类型', s.underlying ? `2 倍杠杆 ETF · ${esc(s.underlying)}` : '股票'],
  ]);
  const why = cls(s.day) === 'dn' ? '为什么跌' : cls(s.day) === 'up' ? '为什么涨' : '主要原因';
  const list = a => `<ul class="bl">${a.map(x => `<li>${md(x)}</li>`).join('')}</ul>`;
  const news = (s.events || []).map((e, n) => ({ ...e, n, tk: s.ticker })).reverse().concat((s.upcoming || []).map(e => ({ ...e, tk: s.ticker, fut: true })));
  news.sort((a, b) => b.date.localeCompare(a.date));
  const center = `<section class="quote fade-in">${quoteHead(rep, s.name, s.ticker, s.price, s.day, pc != null ? s.price - pc : null, s.underlying ? `每日 2 倍杠杆 ETF，底层 ${esc(s.underlying)}` : '')}</section>
    ${quoteChartHTML(s)}
    <section class="sec"><h2 class="sh">关键数据</h2>${stats}</section>
    ${s.reasons.length ? `<section class="sec"><div class="aicard"><div class="aic-h"><span class="aib">${svg('spark')}AI</span><h2>${why}</h2><span class="faint small">基于 ${rep.sources.length} 类公开来源</span></div>${list(s.reasons)}${s.notes.map(n => `<div class="warn">${svg('info')}<span>${md(n)}</span></div>`).join('')}</div></section>` : ''}
    ${s.intro.map(x => `<section class="sec"><h2 class="sh">${esc(x.title)}</h2><p class="para">${md(x.text)}</p></section>`).join('')}
    ${news.length ? `<section class="sec"><div class="shr"><h2 class="sh">最新动态</h2><span class="faint small">编号对应图上标注</span></div>${newsList(rep, news.map(e => ({ ...e, href: e.n != null ? '#qchart' : '#' })), { limit: 8, showTk: false })}</section>` : ''}
    ${s.analysts.length ? `<section class="sec"><div class="shr"><h2 class="sh">机构观点</h2><span class="faint small">${s.analysts.length} 条</span></div><div class="alist">${s.analysts.map(a => `<div class="an">${svg('bank')}<p>${md(a)}</p></div>`).join('')}</div></section>` : ''}
    ${s.sentimentText ? `<section class="sec"><h2 class="sh">散户情绪</h2>${se ? `<div class="sent" role="img" aria-label="看多 ${se.bull}，未标注 ${neu}，看空 ${se.bear}"><i class="b" style="width:${se.bull / se.total * 100}%"></i><i class="n" style="width:${neu / se.total * 100}%"></i><i class="s" style="width:${se.bear / se.total * 100}%"></i></div><div class="sent-lg"><span><i class="dot up-bg"></i>看多 <b>${se.bull}</b></span><span><i class="dot"></i>未标注 ${neu}</span><span><i class="dot dn-bg"></i>看空 <b>${se.bear}</b></span><span class="faint">StockTwits 最近 ${se.total} 条</span></div>` : ''}<p class="para">${md(s.sentimentText)}</p></section>` : ''}`;
  const after = `<nav class="pager"><a href="#/s/${prev.ticker}">${svg('back')}<span><small>上一只</small><b>${prev.ticker}</b></span></a><a class="nx" href="#/s/${next.ticker}"><span><small>下一只</small><b>${next.ticker}</b></span>${svg('back')}</a></nav>`;
  app.innerHTML = page(ctx, { back: '#/', cur: s.ticker, navTitle: `${esc(s.ticker)} <span class="num ${cls(s.day)}">${fmtPx(s.price)}</span>`, center, right: debateHTML(s, rep) || researchHTML(rep, 'panel'), rightMobile: !!s.debate, after });
  const cleanChart = wireQuoteChart(s);
  $$('.news-row[data-n]').forEach(r => r.addEventListener('click', e => { e.preventDefault(); const box = $('#qchart'); if (box._at(+r.dataset.n)) { const b = box.getBoundingClientRect(); if (b.top < 60 || b.bottom > innerHeight) box.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }));
  $$('.news-row:not([data-n])').forEach(r => r.addEventListener('click', e => e.preventDefault()));
  wireMore(); wireResearch(); wirePrompt(rep);
  const d = $('#debate'); const cleanDeb = d ? playDebate(d) : null;
  if (d) { $('#shareCons').addEventListener('click', () => shareConsensus(s, rep)); $('#saveCons').addEventListener('click', () => consensusPNG(s, rep)); }
  state.cleanup = () => { cleanChart && cleanChart(); cleanDeb && cleanDeb(); };
  if (anchor === 'debate' && d) requestAnimationFrame(() => { const pnl = d.closest('.col-r'); if (!pnl || getComputedStyle(pnl).position !== 'sticky') d.scrollIntoView({ block: 'start' }); state.keepScroll = true; });
}

function pageQuote(ctx, tk) {
  const { rep } = ctx, w = rep.watch.all.find(x => x.ticker === tk);
  if (!w) { app.innerHTML = page(ctx, { back: '#/', center: `<div class="empty">${svg('search')}<p>该日报中没有 <b>${esc(tk)}</b></p><a class="tonal" href="#/w">查看自选速览</a></div>`, right: researchHTML(rep, 'panel') }); wirePrompt(rep); wireResearch(); return; }
  const mv = rep.watch.movers.find(x => x.ticker === tk);
  const secs = rep.watch.sectors.filter(sc => sc.items.some(it => it.ticker === tk));
  const center = `<section class="quote fade-in">${quoteHead(rep, w.name, tk, w.price, w.day, w.price != null && w.day != null ? w.price - w.price / (1 + w.day / 100) : null, '自选股')}</section>
    <div class="note-card">${svg('info')}<div><b>该股今日不在重点关注</b><p>自选股只提供收盘价、涨跌幅与归因摘要；走势图、新闻标注与 AI 流派辩论仅覆盖重点关注股。</p></div></div>
    <section class="sec"><h2 class="sh">关键数据</h2>${statsHTML([['收盘价', fmtPx(w.price) + ' USD'], ['当日涨跌', `<span class="${cls(w.day)}">${fmtPct(w.day)}</span>`], ['本周涨跌', `<span class="${cls(w.week)}">${fmtPct(w.week)}</span>`], secs.length && ['所属板块', secs.map(x => esc(x.name)).join('、')]])}</section>
    ${w.reason || mv ? `<section class="sec"><div class="aicard"><div class="aic-h"><span class="aib">${svg('spark')}AI</span><h2>${cls(w.day) === 'dn' ? '为什么跌' : '为什么涨'}</h2></div><p class="para">${md(w.reason || mv.reason)}</p></div></section>` : ''}
    ${secs.map(sc => `<section class="sec"><h2 class="sh">${esc(sc.name)} · 同板块</h2><div class="heat">${sc.items.map(it => heatTile(it, it.ticker === tk)).join('')}</div>${sc.note ? `<p class="para faint">${md(sc.note)}</p>` : ''}</section>`).join('')}`;
  app.innerHTML = page(ctx, { back: '#/w', cur: tk, navTitle: `${esc(tk)} <span class="num ${cls(w.day)}">${fmtPx(w.price)}</span>`, center, right: researchHTML(rep, 'panel') });
  wirePrompt(rep); wireResearch();
}

const heatBg = v => { const a = Math.min(1, Math.abs(v || 0) / 5);
  if (!v) return DARK.matches ? ['#2f2b28', '#cfc7be'] : ['#efebe5', '#5b534c'];
  const mix = (c1, c2, t) => '#' + [0, 2, 4].map(i => Math.round(parseInt(c1.substr(i + 1, 2), 16) * (1 - t) + parseInt(c2.substr(i + 1, 2), 16) * t).toString(16).padStart(2, '0')).join('');
  if (DARK.matches) return v > 0 ? [mix('#2e2523', '#a8625b', .15 + a * .75), a > .5 ? '#f6e9e6' : '#e0aaa2'] : [mix('#232824', '#5f7e67', .15 + a * .75), a > .5 ? '#e8f0ea' : '#a9c4b0'];
  return v > 0 ? [mix('#f5ebe8', '#b86a61', a * .85), a > .55 ? '#fbf6f4' : '#9a4f48'] : [mix('#ebf0ea', '#6f8f77', a * .85), a > .55 ? '#f6f9f6' : '#4f6d57']; };
const heatTile = (it, on) => { const [b, f] = heatBg(it.day); return `<a class="h${on ? ' on' : ''}" href="#/s/${esc(it.ticker)}" style="background:${b};color:${f}"><b>${esc(it.ticker)}</b><span class="num">${fmtPct(it.day)}</span></a>`; };

async function pageWatch() {
  const idx = await loadIndex(), rep = await loadReport(), ctx = { idx, rep }, w = rep.watch;
  const bodies = {
    m: `<p class="faint small lead">当日涨跌幅 ≥ 3%（不含重点关注）</p><div class="wlist">${w.movers.map(x => wlRow(x, true)).join('')}</div>
      ${w.weekly.length ? `<h2 class="sh sec-t">本周异动</h2><div class="accs">${w.weekly.map(x => `<div class="wk">${md(x)}</div>`).join('')}</div>` : ''}`,
    h: `<p class="faint small lead">颜色越深波动越大 · 红涨绿跌 · 点击查看</p><div class="sector-wrap">${w.sectors.map(s => `<div class="sector"><h3>${esc(s.name)}</h3><div class="heat">${s.items.map(it => heatTile(it)).join('')}</div>${s.note ? `<p class="snote">${md(s.note)}</p>` : ''}</div>`).join('')}</div>${w.anomalies ? `<div class="warn">${svg('info')}<span>${md(w.anomalies)}</span></div>` : ''}`,
    a: `<div class="filter">${svg('search')}<input id="wf" type="search" placeholder="筛选代码或名称" aria-label="筛选自选股"></div><p class="faint small lead">按当日涨跌幅绝对值排序 · 大涨大跌在前</p><div class="wlist" id="wall">${w.all.map(x => wlRow(x, false)).join('')}</div><div class="empty" id="wnone" hidden>没有匹配的股票</div>`,
  };
  const center = `<div class="ph sd-only"><h1>自选速览</h1><p class="faint">美东 ${cnD(rep.date)} ${dparts(rep.date).wd} 收盘 · ${w.all.length} 只</p></div>
    <div class="seg" role="tablist"><button class="chip on" data-t="m" role="tab">今日异动</button><button class="chip" data-t="h" role="tab">板块热力</button><button class="chip" data-t="a" role="tab">全部 ${w.all.length}</button></div>
    <div id="wbody" class="fade-in">${bodies.m}</div>`;
  app.innerHTML = page(ctx, { tab: '#/w', center, right: researchHTML(rep, 'panel'), title: '自选速览', sub: `美东 ${cnD(rep.date)} ${dparts(rep.date).wd} 收盘 · ${w.all.length} 只` });
  const show = t => { $$('.seg .chip').forEach(x => x.classList.toggle('on', x.dataset.t === t)); $('#wbody').innerHTML = bodies[t];
    if (t === 'a') { const f = $('#wf'); f.addEventListener('input', () => { const q = f.value.trim().toLowerCase(); let n = 0; $$('#wall .wrow').forEach(r => { const ok = !q || r.dataset.q.includes(q); r.hidden = !ok; n += ok; }); $('#wnone').hidden = n > 0; }); } };
  $$('.seg .chip').forEach(b => b.addEventListener('click', () => show(b.dataset.t)));
  wireResearch(); wirePrompt(rep);
}

async function pageAbout() {
  const idx = await loadIndex().catch(() => null);
  const rep = idx ? await loadReport().catch(() => null) : null, ctx = { idx, rep };
  const n = idx ? idx.reports.length : 0;
  const step = (ic, h, p, chips = []) => `<div class="step"><div class="sic">${svg(ic)}</div><div><h3>${h}</h3><p>${p}</p>${chips.length ? `<div class="chips">${chips.map(c => `<span class="chip sm">${c}</span>`).join('')}</div>` : ''}</div></div>`;
  const center = `<section class="ab-hero fade-in"><span class="kchip">${svg('spark')}AI Agent · 个人项目</span>
    <h1>每天早上，用中文读懂<br><span>美股为什么涨跌</span></h1>
    <p>一个为自己搭建、每日自动运行的 AI 投研助手：把美国媒体、公司公告、分析师评级和散户论坛的信息汇总成一份中文日报，并让 AI 以四种投资流派的视角互相辩论。</p>
    <div class="kpis"><div><b>7</b><span>重点关注</span></div><div><b>100+</b><span>自选股覆盖</span></div><div><b>4</b><span>AI 流派辩论</span></div></div>
  </section>
  <section class="sec"><h2 class="sh">问题</h2><div class="ocard"><p>作为身在中国大陆的美股投资者，中文财经资讯往往比美国本地报道<strong>晚几个小时甚至一天</strong>，而且通常只有“涨了/跌了”，缺少原因、机构观点和不同角度的分析。原始信息分散在英文新闻、SEC 公告、评级调整和论坛里，每天手动翻一遍需要很长时间。</p></div></section>
  <section class="sec"><h2 class="sh">方案</h2><div class="ocard"><p>由 AI Agent 在每个交易日收盘后自动完成：<strong>抓取与核对行情 → 检索新闻与公告 → 归因每只股票的涨跌 → 模拟多流派辩论 → 生成中文结论</strong>。辩论环节刻意引入对立观点，避免只看到单一叙事。</p>
    <div class="schools">${['价值派', '成长派', '技术派', '宏观派'].map(nm => `<div style="${scVars(nm)}">${avatar(nm)}<div><b>${nm}</b><span>${SCHOOLS[nm].desc}</span></div></div>`).join('')}</div></div></section>
  <section class="sec"><h2 class="sh">工作流程</h2><div class="pipe">
    ${step('search', '1 · 多源采集', '收盘后拉取日线行情，并检索美国主流财经媒体、公司公告与 SEC 文件、分析师评级变动和散户论坛讨论。', ['Yahoo Finance 行情', 'Reuters / CNBC 等', 'SEC 8-K / S-1', '评级与目标价', 'StockTwits'])}
    ${step('shield', '2 · 核验去噪', '行情与券商数据逐一对账；交叉比对多个来源，剔除与实际走势矛盾的“旧闻误植”（例如某网站称 LUNR 当日暴跌 22%，实际仅 -0.57%，已排除）。')}
    ${step('why', '3 · 涨跌归因', '区分板块性与公司特有因素，把新闻事件与价格走势对齐，并在图表上标注关键日期。')}
    ${step('users', '4 · 多流派 AI 辩论', '价值、成长、技术、宏观四个视角各自陈述，再进行一轮交锋反驳，最后收敛为共识结论与待验证的关键变量。')}
    ${step('doc', '5 · 中文日报 → 自动发布', '输出结构化 Markdown，转换为 JSON 后投放到这个静态网站；每个交易日自动更新，无需服务器。', ['Python 转换脚本', '静态 PWA', 'GitHub Pages'])}
  </div></section>
  <section class="sec"><h2 class="sh">设计取舍</h2><div class="ocard"><ul class="bl">
    <li><strong>移动优先 + PWA</strong>：可“添加到主屏幕”，离线可读上一次的日报。</li>
    <li><strong>大陆网络友好</strong>：不依赖 Google Fonts 或任何外部 CDN，所有资源本地打包；正文用系统字体，只有 Logo 字标用自托管的开源字体子集（SIL OFL 1.1，每个仅 1–4 KB）。</li>
    <li><strong>数据可追溯</strong>：价格来自真实日线数据，文中观点附信息来源链接；不编造数据。</li>
    <li><strong>隐私</strong>：公开页面只展示代码、价格、涨跌与分析，不展示任何个人仓位、成本或盈亏。</li>
    <li><strong>红涨绿跌</strong>：沿用中国投资者习惯的颜色约定。</li>
    <li><strong>界面</strong>：借鉴主流财经门户的简洁卡片式布局（Material 风格），图标与图表均为手绘 SVG。</li>
  </ul></div></section>
  <section class="sec"><h2 class="sh">作者</h2><div class="ocard author"><div class="ph-av">R</div><div><b>Rein</b><div class="faint">独立开发 · 设计、数据管线与 AI 工作流均由本人完成</div></div></div></section>
  <p class="faint small center">已收录 ${n} 期日报 · 每个美股交易日自动更新</p>`;
  app.innerHTML = page(ctx, { tab: '#/about', center, right: rep ? researchHTML(rep, 'panel') : '', title: '关于项目', sub: 'About · ' + APP });
  if (rep) { wireResearch(); wirePrompt(rep); }
}

async function pageSources() {
  const idx = await loadIndex(), rep = await loadReport(), ctx = { idx, rep };
  const dom = u => u.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
  const center = `<div class="ph sd-only"><h1>信息来源</h1><p class="faint">美东 ${cnD(rep.date)} 日报 · ${rep.sources.length} 类来源</p></div>
    <div class="note-card">${svg('info')}<div><p>${md(rep.note)}</p></div></div>
    <div class="srcs">${rep.sources.map(s => `<div class="src">${favi(s.urls[0] ? dom(s.urls[0]) : (s.label || '源'))}<div class="sb"><b>${esc(s.label || '市场综述')}</b>${s.text ? `<p>${md(s.text)}</p>` : ''}${s.urls.map(u => `<a href="${esc(u)}" target="_blank" rel="noopener">${svg('link')}<span>${esc(dom(u))}</span><em>${esc(u.replace(/^https?:\/\/[^/]+/, ''))}</em></a>`).join('')}</div></div>`).join('')}</div>`;
  app.innerHTML = page(ctx, { tab: '#/sources', center, right: researchHTML(rep, 'panel'), title: '信息来源', sub: `美东 ${cnD(rep.date)} 日报 · ${rep.sources.length} 类来源` });
  wireResearch(); wirePrompt(rep);
}

/* ---------- share card ---------- */
function toast(msg) { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast glass'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2200); }
const shareURL = s => location.href.split('#')[0].split('?')[0] + '#/s/' + s.ticker + '/debate';
async function shareConsensus(s, rep) {
  const text = `【${s.ticker} 四大流派共识｜美东 ${rep.date}】${plain(s.debate.consensus)}（${APP} · AI 模拟，非投资建议）`;
  if (navigator.share) { try { await navigator.share({ title: `${s.ticker} 四大流派共识`, text, url: shareURL(s) }); } catch (e) { /* cancelled */ } return; }
  try { await navigator.clipboard.writeText(text + ' ' + shareURL(s)); toast('已复制分享文案与链接'); } catch (e) { toast('无法访问剪贴板，请手动复制'); }
}
function consensusPNG(s, rep) {
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const FONT = '-apple-system,"SF Pro Display","PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#8a9aa6'); bg.addColorStop(.55, '#a89aa6'); bg.addColorStop(1, '#c4a99c');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  g.fillStyle = 'rgba(251,249,246,.97)'; rr(72, 150, W - 144, H - 300, 56); g.fill();
  g.fillStyle = '#fff'; g.font = `600 40px ${FONT}`; g.fillText(APP, 80, 100);
  g.font = `400 32px ${FONT}`; g.textAlign = 'right'; g.fillText('美东 ' + rep.date, W - 80, 100); g.textAlign = 'left';
  g.fillStyle = '#2f2b27'; g.font = `500 84px ${FONT}`; g.fillText(s.ticker, 136, 290);
  g.fillStyle = '#8a8078'; g.font = `400 38px ${FONT}`; g.fillText('四大流派共识结论', 136, 356);
  const cols = ['#b08a4f', '#957aa0', '#6a939a', '#7a7fa6'], names = ['价值', '成长', '技术', '宏观'];
  cols.forEach((col, i) => { g.fillStyle = col; g.beginPath(); g.arc(160 + i * 150, 430, 18, 0, 7); g.fill(); g.fillStyle = '#4d4640'; g.font = `400 30px ${FONT}`; g.fillText(names[i], 186 + i * 150, 441); });
  g.fillStyle = '#2f2b27'; g.font = `400 42px ${FONT}`;
  let line = '', y = 540; const maxW = W - 272;
  for (const ch of plain(s.debate.consensus)) { if (g.measureText(line + ch).width > maxW) { g.fillText(line, 136, y); line = ''; y += 72; if (y > H - 260) break; } line += ch; }
  if (line && y <= H - 260) g.fillText(line, 136, y);
  g.fillStyle = '#9a9088'; g.font = `400 30px ${FONT}`; g.fillText('AI 基于公开信息模拟 · 不构成投资建议', 136, H - 200);
  g.fillStyle = 'rgba(255,255,255,.9)'; g.font = `400 30px ${FONT}`; g.textAlign = 'center'; g.fillText(location.host + location.pathname, W / 2, H - 70);
  c.toBlob(async blob => {
    const file = new File([blob], `${s.ticker}-consensus-${rep.date}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: `${s.ticker} 四大流派共识` }); } catch (e) { /* cancelled */ } return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('图片已保存');
  }, 'image/png');
}

/* ---------- iOS-style large title + swipe back ---------- */
function onScroll() {
  const y = scrollY, ab = $('.appbar'); document.body.classList.toggle('scrolled', y > 4);
  if (!ab) return;
  const abB = ab.getBoundingClientRect().bottom, lt = $('.ltitle');
  if (lt && lt.offsetParent) {
    const r = lt.getBoundingClientRect(), p = Math.min(1, Math.max(0, (abB - r.top) / r.height));
    lt.style.transform = y < 0 ? `scale(${1 + Math.min(.08, -y / 500)})` : `scale(${1 - p * .14})`; lt.style.opacity = 1 - p * .85;
    document.body.classList.toggle('lt-off', r.bottom < abB + 4);
  } else {
    const q = $('.quote .qpx'); document.body.classList.toggle('lt-off', !!q && q.getBoundingClientRect().bottom < abB);
  }
}
let sw = null;
addEventListener('touchstart', e => { const b = $('.appbar .back'); if (!b || e.touches.length > 1) return; const t = e.touches[0]; if (t.clientX > 28) return; sw = { x: t.clientX, y: t.clientY, dx: 0, lock: null, href: b.getAttribute('href'), el: $('.layout') }; }, { passive: true });
addEventListener('touchmove', e => {
  if (!sw) return; const t = e.touches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y;
  if (sw.lock == null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) sw.lock = Math.abs(dx) > Math.abs(dy) * 1.2;
  if (sw.lock === false) { sw = null; return; }
  if (sw.lock) { sw.dx = Math.max(0, dx); sw.el.style.transition = 'none'; sw.el.style.transform = `translateX(${sw.dx}px)`; document.body.classList.add('swiping'); }
}, { passive: true });
addEventListener('touchend', () => {
  if (!sw) return; const { el, dx, href } = sw; sw = null; document.body.classList.remove('swiping');
  el.style.transition = 'transform .38s cubic-bezier(.32,.72,0,1)';
  if (dx > Math.min(110, innerWidth * .28)) { el.style.transform = `translateX(${innerWidth}px)`; setTimeout(() => { location.hash = href; }, 180); }
  else el.style.transform = '';
});

/* ---------- router ---------- */
async function route() {
  if (state.cleanup) { state.cleanup(); state.cleanup = null; }
  state.keepScroll = false;
  const h = location.hash.replace(/^#/, '') || '/';
  const parts = h.split('/').filter(Boolean);
  if (parts[0] === 'qchart') return; // in-page anchor
  try {
    if (parts[0] === 's' && parts[1]) await pageStock(decodeURIComponent(parts[1]).toUpperCase(), parts[2]);
    else if (parts[0] === 'w') await pageWatch();
    else if (parts[0] === 'about') await pageAbout();
    else if (parts[0] === 'sources') await pageSources();
    else await pageHome();
    const ds = $('#dateSel'); if (ds) ds.addEventListener('change', e => { state.date = e.target.value; route(); });
    wireSearch(state.reports[state.date]);
    document.body.classList.toggle('has-lt', !!$('.ltitle')); document.body.classList.toggle('detail', !!$('.appbar .back'));
    if (NOANIM) $$('.pg-enter').forEach(x => x.classList.remove('pg-enter'));
    if (state.focusSearch) { state.focusSearch = false; const m = $('.search.sm-only .q'); if (m && m.offsetParent) setTimeout(() => m.focus(), 50); }
  } catch (e) {
    console.error(e);
    app.innerHTML = appbar({}, '#/') + `<div class="empty">数据加载失败，请检查网络后重试<br><small>${esc(e.message)}</small></div>`;
  }
  if (!state.keepScroll) window.scrollTo(0, 0);
  onScroll();
}
addEventListener('hashchange', route);
let rafS = 0; addEventListener('scroll', () => { if (!rafS) rafS = requestAnimationFrame(() => { rafS = 0; onScroll(); }); }, { passive: true });
if (DARK.addEventListener) DARK.addEventListener('change', () => route());
app.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
route();
if ('serviceWorker' in navigator && location.protocol !== 'file:') addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
})();
