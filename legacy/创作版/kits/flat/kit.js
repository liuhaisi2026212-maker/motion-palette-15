// 十五画境·创作版 —— 扁平矢量零件库
// 手法：大色块背景、无描边几何图形、弹性回弹（超出 10%~15% 再回落）、错峰出现、一个小方块（「信使」）贯穿全片：每个镜头结束时它放大成下一个镜头的底色。
// 镜头类型：title 标题 / statement 金句 / icon 图标 / compare 对比 / list 清单 / steps 步骤 / number 大数字 / quote 引用 / outro 结尾关注
import { clamp, lerp, inv, E, spring, hashStr, rng, timeline, shotAt, Mix, noteHz } from '../../lib/core.js';
import { ICONS, iconOf } from './icons.js';

export const W = 1920, H = 1080;
const FONT = '"Fredoka", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif';
// 配色（每套：镜头底色轮换、深色、浅色、信使色、图标三色）
export const PALETTES = {
  mint: { bg: ['#0E7C66', '#F6F1E6', '#FFD166', '#1B2A41', '#7FD1F5'], ink: '#14213D', light: '#FFFBF2', accent: '#FF6B35', a: '#FF6B35', b: '#FFD166', c: '#2EC4B6' },
  night: { bg: ['#1E1B4B', '#F472B6', '#FDE68A', '#0F172A', '#34D399'], ink: '#0F172A', light: '#F8FAFC', accent: '#FB7185', a: '#FB7185', b: '#FDE047', c: '#34D399' },
  lemon: { bg: ['#FFE45E', '#4D96FF', '#FFF8EC', '#FF5E5B', '#222831'], ink: '#222831', light: '#FFFFFF', accent: '#FF5E5B', a: '#FF5E5B', b: '#FFE45E', c: '#4D96FF' },
  forest: { bg: ['#264653', '#E9C46A', '#F4F1DE', '#2A9D8F', '#E76F51'], ink: '#1D2D35', light: '#FFFDF7', accent: '#E76F51', a: '#E76F51', b: '#E9C46A', c: '#2A9D8F' },
};
const lum = h => { const n = parseInt(h.slice(1), 16); return ((n >> 16 & 255) * .299 + (n >> 8 & 255) * .587 + (n & 255) * .114) / 255; };
const POP = u => u <= 0 ? 0 : u >= 1 ? 1 : 1 + 2.4 * (u - 1) ** 3 + 1.4 * (u - 1) ** 2;   // 回弹缓动，约超出 12%

// ---------- 文字：支持【关键词】高亮，逐字弹出 ----------
function parseRich(s) { const out = []; let hi = false; for (const ch of String(s ?? '')) { if (ch === '【') { hi = true; continue; } if (ch === '】') { hi = false; continue; } out.push({ ch, hi }); } return out; }
function layout(ctx, s, size, maxW, weight = 900) {
  ctx.font = `${weight} ${size}px ${FONT}`; const chars = parseRich(s), lines = [[]]; let w = 0;
  for (const c of chars) { const cw = ctx.measureText(c.ch).width; if (w + cw > maxW && lines[lines.length - 1].length) { lines.push([]); w = 0; } if (!(c.ch === ' ' && w === 0)) { lines[lines.length - 1].push({ ...c, w: cw }); w += cw; } }
  let res = lines.map(l => ({ chars: l, w: l.reduce((a, c) => a + c.w, 0) }));
  if (res.length === 2) {   // 两行时把断点挪到中间附近，避免第二行只剩一两个字
    const all = res[0].chars.concat(res[1].chars), tot = all.reduce((a, c) => a + c.w, 0); let acc = 0, best = 1, bd = 1e9;
    all.forEach((c, i) => { acc += c.w; const d = Math.abs(acc - tot / 2); if (i < all.length - 1 && d < bd && acc <= maxW && tot - acc <= maxW && !/[，。！？、,.!?」』）)]/.test(all[i + 1].ch) && !(all[i].hi && all[i + 1].hi)) { bd = d; best = i + 1; } });
    res = [all.slice(0, best), all.slice(best)].map(l => ({ chars: l, w: l.reduce((a, c) => a + c.w, 0) }));
  }
  return res;
}
// 画一段可换行的大字。align: 'center'|'left'。返回占用的高度与每个高亮块的位置
function richText(ctx, s, x, y, o) {
  const { size = 120, maxW = 1500, align = 'center', color, hiColor, hiText, t0 = 0, u = 9, stagger = .03, lh = 1.18, weight = 900, maxLines = 3 } = o;
  let lines = layout(ctx, s, size, maxW, weight); if (lines.length > maxLines) { const sc = .86; return richText(ctx, s, x, y, { ...o, size: size * sc, maxLines: maxLines + 1 }); }
  ctx.font = `${weight} ${size}px ${FONT}`; ctx.textBaseline = 'alphabetic'; let k = 0; const his = [];
  lines.forEach((ln, li) => { let cx = align === 'center' ? x - ln.w / 2 : x; const by = y + li * size * lh;
    // 高亮底条（先画）
    let run = null; ln.chars.forEach((c, i) => { if (c.hi) { run ??= { x: cx + ln.chars.slice(0, i).reduce((a, q) => a + q.w, 0), w: 0, k }; run.w += c.w; } if ((!c.hi || i === ln.chars.length - 1) && run) { his.push({ ...run, y: by }); run = null; } k++; });
    for (const h of his.filter(h => h.y === by)) { const p = E.outC(clamp((u - t0 - .25 - h.k * stagger) / .35)); if (p <= 0) continue; ctx.fillStyle = hiColor; ctx.beginPath(); ctx.roundRect(h.x - size * .08, by - size * .78, (h.w + size * .16) * p, size * .98, size * .12); ctx.fill(); }
  });
  k = 0; lines.forEach((ln, li) => { let cx = align === 'center' ? x - ln.w / 2 : x; const by = y + li * size * lh;
    for (const c of ln.chars) { const p = POP(clamp((u - t0 - k * stagger) / .42)); if (p > 0) { ctx.save(); ctx.translate(cx + c.w / 2, by - size * .3); ctx.scale(p, p); ctx.translate(0, (1 - Math.min(1, p)) * size * .4);
        ctx.fillStyle = c.hi && hiText ? hiText : color; ctx.textAlign = 'center'; ctx.fillText(c.ch, 0, size * .3); ctx.restore(); } cx += c.w; k++; } });
  return { h: lines.length * size * lh, lines };
}
function icon(ctx, name, x, y, size, pal, p = 1, rot = 0, on) { if (p <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(size * p, size * p); const f = ICONS[iconOf(name)];
  // 图标颜色和它下面的底色一样时，换成别的颜色，保证看得见
  const pool = [pal.a, pal.c, pal.b, pal.ink], pick = c => (on && c.toLowerCase() === on.toLowerCase()) ? pool.find(q => q.toLowerCase() !== on.toLowerCase() && q !== c) : c;
  f(ctx, { a: pick(pal.a), b: pick(pal.b), c: pick(pal.c), ink: pick(pal.ink), light: pick(pal.light), sh: 'rgba(0,0,0,.14)' }); ctx.restore(); }
// 大块几何构图：每个镜头一块缓慢移动的大色块，给画面层次
function bigShape(ctx, seed, u, t, col, kind) { const r = rng(seed), k = E.outC(clamp(u / .7)); ctx.save(); ctx.globalAlpha = .9; ctx.fillStyle = col;
  if (kind === 0) { const x = r() < .5 ? 1650 : 270, y = r() < .5 ? 160 : 920; ctx.beginPath(); ctx.arc(x + Math.sin(t * .6) * 20, y, 420 * k, 0, Math.PI * 2); ctx.fill(); }
  else if (kind === 1) { const y = 1080 - 200 * k; ctx.beginPath(); ctx.moveTo(0, 1080); for (let x = 0; x <= 1920; x += 40) ctx.lineTo(x, y + Math.sin(x / 240 + t * 1.2) * 26); ctx.lineTo(1920, 1080); ctx.fill(); }
  else if (kind === 2) { ctx.translate(1920, 0); ctx.rotate(.5 + Math.sin(t * .4) * .03); ctx.fillRect(-300 * k, -200, 600 * k, 1500); }
  else { ctx.beginPath(); ctx.arc(960, 1080 + 380 - 380 * k * .0, 720 * k, Math.PI, 0); ctx.fill(); }
  ctx.restore(); }
const pill = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill(); };
// 信使：圆角小方块，自带一点呼吸
function messenger(ctx, x, y, s, col, t, p = 1) { if (p <= 0) return; const b = 1 + .05 * Math.sin(t * 5); ctx.save(); ctx.translate(x, y); ctx.rotate(.12 + .05 * Math.sin(t * 2)); ctx.scale(p * b, p * b); ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-s / 2, -s / 2, s, s, s * .28); ctx.fill(); ctx.restore(); }
// 背景点缀：圆环、加号、波浪线、小圆点，按种子摆在四周，缓慢漂浮
function decor(ctx, seed, u, cols, t, dense = 1) {
  const r = rng(seed); const n = Math.round(7 * dense);
  for (let i = 0; i < n; i++) { const side = i % 4, x = side < 2 ? (side ? 1920 - 120 - r() * 260 : 120 + r() * 260) : 200 + r() * 1520, y = side < 2 ? 140 + r() * 800 : (side === 2 ? 90 + r() * 120 : 900 + r() * 110);
    const k = POP(clamp((u - .1 - i * .05) / .45)), c = cols[i % cols.length], kind = Math.floor(r() * 4), s = 26 + r() * 40, fy = Math.sin(t * 1.3 + i) * 8; if (k <= 0) continue;
    ctx.save(); ctx.translate(x, y + fy); ctx.scale(k, k); ctx.rotate(t * .3 * (i % 2 ? 1 : -1)); ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = 12; ctx.lineCap = 'round';
    if (kind === 0) { ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.stroke(); } else if (kind === 1) { ctx.beginPath(); ctx.moveTo(-s * .7, 0); ctx.lineTo(s * .7, 0); ctx.moveTo(0, -s * .7); ctx.lineTo(0, s * .7); ctx.stroke(); }
    else if (kind === 2) { ctx.beginPath(); for (let j = 0; j <= 24; j++) { const xx = -s * 1.2 + j * s * .1; ctx.lineTo(xx, Math.sin(j * .7) * s * .25); } ctx.stroke(); } else { ctx.beginPath(); ctx.arc(0, 0, s * .45, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore(); }
}

// ---------- 镜头 ----------
// 每个镜头画在 1920×1080 上，返回信使的位置 {x, y}
const SHOTS = {
  title(ctx, s, u, Z) { const { pal, bg, fg } = Z; decor(ctx, Z.seed, u, [pal.b, pal.c, pal.light].filter(c => c !== bg), Z.t);
    const r = richText(ctx, s.text || '标题', 960, 470, { size: 170, maxW: 1500, color: fg, hiColor: pal.accent, hiText: pal.light, u, t0: .15, maxLines: 2 });
    if (s.sub) { const p = E.outC(clamp((u - .7) / .4)); ctx.globalAlpha = p; richText(ctx, s.sub, 960, 470 + r.h + 20 - (1 - p) * 20, { size: 54, maxW: 1400, color: fg, u: 9, weight: 700 }); ctx.globalAlpha = 1; }
    return { x: 960, y: 470 - 180, s: 54, p: POP(clamp((u - .55) / .4)) }; },
  statement(ctx, s, u, Z) { const { pal, bg, fg } = Z; const hasIcon = !!s.icon, x0 = 170, mw = hasIcon ? 1060 : 1560;
    const lines = layout(ctx, s.text || '', 118, mw), y0 = 540 - (lines.length * 118 * 1.18) / 2 + 90;
    richText(ctx, s.text || '', x0, y0, { size: 118, maxW: mw, align: 'left', color: fg, hiColor: pal.accent, hiText: pal.light, u, t0: .1 });
    if (hasIcon) { const p = POP(clamp((u - .35) / .5)); ctx.fillStyle = lum(bg) > .6 ? 'rgba(0,0,0,.06)' : 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(1500, 540, 260 * p, 0, Math.PI * 2); ctx.fill(); icon(ctx, s.icon, 1500, 540 + Math.sin(Z.t * 2) * 10, 380, pal, p, Math.sin(Z.t * 1.5) * .04, bg); }
    return { x: x0 + 20, y: y0 - 150, s: 40, p: POP(clamp((u - .05) / .4)) }; },
  icon(ctx, s, u, Z) { const { pal, bg, fg } = Z; decor(ctx, Z.seed + 3, u, [pal.b, pal.c], Z.t, .6);
    const p0 = POP(clamp((u - .05) / .45)), p1 = POP(clamp((u - .2) / .5)); ctx.fillStyle = lum(bg) > .6 ? pal.ink : pal.light; ctx.globalAlpha = .1; ctx.beginPath(); ctx.arc(960, 410, 280 * p0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = pal.light; ctx.beginPath(); ctx.arc(960, 410, 230 * p0, 0, Math.PI * 2); ctx.fill();
    icon(ctx, s.icon || 'bulb', 960, 410 + Math.sin(Z.t * 2.2) * 8, 330, pal, p1, Math.sin(Z.t * 1.4) * .05, pal.light);
    const r = richText(ctx, s.text || '', 960, 820, { size: 92, maxW: 1500, color: fg, hiColor: pal.accent, hiText: pal.light, u, t0: .45, maxLines: 2 });
    if (s.sub) { const p = E.outC(clamp((u - 1) / .4)); ctx.globalAlpha = p; richText(ctx, s.sub, 960, 820 + r.h - 10, { size: 46, maxW: 1500, color: fg, u: 9, weight: 600 }); ctx.globalAlpha = 1; }
    return { x: 960 + 170, y: 410 - 170, s: 46, p: POP(clamp((u - .45) / .4)) }; },
  compare(ctx, s, u, Z) { const { pal } = Z, L = s.left || { text: '以前', icon: 'cross' }, R = s.right || { text: '现在', icon: 'check' };
    const sp = E.ioC(clamp(u / .45)); ctx.fillStyle = pal.ink; ctx.fillRect(0, 0, 960 * sp, 1080); ctx.fillStyle = pal.light; ctx.fillRect(1920 - 960 * sp, 0, 960 * sp, 1080);
    const lf = pal.light, rf = pal.ink;
    if (s.text) richText(ctx, s.text, 960, 150, { size: 64, maxW: 1700, color: pal.accent, u, t0: .3, weight: 900, maxLines: 1 });
    [[L, 480, lf, L.icon || 'cross', .45], [R, 1440, rf, R.icon || 'check', .75]].forEach(([it, x, col, ic, t0]) => {
      icon(ctx, ic, x, 440, 300, pal, POP(clamp((u - t0) / .45)), Math.sin(Z.t * 2 + x) * .05, x < 960 ? pal.ink : pal.light);
      richText(ctx, it.text || '', x, 760, { size: 80, maxW: 760, color: col, hiColor: pal.accent, hiText: pal.light, u, t0: t0 + .15, maxLines: 2 });
      if (it.sub) { ctx.globalAlpha = E.outC(clamp((u - t0 - .6) / .4)); richText(ctx, it.sub, x, 900, { size: 40, maxW: 760, color: col, u: 9, weight: 600, maxLines: 1 }); ctx.globalAlpha = 1; } });
    const vp = POP(clamp((u - .55) / .4)); ctx.save(); ctx.translate(960, 440); ctx.scale(vp, vp); ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = pal.light; ctx.font = `900 64px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('VS', 0, 4); ctx.restore();
    return { x: 960, y: 440 + 110, s: 40, p: vp }; },
  list(ctx, s, u, Z) { const { pal, bg, fg } = Z, items = (s.items || []).slice(0, 4).map(it => typeof it === 'string' ? { text: it } : it), n = items.length || 1;
    if (s.text) richText(ctx, s.text, 960, 210, { size: 84, maxW: 1700, color: fg, hiColor: pal.accent, hiText: pal.light, u, t0: 0, maxLines: 1 });
    const cw = n === 4 ? 380 : n === 3 ? 470 : 560, gap = 50, x0 = 960 - (n * cw + (n - 1) * gap) / 2, cy = s.text ? 610 : 540, cols = [pal.a, pal.c, pal.b, pal.accent];
    items.forEach((it, i) => { const p = POP(clamp((u - .35 - i * .18) / .5)); if (p <= 0) return; const x = x0 + i * (cw + gap) + cw / 2;
      ctx.save(); ctx.translate(x, cy + Math.sin(Z.t * 2 + i) * 6); ctx.scale(p, p); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.roundRect(-cw / 2 + 12, -250 + 16, cw, 500, 44); ctx.fill();
      ctx.fillStyle = pal.light; ctx.beginPath(); ctx.roundRect(-cw / 2, -250, cw, 500, 44); ctx.fill(); ctx.fillStyle = cols[i % 4]; ctx.beginPath(); ctx.roundRect(-cw / 2, -250, cw, 250, [44, 44, 0, 0]); ctx.fill();
      ctx.restore(); icon(ctx, it.icon || ['bulb', 'target', 'gear', 'star'][i], x, cy - 125 + Math.sin(Z.t * 2 + i) * 6, 180, pal, p, 0, cols[i % 4]);
      ctx.fillStyle = pal.ink; ctx.font = `900 ${Math.round(46 * p)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1).padStart(2, '0'), x - cw / 2 + 56, cy - 200 + Math.sin(Z.t * 2 + i) * 6);
      if (p > .9) richText(ctx, it.text || '', x, cy + 110 + Math.sin(Z.t * 2 + i) * 6, { size: n === 4 ? 56 : 64, maxW: cw - 50, color: pal.ink, u: 9, maxLines: 2 }); });
    return { x: x0 + cw - 30, y: cy - 250, s: 40, p: POP(clamp((u - .5) / .4)) }; },
  steps(ctx, s, u, Z) { const { pal, fg } = Z, items = (s.items || []).slice(0, 4).map(it => typeof it === 'string' ? { text: it } : it), n = items.length || 1;
    if (s.text) richText(ctx, s.text, 960, 220, { size: 84, maxW: 1700, color: fg, hiColor: pal.accent, hiText: pal.light, u, t0: 0, maxLines: 1 });
    const xs = items.map((_, i) => n === 1 ? 960 : 260 + i * (1400 / (n - 1))), y = 560, per = (Z.dur - 1.2) / Math.max(1, n), lp = clamp((u - .4) / (per * (n - .3)));
    ctx.strokeStyle = fg; ctx.globalAlpha = .25; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.setLineDash([2, 34]); ctx.beginPath(); ctx.moveTo(xs[0], y); ctx.lineTo(xs[n - 1], y); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    ctx.strokeStyle = pal.accent; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(xs[0], y); ctx.lineTo(lerp(xs[0], xs[n - 1], lp), y); ctx.stroke();
    items.forEach((it, i) => { const t0 = .4 + i * per * .95, p = POP(clamp((u - t0) / .45)); if (p <= 0) return;
      ctx.save(); ctx.translate(xs[i], y); ctx.scale(p, p); ctx.fillStyle = [pal.a, pal.c, pal.b, pal.accent][i % 4]; ctx.beginPath(); ctx.arc(0, 0, 92, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pal.light; ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      if (it.icon) icon(ctx, it.icon, xs[i], y, 96, pal, p); else { ctx.fillStyle = pal.ink; ctx.font = `900 ${Math.round(80 * p)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), xs[i], y + 6); }
      richText(ctx, it.text || '', xs[i], y + 210, { size: 58, maxW: 1400 / Math.max(2, n) + 60, color: fg, u, t0: t0 + .15, maxLines: 2 }); });
    return { x: lerp(xs[0], xs[n - 1], lp), y: y - 140, s: 44, p: POP(clamp((u - .3) / .4)) }; },
  number(ctx, s, u, Z) { const { pal, bg, fg } = Z, raw = String(s.value ?? '3'), num = parseFloat(raw), dec = (raw.split('.')[1] || '').length;
    const cp = E.outC(clamp((u - .2) / 1.1)), shown = isFinite(num) ? (num * cp).toFixed(dec) : raw, unit = s.unit || '';
    ctx.font = `900 380px ${FONT}`; const nw = ctx.measureText(isFinite(num) ? num.toFixed(dec) : raw).width; ctx.font = `900 130px ${FONT}`; const uw = ctx.measureText(unit).width;
    const x0 = 960 - (nw + uw + 30) / 2, p = POP(clamp((u - .1) / .5));
    ctx.save(); ctx.translate(960, 470); ctx.scale(p, p); ctx.translate(-960, -470); ctx.fillStyle = pal.accent; ctx.font = `900 380px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(shown, x0, 600);
    ctx.fillStyle = fg; ctx.font = `900 130px ${FONT}`; ctx.fillText(unit, x0 + nw + 30, 600); ctx.restore();
    // 下方三根柱子
    const bars = [.35, .6, 1]; bars.forEach((v, i) => { const bp = E.outBack(clamp((u - .5 - i * .15) / .5)); ctx.fillStyle = [pal.c, pal.b, pal.accent][i]; ctx.globalAlpha = .9; ctx.beginPath(); ctx.roundRect(1540 + i * 70, 640 - 260 * v * bp, 46, 260 * v * bp, 12); ctx.fill(); ctx.globalAlpha = 1; });
    richText(ctx, s.text || '', 960, 800, { size: 76, maxW: 1500, color: fg, hiColor: pal.accent, hiText: pal.light, u, t0: .6, maxLines: 2 });
    return { x: x0 - 70, y: 330, s: 50, p }; },
  quote(ctx, s, u, Z) { const { pal, fg } = Z; const qp = POP(clamp(u / .45));
    ctx.save(); ctx.translate(250, 300); ctx.scale(qp, qp); ctx.fillStyle = pal.accent; for (const dx of [0, 120]) { ctx.beginPath(); ctx.arc(dx, 0, 50, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(dx - 50, 0); ctx.quadraticCurveTo(dx - 40, 90, dx + 20, 110); ctx.lineTo(dx + 30, 90); ctx.quadraticCurveTo(dx - 5, 60, dx + 40, 10); ctx.fill(); } ctx.restore();
    richText(ctx, s.text || '', 960, 500, { size: 100, maxW: 1400, color: fg, hiColor: pal.accent, hiText: pal.light, u, t0: .25, maxLines: 3, stagger: .025 });
    const ap = POP(clamp((u - .8) / .45)); if (s.by) { icon(ctx, 'person', 860, 880, 120, pal, ap, 0, Z.bg); ctx.globalAlpha = E.outC(clamp((u - .9) / .3)); ctx.fillStyle = fg; ctx.font = `800 52px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('— ' + s.by, 940, 885); ctx.globalAlpha = 1; }
    return { x: 1680, y: 300, s: 46, p: qp }; },
  outro(ctx, s, u, Z) { const { pal, bg, fg } = Z; decor(ctx, Z.seed + 9, u, [pal.b, pal.c, pal.accent].filter(c => c !== bg), Z.t, 1.2);
    const r = richText(ctx, s.text || '关注我', 960, 420, { size: 160, maxW: 1500, color: fg, hiColor: pal.accent, hiText: pal.light, u, t0: .1, maxLines: 2 });
    if (s.sub) { ctx.globalAlpha = E.outC(clamp((u - .6) / .4)); richText(ctx, s.sub, 960, 420 + r.h - 30, { size: 56, maxW: 1500, color: fg, u: 9, weight: 700 }); ctx.globalAlpha = 1; }
    // 关注按钮 + 光标点击
    const by = 420 + r.h + 110, bp = POP(clamp((u - .9) / .45)), click = clamp((u - 1.7) / .25), press = click > 0 && click < 1 ? 1 - Math.sin(click * Math.PI) * .08 : 1, done = u > 1.82, label = done ? (s.done || '已关注') : (s.button || '+ 关注');
    ctx.save(); ctx.translate(960, by); ctx.scale(bp * press, bp * press); ctx.font = `900 64px ${FONT}`; const lw = ctx.measureText(label).width + 120; pill(ctx, -lw / 2, -60, lw, 120, done ? pal.c : pal.accent); ctx.fillStyle = pal.light; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, 4); ctx.restore();
    const cp = E.ioC(clamp((u - 1.15) / .55)); if (u > 1.15) { const cx = lerp(1400, 990, cp), cy = lerp(by + 260, by + 30, cp); ctx.save(); ctx.translate(cx, cy); ctx.scale(press, press); ctx.fillStyle = pal.ink; ctx.strokeStyle = pal.light; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 70); ctx.lineTo(18, 54); ctx.lineTo(32, 82); ctx.lineTo(44, 76); ctx.lineTo(30, 49); ctx.lineTo(52, 47); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore(); }
    if (done) for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, d = E.outC(clamp((u - 1.82) / .5)) * 200; ctx.globalAlpha = 1 - clamp((u - 1.82) / .7); icon(ctx, i % 2 ? 'heart' : 'star', 960 + Math.cos(a) * (120 + d), by + Math.sin(a) * (60 + d * .5), 44, pal, 1); ctx.globalAlpha = 1; }
    return { x: 960 + 200, y: by - 90, s: 40, p: 0 }; },
};
SHOTS.quote_ = SHOTS.quote;

// ---------- 整片 ----------
export function buildFilm(spec, out) {
  const tl = timeline(spec.shots || [], 1.5, 8), seed = hashStr(JSON.stringify(spec)), pal = PALETTES[spec.palette] || PALETTES.mint, ctx = out.getContext('2d');
  const bgOf = i => { const s = tl.shots[i]; if (s && s.bg && /^#[0-9a-f]{6}$/i.test(s.bg)) return s.bg; return pal.bg[i % pal.bg.length]; };
  const fgOn = bg => lum(bg) > .6 ? pal.ink : pal.light;
  const TR = .42;   // 转场长度
  let lastCarrier = { x: 960, y: 540 };
  function drawShot(s, t) { const u = t - s.t0, bg = bgOf(s.i); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const Z = { pal: { ...pal, accent: bg === pal.accent ? pal.ink : pal.accent }, bg, fg: fgOn(bg), seed: seed + s.i * 17, t, dur: s.dur };
    if (s.type !== 'compare') { const sc = [pal.b, pal.c, pal.a, pal.light, pal.ink].filter(c => c.toLowerCase() !== bg.toLowerCase()), col = sc[(seed + s.i) % sc.length];
      ctx.save(); ctx.globalAlpha = lum(bg) > .6 ? .35 : .22; bigShape(ctx, seed + s.i * 31, u, t, col, (s.i + seed) % 4); ctx.restore(); }
    const c = (SHOTS[s.type] || SHOTS.statement)(ctx, s, u, Z) || { x: 960, y: 540, s: 40, p: 1 };
    // 镜头末尾：信使放大成下一个镜头的底色
    const nx = tl.shots[s.i + 1]; const endP = nx ? clamp((u - (s.dur - TR)) / TR) : 0;
    messenger(ctx, c.x, c.y, c.s, Z.pal.accent, t, endP > 0 ? 1 : c.p);
    if (endP > 0) { const nb = bgOf(s.i + 1), R = E.inC(endP) * 2300; ctx.fillStyle = nb; ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(.12 + endP * .6); ctx.beginPath(); ctx.roundRect(-R / 2, -R / 2, R, R, R * .28); ctx.fill(); ctx.restore(); }
    return c; }
  function render(t) { const s = shotAt(tl, t); drawShot(s, t);
    // 细颗粒，让平面色块不那么「数码」
    if (!render.grain) { const g = document.createElement('canvas'); g.width = 256; g.height = 256; const x = g.getContext('2d'), d = x.createImageData(256, 256), r = rng(5); for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 14; } x.putImageData(d, 0, 0); render.grain = ctx.createPattern(g, 'repeat'); }
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.translate((Math.floor(t * 12) * 37) % 256, (Math.floor(t * 12) * 91) % 256); ctx.fillStyle = render.grain; ctx.fillRect(-256, -256, W + 512, H + 512); ctx.restore(); }
  return { duration: tl.duration, render, audio: () => popTrack(tl, seed), info: { shots: tl.shots.length } };
}

// ---------- 配乐：明亮的流行节拍（四拍底鼓、拍手、合成器和弦、马林巴琶音），镜头切换处加「嗖」和「啵」 ----------
function popTrack(tl, seed) {
  const r = rng(seed), bpm = 116, beat = 60 / bpm, m = new Mix(tl.duration + .5), root = [57, 60, 62, 55][Math.floor(r() * 4)];
  const prog = [[0, 4, 7, 11], [-3, 0, 4, 7], [5, 9, 12, 16], [7, 11, 14, 17]];   // Imaj7 vi7 IVmaj7 V
  const bars = Math.ceil(tl.duration / (beat * 4));
  for (let b = 0; b < bars; b++) { const ch = prog[b % 4], t0 = b * 4 * beat;
    for (let i = 0; i < 4; i++) { m.tone(t0 + i * beat, .16, 95, { wave: 'sine', vol: .55, slide: -.55, env: [.001, .12, .1, .03] }); if (i % 2) m.tone(t0 + i * beat, .1, 1800, { wave: 'noise', vol: .18, env: [.002, .07, .05, .03] }); }
    for (let i = 0; i < 8; i++) m.tone(t0 + i * beat / 2 + beat / 4, .03, 9000, { wave: 'noise', vol: .04, pan: .2, env: [.001, .02, .1, .01] });
    for (const n of ch) m.tone(t0, beat * 3.8, noteHz(root + n), { wave: 'saw', vol: .025, pan: (n % 2 ? -.3 : .3), env: [.08, .4, .5, .4] });
    for (let i = 0; i < 4; i++) m.tone(t0 + i * beat, beat * .9, noteHz(root - 24 + ch[0] + (i === 3 ? 7 : 0)), { wave: 'tri', vol: .3, env: [.005, .15, .6, .05] });
    for (let i = 0; i < 8; i++) if (r() > .3) m.tone(t0 + i * beat / 2, .22, noteHz(root + 12 + ch[(i * 3) % 4]), { wave: 'sine', vol: .1, pan: .25, env: [.002, .2, .05, .1] });
  }
  for (const s of tl.shots) { if (s.i > 0) { m.tone(s.t0 - .42, .4, 300, { wave: 'noise', vol: .12, slide: 2, env: [.3, .05, .5, .05] }); m.tone(s.t0, .08, noteHz(84), { wave: 'sine', vol: .25, slide: -.4 }); }
    m.tone(s.t0 + .2, .1, noteHz(91), { wave: 'sine', vol: .12 }); }
  m.echo(.21, .3, .25); return m.master();
}
