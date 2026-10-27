// 线条一笔画 · 虚构品牌「山间茶事 MOUNTAIN TEA」。原版语法：一根线从左下出发不断地画（嫩芽 → 茶屋 → 群山 → 茶杯 → 收尾卷曲），
// 笔头一个发光点；深蓝黑底、细线、一种颜色、大量留白；结尾一个实心圆形标志 + 字距拉开的衬线字。
import { clamp, lerp, seg, E, Mix } from './lib/core.js';
import { grain, vignette } from './lib/draw.js';

const W = 1920, H = 1080, G = 780;    // G：地面线
const C = { bg0: '#16273A', bg1: '#0A121C', line: '#A8E6D2', glow: 'rgba(168,230,210,', fill: '#A8E6D2', dark: '#0E1A27' };
const TEXT = { en: 'MOUNTAIN TEA', cn: '山 间 茶 事' };
const SERIF = '"Didot", "Bodoni 72", "Times New Roman", serif', SONG = '"Songti SC", "STSong", "Noto Serif SC", serif';
const DRAW_END = 6.4, DUR = 9;

// ---------- 一根线：用直线 / 二次 / 三次曲线拼起来，采样成点 ----------
const PTS = []; let cur = [0, 0];
const M = (x, y) => { cur = [x, y]; PTS.push([x, y]); };
const L = (x, y) => { for (let i = 1; i <= 20; i++) { const u = i / 20; PTS.push([lerp(cur[0], x, u), lerp(cur[1], y, u)]); } cur = [x, y]; };
const Q = (cx, cy, x, y) => { const [x0, y0] = cur; for (let i = 1; i <= 24; i++) { const u = i / 24, a = (1 - u) ** 2, b = 2 * u * (1 - u), c = u * u; PTS.push([a * x0 + b * cx + c * x, a * y0 + b * cy + c * y]); } cur = [x, y]; };
const Cb = (c1x, c1y, c2x, c2y, x, y) => { const [x0, y0] = cur; for (let i = 1; i <= 32; i++) { const u = i / 32, a = (1 - u) ** 3, b = 3 * u * (1 - u) ** 2, c = 3 * u * u * (1 - u), d = u ** 3; PTS.push([a * x0 + b * c1x + c * c2x + d * x, a * y0 + b * c1y + c * c2y + d * y]); } cur = [x, y]; };
// 嫩芽
M(120, G); L(250, G);
const leaf = (x, y, dir, s = 1) => { Cb(x + dir * 18 * s, y - 34 * s, x + dir * 56 * s, y - 40 * s, x + dir * 70 * s, y - 30 * s); Cb(x + dir * 52 * s, y - 2 * s, x + dir * 22 * s, y + 4 * s, x, y); };
Q(246, G - 50, 256, G - 70); leaf(256, G - 70, 1); Q(262, G - 95, 258, G - 120); leaf(258, G - 120, -1, .9); Q(254, G - 145, 264, G - 168); leaf(264, G - 168, 1, .75);
Cb(268, G - 190, 286, G - 200, 282, G - 214);
Cb(300, G - 160, 300, G - 40, 330, G); L(380, G);
// 茶屋：墙 → 飞檐屋顶 → 墙 → 门 → 回到地面
L(440, G); L(440, G - 150); L(404, G - 150); Q(470, G - 168, 540, G - 250); Q(610, G - 168, 676, G - 150); L(640, G - 150); L(640, G);
L(580, G); L(580, G - 80); Q(555, G - 112, 530, G - 80); L(530, G); L(720, G);
// 群山
L(770, G); L(880, G - 210); L(930, G - 150); L(1040, G - 330); L(1090, G - 260); L(1130, G - 300); L(1250, G - 110); L(1300, G - 160); L(1380, G);
// 茶杯：左壁 → 杯口 → 把手 → 右壁 → 地面 → 收尾卷曲
L(1440, G); Q(1404, G - 40, 1406, G - 120); L(1610, G - 120); Cb(1680, G - 124, 1684, G - 34, 1606, G - 50); Q(1600, G - 6, 1572, G); L(1720, G);
Cb(1790, G, 1800, G - 80, 1760, G - 86); Cb(1724, G - 92, 1730, G - 40, 1770, G - 46);
const LEN = [0]; for (let i = 1; i < PTS.length; i++) LEN.push(LEN[i - 1] + Math.hypot(PTS[i][0] - PTS[i - 1][0], PTS[i][1] - PTS[i - 1][1])); const TOTAL = LEN[LEN.length - 1];

function drawUpTo(ctx, len) {
  ctx.beginPath(); ctx.moveTo(...PTS[0]); let i = 1; for (; i < PTS.length && LEN[i] <= len; i++) ctx.lineTo(...PTS[i]);
  let tip = PTS[i - 1]; if (i < PTS.length) { const u = (len - LEN[i - 1]) / (LEN[i] - LEN[i - 1]); tip = [lerp(PTS[i - 1][0], PTS[i][0], u), lerp(PTS[i - 1][1], PTS[i][1], u)]; ctx.lineTo(...tip); }
  ctx.stroke(); return tip;
}
function steam(ctx, t) {   // 杯口的热气：独立的淡线，慢慢往上飘（不抢主线）
  const k = seg(t, 5.6, 6.4); if (k <= 0) return; ctx.save(); ctx.globalAlpha = .55 * k; ctx.strokeStyle = C.line; ctx.lineWidth = 2;
  for (let s = 0; s < 3; s++) { ctx.beginPath(); for (let j = 0; j < 30; j++) { const y = G - 140 - j * 5, x = 1470 + s * 50 + Math.sin(j * .25 - t * 2.4 + s) * 10; j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); } ctx.restore();
}
function logo(ctx, t) {   // 圆形标志：圆里挖出一片茶叶
  const k = E.outC(seg(t, 6.3, 7.1)); if (k <= 0) return; const cx = 960, cy = 280, r = 104 * (.85 + .15 * k);
  ctx.save(); ctx.globalAlpha = k; ctx.shadowColor = C.glow + '.5)'; ctx.shadowBlur = 30; ctx.fillStyle = C.fill; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = C.dark; ctx.beginPath(); ctx.moveTo(cx - 40, cy + 50); ctx.bezierCurveTo(cx - 60, cy - 20, cx + 10, cy - 70, cx + 46, cy - 56); ctx.bezierCurveTo(cx + 50, cy + 10, cx - 10, cy + 56, cx - 40, cy + 50); ctx.fill();
  ctx.strokeStyle = C.fill; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - 34, cy + 40); ctx.quadraticCurveTo(cx, cy - 6, cx + 36, cy - 44); ctx.stroke(); ctx.restore();
}
function title(ctx, t) {
  const a = E.outC(seg(t, 7, 7.8)), b = E.outC(seg(t, 7.3, 8.1)); ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.globalAlpha = a; ctx.fillStyle = '#E8F4EF'; ctx.font = `400 46px ${SERIF}`; ctx.letterSpacing = `${lerp(30, 16, a)}px`; ctx.fillText(TEXT.en, 968, 900);
  ctx.globalAlpha = b; ctx.font = `400 24px ${SONG}`; ctx.letterSpacing = '6px'; ctx.fillStyle = 'rgba(232,244,239,.7)'; ctx.fillText(TEXT.cn, 963, 960);
  ctx.fillRect(820, 958, 60, 1); ctx.fillRect(1046, 958, 60, 1); ctx.restore();
}

export default {
  width: W, height: H, fps: 30, duration: DUR,
  fonts: [[`400 24px ${SONG}`, TEXT.cn]],
  draw(ctx, t) {
    const g = ctx.createRadialGradient(960, 500, 0, 960, 500, 1200); g.addColorStop(0, C.bg0); g.addColorStop(1, C.bg1); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const z = 1.06 - .06 * E.inOutC(seg(t, 0, DUR)); ctx.save(); ctx.translate(960, 560); ctx.scale(z, z); ctx.translate(-960, -560);
    // 画线速度：起笔慢一点，中段匀速，收笔慢下来
    const u = seg(t, .2, DRAW_END), len = TOTAL * (u < .08 ? .5 * (u / .08) ** 2 * .08 : u > .92 ? 1 - .5 * ((1 - u) / .08) ** 2 * .08 : u - .04);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = C.glow + '.18)'; ctx.lineWidth = 9; drawUpTo(ctx, len);
    ctx.strokeStyle = C.line; ctx.lineWidth = 2.6; const tip = drawUpTo(ctx, len);
    steam(ctx, t); logo(ctx, t);
    if (t < DRAW_END + .4) { const k = 1 - seg(t, DRAW_END, DRAW_END + .4), gl = ctx.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], 40); gl.addColorStop(0, `rgba(255,250,230,${.95 * k})`); gl.addColorStop(.25, C.glow + (.5 * k) + ')'); gl.addColorStop(1, C.glow + '0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(tip[0], tip[1], 40, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore(); title(ctx, t);
    vignette(ctx, .35); grain(ctx, t, .035);
  },
  audio() {
    const m = new Mix(DUR + .5), scale = [62, 64, 67, 69, 71, 74, 76, 79];
    m.tone(0, DUR - .5, 98, { wave: 'sine', vol: .06, env: [2, .1, 1, 1.5] }); m.tone(0, DUR - .5, 146.8, { wave: 'tri', vol: .025, env: [2.5, .1, 1, 1.5] });
    for (let i = 0; i < 24; i++) { const n = scale[(i * 3 + (i >> 2)) % scale.length]; m.tone(.3 + i * .27, .5, 440 * 2 ** ((n - 69) / 12), { wave: 'sine', vol: .05, env: [.005, .25, .1, .6], pan: Math.sin(i) * .4 }); }
    m.whoosh(6.1, 1, .05); [74, 79, 83, 86].forEach((n, i) => m.tone(6.4 + i * .09, 1.2, 440 * 2 ** ((n - 69) / 12), { vol: .06, env: [.005, .4, .2, 1] }));
    m.echo(.32, .35, .3); return m.master();
  },
};
