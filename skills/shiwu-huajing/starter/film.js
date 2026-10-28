// 你的片子写在这里。这是一个 8.5 秒的小示例，演示写法：节拍表 → 每一拍画什么 → 配乐。
// 换成你自己的内容时：改 TEXT、PALETTE、节拍表，再按风格卡重写每一拍的画法。不要只换字就交差。
import { clamp, lerp, seg, E, spring, squash, beats, Mix, backing, hz } from './lib/core.js';
import { SANS, text, popText, circle, rrect, grain, vignette } from './lib/draw.js';

const W = 1920, H = 1080;
const TEXT = { title: '每天进步一点点', sub: 'A LITTLE BETTER EVERY DAY', end: 'tinystep' };
const PALETTE = { bg: '#0E7C66', bg2: '#FFF6E9', hero: '#FF6B35', ink: '#14213D', yellow: '#FFD166' };

// 节拍表：名字和时长（秒）。所有动画都用 B.xxx.t0 / t1 来定位，改时长只改这里
const B = beats([['hook', 1.4], ['title', 2.6], ['wipe', .5], ['grow', 2.2], ['end', 1.8]]);

function drawHook(ctx, t) {
  // 一颗圆点从上面掉下来：下落用 inQ 加速，落地瞬间挤压拉伸
  const land = B.hook.t0 + .55, y = t < land ? lerp(-80, 640, E.inQ(seg(t, 0, .55))) : 640;
  const [sx, sy] = squash(t, land, .28);
  ctx.save(); ctx.translate(960, y); ctx.scale(sx, sy); circle(ctx, 0, -60, 60, PALETTE.hero); ctx.restore();
  // 落地的阴影：离地越高越小越淡
  ctx.globalAlpha = .25 * clamp(y / 640); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(960, 645, 70 * clamp(y / 640), 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
}
function drawTitle(ctx, t) {
  // 圆点弹到标题上方当「点」，标题逐字弹出，副标题晚一点淡入上移
  const k = spring(t - B.title.t0, 2.6, .45); circle(ctx, 960, lerp(580, 330, k), 60 * lerp(1, .55, k), PALETTE.hero);
  popText(ctx, TEXT.title, 960, 500, t, B.title.t0 + .15, { size: 150, color: PALETTE.bg2, weight: 900 });
  const u = E.outC(seg(t, B.title.t0 + .9, B.title.t0 + 1.4)); ctx.globalAlpha = u;
  text(ctx, TEXT.sub, 960, 660 + (1 - u) * 20, { size: 40, weight: 700, color: PALETTE.yellow }); ctx.globalAlpha = 1;
}
function drawWipe(ctx, t) {
  // 转场：圆点放大铺满画面，变成下一场的底色（元素带转场）
  drawTitle(ctx, t); const r = E.inC(seg(t, B.wipe.t0, B.wipe.t1)) * 2300; circle(ctx, 960, 330, Math.max(33, r), PALETTE.bg2);
}
function drawGrow(ctx, t) {
  // 五根柱子错峰长出来（每根晚 3 帧），每根带一点回弹
  ctx.fillStyle = PALETTE.bg2; ctx.fillRect(0, 0, W, H);
  const hs = [.3, .45, .6, .78, 1], cols = [PALETTE.yellow, PALETTE.yellow, PALETTE.bg, PALETTE.bg, PALETTE.hero];
  hs.forEach((h, i) => { const k = spring(t - B.grow.t0 - i * 3 / 30, 2.4, .5), bh = 420 * h * k; rrect(ctx, 660 + i * 130, 760 - bh, 90, bh, 18, cols[i]); });
  const k = spring(t - B.grow.t0 - .5, 2.4, .5); circle(ctx, 1180 + 45, 760 - 420 * k - 70, 40 * k, PALETTE.hero);
}
function drawEnd(ctx, t) {
  // 结尾：品牌名 + 停住，带一点呼吸
  ctx.fillStyle = PALETTE.ink; ctx.fillRect(0, 0, W, H);
  const k = spring(t - B.end.t0, 2.2, .5), br = 1 + .015 * Math.sin((t - B.end.t0) * 4);
  ctx.save(); ctx.translate(960, 520); ctx.scale(k * br, k * br); text(ctx, TEXT.end, 0, 0, { size: 170, weight: 800, color: PALETTE.bg2 }); ctx.restore();
  circle(ctx, 960 + 330, 470, 26 * k, PALETTE.hero);
}

export default {
  width: W, height: H, fps: 30, duration: B.duration,
  fonts: [[`900 100px ${SANS}`, Object.values(TEXT).join('')]],
  draw(ctx, t) {
    ctx.fillStyle = PALETTE.bg; ctx.fillRect(0, 0, W, H);
    if (t < B.hook.t1) drawHook(ctx, t);
    else if (t < B.title.t1) drawTitle(ctx, t);
    else if (t < B.wipe.t1) drawWipe(ctx, t);
    else if (t < B.grow.t1) drawGrow(ctx, t);
    else drawEnd(ctx, t);
    grain(ctx, t, .04); vignette(ctx, .25);
  },
  audio() {
    const m = new Mix(B.duration + .3); backing(m, B.duration, { bpm: 118, root: 62 });
    m.thud(B.hook.t0 + .55); m.pop(B.title.t0 + .15); m.whoosh(B.wipe.t0, .5); for (let i = 0; i < 5; i++) m.pop(B.grow.t0 + i * 3 / 30, .12); m.ding(B.end.t0);
    m.echo(); return m.master();
  },
};
