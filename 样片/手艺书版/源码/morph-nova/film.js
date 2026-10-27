// 形变 · 虚构品牌「nova.」。原版语法：近黑底 + 颗粒，只有一种前景色（米白）+ 一个红色强调点；几何零件不断变形、滑动拼成字母，
// 快的时候有拖影；底部进度点；结尾小写品牌名 + 红色句点 + 几圈彩色细轨道 + 字距很大的中文标语。
// 做法：所有零件都是「沿一条中心线的粗描边（圆头）」，中心线统一重采样成 64 个点，形变就是逐点插值（点 → 线 → 圆环 → 拱 → 字母）。
import { clamp, lerp, seg, E, Mix } from './lib/core.js';
import { grain, vignette } from './lib/draw.js';

const W = 1920, H = 1080, DUR = 9, NP = 64, CY = 540;
const CREAM = '#EFE8DA', RED = '#F0442E', CN = '"PingFang SC", "Noto Sans SC", sans-serif', SANS = '"Avenir Next", "Helvetica Neue", Arial, sans-serif';
const pt = (x, y) => Array.from({ length: NP }, () => [x, y]);
const line = (x0, y0, x1, y1) => Array.from({ length: NP }, (_, i) => [lerp(x0, x1, i / (NP - 1)), lerp(y0, y1, i / (NP - 1))]);
const ring = (cx, cy, r, a0 = Math.PI) => Array.from({ length: NP }, (_, i) => [cx + Math.cos(a0 + i / (NP - 1) * Math.PI * 2) * r, cy + Math.sin(a0 + i / (NP - 1) * Math.PI * 2) * r]);
const arch = (cx, cy, r) => Array.from({ length: NP }, (_, i) => [cx + Math.cos(Math.PI + i / (NP - 1) * Math.PI) * r, cy + Math.sin(Math.PI + i / (NP - 1) * Math.PI) * r]);

// 9 个零件：0 n 左竖 / 1 n 拱 / 2 n 右竖 / 3 o 圈 / 4 v 左 / 5 v 右 / 6 a 圈 / 7 a 竖 / 8 红点
const SW = 34, X = -30;   // 线宽、整体左右微调
function stateAt(k, t) {
  const C = (x, y) => pt(x, y), o = [CREAM, CREAM, CREAM, CREAM, CREAM, CREAM, CREAM, CREAM, RED];
  if (k === 0) return { p: [C(0, CY), pt(0, CY), C(0, CY), C(0, CY), C(0, CY), C(0, CY), C(0, CY), C(0, CY), C(0, CY)], w: [0, 64, 0, 0, 0, 0, 0, 0, 0] };
  if (k === 1) return { p: [C(-220, CY), line(-220, CY, 220, CY), C(220, CY), C(0, CY), C(0, CY), C(0, CY), C(0, CY), C(0, CY), C(240, CY)], w: [0, SW, 0, 0, 0, 0, 0, 0, 0] };
  if (k === 2) { const a = t * 2.4; return { p: [C(-120, CY), ring(0, CY, 130), C(120, CY), C(0, CY), C(0, CY), C(0, CY), C(0, CY), C(0, CY), C(Math.cos(a) * 210, CY + Math.sin(a) * 210)], w: [0, SW, 0, 0, 0, 0, 0, 0, 30] }; }
  if (k === 3) { const s = 1.7; return { p: [line(-60 * s, CY - 80 * s, -60 * s, CY + 80 * s), arch(0, CY - 20 * s, 60 * s), line(60 * s, CY - 20 * s, 60 * s, CY + 80 * s), C(0, CY + 80 * s), C(0, CY + 80 * s), C(0, CY + 80 * s), C(0, CY + 80 * s), C(0, CY + 80 * s), C(150 * s, CY + 80 * s)], w: [SW * 1.4, SW * 1.4, SW * 1.4, 0, 0, 0, 0, 0, 30 * 1.4] }; }
  // 4：完整的 nova.（基线 600，x 高 440~600）
  const b = 600, top = 448;
  return { p: [line(X - 360, 458, X - 360, b), arch(X - 300, 512, 60), line(X - 240, 512, X - 240, b), ring(X - 105, 524, 64), line(X + 30, top, X + 95, b), line(X + 160, top, X + 95, b), ring(X + 285, 524, 64), line(X + 349, top + 10, X + 349, b), C(X + 455, b - 6)], w: [SW, SW, SW, SW, SW, SW, SW, SW, 36] };
}
const KEYS = [[0, 0], [1, .9], [2, 1.9], [3, 3.1], [4, 4.4]];   // [状态, 开始变到这个状态的时间]，每次变形 .6 秒
function partsAt(t) {
  let i = 0; while (i < KEYS.length - 1 && t >= KEYS[i + 1][1]) i++;
  const [k, t0] = KEYS[i], A = stateAt(Math.max(0, k - 1), t), Bs = stateAt(k, t), u = k === 0 ? 1 : E.inOutC(seg(t, t0, t0 + .6));
  const stag = j => k === 4 ? E.inOutC(seg(t, t0 + j * .05, t0 + .6 + j * .05)) : u;          // 拼字时每个零件错峰
  return Bs.p.map((pts, j) => ({ pts: pts.map((q, n) => [lerp(A.p[j][n][0], q[0], stag(j)), lerp(A.p[j][n][1], q[1], stag(j))]), w: lerp(A.w[j], Bs.w[j], stag(j)), c: j === 8 ? RED : CREAM }));
}
function drawParts(ctx, parts, alpha) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = alpha;
  for (const p of parts) { if (p.w < .5) continue; const [a, z] = [p.pts[0], p.pts[NP - 1]], m = p.pts[NP >> 1];
    if (Math.hypot(a[0] - m[0], a[1] - m[1]) + Math.hypot(z[0] - m[0], z[1] - m[1]) < 1) { ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(960 + m[0], m[1], p.w / 2, 0, 7); ctx.fill(); continue; }   // 长度为 0 的描边 Chrome 不画，改画圆点
    ctx.strokeStyle = p.c; ctx.lineWidth = p.w; ctx.beginPath(); p.pts.forEach(([x, y], n) => n ? ctx.lineTo(960 + x, y) : ctx.moveTo(960 + x, y)); ctx.stroke(); }
  ctx.globalAlpha = 1;
}

export default {
  width: W, height: H, fps: 30, duration: DUR,
  fonts: [[`500 26px ${CN}`, '一念成形']],
  draw(ctx, t) {
    ctx.fillStyle = '#121116'; ctx.fillRect(0, 0, W, H);
    // 拖影：往回取两个时间点，半透明叠上去
    drawParts(ctx, partsAt(Math.max(0, t - 2 / 60)), .18); drawParts(ctx, partsAt(Math.max(0, t - 1 / 60)), .3); drawParts(ctx, partsAt(t), 1);
    // 结尾：红点外的彩色细轨道 + 标语
    const dot = [960 + X + 455, 594], o = seg(t, 5.2, 6.4);
    if (o > 0) [['#F2C14E', 52, 0], ['#8C7CF2', 92, .15], ['#4FB3F2', 132, .3]].forEach(([c, r, d]) => { const p = E.outC(seg(t, 5.2 + d, 6.2 + d)); if (p <= 0) return;
      ctx.strokeStyle = c; ctx.globalAlpha = .75; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(...dot, r, -Math.PI / 2 + t * .2 * (r / 64), -Math.PI / 2 + t * .2 * (r / 64) + Math.PI * 2 * p); ctx.stroke();
      const a = t * (1.6 - r / 200) + r; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(dot[0] + Math.cos(a) * r, dot[1] + Math.sin(a) * r, 4 * p, 0, 7); ctx.fill(); ctx.globalAlpha = 1; });
    const s = E.outC(seg(t, 6, 6.8)); if (s > 0) { ctx.globalAlpha = s; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = CREAM; ctx.font = `500 30px ${CN}`; ctx.letterSpacing = `${lerp(40, 22, s)}px`;
      ctx.fillText('一念', 960 - 86, 720); ctx.fillText('成形', 960 + 104, 720); ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(966, 720, 5, 0, 7); ctx.fill();
      ctx.font = `600 13px ${SANS}`; ctx.letterSpacing = '7px'; ctx.fillStyle = 'rgba(239,232,218,.55)'; ctx.fillText('ONE THOUGHT · ONE SHAPE', 966, 770); ctx.letterSpacing = '0px'; ctx.globalAlpha = 1; }
    // 进度：底部一排小点，当前那一步是一根短条
    let cur = 0; while (cur < KEYS.length - 1 && t >= KEYS[cur + 1][1]) cur++; const fade = 1 - seg(t, 5.6, 6.2);
    if (fade > 0) for (let i = 0; i < KEYS.length; i++) { ctx.fillStyle = `rgba(239,232,218,${(i === cur ? .9 : .3) * fade})`; const x = 900 + i * 22 + (i > cur ? 24 : 0); if (i === cur) { ctx.beginPath(); ctx.roundRect(x - 4, 976, 32, 8, 4); ctx.fill(); } else { ctx.beginPath(); ctx.arc(x, 980, 4, 0, 7); ctx.fill(); } }
    vignette(ctx, .35); grain(ctx, t, .06);
  },
  audio() {
    const m = new Mix(DUR + .3);
    m.tone(0, DUR, 55, { wave: 'sine', vol: .08, env: [1, .1, 1, 1.5] }); m.tone(0, DUR, 82.4, { wave: 'tri', vol: .025, env: [2, .1, 1, 1.5] });
    for (let b = .9; b < 6; b += .5) m.tone(b, .02, 3200, { wave: 'noise', vol: .04 });
    KEYS.forEach(([, t0], i) => { if (!i) return; m.whoosh(t0 - .05, .5, .07); m.tone(t0 + .6, .25, 440 * 2 ** (([0, 64, 67, 71, 76][i] - 69) / 12), { vol: .07, env: [.002, .15, .2, .4] }); });
    m.pop(.3, .15); m.ding(5.2, .12); [76, 83, 88].forEach((n, i) => m.tone(6 + i * .1, 1.2, 440 * 2 ** ((n - 69) / 12), { vol: .05, env: [.005, .4, .2, 1] }));
    m.echo(.3, .35, .25); return m.master();
  },
};
