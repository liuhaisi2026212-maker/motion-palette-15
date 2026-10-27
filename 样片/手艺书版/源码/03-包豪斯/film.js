// 包豪斯 5 秒片头 · 虚构品牌「形意周 FORM WEEK」。按 bauhaus.md：基础几何、红黄蓝黑+纸、120px 网格、每拍一个动作、禁止回弹
import { clamp, lerp, seg, E, Mix } from './lib/core.js';
import { text, grain, vignette } from './lib/draw.js';

const W = 1920, H = 1080, M = 120, BPM = 120, BEAT = 60 / BPM;
const TEXT = { name: '形意周', cap: 'FORM WEEK  ·  2026  ·  SHANGHAI', tag: '形状会说话' };
const C = { paper: '#F1E9DA', red: '#E03C31', yellow: '#F2B705', blue: '#1E4FA3', black: '#111111' };
const HEAVY = '"PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif';
const beatP = (t, k, dur = BEAT * .6) => E.inOutQ(seg(t, k * BEAT, k * BEAT + dur));   // 第 k 拍的动作进度

function rotAbout(ctx, px, py, ang, draw) { ctx.save(); ctx.translate(px, py); ctx.rotate(ang); ctx.translate(-px, -py); draw(); ctx.restore(); }
function quarter(ctx, x, y, r, a0, fill) { ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, a0, a0 + Math.PI / 2); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }

function grid(ctx, t) {   // 第 0 拍：网格线从左上依次画出
  const p = beatP(t, 0, BEAT); ctx.strokeStyle = 'rgba(17,17,17,.08)'; ctx.lineWidth = 2;
  for (let i = 1; i < 16; i++) { ctx.beginPath(); ctx.moveTo(i * M, 0); ctx.lineTo(i * M, H * clamp(p * 1.6 - i * .04)); ctx.stroke(); }
  for (let j = 1; j < 9; j++) { ctx.beginPath(); ctx.moveTo(0, j * M); ctx.lineTo(W * clamp(p * 1.6 - j * .06), j * M); ctx.stroke(); }
}
// 印刷错位：同一个形状先用别的颜色偏 2px 画一层淡的
const mis = (ctx, fn) => { ctx.save(); ctx.globalAlpha = .18; ctx.translate(3, 2); fn(true); ctx.restore(); fn(false); };

function shapes(ctx, t) {
  // 1 拍：红圆从画面上方落到网格位
  const p1 = beatP(t, 1); if (p1 > 0) mis(ctx, g => { ctx.beginPath(); ctx.arc(9 * M, lerp(-2 * M, 3.5 * M, p1), 1.5 * M, 0, Math.PI * 2); ctx.fillStyle = g ? C.blue : C.red; ctx.fill(); });
  // 2 拍：黄三角从右边滑进来（滑整 4 格）
  const p2 = beatP(t, 2); if (p2 > 0) { const dx = lerp(4 * M, 0, p2); mis(ctx, g => { ctx.beginPath(); ctx.moveTo(11 * M + dx, M); ctx.lineTo(14 * M + dx, M); ctx.lineTo(14 * M + dx, 4 * M); ctx.closePath(); ctx.fillStyle = g ? C.red : C.yellow; ctx.fill(); }); }
  // 3 拍：蓝方块绕左下角翻 90° 落下；6 拍再向右滑 1 格
  const p3 = beatP(t, 3), p6 = beatP(t, 6); if (p3 > 0) { const x = 11 * M + p6 * M; rotAbout(ctx, x, 6 * M, lerp(-Math.PI / 2, 0, p3), () => mis(ctx, g => { ctx.fillStyle = g ? C.yellow : C.blue; ctx.fillRect(x, 4 * M, 2 * M, 2 * M); })); }
  // 4 拍：黑条从左到右横扫
  const p4 = beatP(t, 4); if (p4 > 0) { ctx.fillStyle = C.black; ctx.fillRect(5 * M, 7 * M, 10 * M * p4, .34 * M); }
  // 5 拍：红色四分之一圆绕角点转出来（站在黑条上）
  const p5 = beatP(t, 5); if (p5 > 0) rotAbout(ctx, 6 * M, 7 * M, lerp(-Math.PI / 2, 0, p5), () => quarter(ctx, 6 * M, 7 * M, 2 * M, -Math.PI / 2, C.red));
  // 4 个小黑点：第 6 拍一起出现，像乐谱
  if (t > 6 * BEAT) for (let i = 0; i < 4; i++) { const k = clamp((t - 6 * BEAT - i * .06) / .12); ctx.fillStyle = C.black; ctx.beginPath(); ctx.arc(12 * M + i * .5 * M, 1.5 * M, .12 * M * k, 0, Math.PI * 2); ctx.fill(); }
}
function type(ctx, t) {
  // 7、8、9 拍：竖排大字一个字一个字落位（硬切出现 + 从上滑 1 格，不回弹）
  [...TEXT.name].forEach((ch, i) => { const p = beatP(t, 7 + i * .5, BEAT * .4); if (p <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(M, (1 + i * 2.2) * M, 3 * M, 2.2 * M); ctx.clip();
    text(ctx, ch, 2.6 * M, (2.1 + i * 2.2) * M - (1 - p) * 2.2 * M, { size: 250, weight: 900, color: C.black, font: HEAVY }); ctx.restore(); });
  // 9 拍：左侧竖细线 + 右下说明文字
  const p9 = beatP(t, 9, BEAT * .5); if (p9 > 0) { ctx.fillStyle = C.black; ctx.fillRect(4.6 * M, M, 6, 6.8 * M * p9);
    ctx.globalAlpha = p9; ctx.save(); ctx.font = `600 26px ${HEAVY}`; ctx.letterSpacing = '8px'; ctx.textAlign = 'right'; ctx.fillStyle = C.black; ctx.fillText(TEXT.cap, 15 * M, 8.25 * M); ctx.restore();
    text(ctx, TEXT.tag, 5 * M, 8.2 * M, { size: 40, weight: 800, color: C.red, font: HEAVY, align: 'left' }); ctx.globalAlpha = 1; }
}

export default {
  width: W, height: H, fps: 30, duration: 10.5 * BEAT,
  fonts: [[`900 100px ${HEAVY}`, TEXT.name + TEXT.tag]],
  draw(ctx, t) {
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
    grid(ctx, t); shapes(ctx, t); type(ctx, t);
    grain(ctx, t, .05); vignette(ctx, .12, '60,40,20');
  },
  audio() {
    const m = new Mix(10.5 * BEAT + .3);
    for (let k = 0; k < 10; k++) { m.kick(k * BEAT, .45); if (k % 2) m.hat(k * BEAT + BEAT / 2, .06); }
    const notes = [0, 72, 76, 79, 74, 77, 81, 84, 84, 86];   // 每个动作一个木块声（短方波），音高往上走
    for (let k = 1; k < 10; k++) m.tone(k * BEAT, .09, 440 * 2 ** ((notes[k] - 69) / 12), { wave: 'square', vol: .07, env: [.002, .05, .2, .03] });
    m.tone(9 * BEAT, 1.4, 220, { wave: 'triangle', vol: .12 }); m.ding(9.5 * BEAT, .14);
    m.echo(.25, .2, .15); return m.master();
  },
};
