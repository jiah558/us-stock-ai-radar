/* 美股 AI 雷达 — zero-dependency SPA. Data: data/index.json + data/reports/<date>.json */
(() => {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $('#app');
const NOANIM = /noanim/.test(location.search) || matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- icons ---------- */
const I = {
  value: '<path d="M12 3v17M6 20h12M5 7h14M12 5.5V7"/><path d="M5 7l-3 6.5a3.2 3.2 0 006 0L5 7zM19 7l-3 6.5a3.2 3.2 0 006 0L19 7z"/>',
  growth: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.1 2.1 0 00-2.9-.1z"/><path d="M12 15l-3-3a22 22 0 012-3.9A12.9 12.9 0 0122 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 01-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
  tech: '<path d="M7 3v4M7 17v4M17 2v4M17 15v5"/><rect x="4.5" y="7" width="5" height="10" rx="1"/><rect x="14.5" y="6" width="5" height="9" rx="1"/>',
  macro: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>',
  host: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  home: '<circle cx="12" cy="12" r="9"/><path d="M12 12l6-4"/><circle cx="12" cy="12" r="4.5" opacity=".6"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  list: '<path d="M4 6h16M4 12h10M4 18h7"/><path d="M17 14l3 3-3 3M20 17h-6" opacity=".7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  replay: '<path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.8L3 8"/><path d="M3 3v5h5"/>',
  why: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
  bank: '<path d="M3 21h18M5 21V10M19 21V10M9 21V10M15 21V10M2 10l10-6 10 6"/>',
  crowd: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><path d="M16 4.5a3.5 3.5 0 010 7M21.5 20a6.5 6.5 0 00-4-6"/>',
  cal: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  layers: '<path d="M12 2l10 5-10 5L2 7l10-5z"/><path d="M2 12l10 5 10-5M2 17l10 5 10-5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
  users: '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2.5 20a5.5 5.5 0 0111 0M10.5 20a5.5 5.5 0 0111 0"/>',
  doc: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  rocket: '<path d="M5 19l3-3M13 4l7 0 0 7-9 9-7-7z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};
const svg = (k, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]}</svg>`;

const SCHOOLS = {
  '价值派': { k: 'value', c: '#f5b942', l: '#ffe7ad', d: '#8a5f10', a: 'rgba(245,185,66,.32)', b: 'rgba(245,185,66,.09)', desc: '估值、安全边际、现金流' },
  '成长派': { k: 'growth', c: '#9b8cff', l: '#e2dcff', d: '#4a3bb3', a: 'rgba(155,140,255,.34)', b: 'rgba(155,140,255,.10)', desc: '收入增速、赛道、兑现' },
  '技术派': { k: 'tech', c: '#38bdf8', l: '#c9efff', d: '#0b6a93', a: 'rgba(56,189,248,.32)', b: 'rgba(56,189,248,.09)', desc: '趋势、均线、量价与波动' },
  '宏观派': { k: 'macro', c: '#f472b6', l: '#ffd6ea', d: '#9b2462', a: 'rgba(244,114,182,.32)', b: 'rgba(244,114,182,.09)', desc: '利率、流动性、政策周期' },
  '主持人': { k: 'host', c: '#94a3b8', l: '#e2e8f0', d: '#475569', a: 'rgba(148,163,184,.3)', b: 'rgba(148,163,184,.08)', desc: '' },
};
const scVars = n => { const s = SCHOOLS[n] || SCHOOLS['主持人']; return `--sc:${s.c};--scl:${s.l};--scd:${s.d};--sc2:${s.a};--sc3:${s.b}`; };
const avatar = (n, sm) => `<span class="av${sm ? ' sm' : ''}" style="${scVars(n)}">${svg((SCHOOLS[n] || SCHOOLS['主持人']).k)}</span>`;

/* ---------- formatting ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cls = v => v == null ? 'flat' : v > 0 ? 'up' : v < 0 ? 'dn' : 'flat';
const fmtPct = v => v == null ? '—' : (v > 0 ? '+' : '') + v.toFixed(2) + '%';
const fmtPx = v => v == null ? '—' : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const chg = (v, extra = '') => `<span class="chg num ${cls(v)} ${extra}">${fmtPct(v)}</span>`;
/** tiny inline markdown: **bold**, bare URLs, signed percentages colored (red up / green down) */
function md(s) {
  let h = esc(s);
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/(https?:\/\/[^\s<；，）]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  h = h.replace(/(^|[\s（(：:，、>])([+\-−]\d+(?:\.\d+)?%)/g, (m, p, v) => `${p}<span class="${v[0] === '+' ? 'up' : 'dn'}">${v}</span>`);
  return h;
}
const md2 = s => md(s).replace(/<\/?strong>/g, '');
const WD = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const dparts = iso => { const [y, m, d] = iso.split('-').map(Number); return { y, m, d, wd: WD[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] }; };
const shortD = iso => { const p = dparts(iso); return `${p.m}/${p.d}`; };
const bjDate = iso => { const t = new Date(iso + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + 1); return t.toISOString().slice(0, 10); };

/* ---------- data ---------- */
const state = { index: null, reports: {}, date: null };
async function getJSON(u) { const r = await fetch(u, { cache: 'no-cache' }); if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); }
async function loadIndex() { if (!state.index) state.index = await getJSON('data/index.json'); return state.index; }
async function loadReport(date) {
  const idx = await loadIndex();
  date = date || state.date || idx.latest;
  state.date = date;
  if (!state.reports[date]) state.reports[date] = await getJSON(`data/reports/${date}.json`);
  return state.reports[date];
}

/* ---------- charts ---------- */
function spark(series, w = 92, h = 34) {
  if (!series || series.length < 2) return '';
  const v = series.map(p => p[1]), mn = Math.min(...v), mx = Math.max(...v), rg = mx - mn || 1;
  const pts = v.map((y, i) => [(i / (v.length - 1)) * w, h - 3 - ((y - mn) / rg) * (h - 6)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
  const col = v[v.length - 1] >= v[0] ? 'var(--up)' : 'var(--dn)';
  const id = 'g' + Math.random().toString(36).slice(2, 8);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".28"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs><path d="${d}L${w} ${h}L0 ${h}Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${col}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="2.2" fill="${col}"/></svg>`;
}

function bigChart(s) {
  const S = s.chart || [];
  if (S.length < 2) return '<div class="card chart"><div class="empty">暂无行情数据</div></div>';
  const W = 358, H = 200, pl = 6, pr = 46, pt = 22, pb = 24;
  const v = S.map(p => p[1]); let mn = Math.min(...v), mx = Math.max(...v); const pad = (mx - mn) * .1 || 1; mn -= pad; mx += pad;
  const X = i => pl + (i / (S.length - 1)) * (W - pl - pr), Y = y => pt + (1 - (y - mn) / (mx - mn)) * (H - pt - pb);
  const up = v.at(-1) >= v[0], col = up ? 'var(--up)' : 'var(--dn)';
  const d = S.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('');
  let g = '';
  for (let k = 0; k <= 3; k++) { const y = mn + (mx - mn) * (k / 3), yy = Y(y); g += `<line x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}" stroke="rgba(255,255,255,.06)" stroke-dasharray="3 4"/><text x="${W - pr + 6}" y="${yy + 4}" fill="#6f7a90" font-size="10.5" class="num">${fmtPx(y)}</text>`; }
  const xl = [0, Math.floor((S.length - 1) / 2), S.length - 1].map(i => `<text x="${X(i)}" y="${H - 6}" fill="#6f7a90" font-size="10.5" text-anchor="${i === 0 ? 'start' : i === S.length - 1 ? 'end' : 'middle'}">${shortD(S[i][0])}</text>`).join('');
  // event markers: snap to same or next trading day
  const mk = (s.events || []).map((e, n) => { let i = S.findIndex(p => p[0] >= e.date); if (i < 0) return ''; const x = X(i), y = Y(S[i][1]);
    return `<g class="mk" data-n="${n}"><line x1="${x}" x2="${x}" y1="${y}" y2="${H - pb}" stroke="rgba(91,140,255,.35)" stroke-dasharray="2 3"/><circle cx="${x}" cy="${y}" r="4.5" fill="#0b0f1a" stroke="#5b8cff" stroke-width="2"/><g transform="translate(${x},${Math.max(10, y - 13)})"><circle r="8" fill="#5b8cff"/><text y="3.6" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">${n + 1}</text></g></g>`; }).join('');
  const len = 1200;
  return `<div class="card chart" data-t="${esc(s.ticker)}">
    <div class="hd"><span>近一月走势 · 日线收盘</span><span class="num ${up ? 'up' : 'dn'}">${fmtPct((v.at(-1) / v[0] - 1) * 100)}</span></div>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(s.ticker)} 近一月价格走势">
      <defs><linearGradient id="bg-${esc(s.ticker)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".30"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
      ${g}${xl}
      <path d="${d}L${X(S.length - 1)} ${H - pb}L${X(0)} ${H - pb}Z" fill="url(#bg-${esc(s.ticker)})" class="area"/>
      <path d="${d}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" class="ln" style="stroke-dasharray:${len};stroke-dashoffset:${NOANIM ? 0 : len}"/>
      ${mk}
      <line class="cx" x1="0" x2="0" y1="${pt - 8}" y2="${H - pb}" stroke="rgba(255,255,255,.35)" opacity="0"/>
      <circle class="cd" r="4" fill="${col}" stroke="#fff" stroke-width="1.5" opacity="0"/>
      <rect class="hit" x="${pl}" y="0" width="${W - pl - pr}" height="${H}" fill="transparent"/>
    </svg><div class="tip"></div>
    ${(s.events || []).length || (s.upcoming || []).length ? `<div class="evs">${(s.events || []).map((e, n) => `<div class="ev" data-n="${n}"><span class="n">${n + 1}</span><span class="d num">${shortD(e.date)}</span><span>${md2(e.label)}</span></div>`).join('')}${(s.upcoming || []).map(e => `<div class="ev"><span class="n fut">${svg('clock').replace('class=""', 'style="width:12px;height:12px"')}</span><span class="d num">${shortD(e.date)}</span><span>即将：${md2(e.label)}</span></div>`).join('')}</div>` : ''}
    ${s.eventsFrom ? `<div class="faint" style="padding:4px 12px 0">标注事件来自底层资产 ${esc(s.eventsFrom)}</div>` : ''}
  </div>`;
}
function wireChart(el, s) {
  const S = s.chart; if (!el || !S || S.length < 2) return;
  const svgEl = $('svg', el), tip = $('.tip', el), cx = $('.cx', el), cd = $('.cd', el), ln = $('.ln', el);
  if (!NOANIM) requestAnimationFrame(() => { ln.style.transition = 'stroke-dashoffset 1.3s cubic-bezier(.4,0,.2,1)'; ln.style.strokeDashoffset = 0; });
  const W = 358, pl = 6, pr = 46, H = 200, pt = 22, pb = 24;
  const v = S.map(p => p[1]); let mn = Math.min(...v), mx = Math.max(...v); const pad = (mx - mn) * .1 || 1; mn -= pad; mx += pad;
  const X = i => pl + (i / (S.length - 1)) * (W - pl - pr), Y = y => pt + (1 - (y - mn) / (mx - mn)) * (H - pt - pb);
  const show = e => {
    const r = svgEl.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * W;
    const i = Math.max(0, Math.min(S.length - 1, Math.round((sx - pl) / (W - pl - pr) * (S.length - 1))));
    const x = X(i), y = Y(S[i][1]);
    cx.setAttribute('x1', x); cx.setAttribute('x2', x); cx.setAttribute('opacity', 1); cd.setAttribute('cx', x); cd.setAttribute('cy', y); cd.setAttribute('opacity', 1);
    const prev = i ? S[i - 1][1] : null, dd = prev ? (S[i][1] / prev - 1) * 100 : null;
    tip.innerHTML = `<span class="faint">${S[i][0]}</span><br><b class="num">${fmtPx(S[i][1])}</b> <span class="num ${cls(dd)}">${dd == null ? '' : fmtPct(dd)}</span>`;
    const px = x / W * r.width + (r.left - el.getBoundingClientRect().left), py = y / H * r.height + (r.top - el.getBoundingClientRect().top);
    tip.style.left = Math.max(60, Math.min(el.clientWidth - 60, px)) + 'px'; tip.style.top = py - 8 + 'px'; tip.style.opacity = 1;
    const n = (s.events || []).findIndex(ev => { const k = S.findIndex(p => p[0] >= ev.date); return k === i; });
    $$('.ev', el).forEach(x => x.classList.toggle('on', +x.dataset.n === n));
  };
  const hide = () => { tip.style.opacity = 0; cx.setAttribute('opacity', 0); cd.setAttribute('opacity', 0); };
  const hit = $('.hit', el);
  hit.addEventListener('pointermove', show); hit.addEventListener('pointerdown', show); hit.addEventListener('pointerleave', hide);
  $$('.mk', el).forEach(m => m.addEventListener('click', () => { const n = +m.dataset.n; $$('.ev', el).forEach(x => x.classList.toggle('on', +x.dataset.n === n)); }));
  $$('.ev[data-n]', el).forEach(evEl => evEl.addEventListener('click', () => { const ev = s.events[+evEl.dataset.n]; const i = S.findIndex(p => p[0] >= ev.date); if (i < 0) return; const r = svgEl.getBoundingClientRect(); show({ clientX: r.left + X(i) / W * r.width }); }));
}

/* ---------- layout pieces ---------- */
function topbarHome(idx, rep) {
  const opts = idx.reports.map(r => `<option value="${r.date}" ${r.date === rep.date ? 'selected' : ''}>${shortD(r.date)} ${dparts(r.date).wd}</option>`).join('');
  return `<header class="topbar"><div class="brand"><img src="icons/icon-192.png" alt=""><div><b>美股 AI 雷达</b><small>US Stock AI Radar</small></div></div>
    <label class="pill">${svg('cal').replace('class=""', 'style="width:14px;height:14px"')}<select id="dateSel" aria-label="选择日期">${opts}</select></label></header>`;
}
const topbarBack = (title, sub, to = '#/') => `<header class="topbar"><a class="back" href="${to}" aria-label="返回">${svg('back')}</a><div class="tb-title"><b>${title}</b><small>${sub}</small></div></header>`;
function tabbar(active) {
  const t = [['#/', 'home', '今日'], ['#/w', 'list', '自选速览'], ['#/about', 'info', '关于项目']];
  return `<nav class="tabbar"><div class="in">${t.map(([h, k, n]) => `<a href="${h}" class="${active === h ? 'on' : ''}">${svg(k)}<span>${n}</span></a>`).join('')}</div></nav>`;
}
const disclaimer = rep => `<div class="disc"><b>免责声明</b>：本站内容由 AI 基于公开信息自动整理与生成，包括“流派辩论”在内的观点均为 AI 模拟，可能存在错误或遗漏；<b>不构成任何投资建议</b>。投资有风险，决策请独立判断。${rep ? `<br>行情来源：Yahoo Finance 日线收盘；数据截至美东 ${rep.date} 收盘。` : ''}</div><div class="foot">© ${new Date().getFullYear()} Rein · 美股 AI 雷达 · <a href="#/sources">信息来源</a></div>`;

/* ---------- pages ---------- */
async function pageHome() {
  const idx = await loadIndex(), rep = await loadReport();
  const p = dparts(rep.date), bj = dparts(bjDate(rep.date));
  const m = rep.market;
  const cards = rep.focus.map((s, i) => `<a class="sc fade-in" href="#/s/${esc(s.ticker)}" style="--c:var(--${cls(s.day) === 'up' ? 'up' : cls(s.day) === 'dn' ? 'dn' : 'flat'});animation-delay:${i * 45}ms">
      <div class="row1"><div><div class="tk">${esc(s.ticker)}${s.underlying ? `<span class="tag">2x ${esc(s.underlying)}</span>` : ''}</div><div class="nm">${esc(s.name)}</div></div>${spark(s.chart)}</div>
      <div class="row2"><span class="px num">${fmtPx(s.price)}</span>${chg(s.day)}<span class="wk">本周 <b class="num ${cls(s.week)}">${fmtPct(s.week)}</b></span></div>
      <div class="why">${md2(s.oneLiner)}</div></a>`).join('');
  const movers = rep.watch.all.slice(0, 5).map(w => `<a class="r" href="#/w" style="color:inherit"><div class="l"><b>${esc(w.ticker)}</b><span>${esc(w.name)}</span></div><div class="p num">${fmtPx(w.price)}</div>${chg(w.day)}</a>`).join('');
  app.innerHTML = topbarHome(idx, rep) + `
    <section class="hero fade-in">
      <div class="when"><span class="live"><i></i>AI 日报</span><span>美东 ${p.m}月${p.d}日 ${p.wd} 收盘</span><span>·</span><span>北京时间 ${bj.m}/${bj.d} ${bj.wd}</span></div>
      <div class="headline"><div class="lbl">今日一句话</div><p>${md(m.headline)}</p></div>
      <div class="idx">${m.indices.map(x => `<div class="it"><span>${esc(x.name)}</span><b class="num">${x.symbol === '^TNX' ? x.price.toFixed(2) + '%' : fmtPx(x.price)}</b><em class="num ${x.symbol === '^VIX' || x.symbol === '^TNX' ? 'flat' : cls(x.day)}">${fmtPct(x.day)}</em></div>`).join('')}</div>
      <details class="ov"><summary>大盘概况 ${svg('down')}</summary><p>${md(m.overview)}</p></details>
    </section>
    <div class="sec"><h2><span class="dot"></span>重点关注</h2><span class="more">${rep.focus.length} 只 · 点击看 AI 辩论</span></div>
    <div class="stocks">${cards}</div>
    ${rep.nextWeek.length ? `<div class="sec"><h2><span class="dot"></span>下周关注</h2></div><div class="card"><div class="tl">${rep.nextWeek.map(e => `<div class="e">${md(e)}</div>`).join('')}</div></div>` : ''}
    <div class="sec"><h2><span class="dot"></span>自选股异动</h2><a class="more" href="#/w">全部 ${rep.watch.all.length} 只 ›</a></div>
    <div class="card ml">${movers}</div>
    ${disclaimer(rep)}` + tabbar('#/');
  $('#dateSel').addEventListener('change', e => { state.date = e.target.value; route(); });
}

function stripReb(x) {
  let t = x.text.replace(new RegExp('^' + x.school), '').replace(/^[：:，,\s]+/, '');
  if (x.target) t = t.replace(new RegExp('^(回应|提醒|反驳|指出|认为|补充|反问)?' + x.target + '[：:，,]?'), '');
  return t;
}
function debateHTML(s) {
  const d = s.debate; if (!d) return '';
  const names = Object.keys(SCHOOLS).filter(n => n !== '主持人');
  const bubble = (x, round) => { const right = round === 2 && names.indexOf(x.school) % 2 === 1;
    return `<div class="msg ${right ? 'r' : ''} ${NOANIM ? '' : 'hide'}" data-who="${esc(x.school)}" style="${scVars(x.school)}">${avatar(x.school, true)}<div class="bub"><span class="nm">${esc(x.school)}${x.target ? `<em>↩ @${esc(x.target)}</em>` : ''}</span><span class="tx">${md(round === 2 ? stripReb(x) : x.text)}</span></div></div>`; };
  return `<section class="debate" id="debate">
    <div class="top"><div class="kicker">AI ROUNDTABLE</div><h3>四大流派圆桌辩论</h3><div class="sub">AI 基于公开信息模拟 · 非投资建议</div></div>
    <div class="panel">${names.map(n => `<div class="who" data-who="${n}" style="${scVars(n)}">${avatar(n)}<span>${n}</span></div>`).join('')}</div>
    <div class="round"><b>第一轮</b> 观点陈述</div>
    ${d.opening.map(x => bubble(x, 1)).join('')}
    ${d.rebuttal.length ? `<div class="round r2" ${NOANIM ? '' : 'style="display:none"'}><b>第二轮</b> 交锋反驳</div>${d.rebuttal.map(x => bubble(x, 2)).join('')}` : ''}
    <div class="consensus ${NOANIM ? '' : 'hide'}"><div class="h"><span class="avs">${names.map(n => avatar(n, true)).join('')}</span><span style="margin-left:10px">共识结论</span></div><p>${md(d.consensus)}</p></div>
    <div class="dctl"><span>观点碰撞 ≠ 买卖建议</span><button id="replay">${svg('replay')}重播辩论</button></div>
  </section>`;
}
function playDebate(root) {
  const msgs = $$('.msg', root), cons = $('.consensus', root), who = $$('.panel .who', root);
  let timer = [], cancelled = false;
  const clear = () => { cancelled = true; timer.forEach(clearTimeout); timer = []; };
  const run = () => {
    clear(); cancelled = false;
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
  $('#replay', root).addEventListener('click', () => { run(); root.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  return clear;
}

async function pageStock(tk) {
  const rep = await loadReport();
  const i = rep.focus.findIndex(s => s.ticker === tk), s = rep.focus[i];
  if (!s) { app.innerHTML = topbarBack('未找到', tk) + '<div class="empty">该日报告中没有这只股票</div>' + tabbar(''); return; }
  const prev = rep.focus[(i - 1 + rep.focus.length) % rep.focus.length], next = rep.focus[(i + 1) % rep.focus.length];
  const se = s.sentiment, neu = se ? se.total - se.bull - se.bear : 0;
  const blk = (icon, title, body) => `<div class="card blk fade-in"><h3>${svg(icon)}${title}</h3>${body}</div>`;
  const list = a => `<ul>${a.map(x => `<li>${md(x)}</li>`).join('')}</ul>`;
  app.innerHTML = topbarBack(esc(s.ticker), esc(s.name)) + `
    <section class="dh fade-in"><span class="px num ${cls(s.day)}">${fmtPx(s.price)}</span>
      <div class="chgs"><span>当日 <b class="num ${cls(s.day)}">${fmtPct(s.day)}</b></span><span>本周 <b class="num ${cls(s.week)}">${fmtPct(s.week)}</b></span></div></section>
    <div class="dnote">美东 ${rep.date} 收盘 · ${s.underlying ? `每日 2 倍杠杆 ETF，底层 ${esc(s.underlying)}` : '美元'}</div>
    ${bigChart(s)}
    <div class="stack">
      ${s.intro.map(x => blk('layers', esc(x.title), `<p>${md(x.text)}</p>`)).join('')}
      ${s.reasons.length ? blk('why', cls(s.day) === 'dn' ? '为什么跌' : cls(s.day) === 'up' ? '为什么涨' : '主要原因', list(s.reasons) + s.notes.map(n => `<div class="warn">${md(n)}</div>`).join('')) : ''}
      ${s.analysts.length ? blk('bank', '机构观点', list(s.analysts)) : ''}
      ${s.sentimentText ? blk('crowd', '散户情绪', (se ? `<div class="sent"><i style="width:${se.bull / se.total * 100}%;background:var(--up)"></i><i style="width:${neu / se.total * 100}%;background:rgba(255,255,255,.14)"></i><i style="width:${se.bear / se.total * 100}%;background:var(--dn)"></i></div><div class="sent-lg"><span>看多 <b class="up">${se.bull}</b></span><span>未标注 ${neu}</span><span>看空 <b class="dn">${se.bear}</b></span></div><div class="faint" style="margin:2px 0 8px">StockTwits 最近 ${se.total} 条帖子</div>` : '') + `<p>${md(s.sentimentText)}</p>`) : ''}
    </div>
    ${debateHTML(s)}
    <nav class="pager"><a href="#/s/${prev.ticker}">‹ 上一只<b>${prev.ticker}</b></a><a class="nx" href="#/s/${next.ticker}">下一只 ›<b>${next.ticker}</b></a></nav>
    ${disclaimer(rep)}` + tabbar('');
  wireChart($('.chart'), s);
  const d = $('#debate'); if (d) state.cleanup = playDebate(d);
}

async function pageWatch() {
  const rep = await loadReport(), w = rep.watch;
  const row = (x, showReason = true) => `<div class="r"><div class="l"><b>${esc(x.ticker)}</b><span>${esc(x.name)}</span></div><div class="p num">${fmtPx(x.price)}<div class="faint">周 <span class="${cls(x.week)}">${fmtPct(x.week)}</span></div></div>${chg(x.day)}${x.reason && showReason ? `<div class="reason">${md(x.reason)}</div>` : ''}</div>`;
  const heatColor = v => { const a = Math.min(1, Math.abs(v || 0) / 4) * .75 + .1; return v > 0 ? `rgba(255,77,94,${a})` : v < 0 ? `rgba(25,201,138,${a})` : 'rgba(255,255,255,.06)'; };
  const moversHTML = `<div class="card ml" style="margin-top:12px"><div class="faint" style="margin-bottom:2px">当日涨跌幅 ≥ 3%（不含重点关注）</div>${w.movers.map(x => row(x)).join('')}</div>
    ${w.weekly.length ? `<div class="sec"><h2><span class="dot"></span>本周异动</h2></div><div class="card blk"><ul>${w.weekly.map(x => `<li>${md(x)}</li>`).join('')}</ul></div>` : ''}
    <div class="sec"><h2><span class="dot"></span>板块热力</h2></div>
    <div class="card">${w.sectors.map(s => `<div class="sector"><div class="snm">${esc(s.name)}</div><div class="heat">${s.items.map(it => `<div class="h" style="background:${heatColor(it.day)}"><b>${esc(it.ticker)}</b><span class="num">${fmtPct(it.day)}</span></div>`).join('')}</div>${s.note ? `<div class="snote">${md(s.note)}</div>` : ''}</div>`).join('')}
    ${w.anomalies ? `<div class="warn">${md(w.anomalies)}</div>` : ''}</div>`;
  const allHTML = `<div class="card ml" style="margin-top:12px"><div class="faint">按当日涨跌幅绝对值排序 · 大涨大跌在前</div>${w.all.map(x => row(x, false)).join('')}</div>`;
  app.innerHTML = `<header class="topbar"><div class="tb-title"><b>自选股速览</b><small>美东 ${rep.date} 收盘 · ${w.all.length} 只</small></div></header>
    <div class="seg"><button class="on" data-t="m">今日异动</button><button data-t="a">全部（按波动）</button></div>
    <div id="wbody" class="fade-in">${moversHTML}</div>${disclaimer(rep)}` + tabbar('#/w');
  $$('.seg button').forEach(b => b.addEventListener('click', () => { $$('.seg button').forEach(x => x.classList.toggle('on', x === b)); $('#wbody').innerHTML = b.dataset.t === 'm' ? moversHTML : allHTML; }));
}

async function pageAbout() {
  const idx = await loadIndex().catch(() => null);
  const n = idx ? idx.reports.length : 0;
  const step = (ic, h, p, chips = []) => `<div class="step"><div class="ic">${svg(ic)}</div><div><h4>${h}</h4><p>${p}</p>${chips.length ? `<div class="chips">${chips.map(c => `<span>${c}</span>`).join('')}</div>` : ''}</div></div>`;
  app.innerHTML = `<header class="topbar"><div class="tb-title"><b>关于这个项目</b><small>About · 美股 AI 雷达</small></div></header>
  <section class="ab-hero fade-in"><div class="k">AI AGENT · SIDE PROJECT</div>
    <h1>每天早上，用中文读懂<br><span>美股为什么涨跌</span></h1>
    <p>一个为自己搭建、每日自动运行的 AI 投研助手：把美国媒体、公司公告、分析师评级和散户论坛的信息汇总成一份中文日报，并让 AI 以四种投资流派的视角互相辩论。</p>
    <div class="kpis"><div><b>7</b><span>重点关注</span></div><div><b>100+</b><span>自选股覆盖</span></div><div><b>4</b><span>AI 流派辩论</span></div></div>
  </section>
  <div class="sec"><h2><span class="dot"></span>问题</h2></div>
  <div class="card blk"><p>作为身在中国大陆的美股投资者，中文财经资讯往往比美国本地报道<strong>晚几个小时甚至一天</strong>，而且通常只有“涨了/跌了”，缺少原因、机构观点和不同角度的分析。原始信息分散在英文新闻、SEC 公告、评级调整和论坛里，每天手动翻一遍需要很长时间。</p></div>
  <div class="sec"><h2><span class="dot"></span>方案</h2></div>
  <div class="card blk"><p>由 AI Agent 在每个交易日收盘后自动完成：<strong>抓取与核对行情 → 检索新闻与公告 → 归因每只股票的涨跌 → 模拟多流派辩论 → 生成中文结论</strong>。辩论环节刻意引入对立观点，避免只看到单一叙事。</p>
    <div class="schools" style="margin-top:12px">${['价值派', '成长派', '技术派', '宏观派'].map(nm => `<div style="${scVars(nm)}">${avatar(nm, true)}<div><b>${nm}</b><span>${SCHOOLS[nm].desc}</span></div></div>`).join('')}</div></div>
  <div class="sec"><h2><span class="dot"></span>工作流程</h2></div>
  <div class="card pipe">
    ${step('search', '1 · 多源采集', '收盘后拉取日线行情，并检索美国主流财经媒体、公司公告与 SEC 文件、分析师评级变动和散户论坛讨论。', ['Yahoo Finance 行情', 'Reuters / CNBC 等', 'SEC 8-K / S-1', '评级与目标价', 'StockTwits'])}
    ${step('shield', '2 · 核验去噪', '行情与券商数据逐一对账；交叉比对多个来源，剔除与实际走势矛盾的“旧闻误植”（例如某网站称 LUNR 当日暴跌 22%，实际仅 -0.57%，已排除）。')}
    ${step('why', '3 · 涨跌归因', '区分板块性与公司特有因素，把新闻事件与价格走势对齐，并在图表上标注关键日期。')}
    ${step('users', '4 · 多流派 AI 辩论', '价值、成长、技术、宏观四个视角各自陈述，再进行一轮交锋反驳，最后收敛为共识结论与待验证的关键变量。')}
    ${step('doc', '5 · 中文日报 → 自动发布', '输出结构化 Markdown，转换为 JSON 后投放到这个静态网站；每个交易日自动更新，无需服务器。', ['Python 转换脚本', '静态 PWA', 'GitHub Pages'])}
  </div>
  <div class="sec"><h2><span class="dot"></span>设计取舍</h2></div>
  <div class="card blk"><ul>
    <li><strong>移动优先 + PWA</strong>：可“添加到主屏幕”，离线可读上一次的日报。</li>
    <li><strong>大陆网络友好</strong>：不依赖 Google Fonts 或任何外部 CDN，所有资源本地打包，使用系统字体。</li>
    <li><strong>数据可追溯</strong>：价格来自真实日线数据，文中观点附信息来源链接；不编造数据。</li>
    <li><strong>隐私</strong>：公开页面只展示代码、价格、涨跌与分析，不展示任何个人仓位、成本或盈亏。</li>
    <li><strong>红涨绿跌</strong>：沿用中国投资者习惯的颜色约定。</li>
  </ul></div>
  <div class="sec"><h2><span class="dot"></span>作者</h2></div>
  <div class="card author"><div class="ph">R</div><div><b>Rein</b><div class="faint">独立开发 · 设计、数据管线与 AI 工作流均由本人完成</div></div></div>
  <div class="faint" style="margin-top:14px;text-align:center">已收录 ${n} 期日报 · 每个美股交易日自动更新</div>
  ${disclaimer(null)}` + tabbar('#/about');
}

async function pageSources() {
  const rep = await loadReport();
  app.innerHTML = topbarBack('信息来源', `美东 ${rep.date} 日报`, '#/about') + `<div class="card blk src" style="margin-top:14px"><p class="faint" style="margin-bottom:10px">${md(rep.note)}</p>${rep.sources.map(s => `<div style="margin-bottom:12px"><b>${esc(s.label)}</b>${s.text ? `<div class="faint">${md(s.text)}</div>` : ''}${s.urls.map(u => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace(/^https?:\/\//, ''))}</a>`).join('')}</div>`).join('')}</div>${disclaimer(rep)}` + tabbar('');
}

/* ---------- router ---------- */
async function route() {
  if (state.cleanup) { state.cleanup(); state.cleanup = null; }
  const h = location.hash.replace(/^#/, '') || '/';
  const parts = h.split('/').filter(Boolean);
  try {
    if (parts[0] === 's' && parts[1]) await pageStock(decodeURIComponent(parts[1]).toUpperCase());
    else if (parts[0] === 'w') await pageWatch();
    else if (parts[0] === 'about') await pageAbout();
    else if (parts[0] === 'sources') await pageSources();
    else await pageHome();
  } catch (e) {
    console.error(e);
    app.innerHTML = `<div class="empty">数据加载失败，请检查网络后重试<br><small>${esc(e.message)}</small></div>` + tabbar('');
  }
  window.scrollTo(0, 0);
}
addEventListener('hashchange', route);
addEventListener('scroll', () => { const t = $('.topbar'); if (t) t.classList.toggle('scrolled', scrollY > 4); }, { passive: true });
app.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
route();
if ('serviceWorker' in navigator && location.protocol !== 'file:') addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
})();
