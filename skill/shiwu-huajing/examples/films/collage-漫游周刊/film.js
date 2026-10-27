// 拼贴 · 虚构刊物「漫游周刊 WANDER WEEKLY」。原版语法：牛皮纸、撕边旧报纸、胶带、黑白网点剪报主体放在红色大圆上，
// 一场「沿虚线剪开」的戏 → 打开后涌出彩色拼贴（鸟、蝴蝶、花、纸云），期号章，结尾满屏红纸 + 撕纸标题条 + 圆形贴纸。
// 素材：报纸 / 鸟 / 蝴蝶 / 玫瑰 / 纸张纹理为 CC0（来自 mg-styles-15 原项目的公有领域素材）；相机是代码画的再转网点。
import { clamp, lerp, seg, E, spring, rng, Mix } from './lib/core.js';
import { loadImage, grain, vignette } from './lib/draw.js';

const W = 1920, H = 1080, DUR = 9.5;
const IMPACT = '"Impact", "Haettenschweiler", "Arial Narrow Bold", sans-serif', CN = '"PingFang SC", "Noto Sans SC", sans-serif', MONO = '"Courier New", monospace';
const INK = '#1C1A17', RED = '#D6332A', CREAM = '#F2EBDD';
const A = {}; let CAM = null, LENS = { x: 330, y: 270, r: 150 };   // 相机图里镜头的位置
const SQ = t => Math.floor(t * 12) / 12;                              // 定格动画：位置按 12fps 跳

// ---------- 相机：先画灰度，再转成网点剪报（带一圈米白纸边） ----------
function makeCamera() {
  const w = 700, h = 520, g = document.createElement('canvas'); g.width = w; g.height = h; const x = g.getContext('2d');
  const body = new Path2D(); body.roundRect(40, 130, 620, 340, 30);
  let gr = x.createLinearGradient(0, 130, 0, 470); gr.addColorStop(0, '#666'); gr.addColorStop(1, '#202020'); x.fillStyle = gr; x.fill(body);
  const top = new Path2D(); top.roundRect(70, 80, 560, 80, 18); gr = x.createLinearGradient(0, 80, 0, 160); gr.addColorStop(0, '#E8E8E8'); gr.addColorStop(1, '#8C8C8C'); x.fillStyle = gr; x.fill(top);
  x.fillStyle = '#C9C9C9'; x.fillRect(470, 40, 110, 50); x.fillStyle = '#2B2B2B'; x.fillRect(490, 52, 70, 26);
  x.fillStyle = '#BBBBBB'; x.beginPath(); x.arc(150, 70, 26, 0, 7); x.fill();
  const r = rng(2); for (let i = 0; i < 4000; i++) { x.fillStyle = `rgba(0,0,0,${r() * .25})`; x.fillRect(40 + r() * 620, 170 + r() * 300, 2, 2); }   // 皮纹
  for (const [rr, c] of [[175, '#E4E4E4'], [160, '#4A4A4A'], [135, '#1A1A1A'], [110, '#595959'], [88, '#111'], [60, '#2E2E2E']]) { x.fillStyle = c; x.beginPath(); x.arc(LENS.x, LENS.y, rr, 0, 7); x.fill(); }
  gr = x.createRadialGradient(LENS.x - 30, LENS.y - 30, 4, LENS.x, LENS.y, 90); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.3, 'rgba(255,255,255,.15)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.beginPath(); x.arc(LENS.x, LENS.y, 90, 0, 7); x.fill();
  x.fillStyle = '#DDD'; x.font = '700 30px Arial'; x.fillText('WANDER 35', 470, 230); x.fillStyle = '#AAA'; x.fillRect(560, 260, 60, 60);
  // 网点：按亮度画大小不同的黑点（转 15°），只在相机轮廓里
  const out = document.createElement('canvas'); out.width = w + 40; out.height = h + 40; const o = out.getContext('2d'); o.translate(20, 20);
  const sil = new Path2D(); sil.addPath(body); sil.addPath(top); sil.rect(470, 40, 110, 50); sil.arc(150, 70, 26, 0, 7); sil.arc(LENS.x, LENS.y, 176, 0, 7);
  o.save(); o.strokeStyle = CREAM; o.lineWidth = 34; o.lineJoin = 'round'; o.stroke(sil); o.fillStyle = CREAM; o.fill(sil); o.restore();
  o.save(); o.clip(sil); const d = x.getImageData(0, 0, w, h).data, step = 7, ca = Math.cos(.26), sa = Math.sin(.26); o.fillStyle = INK;
  for (let u = -w; u < w * 2; u += step) for (let v = -h; v < h * 2; v += step) { const px = u * ca - v * sa, py = u * sa + v * ca; if (px < 0 || py < 0 || px >= w || py >= h) continue; const i = (Math.floor(py) * w + Math.floor(px)) * 4, l = d[i + 3] ? (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255 : 1;
    const rr = (1 - l) * step * .62; if (rr > .3) { o.beginPath(); o.arc(px, py, rr, 0, 7); o.fill(); } } o.restore();
  return out;
}
// ---------- 零件 ----------
function tape(ctx, x, y, w, rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = 'rgba(231,220,190,.82)'; ctx.beginPath(); const r = rng(Math.floor(x + y)); ctx.moveTo(-w / 2, -18);
  for (let i = 0; i <= 6; i++) ctx.lineTo(-w / 2 + i * w / 6, -18 + (i % 2 ? 0 : -3)); for (let j = 0; j <= 4; j++) ctx.lineTo(w / 2 + (r() - .5) * 6, -18 + j * 9); for (let i = 6; i >= 0; i--) ctx.lineTo(-w / 2 + i * w / 6, 18 + (i % 2 ? 2 : -1)); for (let j = 4; j >= 0; j--) ctx.lineTo(-w / 2 + (r() - .5) * 6, -18 + j * 9); ctx.fill(); ctx.restore(); }
function piece(ctx, img, x, y, s, rot, alpha = 1) { if (!img) return; ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 6; ctx.drawImage(img, -img.width * s / 2, -img.height * s / 2, img.width * s, img.height * s); ctx.restore(); }
function scissors(ctx, x, y, a, open) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.strokeStyle = INK; ctx.lineWidth = 6; for (const s of [-1, 1]) { ctx.save(); ctx.rotate(s * open); ctx.beginPath(); ctx.ellipse(-48, s * 16, 18, 11, 0, 0, 7); ctx.stroke(); ctx.fillStyle = '#C8C8C8'; ctx.beginPath(); ctx.moveTo(-30, s * 8); ctx.lineTo(50, s * 2); ctx.lineTo(-24, s * 18); ctx.fill(); ctx.restore(); } ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill(); ctx.restore(); }
function label(ctx, x, y, rot, a, b, bg = RED) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = bg; ctx.fillRect(-170, -38, 340, 76); ctx.strokeStyle = CREAM; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.strokeRect(-160, -30, 320, 60); ctx.setLineDash([]);
  ctx.fillStyle = CREAM; ctx.textAlign = 'center'; ctx.font = `800 28px ${CN}`; ctx.fillText(a, 0, -2); ctx.font = `700 15px ${MONO}`; ctx.fillText(b, 0, 22); ctx.restore(); tape(ctx, x - 150, y - 34, 90, rot - .5); }
function stamp(ctx, x, y, s, rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.fillStyle = RED; ctx.fillRect(-70, -50, 140, 100); ctx.fillStyle = CREAM; ctx.font = `400 64px ${IMPACT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('№12', 0, 4); ctx.restore(); }
function cloud(ctx, x, y, s) { ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x, y, 30 * s, 0, 7); ctx.arc(x + 34 * s, y - 14 * s, 38 * s, 0, 7); ctx.arc(x + 72 * s, y, 28 * s, 0, 7); ctx.rect(x, y, 72 * s, 28 * s); ctx.fill(); }
function tornEdge(ctx, x0, seed) { const r = rng(seed); ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(x0, -10); for (let y = 0; y <= H + 20; y += 18) ctx.lineTo(x0 + (r() - .5) * 26 + y * .12, y); ctx.lineTo(-10, H + 20); ctx.closePath(); }

const OUT = [['bird_hawk', 1180, 230, .9, -.12, 3.7], ['bfly_a', 1480, 420, .8, .2, 3.85], ['rose_purple', 1240, 760, .8, .15, 4.0], ['bfly_b', 900, 170, .9, -.3, 4.1], ['rose_centi', 1560, 760, .75, -.1, 4.2]];

export default {
  width: W, height: H, fps: 30, duration: DUR,
  fonts: [[`900 160px ${CN}`, '漫游周刊沿虚线剪开看见收集拼起来订阅送贴纸']],
  async setup() { for (const k of ['bfly_a', 'bfly_b', 'bird_hawk', 'rose_centi', 'rose_purple', 'news_a', 'news_b']) A[k] = await loadImage(`assets/${k}.png`); A.kraft = await loadImage('assets/page_kraft.jpg'); A.red = await loadImage('assets/page_red.jpg'); CAM = makeCamera(); },
  draw(ctx, t) {
    const q = SQ(t), jr = rng(Math.floor(t * 12)), wob = () => (jr() - .5) * .008;
    ctx.drawImage(A.kraft, 0, 0, W, H);
    ctx.fillStyle = 'rgba(28,26,23,.75)'; ctx.font = `700 15px ${MONO}`; ctx.textAlign = 'left'; ctx.fillText('WANDER WEEKLY · №12 · COLLECTED ON THE ROAD · 2026', 60, 52);
    ctx.save(); ctx.translate(1868, 540); ctx.rotate(Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('SEE · COLLECT · STICK IT TOGETHER', 0, 0); ctx.restore();
    // 报纸碎片 + 胶带
    const n1 = E.outC(seg(q, 0, .5)), n2 = E.outC(seg(q, .25, .75));
    piece(ctx, A.news_a, lerp(-300, 250, n1), 300, .7, -.08 + wob()); if (n1 > .9) tape(ctx, 120, 160, 120, -.3);
    piece(ctx, A.news_b, lerp(2200, 1640, n2), 700, .75, .06 + wob()); if (n2 > .9) tape(ctx, 1660, 480, 110, .25);
    // 红色大圆
    const rc = E.outBack(seg(q, .5, .9)); ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(700, 560, 330 * rc, 0, 7); ctx.fill();
    // 相机剪报落下
    const cd = seg(q, .8, 1.3), cx = 700, cy = lerp(-300, 560, E.outC(cd)), crot = lerp(-.4, -.05, E.outC(cd)) + wob();
    const lidGone = seg(q, 3.2, 3.9), opened = q >= 3.2;
    if (cd > 0) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(crot); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 16; ctx.shadowOffsetX = 6; ctx.shadowOffsetY = 10;
      const ox = -CAM.width / 2, oy = -CAM.height / 2, lx = ox + 20 + LENS.x, ly = oy + 20 + LENS.y;
      if (!opened) ctx.drawImage(CAM, ox, oy); else { ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, CAM.width, CAM.height); ctx.arc(lx, ly, LENS.r, 0, 7, true); ctx.clip(); ctx.drawImage(CAM, ox, oy); ctx.restore(); ctx.shadowColor = 'transparent';
        // 镜头里：一片纸剪的天空
        ctx.save(); ctx.beginPath(); ctx.arc(lx, ly, LENS.r, 0, 7); ctx.clip(); const g = ctx.createLinearGradient(0, ly - LENS.r, 0, ly + LENS.r); g.addColorStop(0, '#5DA9E9'); g.addColorStop(1, '#BFE3FF'); ctx.fillStyle = g; ctx.fillRect(lx - LENS.r, ly - LENS.r, LENS.r * 2, LENS.r * 2);
        cloud(ctx, lx - 110 + q * 10, ly - 20, 1); cloud(ctx, lx + 10 - q * 6, ly + 50, .8); ctx.fillStyle = '#FFD24A'; ctx.beginPath(); ctx.arc(lx + 70, ly - 70, 30, 0, 7); ctx.fill(); ctx.restore();
        ctx.strokeStyle = CREAM; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(lx, ly, LENS.r, 0, 7); ctx.stroke(); }
      // 虚线 + 剪刀沿着走
      const dl = seg(q, 1.8, 2.3); if (dl > 0 && !opened) { ctx.shadowColor = 'transparent'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.setLineDash([16, 12]); ctx.beginPath(); ctx.arc(lx, ly, LENS.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * dl); ctx.stroke(); ctx.setLineDash([]); }
      const sc = seg(q, 2.4, 3.2); if (sc > 0 && sc < 1) { const a = -Math.PI / 2 + sc * Math.PI * 2; scissors(ctx, lx + Math.cos(a) * LENS.r, ly + Math.sin(a) * LENS.r, a + Math.PI / 2, .25 + .2 * Math.abs(Math.sin(q * 30))); }
      ctx.restore();
      // 剪下来的镜头盖：翻起来飞走
      if (opened && lidGone < 1) { const lx2 = cx + (-CAM.width / 2 + 20 + LENS.x) + lerp(0, 520, E.inC(lidGone)), ly2 = cy + (-CAM.height / 2 + 20 + LENS.y) - 380 * Math.sin(lidGone * Math.PI * .8);
        ctx.save(); ctx.translate(lx2, ly2); ctx.rotate(lidGone * 4); ctx.scale(1 - lidGone * .3, Math.cos(lidGone * 2.4)); ctx.beginPath(); ctx.arc(0, 0, LENS.r, 0, 7); ctx.clip(); ctx.drawImage(CAM, -(20 + LENS.x), -(20 + LENS.y)); ctx.restore(); }
    }
    if (q > 1.8) label(ctx, 300, 900, -.06, '沿虚线剪开', 'CUT ALONG THE LINE');
    // 从镜头里涌出来的拼贴：每个零件从镜头位置沿弧线飞到自己的位置
    const lensX = cx - CAM.width / 2 + 20 + LENS.x, lensY = 560 - CAM.height / 2 + 20 + LENS.y;
    for (const [k, x, y, s, rot, t0] of OUT) { const u = E.outBack(seg(q, t0, t0 + .5)); if (u <= 0) continue; piece(ctx, A[k], lerp(lensX, x, u), lerp(lensY, y, u) - Math.sin(u * Math.PI) * 120, s * Math.min(1, u * 1.4), rot + wob() * 3); }
    if (q > 4.4) stamp(ctx, 1700, 940, spring(t - 4.4, 3, .45), .08);
    // 转场：红纸从左边撕进来
    const rp = E.inOutC(seg(q, 5.4, 6.0)); if (rp > 0) { const x0 = lerp(-200, W + 400, rp);
      ctx.save(); tornEdge(ctx, x0 + 10, 7); ctx.fillStyle = '#F4EFE6'; ctx.fill(); ctx.restore(); ctx.save(); tornEdge(ctx, x0, 7); ctx.clip(); ctx.drawImage(A.red, 0, 0, W, H);
      if (q > 5.9) end(ctx, t, q, wob); ctx.restore(); }
    vignette(ctx, .25, '40,25,10'); grain(ctx, t, .05);
  },
  audio() {
    const m = new Mix(DUR + .3);
    for (let b = .5; b < DUR; b += .5) { m.kick(b, .3); if ((b * 2) % 2 === 1) m.snare(b, .12); m.hat(b + .25, .04); }
    const bass = [40, 40, 43, 38]; for (let i = 0; i < 18; i++) m.tone(.5 + i * .5, .4, 440 * 2 ** ((bass[i % 4] - 69) / 12), { wave: 'saw', vol: .05, env: [.01, .2, .4, .1] });
    m.whoosh(0, .4, .1); m.whoosh(.25, .4, .1); m.thud(.6, .4); m.thud(1.3, .5);
    for (let i = 0; i < 6; i++) m.tone(1.8 + i * .08, .03, 3000, { wave: 'noise', vol: .03 }); for (let i = 0; i < 10; i++) m.tone(2.4 + i * .08, .05, 1800 + (i % 2) * 400, { wave: 'noise', vol: .05 });
    m.pop(3.2, .3); m.whoosh(3.3, .5, .1); OUT.forEach(o => m.pop(o[5], .14)); m.thud(4.4, .4);
    m.tone(5.4, .6, 2000, { wave: 'noise', vol: .12, env: [.01, .1, .6, .2] }); m.thud(6.1, .5); m.ding(6.6, .14); m.pop(7, .2);
    m.echo(.18, .2, .15); return m.master();
  },
};
function end(ctx, t, q, wob) {
  const s1 = E.outC(seg(q, 6.1, 6.5));
  ctx.save(); ctx.translate(lerp(-900, 820, s1), 470); ctx.rotate(-.04 + wob());
  ctx.fillStyle = '#F7F3EA'; ctx.beginPath(); const r = rng(11); ctx.moveTo(-620, -150); for (let x = -620; x <= 620; x += 24) ctx.lineTo(x, -150 + (r() - .5) * 14); for (let y = -150; y <= 150; y += 20) ctx.lineTo(620 + (r() - .5) * 14, y); for (let x = 620; x >= -620; x -= 24) ctx.lineTo(x, 150 + (r() - .5) * 14); for (let y = 150; y >= -150; y -= 20) ctx.lineTo(-620 + (r() - .5) * 14, y); ctx.fill();
  ctx.fillStyle = INK; ctx.font = `900 220px ${CN}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('漫游周刊', 0, -10); ctx.restore();
  const s2 = E.outC(seg(q, 6.5, 6.9)); ctx.save(); ctx.translate(lerp(2400, 700, s2), 680); ctx.rotate(.03); ctx.fillStyle = INK; ctx.fillRect(-300, -40, 600, 80); ctx.fillStyle = '#F7F3EA'; ctx.font = `400 54px ${IMPACT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '6px'; ctx.fillText('WANDER WEEKLY', 0, 4); ctx.restore();
  ctx.fillStyle = '#F7F3EA'; ctx.font = `700 34px ${CN}`; ctx.textAlign = 'left'; ctx.globalAlpha = seg(q, 6.9, 7.2); ctx.fillText('看见 · 收集 · 拼起来', 230, 800); ctx.globalAlpha = 1;
  if (q > 6.8) { piece(ctx, A.bfly_a, 1560, 300, .9, .3 + wob() * 3); piece(ctx, A.rose_centi, 1640, 720, .9, -.15); }
  const k = spring(t - 7.2, 2.6, .45); if (k > 0) { ctx.save(); ctx.translate(1420, 820); ctx.rotate(-.2 + t * .3); ctx.scale(k, k); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 110, 0, 7); ctx.fill();
    ctx.fillStyle = '#F7F3EA'; ctx.font = `800 34px ${CN}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('订阅', 0, -22); ctx.fillText('送贴纸', 0, 22);
    ctx.font = `700 13px ${MONO}`; const s = 'STICKERS INCLUDED · STICKERS INCLUDED · '; [...s].forEach((c, i) => { ctx.save(); ctx.rotate(i / s.length * Math.PI * 2); ctx.fillText(c, 0, -90); ctx.restore(); }); ctx.restore(); }
}
