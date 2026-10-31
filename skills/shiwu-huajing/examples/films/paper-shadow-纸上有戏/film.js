// 剪纸皮影 · 虚构品牌「纸上有戏 PAPER OPERA · 灯影小剧场」。原版语法：油灯照亮的幕布（中间暖亮、四周压暗、灯火一直轻轻跳）、
// 黑色皮影人身上镂空花纹透光、关节一圈小孔当铆钉、三根操纵杆一直伸出画面；红纸剪的海水纹和祥云一层层叠，纸边有厚度阴影；
// 折起来的团花一瓣一瓣展开；书法大字一个个写出，最后盖一方红印。整片只有团花展开那一下是重拍。
import { clamp, lerp, seg, E, rng, noise1, Mix, hz } from './lib/core.js';
import { grain, vignette } from './lib/draw.js';

const W = 1920, H = 1080, DUR = 10;
const BRUSH = '"Ma Shan Zheng", "Noto Serif SC", "Songti SC", serif', SERIF = '"Noto Serif SC", "Songti SC", "STSong", serif';
const C = { ink: '#160906', red: '#C8231F', redD: '#8E1B18', redL: '#DE4A35', cream: '#FBEBC8', brown: '#4A1408', gold: '#E3B04B' };
const TEXT = { title: '纸上有戏', seal: '影', sub: '灯影小剧场', en: 'PAPER  OPERA' };
// 时间点（秒）
const T = { lamp: .15, val: .35, waves: .7, clouds: 1.1, walk0: 1.5, walk1: 4.3, raise: 4.45, fold: 4.75, open0: 4.95, open1: 5.75, title: 6.3, seal: 7.75, sub: 8.0, bow: 8.7 };
const FLOWER = { x: 1330, y: 470, R: 250 };
const bump = (t, c, w) => Math.exp(-(((t - c) / w) ** 2));
const TAU = Math.PI * 2;

// ---------- 灯：点着时闪两下，之后一直轻轻跳；团花展开那一下亮一档 ----------
function lamp(t) {
  let ig = E.outC(seg(t, T.lamp, .8)); ig *= 1 - .55 * bump(t, .33, .05) - .3 * bump(t, .52, .04);
  const flick = 1 + .05 * (noise1(t * 6, 3) - .5) + .025 * (noise1(t * 21, 4) - .5);
  const flare = t > T.open1 - .08 ? .2 * E.outC(seg(t, T.open1 - .08, T.open1)) * Math.exp(-Math.max(0, t - T.open1) * 1.6) : 0;
  return ig * flick + flare;
}

// ---------- 纸：把一个形状画进离屏画布，再用 destination-out 剪出镂空 ----------
const layer = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return { c, x: c.getContext('2d') }; };
const cut = (x, fn) => { x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; x.strokeStyle = '#000'; fn(x); x.restore(); };
const paperShadow = (ctx, a = .45, blur = 10, dy = 6) => { ctx.shadowColor = `rgba(70,12,4,${a})`; ctx.shadowBlur = blur; ctx.shadowOffsetY = dy; };

// 海水纹：一排排半圆浪头，浪头里剪出两道弯月。画布顶上就是浪尖
function makeWave(period, color, h) {
  const amp = period / 2 + 4, n = Math.ceil((W + period * 2) / period) + 1, L = layer(n * period, h), x = L.x;
  x.fillStyle = color; x.beginPath(); x.moveTo(0, h);
  for (let i = 0; i <= n; i++) { const cx = i * period + period / 2; x.lineTo(i * period, amp); x.arc(cx, amp, period / 2, Math.PI, 0); }
  x.lineTo(n * period, h); x.closePath(); x.fill();
  cut(x, c => { c.lineCap = 'round';
    for (let i = 0; i < n; i++) { const cx = i * period + period / 2;
      for (const [k, lw] of [[.62, 7], [.36, 6]]) { c.lineWidth = lw; c.beginPath(); c.arc(cx, amp, period / 2 * k, Math.PI * 1.08, Math.PI * 1.92); c.stroke(); }
      c.beginPath(); c.arc(cx, amp + period * .2, 5, 0, TAU); c.fill(); }
    c.lineWidth = 4; c.setLineDash([2, 16]); c.beginPath(); c.moveTo(0, amp + period * .42); c.lineTo(n * period, amp + period * .42); c.stroke(); });
  return { ...L, period };
}

// 祥云：几团圆叠成云，里面剪出卷涡
function makeCloud(s, color) {
  const L = layer(340 * s, 200 * s), x = L.x; x.scale(s, s); x.fillStyle = color;
  const blobs = [[70, 120, 48], [130, 85, 62], [205, 92, 56], [265, 125, 42], [170, 140, 50]];
  x.beginPath(); for (const [bx, by, r] of blobs) { x.moveTo(bx + r, by); x.arc(bx, by, r, 0, TAU); } x.fill();
  x.beginPath(); x.roundRect(30, 130, 280, 45, 22); x.fill();
  cut(x, c => { c.lineCap = 'round'; c.lineWidth = 7;
    for (const [bx, by, r] of blobs.slice(0, 4)) { c.beginPath(); c.arc(bx, by + 4, r * .5, Math.PI * .9, Math.PI * 2.3); c.stroke(); c.beginPath(); c.arc(bx + r * .08, by + 4, r * .2, 0, TAU); c.fill(); }
    c.beginPath(); c.moveTo(60, 160); c.quadraticCurveTo(170, 140, 285, 160); c.stroke(); });
  return L;
}

// 团花的一瓣（45°）：外沿一圈扇贝，里面剪花瓣、月牙、小孔。8 瓣转着摆一圈就是整朵
function makePetal(R) {
  const L = layer(R * 2 + 20, R * 2 + 20), x = L.x, a = Math.PI / 8; x.translate(R + 10, R + 10); x.fillStyle = C.red;
  x.beginPath(); x.moveTo(0, 0); for (let i = 0; i <= 24; i++) { const u = -a + 2 * a * i / 24, r = R * (.94 + .06 * Math.abs(Math.cos(u * 16))); x.lineTo(Math.cos(u) * r, Math.sin(u) * r); } x.closePath(); x.fill();
  cut(x, c => {
    c.save(); c.translate(R * .72, 0); c.beginPath(); c.ellipse(0, 0, R * .14, R * .055, 0, 0, TAU); c.fill(); c.restore();             // 大花瓣
    for (const s of [-1, 1]) { c.save(); c.rotate(s * a * .55); c.translate(R * .5, 0); c.beginPath(); c.ellipse(0, 0, R * .07, R * .03, 0, 0, TAU); c.fill(); c.restore(); }
    c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.arc(0, 0, R * .86, -a * .7, a * .7); c.stroke();                          // 外圈月牙
    c.beginPath(); c.arc(0, 0, R * .3, -a * .8, a * .8); c.stroke();
    for (const k of [-.5, 0, .5]) { c.beginPath(); c.arc(Math.cos(k * a) * R * .4, Math.sin(k * a) * R * .4, 6, 0, TAU); c.fill(); }
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R * .13, -a - .01, a + .01); c.closePath(); c.fill();                                   // 中心孔
  });
  return { ...L, o: R + 10 };
}

// ---------- 皮影人：一块块黑皮子，各有自己的转轴，身上剪满镂空 ----------
const PARTS = {};
function part(name, w, h, ox, oy, draw, holes) {   // ox, oy：转轴在这块皮子里的位置
  const L = layer(w, h); L.x.translate(ox, oy); L.x.fillStyle = C.ink; draw(L.x); L.x.fill();
  if (holes) cut(L.x, holes);   // 离屏画布已经平移到转轴，镂空直接按同一套坐标剪
  PARTS[name] = { ...L, ox, oy };
}
const ring = (c, x, y, r = 8) => { c.lineWidth = 3; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); };   // 关节铆钉：一圈小孔
function makePuppet() {
  part('body', 260, 380, 120, 20, x => {            // 身子 + 长袍，转轴在脖子
    x.beginPath(); x.moveTo(-14, -8); x.lineTo(16, -8); x.quadraticCurveTo(58, 6, 60, 40); x.lineTo(44, 150); x.quadraticCurveTo(70, 230, 96, 312);
    for (let i = 0; i <= 8; i++) x.lineTo(96 - i * 24, 312 + (i % 2 ? 14 : 0));   // 下摆一排尖角
    x.quadraticCurveTo(-90, 230, -46, 150); x.lineTo(-56, 40); x.quadraticCurveTo(-50, 6, -14, -8); x.closePath();
  }, c => {
    c.save(); c.translate(4, 80); for (let i = 0; i < 8; i++) { c.rotate(TAU / 8); c.beginPath(); c.ellipse(15, 0, 11, 5, 0, 0, TAU); c.fill(); } c.beginPath(); c.arc(0, 0, 6, 0, TAU); c.fill(); c.restore();   // 胸口团花
    c.fillRect(-40, 140, 84, 7); for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(-34 + i * 12, 158, 3, 0, TAU); c.fill(); }   // 腰带
    c.lineCap = 'round'; c.lineWidth = 5; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(4 + i * 20, 182); c.quadraticCurveTo(4 + i * 26, 240, 4 + i * 30, 284); c.stroke(); }   // 袍子竖纹
    for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(-86 + i * 22, 300); c.lineTo(-78 + i * 22, 290); c.lineTo(-70 + i * 22, 300); c.fill(); }   // 下摆三角
    ring(c, 34, 34); ring(c, -30, 34); ring(c, 12, 170); ring(c, -8, 170);
  });
  part('head', 220, 200, 90, 170, x => {            // 侧脸 + 带翅的官帽，转轴在脖子
    x.beginPath(); x.moveTo(-12, 0); x.lineTo(-14, -40); x.quadraticCurveTo(-30, -80, -10, -104); x.lineTo(30, -110); x.quadraticCurveTo(44, -96, 40, -78);
    x.lineTo(54, -62); x.lineTo(42, -56); x.quadraticCurveTo(46, -44, 38, -40); x.quadraticCurveTo(40, -28, 28, -22); x.lineTo(18, 0); x.closePath();
    x.moveTo(-34, -104); x.quadraticCurveTo(0, -150, 40, -112); x.lineTo(-34, -104);   // 帽顶
    x.moveTo(-20, -126); x.lineTo(-88, -136); x.lineTo(-90, -124); x.lineTo(-20, -114); x.closePath();   // 帽翅
  }, c => {
    c.beginPath(); c.ellipse(24, -70, 11, 3.5, -.1, 0, TAU); c.fill();                       // 眼
    c.lineWidth = 3; c.beginPath(); c.moveTo(6, -84); c.quadraticCurveTo(22, -92, 36, -86); c.stroke();   // 眉
    c.beginPath(); c.arc(-6, -62, 7, -1, 2.4); c.stroke();                                   // 耳
    for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(-24 + i * 12, -118, 3, 0, TAU); c.fill(); }   // 帽上小孔
    c.beginPath(); c.ellipse(-62, -130, 16, 3, -.14, 0, TAU); c.fill();
  });
  const arm = (name, len, sleeve) => part(name, 120, 160, 30, 20, x => {   // 大臂带宽袖，转轴在肩
    x.beginPath(); x.moveTo(-14, -6); x.lineTo(14, -6); x.lineTo(sleeve, len); x.lineTo(-sleeve + 10, len + 10); x.closePath();
  }, c => { c.lineWidth = 4; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-6 + i * 3, 20 + i * 18); c.lineTo(10 + i * 4, 20 + i * 18); c.stroke(); } ring(c, 0, len - 2, 7); });
  arm('upF', 92, 26); arm('upB', 92, 24);
  const fore = name => part(name, 100, 150, 30, 14, x => {   // 小臂 + 手，转轴在肘
    x.beginPath(); x.moveTo(-10, -4); x.lineTo(10, -4); x.lineTo(9, 84); x.quadraticCurveTo(24, 92, 18, 104); x.quadraticCurveTo(4, 110, -8, 98); x.lineTo(-9, 84); x.closePath();
  }, c => { c.lineWidth = 3; c.beginPath(); c.moveTo(-5, 76); c.lineTo(6, 76); c.stroke(); });
  fore('loF'); fore('loB');
  const leg = name => part(name, 120, 220, 30, 14, x => {   // 腿 + 尖头靴，转轴在胯
    x.beginPath(); x.moveTo(-14, -6); x.lineTo(14, -6); x.lineTo(12, 150); x.quadraticCurveTo(40, 150, 58, 140); x.quadraticCurveTo(54, 166, 20, 170); x.lineTo(-14, 170); x.closePath();
  }, c => { c.lineWidth = 3; c.beginPath(); c.moveTo(-6, 152); c.lineTo(30, 152); c.stroke(); });
  leg('legF'); leg('legB');
}
function drawPart(ctx, name, x, y, rot) { const p = PARTS[name]; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.drawImage(p.c, -p.ox, -p.oy); ctx.restore(); }
// 一只胳膊：肩 → 大臂 → 肘 → 小臂；返回手的位置（接操纵杆）
function armAt(ctx, side, sx, sy, a1, a2) {
  drawPart(ctx, 'up' + side, sx, sy, a1);
  const ex = sx - Math.sin(a1) * 90, ey = sy + Math.cos(a1) * 90; drawPart(ctx, 'lo' + side, ex, ey, a1 + a2);
  const b = a1 + a2; return [ex - Math.sin(b) * 96, ey + Math.cos(b) * 96];
}
function puppet(ctx, p) {
  // 身体坐标系里算各个关节，画在屏幕上；顺序：后腿、后胳膊、身子、头、前腿、前胳膊
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.s, p.s); ctx.rotate(p.tilt);
  ctx.shadowColor = 'rgba(30,8,4,.55)'; ctx.shadowBlur = 16;
  drawPart(ctx, 'legB', -8, 170, p.legB);
  const hB = armAt(ctx, 'B', -30, 34, p.armB[0], p.armB[1]);
  drawPart(ctx, 'body', 0, 0, 0);
  drawPart(ctx, 'head', 0, 0, p.head);
  drawPart(ctx, 'legF', 12, 170, p.legF);
  const hF = armAt(ctx, 'F', 34, 34, p.armF[0], p.armF[1]);
  // 操纵杆：从脖子和两只手一直伸到画面下面外边
  const m = ctx.getTransform(); ctx.restore();
  const pt = ([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  // 先记下来，等最前面那层海水纹画完再画杆：杆要斜着离开身子，不然黑杆贴在黑身子上、又被浪挡住，整根看不见
  return [[pt([6, 44]), -420, 6], [pt(hF), 230, 4], [pt(hB), -300, 4]];
}
function rods(ctx, list) {
  ctx.save(); ctx.strokeStyle = 'rgba(22,9,6,.9)'; ctx.lineCap = 'round'; ctx.shadowColor = 'rgba(30,8,4,.4)'; ctx.shadowBlur = 8;
  for (const [[x, y], dx, lw] of list) { ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, H + 60); ctx.stroke(); }
  ctx.restore();
}

// ---------- 幕布上沿：一排扇贝边的帘子，两角挂流苏 ----------
function valance(ctx, t) {
  const dy = lerp(-150, 0, E.outBack(seg(t, T.val, T.val + .6), 1.2)); ctx.save(); ctx.translate(0, dy);
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, 64);
  for (let x = W; x >= 0; x -= 80) ctx.arc(x - 40, 64, 40, 0, Math.PI);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = C.red; ctx.lineWidth = 5; ctx.setLineDash([14, 10]); ctx.beginPath(); ctx.moveTo(0, 50); ctx.lineTo(W, 50); ctx.stroke(); ctx.setLineDash([]);
  for (const [x, ph] of [[70, 0], [W - 70, 1.7]]) {   // 流苏：落下来以后晃几下停住
    const k = Math.max(0, t - T.val - .45), sw = .2 * Math.sin(k * 4.2 + ph) * Math.exp(-k * .9) + .03 * Math.sin(t * 1.3 + ph);
    ctx.save(); ctx.translate(x, 100); ctx.rotate(sw); ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(0, 60); ctx.stroke();
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(0, 66, 13, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-10, 76); ctx.lineTo(10, 76); ctx.lineTo(20, 150); ctx.lineTo(-20, 150); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.redD; ctx.lineWidth = 2; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 3, 80); ctx.lineTo(i * 6, 148); ctx.stroke(); }
    ctx.restore(); }
  ctx.restore();
}

let WAVES, CLOUDS, PETAL, DUST;
function walkPose(t) {
  const u = seg(t, T.walk0, T.walk1), x = lerp(-360, 760, 1 - (1 - u) ** 1.6), ph = (t - T.walk0) * 2.1 * Math.PI, go = u < 1 ? 1 : Math.exp(-(t - T.walk1) * 6);
  const sw = Math.sin(ph) * go;
  const p = { x, y: 540 - Math.abs(Math.sin(ph)) * 18 * go, s: 1.4, tilt: .05 * Math.sin(ph * 2) * go + .03, head: .05 * Math.sin(ph * 2 + .6) * go,
    legF: .38 * sw, legB: -.38 * sw, armF: [-.25 * sw + .25, -.35], armB: [.3 * sw - .1, -.25] };
  // 举手：前胳膊往上一扬，把团花「抖」开
  const r = E.outBack(seg(t, T.raise, T.raise + .55), 1.3), down = E.inOutC(seg(t, T.title + .2, T.title + 1.1));
  p.armF = [lerp(p.armF[0], -2.35, r * (1 - down * .55)), lerp(p.armF[1], -.25, r)];
  p.armB = [lerp(p.armB[0], .5, r * (1 - down)), p.armB[1]];
  // 谢幕：鞠一躬
  const b = Math.sin(Math.PI * seg(t, T.bow, T.bow + 1.1)); p.tilt += .22 * b; p.head += .18 * b;
  // 站定以后跟着灯火轻轻晃（皮影永远不完全静止）
  p.tilt += .012 * Math.sin(t * 2.3); p.y += 2 * Math.sin(t * 1.7);
  return p;
}

export default {
  width: W, height: H, fps: 30, duration: DUR,
  fonts: [[`400 180px ${BRUSH}`, TEXT.title + TEXT.seal], [`600 46px ${SERIF}`, TEXT.sub], [`600 34px ${SERIF}`, TEXT.en]],
  setup() {
    WAVES = [makeWave(240, C.redD, 300), makeWave(200, C.red, 240), makeWave(170, C.redL, 180)];
    CLOUDS = [makeCloud(1, C.red), makeCloud(.8, C.redD)];
    PETAL = makePetal(FLOWER.R); makePuppet();
    const r = rng(7); DUST = Array.from({ length: 70 }, () => ({ x: 300 + r() * 1300, y: r() * H, s: 1 + r() * 2.4, v: 8 + r() * 22, ph: r() * TAU }));
  },
  draw(ctx, t) {
    const L = lamp(t);
    // 幕布：油灯在后面照，中间最亮
    ctx.fillStyle = '#0A0302'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W * .47, H * .5, 0, W * .47, H * .5, 1150);
    g.addColorStop(0, '#FFE7B0'); g.addColorStop(.45, '#F4AE52'); g.addColorStop(.78, '#B9531B'); g.addColorStop(1, '#3A1206');
    ctx.globalAlpha = clamp(L); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    if (L > 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (L - 1) * .9; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (t < .8) { const w = (1 - seg(t, .3, .8)) * .5; ctx.fillStyle = `rgba(255,170,70,${w * (.6 + .4 * noise1(t * 12))})`; ctx.beginPath(); ctx.arc(W * .47, H * .62, 26, 0, TAU); ctx.fill(); }   // 点灯前只有一点火苗

    // 团花展开时的整体推近（全片唯一一次重拍）
    const punch = .018 * bump(t, T.open1 + .06, .12);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1 + punch, 1 + punch); ctx.translate(-W / 2, -H / 2);

    // 灯光里的浮尘
    ctx.fillStyle = `rgba(255,236,190,${.28 * clamp(L)})`;
    for (const d of DUST) { const y = ((d.y - t * d.v) % H + H) % H, x = d.x + 14 * Math.sin(t * .6 + d.ph); ctx.globalAlpha = .4 + .6 * noise1(t * .8 + d.ph); ctx.beginPath(); ctx.arc(x, y, d.s, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;

    // 祥云：从两边滑进来，然后慢慢漂
    for (const [i, cl] of CLOUDS.entries()) { const [x0, y0, from] = i ? [110, 560, -1] : [1600, 120, 1], u = E.outC(seg(t, T.clouds + i * .2, T.clouds + i * .2 + .9));
      ctx.save(); paperShadow(ctx); ctx.drawImage(cl.c, x0 + from * 520 * (1 - u) + 10 * Math.sin(t * .5 + i * 2), y0 + 4 * Math.sin(t * .8 + i)); ctx.restore(); }

    // 团花：先是叠起来的一瓣，然后一瓣瓣转开
    if (t > T.fold) {
      const pop = E.outBack(seg(t, T.fold, T.fold + .25)), u = E.outBack(seg(t, T.open0, T.open1), .9), spin = -Math.PI / 2 + .5 * (1 - u) + (t - T.open1) * .045 * (t > T.open1);
      ctx.save(); ctx.translate(FLOWER.x, FLOWER.y); ctx.scale(lerp(.5, 1, pop) * lerp(.85, 1, u), lerp(.5, 1, pop) * lerp(.85, 1, u)); ctx.rotate(spin); ctx.globalAlpha = clamp(pop * 1.5);
      paperShadow(ctx, .4, 8, 4);
      for (let k = 0; k < 8; k++) { ctx.save(); ctx.rotate(k * Math.PI / 4 * u); ctx.drawImage(PETAL.c, -PETAL.o, -PETAL.o); ctx.restore(); }
      ctx.restore();
    }

    // 后两层海水纹在皮影人后面，最前面一层挡住它的脚
    const wave = i => { const wv = WAVES[i], y0 = [835, 900, 968][i], rise = E.outC(seg(t, T.waves + i * .15, T.waves + i * .15 + .7)), sc = ((t * [12, -16, 20][i]) % wv.period + wv.period) % wv.period;
      ctx.save(); paperShadow(ctx, .5, 12, -4); ctx.drawImage(wv.c, -wv.period * 1.5 + sc, y0 + (1 - rise) * 320); ctx.restore(); };
    wave(0); wave(1);
    const rodList = t > T.walk0 ? puppet(ctx, walkPose(t)) : null;
    wave(2);
    if (rodList) rods(ctx, rodList);
    ctx.restore();

    // 书法大字：一个字一个字写出来（从左上往右下扫开），带一点墨色晕开
    ctx.save(); ctx.font = `400 180px ${BRUSH}`; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = C.ink;
    let x = 130; for (const [i, ch] of [...TEXT.title].entries()) { const w = ctx.measureText(ch).width, u = E.inOutC(seg(t, T.title + i * .3, T.title + i * .3 + .42));
      if (u > 0) { ctx.save(); ctx.beginPath(); ctx.moveTo(x - 20, 100); ctx.lineTo(x - 20 + (w + 120) * u, 100); ctx.lineTo(x - 80 + (w + 120) * u, 330); ctx.lineTo(x - 20, 330); ctx.closePath(); ctx.clip();
        ctx.shadowColor = 'rgba(22,9,6,.35)'; ctx.shadowBlur = 6 * (1 - u) + 1; ctx.fillText(ch, x, 290); ctx.restore(); }
      x += w + 4; }
    // 红印：重重盖下去，轻轻回弹
    const su = seg(t, T.seal, T.seal + .2);
    if (su > 0) { const sc = lerp(1.7, 1, E.outC(su)) * (1 - .06 * Math.sin(Math.PI * seg(t, T.seal + .2, T.seal + .45)));
      ctx.save(); ctx.translate(x + 92, 214); ctx.rotate(-.06); ctx.scale(sc, sc); ctx.globalAlpha = clamp(su * 2);
      ctx.fillStyle = C.red; ctx.beginPath(); ctx.roundRect(-62, -62, 124, 124, 10); ctx.fill();
      ctx.strokeStyle = C.cream; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(-52, -52, 104, 104, 6); ctx.stroke();
      ctx.fillStyle = C.cream; ctx.font = `400 92px ${BRUSH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(TEXT.seal, 0, 6); ctx.restore(); }
    // 小字
    const bu = E.outC(seg(t, T.sub, T.sub + .6));
    if (bu > 0) { ctx.globalAlpha = bu; ctx.fillStyle = C.brown; ctx.font = `600 46px ${SERIF}`; ctx.letterSpacing = '14px'; ctx.fillText(TEXT.sub, 138, 372 + 18 * (1 - bu));
      ctx.font = `600 34px ${SERIF}`; ctx.letterSpacing = "8px"; ctx.fillText(TEXT.en, 140, 432 + 18 * (1 - bu)); ctx.letterSpacing = '0px'; ctx.globalAlpha = 1; }
    ctx.restore();

    vignette(ctx, .5, '20,6,3');
    valance(ctx, t);
    grain(ctx, t, .04);
  },
  audio() {
    const m = new Mix(DUR + .3), B = 60 / 88;
    const pluck = (t, n, v = .12, pan = 0) => { m.tone(t, .9, hz(n), { wave: 'tri', vol: v, env: [.002, .3, .12, .5], vib: .008, pan }); m.tone(t, .5, hz(n + 12), { wave: 'sine', vol: v * .35, env: [.001, .2, .05, .3], pan }); };
    const block = (t, v = .2) => { m.tone(t, .05, 1250, { wave: 'sine', vol: v, env: [.001, .04, 0, .02] }); m.tone(t, .04, 1900, { wave: 'sine', vol: v * .4, env: [.001, .03, 0, .02] }); };
    m.tone(.2, DUR - .4, hz(36), { wave: 'sine', vol: .07, env: [1.5, .5, .9, 1] }); m.tone(.2, DUR - .4, hz(43), { wave: 'sine', vol: .04, env: [2, .5, .9, 1] });   // 低音铺底
    m.whoosh(T.lamp, .35, .06);
    // 五声音阶的拨弦，进场时一句
    const tune = [[0, 72], [1, 74], [1.5, 76], [2, 79], [3, 76], [3.5, 74], [4, 72], [5, 69]];
    for (const [b, n] of tune) pluck(.75 + b * B, n, .11, -.2);
    // 走路：每两步一声梆子
    for (let k = 0; k < 6; k++) block(T.walk0 + .25 + k * (1 / 1.05) * 1, .14);
    // 团花一瓣一声，往上走；全开时一记锣
    for (let k = 0; k < 8; k++) pluck(T.open0 + (T.open1 - T.open0) * k / 8, [67, 69, 72, 74, 76, 79, 81, 84][k], .09, (k - 3.5) / 6);
    m.tone(T.open1, 2.6, 110, { wave: 'sine', vol: .26, env: [.004, 2.4, 0, .6], slide: -.03 }); m.tone(T.open1, 2.4, 167, { wave: 'sine', vol: .1, env: [.004, 2.2, 0, .5] }); m.tone(T.open1, 1.8, 293, { wave: 'tri', vol: .04, env: [.004, 1.6, 0, .4], vib: .02 });
    // 写字：每个字一声轻轻的笔刷
    for (let i = 0; i < 4; i++) m.tone(T.title + i * .3, .32, 2400, { wave: 'noise', vol: .035, env: [.08, .2, .2, .08], slide: -.4 });
    m.thud(T.seal + .02, .45); block(T.seal + .02, .22);
    pluck(T.sub, 76, .08); pluck(T.bow + .1, 72, .1); pluck(T.bow + .5, 67, .08); pluck(T.bow + 1.1, 60, .1);
    m.echo(.23, .3, .25);
    return m.master();
  },
};
