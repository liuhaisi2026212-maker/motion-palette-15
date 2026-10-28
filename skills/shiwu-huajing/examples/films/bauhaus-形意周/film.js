// 包豪斯片头（重做版）· 虚构品牌「形意周 FORM WEEK」。学原版的语法：大几何块撑满画面并出血、印刷品外框（拍号 / 套准十字 / 色标）、
// 每拍一个动作不回弹、中段图案爆发、最后停成海报 + 竖排字距拉开的品牌名。构图和配色（红黄蓝黑）是自己的。
import { clamp, lerp, seg, E, rng, Mix } from './lib/core.js';
import { grain, vignette } from './lib/draw.js';

const W = 1920, H = 1080, M = 120, BPM = 120, BEAT = 60 / BPM, NB = 16;
const L = 60, T0 = 60, R = W - 60, B0 = H - 60;                       // 版心（四周留给印刷标记）
const C = { paper: '#F2EADB', red: '#E2283E', yellow: '#F7B500', blue: '#1D4FA8', black: '#141414', line: 'rgba(20,20,20,.10)' };
const TEXT = { brand: 'FORM WEEK', cn: '形意周', tag: ['看', '想', '做'], tagEn: 'SEE · THINK · MAKE', head: '形意周 · 第 01 期', foot: 'FORM WEEK · 8 SECONDS · 16 BEATS' };
const SANS = '"Futura", "Avenir Next", "Helvetica Neue", Arial, sans-serif', CN = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';
const bp = (t, k, dur = BEAT * .55) => E.inOutQ(seg(t, k * BEAT, k * BEAT + dur));   // 第 k 拍的动作进度（只用 inOutQ，不回弹）
const gx = c => L + c * M, gy = r => T0 + r * M;                         // 网格坐标 → 像素

function rotAbout(ctx, px, py, a, fn) { ctx.save(); ctx.translate(px, py); ctx.rotate(a); ctx.translate(-px, -py); fn(); ctx.restore(); }
function pie(ctx, x, y, r, a0, a1, fill) { ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, a0, a1); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
function txt(ctx, s, x, y, { size = 14, color = C.black, align = 'left', font = SANS, weight = 700, ls = 0 } = {}) { ctx.font = `${weight} ${size}px ${font}`; ctx.letterSpacing = `${ls}px`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.letterSpacing = '0px'; }

// ---------- 印刷品外框：版心线、套准十字、拍号、色标 ----------
function chrome(ctx, t) {
  const p = bp(t, 0, BEAT * .9); if (p <= 0) return;
  ctx.strokeStyle = C.line; ctx.lineWidth = 1.5;
  for (let c = 0; c <= 15; c++) { ctx.beginPath(); ctx.moveTo(gx(c), T0); ctx.lineTo(gx(c), T0 + (B0 - T0) * clamp(p * 1.4 - c * .025)); ctx.stroke(); }
  for (let r = 0; r <= 8; r++) { ctx.beginPath(); ctx.moveTo(L, gy(r)); ctx.lineTo(L + (R - L) * clamp(p * 1.4 - r * .04), gy(r)); ctx.stroke(); }
  ctx.globalAlpha = p; ctx.strokeStyle = C.black; ctx.lineWidth = 1.5;
  for (const [x, y, sx, sy] of [[L, T0, -1, -1], [R, T0, 1, -1], [L, B0, -1, 1], [R, B0, 1, 1]]) { ctx.beginPath(); ctx.moveTo(x + sx * 10, y); ctx.lineTo(x + sx * 40, y); ctx.moveTo(x, y + sy * 10); ctx.lineTo(x, y + sy * 40); ctx.stroke(); }
  for (const y of [30, H - 30]) { ctx.beginPath(); ctx.arc(W / 2, y, 9, 0, Math.PI * 2); ctx.moveTo(W / 2 - 16, y); ctx.lineTo(W / 2 + 16, y); ctx.moveTo(W / 2, y - 16); ctx.lineTo(W / 2, y + 16); ctx.stroke(); }
  const k = Math.min(NB, Math.floor(t / BEAT) + 1);
  txt(ctx, `BEAT ${String(k).padStart(2, '0')} / ${NB}`, L, 30, { size: 13, ls: 3 }); txt(ctx, TEXT.head, R, 30, { size: 13, align: 'right', font: CN, weight: 600 });
  txt(ctx, TEXT.foot, L, H - 30, { size: 12, ls: 3 });
  // 色标：每种颜色第一次出现时加一块
  const sw = [[C.blue, 1], [C.black, 2], [C.yellow, 3], [C.red, 4]]; sw.forEach(([c, kk], i) => { if (t >= kk * BEAT) { ctx.fillStyle = c; ctx.fillRect(R - 120 + i * 30, H - 38, 24, 16); } });
  ctx.globalAlpha = 1;
}

// ---------- 主构图（海报）：每拍一个元素 ----------
function poster(ctx, t, hide = 0) {
  ctx.save(); ctx.beginPath(); ctx.rect(L, T0, R - L, B0 - T0); ctx.clip();
  // 1 拍：蓝色大圆从上方落下，压在网格上（出血到顶）
  const p1 = bp(t, 1); if (p1 > 0) { ctx.beginPath(); ctx.arc(gx(9.5), lerp(-3 * M, gy(2.6), p1), 2.6 * M, 0, Math.PI * 2); ctx.fillStyle = C.blue; ctx.fill(); }
  // 2 拍：黑色粗竖条从上往下画满
  const p2 = bp(t, 2); if (p2 > 0) { ctx.fillStyle = C.black; ctx.fillRect(gx(13), T0, .62 * M, (B0 - T0) * p2); }
  // 3 拍：黄三角从底部升起（底边出血）
  const p3 = bp(t, 3); if (p3 > 0) { const dy = lerp(5 * M, 0, p3); ctx.beginPath(); ctx.moveTo(gx(5.5), B0 + dy); ctx.lineTo(gx(9.5), gy(4.4) + dy); ctx.lineTo(gx(13), B0 + dy); ctx.closePath(); ctx.fillStyle = C.yellow; ctx.fill(); }
  // 4 拍：红色四分之一圆绕左下角转进来
  const p4 = bp(t, 4); if (p4 > 0) rotAbout(ctx, gx(2.5), B0, lerp(Math.PI / 2, 0, p4), () => pie(ctx, gx(2.5), B0, 3.6 * M, -Math.PI / 2, 0, C.red));
  // 5 拍：红色半圆从黑条右边翻出来
  const p5 = bp(t, 5); if (p5 > 0) { ctx.save(); ctx.translate(gx(13.62), gy(6)); ctx.scale(p5, 1); pie(ctx, 0, 0, 1.55 * M, -Math.PI / 2, Math.PI / 2, C.red); ctx.restore(); }
  // 6 拍：一根细横线扫过 + 枢轴黑点
  const p6 = bp(t, 6); if (p6 > 0) { ctx.fillStyle = C.black; ctx.fillRect(gx(3), gy(4.4) - 2, (R - gx(3)) * p6, 4); if (p6 > .6) { ctx.beginPath(); ctx.arc(gx(9.5), gy(4.4), 14, 0, Math.PI * 2); ctx.fill(); } }
  // 7 拍：小蓝方块绕自己的角翻 90°，落在黑条左上
  const p7 = bp(t, 7); if (p7 > 0) rotAbout(ctx, gx(13), gy(1.5), lerp(-Math.PI / 2, 0, p7), () => { ctx.fillStyle = C.blue; ctx.fillRect(gx(11.5), gy(0), 1.5 * M, 1.5 * M); });
  ctx.restore();
}

// ---------- 中段：图案爆发（8～11 拍铺满，12 拍退场） ----------
const TILES = []; { const r = rng(11); for (let c = 0; c < 15; c++) for (let rr = 0; rr < 8; rr++) TILES.push({ c, r: rr, kind: Math.floor(r() * 4), col: [C.red, C.yellow, C.blue, C.black][Math.floor(r() * 4)], rot: Math.floor(r() * 4) }); }
function pattern(ctx, t) {
  if (t < 8 * BEAT || t > 13 * BEAT) return;
  ctx.save(); ctx.beginPath(); ctx.rect(L, T0, R - L, B0 - T0); ctx.clip();
  for (const tl of TILES) {
    const inP = E.inOutQ(seg(t, 8 * BEAT + (tl.c + tl.r) * .018, 8 * BEAT + (tl.c + tl.r) * .018 + .2)), outP = E.inOutQ(seg(t, 12 * BEAT + (tl.c + 7 - tl.r) * .015, 12 * BEAT + (tl.c + 7 - tl.r) * .015 + .2)), s = inP * (1 - outP);
    if (s <= 0) continue;
    const spin = [9, 10, 11].reduce((a, k) => a + bp(t, k, BEAT * .4), 0) * Math.PI / 2 * ((tl.c + tl.r) % 2 ? 1 : -1);   // 每拍整体转 90°
    const x = gx(tl.c) + M / 2, y = gy(tl.r) + M / 2;
    ctx.save(); ctx.translate(x, y); ctx.rotate(tl.rot * Math.PI / 2 + spin); ctx.scale(s, s); ctx.fillStyle = C.paper; ctx.fillRect(-M / 2, -M / 2, M, M);
    if (tl.kind === 0) pie(ctx, -M / 2, -M / 2, M, 0, Math.PI / 2, tl.col);
    else if (tl.kind === 1) pie(ctx, 0, -M / 2, M / 2, 0, Math.PI, tl.col);
    else if (tl.kind === 2) { ctx.beginPath(); ctx.moveTo(-M / 2, M / 2); ctx.lineTo(M / 2, M / 2); ctx.lineTo(-M / 2, -M / 2); ctx.closePath(); ctx.fillStyle = tl.col; ctx.fill(); }
    else { ctx.fillStyle = tl.col; ctx.fillRect(-M / 2, -M / 2, M, M); ctx.beginPath(); ctx.arc(0, 0, M * .28, 0, Math.PI * 2); ctx.fillStyle = C.paper; ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
}

// ---------- 13～15 拍：竖排品牌名（字距拉开）+ 中文竖排标语 ----------
function brand(ctx, t) {
  const letters = [...TEXT.brand]; ctx.font = `800 112px ${SANS}`; let acc = 0; const pos = letters.map(ch => { const w = ch === ' ' ? 40 : ctx.measureText(ch).width; const c = acc + w / 2; acc += w + 22; return c; });
  letters.forEach((ch, i) => { const p = bp(t, 13 + i * .22, BEAT * .3); if (p <= 0) return;
    ctx.save(); ctx.translate(gx(.75), B0 - 10 - pos[i]); ctx.rotate(-Math.PI / 2); ctx.globalAlpha = p; txt(ctx, ch, 0, -(1 - p) * 30, { size: 112, weight: 800, align: 'center' }); ctx.restore(); });
  const q = bp(t, 14.5, BEAT * .5); if (q > 0) { ctx.globalAlpha = q;
    TEXT.tag.forEach((c, i) => txt(ctx, c, gx(2.05), gy(.6) + i * 64, { size: 46, font: CN, weight: 900, align: 'center' }));
    ctx.save(); ctx.translate(gx(2.05), gy(3.6)); ctx.rotate(Math.PI / 2); txt(ctx, TEXT.tagEn, 0, 0, { size: 14, ls: 6, weight: 700 }); ctx.restore();
    ctx.fillStyle = C.red; ctx.fillRect(gx(1.85), gy(2.35), 46, 10); ctx.globalAlpha = 1; }
}

export default {
  width: W, height: H, fps: 30, duration: NB * BEAT + .3,
  fonts: [[`900 60px ${CN}`, TEXT.cn + TEXT.head + TEXT.tag.join('')], [`800 100px ${SANS}`, TEXT.brand + TEXT.foot + TEXT.tagEn + 'BEAT0123456789/']],
  draw(ctx, t) {
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
    chrome(ctx, t);
    const hidden = t >= 8 * BEAT + .3 && t < 12 * BEAT + .1;   // 图案铺满时海报在下面不画
    if (!hidden) poster(ctx, t);
    pattern(ctx, t); brand(ctx, t);
    // 纸张：轻微暖色暗角 + 颗粒
    grain(ctx, t, .06); vignette(ctx, .14, '90,60,20');
  },
  audio() {
    const m = new Mix(NB * BEAT + .6);
    for (let k = 0; k < NB; k++) { m.kick(k * BEAT, k >= 8 && k < 12 ? .55 : .4); m.hat(k * BEAT + BEAT / 2, .05); if (k % 4 === 2) m.snare(k * BEAT, .14); }
    const mel = [0, 67, 72, 74, 76, 79, 72, 81, 84, 86, 88, 91, 79, 72, 76, 79];   // 每拍一个木块音
    for (let k = 1; k < NB; k++) m.tone(k * BEAT, .08, 440 * 2 ** ((mel[k] - 69) / 12), { wave: k >= 8 && k < 12 ? 'square' : 'tri', vol: .08, env: [.002, .05, .2, .04] });
    for (let k = 0; k < NB; k += 2) m.tone(k * BEAT, BEAT * 1.8, 440 * 2 ** (([45, 45, 41, 43][(k / 2) % 4] - 69) / 12), { wave: 'saw', vol: .035 });
    m.whoosh(8 * BEAT - .2, .3, .12); m.whoosh(12 * BEAT - .1, .3, .12); m.ding(15 * BEAT, .16);
    m.echo(.25, .2, .14); return m.master();
  },
};
