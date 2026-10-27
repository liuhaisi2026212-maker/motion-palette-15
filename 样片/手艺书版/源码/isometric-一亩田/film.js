// 等轴 2.5D · 虚构品牌「一亩田 FARM OS」。原版语法：一整块等轴沙盘（有厚度、分层的底座），中心先亮，
// 物件从地里一格格长出来（先白模再整体染色），浮动数据卡用引线连到物件，柔和渐变底 + 云，最后拉远出品牌立体字。
import { clamp, lerp, seg, E, spring, rng, Mix, backing } from './lib/core.js';
import { SANS, mix, shade, grain } from './lib/draw.js';

const W = 1920, H = 1080, N = 12, DUR = 10;
const WHITE = '#F5F3FA', LINE = 'rgba(80,70,120,.10)';
let S = 62, CX = 960, CY = 190;                                      // 每格大小、原点（拉远时会变）
const iso = (x, y, z = 0) => [CX + (x - y) * S, CY + (x + y) * S * .5 - z * S * .9];
const poly = (ctx, pts, fill) => { ctx.beginPath(); pts.forEach(p => ctx.lineTo(...p)); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
function box(ctx, x, y, z, w, d, h, c) {
  poly(ctx, [iso(x, y + d, z + h), iso(x + w, y + d, z + h), iso(x + w, y + d, z), iso(x, y + d, z)], shade(c, -.12));
  poly(ctx, [iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x + w, y + d, z), iso(x + w, y, z)], shade(c, -.22));
  poly(ctx, [iso(x, y, z + h), iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x, y + d, z + h)], c);
}
function roof(ctx, x, y, z, w, d, rh, c) {   // 人字屋顶，屋脊沿 x
  poly(ctx, [iso(x, y, z), iso(x + w, y, z), iso(x + w, y + d / 2, z + rh), iso(x, y + d / 2, z + rh)], shade(c, .08));
  poly(ctx, [iso(x, y + d, z), iso(x + w, y + d, z), iso(x + w, y + d / 2, z + rh), iso(x, y + d / 2, z + rh)], shade(c, -.08));
  poly(ctx, [iso(x + w, y, z), iso(x + w, y + d, z), iso(x + w, y + d / 2, z + rh)], shade(c, -.25));
}
function cyl(ctx, x, y, r, h, c, dome = true) {
  const [bx, by] = iso(x, y, 0), [, ty] = iso(x, y, h), rx = r * S * 1.41, ry = rx * .5;
  const g = ctx.createLinearGradient(bx - rx, 0, bx + rx, 0); g.addColorStop(0, shade(c, -.05)); g.addColorStop(.6, shade(c, -.15)); g.addColorStop(1, shade(c, -.32));
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(bx, by, rx, ry, 0, 0, Math.PI); ctx.lineTo(bx - rx, ty); ctx.ellipse(bx, ty, rx, ry, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill();
  ctx.fillStyle = shade(c, .1); ctx.beginPath(); ctx.ellipse(bx, ty, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  if (dome) { ctx.fillStyle = shade(c, .02); ctx.beginPath(); ctx.ellipse(bx, ty, rx, ry, 0, Math.PI, 0); ctx.ellipse(bx, ty, rx, rx * .7, 0, 0, Math.PI, true); ctx.fill(); }
  ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let k = 1; k < 4; k++) ctx.fillRect(bx - rx, by - (by - ty) * k / 4, rx * 2, 3);
}
function tree(ctx, x, y, s, c) { box(ctx, x - .06, y - .06, 0, .12, .12, .5 * s, '#9A7B63'); const [px, py] = iso(x, y, .5 * s + .35 * s); const g = ctx.createRadialGradient(px - 8 * s, py - 8 * s, 2, px, py, 22 * s); g.addColorStop(0, shade(c, .25)); g.addColorStop(1, shade(c, -.12)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 20 * s, 0, Math.PI * 2); ctx.fill(); }

// ---------- 场景物件（网格 12×12，中心十字是道路） ----------
const OBJ = [];
const add = (x, y, c, fn) => OBJ.push({ x, y, c, fn, d: Math.hypot(x - 6, y - 6) });
add(2, 2, '#E8664F', (ctx, k, c, t) => { box(ctx, 2, 2, .25, 2.2, 1.8, 1.2 * k, c); if (k > .6) roof(ctx, 2, 2, .25 + 1.2 * k, 2.2, 1.8, .8 * k, shade(c, -.3)); });                 // 谷仓
add(.6, 4.2, '#F3B95F', (ctx, k, c) => { box(ctx, .6, 4.2, .25, 1, 1, .8 * k, c); if (k > .6) roof(ctx, .6, 4.2, .25 + .8 * k, 1, 1, .5 * k, shade(c, -.35)); });
add(4.4, .6, '#8FD3C0', (ctx, k, c) => { box(ctx, 4.4, .6, .25, 1, 1, .8 * k, c); if (k > .6) roof(ctx, 4.4, .6, .25 + .8 * k, 1, 1, .5 * k, shade(c, -.35)); });
add(8.6, 1.6, '#C9CDD8', (ctx, k, c) => cyl(ctx, 8.6, 1.6, .7, 2.4 * k, c));                                                                                         // 粮仓
add(10.2, 1.8, '#B8BDCB', (ctx, k, c) => cyl(ctx, 10.2, 1.8, .6, 1.9 * k, c));
add(7.4, 3.6, '#9EE6D2', (ctx, k, c) => { box(ctx, 7.4, 3.6, .25, 3.2, 1.3, .7 * k, c); if (k > .6) roof(ctx, 7.4, 3.6, .25 + .7 * k, 3.2, 1.3, .45 * k, shade(c, .2)); }); // 温室
add(9.6, 4.6, '#FFFFFF', (ctx, k, c, t) => mill(ctx, 11, 5.2, k, t));
add(7.6, 10.6, '#FFFFFF', (ctx, k, c, t) => mill(ctx, 7.6, 10.6, k, t + 1));
for (const [fx, fy] of [[.4, 7.4], [3, 7.4], [.4, 9.9], [3, 9.9]]) add(fx + 1, fy + 1, ['#E9C64B', '#7CC768', '#9BD86E', '#F0A64A'][Math.floor(fx + fy) % 4], (ctx, k, c) => field(ctx, fx, fy, 2.4, 2.2, k, c));
add(9.4, 9.4, '#5BB6F2', (ctx, k, c, t) => pond(ctx, 8.2, 8.2, 3.4, 3.4, k, c, t));
for (const [hx, hy, hc] of [[.5, .5, '#F6D58E'], [1.7, .5, '#A9C8F5'], [3, .5, '#F5A9B8'], [.5, 2.6, '#B9E3A8'], [4.4, 2.4, '#F6D58E'], [2, 4.4, '#A9C8F5'], [3.3, 4.4, '#F5A9B8']]) add(hx + .4, hy + .4, hc, (ctx, k, c) => { box(ctx, hx, hy, .25, .8, .8, .7 * k, c); if (k > .6) roof(ctx, hx, hy, .25 + .7 * k, .8, .8, .45 * k, shade(c, -.4)); });
for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const px = 7.3 + i * 1, py = .4 + j * .8; add(px + .4, py + .3, '#3B5BA9', (ctx, k, c) => { box(ctx, px, py, .25, .8, .55, .12 * k + .02, c); if (k > .5) poly(ctx, [iso(px + .05, py + .05, .4 * k), iso(px + .75, py + .05, .4 * k), iso(px + .75, py + .5, .4 * k), iso(px + .05, py + .5, .4 * k)], shade(c, .25)); }); }
const TREES = [[2.6, 3.4], [4.9, 3.7], [11.5, 3.4], [5.5, 9], [5.4, 11.4], [11.4, 6.3], [9.2, 6.4], [1.3, 1.7], [5.5, 1.8], [.4, 5.6], [5.5, 5.4], [11.4, 7.6], [7.4, 8], [11.5, 11.5], [8.2, 11.6]];
TREES.forEach(([x, y], i) => add(x, y, ['#5DBB7A', '#46A86A', '#7CCB7F'][i % 3], (ctx, k, c) => tree(ctx, x, y, k, c)));
OBJ.sort((a, b) => (a.x + a.y) - (b.x + b.y));

function mill(ctx, x, y, k, t) { box(ctx, x - .08, y - .08, .25, .16, .16, 3 * k, '#FFFFFF'); if (k < .9) return; const [hx, hy] = iso(x, y, .25 + 3);
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(t * 2.2); ctx.fillStyle = '#FFFFFF'; for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI * 2 / 3); ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(-5, -70); ctx.lineTo(4, -66); ctx.lineTo(3, 0); ctx.fill(); } ctx.restore(); ctx.fillStyle = '#C9C4DA'; ctx.beginPath(); ctx.arc(hx, hy, 6, 0, 7); ctx.fill(); }
function field(ctx, x, y, w, d, k, c) { box(ctx, x, y, .25, w, d, .08, shade(c, -.35));
  ctx.strokeStyle = c; ctx.lineWidth = 7; ctx.lineCap = 'round'; for (let i = 0; i < 6; i++) { const yy = y + .2 + i * (d - .4) / 5, h = .25 + .08 + .25 * k; ctx.beginPath(); ctx.moveTo(...iso(x + .15, yy, h)); ctx.lineTo(...iso(x + w - .15, yy, h)); ctx.stroke(); } }
function pond(ctx, x, y, w, d, k, c, t) { poly(ctx, [iso(x, y, .2), iso(x + w, y, .2), iso(x + w, y + d, .2), iso(x, y + d, .2)], mix('#E8E6F2', c, k));
  ctx.strokeStyle = `rgba(255,255,255,${.6 * k})`; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { const u = ((t * .25 + i * .25) % 1); ctx.beginPath(); ctx.moveTo(...iso(x + .4, y + .4 + u * (d - .8), .21)); ctx.lineTo(...iso(x + 1.6, y + .4 + u * (d - .8), .21)); ctx.stroke(); } }

// ---------- 底座和地砖 ----------
function platform(ctx, t) {
  const rise = E.outC(seg(t, 0, .8)), off = (1 - rise) * 200;
  ctx.save(); ctx.translate(0, off); ctx.globalAlpha = rise;
  const layers = [['#B8B0DE', .55], ['#D3CDEE', .3]]; let z = -.85;
  for (const [c, h] of layers) { poly(ctx, [iso(0, N, z + h), iso(N, N, z + h), iso(N, N, z), iso(0, N, z)], shade(c, -.05)); poly(ctx, [iso(N, 0, z + h), iso(N, N, z + h), iso(N, N, z), iso(N, 0, z)], shade(c, -.16)); z += h; }
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const k = E.outBack(seg(t, .3 + (i + j) * .035, .6 + (i + j) * .035)); if (k <= 0) continue;
    const road = i === 6 || j === 6, seed = (i === 5 || i === 6) && (j === 5 || j === 6);
    const colored = seg(t, 4 + Math.hypot(i - 6, j - 6) * .12, 4.4 + Math.hypot(i - 6, j - 6) * .12);
    let c = road ? mix(WHITE, '#C7C3D6', colored) : mix(WHITE, '#BFE8C4', colored); if (seed && t < 4.2) c = mix('#3E3480', c, seg(t, 1.2, 1.6) * .0 + colored);
    const zz = (1 - k) * .6; box(ctx, i + .04, j + .04, zz - .05, .92, .92, .3, c);
    if (road && colored > .5 && i === 6 && j % 2 === 0) poly(ctx, [iso(6.46, j + .3, .26), iso(6.54, j + .3, .26), iso(6.54, j + .7, .26), iso(6.46, j + .7, .26)], '#FFFFFF');
  }
  ctx.restore();
}
function tractor(ctx, t) { if (t < 5.4) return; const u = ((t - 5.4) * .9) % 13 - .5, x = u, y = 6.25; box(ctx, x, y, .25, .7, .5, .45, '#FF8A3D'); box(ctx, x + .45, y, .7, .25, .5, .3, '#2E2A55');
  const [wx, wy] = iso(x + .15, y + .5, .3); ctx.fillStyle = '#2E2A55'; ctx.beginPath(); ctx.arc(wx, wy, 8, 0, 7); ctx.fill(); }
function card(ctx, t, t0, ax, ay, az, cx, cy, label, en, num, unit) {
  const k = spring(t - t0, 2.6, .5); if (k <= 0) return; const [px, py] = iso(ax, ay, az);
  ctx.strokeStyle = 'rgba(60,50,110,.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(cx, cy + 60); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#3E3480'; ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.shadowColor = 'rgba(60,50,110,.25)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(-130, -80, 260, 160, 18); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#2E2A55'; ctx.font = `700 22px ${SANS}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(label, -106, -50); ctx.font = `600 13px ${SANS}`; ctx.fillStyle = 'rgba(46,42,85,.5)'; ctx.fillText(en, -106, -26);
  const shown = (parseFloat(num) * E.outC(seg(t, t0, t0 + .8))).toFixed(num.includes('.') ? 1 : 0); ctx.font = `800 64px ${SANS}`; ctx.fillStyle = '#2E2A55'; ctx.fillText(shown, -106, 30); const w = ctx.measureText(shown).width; ctx.font = `700 20px ${SANS}`; ctx.fillText(unit, -100 + w, 44);
  for (let i = 0; i < 6; i++) { const h = 10 + 40 * Math.abs(Math.sin(i * 1.7 + 1)) * E.outC(seg(t, t0 + .2 + i * .05, t0 + .6 + i * .05)); ctx.fillStyle = i === 5 ? '#FF8A3D' : '#BDB6E8'; ctx.fillRect(40 + i * 14, 50 - h, 9, h); }
  ctx.restore();
}
function brand(ctx, t) {   // 拉远后左下角：贴在等轴平面上的立体字
  const k = E.outC(seg(t, 7.8, 8.6)); if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = k; ctx.setTransform(1, -.5, 0, 1, 250, 760 + (1 - k) * 40);
  ctx.font = `900 150px ${SANS}`; ctx.textBaseline = 'alphabetic';
  for (let d = 14; d > 0; d -= 2) { ctx.fillStyle = '#2A2260'; ctx.fillText('一亩田', d * .7, d); }
  ctx.fillStyle = '#4A3FB0'; ctx.fillText('一亩田', 0, 0);
  ctx.font = `700 34px ${SANS}`; ctx.fillStyle = '#2E2A55'; ctx.fillText('把每一亩地，都看得清清楚楚', 4, 80);
  ctx.font = `600 18px ${SANS}`; ctx.letterSpacing = '6px'; ctx.fillStyle = 'rgba(46,42,85,.6)'; ctx.fillText('FARM OS · 12 × 12 · ONLINE', 4, 128); ctx.restore();
}

export default {
  width: W, height: H, fps: 30, duration: DUR,
  fonts: [[`900 100px ${SANS}`, '一亩田把每地都看得清楚今日产量灌溉吨']],
  draw(ctx, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#E9E4FB'); g.addColorStop(1, '#FBE6DD'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const [x, y, s] of [[260, 160, 1], [1600, 120, .8], [1500, 820, .7]]) { const xx = x + t * 12; ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(xx, y, 34 * s, 0, 7); ctx.arc(xx + 40 * s, y - 16 * s, 44 * s, 0, 7); ctx.arc(xx + 86 * s, y, 32 * s, 0, 7); ctx.fill(); }
    // 拉远：格子变小、整体右移
    const pb = E.inOutC(seg(t, 7.4, 8.6)); S = lerp(62, 42, pb); CX = lerp(960, 1300, pb); CY = lerp(190, 330, pb);
    platform(ctx, t);
    const wave = (t - 4) / .12;     // 染色波：从中心往外
    for (const o of OBJ) { const k = spring(t - 1.4 - o.d * .16, 2.2, .55); if (k <= .01) continue; const col = clamp((wave - o.d) / 3); o.fn(ctx, Math.min(k, 1.15), mix(WHITE, o.c, col), t); }
    tractor(ctx, t);
    if (pb < .3) { ctx.globalAlpha = 1 - pb / .3; card(ctx, t, 5.6, 8.6, 1.6, 2.6, 1320, 150, '今日产量', 'TODAY OUTPUT', '2.4', '吨'); card(ctx, t, 6.1, 9.9, 9.9, .3, 1640, 640, '灌溉覆盖', 'IRRIGATION', '87', '%'); ctx.globalAlpha = 1; }
    brand(ctx, t); grain(ctx, t, .025);
  },
  audio() {
    const m = new Mix(DUR + .3); backing(m, DUR, { bpm: 104, root: 64 });
    for (let i = 0; i < 12; i++) m.tone(.3 + i * .035 * 2, .05, 900 + i * 40, { vol: .03 });
    OBJ.forEach(o => m.pop(1.4 + o.d * .16, .07)); m.whoosh(3.9, .8, .08); m.ding(4.6, .1); m.pop(5.6, .2); m.pop(6.1, .2); m.whoosh(7.4, 1, .1); m.ding(8, .15);
    m.echo(); return m.master();
  },
};
