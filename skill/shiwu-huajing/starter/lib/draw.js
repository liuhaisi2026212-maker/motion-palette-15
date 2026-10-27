// 常用画法：文字（换行、描边、逐字弹出、花字）、形状、质感（颗粒、暗角、辉光）、像素、照片。
// 都是 Canvas 2D，任何浏览器都能跑，导出也不会出问题。
import { clamp, spring, rng } from './core.js';

export const SANS = '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

// ---------- 文字 ----------
// 把一句话切成多行：中文按字切，英文按词切；两行时把断点放到中间附近，避免第二行只剩一两个字
export function wrapText(ctx, s, maxW) {
  const words = String(s).match(/[A-Za-z0-9'’\-.%]+|\s+|./gu) || [], lines = [''];
  for (const w of words) { const cur = lines[lines.length - 1]; if (ctx.measureText(cur + w).width > maxW && cur.trim()) lines.push(w.trim()); else lines[lines.length - 1] = cur + w; }
  if (lines.length === 2) { const all = lines.join(''), chars = [...all]; let best = lines[0].length, bd = 1e9;
    for (let i = 1; i < chars.length; i++) { const a = chars.slice(0, i).join(''), b = chars.slice(i).join(''); const wa = ctx.measureText(a).width, wb = ctx.measureText(b).width;
      if (wa > maxW || wb > maxW || /^[，。！？、,.!?」』）)]/.test(b) || /[A-Za-z0-9]$/.test(a) && /^[A-Za-z0-9]/.test(b)) continue; const d = Math.abs(wa - wb); if (d < bd) { bd = d; best = i; } }
    return [chars.slice(0, best).join(''), chars.slice(best).join('')]; }
  return lines;
}
// 画一段文字。o: { size, weight, font, color, align('center'|'left'|'right'), maxW, lh 行高倍数, stroke 描边色, strokeW, shadow 投影色, shadowY }
export function text(ctx, s, x, y, o = {}) {
  const size = o.size || 60, font = `${o.weight || 700} ${size}px ${o.font || SANS}`; ctx.save(); ctx.font = font; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const lines = o.maxW ? wrapText(ctx, s, o.maxW) : [String(s)], lh = size * (o.lh || 1.25), y0 = y - (lines.length - 1) * lh / 2;
  lines.forEach((ln, i) => { const yy = y0 + i * lh;
    if (o.shadow) { ctx.fillStyle = o.shadow; ctx.fillText(ln, x + (o.shadowX || 0), yy + (o.shadowY ?? size * .06)); }
    if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.strokeW || size * .18; ctx.strokeText(ln, x, yy); }
    ctx.fillStyle = o.color || '#111'; ctx.fillText(ln, x, yy); });
  ctx.restore(); return lines.length * lh;
}
// 逐字弹出：每个字晚 gap 秒，用弹簧从 0 放大到 1（自带 15% 左右的回弹）
export function popText(ctx, s, x, y, t, t0, o = {}) {
  const size = o.size || 100, gap = o.gap ?? 2 / 30; ctx.save(); ctx.font = `${o.weight || 900} ${size}px ${o.font || SANS}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  const chars = [...String(s)], ws = chars.map(c => ctx.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0); let cx = o.align === 'left' ? x : x - tot / 2;
  chars.forEach((c, i) => { const k = spring(t - t0 - i * gap, o.f || 3, o.z || .42); if (k > .001) { ctx.save(); ctx.translate(cx + ws[i] / 2, y + (1 - Math.min(1, k)) * size * .35); ctx.scale(k, k); ctx.rotate((o.tilt || 0) * (i % 2 ? 1 : -1));
      if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.strokeW || size * .2; ctx.lineJoin = 'round'; ctx.strokeText(c, 0, 0); } ctx.fillStyle = o.color || '#111'; ctx.fillText(c, 0, 0); ctx.restore(); } cx += ws[i]; });
  ctx.restore(); return tot;
}
// 花字（综艺字）：立体厚度 + 外描边 + 白色内描边 + 渐变字面 + 顶部高光
export function fancyText(ctx, s, x, y, size, ink = {}, o = {}) {
  const c = { top: '#FFF7B0', bot: '#FFB800', inner: '#FFFFFF', outer: '#E8462B', deep: '#8A1E10', ...ink };
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.font = `${o.weight || 900} ${size}px ${o.font || SANS}`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  for (let d = size * .09; d > 0; d -= 2) { ctx.strokeStyle = c.deep; ctx.lineWidth = size * .3; ctx.strokeText(s, d * .5, d); ctx.fillStyle = c.deep; ctx.fillText(s, d * .5, d); }
  ctx.strokeStyle = c.outer; ctx.lineWidth = size * .3; ctx.strokeText(s, 0, 0); ctx.strokeStyle = c.inner; ctx.lineWidth = size * .14; ctx.strokeText(s, 0, 0);
  const g = ctx.createLinearGradient(0, -size / 2, 0, size / 2); g.addColorStop(0, c.top); g.addColorStop(.55, c.bot); ctx.fillStyle = g; ctx.fillText(s, 0, 0);
  ctx.globalAlpha = .5; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.rect(-5000, -size * .5, 10000, size * .22); ctx.clip(); ctx.fillText(s, 0, 0);
  ctx.restore();
}
// 适配字号：一行字超过 maxW 就缩小
export function fitSize(ctx, s, size, maxW, weight = 900, font = SANS) { ctx.font = `${weight} ${size}px ${font}`; const w = ctx.measureText(s).width; return w > maxW ? size * maxW / w : size; }

// ---------- 颜色 ----------
const h2r = h => { h = String(h).replace('#', ''); if (h.length === 3) h = [...h].map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const r2h = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
// mix(a, b, 0.3)：a 往 b 混 30%；shade(颜色, 0.2) 变亮 20%，shade(颜色, -0.2) 变暗 20%
export const mix = (a, b, t) => { const x = h2r(a), y = h2r(b); return r2h(x.map((v, i) => v + (y[i] - v) * t)); };
export const shade = (c, amt) => amt >= 0 ? mix(c, '#ffffff', amt) : mix(c, '#000000', -amt);
// 亮度 0~1，用来判断上面放深字还是浅字
export const luma = c => { const [r, g, b] = h2r(c); return (r * .299 + g * .587 + b * .114) / 255; };

// ---------- 形状 ----------
export function rrect(ctx, x, y, w, h, r, fill, stroke, lw) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 4; ctx.stroke(); } }
export function circle(ctx, x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }
export function star(ctx, x, y, r, points = 5, inner = .45, fill = '#FFD166', rot = -Math.PI / 2) { ctx.beginPath(); for (let i = 0; i < points * 2; i++) { const a = rot + i * Math.PI / points, rr = i % 2 ? r * inner : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
// 爆炸框（锯齿星形），综艺「震惊」用
export function burst(ctx, x, y, r, n = 14, fill = '#FFE45E', edge = '#111', rot = 0) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2, rr = i % 2 ? r * .62 : r * (1 + .08 * Math.sin(i * 2.3)); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.lineJoin = 'round'; ctx.lineWidth = r * .07; ctx.strokeStyle = edge; ctx.stroke(); ctx.fillStyle = fill; ctx.fill(); ctx.restore(); }
// 放射速度线（每帧随机，冲击时刻用）
export function speedLines(ctx, x, y, seed, color = 'rgba(255,255,255,.85)', count = 46, inner = 420) { const r = rng(seed); ctx.save(); ctx.translate(x, y); ctx.fillStyle = color; for (let i = 0; i < count; i++) { const a = r() * Math.PI * 2, r0 = inner + r() * 200, w = .012 + r() * .02; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 3000, Math.sin(a) * 3000); ctx.lineTo(Math.cos(a - w) * r0, Math.sin(a - w) * r0); ctx.lineTo(Math.cos(a + w) * r0, Math.sin(a + w) * r0); ctx.fill(); } ctx.restore(); }

// ---------- 质感 ----------
let _grain = null;
// 颗粒：每帧换位置，amount 3%~6%
export function grain(ctx, t, amount = .045) { if (!_grain) { const g = document.createElement('canvas'); g.width = g.height = 256; const x = g.getContext('2d'), d = x.createImageData(256, 256), r = rng(7); for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); _grain = g; }
  const W = ctx.canvas.width, H = ctx.canvas.height, f = Math.floor(t * 24); ctx.save(); ctx.globalAlpha = amount; ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = ctx.createPattern(_grain, 'repeat'); ctx.translate((f * 37) % 256, (f * 91) % 256); ctx.fillRect(-256, -256, W + 512, H + 512); ctx.restore(); }
// 暗角：边缘压暗
export function vignette(ctx, amount = .35, color = '0,0,0') { const W = ctx.canvas.width, H = ctx.canvas.height, g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.hypot(W, H) * .55); g.addColorStop(0, `rgba(${color},0)`); g.addColorStop(1, `rgba(${color},${amount})`); ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
// 辉光：把 fn 里画的东西画两遍（宽而淡 + 窄而亮）
export function glow(ctx, color, fn, wide = 30, tight = 6) { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = wide; ctx.globalAlpha = .7; fn(); ctx.shadowBlur = tight; ctx.globalAlpha = 1; fn(); ctx.restore(); }
// 照片铺满（裁切居中），zoom > 1 放大；用于肯·伯恩斯缓慢推近
export function cover(ctx, img, x, y, w, h, zoom = 1, fx = .5, fy = .5) { const s = Math.max(w / img.width, h / img.height) * zoom, iw = img.width * s, ih = img.height * s; ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(img, x + (w - iw) * fx, y + (h - ih) * fy, iw, ih); ctx.restore(); }
export const loadImage = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });

// ---------- 像素风 ----------
// 用法：const low = pixelCanvas(320, 180)；在 low.ctx 上逐像素画；最后 blitPixels(ctx, low) 整数放大到大画布（不做平滑）
export function pixelCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false; return { c, ctx, w, h }; }
export function blitPixels(ctx, low) { ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(low.c, 0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore(); }
// 字符画 → 精灵图。rows 是字符串数组，map 把字符映射成颜色，'.' 透明
export function sprite(rows, map) { const c = document.createElement('canvas'); c.width = Math.max(...rows.map(r => r.length)); c.height = rows.length; const x = c.getContext('2d'); rows.forEach((r, j) => [...r].forEach((ch, i) => { if (map[ch]) { x.fillStyle = map[ch]; x.fillRect(i, j, 1, 1); } })); return c; }
// 像素字：先把字画出来，再把半透明的边缘砍掉（阈值），中文也能保持硬边。font 用像素字体，比如 '12px "Fusion Pixel 12"'
const _glyphs = new Map();
export function pixelText(ctx, s, x, y, color, font = '12px "Fusion Pixel 12"', scale = 1, align = 'left') {
  const key = font + s; let g = _glyphs.get(key);
  if (!g) { const c = document.createElement('canvas'), m = c.getContext('2d'); m.font = font; const w = Math.ceil(m.measureText(s).width) + 2, h = parseInt(font) + 6; c.width = w; c.height = h; m.font = font; m.textBaseline = 'top'; m.fillStyle = '#fff'; m.fillText(s, 0, 1);
    const d = m.getImageData(0, 0, w, h); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 110 ? 255 : 0; m.putImageData(d, 0, 0); g = c; _glyphs.set(key, g); }
  const tint = document.createElement('canvas'); tint.width = g.width; tint.height = g.height; const tc = tint.getContext('2d'); tc.drawImage(g, 0, 0); tc.globalCompositeOperation = 'source-in'; tc.fillStyle = color; tc.fillRect(0, 0, g.width, g.height);
  const dx = align === 'center' ? -g.width * scale / 2 : align === 'right' ? -g.width * scale : 0; ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(tint, Math.round(x + dx), Math.round(y), g.width * scale, g.height * scale); ctx.restore(); return g.width * scale;
}
// 拜耳抖动：两色之间做像素渐变（天空、阴影）
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
export const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
