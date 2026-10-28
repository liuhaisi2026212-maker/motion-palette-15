// 逐帧手绘 · 虚构品牌「米米手作 MIMI HANDMADE」。原版语法：纸纹 + 整张画放在本子上、手绘大标牌（抖动粗描边）、
// 粗字带深色立体阴影一笔一笔写出来、小吉祥物眨眼挥手、角落手写批注（镜头号、红圈计数、手画箭头），线条每 2 帧抖一次（boil）。
import { clamp, lerp, seg, E, spring, rng, noise1, Mix, backing } from './lib/core.js';

const W = 1920, H = 1080, DUR = 8.5;
const FUN = '"ZCOOL KuaiLe", sans-serif', HAND = '"Marker Felt", "LXGW Marker Gothic", sans-serif', CNH = '"LXGW Marker Gothic", sans-serif';
const C = { paper: '#F1E7D3', ink: '#2B2320', teal: '#2FA39A', yellow: '#FFD24A', shadow: '#7A3B1F', red: '#D8432F', board: '#5C5A4A', rice: '#FFFDF6', nori: '#2E3B33' };
const TEXT = { big: '米米手作', en: 'MIMI HANDMADE', tag: '一粒一粒 · 用心捏', sc: 'SC.03', no: 'No.088', count: '第 88 张' };
let PAPER = null, BOIL = 0;   // BOIL：当前抖动帧（每 2 帧换一次）

// 手抖：同一条线每个抖动帧换一点偏移
const jit = (i, amt = 2.2) => [noise1(i * .18 + BOIL * 3.7, 1) * 2 * amt, noise1(i * .18 + BOIL * 3.7, 2) * 2 * amt];   // 顺滑的抖：相邻点偏移相近，每个抖动帧整体换一次
function wobbly(ctx, pts, close = true, amt = 2.2) { ctx.beginPath(); pts.forEach(([x, y], i) => { const [dx, dy] = jit(i, amt); ctx.lineTo(x + dx, y + dy); }); if (close) ctx.closePath(); }
function inkLine(ctx, pts, close, w = 7, col = C.ink) { ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.lineWidth = w; wobbly(ctx, pts, close); ctx.stroke(); ctx.lineWidth = w * .45; wobbly(ctx, pts.map(([x, y]) => [x + 1.5, y + 1]), close, 3); ctx.stroke(); }

// 标牌：扇贝边的圆角票据形（波浪边）
function badgePts(cx, cy, w, h, n = 36) { const pts = []; for (let i = 0; i < n * 4; i++) { const a = i / (n * 4) * Math.PI * 2, sx = Math.cos(a), sy = Math.sin(a);
  const r = 1 / Math.pow(Math.pow(Math.abs(sx), 4) + Math.pow(Math.abs(sy), 4), .25), wave = 1 + .045 * Math.abs(Math.sin(a * 11)); pts.push([cx + sx * r * w / 2 * wave, cy + sy * r * h / 2 * wave]); } return pts; }
function sparkle(ctx, x, y, s, i) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); const p = [[0, -20], [5, -5], [20, 0], [5, 5], [0, 20], [-5, 5], [-20, 0], [-5, -5]]; ctx.fillStyle = C.yellow; wobbly(ctx, p, true, 1.2); ctx.fill(); inkLine(ctx, p, true, 3); ctx.restore(); }
function onigiri(ctx, x, y, s, t) {   // 小饭团：三角形米团 + 海苔 + 眨眼 + 挥手
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(.08 * Math.sin(t * 3));
  const arm = Math.sin(t * 9) * .5; ctx.save(); ctx.translate(58, -10); ctx.rotate(-1 + arm); inkLine(ctx, [[0, 0], [30, -8]], false, 6); ctx.restore();
  const body = [[0, -80], [30, -60], [70, 10], [62, 40], [0, 48], [-62, 40], [-70, 10], [-30, -60]];
  ctx.fillStyle = C.rice; wobbly(ctx, body, true, 1.5); ctx.fill(); inkLine(ctx, body, true, 6);
  ctx.fillStyle = C.nori; wobbly(ctx, [[-36, 12], [36, 12], [38, 46], [-38, 46]], true, 1.2); ctx.fill();
  const blink = (t % 2.4) < .12; ctx.fillStyle = C.ink;
  if (blink) { inkLine(ctx, [[-26, -14], [-12, -14]], false, 4); inkLine(ctx, [[12, -14], [26, -14]], false, 4); } else { ctx.beginPath(); ctx.arc(-19, -15, 6, 0, 7); ctx.arc(19, -15, 6, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#F7A1A1'; ctx.beginPath(); ctx.ellipse(-36, -2, 9, 6, 0, 0, 7); ctx.ellipse(36, -2, 9, 6, 0, 0, 7); ctx.fill();
  inkLine(ctx, [[-8, -2], [0, 4], [8, -2]], false, 4); ctx.restore();
}
// 一个字一个字写出来：用抖动的斜向擦除遮罩显现，再加立体阴影
function writeChar(ctx, ch, x, y, size, p, i) {
  if (p <= 0) return; ctx.save(); ctx.beginPath(); const sweep = lerp(-size, size * 1.6, p); ctx.moveTo(x - size, y - size); ctx.lineTo(x - size + sweep * 1.6, y - size); ctx.lineTo(x - size + sweep * 1.6 - size, y + size); ctx.lineTo(x - size, y + size); ctx.clip();
  const [dx, dy] = jit(i + 50, 1.6), k = 1 + .12 * Math.exp(-(p - .6) * 8) * (p > .6 ? 1 : 0);
  ctx.translate(x + dx, y + dy); ctx.scale(k, k); ctx.font = `400 ${size}px ${FUN}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  for (let d = 10; d > 0; d -= 2) { ctx.fillStyle = C.shadow; ctx.fillText(ch, d * .6, d); }
  ctx.strokeStyle = C.ink; ctx.lineWidth = 10; ctx.strokeText(ch, 0, 0); ctx.fillStyle = C.yellow; ctx.fillText(ch, 0, 0);
  ctx.restore();
}
function handText(ctx, s, x, y, size, color, p, font = HAND, align = 'center', rot = 0) {   // 手写字：从左往右擦出来
  if (p <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.font = `400 ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; const w = ctx.measureText(s).width, x0 = align === 'center' ? -w / 2 : 0;
  ctx.beginPath(); ctx.rect(x0 - 10, -size, (w + 20) * p, size * 2); ctx.clip(); const [dx, dy] = jit(s.length + size, 1); ctx.fillStyle = color; ctx.fillText(s, dx, dy); ctx.restore();
}
function circleNote(ctx, x, y, rx, ry, p) { if (p <= 0) return; ctx.strokeStyle = C.red; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); for (let i = 0; i <= 60 * p; i++) { const a = -2.4 + i / 60 * Math.PI * 2.15, [dx, dy] = jit(i + 300, 1.2); ctx.lineTo(x + Math.cos(a) * rx * (1 + .04 * Math.sin(i)) + dx, y + Math.sin(a) * ry + dy); } ctx.stroke(); }

function page(ctx, t) {
  // 本子：深色桌面 + 叠起来的几页纸边 + 顶部螺旋圈
  ctx.fillStyle = C.board; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#4D4B3D'; for (let i = 0; i < 40; i++) { const r = rng(i); ctx.fillRect(r() * W, r() * H, 200, 2); }
  for (let k = 3; k >= 1; k--) { ctx.fillStyle = k % 2 ? '#E2D7C1' : '#EADFCB'; ctx.fillRect(150 + k * 6, 110 + k * 8, 1620, 880); }
  ctx.drawImage(PAPER, 150, 110);
  ctx.strokeStyle = 'rgba(43,35,32,.25)'; ctx.lineWidth = 1; ctx.strokeRect(150, 110, 1620, 880);
  for (let i = 0; i < 26; i++) { const x = 210 + i * 61; ctx.fillStyle = '#3A3830'; ctx.beginPath(); ctx.arc(x, 140, 9, 0, 7); ctx.fill(); ctx.strokeStyle = '#B9B6AA'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, 122, 16, Math.PI * .9, Math.PI * 2.1); ctx.stroke(); }
}

export default {
  width: W, height: H, fps: 30, duration: DUR,
  fonts: [['400 100px "ZCOOL KuaiLe"', TEXT.big], ['400 40px "LXGW Marker Gothic"', TEXT.tag + TEXT.count]],
  setup() { PAPER = document.createElement('canvas'); PAPER.width = 1620; PAPER.height = 880; const x = PAPER.getContext('2d'), r = rng(3); x.fillStyle = C.paper; x.fillRect(0, 0, 1620, 880);
    const d = x.getImageData(0, 0, 1620, 880); for (let i = 0; i < d.data.length; i += 4) { const n = (r() - .5) * 14; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n * .8; } x.putImageData(d, 0, 0);
    x.strokeStyle = 'rgba(120,90,60,.08)'; for (let i = 0; i < 900; i++) { x.lineWidth = r() * 1.5; const px = r() * 1620, py = r() * 880, a = r() * 6; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * 14, py + Math.sin(a) * 14); x.stroke(); } },
  draw(ctx, t) {
    BOIL = Math.floor(t * 12);   // 12fps 抖动
    const z = lerp(1.18, 1, E.inOutC(seg(t, 5.6, 7.4))); ctx.save(); ctx.translate(960, 560); ctx.scale(z, z); ctx.translate(-960, -560);
    page(ctx, t);
    handText(ctx, TEXT.sc, 230, 220, 34, C.red, seg(t, .2, .6), HAND, 'left', -.05);
    // 标牌：先描边一圈画出来，再「啪」地填色
    const bp = badgePts(960, 470, 1080, 440), drawn = seg(t, .5, 1.4), n = Math.floor(bp.length * drawn);
    if (t > 1.4) { const k = spring(t - 1.4, 3, .4); ctx.save(); ctx.translate(960, 470); ctx.scale(k, k); ctx.translate(-960, -470); ctx.fillStyle = C.ink; wobbly(ctx, bp.map(([x, y]) => [x + 10, y + 14]), true); ctx.fill(); ctx.fillStyle = C.teal; wobbly(ctx, bp, true); ctx.fill(); ctx.restore(); }
    if (n > 1) inkLine(ctx, bp.slice(0, n + 1), n >= bp.length - 1, 8);
    [...TEXT.big].forEach((ch, i) => writeChar(ctx, ch, 690 + i * 180, 440, 170, seg(t, 1.7 + i * .45, 2.15 + i * .45), i));
    handText(ctx, TEXT.en, 960, 590, 52, '#FFFDF6', seg(t, 3.6, 4.4));
    // 吉祥物从牌子后面冒出来
    if (t > 4.1) { const k = spring(t - 4.1, 2.6, .45); onigiri(ctx, 1450, 280 - 30 * k, .95 * k, t); }
    handText(ctx, TEXT.tag, 960, 770, 46, C.ink, seg(t, 4.8, 5.6), CNH);
    [[480, 260, .9, 5.0], [1490, 640, .7, 5.2], [420, 660, .6, 5.4], [1560, 210, .5, 5.5]].forEach(([x, y, s, t0], i) => { const k = spring(t - t0, 3, .4); if (k > 0) sparkle(ctx, x, y, s * k * (1 + .1 * Math.sin(t * 6 + i)), i); });
    // 红笔批注：圈出计数 + 手画箭头
    handText(ctx, TEXT.count, 1500, 860, 40, C.red, seg(t, 5.6, 6.2), CNH, 'center', -.06); circleNote(ctx, 1500, 860, 120, 44, seg(t, 6, 6.6));
    const ap = seg(t, 6.4, 6.9); if (ap > 0) { const pts = []; for (let i = 0; i <= 20 * ap; i++) { const u = i / 20; pts.push([lerp(1370, 1240, u), lerp(850, 790, u) + 30 * Math.sin(u * Math.PI)]); } inkLine(ctx, pts, false, 4, C.red); if (ap >= 1) inkLine(ctx, [[1236, 818], [1240, 790], [1266, 800]], false, 4, C.red); }
    handText(ctx, TEXT.no, 1640, 950, 30, C.red, seg(t, .3, .7), HAND, 'center', -.04);
    ctx.restore();
  },
  audio() {
    const m = new Mix(DUR + .3); backing(m, DUR, { bpm: 96, root: 60, drums: true });
    for (let i = 0; i < 12; i++) m.tone(.5 + i * .075, .05, 2200 + (i % 3) * 300, { wave: 'noise', vol: .02 });   // 铅笔沙沙
    m.pop(1.4, .25); [...TEXT.big].forEach((_, i) => { for (let j = 0; j < 4; j++) m.tone(1.7 + i * .45 + j * .08, .05, 2400, { wave: 'noise', vol: .025 }); m.pop(2.1 + i * .45, .12); });
    m.boing(4.1, .2); m.ding(4.9, .1); for (let i = 0; i < 4; i++) m.pop(5 + i * .17, .08); m.whoosh(5.6, .8, .06);
    m.echo(.2, .25, .18); return m.master();
  },
};
