// 十五画境·创作版 —— 综艺花字零件库（竖屏 1080×1920）
// 背景用你自己的照片（"image": "@1" 表示第 1 张上传的图），没有照片就用彩色花纹底。
// 花字类型：title 开场大字 / caption 底部字幕 / boom 爆炸框 / warn 警示条 / whisper 小声吐槽 / vertical 竖排大字 / tag 人物名牌 / meter 检测仪 / stamp 认证章 / bye 结尾
// 抖音安全区：上 220、下 420 像素会被界面挡住，主要内容放在中间。
import { clamp, lerp, E, spring, hashStr, rng, timeline, shotAt, Mix, noteHz, imageURL, loadImage } from '../../lib/core.js';

export const W = 1080, H = 1920;
const BOLD = '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif';
const FUN = '"ZCOOL KuaiLe", ' + BOLD, HAND = '"LXGW Marker Gothic", ' + BOLD;
// 花字配色（字面渐变上→下、内描边、外描边、立体厚度）
const INK = {
  sun: { top: '#FFF7B0', bot: '#FFB800', in: '#FFFFFF', out: '#E8462B', deep: '#8A1E10' },
  pink: { top: '#FFE3F1', bot: '#FF4FA0', in: '#FFFFFF', out: '#7A1BD8', deep: '#3B0A6E' },
  sky: { top: '#E6FBFF', bot: '#22C8F5', in: '#FFFFFF', out: '#1543B8', deep: '#0A1F5C' },
  lime: { top: '#F7FFD0', bot: '#7BE33B', in: '#FFFFFF', out: '#127A3A', deep: '#063A1B' },
  red: { top: '#FFE0D6', bot: '#FF3B30', in: '#FFFFFF', out: '#1B1B1B', deep: '#000000' },
};
const BGS = [['#FF5FA2', '#FFD84D'], ['#3DD6F5', '#FFFFFF'], ['#8B5CF6', '#F9A8D4'], ['#FFB020', '#FF5E3A'], ['#22C55E', '#FDE047'], ['#111827', '#F43F5E']];

// ---------- 花字：多层描边 + 立体厚度 + 渐变字面 ----------
function fancy(ctx, str, x, y, size, ink, o = {}) {
  const font = o.font || FUN, depth = o.depth ?? size * .09, rot = o.rot || 0;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.font = `${o.weight || 900} ${size}px ${font}`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  for (let d = depth; d > 0; d -= 2) { ctx.strokeStyle = ink.deep; ctx.lineWidth = size * .3; ctx.strokeText(str, d * .5, d); ctx.fillStyle = ink.deep; ctx.fillText(str, d * .5, d); }
  ctx.strokeStyle = ink.out; ctx.lineWidth = size * .3; ctx.strokeText(str, 0, 0);
  ctx.strokeStyle = ink.in; ctx.lineWidth = size * .14; ctx.strokeText(str, 0, 0);
  const g = ctx.createLinearGradient(0, -size * .5, 0, size * .5); g.addColorStop(0, ink.top); g.addColorStop(.55, ink.bot); g.addColorStop(1, ink.bot); ctx.fillStyle = g; ctx.fillText(str, 0, 0);
  ctx.globalAlpha = .55; ctx.fillStyle = '#fff'; ctx.save(); ctx.beginPath(); ctx.rect(-4000, -size * .5, 8000, size * .22); ctx.clip(); ctx.fillText(str, 0, 0); ctx.restore();
  ctx.restore();
}
// 一行花字逐字弹出：每个字从下方弹起、带一点旋转
function popLine(ctx, str, cx, y, size, ink, u, t0 = 0, o = {}) {
  const chars = [...String(str ?? '')]; ctx.font = `${o.weight || 900} ${size}px ${o.font || FUN}`; const ws = chars.map(c => ctx.measureText(c).width * (o.track || 1.02)), tot = ws.reduce((a, b) => a + b, 0);
  let x = o.align === 'left' ? cx : cx - tot / 2;
  chars.forEach((c, i) => { const k = spring(u - t0 - i * (o.stagger ?? .06), 3.2, .38); if (k > 0.001) { ctx.save(); ctx.translate(x + ws[i] / 2, y + (1 - k) * size * .7); ctx.scale(k, k);
    fancy(ctx, c, 0, Math.sin((o.t || 0) * 5 + i) * (o.bob ?? 4), size, ink, { ...o, rot: (o.tilt ?? .05) * (i % 2 ? 1 : -1) }); ctx.restore(); } x += ws[i]; });
  return tot;
}
function fitSize(ctx, str, size, maxW, font = FUN) { ctx.font = `900 ${size}px ${font}`; const w = ctx.measureText(str).width; return w > maxW ? size * maxW / w : size; }

// ---------- 背景 ----------
function patternBG(ctx, i, t, seed) { const [a, b] = BGS[(seed + i) % BGS.length], kind = (seed + i * 3) % 3; ctx.fillStyle = a; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.fillStyle = b; ctx.globalAlpha = .55;
  if (kind === 0) { ctx.translate(540, 960); ctx.rotate(t * .25); for (let k = 0; k < 18; k++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 2400, k / 18 * Math.PI * 2, (k + .5) / 18 * Math.PI * 2); ctx.fill(); } }
  else if (kind === 1) { ctx.translate(-((t * 80) % 160), 0); for (let x = -2000; x < 3000; x += 160) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 80, 0); ctx.lineTo(x + 80 - 1100, 1920); ctx.lineTo(x - 1100, 1920); ctx.fill(); } }
  else { for (let y = 0; y < H + 80; y += 90) for (let x = (y / 90 % 2) * 45; x < W + 80; x += 90) { ctx.beginPath(); ctx.arc(x, y + (t * 30) % 90, 18, 0, Math.PI * 2); ctx.fill(); } }
  ctx.restore(); }
function photoBG(ctx, img, u, dur, punch) { const s = Math.max(W / img.width, H / img.height) * (1.06 + .06 * (u / dur)) * (1 + punch), w = img.width * s, h = img.height * s;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h); }

// ---------- 小部件 ----------
function starburst(ctx, x, y, r, n, c1, c2, t, k = 1) { ctx.save(); ctx.translate(x, y); ctx.rotate(t * .4); ctx.scale(k, k); ctx.lineJoin = 'round';
  const path = () => { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2, rr = i % 2 ? r * .62 : r * (1 + .08 * Math.sin(i * 2.3)); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); };
  path(); ctx.lineWidth = 26; ctx.strokeStyle = '#111'; ctx.stroke(); ctx.fillStyle = c1; ctx.fill(); ctx.scale(.72, .72); path(); ctx.fillStyle = c2; ctx.fill(); ctx.restore(); }
function speedLines(ctx, x, y, t, col = 'rgba(255,255,255,.85)') { const r = rng(Math.floor(t * 15)); ctx.save(); ctx.translate(x, y); ctx.fillStyle = col;
  for (let i = 0; i < 46; i++) { const a = r() * Math.PI * 2, r0 = 420 + r() * 200, w = .012 + r() * .02; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 2400, Math.sin(a) * 2400); ctx.lineTo(Math.cos(a - w) * r0, Math.sin(a - w) * r0); ctx.lineTo(Math.cos(a + w) * r0, Math.sin(a + w) * r0); ctx.fill(); } ctx.restore(); }
function sparkle(ctx, x, y, s, c = '#FFF7B0') { ctx.save(); ctx.translate(x, y); ctx.fillStyle = c; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = i % 2 ? s * .28 : s; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); ctx.restore(); }
function sweat(ctx, x, y, s) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#7DD3FC'; ctx.strokeStyle = '#1E3A8A'; ctx.lineWidth = s * .12; ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s * .7, 0, 0, s * .5); ctx.quadraticCurveTo(-s * .7, 0, 0, -s); ctx.fill(); ctx.stroke(); ctx.restore(); }
function pillBox(ctx, x, y, w, h, fill, edge, lw = 8) { ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fillStyle = fill; ctx.fill(); if (edge) { ctx.lineWidth = lw; ctx.strokeStyle = edge; ctx.stroke(); } }
function plainText(ctx, s, x, y, size, col, o = {}) { ctx.save(); ctx.font = `${o.weight || 800} ${size}px ${o.font || BOLD}`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.sw || size * .22; ctx.strokeText(s, x, y); } ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.restore(); }

// ---------- 花字镜头 ----------
// 返回 punch（画面放大冲击量）和 shake（抖动强度），由整片统一施加到背景上
const FX = {
  title(ctx, s, u, Z) { const t = s.text || '今天聊点干货', lines = t.length > 6 ? [t.slice(0, Math.ceil(t.length / 2)), t.slice(Math.ceil(t.length / 2))] : [t];
    lines.forEach((ln, i) => { const size = fitSize(ctx, ln, 190, 940); popLine(ctx, ln, 540, 1240 + i * size * 1.18, size, INK[Z.inks[0]], u, .15 + i * .3, { t: Z.t, track: 1.1 }); });
    if (s.sub) { const k = E.outBack(clamp((u - .9) / .35)); ctx.save(); ctx.translate(540, 1240 + lines.length * 210 + 20); ctx.scale(k, k); ctx.font = `800 54px ${BOLD}`; const w = ctx.measureText(s.sub).width + 80; pillBox(ctx, -w / 2, -48, w, 96, '#111', '#fff', 6); plainText(ctx, s.sub, 0, 2, 54, '#FFE45E'); ctx.restore(); }
    for (let i = 0; i < 6; i++) { const ph = (u * 1.4 + i * .23) % 1, side = i % 2 ? 1 : -1; sparkle(ctx, 540 + side * (470 + (i % 3) * 25), 1000 + i * 70, 34 * Math.sin(ph * Math.PI)); }
    return { punch: .06 * Math.max(0, 1 - Math.abs(u - .2) / .2) }; },
  caption(ctx, s, u, Z) { const txt = s.text || '', n = Math.floor(clamp((u - .1) / Math.max(.6, txt.length * .06)) * [...txt].length), shown = [...txt].slice(0, n).join('');
    ctx.font = `900 76px ${BOLD}`; const w = Math.min(1000, ctx.measureText(txt).width + 90), k = E.outBack(clamp(u / .25));
    ctx.save(); ctx.translate(540, 1420); ctx.scale(k, k); pillBox(ctx, -w / 2, -66, w, 132, 'rgba(17,17,17,.82)'); plainText(ctx, shown, -w / 2 + 45, 4, fitSize(ctx, txt, 76, w - 90, BOLD), '#fff', { align: 'left', weight: 900 }); ctx.restore();
    if (s.sub) plainText(ctx, s.sub, 540, 1530, 46, '#FFE45E', { stroke: '#111', sw: 12, weight: 900 });
    return {}; },
  boom(ctx, s, u, Z) { const k = E.outElastic(clamp((u - .05) / .7)), txt = s.text || '震惊！'; if (u < .5) speedLines(ctx, 540, 1150, Z.t);
    starburst(ctx, 540, 1150, 380, 14, '#FFE45E', '#FF5E3A', Z.t, k); const size = fitSize(ctx, txt, 210, 860); ctx.save(); ctx.translate(540, 1150); ctx.rotate(-.08); ctx.scale(k, k); fancy(ctx, txt, 0, 0, size, INK.red, { font: BOLD, rot: 0 }); ctx.restore();
    if (s.sub) { const k2 = E.outBack(clamp((u - .6) / .3)); ctx.save(); ctx.translate(540, 1620); ctx.scale(k2, k2); plainText(ctx, s.sub, 0, 0, 74, '#fff', { stroke: '#2563EB', sw: 18, weight: 900 }); ctx.restore(); }
    for (const [x, y, d] of [[170, 820, 0], [910, 860, .1], [150, 1480, .2], [930, 1450, .15]]) { const kk = E.outBack(clamp((u - .2 - d) / .3)); if (kk > 0) { ctx.save(); ctx.translate(x, y); ctx.rotate((x < 540 ? -1 : 1) * .3); ctx.scale(kk, kk); plainText(ctx, '!', 0, 0, 130, '#FFE45E', { stroke: '#111', sw: 22, weight: 900 }); ctx.restore(); } }
    return { punch: .14 * Math.max(0, 1 - u / .25), shake: u < .35 ? 22 * (1 - u / .35) : 0 }; },
  warn(ctx, s, u, Z) { const slide = E.outC(clamp(u / .45)); for (const [y, dir, rot] of [[1030, 1, -.12], [1260, -1, .1]]) { ctx.save(); ctx.translate(540, y); ctx.rotate(rot); ctx.translate((1 - slide) * 1400 * dir, 0);
      ctx.fillStyle = '#111'; ctx.fillRect(-900, -64, 1800, 128); ctx.save(); ctx.beginPath(); ctx.rect(-900, -52, 1800, 104); ctx.clip(); ctx.fillStyle = '#FFD60A';
      for (let x = -900 - ((Z.t * 200 * dir) % 120 + 120) % 120; x < 900; x += 120) { ctx.beginPath(); ctx.moveTo(x, -52); ctx.lineTo(x + 60, -52); ctx.lineTo(x + 20, 52); ctx.lineTo(x - 40, 52); ctx.fill(); } ctx.restore(); ctx.restore(); }
    const txt = s.text || '前方高能', k = E.outBack(clamp((u - .35) / .35)); ctx.save(); ctx.translate(540, 1145); ctx.scale(k, k); ctx.font = `900 120px ${BOLD}`; const w = Math.min(1000, ctx.measureText(txt).width + 200);
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(-w / 2, -95, w, 190, 26); ctx.fill(); ctx.strokeStyle = '#FFD60A'; ctx.lineWidth = 12; ctx.stroke();
    ctx.fillStyle = '#FFD60A'; ctx.beginPath(); ctx.moveTo(-w / 2 + 60, 40); ctx.lineTo(-w / 2 + 110, -50); ctx.lineTo(-w / 2 + 160, 40); ctx.fill(); plainText(ctx, '!', -w / 2 + 110, 12, 70, '#111', { weight: 900 });
    plainText(ctx, txt, 50, 6, fitSize(ctx, txt, 120, w - 220, BOLD), '#FFD60A', { weight: 900 }); ctx.restore();
    const blink = Math.floor(u * 4) % 2 === 0 && u > .5; if (blink) { ctx.fillStyle = 'rgba(255,40,40,.16)'; ctx.fillRect(0, 0, W, H); }
    return { shake: u > .35 && u < .55 ? 10 : 0 }; },
  whisper(ctx, s, u, Z) { const k = E.outBack(clamp(u / .4)), txt = s.text || '（小声）'; ctx.save(); ctx.translate(110, 700); ctx.rotate(-.06); ctx.scale(k, k);
    plainText(ctx, s.paren || '（小声）', 0, 0, 72, '#fff', { align: 'left', font: HAND, stroke: '#111', sw: 16, weight: 400 });
    const lines = txt.length > 8 ? [txt.slice(0, 8), txt.slice(8, 16)] : [txt]; lines.forEach((l, i) => plainText(ctx, l, 20, 120 + i * 118, fitSize(ctx, l, 104, 860, HAND), '#fff', { align: 'left', font: HAND, stroke: '#111', sw: 20, weight: 400 }));
    ctx.restore(); sweat(ctx, 900 + Math.sin(Z.t * 3) * 6, 640 + (u * 60) % 40, 60); return {}; },
  vertical(ctx, s, u, Z) { const chars = [...String(s.text || '空气突然安静')].slice(0, 7), size = Math.min(170, 1240 / chars.length), x = s.side === 'right' ? 880 : 200;
    chars.forEach((c, i) => { const k = E.outBounce(clamp((u - .1 - i * .12) / .45)); if (k <= 0) return; ctx.save(); ctx.translate(x + [0, 12, -8, 10, -6, 8, 0][i], lerp(-200, 420 + i * size * 1.05, k)); fancy(ctx, c, 0, 0, size, INK[Z.inks[1]], { rot: [-.08, .05, -.03, .06, -.05, .04, 0][i] }); ctx.restore(); });
    if (s.sub) { const k = E.outC(clamp((u - 1) / .4)); ctx.globalAlpha = k; plainText(ctx, s.sub, s.side === 'right' ? 420 : 660, 1500, 60, '#fff', { stroke: '#111', sw: 14, font: HAND, weight: 400 }); ctx.globalAlpha = 1; }
    return { dim: .25 * E.outC(clamp(u / .5)) }; },
  tag(ctx, s, u, Z) { const k = E.outBack(clamp((u - .1) / .4)), name = s.text || '本期嘉宾', role = s.sub || ''; ctx.save(); ctx.translate(540, 1230); ctx.rotate(-.04); ctx.scale(k, k);
    if (s.label !== '') { ctx.font = `900 50px ${BOLD}`; const lw = ctx.measureText(s.label || '本期主角').width + 56; pillBox(ctx, -lw / 2 - 160, -220, lw, 80, '#FF4FA0', '#fff', 6); plainText(ctx, s.label || '本期主角', -160, -178, 50, '#fff', { weight: 900 }); }
    fancy(ctx, name, 0, -40, fitSize(ctx, name, 180, 900), INK[Z.inks[2]]); if (role) { const fs = fitSize(ctx, role, 54, 860, BOLD); ctx.font = `900 ${fs}px ${BOLD}`; const rw = ctx.measureText(role).width + 70; pillBox(ctx, -rw / 2, 80, rw, 90, '#FFE45E', '#111', 6); plainText(ctx, role, 0, 126, fs, '#111', { weight: 900 }); }
    ctx.restore();
    const ak = E.outC(clamp((u - .5) / .3)); ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.setLineDash([2, 28]); ctx.beginPath(); ctx.moveTo(560, 1100); ctx.quadraticCurveTo(700, 900, lerp(560, 760, ak), lerp(1100, 820, ak)); ctx.stroke(); ctx.restore(); return {}; },
  meter(ctx, s, u, Z) { const k = E.outBack(clamp(u / .4)), cx = 540, cy = 1180, R = 330; ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(0, 0, R, Math.PI, 0); ctx.lineTo(R, 60); ctx.lineTo(-R, 60); ctx.closePath(); ctx.fill(); ctx.stroke();
    const segs = ['#22C55E', '#FACC15', '#F97316', '#EF4444']; segs.forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 56; ctx.beginPath(); ctx.arc(0, 0, R - 70, Math.PI + i * Math.PI / 4 + .02, Math.PI + (i + 1) * Math.PI / 4 - .02); ctx.stroke(); });
    plainText(ctx, s.low || '正常', -R + 110, 20, 44, '#111', { weight: 900 }); plainText(ctx, s.high || '爆表', R - 110, 20, 44, '#EF4444', { weight: 900 });
    const v = s.value != null ? clamp(+s.value / 100) : 1.08, sw = u < .5 ? 0 : u < 1.4 ? E.outElastic(clamp((u - .5) / .9)) * v : v + Math.sin(u * 30) * .02, a = Math.PI + Math.PI * Math.min(1.08, sw);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * (R - 40), Math.sin(a) * (R - 40)); ctx.stroke(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    const title = s.text || '检测中'; plainText(ctx, title, cx, cy - R - 90, 80, '#fff', { stroke: '#111', sw: 18, weight: 900 });
    if (u > 1.3 && s.boom !== '') { const kb = E.outElastic(clamp((u - 1.3) / .6)); ctx.save(); ctx.translate(560, 1430); ctx.rotate(-.1); ctx.scale(kb, kb); fancy(ctx, s.boom || '爆表！', 0, 0, fitSize(ctx, s.boom || '爆表！', 150, 860, BOLD), INK.red, { font: BOLD }); ctx.restore(); }
    return { shake: u > 1.3 && u < 1.5 ? 12 : 0 }; },
  stamp(ctx, s, u, Z) { const k = u < .12 ? lerp(3, 1, u / .12) : 1, a = clamp(u / .08), r = 230; if (u > .12 && u < .3) { ctx.fillStyle = `rgba(255,255,255,${.5 * (1 - (u - .12) / .18)})`; ctx.fillRect(0, 0, W, H); }
    ctx.save(); ctx.translate(540, 1150); ctx.rotate(-.18); ctx.scale(k, k); ctx.globalAlpha = a; ctx.strokeStyle = '#E11D48'; ctx.fillStyle = '#E11D48'; ctx.lineWidth = 22; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, r - 34, 0, Math.PI * 2); ctx.stroke();
    const top = String(s.text || '认证').slice(0, 4), bot = String(s.sub || '').slice(0, 10); plainText(ctx, top, 0, bot ? -10 : 10, top.length > 2 ? 110 : 150, '#E11D48', { weight: 900 });
    if (bot) plainText(ctx, bot, 0, 110, 44, '#E11D48', { weight: 900 }); for (const sx of [-1, 1]) sparkle(ctx, sx * 150, -120, 22, '#E11D48');
    // 斑驳的印泥：用背景色挖几个小洞
    const rr = rng(3); ctx.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 60; i++) { ctx.beginPath(); ctx.arc((rr() - .5) * 2 * r, (rr() - .5) * 2 * r, rr() * 7, 0, Math.PI * 2); ctx.fill(); } ctx.restore();
    return { punch: .05 * Math.max(0, 1 - Math.abs(u - .12) / .12), shake: u > .1 && u < .25 ? 14 : 0 }; },
  bye(ctx, s, u, Z) { const t = s.text || '下期见～'; popLine(ctx, t, 540, 1150, fitSize(ctx, t, 190, 960), INK[Z.inks[3]], u, .1, { t: Z.t, stagger: .1 });
    const k = E.outBack(clamp((u - .8) / .35)); ctx.save(); ctx.translate(540, 1400); ctx.scale(k, k); const lab = s.sub || '点个关注不迷路'; ctx.font = `900 60px ${BOLD}`; const w = ctx.measureText(lab).width + 150;
    pillBox(ctx, -w / 2, -64, w, 128, '#FF2D55', '#fff', 10); plainText(ctx, '+', -w / 2 + 62, 2, 72, '#fff', { weight: 900 }); plainText(ctx, lab, 30, 4, 60, '#fff', { weight: 900 }); ctx.restore();
    for (let i = 0; i < 12; i++) { const ph = (u * .8 + i / 12) % 1, x = 540 + Math.sin(i * 2.1) * 380, y = 1700 - ph * 900; ctx.globalAlpha = Math.sin(ph * Math.PI); heart(ctx, x + Math.sin(ph * 6 + i) * 30, y, 34 + (i % 3) * 10, ['#FF2D55', '#FF7AB6', '#FFD60A'][i % 3]); ctx.globalAlpha = 1; }
    return {}; },
};
function heart(ctx, x, y, s, c) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, s * .4); ctx.bezierCurveTo(-s, -s * .2, -s * .5, -s, 0, -s * .4); ctx.bezierCurveTo(s * .5, -s, s, -s * .2, 0, s * .4); ctx.fill(); ctx.restore(); }

// ---------- 整片 ----------
export async function buildFilm(spec, out) {
  const tl = timeline(spec.shots || [], 1.2, 8), seed = hashStr(JSON.stringify(spec)) % 997, ctx = out.getContext('2d');
  const imgs = await Promise.all(tl.shots.map(s => loadImage(imageURL(s.image))));
  const inkNames = Object.keys(INK), inks = [0, 1, 2, 3].map(i => inkNames[(seed + i) % inkNames.length]);
  const showName = spec.show || '', ep = spec.ep || '';
  function render(t) {
    const s = shotAt(tl, t), u = t - s.t0, img = imgs[s.i] || (s.image ? null : null);
    // 先算一遍花字拿到冲击量（画在离屏上不划算，所以用镜头内时间直接估）
    const fx = FX[s.type] || FX.caption;
    ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const probe = { punch: 0, shake: 0, dim: 0 }; const tmp = PROBE(s, u); Object.assign(probe, tmp);
    const sh = probe.shake ? [(hashStr(String(Math.floor(t * 30))) % 100 / 50 - 1) * probe.shake, (hashStr('y' + Math.floor(t * 30)) % 100 / 50 - 1) * probe.shake] : [0, 0];
    ctx.translate(sh[0], sh[1]);
    if (img) photoBG(ctx, img, u, s.dur, probe.punch || 0); else patternBG(ctx, s.i, t, seed);
    if (img) { const g = ctx.createLinearGradient(0, H * .45, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    if (probe.dim) { ctx.fillStyle = `rgba(0,0,0,${probe.dim})`; ctx.fillRect(0, 0, W, H); }
    fx(ctx, s, u, { t, inks, seed });
    ctx.restore();
    // 栏目角标（全程）
    if (showName) { ctx.save(); ctx.translate(70, 250); ctx.font = `900 50px ${BOLD}`; const w = ctx.measureText(showName).width + 60; pillBox(ctx, 0, -42, w, 84, '#FFE45E', '#111', 7); plainText(ctx, showName, w / 2, 2, 50, '#111', { weight: 900 });
      if (ep) { ctx.font = `900 34px ${BOLD}`; const ew = ctx.measureText(ep).width + 34; ctx.rotate(.06); pillBox(ctx, w + 10, -30, ew, 56, '#FF4FA0', '#fff', 5); plainText(ctx, ep, w + 10 + ew / 2, -1, 34, '#fff', { weight: 900 }); } ctx.restore(); }
    // 转场：每个镜头开头 0.15 秒白闪
    if (s.i > 0 && u < .15) { ctx.fillStyle = `rgba(255,255,255,${.85 * (1 - u / .15)})`; ctx.fillRect(0, 0, W, H); }
  }
  function PROBE(s, u) { const k = s.type; if (k === 'boom') return { punch: .14 * Math.max(0, 1 - u / .25), shake: u < .35 ? 22 * (1 - u / .35) : 0 }; if (k === 'title') return { punch: .06 * Math.max(0, 1 - Math.abs(u - .2) / .2) };
    if (k === 'warn') return { shake: u > .35 && u < .55 ? 10 : 0 }; if (k === 'meter') return { shake: u > 1.3 && u < 1.5 ? 12 : 0 }; if (k === 'stamp') return { punch: .05 * Math.max(0, 1 - Math.abs(u - .12) / .12), shake: u > .1 && u < .25 ? 14 : 0 };
    if (k === 'vertical') return { dim: .25 * E.outC(clamp(u / .5)) }; return {}; }
  return { duration: tl.duration, render, audio: () => varietyTrack(tl, seed), info: { shots: tl.shots.length } };
}

// ---------- 配乐：轻快的综艺垫乐（尤克里里感的拨弦 + 拍手），每种花字配一个音效 ----------
function varietyTrack(tl, seed) {
  const r = rng(seed), bpm = 124, beat = 60 / bpm, m = new Mix(tl.duration + .5), root = [62, 64, 60][seed % 3];
  const prog = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], bars = Math.ceil(tl.duration / (beat * 4));
  for (let b = 0; b < bars; b++) { const ch = prog[b % 4], t0 = b * 4 * beat;
    for (let i = 0; i < 8; i++) { const n = ch[[0, 1, 2, 1, 0, 2, 1, 2][i]]; m.tone(t0 + i * beat / 2, .18, noteHz(root + n), { wave: 'tri', vol: .14, pan: -.2, env: [.002, .14, .1, .08] }); }
    for (let i = 0; i < 4; i++) m.tone(t0 + i * beat, beat * .5, noteHz(root - 24 + ch[0] + (i % 2 ? 7 : 0)), { wave: 'sine', vol: .32, env: [.005, .1, .5, .05] });
    for (let i = 0; i < 4; i++) { m.tone(t0 + i * beat, .1, 80, { wave: 'sine', vol: .4, slide: -.5, env: [.001, .09, .1, .02] }); if (i % 2) { m.tone(t0 + i * beat, .09, 1500, { wave: 'noise', vol: .16 }); m.tone(t0 + i * beat + .012, .07, 2100, { wave: 'noise', vol: .1 }); } }
    if (b % 2 === 0) for (let i = 0; i < 4; i++) if (r() > .3) m.tone(t0 + i * beat + beat / 2, .25, noteHz(root + 24 + ch[i % 3]), { wave: 'sine', vol: .07, pan: .3, env: [.002, .25, .05, .1] });
  }
  for (const s of tl.shots) { const T = s.t0;
    if (s.i > 0) m.tone(T, .12, 2600, { wave: 'noise', vol: .15, slide: -.6 });
    if (s.type === 'boom') { m.tone(T + .05, .5, 70, { wave: 'sine', vol: .7, slide: -.7 }); m.tone(T + .05, .4, 600, { wave: 'noise', vol: .35, slide: -.8 }); }
    if (s.type === 'title') [0, 4, 7, 12].forEach((n, i) => m.tone(T + .15 + i * .06, .14, noteHz(root + 12 + n), { wave: 'square', vol: .08 }));
    if (s.type === 'warn') for (let i = 0; i < 4; i++) m.tone(T + .35 + i * .25, .12, i % 2 ? 660 : 880, { wave: 'square', vol: .08 });
    if (s.type === 'whisper') m.tone(T + .1, .5, 300, { wave: 'sine', vol: .12, slide: 1.2 });
    if (s.type === 'vertical') for (let i = 0; i < [...String(s.text || '')].length; i++) m.tone(T + .25 + i * .12, .08, noteHz(root + 12 + i * 2), { wave: 'sine', vol: .14 });
    if (s.type === 'meter') { m.tone(T + .5, .9, 200, { wave: 'saw', vol: .05, slide: 3 }); m.tone(T + 1.3, .4, 900, { wave: 'square', vol: .08, vib: .2 }); }
    if (s.type === 'stamp') { m.tone(T + .12, .25, 90, { wave: 'sine', vol: .6, slide: -.5 }); m.tone(T + .12, .12, 3000, { wave: 'noise', vol: .2 }); }
    if (s.type === 'bye') [12, 16, 19, 24].forEach((n, i) => m.tone(T + .1 + i * .1, .2, noteHz(root + n), { wave: 'tri', vol: .14 }));
    if (s.type === 'tag') m.tone(T + .1, .2, noteHz(root + 19), { wave: 'sine', vol: .12, slide: .5 });
  }
  m.echo(.17, .25, .2); return m.master();
}
