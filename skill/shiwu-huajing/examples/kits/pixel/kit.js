// 十五画境·创作版 —— 像素风零件库
// 画面原理：320×180 的小画布逐像素画，再整数放大 6 倍到 1920×1080（不做平滑），所以每个点都是方块。
// 镜头类型：title 标题 / run 奔跑 / dialog 对话 / boss 打怪 / items 顶砖块 / levelup 升级 / chest 开宝箱 / ending 通关
import { clamp, lerp, inv, E, hashStr, rng, timeline, shotAt, Mix, noteHz } from '../../lib/core.js';
import { PAL, HERO, SLIME, BOSS, QBLOCK, COIN, CHEST, FLAG, HEART, STAR, SPARK, SAGE, flipX } from './sprites.js';

export const W = 240, H = 135, K = 8, GY = 114;   // 地面高度
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
const bay = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

// 一天里的四种天色（上→下），按剧情进度换
const SKY = {
  day: { sky: [5, 4, 3], far: 22, farD: 21, hill: 15, hillD: 14, tree: 14, treeD: 13, cloud: 6 },
  gold: { sky: [12, 11, 10], far: 19, farD: 18, hill: 15, hillD: 14, tree: 14, treeD: 13, cloud: 12 },
  dusk: { sky: [24, 23, 25], far: 25, farD: 7, hill: 14, hillD: 13, tree: 13, treeD: 7, cloud: 24 },
  night: { sky: [2, 1, 0], far: 1, farD: 0, hill: 13, hillD: 7, tree: 7, treeD: 0, cloud: 2 },
};
const TOD = ['day', 'day', 'gold', 'gold', 'dusk', 'dusk', 'night', 'night'];

// ---------- 像素字（把字体渲染成 1 位遮罩，保证边缘是硬的） ----------
const gcache = new Map();
function glyph(ch, latin) {
  const key = (latin ? 'L' : 'C') + ch; if (gcache.has(key)) return gcache.get(key);
  const size = latin ? 8 : 12, c = document.createElement('canvas'); c.width = size * 2; c.height = size + 4; const x = c.getContext('2d');
  x.font = latin ? '8px "Press Start 2P"' : '12px "Fusion Pixel 12"'; x.textBaseline = 'top'; x.fillStyle = '#fff'; x.fillText(ch, 0, latin ? 1 : 0);
  const d = x.getImageData(0, 0, c.width, c.height).data, m = []; let w = 0;
  for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) if (d[(j * c.width + i) * 4 + 3] > 110) { m.push([i, j]); w = Math.max(w, i + 1); }
  const adv = ch === ' ' ? (latin ? 8 : 6) : Math.max(Math.round(x.measureText(ch).width), w);
  const g = { m, adv, h: size }; gcache.set(key, g); return g;
}
const isLatin = s => /^[\x20-\x7e]*$/.test(s);
export function textW(s, o = {}) { const L = o.latin ?? isLatin(s), sc = o.scale || 1, sp = o.spacing ?? (L ? 0 : 1); let w = 0; for (const ch of s) w += (glyph(ch, L).adv + sp) * sc; return Math.max(0, w - sp * sc); }
// 画一行像素字：col 字色，sh 阴影色，ol 描边色，n 只画前 n 个字（打字机效果）
export function text(ctx, s, x, y, col, o = {}) {
  s = String(s ?? ''); const L = o.latin ?? isLatin(s), sc = o.scale || 1, sp = o.spacing ?? (L ? 0 : 1), n = o.n ?? Infinity;
  if (o.align === 'center') x = Math.round(x - textW(s, o) / 2); else if (o.align === 'right') x = Math.round(x - textW(s, o));
  let cx = x, i = 0;
  const pass = (dx, dy, c, chars) => { let px = x; let k = 0; for (const ch of s) { if (k++ >= n) break; const g = glyph(ch, L); ctx.fillStyle = typeof c === 'function' ? c(0) : PAL[c];
      for (const [gx, gy] of g.m) { if (typeof c === 'function') ctx.fillStyle = PAL[c(gy / g.h)]; ctx.fillRect(px + gx * sc + dx, y + gy * sc + dy, sc, sc); } px += (g.adv + sp) * sc; } };
  if (o.ol != null) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) pass(dx, dy, o.ol);
  if (o.sh != null) pass(o.shd ?? 1, o.shd ?? 1, o.sh);
  pass(0, 0, col);
  return textW(s, o);
}
// 按宽度把一句话切成多行（中文按字，英文按词）
export function wrap(s, maxW, o = {}) {
  s = String(s ?? ''); const out = []; let line = '';
  for (const ch of s) { if (textW(line + ch, o) > maxW && line) { out.push(line); line = ch.trim() ? ch : ''; } else line += ch; }
  if (line) out.push(line); return out;
}

// ---------- 背景（按种子生成，每支片的山和树都不一样） ----------
function makeWorld(seed) {
  const r = rng(seed), far = [], hills = [], trees = [], clouds = [], props = [];
  for (let i = 0; i < 80; i++) far.push(26 + r() * 34);
  for (let i = 0; i < 60; i++) hills.push(12 + r() * 18);
  for (let i = 0; i < 70; i++) trees.push({ x: i * 26 + r() * 16, h: 10 + Math.floor(r() * 10), kind: r() < .5 ? 0 : 1 });
  for (let i = 0; i < 14; i++) clouds.push({ x: r() * 900, y: 10 + r() * 46, w: 14 + Math.floor(r() * 16) });
  for (let i = 0; i < 90; i++) props.push({ x: i * 34 + r() * 20, k: Math.floor(r() * 4) });
  return { far, hills, trees, clouds, props };
}
function ramp(ctx, cols, y0, y1, t) {   // 抖动渐变：上→下三色
  for (let y = y0; y < y1; y++) { const u = (y - y0) / (y1 - y0) * (cols.length - 1), i = Math.min(cols.length - 2, Math.floor(u)), f = u - i;
    for (let x = 0; x < W; x++) { ctx.fillStyle = PAL[f > bay(x, y) ? cols[i + 1] : cols[i]]; ctx.fillRect(x, y, 1, 1); } }
}
function rampFast(ctx, cols, y0, y1) {   // 预渲染后复用
  const key = cols.join() + y0 + '-' + y1; if (!rampFast.c) rampFast.c = new Map();
  if (!rampFast.c.has(key)) { const c = document.createElement('canvas'); c.width = W; c.height = H; ramp(c.getContext('2d'), cols, y0, y1); rampFast.c.set(key, c); }
  ctx.drawImage(rampFast.c.get(key), 0, 0);
}
function drawBG(ctx, world, scroll, todName, t, mood) {
  const T = SKY[todName];
  rampFast(ctx, T.sky, 0, GY);
  // 日月星
  if (todName === 'night') { const r = rng(7); for (let i = 0; i < 46; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * 80), tw = Math.sin(t * 3 + i * 1.7) > .55; ctx.fillStyle = PAL[tw ? 6 : 22]; ctx.fillRect(x, y, 1, 1); }
    disc(ctx, 196, 26, 9, 12); disc(ctx, 199, 23, 7, 1); }
  else if (todName === 'gold') disc(ctx, 186, 74, 17, 12, 11);
  else if (todName === 'dusk') disc(ctx, 172, 100, 20, 10, 26);
  else disc(ctx, 200, 22, 8, 12, 6);
  // 云
  for (const c of world.clouds) { const x = Math.floor(((c.x - scroll * .15 - t * 4) % 900 + 900) % 900) - 60; cloud(ctx, x, Math.floor(c.y * .7), c.w, T.cloud); }
  // 远山（视差 0.2）
  const fo = scroll * .2;
  for (let x = 0; x < W; x++) { const u = (x + fo) / 16, i = Math.floor(u), f = u - i, a = world.far[i % 80], b = world.far[(i + 1) % 80], h = Math.round(lerp(a, b, f * f * (3 - 2 * f)));
    const top = 92 - Math.round(h * .75), slope = b - a; ctx.fillStyle = PAL[T.far]; ctx.fillRect(x, top, 1, GY - top);
    if (slope < 0) { ctx.fillStyle = PAL[T.farD]; for (let y = top; y < GY; y++) if (bay(x, y) < .55) ctx.fillRect(x, y, 1, 1); }
    if (h > 46 && todName !== 'night') { ctx.fillStyle = PAL[6]; ctx.fillRect(x, top, 1, 2 + (h % 2)); } }
  // 丘陵（视差 0.45）
  const ho = scroll * .45;
  for (let x = 0; x < W; x++) { const u = (x + ho) / 24, i = Math.floor(u), f = u - i, a = world.hills[i % 60], b = world.hills[(i + 1) % 60], h = Math.round(lerp(a, b, (1 - Math.cos(f * Math.PI)) / 2));
    const top = GY - 6 - Math.round(h * .8); ctx.fillStyle = PAL[T.hill]; ctx.fillRect(x, top, 1, GY - top); ctx.fillStyle = PAL[T.hillD]; ctx.fillRect(x, top + 3, 1, 1); }
  // 树（视差 0.7）
  const to = scroll * .7;
  for (const tr of world.trees) { const x = Math.floor(((tr.x - to) % 1820 + 1820) % 1820) - 20; if (x < -12 || x > W + 4) continue; tree(ctx, x, GY - 2, tr.h, tr.kind, T); }
}
function disc(ctx, cx, cy, r, c1, c2) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = x * x + y * y; if (d <= r * r) { ctx.fillStyle = PAL[c2 != null && y > r * .25 && (x + y) % 2 === 0 ? c2 : c1]; ctx.fillRect(cx + x, cy + y, 1, 1); } } }
function cloud(ctx, x, y, w, c) { ctx.fillStyle = PAL[c]; ctx.fillRect(x + 3, y, w - 6, 1); ctx.fillRect(x + 1, y + 1, w - 2, 1); ctx.fillRect(x, y + 2, w, 3); ctx.fillRect(x + 4, y - 2, Math.floor(w / 3), 2); ctx.fillRect(x + Math.floor(w / 2), y - 3, Math.floor(w / 4), 3); }
function tree(ctx, x, base, h, kind, T) {
  ctx.fillStyle = PAL[17]; ctx.fillRect(x + 4, base - 5, 2, 5);
  if (kind === 0) { for (let j = 0; j < h; j++) { const w = Math.round((j / h) * 9) | 1, xx = x + 5 - (w >> 1); ctx.fillStyle = PAL[j % 3 === 0 ? T.treeD : T.tree]; ctx.fillRect(xx, base - 5 - h + j, w, 1); } }
  else { for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) if (i * i + j * j <= 25) { ctx.fillStyle = PAL[(i + j) > 2 ? T.treeD : T.tree]; ctx.fillRect(x + 5 + i, base - 10 - h / 2 + j, 1, 1); } }
}
function drawGround(ctx, scroll, todName) {
  const night = todName === 'night', o = Math.floor(scroll) % 16;
  ctx.fillStyle = PAL[night ? 14 : 16]; ctx.fillRect(0, GY, W, 2); ctx.fillStyle = PAL[night ? 13 : 15]; ctx.fillRect(0, GY + 2, W, 2);
  for (let x = -o; x < W; x += 16) { ctx.fillStyle = PAL[night ? 13 : 14]; ctx.fillRect(x + 3, GY - 1, 1, 1); ctx.fillRect(x + 11, GY - 1, 2, 1); }
  for (let y = GY + 4; y < H; y += 8) for (let x = -o - ((y / 8) % 2) * 8; x < W; x += 16) {
    ctx.fillStyle = PAL[night ? 17 : 18]; ctx.fillRect(x, y, 16, 8); ctx.fillStyle = PAL[night ? 7 : 17]; ctx.fillRect(x, y + 7, 16, 1); ctx.fillRect(x + 15, y, 1, 8);
    ctx.fillStyle = PAL[night ? 18 : 19]; ctx.fillRect(x + 2, y + 2, 2, 1); ctx.fillRect(x + 9, y + 4, 1, 1); }
}

// ---------- 主角与小部件 ----------
function hero(ctx, x, y, pose, flip) { const s = HERO[pose] || HERO.stand; ctx.drawImage(flip ? flipX(s) : s, Math.round(x - s.width / 2), Math.round(y - s.height)); }
const runPose = t => ['run1', 'run2', 'run3', 'run2'][Math.floor(t * 12) % 4];
function box(ctx, x, y, w, h, fill = 1, edge = 6, edge2 = 22) {   // 对话框：两层边框 + 内阴影
  ctx.fillStyle = PAL[0]; ctx.fillRect(x - 1, y - 1, w + 2, h + 2); ctx.fillStyle = PAL[edge]; ctx.fillRect(x, y, w, h); ctx.fillStyle = PAL[edge2]; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = PAL[fill]; ctx.fillRect(x + 2, y + 2, w - 4, h - 4); ctx.fillStyle = PAL[0]; ctx.fillRect(x + 2, y + h - 3, w - 4, 1);
}
function hud(ctx, info, t) {
  ctx.fillStyle = 'rgba(11,13,26,.55)'; ctx.fillRect(0, 0, W, 13);
  for (let i = 0; i < 3; i++) ctx.drawImage(HEART[i < info.hearts ? 0 : 1], 4 + i * 9, 3);
  text(ctx, info.stage, W / 2, 3, 6, { latin: true, align: 'center', sh: 0 });
  ctx.drawImage(COIN[Math.floor(t * 6) % 3], W - 46, 3); text(ctx, 'x' + String(info.coins).padStart(2, '0'), W - 36, 3, 12, { latin: true, sh: 0 });
}

// ---------- 镜头 ----------
// 每个镜头函数拿到 (ctx, s 镜头, u 镜头内秒数, F 全片状态)，在 320×180 上画前景
const SHOTS = {
  title(ctx, s, u, F) {
    const drop = E.outBounce(clamp((u - .25) / .7)), y = lerp(-40, 16, drop);
    const lines = wrap(s.text || '像素冒险', 72, {}).slice(0, 2), sc = lines.length > 1 ? 2 : 3;
    lines.forEach((ln, i) => logo(ctx, ln, W / 2, y + i * 13 * sc, sc, u));
    const sy = 18 + lines.length * 13 * sc + 6;
    if (u > 1.05 && s.sub) { const w = Math.min(226, textW(s.sub) + 16), k = E.outBack(clamp((u - 1.05) / .3)); ribbon(ctx, W / 2, sy, w * k); if (k > .95) text(ctx, s.sub, W / 2, sy + 1, 6, { align: 'center', sh: 0 }); }
    if (u > 1.6 && Math.floor(u * 2.5) % 2 === 0) text(ctx, s.press || 'PRESS START', W / 2, sy + 22, 12, { latin: true, align: 'center', sh: 0 });
    hero(ctx, W / 2, GY, u > 1.2 && Math.floor(u * 3) % 2 === 0 ? 'cheer' : 'stand');
    if (drop >= 1) sparkle(ctx, W / 2, 34, u, 60);
  },
  run(ctx, s, u, F) {
    const obs = [{ x: 170, k: 'slime' }, { x: 290, k: 'block' }], wx = F.scrollLocal;
    let jump = 0; for (const o of obs) { const sx = o.x - wx; if (sx > 30 && sx < 92) jump = Math.max(jump, Math.sin(clamp((92 - sx) / 62) * Math.PI) * 26); }
    for (const o of obs) { const sx = Math.round(o.x - wx); if (sx < -20 || sx > W + 20) continue;
      if (o.k === 'slime') ctx.drawImage(SLIME[Math.floor(u * 4) % 2], sx - 6, GY - 8); else { ctx.drawImage(QBLOCK[1], sx - 6, GY - 12); ctx.drawImage(QBLOCK[1], sx - 6, GY - 24); } }
    hero(ctx, 60, GY - jump, jump > 1 ? 'jump' : runPose(u));
    if (jump < 1 && Math.floor(u * 12) % 2 === 0) { ctx.fillStyle = PAL[22]; ctx.fillRect(51, GY - 2, 2, 1); ctx.fillRect(47, GY - 3, 1, 1); }
    banner(ctx, s.text, s.sub, u);
  },
  dialog(ctx, s, u, F) {
    hero(ctx, 64, GY, 'stand');
    const bob = Math.round(Math.sin(u * 3) * 1); ctx.drawImage(SAGE, 160, GY - 16 + bob);
    const lines = wrap(s.text || '……', 186, {}).slice(0, 3), h = 12 + lines.length * 14, y0 = 26, k = E.outBack(clamp(u / .3));
    if (k > 0) { const w = Math.round(206 * Math.min(1, k)); box(ctx, Math.round(W / 2 - w / 2), y0, w, h, 1, 6, 3); }
    if (k >= 1) {
      const name = s.speaker || '？？？', nw = textW(name) + 10; box(ctx, W / 2 - 100, y0 - 10, nw, 15, 23, 6, 24); text(ctx, name, W / 2 - 95, y0 - 8, 6, {});
      let left = Math.floor((u - .35) * 14); lines.forEach((ln, i) => { const n = clamp(left, 0, [...ln].length); left -= [...ln].length; text(ctx, ln, W / 2 - 94, y0 + 6 + i * 14, 6, { n, sh: 0 }); });
      if (left > 0 && Math.floor(u * 3) % 2 === 0) { ctx.fillStyle = PAL[12]; ctx.fillRect(W / 2 + 94, y0 + h - 8, 5, 1); ctx.fillRect(W / 2 + 95, y0 + h - 7, 3, 1); ctx.fillRect(W / 2 + 96, y0 + h - 6, 1, 1); }
      ctx.fillStyle = PAL[6]; ctx.fillRect(166, y0 + h + 2, 2, 3); ctx.fillRect(168, y0 + h + 6, 2, 2);
    }
  },
  boss(ctx, s, u, F) {
    const d = s.dur, die = d * .66, hpMax = 5, hits = Math.min(hpMax, Math.floor(clamp((u - .6) / (die - .6)) * hpMax + .001)), dead = u >= die;
    const bx = 176, by = GY - 23 + Math.round(Math.sin(u * 2.4) * 2);
    if (!dead) { const flash = hits > 0 && (u - (.6 + (hits - 1) * (die - .6) / hpMax)) < .12; ctx.globalAlpha = flash ? .4 : 1; ctx.drawImage(BOSS, bx - 10, by); ctx.globalAlpha = 1; }
    else debris(ctx, bx, by + 10, u - die);
    hero(ctx, 54, GY, u > .6 && !dead && Math.floor(u * 4) % 2 === 0 ? 'jump' : dead ? 'cheer' : 'stand');
    if (!dead) for (let i = 0; i < 6; i++) { const t0 = .6 + i * (die - .6) / 6, p = (u - t0) / .45; if (p > 0 && p < 1) ctx.drawImage(STAR, Math.round(lerp(60, bx - 6, p)), Math.round(GY - 16 - Math.sin(p * Math.PI) * 18)); }
    if (!dead || u - die < .3) { const name = s.name || 'BOSS', a = dead ? 1 - (u - die) / .3 : 1; ctx.globalAlpha = a; box(ctx, 96, 18, 136, 26, 0, 9, 8); text(ctx, name, 102, 21, 12, {});
      const hp = dead ? 0 : 1 - hits / hpMax; ctx.fillStyle = PAL[7]; ctx.fillRect(102, 36, 124, 4); ctx.fillStyle = PAL[hp > .4 ? 15 : 9]; ctx.fillRect(102, 36, Math.round(124 * hp), 4); ctx.globalAlpha = 1; }
    if (dead) { const k = E.outBack(clamp((u - die - .2) / .3)); if (k > 0) caption(ctx, s.text || 'WIN!', s.sub, k, 24); }
  },
  items(ctx, s, u, F) {
    const items = (s.items || ['?', '?', '?']).slice(0, 4), n = items.length, gap = n > 3 ? 52 : 62, x0 = W / 2 - (n - 1) * gap / 2;
    const per = (s.dur - .8) / n, BY = 64;
    let hx = 24, jump = 0, pose = 'stand';
    for (let i = 0; i < n; i++) { const t0 = .3 + i * per, x = x0 + i * gap; if (u >= t0) { const p = clamp((u - t0) / per); hx = lerp(i ? x0 + (i - 1) * gap : 24, x, clamp(p / .45)); if (p < .45) pose = runPose(u); else { const q = clamp((p - .45) / .4); jump = Math.sin(q * Math.PI) * 30; pose = jump > 1 ? 'jump' : 'stand'; } } }
    items.forEach((it, i) => { const x = x0 + i * gap, hitT = .3 + i * per + per * .45 + per * .2, hit = u >= hitT, bump = hit ? Math.max(0, Math.sin(clamp((u - hitT) / .15) * Math.PI)) * 3 : 0;
      ctx.drawImage(QBLOCK[hit ? 1 : 0], Math.round(x - 6), Math.round(BY - bump));
      if (hit) { const p = clamp((u - hitT) / .5), cy = BY - 2 - E.outC(p) * 18; if (p < 1) ctx.drawImage(COIN[Math.floor(u * 10) % 3], Math.round(x - 4), Math.round(cy - 8));
        const k = E.outBack(clamp((u - hitT - .2) / .3)); if (k > 0) { const w = textW(it) + 8; box(ctx, Math.round(x - w / 2), BY - 30 - Math.round((1 - k) * 6), w, 17, 2, 6, 4); text(ctx, it, x, BY - 28 - Math.round((1 - k) * 6), 6, { align: 'center' }); } } });
    hero(ctx, hx, GY - jump, pose);
    if (s.text) banner(ctx, s.text, s.sub, u, 15);
  },
  levelup(ctx, s, u, F) {
    for (let r = 0; r < 3; r++) { const rr = ((u * 26 + r * 12) % 36) + 4; ring(ctx, 46, GY - 10, rr, r % 2 ? 12 : 27); }
    hero(ctx, 46, GY - Math.abs(Math.sin(u * 5)) * 3, 'cheer');
    const k = E.outBack(clamp(u / .35)); if (k > 0) logo(ctx, s.text || 'LEVEL UP!', 150, 16 + (1 - k) * -30, 2, u, true);
    const stats = (s.stats || [['能力', 90]]).slice(0, 3); box(ctx, 92, 46, 142, 10 + stats.length * 22, 1, 6, 3);
    stats.forEach(([lab, v], i) => { const y = 51 + i * 22, p = E.outC(clamp((u - .5 - i * .25) / .8)), val = clamp(+v || 0, 0, 100);
      text(ctx, String(lab).slice(0, 6), 98, y, 6, {}); ctx.fillStyle = PAL[0]; ctx.fillRect(98, y + 13, 128, 5); ctx.fillStyle = PAL[1]; ctx.fillRect(99, y + 14, 126, 3);
      ctx.fillStyle = PAL[[15, 4, 26][i]]; ctx.fillRect(99, y + 14, Math.round(126 * val / 100 * p), 3); text(ctx, Math.round(val * p) + '', 226, y + 2, 12, { latin: true, align: 'right' }); });
  },
  chest(ctx, s, u, F) {
    const open = u > .9, cx = W / 2;
    hero(ctx, Math.min(cx - 26, lerp(16, cx - 26, clamp(u / .7))), GY, u < .7 ? runPose(u) : open ? 'cheer' : 'stand');
    if (open) rays(ctx, cx, GY - 12, u - .9);
    ctx.drawImage(open ? CHEST.open : CHEST.closed, cx - 8, GY - 12);
    if (open) { const p = E.outC(clamp((u - .9) / .7)); ctx.drawImage(STAR, cx - 3, Math.round(GY - 16 - p * 40)); sparkle(ctx, cx, GY - 56, u, 22); }
    if (u > 1.5) caption(ctx, s.text, s.sub, E.outBack(clamp((u - 1.5) / .35)), 18);
  },
  ending(ctx, s, u, F) {
    const fx = 196; ctx.fillStyle = PAL[22]; ctx.fillRect(fx, 40, 2, GY - 40); ctx.fillStyle = PAL[12]; ctx.fillRect(fx - 1, 36, 4, 4);
    const fp = clamp((u - .9) / .9); ctx.drawImage(FLAG, fx + 2, Math.round(lerp(42, GY - 14, 1 - fp)));
    let x, y, pose; if (u < .6) { x = lerp(24, fx - 22, u / .6); y = GY; pose = runPose(u); } else if (u < .9) { const q = (u - .6) / .3; x = lerp(fx - 22, fx - 6, q); y = GY - Math.sin(q * Math.PI / 2) * 56; pose = 'jump'; }
    else if (u < 1.8) { x = fx - 6; y = lerp(GY - 56, GY, E.inQ(clamp((u - .9) / .9))); pose = 'jump'; } else { x = fx - 16; y = GY - Math.abs(Math.sin((u - 1.8) * 6)) * 6; pose = 'cheer'; }
    hero(ctx, x, y, pose);
    for (let i = 0; i < 4; i++) firework(ctx, 36 + i * 44 + (i % 2) * 14, 28 + (i % 2) * 18, u - 1.1 - i * .35, [26, 12, 27, 24][i]);
    if (u > 1.2) caption(ctx, s.text || '通关', s.sub, E.outBack(clamp((u - 1.2) / .35)), 30, true, 150);
  },
};
SHOTS.coins = SHOTS.items;

// ---------- 部件 ----------
function logo(ctx, s, cx, y, sc, u, rainbow) {   // 大标题：像素字放大 + 冷色渐变 + 粉色投影 + 逐字起伏
  const L = isLatin(s), w = textW(s, { scale: sc, latin: L }); let x = Math.round(cx - w / 2), i = 0;
  for (const ch of s) { const g = glyph(ch, L), wob = Math.round(Math.sin(u * 5 + i * .8) * 1.5), yy = Math.round(y) + wob;
    const grad = rainbow ? (v => [26, 12, 27, 4][Math.floor(v * 4)] ?? 4) : (v => v < .34 ? 6 : v < .6 ? 5 : v < .82 ? 4 : 3);
    for (const [gx, gy] of g.m) { ctx.fillStyle = PAL[1]; ctx.fillRect(x + gx * sc + 1, yy + gy * sc + 2, sc + 1, sc + 1); }
    for (const [gx, gy] of g.m) { ctx.fillStyle = PAL[0]; ctx.fillRect(x + gx * sc - 1, yy + gy * sc - 1, sc + 2, sc + 2); }
    for (const [gx, gy] of g.m) { ctx.fillStyle = PAL[grad(gy / g.h)]; ctx.fillRect(x + gx * sc, yy + gy * sc, sc, sc); }
    x += (g.adv + (L ? 0 : 1)) * sc; i++; }
}
function ribbon(ctx, cx, y, w) { if (w < 6) return; const x = Math.round(cx - w / 2); box(ctx, x, y - 2, Math.round(w), 17, 3, 12, 11);
  ctx.fillStyle = PAL[12]; ctx.fillRect(x + 3, y + 5, 2, 2); ctx.fillRect(x + Math.round(w) - 5, y + 5, 2, 2); }
function banner(ctx, t, sub, u, y0 = 18) {   // 顶部飘下来的关卡字幕
  if (!t) return; const k = E.outBack(clamp((u - .15) / .35)); if (k <= 0) return;
  const lines = wrap(t, 200, {}).slice(0, 2), w = Math.min(228, Math.max(...lines.map(l => textW(l)), sub ? textW(sub) : 0) + 16), h = 6 + lines.length * 14 + (sub ? 13 : 0), y = Math.round(y0 - (1 - k) * 40);
  box(ctx, Math.round(W / 2 - w / 2), y, w, h, 1, 12, 11);
  lines.forEach((l, i) => text(ctx, l, W / 2, y + 3 + i * 14, 6, { align: 'center', sh: 0 }));
  if (sub) text(ctx, sub, W / 2, y + 3 + lines.length * 14, 22, { align: 'center' });
}
function caption(ctx, t, sub, k, y0 = 24, big, maxW) {   // 结果字幕：弹出来的大框
  if (!t || k <= 0) return; const sc = big ? 2 : 1, lines = wrap(t, maxW || (big ? 100 : 200), {}).slice(0, 2), lw = Math.max(...lines.map(l => textW(l, { scale: sc })), sub ? textW(sub) : 0);
  const w = Math.min(230, lw + 18), h = 8 + lines.length * 13 * sc + (sub ? 14 : 0), x = Math.round(W / 2 - w / 2 * Math.min(1, k)), y = y0;
  box(ctx, x, y, Math.round(w * Math.min(1, k)), h, 25, 26, 24); if (k < .9) return;
  lines.forEach((l, i) => text(ctx, l, W / 2, y + 4 + i * 13 * sc, 12, { align: 'center', scale: sc, sh: 0, shd: sc }));
  if (sub) text(ctx, sub, W / 2, y + 4 + lines.length * 13 * sc + 1, 6, { align: 'center' });
}
function sparkle(ctx, cx, cy, u, spread) { for (let i = 0; i < 5; i++) { const ph = (u * 2 + i * .37) % 1, f = Math.floor(ph * 3), s = SPARK[f]; const a = i * 2.39; ctx.drawImage(s, Math.round(cx + Math.cos(a) * spread * (.5 + (i % 3) * .25)) - 2, Math.round(cy + Math.sin(a) * spread * .4) - 2); } }
function ring(ctx, cx, cy, r, c) { ctx.fillStyle = PAL[c]; for (let a = 0; a < 64; a++) { const t = a / 64 * Math.PI * 2; if (a % 2) ctx.fillRect(Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r * .5), 1, 1); } }
function rays(ctx, cx, cy, u) { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i - 4.5) * .22, len = Math.min(96, u * 140); for (let r = 6; r < len; r++) { const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r);
  if (bay(x, y) < .55 - r / 240) { ctx.fillStyle = PAL[i % 2 ? 12 : 6]; ctx.fillRect(x, y, 1, 1); } } } }
function debris(ctx, cx, cy, u) { const r = rng(42); for (let i = 0; i < 30; i++) { const a = r() * Math.PI * 2, v = 24 + r() * 56, x = cx + Math.cos(a) * v * u, y = cy + Math.sin(a) * v * u + 50 * u * u; if (u > 1.2) break; ctx.fillStyle = PAL[[21, 22, 26, 0][i % 4]]; ctx.fillRect(Math.round(x), Math.round(y), 2, 2); }
  if (u < .25) disc(ctx, cx, cy, Math.round(5 + u * 50), 6); }
function firework(ctx, cx, cy, u, c) { if (u < 0 || u > 1.2) return; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = E.outC(clamp(u / .7)) * 18, x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r + u * u * 10);
  ctx.fillStyle = PAL[u > .8 ? 22 : c]; ctx.fillRect(x, y, 1, 1); if (u < .5) ctx.fillRect(x, y + 1, 1, 1); } }

// 转场：菱形格子从左上到右下盖住画面
function wipe(ctx, p) { if (p <= 0) return; const s = 10; ctx.fillStyle = PAL[0];
  for (let y = 0; y < H + s; y += s) for (let x = 0; x < W + s; x += s) { const d = (x + y) / (W + H), k = clamp(p * 2.2 - d * 1.2) * s * .75; if (k <= 0) continue; const cx = x + s / 2, cy = y + s / 2;
    for (let j = -Math.ceil(k); j <= Math.ceil(k); j++) { const hw = Math.max(0, Math.round(k - Math.abs(j))); if (hw > 0) ctx.fillRect(cx - hw, cy + j, hw * 2, 1); } } }

// ---------- 整片 ----------
export function buildFilm(spec, out) {
  const tl = timeline(spec.shots || [], 1.5, 8), seed = hashStr(JSON.stringify(spec)), world = makeWorld(seed);
  const low = document.createElement('canvas'); low.width = W; low.height = H; const ctx = low.getContext('2d');
  const octx = out.getContext('2d'); octx.imageSmoothingEnabled = false;
  const SPEED = { run: 56, items: 16, ending: 20, chest: 12 };
  const scrollAt = t => { let s = 0; for (const sh of tl.shots) { const v = SPEED[sh.type] ?? 8; if (t >= sh.t1) s += v * sh.dur; else { s += v * Math.max(0, t - sh.t0); break; } } return s; };
  const nItems = s => s.type === 'items' || s.type === 'coins' ? (s.items || []).length : 0;
  function render(t) {
    const s = shotAt(tl, t), u = t - s.t0, prog = s.i / Math.max(1, tl.shots.length - 1), tod = s.tod || TOD[Math.min(7, Math.floor(prog * 7.99))];
    const scroll = scrollAt(t);
    drawBG(ctx, world, scroll, tod, t); drawGround(ctx, scroll, tod);
    const F = { scrollLocal: (SPEED[s.type] ?? 8) * u };
    (SHOTS[s.type] || SHOTS.run)(ctx, s, u, F);
    if (s.type !== 'title') { let coins = 0; for (const x of tl.shots) { if (x.i < s.i) coins += nItems(x) * 10; } if (nItems(s)) coins += Math.floor(clamp(u / s.dur) * nItems(s) + .2) * 10;
      hud(ctx, { hearts: 3, stage: (spec.stage || 'STAGE') + ' 1-' + (s.i), coins }, t); }
    // 镜头切换：前 0.28 秒揭开、后 0.28 秒盖上
    if (s.i > 0 && u < .22) wipe(ctx, 1 - u / .22); if (s.i < tl.shots.length - 1 && s.dur - u < .22) wipe(ctx, 1 - (s.dur - u) / .22);
    octx.drawImage(low, 0, 0, W * K, H * K);
    // 显像管扫描线 + 暗角（只在大画布上加一层，不影响像素）
    octx.fillStyle = 'rgba(0,0,0,.10)'; for (let y = 0; y < H * K; y += K) octx.fillRect(0, y + K - 2, W * K, 2);
    if (!render.vig) { const g = octx.createRadialGradient(960, 540, 480, 960, 540, 1150); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.42)'); render.vig = g; }
    octx.fillStyle = render.vig; octx.fillRect(0, 0, W * K, H * K);
  }
  return { duration: tl.duration, render, audio: () => chiptune(tl, seed), info: { shots: tl.shots.length } };
}

// ---------- 8-bit 配乐：和弦走向 + 低音 + 琶音 + 鼓，再按镜头加音效 ----------
function chiptune(tl, seed) {
  const r = rng(seed), bpm = 132, beat = 60 / bpm, m = new Mix(tl.duration + .5);
  const keys = [60, 62, 57, 55], root = keys[Math.floor(r() * keys.length)];
  const prog = [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]];   // I vi IV V
  const bars = Math.ceil(tl.duration / (beat * 4));
  for (let b = 0; b < bars; b++) { const ch = prog[b % 4], t0 = b * 4 * beat;
    for (let i = 0; i < 8; i++) m.tone(t0 + i * beat / 2, beat * .42, noteHz(root - 24 + ch[0] + (i % 2 ? 12 : 0)), { wave: 'tri', vol: .34, env: [.002, .05, .8, .03] });
    for (let i = 0; i < 16; i++) m.tone(t0 + i * beat / 4, beat * .2, noteHz(root + 12 + ch[i % 3] + (i % 6 > 2 ? 12 : 0)), { wave: 'pulse25', vol: .06, pan: -.3, env: [.002, .04, .4, .02] });
    for (let i = 0; i < 4; i++) { m.tone(t0 + i * beat, .09, 110, { wave: 'sine', vol: .5, slide: -.6, env: [.001, .08, .1, .02] }); if (i % 2) m.tone(t0 + i * beat, .08, 2400, { wave: 'noise', vol: .16, env: [.001, .06, .1, .02] }); }
    for (let i = 0; i < 8; i++) m.tone(t0 + i * beat / 2 + beat / 4, .025, 7000, { wave: 'noise', vol: .05, pan: .3, env: [.001, .02, .1, .01] });
    // 主旋律：每两小节一句
    const mel = [0, 2, 4, 7, 4, 2, 0, -1].map(v => v + (b % 2) * 2);
    for (let i = 0; i < 4; i++) if (r() > .25) m.tone(t0 + i * beat, beat * .8, noteHz(root + 12 + ch[0] + mel[(b * 4 + i) % 8]), { wave: 'square', vol: .08, pan: .25, vib: .006, env: [.005, .1, .5, .06] });
  }
  for (const s of tl.shots) {
    const T = s.t0;
    if (s.type === 'title') [72, 76, 79, 84].forEach((n, i) => m.tone(T + .95 + i * .07, .12, noteHz(n), { wave: 'square', vol: .16 }));
    if (s.type === 'items' || s.type === 'coins') { const n = (s.items || []).length, per = (s.dur - .8) / n; for (let i = 0; i < n; i++) { const h = T + .3 + i * per + per * .65; m.tone(h, .06, noteHz(83), { wave: 'square', vol: .16 }); m.tone(h + .06, .25, noteHz(88), { wave: 'square', vol: .16 }); } }
    if (s.type === 'boss') { const die = s.dur * .66; for (let i = 0; i < 6; i++) m.tone(T + .6 + i * (die - .6) / 6, .12, 300, { wave: 'square', vol: .1, slide: 1.5 }); m.tone(T + die, .6, 900, { wave: 'noise', vol: .4, slide: -.8 }); }
    if (s.type === 'levelup') [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => m.tone(T + .1 + i * .06, .1, noteHz(n + 12), { wave: 'square', vol: .13 }));
    if (s.type === 'chest') { [67, 71, 74, 79].forEach((n, i) => m.tone(T + .9 + i * .1, .18, noteHz(n + 12), { wave: 'pulse25', vol: .16 })); }
    if (s.type === 'ending') { [72, 76, 79, 84, 79, 84].forEach((n, i) => m.tone(T + 1 + i * .13, .2, noteHz(n), { wave: 'square', vol: .15 })); }
    if (s.type === 'dialog') for (let i = 0; i < 14; i++) m.tone(T + .4 + i * .08, .025, noteHz(84 + (i % 3)), { wave: 'square', vol: .05 });
    if (s.type === 'run') [.2, .45].forEach(f => m.tone(T + s.dur * f + .5, .12, 300, { wave: 'square', vol: .08, slide: 1.2 }));
  }
  m.echo(.15, .3, .2); return m.master();
}
