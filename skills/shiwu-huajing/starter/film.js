// 你的片子写在这里。这是一个 8.5 秒的小示例，演示写法：节拍表 → 每一拍画什么 → 配乐。
// 换成你自己的内容时：改 TEXT、PALETTE、节拍表，再按风格卡重写每一拍的画法。不要只换字就交差。
// 这支示例用到了 references/07-动画手艺进阶.md 里的手法：快动作加动态模糊、弧线、物理弹簧、慢快慢平移、
// 感知缩放、反向动作（影子）、元素带转场、镜头慢推和冲击、音效比画面早半帧。
import { clamp, lerp, seg, E, squash, beats, Mix, backing } from './lib/core.js';
import { SANS, text, popText, circle, rrect, grain, vignette } from './lib/draw.js';
import { camera, idle, arc, nudge, pscale, springTo, SPRINGS, blur, revealClip } from './lib/motion.js';

const W = 1920, H = 1080, FPS = 30;
const TEXT = { title: '每天进步一点点', sub: 'A LITTLE BETTER EVERY DAY', end: 'tinystep' };
const PALETTE = { bg: '#0E7C66', bg2: '#FFF6E9', hero: '#FF6B35', ink: '#14213D', yellow: '#FFD166' };

// 节拍表：名字和时长（秒）。所有动画都用 B.xxx.t0 / t1 来定位，改时长只改这里
const B = beats([['hook', 1.4], ['title', 2.6], ['wipe', .5], ['grow', 2.2], ['end', 1.8]]);
const LAND = B.hook.t0 + .55;   // 圆点落地的时刻，画面、镜头、音效都对它

function dropY(t) { return t < LAND ? lerp(-80, 640, E.inQ(seg(t, 0, .55))) : 640; }
function drawDot(ctx, t) {
  const [sx, sy] = squash(t, LAND, .28), y = dropY(t);
  // 下落越快拉得越长（速度感），落地压扁
  const stretch = t < LAND ? 1 + .25 * E.inQ(seg(t, 0, .55)) : 1;
  ctx.save(); ctx.translate(960, y); ctx.scale(sx / Math.sqrt(stretch), sy * stretch); circle(ctx, 0, -60, 60, PALETTE.hero); ctx.restore();
}
function drawHook(ctx, t) {
  // 反向动作：圆点越近，地上的影子越大越实
  const y = dropY(t); ctx.globalAlpha = .25 * clamp(y / 640); ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(960, 645, 70 * clamp(y / 640), 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  // 动态模糊只给最快的最后 0.25 秒（每帧移动远大于圆点自身大小），落地那一帧清楚
  if (t > LAND - .25 && t < LAND) blur(ctx, t, FPS, (c, tt) => drawDot(c, Math.min(tt, LAND - 1e-3)), { box: [860, 0, 200, 720], frames: 1 });   // frames: 1 相当于 180° 快门，拖影短一点、更利落
  else drawDot(ctx, t);
}
function titleLift(t) { return -70 * nudge(t, B.title.t0 + 1.2, .7); }   // 标题整体上挪给副标题让位：慢快慢
function dotPos(t) {
  // 圆点沿弧线跳到标题上方，物理弹簧（swing）带一点摆
  const k = springTo(t - B.title.t0, SPRINGS.swing), [x, y] = arc(clamp(k, 0, 1.2), [960, 580], [1380, 330], -.35);
  return [x, y + titleLift(t), 60 * lerp(1, .55, clamp(k))];
}
function drawTitle(ctx, t) {
  const lift = titleLift(t), [dx, dy, dr] = dotPos(t);
  circle(ctx, dx, dy, dr, PALETTE.hero);
  popText(ctx, TEXT.title, 960, 500 + lift, t, B.title.t0 + .15, { size: 150, color: PALETTE.bg2, weight: 900 });
  // 副标题在平移的「冲刺段」里出现，被动作带出来
  const u = E.outC(seg(t, B.title.t0 + 1.35, B.title.t0 + 1.8)); ctx.globalAlpha = u;
  text(ctx, TEXT.sub, 960, 640 + lift + (1 - u) * 30, { size: 44, weight: 700, color: PALETTE.bg2 }); ctx.globalAlpha = 1;
}
function drawWipe(ctx, t) {
  // 元素带转场：圆点放大铺满，成为下一场的底色。用感知缩放：看起来是匀速长大，而不是越大越慢
  drawTitle(ctx, t); const [dx, dy] = dotPos(t), u = E.inC(seg(t, B.wipe.t0, B.wipe.t1));
  circle(ctx, dx, dy, pscale(33, 2400, u), PALETTE.bg2);
}
function barH(t, i) { return 420 * [.3, .45, .6, .78, 1][i] * springTo(t - B.grow.t0 - i * 3 / 30, SPRINGS.smooth); }
function drawGrow(ctx, t) {
  ctx.fillStyle = PALETTE.bg2; ctx.fillRect(0, 0, W, H);
  const cols = [PALETTE.yellow, PALETTE.yellow, PALETTE.bg, PALETTE.bg, PALETTE.hero];
  for (let i = 0; i < 5; i++) { const bh = barH(t, i); rrect(ctx, 660 + i * 130, 760 - bh, 90, bh, 18, cols[i]); }
  // 小球从左边弧线飞到最高的柱子上，落下时用 jump 弹簧
  const k = springTo(t - B.grow.t0 - .45, SPRINGS.jump), [x, y] = arc(clamp(k, 0, 1.1), [520, 900], [1225, 760 - 420 - 40], .3);
  if (k > 0) circle(ctx, x, Math.min(y, 760 - barH(t, 4) - 40), 40, PALETTE.hero);
}
function drawEnd(ctx, t) {
  // 结尾不是硬切：最高柱子上的小球放大成结尾的底色（圆形揭开），品牌名停住时带一点漂浮
  const u = E.inOutC(seg(t, B.end.t0, B.end.t0 + .45));
  if (u < 1) drawGrow(ctx, t);
  ctx.save(); revealClip(ctx, 'iris', u, { x: 1225, y: 300 }); ctx.fillStyle = PALETTE.ink; ctx.fillRect(0, 0, W, H);
  const k = springTo(t - B.end.t0 - .2, SPRINGS.plop), f = idle(t, 5, 5);
  ctx.save(); ctx.translate(960 + f.x, 520 + f.y); ctx.rotate(f.r); ctx.scale(k * f.s, k * f.s); text(ctx, TEXT.end, 0, 0, { size: 170, weight: 800, color: PALETTE.bg2 }); ctx.restore();
  circle(ctx, 960 + 330, 470, 26 * clamp(k, 0, 1.3), PALETTE.hero); ctx.restore();
}

export default {
  width: W, height: H, fps: FPS, duration: B.duration,
  fonts: [[`900 100px ${SANS}`, Object.values(TEXT).join('')]],
  // 整帧动态模糊：只开在圆点铺满画面那一下（最快的转场）
  motionBlur: { windows: [[B.wipe.t0 + .25, B.wipe.t1]], samples: 32 },   // 边缘每帧走几百像素，采样少了会看到一圈圈台阶
  draw(ctx, t) {
    ctx.fillStyle = PALETTE.bg; ctx.fillRect(0, 0, W, H);
    // 镜头：全片慢推 4%；落地、标题、结尾亮相各冲击一次，对在音效上
    camera(ctx, t, { push: [0, B.duration, 1, 1.04], punch: [[LAND, .05], [B.title.t0 + .15, .04], [B.end.t0 + .2, .05]], shake: [[LAND, 10]] });
    if (t < B.hook.t1) drawHook(ctx, t);
    else if (t < B.title.t1) drawTitle(ctx, t);
    else if (t < B.wipe.t1) drawWipe(ctx, t);
    else if (t < B.grow.t1) drawGrow(ctx, t);
    else drawEnd(ctx, t);
    ctx.restore();   // 和 camera 配对
    grain(ctx, t, .04); vignette(ctx, .25);
  },
  audio() {
    // 音效比画面早 15 毫秒（耳朵比眼睛快），听起来才「对上」
    const m = new Mix(B.duration + .3), a = -.015; backing(m, B.duration, { bpm: 118, root: 62 });
    m.thud(LAND + a); m.pop(B.title.t0 + .15 + a); m.whoosh(B.wipe.t0, .5); for (let i = 0; i < 5; i++) m.pop(B.grow.t0 + i * 3 / 30 + a, .12);
    m.boing(B.grow.t0 + .75 + a, .14); m.ding(B.end.t0 + .2 + a);
    m.echo(); return m.master();
  },
};
