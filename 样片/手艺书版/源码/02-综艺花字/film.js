// 综艺花字竖屏 · 主题「周一早上」。按 variety-captions.md 最小可行做法：彩色放射底 + 每拍一个花字时刻 + 每拍一个音效
import { clamp, lerp, seg, E, spring, rng, beats, Mix, backing } from './lib/core.js';
import { text, popText, fancyText, rrect, circle, burst, speedLines, grain, vignette } from './lib/draw.js';

const W = 1080, H = 1920, CX = 480;   // 竖屏：右边留 150 给抖音按钮，所以中线往左挪
const TEXT = { alarm: '闹钟响了', cap: '今天是……', boom: '周一！', sad: '不想上班', whisper: '（小声）但还是得去', end: '冲鸭打工人', stamp: '周一认证', show: '打工人日记' };
const FUN = '"ZCOOL KuaiLe", sans-serif', HAND = '"LXGW Marker Gothic", sans-serif';
const INK = {
  sun: { top: '#FFF7B0', bot: '#FFB800', outer: '#E8462B', deep: '#8A1E10' },
  red: { top: '#FFE0D6', bot: '#FF3B30', outer: '#1B1B1B', deep: '#000000' },
  sky: { top: '#E6FBFF', bot: '#22C8F5', outer: '#1543B8', deep: '#0A1F5C' },
};
const BG = { alarm: ['#FFD23F', '#FFB800'], cap: ['#FFD23F', '#FFB800'], boom: ['#FF4F6D', '#FF2A4A'], sad: ['#7FD6FF', '#4FB8F0'], end: ['#FFE3F1', '#FFB8DA'] };

const B = beats([['alarm', 1.7], ['cap', 1.4], ['boom', 1.8], ['sad', 1.7], ['end', 1.8]]);
const BOOM = B.boom.t0;

function stripes(ctx, t, [a, b]) {
  ctx.fillStyle = a; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(CX, 1000); ctx.rotate(t * .15); ctx.fillStyle = b;
  for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 2400, i / 18 * Math.PI * 2, (i + .5) / 18 * Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
const wig = (t, k = .03) => k * Math.sin(t * 7);            // 停留时轻微晃动
function clock(ctx, x, y, t) {
  const sh = Math.sin(t * 60) * .12;                        // 闹钟疯狂抖
  ctx.save(); ctx.translate(x, y); ctx.rotate(sh);
  for (const s of [-1, 1]) { ctx.save(); ctx.rotate(s * .6); circle(ctx, 0, -175, 52, '#E8462B'); ctx.restore(); }
  circle(ctx, 0, 0, 160, '#1B1B1B'); circle(ctx, 0, 0, 138, '#FFFFFF');
  ctx.strokeStyle = '#1B1B1B'; ctx.lineCap = 'round'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -95); ctx.moveTo(0, 0); ctx.lineTo(60, 30); ctx.stroke();
  circle(ctx, 0, 0, 14, '#E8462B'); ctx.restore();
  // 响铃的弧线
  ctx.strokeStyle = '#1B1B1B'; ctx.lineWidth = 12; ctx.lineCap = 'round';
  for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const r = 210 + i * 45 + 10 * Math.sin(t * 30); const c = s > 0 ? -.25 : Math.PI + .25; ctx.beginPath(); ctx.arc(x, y, r, c - .35, c + .35); ctx.stroke(); }
}
function drawAlarm(ctx, t) {
  const k = spring(t - .05, 2.6, .4); ctx.save(); ctx.translate(CX, 680); ctx.scale(k, k); clock(ctx, 0, 0, t); ctx.restore();
  popText(ctx, TEXT.alarm, CX, 1130, t, .35, { size: 190, font: FUN, weight: 400, color: '#1B1B1B', stroke: '#FFFFFF', strokeW: 30, tilt: .06 });
}
function drawCap(ctx, t) {
  const t0 = B.cap.t0, k = E.outBack(seg(t, t0, t0 + .35));
  ctx.save(); ctx.translate(CX, 1000); ctx.scale(k, k); ctx.rotate(-.03);
  rrect(ctx, -380, -90, 760, 180, 30, '#1B1B1B');
  const n = Math.floor(clamp((t - t0 - .2) * 14, 0, TEXT.cap.length));
  text(ctx, TEXT.cap.slice(0, n), -320, 0, { size: 96, font: FUN, weight: 400, color: '#FFE45E', align: 'left' }); ctx.restore();
  ctx.globalAlpha = E.outCubic(seg(t, t0 + .7, t0 + 1)); text(ctx, '（翻个身）', CX + 160, 1180, { size: 56, font: HAND, color: '#1B1B1B' }); ctx.globalAlpha = 1;
}
function drawBoom(ctx, t) {
  speedLines(ctx, CX, 1000, Math.floor(t * 15), 'rgba(255,255,255,.75)', 40, 380);
  const p = seg(t, BOOM, BOOM + .7); burst(ctx, CX, 1000, 430 * E.outElastic(p), 14, '#FFE45E', '#1B1B1B', t * .3);
  const k = spring(t - BOOM - .05, 3, .38); ctx.save(); ctx.translate(CX, 1000); ctx.scale(k, k);
  fancyText(ctx, TEXT.boom, 0, 0, 260, INK.red, { rot: -.08 + wig(t), font: FUN, weight: 400 }); ctx.restore();
}
function sweat(ctx, x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath(); ctx.moveTo(0, -46); ctx.bezierCurveTo(26, -10, 30, 10, 0, 30); ctx.bezierCurveTo(-30, 10, -26, -10, 0, -46); ctx.fillStyle = '#E6FBFF'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = '#1543B8'; ctx.stroke(); ctx.restore(); }
function drawSad(ctx, t) {
  const t0 = B.sad.t0, k = spring(t - t0, 2.4, .45);
  ctx.save(); ctx.translate(CX, 900); ctx.scale(k, k); fancyText(ctx, TEXT.sad, 0, 0, 190, INK.sky, { rot: .04 + wig(t, .02), font: FUN, weight: 400 }); ctx.restore();
  [[CX + 330, 760, .1], [CX + 400, 830, .3], [CX - 360, 790, .5]].forEach(([x, y, d]) => { const u = seg(t, t0 + .3 + d, t0 + 1.3 + d); if (u > 0) { ctx.globalAlpha = 1 - u * .6; sweat(ctx, x, y + E.inQ(u) * 120, 1.3); ctx.globalAlpha = 1; } });
  const n = Math.floor(clamp((t - t0 - .6) * 12, 0, TEXT.whisper.length));
  text(ctx, TEXT.whisper.slice(0, n), CX + 20, 1130, { size: 64, font: HAND, color: '#0A1F5C' });
}
function drawEnd(ctx, t) {
  const t0 = B.end.t0, k = spring(t - t0, 2.6, .42);
  ctx.save(); ctx.translate(CX, 900); ctx.scale(k, k); fancyText(ctx, TEXT.end, 0, 0, 170, INK.sun, { rot: -.04 + wig(t, .02), font: FUN, weight: 400 }); ctx.restore();
  // 印章：从 2.2 倍砸下来，落地带一点回弹
  const st = t0 + .55; if (t > st) {
    const u = seg(t, st, st + .14), s = lerp(2.2, 1, E.inQ(u)) * (1 + .06 * Math.exp(-(t - st - .14) * 14) * (t > st + .14 ? 1 : 0));
    ctx.save(); ctx.translate(CX + 160, 1180); ctx.rotate(-.18); ctx.scale(s, s); ctx.globalAlpha = Math.min(1, u * 3) * .92;
    ctx.strokeStyle = '#D7263D'; ctx.lineWidth = 12; ctx.beginPath(); ctx.roundRect(-200, -70, 400, 140, 18); ctx.stroke(); ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(-182, -52, 364, 104, 12); ctx.stroke();
    text(ctx, TEXT.stamp, 0, 4, { size: 76, font: FUN, weight: 400, color: '#D7263D' }); ctx.restore(); ctx.globalAlpha = 1;
  }
}
function showTag(ctx, t) {   // 左上角栏目牌，贯穿全片（避开顶部 220 安全区）
  const k = E.outBack(seg(t, .1, .5)); ctx.save(); ctx.translate(lerp(-300, 60, k), 270);
  rrect(ctx, 0, 0, 300, 76, 38, '#1B1B1B'); circle(ctx, 40, 38, 14, '#FF3B30'); text(ctx, TEXT.show, 170, 40, { size: 40, font: FUN, weight: 400, color: '#FFFFFF' }); ctx.restore();
}

export default {
  width: W, height: H, fps: 30, duration: B.duration,
  fonts: [['400 100px "ZCOOL KuaiLe"', Object.values(TEXT).join('') + '翻个身'], ['400 100px "LXGW Marker Gothic"', TEXT.whisper + '（翻个身）']],
  draw(ctx, t) {
    const name = ['alarm', 'cap', 'boom', 'sad', 'end'].find(n => t < B[n].t1) || 'end';
    // 冲击时刻：放大 + 震屏（只在「周一！」这一下）
    const d = t - BOOM, shake = d > 0 ? 26 * Math.max(0, 1 - d / .4) : 0, punch = d > 0 ? .1 * Math.max(0, 1 - d / .25) : 0, r = rng(Math.floor(t * 30));
    ctx.save(); ctx.translate((r() - .5) * 2 * shake, (r() - .5) * 2 * shake); ctx.translate(CX, 1000); ctx.scale(1 + punch, 1 + punch); ctx.translate(-CX, -1000);
    stripes(ctx, t, BG[name]);
    ({ alarm: drawAlarm, cap: drawCap, boom: drawBoom, sad: drawSad, end: drawEnd })[name](ctx, t);
    ctx.restore();
    if (d > 0 && d < 1 / 30) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); }   // 一帧闪白
    showTag(ctx, t); grain(ctx, t, .03); vignette(ctx, .18);
  },
  audio() {
    const m = new Mix(B.duration + .3); backing(m, B.duration, { bpm: 126, root: 60 });
    for (let i = 0; i < 12; i++) m.tone(.1 + i * .1, .06, 2100, { wave: 'square', vol: .05 });   // 闹钟铃
    for (let i = 0; i < TEXT.alarm.length; i++) m.pop(.35 + i * 2 / 30, .16);
    m.boing(B.cap.t0); m.whoosh(BOOM - .3, .3); m.thud(BOOM); m.boing(B.sad.t0, .15); m.ding(B.end.t0); m.thud(B.end.t0 + .69, .5);
    m.echo(); return m.master();
  },
};
