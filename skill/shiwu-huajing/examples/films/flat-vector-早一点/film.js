// 扁平矢量 · 虚构品牌「早一点 EARLY」。原版语法：完整场景插画、一个橙色圆点贯穿全片当转场、2×2 分屏、颜色少而饱满、结尾圆环扫过 + 品牌名。
import { clamp, lerp, seg, E, spring, squash, rng, beats, Mix, backing } from './lib/core.js';
import { SANS, text, rrect, circle, grain } from './lib/draw.js';

const W = 1920, H = 1080;
const P = { navy: '#20365A', navy2: '#2C4A75', navy3: '#172843', cream: '#F7EEDB', orange: '#FF7A2F', yellow: '#FFC845', sky: '#A9D3EE', skin: '#F4C7A6', ink: '#14223A' };
const TEXT = { brand: '早一点', sub: '每天早起十分钟', en: 'A LITTLE EARLIER', cells: [['01', '读书'], ['02', '动一动'], ['03', '吃早饭'], ['04', '列计划']] };
const B = beats([['city', 2.4], ['kitchen', 2.4], ['grid', 2.8], ['end', 2.4]]);

// ---------- 1 城市日出：楼一栋栋升起、窗户一格格亮、橙色太阳从楼后升起 ----------
const BLD = []; { const r = rng(4); let x = -20; while (x < W + 40) { const w = 110 + r() * 120, h = 220 + r() * 420; BLD.push({ x, w, h, c: [P.navy2, '#36598A', P.navy3][Math.floor(r() * 3)], d: r() * .5, seed: Math.floor(r() * 1e6), roof: r() }); x += w + 8 + r() * 16; } }
function city(ctx, t) {
  const u = seg(t, 0, 2.2), sky = E.inOutC(seg(t, .6, 2.2));
  ctx.fillStyle = sky < .5 ? P.navy : P.navy; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = sky; ctx.fillStyle = '#3E5F8E'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  // 太阳（就是那个贯穿全片的橙点）
  const sy = lerp(980, 360, E.outC(seg(t, .3, 1.8))); for (let i = 3; i >= 1; i--) circle(ctx, 1400, sy, 90 + i * 34, `rgba(255,122,47,${.07 * (4 - i)})`); circle(ctx, 1400, sy, 90, P.orange);
  // 云
  for (const [cx, cy, s, sp] of [[300, 250, 1, 14], [980, 170, .8, 22], [1700, 280, .9, 10]]) { const x = cx + t * sp; ctx.fillStyle = P.cream; ctx.globalAlpha = .9; ctx.beginPath(); ctx.arc(x, cy, 40 * s, 0, 7); ctx.arc(x + 46 * s, cy - 18 * s, 52 * s, 0, 7); ctx.arc(x + 100 * s, cy, 38 * s, 0, 7); ctx.rect(x, cy, 100 * s, 38 * s); ctx.fill(); ctx.globalAlpha = 1; }
  // 楼
  for (const b of BLD) { const k = spring(t - .2 - b.d, 2.2, .55), h = b.h * k, y = 900 - h; if (h < 2) continue;
    ctx.fillStyle = b.c; ctx.fillRect(b.x, y, b.w, h);
    if (b.roof > .7) { ctx.fillRect(b.x + b.w * .4, y - 40 * k, 8, 40 * k); circle(ctx, b.x + b.w * .4 + 4, y - 44 * k, 7, P.orange); }
    const r = rng(b.seed), cols = Math.floor((b.w - 20) / 32), rows = Math.floor((h - 30) / 44);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const on = t > .9 + r() * 1.3; ctx.fillStyle = on ? P.yellow : 'rgba(255,255,255,.08)'; ctx.fillRect(b.x + 14 + i * 32, y + 22 + j * 44, 16, 22); } }
  ctx.fillStyle = P.cream; ctx.fillRect(0, 900, W, 180); ctx.fillStyle = '#E8DCC2'; for (let x = (-t * 120) % 160; x < W; x += 160) ctx.fillRect(x, 980, 80, 10);
  // 树
  for (let i = 0; i < 7; i++) { const x = 120 + i * 270, k = spring(t - .6 - i * .05, 3, .45); ctx.fillStyle = '#6B4E3A'; ctx.fillRect(x - 5, 860, 10, 40 * k); circle(ctx, x, 850 - 10 * k, 36 * k, '#3E8E6E'); }
}
// ---------- 2 厨房：人物端着杯子、窗外太阳、钟、面包弹出 ----------
function kitchen(ctx, t) {
  const t0 = B.kitchen.t0, lt = t - t0, push = 1 + .04 * E.inOutC(seg(t, t0, B.kitchen.t1));
  ctx.save(); ctx.translate(960, 540); ctx.scale(push, push); ctx.translate(-960, -540);
  ctx.fillStyle = P.sky; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#C3E2F4'; ctx.fillRect(0, 580, W, 140); ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let y = 580; y < 720; y += 46) ctx.fillRect(0, y, W, 3); for (let y = 580, r = 0; y < 720; y += 46, r++) for (let x = (r % 2) * 46; x < W; x += 92) ctx.fillRect(x, y, 3, 46);
  // 窗：里面就是那颗太阳
  rrect(ctx, 220, 150, 520, 400, 16, P.cream); ctx.fillStyle = '#FFE3C2'; ctx.fillRect(250, 180, 460, 340); circle(ctx, 560, 310, 70, P.orange);
  ctx.fillStyle = P.cream; ctx.fillRect(472, 180, 16, 340); ctx.fillRect(250, 342, 460, 16);
  // 吊灯
  ctx.fillStyle = P.ink; ctx.fillRect(1218, 0, 4, 150); ctx.beginPath(); ctx.moveTo(1150, 210); ctx.lineTo(1290, 210); ctx.lineTo(1250, 150); ctx.lineTo(1190, 150); ctx.fill(); circle(ctx, 1220, 214, 12, P.yellow);
  // 钟：指针在走
  circle(ctx, 1640, 250, 96, P.cream); circle(ctx, 1640, 250, 84, '#FFFFFF'); ctx.strokeStyle = P.ink; ctx.lineCap = 'round'; ctx.lineWidth = 8;
  const mm = (50 + lt * 4) / 60 * Math.PI * 2 - Math.PI / 2; ctx.beginPath(); ctx.moveTo(1640, 250); ctx.lineTo(1640 + Math.cos(mm) * 62, 250 + Math.sin(mm) * 62); ctx.stroke();
  ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(1640, 250); ctx.lineTo(1640 + Math.cos(-Math.PI / 2 + Math.PI * 2 * 6.85 / 12) * 40, 250 + Math.sin(-Math.PI / 2 + Math.PI * 2 * 6.85 / 12) * 40); ctx.stroke(); circle(ctx, 1640, 250, 9, P.orange);
  // 植物
  rrect(ctx, 1500, 610, 90, 90, 12, P.orange); ctx.fillStyle = '#3E8E6E'; for (const a of [-.6, -.2, .2, .6]) { ctx.save(); ctx.translate(1545, 610); ctx.rotate(a + .05 * Math.sin(t * 2 + a)); ctx.beginPath(); ctx.ellipse(0, -60, 20, 60, 0, 0, 7); ctx.fill(); ctx.restore(); }
  // 人物（台面后面）
  const bob = Math.sin(lt * 3) * 4, blink = (lt % 2.2) < .1;
  rrect(ctx, 830, 560 + bob, 280, 260, 70, P.orange); ctx.fillStyle = P.cream; for (let i = 0; i < 4; i++) ctx.fillRect(840, 600 + i * 50 + bob, 260, 16);
  circle(ctx, 970, 460 + bob, 96, P.skin);
  ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(970, 440 + bob, 104, Math.PI * 1.05, Math.PI * 1.95); ctx.fill(); ctx.beginPath(); ctx.ellipse(1050, 410 + bob, 30, 46, -.4, 0, 7); ctx.fill();
  if (blink) { ctx.fillRect(925, 470 + bob, 22, 5); ctx.fillRect(995, 470 + bob, 22, 5); } else { circle(ctx, 936, 472 + bob, 9, P.ink); circle(ctx, 1006, 472 + bob, 9, P.ink); }
  ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(971, 500 + bob, 18, .2, Math.PI - .2); ctx.stroke(); circle(ctx, 915, 505 + bob, 12, '#F59C88'); circle(ctx, 1027, 505 + bob, 12, '#F59C88');
  // 杯子：抬起来喝一口
  const sip = Math.max(0, Math.sin(lt * 2.2)) ** 3, mx = 1110, my = lerp(700, 560, sip);
  ctx.fillStyle = P.skin; rrect(ctx, mx - 60, my + 40, 90, 50, 25, P.skin);
  rrect(ctx, mx - 10, my - 20, 90, 110, 16, P.cream); ctx.strokeStyle = P.cream; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(mx + 84, my + 30, 26, -1.3, 1.3); ctx.stroke(); circle(ctx, mx + 35, my + 30, 12, P.orange);
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 6; for (let i = 0; i < 3; i++) { ctx.beginPath(); for (let j = 0; j < 8; j++) ctx.lineTo(mx + 10 + i * 25 + Math.sin(j * .8 + t * 5 + i) * 6, my - 30 - j * 10); ctx.stroke(); }
  // 台面 + 烤面包机
  ctx.fillStyle = P.navy; ctx.fillRect(0, 720, W, 360); ctx.fillStyle = P.navy2; ctx.fillRect(0, 720, W, 26);
  for (let i = 0; i < 6; i++) { const x = 40 + i * 310; rrect(ctx, x, 790, 290, 260, 14, P.navy3); rrect(ctx, x + 125, 820, 40, 12, 6, P.orange); }
  const pop = t0 + 1.1, py = t < pop ? 0 : -150 * Math.max(0, Math.sin(Math.min(Math.PI, (t - pop) * 4.5))) - (t > pop + .7 ? 60 : 0) * E.outC(seg(t, pop + .7, pop + .9));
  rrect(ctx, 400, 600 + py, 90, 100, 14, '#F2C26B'); rrect(ctx, 510, 600 + py, 90, 100, 14, '#F2C26B');
  rrect(ctx, 360, 620, 280, 120, 30, P.cream); ctx.fillStyle = P.ink; ctx.fillRect(400, 620, 90, 10); ctx.fillRect(510, 620, 90, 10); circle(ctx, 600, 690, 12, P.orange);
  ctx.restore();
}
// ---------- 3 四宫格：四件早起能做的事，橙点在每一格里换身份 ----------
function cell(ctx, i, t, x, y) {
  const t0 = B.grid.t0 + i * .12, k = spring(t - t0, 2.4, .5), lt = t - t0; if (k <= 0) return;
  const bg = [P.navy, P.cream, P.orange, P.sky][i], fg = i === 1 || i === 3 ? P.ink : P.cream;
  ctx.save(); ctx.translate(x + 480, y + 270); ctx.scale(k, k); ctx.translate(-480, -270); ctx.beginPath(); ctx.rect(0, 0, 960, 540); ctx.clip(); ctx.fillStyle = bg; ctx.fillRect(0, 0, 960, 540);
  if (i === 0) { // 书：书页翻动，橙点是书签
    rrect(ctx, 260, 170, 440, 270, 14, '#16294A'); ctx.fillStyle = P.cream; ctx.fillRect(282, 186, 196, 236); ctx.fillRect(482, 186, 196, 236);
    ctx.fillStyle = 'rgba(32,54,90,.35)'; for (let j = 0; j < 7; j++) { ctx.fillRect(300, 210 + j * 28, 150, 8); ctx.fillRect(500, 210 + j * 28, 150, 8); }
    const f = (lt * 1.3) % 1, sx = Math.cos(f * Math.PI); ctx.save(); ctx.translate(480, 0); ctx.scale(sx, 1); ctx.fillStyle = sx > 0 ? '#FFFFFF' : '#EADFC8'; ctx.fillRect(0, 186, 196, 236); ctx.restore();
    ctx.fillStyle = P.orange; ctx.fillRect(630, 150, 26, 80); circle(ctx, 643, 236, 13, P.orange);
  } else if (i === 1) { // 动一动：橙球弹跳挤压
    const ph = (lt * 1.6) % 1, h = 4 * ph * (1 - ph), by = 420 - h * 230, [sx, sy] = ph < .08 || ph > .92 ? [1.25, .78] : [.92, 1.1];
    ctx.fillStyle = 'rgba(20,34,58,.15)'; ctx.beginPath(); ctx.ellipse(480, 452, 70 * (1 - h * .5), 14, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(480, by + 30); ctx.scale(sx, sy); circle(ctx, 0, -30, 60, P.orange); ctx.restore();
    ctx.fillStyle = P.ink; ctx.fillRect(140, 455, 680, 8);
  } else if (i === 2) { // 吃早饭：煎蛋（蛋黄就是那颗点）
    circle(ctx, 480, 290, 170, P.ink); ctx.fillStyle = P.ink; ctx.save(); ctx.translate(480, 290); ctx.rotate(.5); ctx.fillRect(160, -20, 220, 40); ctx.restore();
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); for (let a = 0; a < 7; a += .2) { const r = 110 + 14 * Math.sin(a * 5 + lt * 3); ctx.lineTo(480 + Math.cos(a) * r, 290 + Math.sin(a) * r * .9); } ctx.fill(); circle(ctx, 490, 280, 48, P.yellow);
    for (let j = 0; j < 4; j++) { const ph = (lt * 2 + j * .25) % 1; circle(ctx, 360 + j * 80, 150 - ph * 80, 6 * (1 - ph), 'rgba(255,255,255,.7)'); }
  } else { // 列计划：清单一条条打勾
    rrect(ctx, 300, 120, 360, 330, 22, P.cream);
    for (let j = 0; j < 3; j++) { const yy = 190 + j * 90, c = E.outC(seg(lt, .3 + j * .35, .55 + j * .35)); rrect(ctx, 340, yy - 24, 48, 48, 10, '#FFFFFF', P.ink, 5); ctx.fillStyle = 'rgba(20,34,58,.3)'; ctx.fillRect(410, yy - 6, 200, 12);
      if (c > 0) { ctx.strokeStyle = P.orange; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.setLineDash([80 * c, 80]); ctx.beginPath(); ctx.moveTo(350, yy); ctx.lineTo(362, yy + 14); ctx.lineTo(384, yy - 16); ctx.stroke(); ctx.setLineDash([]); } }
  }
  const [n, s] = TEXT.cells[i]; text(ctx, n, 54, 60, { size: 40, weight: 800, color: i === 2 ? P.cream : P.orange, align: 'left' }); text(ctx, s, 120, 60, { size: 40, weight: 700, color: fg, align: 'left' });
  ctx.restore();
}
function grid(ctx, t) { ctx.fillStyle = P.cream; ctx.fillRect(0, 0, W, H); cell(ctx, 0, t, 0, 0); cell(ctx, 1, t, 960, 0); cell(ctx, 2, t, 0, 540); cell(ctx, 3, t, 960, 540); }
// ---------- 4 结尾：橙点飞到中央，圆环扫过，品牌名的句点就是它 ----------
function end(ctx, t) {
  const t0 = B.end.t0, lt = t - t0; ctx.fillStyle = P.navy; ctx.fillRect(0, 0, W, H);
  const fly = E.inOutC(seg(lt, 0, .5)), dx = lerp(490, 1196, fly), dy = lerp(820, 470, fly) - Math.sin(fly * Math.PI) * 160;
  const ring = E.outExpo(seg(lt, .5, 1.6)); if (ring > 0) { ctx.strokeStyle = P.orange; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(dx, dy, 40 + ring * 520, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, ring * 1.3)); ctx.stroke(); }
  const k = E.outC(seg(lt, .45, .9)); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 470 + 70); ctx.clip();
  text(ctx, TEXT.brand, 900, 470 + (1 - k) * 140, { size: 170, weight: 900, color: P.cream }); ctx.restore();
  const [sx, sy] = squash(t, t0 + .5, .25); ctx.save(); ctx.translate(dx, dy + 30); ctx.scale(sx, sy); circle(ctx, 0, -30, 30, P.orange); ctx.restore();
  const s = E.outC(seg(lt, 1, 1.4)); ctx.globalAlpha = s; text(ctx, TEXT.sub, 960, 640 + (1 - s) * 16, { size: 46, weight: 700, color: P.cream });
  ctx.save(); ctx.font = `600 20px ${SANS}`; ctx.letterSpacing = '10px'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(247,238,219,.7)'; ctx.fillText(TEXT.en, 965, 712); ctx.restore(); ctx.globalAlpha = 1;
  for (let i = 0; i < 4; i++) circle(ctx, 1810 + (i % 2) * 22, 990 + Math.floor(i / 2) * 22, 7, i === 3 ? P.orange : 'rgba(247,238,219,.6)');
}

export default {
  width: W, height: H, fps: 30, duration: B.duration,
  fonts: [[`900 100px ${SANS}`, TEXT.brand + TEXT.sub + TEXT.cells.flat().join('')]],
  draw(ctx, t) {
    if (t < B.city.t1) city(ctx, t); else if (t < B.kitchen.t1) kitchen(ctx, t); else if (t < B.grid.t1) grid(ctx, t); else end(ctx, t);
    // 城市 → 厨房：太阳那一点放大成圆形转场
    const w = seg(t, B.city.t1 - .35, B.city.t1 + .25); if (w > 0 && w < 1) { const r = E.inOutC(w) * 2300 * (w < .58 ? 1 : 1 - (w - .58) / .42); circle(ctx, 1400, 360, Math.max(0, r), P.orange); }
    grain(ctx, t, .03);
  },
  audio() {
    const m = new Mix(B.duration + .3); backing(m, B.duration, { bpm: 112, root: 62 });
    for (let i = 0; i < 8; i++) m.pop(.25 + i * .12, .1); m.ding(1.6, .12); m.whoosh(B.city.t1 - .35, .5);
    m.boing(B.kitchen.t0 + 1.1, .2); m.pop(B.kitchen.t0 + .7, .12);
    for (let i = 0; i < 4; i++) m.pop(B.grid.t0 + i * .12, .2); for (let j = 0; j < 3; j++) m.tone(B.grid.t0 + .3 + j * .35, .06, 1200 + j * 200, { vol: .06 });
    m.whoosh(B.end.t0, .4); m.thud(B.end.t0 + .5, .4); m.ding(B.end.t0 + 1, .16); m.echo(); return m.master();
  },
};
