// 复古霓虹 VHS · 虚构电台「深夜电台 MIDNIGHT FM」。原版语法：VHS 录像带外壳（PLAY ▶ / SP 时间码 / STOP ■、扫描线、色差、跟踪噪声带），
// 场景要满（滚动的霓虹网格地面、横条纹落日、线框山、棕榈树、路灯、开向地平线的跑车），倾斜的铬金属大字 + 霓虹手写签名。
import { clamp, lerp, seg, E, rng, Mix } from './lib/core.js';

const W = 1920, H = 1080, DUR = 9.5, HZ = 610;   // HZ：地平线
const CN = '"Noto Sans SC", "PingFang SC", sans-serif', MONO = '"Courier New", Menlo, monospace', SCRIPT = '"Snell Roundhand", "Brush Script MT", "Segoe Script", cursive';
const PINK = '#FF3FD0', CYAN = '#36E7FF';
let buf, bctx, MTN = [];

function sky(ctx) { const g = ctx.createLinearGradient(0, 0, 0, HZ); g.addColorStop(0, '#0B0322'); g.addColorStop(.55, '#3A0B5E'); g.addColorStop(.85, '#B0257A'); g.addColorStop(1, '#FF6A5A'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HZ);
  const r = rng(3); ctx.fillStyle = '#FFFFFF'; for (let i = 0; i < 90; i++) { const x = r() * W, y = r() * HZ * .6; ctx.globalAlpha = .3 + r() * .6; ctx.fillRect(x, y, 2, 2); } ctx.globalAlpha = 1; }
function sun(ctx, t) {
  const cx = 960, cy = 470, R = 240; ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, HZ); ctx.clip();
  ctx.shadowColor = '#FF6A9A'; ctx.shadowBlur = 80; const g = ctx.createLinearGradient(0, cy - R, 0, cy + R); g.addColorStop(0, '#FFF26B'); g.addColorStop(.45, '#FFA43A'); g.addColorStop(1, '#FF2E7A'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  // 横条纹：越往下越粗，慢慢往下走
  ctx.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 9; i++) { const u = ((i + (t * .35) % 1) / 9), y = cy + u * R, h = 2 + u * 22; ctx.fillRect(cx - R, y, R * 2, h); } ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}
function mountains(ctx) { for (const [pts, fill, a] of MTN) { ctx.beginPath(); ctx.moveTo(pts[0][0], HZ); pts.forEach(p => ctx.lineTo(...p)); ctx.lineTo(pts[pts.length - 1][0], HZ); ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = `rgba(255,63,208,${a})`; ctx.lineWidth = 2; ctx.shadowColor = PINK; ctx.shadowBlur = 10; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.lineWidth = 1; ctx.strokeStyle = `rgba(255,63,208,${a * .35})`; for (let i = 1; i < pts.length - 1; i++) { ctx.beginPath(); ctx.moveTo(...pts[i]); ctx.lineTo(pts[i][0] + (i % 2 ? 40 : -40), HZ); ctx.stroke(); } } }
function grid(ctx, t) {
  const g = ctx.createLinearGradient(0, HZ, 0, H); g.addColorStop(0, '#2A0846'); g.addColorStop(1, '#090014'); ctx.fillStyle = g; ctx.fillRect(0, HZ, W, H - HZ);
  ctx.save(); ctx.strokeStyle = PINK; ctx.shadowColor = PINK; ctx.shadowBlur = 12; ctx.lineWidth = 2.2;
  for (let i = -24; i <= 24; i++) { ctx.beginPath(); ctx.moveTo(960 + i * 40, HZ); ctx.lineTo(960 + i * 300, H); ctx.stroke(); }
  for (let k = 0; k < 18; k++) { const z = 1 + k - (t * 2.2) % 1, y = HZ + 470 / z; if (y > H) continue; ctx.globalAlpha = clamp(1.2 - z / 16); ctx.lineWidth = 1 + 2 / z; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore(); ctx.fillStyle = 'rgba(255,120,200,.35)'; ctx.fillRect(0, HZ - 1, W, 3);
}
function palm(ctx, x, y, s, flip, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(flip * s, s); ctx.fillStyle = '#0A0218'; ctx.strokeStyle = '#0A0218';
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(30, -260, 70, -520); ctx.lineTo(84, -516); ctx.quadraticCurveTo(46, -250, 14, 0); ctx.fill();
  const sway = Math.sin(t * 1.3) * .05; ctx.translate(76, -520); ctx.rotate(sway); ctx.lineCap = 'round';
  for (const [a, l] of [[-2.9, 230], [-2.4, 250], [-1.9, 200], [-1.2, 220], [-.6, 250], [-.1, 230], [.4, 200]]) { ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(a) * l * .6, Math.sin(a) * l * .6 - 50, Math.cos(a) * l, Math.sin(a) * l + 60); ctx.stroke();
    for (let j = 1; j < 9; j++) { const u = j / 9, px = Math.cos(a) * l * u, py = Math.sin(a) * l * u - 40 * Math.sin(u * Math.PI) + 60 * u * u; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a + 1.2) * 40 * (1 - u * .5), py + 34); ctx.stroke(); } }
  ctx.restore();
}
function lamps(ctx, t) { for (let k = 0; k < 7; k++) { const z = 7 - k - (t * 1.1) % 1 + .4; if (z < .45) continue; const s = 1 / z, y = HZ + 470 * s, h = 380 * s;
  for (const side of [-1, 1]) { const x = 960 + side * 620 * s; ctx.strokeStyle = '#1A0630'; ctx.lineWidth = Math.max(1, 10 * s); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.lineTo(x - side * 60 * s, y - h); ctx.stroke();
    ctx.fillStyle = CYAN; ctx.shadowColor = CYAN; ctx.shadowBlur = 30 * s; ctx.fillRect(x - side * 60 * s - 16 * s, y - h, 32 * s, 8 * s); ctx.shadowBlur = 0; } } }
function car(ctx, t) {
  const u = E.outC(seg(t, 0, 3.2)), s = lerp(1.25, .5, u), x = 960 + Math.sin(t * .8) * 6, y = lerp(1000, 800, u) + Math.sin(t * 9) * 1.5;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(0, 18, 230, 26, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#14081F'; ctx.fillRect(-190, -10, 70, 34); ctx.fillRect(120, -10, 70, 34);
  ctx.fillStyle = '#C81E4A'; ctx.beginPath(); ctx.moveTo(-215, 0); ctx.lineTo(-205, -90); ctx.lineTo(-130, -110); ctx.lineTo(-100, -170); ctx.lineTo(100, -170); ctx.lineTo(130, -110); ctx.lineTo(205, -90); ctx.lineTo(215, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2B0E3E'; ctx.beginPath(); ctx.moveTo(-88, -160); ctx.lineTo(88, -160); ctx.lineTo(112, -114); ctx.lineTo(-112, -114); ctx.fill();
  ctx.fillStyle = '#8E1236'; ctx.fillRect(-205, -40, 410, 34);
  ctx.shadowColor = '#FF2244'; ctx.shadowBlur = 40; ctx.fillStyle = '#FF3355'; ctx.fillRect(-196, -84, 392, 22); ctx.shadowBlur = 0; ctx.fillStyle = '#FFD0D8'; ctx.fillRect(-190, -78, 60, 8); ctx.fillRect(130, -78, 60, 8);
  ctx.fillStyle = '#0A0218'; ctx.fillRect(-60, -34, 120, 22); ctx.fillStyle = '#FFFFFF'; ctx.font = `700 16px ${MONO}`; ctx.textAlign = 'center'; ctx.fillText('FM 887', 0, -18); ctx.restore();
}
function chrome(ctx, t) {
  const p = seg(t, 3.2, 3.55); if (p <= 0) return; const k = lerp(2.2, 1, E.outC(p));
  ctx.save(); ctx.translate(960, 330); ctx.scale(k, k); ctx.transform(1, 0, -.22, 1, 0, 0); ctx.font = `900 190px ${CN}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.globalAlpha = Math.min(1, p * 3);
  const s = '深夜电台'; for (let d = 12; d > 0; d -= 2) { ctx.fillStyle = '#1B0638'; ctx.fillText(s, d * .4, d); }
  ctx.strokeStyle = '#1B0638'; ctx.lineWidth = 16; ctx.strokeText(s, 0, 0); ctx.strokeStyle = '#FF9BEF'; ctx.lineWidth = 3; ctx.strokeText(s, 0, 0);
  const g = ctx.createLinearGradient(0, -95, 0, 95); g.addColorStop(0, '#F2FBFF'); g.addColorStop(.38, '#7CC8FF'); g.addColorStop(.48, '#FFFFFF'); g.addColorStop(.5, '#3B1E66'); g.addColorStop(.62, '#B04BD8'); g.addColorStop(1, '#FFC2F2'); ctx.fillStyle = g; ctx.fillText(s, 0, 0);
  const sh = ((t - 3.6) * .7) % 2; if (sh > 0 && sh < 1) { ctx.save(); ctx.globalCompositeOperation = 'source-atop'; const sx = lerp(-700, 700, sh); const lg = ctx.createLinearGradient(sx - 60, 0, sx + 60, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(.5, 'rgba(255,255,255,.85)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = lg; ctx.fillRect(-700, -120, 1400, 240); ctx.restore(); }
  ctx.restore();
  // 霓虹手写签名：从左往右写出来，偶尔闪一下
  const w = seg(t, 3.7, 4.6); if (w > 0) { const flick = (Math.floor(t * 30) % 37 === 0) ? .4 : 1; ctx.save(); ctx.translate(1180, 450); ctx.rotate(-.12); ctx.beginPath(); ctx.rect(-420, -120, 840 * w, 240); ctx.clip();
    ctx.font = `700 120px ${SCRIPT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = PINK; ctx.shadowBlur = 30; ctx.fillStyle = `rgba(255,120,230,${flick})`; ctx.fillText('Midnight FM', 0, 0); ctx.shadowBlur = 8; ctx.fillStyle = `rgba(255,235,252,${flick})`; ctx.fillText('Midnight FM', 0, 0); ctx.restore(); }
  const top = seg(t, 4.3, 4.8); if (top > 0) { ctx.globalAlpha = top; ctx.fillStyle = '#FFFFFF'; ctx.font = `700 22px ${MONO}`; ctx.textAlign = 'center'; ctx.letterSpacing = '8px'; ctx.fillText('SUMMER 2026 · 夜间频道 · 88.7', 960, 130); ctx.letterSpacing = '0px';
    ctx.fillRect(560, 128, 60, 2); ctx.fillRect(1300, 128, 60, 2); ctx.globalAlpha = 1; }
}
function vhs(ctx, t) {
  // 色差 + 偶尔的横向撕裂
  bctx.drawImage(ctx.canvas, 0, 0); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .22; ctx.filter = 'blur(1px)';
  ctx.drawImage(buf, 5, 0); ctx.drawImage(buf, -5, 0); ctx.restore();
  const bandY = ((t * 260) % (H + 400)) - 200; const r = rng(Math.floor(t * 30));
  if (Math.floor(t / 3.1) % 2 === 1 || t < .5) { for (let i = 0; i < 6; i++) { const y = bandY + r() * 60, h = 3 + r() * 10; ctx.drawImage(buf, 0, y, W, h, (r() - .5) * 40, y, W, h); }
    ctx.fillStyle = 'rgba(255,255,255,.07)'; for (let i = 0; i < 300; i++) ctx.fillRect(r() * W, bandY + r() * 70, 2 + r() * 30, 1); }
  ctx.fillStyle = 'rgba(0,0,0,.22)'; for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  const v = ctx.createRadialGradient(960, 540, 400, 960, 540, 1200); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  // 屏幕字
  ctx.save(); ctx.font = `700 54px ${MONO}`; ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3; ctx.textBaseline = 'top'; const jx = (r() - .5) * 2;
  if (t < 8.6) { if (t < 2.5 || Math.floor(t * 2) % 2) ctx.fillText('PLAY ▶', 80 + jx, 64); } else ctx.fillText('STOP ■', 80 + jx, 64);
  ctx.font = `700 40px ${MONO}`; ctx.textAlign = 'right'; ctx.fillText(`SP 0:00:${String(Math.floor(t + 1)).padStart(2, '0')}`, 1840 + jx, 970); ctx.textAlign = 'left'; ctx.font = `700 26px ${MONO}`; ctx.fillText('CH 03  FM 88.7', 84 + jx, 976); ctx.restore();
}

export default {
  width: W, height: H, fps: 30, duration: DUR,
  fonts: [[`900 190px ${CN}`, '深夜电台夜间频道']],
  setup() { buf = document.createElement('canvas'); buf.width = W; buf.height = H; bctx = buf.getContext('2d');
    const mk = (seed, x0, x1, hmin, hmax, n, fill, a) => { const r = rng(seed), pts = []; for (let i = 0; i <= n; i++) pts.push([lerp(x0, x1, i / n), HZ - (i === 0 || i === n ? 0 : hmin + r() * (hmax - hmin))]); MTN.push([pts, fill, a]); };
    mk(5, -40, 760, 60, 210, 9, '#1E0638', .9); mk(8, 1160, 1960, 60, 230, 9, '#1E0638', .9); mk(2, 520, 1400, 20, 70, 12, '#2A0A4A', .6); },
  draw(ctx, t) {
    sky(ctx); sun(ctx, t); mountains(ctx); grid(ctx, t); lamps(ctx, t);
    palm(ctx, 140, HZ + 10, .5, 1, t); palm(ctx, 300, HZ + 4, .3, 1, t + 1); palm(ctx, 1780, HZ + 10, .5, -1, t + 2); palm(ctx, 1620, HZ + 4, .32, -1, t + 3);
    palm(ctx, -40, H + 40, 1.25, 1, t); palm(ctx, 1960, H + 40, 1.2, -1, t + .5);
    car(ctx, t); chrome(ctx, t);
    if (t > 3.2 && t < 3.27) { ctx.fillStyle = 'rgba(255,220,255,.6)'; ctx.fillRect(0, 0, W, H); }
    const off = seg(t, 8.9, 9.2); if (off > 0) { ctx.fillStyle = `rgba(0,0,10,${E.inC(off)})`; ctx.fillRect(0, 0, W, H); }
    vhs(ctx, t);
    if (t < .25) { const k = 1 - t / .25; ctx.fillStyle = `rgba(10,10,30,${k})`; ctx.fillRect(0, 0, W, H); }
  },
  audio() {
    const m = new Mix(DUR + .3), bpm = 100, b = 60 / bpm;
    for (let i = 0; i * b < DUR - .4; i++) { m.kick(i * b, .5); if (i % 2) m.snare(i * b, .22); m.hat(i * b + b / 2, .05); }
    const prog = [[45, 52, 57], [41, 48, 53], [43, 50, 55], [40, 47, 52]];
    for (let bar = 0; bar * 4 * b < DUR; bar++) { const ch = prog[bar % 4]; ch.forEach(n => m.tone(bar * 4 * b, 4 * b * .95, 440 * 2 ** ((n + 12 - 69) / 12), { wave: 'saw', vol: .03, env: [.3, .4, .7, .4] }));
      for (let s = 0; s < 8; s++) m.tone(bar * 4 * b + s * b / 2, b / 2 * .8, 440 * 2 ** ((ch[0] - 12 - 69) / 12), { wave: 'saw', vol: .07, env: [.005, .1, .5, .05] }); }
    m.tone(0, .3, 900, { wave: 'noise', vol: .08 }); m.thud(3.2, .7); m.whoosh(3.0, .3, .12); [81, 84, 88, 91].forEach((n, i) => m.tone(3.7 + i * .2, .6, 440 * 2 ** ((n - 69) / 12), { wave: 'square', vol: .035, env: [.005, .2, .3, .4] }));
    m.tone(8.6, .5, 200, { wave: 'saw', vol: .08, slide: -.7 }); m.echo(.3, .35, .25); return m.master();
  },
};
