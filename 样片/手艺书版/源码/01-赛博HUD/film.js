// 自测：按「一般模型怎么做」+ hud.md 最小可行做法写的新片。主题：AI 帮你找到丢失的猫
import { clamp, lerp, seg, E, rng, beats, Mix, backing } from './lib/core.js';
import { SANS, text, circle, grain, vignette, glow } from './lib/draw.js';

const W = 1920, H = 1080;
const TEXT = { boot: 'SCANNING CITY GRID', title: '寻猫雷达', l1: '小区监控 128 路', l2: '比对相似度', lock: '目标锁定', lockEn: 'LOCKED · 橘猫「年糕」', end: '它在楼下的快递箱里' };
const PALETTE = { bg: '#020A0D', bg2: '#062038', line: '#00E5FF', dim: '#0B7C8C', panel: 'rgba(14,58,66,.55)', white: '#E8FEFF', alert: '#FF6A00' };
const MONO = '"JetBrains Mono", "IBM Plex Mono", Menlo, Consolas, monospace';

const B = beats([['boot', 1.6], ['scan', 2.6], ['panels', 2.4], ['lock', 2.2], ['end', 2]]);

function growStroke(ctx, path, len, p) { ctx.save(); ctx.setLineDash([len * p, len]); ctx.stroke(path); ctx.restore(); }
function ring(ctx, cx, cy, r, rot, ticks = 60, gap = .15) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.beginPath(); ctx.arc(0, 0, r, gap, Math.PI * 2 - gap); ctx.stroke();
  for (let i = 0; i < ticks; i++) { const a = i / ticks * Math.PI * 2, l = i % 5 ? 6 : 14; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a) * (r - l), Math.sin(a) * (r - l)); ctx.stroke(); } ctx.restore(); }
function radar(ctx, cx, cy, r, ang, col) { const g = ctx.createConicGradient(ang, cx, cy); g.addColorStop(0, col + '73'); g.addColorStop(.12, col + '00'); g.addColorStop(1, col + '00'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); }
const rolling = (t, t0, target, digits = 4) => t < t0 + .15 ? String(Math.floor(rng(Math.floor(t * 30))() * 10 ** digits)).padStart(digits, '0') : String(target);
function lockOn(ctx, cx, cy, s, p) { const k = lerp(1.4, 1, E.outExpo(p)), h = s * k / 2, l = s * .2; ctx.beginPath(); for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.moveTo(cx + sx * h, cy + sy * (h - l)); ctx.lineTo(cx + sx * h, cy + sy * h); ctx.lineTo(cx + sx * (h - l), cy + sy * h); } ctx.stroke(); }
const typed = (s, t, t0, cps = 18) => s.slice(0, Math.max(0, Math.floor((t - t0) * cps)));

function bg(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, PALETTE.bg); g.addColorStop(1, PALETTE.bg2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(0,229,255,.08)'; for (let y = 30; y < H; y += 40) for (let x = 30; x < W; x += 40) ctx.fillRect(x, y, 2, 2);
}
// 中心雷达：所有阶段共用，颜色随锁定切换
function core(ctx, t, col) {
  const cx = 960, cy = 540, on = E.outCubic(seg(t, .2, 1.2));
  ctx.strokeStyle = col; ctx.lineWidth = 2;
  const p = new Path2D(); p.arc(cx, cy, 300, -Math.PI / 2, Math.PI * 1.5); growStroke(ctx, p, 1900, on);
  if (on > .3) { ctx.globalAlpha = on; ctx.lineWidth = 1.5; ring(ctx, cx, cy, 260, t * .4); ring(ctx, cx, cy, 200, -t * .7, 36, .4); ring(ctx, cx, cy, 130, t * 1.1, 24, .6); ctx.globalAlpha = 1; }
  if (t > B.scan.t0) radar(ctx, cx, cy, 300, t * 2.4, col);
}
function drawBoot(ctx, t) {
  core(ctx, t, PALETTE.line);
  text(ctx, typed(TEXT.boot, t, .3) + (Math.floor(t * 4) % 2 ? '_' : ''), 960, 940, { size: 30, weight: 500, color: PALETTE.line, font: MONO });
}
function drawScan(ctx, t) {
  core(ctx, t, PALETTE.line);
  // 光点：被扫到时闪一下
  const pts = [[820, 420], [1100, 470], [900, 690], [1080, 640], [760, 560]];
  pts.forEach(([x, y]) => { const a = (Math.atan2(y - 540, x - 960) + Math.PI * 4) % (Math.PI * 2), sw = (t * 2.4) % (Math.PI * 2), d = (sw - a + Math.PI * 2) % (Math.PI * 2); circle(ctx, x, y, 7, `rgba(0,229,255,${clamp(1 - d / 1.5) * .9 + .15})`); });
  const k = E.outCubic(seg(t, B.scan.t0, B.scan.t0 + .5)); ctx.globalAlpha = k;
  glow(ctx, PALETTE.line, () => text(ctx, TEXT.title, 960, 120 + (1 - k) * 12, { size: 72, weight: 800, color: PALETTE.white }), 18, 4); ctx.globalAlpha = 1;
}
function panel(ctx, t, t0, x, y, w, h, title, value, col = PALETTE.line) {
  const p = E.outCubic(seg(t, t0, t0 + .6)); if (p <= 0) return;
  ctx.fillStyle = PALETTE.panel; ctx.globalAlpha = p; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
  const r = new Path2D(); r.rect(x, y, w, h); ctx.strokeStyle = col; ctx.lineWidth = 2; growStroke(ctx, r, 2 * (w + h), p);
  text(ctx, typed(title, t, t0 + .4), x + 30, y + 52, { size: 36, weight: 600, color: PALETTE.white, align: 'left' });
  if (t > t0 + .6) text(ctx, value, x + 30, y + 132, { size: 72, weight: 700, color: col, align: 'left', font: MONO });
}
function cat(ctx, x, y, col, k = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 6, 34, 0, Math.PI * 2); ctx.moveTo(-32, -6); ctx.lineTo(-26, -46); ctx.lineTo(-6, -26); ctx.moveTo(32, -6); ctx.lineTo(26, -46); ctx.lineTo(6, -26); ctx.fill();
  ctx.fillStyle = PALETTE.bg; circle(ctx, -12, 2, 5, PALETTE.bg); circle(ctx, 12, 2, 5, PALETTE.bg); ctx.restore(); }
function drawPanels(ctx, t) {
  drawScan(ctx, t); ctx.globalAlpha = .35 + .35 * Math.sin(t * 12) ** 2; cat(ctx, 1080, 640, PALETTE.line, .8); ctx.globalAlpha = 1;
  panel(ctx, t, B.panels.t0, 90, 330, 420, 180, TEXT.l1, rolling(t, B.panels.t0 + .6, '0128', 4));
  const pct = Math.round(lerp(31, 97, E.outCubic(seg(t, B.panels.t0 + 1.2, B.panels.t1)))) + '%';
  panel(ctx, t, B.panels.t0 + .4, 1410, 330, 420, 180, TEXT.l2, t > B.panels.t0 + 1 ? pct : '');
}
function drawLock(ctx, t) {
  const t0 = B.lock.t0, col = t > t0 + .35 ? PALETTE.alert : PALETTE.line;
  if (t > t0 + .35 && t < t0 + .4) { ctx.fillStyle = 'rgba(255,106,0,.25)'; ctx.fillRect(0, 0, W, H); }
  core(ctx, t, col);
  panel(ctx, t, -9, 90, 330, 420, 180, TEXT.l1, '0128', col); panel(ctx, t, -9, 1410, 330, 420, 180, TEXT.l2, '97%', col);
  cat(ctx, 1080, 640, col, 1 + .15 * Math.max(0, 1 - (t - t0 - .35) / .3) * (t > t0 + .35 ? 1 : 0));
  ctx.strokeStyle = col; ctx.lineWidth = 5; lockOn(ctx, 1080, 640, 190, seg(t, t0, t0 + .35));
  const k = E.outCubic(seg(t, t0 + .4, t0 + .8)); ctx.globalAlpha = k;
  glow(ctx, PALETTE.alert, () => text(ctx, TEXT.lock, 960, 900, { size: 110, weight: 900, color: PALETTE.white }), 26, 6);
  text(ctx, TEXT.lockEn, 960, 990, { size: 30, weight: 600, color: PALETTE.alert }); ctx.globalAlpha = 1;
}
function drawEnd(ctx, t) {
  const k = E.outCubic(seg(t, B.end.t0, B.end.t0 + .6));
  ctx.globalAlpha = 1 - k * .7; core(ctx, t, PALETTE.alert); ctx.globalAlpha = k;
  text(ctx, TEXT.end, 960, 540 + (1 - k) * 8, { size: 96, weight: 800, color: PALETTE.white, maxW: 1400 }); ctx.globalAlpha = 1;
}

export default {
  width: W, height: H, fps: 30, duration: B.duration,
  fonts: [[`900 100px ${SANS}`, Object.values(TEXT).join('')]],
  draw(ctx, t) {
    bg(ctx);
    if (t < B.boot.t1) drawBoot(ctx, t);
    else if (t < B.scan.t1) drawScan(ctx, t);
    else if (t < B.panels.t1) drawPanels(ctx, t);
    else if (t < B.lock.t1) drawLock(ctx, t);
    else drawEnd(ctx, t);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    grain(ctx, t, .03); vignette(ctx, .4);
  },
  audio() {
    const m = new Mix(B.duration + .3); backing(m, B.duration, { bpm: 100, root: 50 });
    for (let i = 0; i < 8; i++) m.pop(.3 + i * .12, .06);
    m.whoosh(B.scan.t0, .6); m.pop(B.panels.t0 + .6); m.pop(B.panels.t0 + 1);
    m.ding(B.lock.t0 + .35); m.thud(B.lock.t0 + .35); m.ding(B.end.t0 + .2);
    m.echo(); return m.master();
  },
};
