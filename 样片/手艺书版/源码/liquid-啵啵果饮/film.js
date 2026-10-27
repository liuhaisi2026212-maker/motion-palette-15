// 液态 · 虚构品牌「啵啵果饮 BOBO」。原版语法：深紫底 + 反光地面倒影；一滴果冻落下 → 溅开 → 弹起 → 分成 4 颗彩色球 → 融合变形成果冻字，
// 底部还剩一小滴在晃。做法：在半分辨率上算「元球场」（metaball），用场的梯度当法线打光（漫反射 + 高光 + 边缘透亮），再放大画上去。
import { clamp, lerp, seg, E, spring, rng, Mix } from './lib/core.js';
import { grain, vignette } from './lib/draw.js';

const W = 1920, H = 1080, DUR = 9, SW = 960, SH = 540, K = 2, FLOOR = 770, T = .3;
const CN = '"PingFang SC", "Noto Sans SC", sans-serif';
const CHARS = '啵啵果饮', CXS = [600, 840, 1080, 1320], CY = 560;
let sim, sctx, img, field, CF = [];
const COLS = [[255, 132, 60], [255, 88, 120], [240, 80, 170], [168, 84, 255]];
const colAt = x => { const u = clamp((x - 450) / 1020) * 3, i = Math.min(2, Math.floor(u)), f = u - i; return COLS[i].map((c, k) => lerp(c, COLS[i + 1][k], f)); };

function blobsAt(t) {   // 当前所有元球：[x, y, r]（屏幕坐标）
  const B = [];
  if (t < 1) { const y = lerp(-120, FLOOR - 60, E.inQ(seg(t, 0, 1))); B.push([960, y, 62], [960, y - 52, 44], [960, y - 92, 26]); return B; }
  const sp = t < 1.6 ? E.outC(seg(t, 1, 1.35)) * (1 - E.inOutC(seg(t, 1.3, 1.9))) : 0;
  // 溅起的小水珠：抛物线飞出，再被拉回
  const r = rng(4); for (let i = 0; i < 8; i++) { const vx = (r() - .5) * 900, vy = -380 - r() * 420, d = clamp(t - 1, 0, .7), back = E.inOutC(seg(t, 1.7, 2.3));
    let x = 960 + vx * d, y = FLOOR - 30 + vy * d + 1100 * d * d; y = Math.min(y, FLOOR - 10); if (back < 1) B.push([lerp(x, 960, back), lerp(y, FLOOR - 80, back), (9 + r() * 7) * (1 - back * .5)]); }
  if (t < 2.6) { const reb = seg(t, 1.6, 2.6), up = Math.sin(reb * Math.PI) * 120 * (t > 1.6 ? 1 : 0), flat = 1 - E.outC(seg(t, 1.5, 2.1));
    for (let k = -3; k <= 3; k++) B.push([960 + k * (24 + 80 * sp + 30 * flat), FLOOR - 32 - up - (1 - flat) * 40 * (k === 0 ? 1 : 0), (k === 0 ? 46 + 40 * (1 - flat) : 30 * (1 - Math.abs(k) * .12)) * (1 - (1 - flat) * (k ? .7 : 0))]);
    return B; }
  // 分成 4 颗：从中心滚到各自位置，再上下浮动；之后变形成字
  CXS.forEach((cx, i) => { const u = E.inOutC(seg(t, 2.6 + i * .06, 3.5 + i * .06)), bob = Math.sin(t * 3 + i) * 10 * seg(t, 3.4, 3.8), m = E.inOutC(seg(t, 4.2 + i * .15, 5 + i * .15));
    const x = lerp(960, cx, u), y = lerp(FLOOR - 120, CY, u) + bob, rr = lerp(80, 66, u) * (1 - .45 * m); B.push([x, y, rr, m, i]); });
  if (t > 6.1) { const d = t - 6.1, y = d < .45 ? lerp(-40, FLOOR - 26, E.inQ(d / .45)) : FLOOR - 26 - Math.abs(Math.sin((d - .45) * 7)) * 90 * Math.exp(-(d - .45) * 2.6); B.push([960, y, 26]); }
  return B;
}
function render(t) {
  const B = blobsAt(t), wob = t > 5 ? 1 : 0;
  for (let y = 0, p = 0; y < SH; y++) { const sy = y * K;
    for (let x = 0; x < SW; x++, p++) { const sx = x * K; let f = 0;
      for (const b of B) { const dx = sx - b[0], dy = sy - b[1], w = b.length > 3 ? 1 - b[3] : 1; if (w <= 0) continue; const R2 = b[2] * b[2] * 3.2, k = 1 - (dx * dx + dy * dy) / R2; if (k > 0) f += w * k * k * k; }   // 有界的元球核：中心 1，边缘平滑到 0
      if (t > 4.1) for (let i = 0; i < 4; i++) { const m = B[i + (B.length > 4 && B[0].length < 4 ? 0 : 0)] ? E.inOutC(seg(t, 4.2 + i * .15, 5 + i * .15)) : 0; if (m <= 0) continue;
        f += m * CF[i][p]; }
      field[p] = f; } }
  const d = img.data;
  for (let y = 1, p = SW + 1; y < SH - 1; y++, p += 2) for (let x = 1; x < SW - 1; x++, p++) { const f = field[p], q = p * 4; if (f < T * .8) { d[q + 3] = 0; continue; }
    let gx = field[p + 1] - field[p - 1], gy = field[p + SW] - field[p - SW]; const g = Math.hypot(gx, gy) + 1e-6, s = Math.min(1, g * 7);   // 越靠边，法线越水平
    const nx = -gx / g * s, ny = -gy / g * s, nz = Math.sqrt(Math.max(0, 1 - s * s));
    const lx = -.45, ly = -.6, lz = .66, diff = Math.max(0, nx * lx + ny * ly + nz * lz), hx = lx, hy = ly, hz = lz + 1, hl = Math.hypot(hx, hy, hz), spec = Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hl), 60);
    const edge = 1 - clamp((f - T) / .35), c = colAt(x * K), a = clamp((f - T * .8) / (T * .35));
    for (let k = 0; k < 3; k++) d[q + k] = clamp(c[k] * (.42 + .62 * diff) + edge * 70 + spec * 255 + (1 - nz) * 30, 0, 255);
    d[q + 3] = a * 255; }
  sctx.putImageData(img, 0, 0);
}

export default {
  width: W, height: H, fps: 30, duration: DUR,
  fonts: [[`900 115px ${CN}`, CHARS + '一口就弹回来']],
  setup() {
    sim = document.createElement('canvas'); sim.width = SW; sim.height = SH; sctx = sim.getContext('2d'); img = sctx.createImageData(SW, SH); field = new Float32Array(SW * SH);
    [...CHARS].forEach((ch, i) => { const c = document.createElement('canvas'); c.width = SW; c.height = SH; const x = c.getContext('2d'); x.filter = 'blur(4.5px)'; x.fillStyle = '#fff'; x.font = `900 ${230 / K}px ${CN}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round'; x.lineWidth = 8 / K; x.strokeStyle = '#fff'; x.strokeText(ch, CXS[i] / K, CY / K); x.fillText(ch, CXS[i] / K, CY / K);
      const a = x.getImageData(0, 0, SW, SH).data, arr = new Float32Array(SW * SH); for (let p = 0; p < SW * SH; p++) arr[p] = a[p * 4 + 3] / 255; CF.push(arr); });
  },
  draw(ctx, t) {
    const g = ctx.createRadialGradient(960, 480, 0, 960, 480, 1200); g.addColorStop(0, '#4A1C66'); g.addColorStop(1, '#14061F'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const fl = ctx.createLinearGradient(0, FLOOR, 0, H); fl.addColorStop(0, 'rgba(255,255,255,.06)'); fl.addColorStop(1, 'rgba(0,0,0,.3)'); ctx.fillStyle = fl; ctx.fillRect(0, FLOOR, W, H - FLOOR);
    render(t);
    // 倒影：上下翻转、变淡、模糊，只画在地面以下
    ctx.save(); ctx.beginPath(); ctx.rect(0, FLOOR, W, H - FLOOR); ctx.clip(); ctx.globalAlpha = .28; ctx.filter = 'blur(4px)'; ctx.translate(0, FLOOR * 2); ctx.scale(1, -1); ctx.drawImage(sim, 0, 0, W, H); ctx.restore();
    ctx.save(); ctx.shadowColor = 'rgba(255,90,170,.35)'; ctx.shadowBlur = 40; ctx.drawImage(sim, 0, 0, W, H); ctx.restore();
    const s = E.outC(seg(t, 6.7, 7.4)); ctx.globalAlpha = s; ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'right'; ctx.font = `700 30px ${CN}`; ctx.fillText('一口，就弹回来', 1790, 960);
    ctx.font = `600 15px ${CN}`; ctx.letterSpacing = '5px'; ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.fillText('BOBO JUICE · BOUNCE BACK', 1795, 995); ctx.letterSpacing = '0px'; ctx.globalAlpha = 1;
    vignette(ctx, .4); grain(ctx, t, .03);
  },
  audio() {
    const m = new Mix(DUR + .3);
    m.tone(0, DUR, 73.4, { wave: 'sine', vol: .07, env: [1.5, .1, 1, 1] }); m.tone(0, DUR, 110, { wave: 'tri', vol: .03, env: [2, .1, 1, 1] });
    for (let b = 2.6; b < DUR; b += .5) { m.kick(b, .22); m.hat(b + .25, .03); }
    m.tone(.7, .3, 300, { vol: .05, slide: 1.5 }); m.tone(1, .25, 180, { vol: .25, slide: -.6 }); m.pop(1, .3); for (let i = 0; i < 6; i++) m.tone(1.05 + i * .05, .06, 1400 + i * 200, { vol: .04 });
    m.boing(1.9, .2); for (let i = 0; i < 4; i++) m.tone(2.7 + i * .06, .2, 440 * 2 ** ((76 + [0, 3, 7, 10][i] - 69) / 12), { vol: .06 });
    for (let i = 0; i < 4; i++) { m.tone(4.4 + i * .15, .35, 220 * 2 ** (i / 4), { vol: .08, slide: .8 }); m.pop(5 + i * .15, .12); }
    m.ding(5.5, .14); m.pop(6.55, .2); m.pop(6.95, .1); m.ding(6.8, .1);
    m.echo(.24, .3, .22); return m.master();
  },
};
