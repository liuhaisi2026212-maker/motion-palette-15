// 贴纸人科普 · 虚构栏目「量一量 MEASURE LAB」No.012：一杯奶茶里有多少糖（示意数据）。原版语法：浅蓝灰点阵底、两行超粗黑标题 + 关键词红底线、
// 字距拉开的英文副标题、分隔线、占位小方框；实物贴纸（白边 + 投影）斜着滑进来；左下品牌角标、底部章节进度；镜头在大画布上平移；
// 结论页深色底：手机里嵌着前面的画面（画中画）+ 超大数字 + 一句结论 + 小字说明。
import { clamp, lerp, seg, E, spring, rng, Mix, backing } from './lib/core.js';
import { grain } from './lib/draw.js';

const W = 1920, H = 1080, DUR = 10.5;
const CN = '"PingFang SC", "Noto Sans SC", sans-serif', SANS = '"Avenir Next", "Helvetica Neue", Arial, sans-serif';
const INK = '#1E2630', RED = '#FF4A2E', BG = '#E8EDF2', NAVY = '#1E2630';
let CUP, CUBE, PAGE, pctx;

// ---------- 贴纸：画好的物件外面加白边（偏移叠印）+ 一点投影 ----------
function stickerize(src, white = 14) {
  const out = document.createElement('canvas'); out.width = src.width; out.height = src.height; const o = out.getContext('2d'), c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const x = c.getContext('2d');
  for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2; x.drawImage(src, Math.cos(a) * white, Math.sin(a) * white); } x.globalCompositeOperation = 'source-in'; x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, c.width, c.height);
  o.drawImage(c, 0, 0); o.drawImage(src, 0, 0); return out;
}
function makeCup() {
  const c = document.createElement('canvas'); c.width = 520; c.height = 760; const x = c.getContext('2d'); x.translate(260, 400);
  x.fillStyle = '#E9E2D6'; x.beginPath(); x.moveTo(-150, -200); x.lineTo(150, -200); x.lineTo(118, 300); x.quadraticCurveTo(0, 330, -118, 300); x.closePath(); x.fill();
  let g = x.createLinearGradient(0, -200, 0, 300); g.addColorStop(0, '#E8C9A3'); g.addColorStop(1, '#C99467'); x.fillStyle = g; x.beginPath(); x.moveTo(-146, -150); x.lineTo(146, -150); x.lineTo(118, 296); x.quadraticCurveTo(0, 324, -118, 296); x.closePath(); x.fill();
  const r = rng(6); for (let i = 0; i < 26; i++) { const px = (r() - .5) * 200, py = 200 + r() * 90; const pg = x.createRadialGradient(px - 5, py - 5, 2, px, py, 18); pg.addColorStop(0, '#6B4A3A'); pg.addColorStop(1, '#2A1A14'); x.fillStyle = pg; x.beginPath(); x.arc(px * (1 - (py - 200) / 600), py, 17, 0, 7); x.fill(); }
  x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(-130, -140, 26, 400);
  x.fillStyle = '#FFFFFF'; x.fillRect(-150, -10, 300, 120); x.fillStyle = RED; x.font = `900 46px ${CN}`; x.textAlign = 'center'; x.fillText('全糖', 0, 50); x.fillStyle = INK; x.font = `700 22px ${SANS}`; x.fillText('500 ml · NO ICE', 0, 90);
  x.fillStyle = '#F4F1EA'; x.beginPath(); x.ellipse(0, -200, 170, 36, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(0, -214, 140, 70, 0, Math.PI, 0); x.fill();
  x.fillStyle = 'rgba(0,0,0,.08)'; x.beginPath(); x.ellipse(0, -200, 170, 36, 0, 0, Math.PI); x.fill();
  x.save(); x.rotate(.18); x.fillStyle = '#FF7A59'; x.fillRect(-14, -420, 28, 260); x.fillStyle = 'rgba(255,255,255,.3)'; x.fillRect(-10, -420, 8, 260); x.restore();
  return stickerize(c);
}
function makeCube() {
  const c = document.createElement('canvas'); c.width = 130; c.height = 130; const x = c.getContext('2d'); x.translate(65, 70);
  x.fillStyle = '#FFFFFF'; x.beginPath(); x.moveTo(0, -44); x.lineTo(40, -22); x.lineTo(0, 0); x.lineTo(-40, -22); x.fill();
  x.fillStyle = '#E3E8EF'; x.beginPath(); x.moveTo(-40, -22); x.lineTo(0, 0); x.lineTo(0, 44); x.lineTo(-40, 22); x.fill();
  x.fillStyle = '#C9D1DC'; x.beginPath(); x.moveTo(40, -22); x.lineTo(0, 0); x.lineTo(0, 44); x.lineTo(40, 22); x.fill();
  const r = rng(2); x.fillStyle = 'rgba(160,170,185,.6)'; for (let i = 0; i < 40; i++) x.fillRect((r() - .5) * 70, (r() - .5) * 70, 2, 2);
  const out = stickerize(c, 7); const o = document.createElement('canvas'); o.width = 130; o.height = 130; const oc = o.getContext('2d'); oc.shadowColor = 'rgba(30,38,48,.25)'; oc.shadowBlur = 8; oc.shadowOffsetY = 4; oc.drawImage(out, 0, 0); return o;
}
function piece(ctx, img, x, y, s, rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.shadowColor = 'rgba(30,38,48,.22)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12; ctx.drawImage(img, -img.width * s / 2, -img.height * s / 2, img.width * s, img.height * s); ctx.restore(); }
const T = (ctx, s, x, y, size, color = INK, w = 700, align = 'left', font = CN, ls = 0) => { ctx.font = `${w} ${size}px ${font}`; ctx.letterSpacing = `${ls}px`; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.letterSpacing = '0px'; };

// ---------- 大画布（世界坐标 2900 宽）：左边标题区，右边拆解区 ----------
const CAMS = [{ t: 0, x: 960, z: 1 }, { t: 3.6, x: 1940, z: 1 }];
function camAt(t) { const u = E.inOutC(seg(t, 3.6, 4.6)); return { x: lerp(960, 1940, u), z: 1 }; }
function world(ctx, t) {
  ctx.fillStyle = BG; ctx.fillRect(-200, -200, 3300, 1500); ctx.fillStyle = 'rgba(30,38,48,.13)'; for (let x = 0; x < 3000; x += 40) for (let y = 20; y < 1080; y += 40) ctx.fillRect(x, y, 3, 3);
  // 标题：两行超粗，关键词下面红色粗底线
  const a = E.outExpo(seg(t, .2, 1)), b = E.outExpo(seg(t, .45, 1.25));
  ctx.save(); ctx.globalAlpha = a; T(ctx, '一杯奶茶里，', 130, 250 + (1 - a) * 30, 112, INK, 900); ctx.restore();
  const ul = E.inOutC(seg(t, 1.2, 1.7)); ctx.fillStyle = RED; ctx.fillRect(130 + 2 * 112 + 4, 392, 5 * 112 * ul, 30);
  ctx.save(); ctx.globalAlpha = b; T(ctx, '藏着多少块方糖？', 130, 400 + (1 - b) * 30, 112, INK, 900); ctx.restore();
  const c = E.outC(seg(t, 1.4, 2)); ctx.globalAlpha = c; T(ctx, 'HOW MUCH SUGAR HIDES IN ONE CUP?', 134, 490, 24, '#8A97A6', 700, 'left', SANS, 7);
  ctx.fillStyle = '#AFBAC6'; ctx.fillRect(134, 530, 520 * c, 4); T(ctx, '拆开一杯全糖奶茶，一块一块数', 134, 590, 30, '#4A5664', 500); ctx.globalAlpha = 1;
  // 占位方框：后面会被一块块方糖填满
  const n = Math.floor(clamp((t - 4.9) / .12, 0, 15));
  for (let i = 0; i < 15; i++) { const k = E.outBack(seg(t, 1.8 + i * .03, 2.1 + i * .03)), x = 134 + (i % 15) * 62, y = 650; if (k <= 0) continue; ctx.strokeStyle = '#9BA7B4'; ctx.lineWidth = 2.5; ctx.strokeRect(x, y, 50 * k, 50 * k); }   // 占位小方框：预告后面要数的格子
  // 奶茶贴纸从右边斜着滑进来，镜头移过去后到中间
  const sl = E.outExpo(seg(t, .9, 1.9)); piece(ctx, CUP, lerp(2500, 1560, sl), 560 + Math.sin(t * 1.3) * 6, .95, lerp(.35, .1, sl));
  // 拆解区：三个带引线的标注
  [[1720, 300, 2050, 230, '奶盖 · 炼乳', '≈ 12 g'], [1640, 560, 2060, 520, '果糖糖浆', '≈ 38 g'], [1600, 830, 2060, 820, '珍珠 · 糖浆浸泡', '≈ 12 g']].forEach(([ax, ay, lx, ly, a1, a2], i) => {
    const p = E.inOutC(seg(t, 4.3 + i * .3, 4.8 + i * .3)); if (p <= 0) return; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(ax, ay); const mx = lerp(ax, lx - 40, p); ctx.lineTo(mx, lerp(ay, ly, Math.min(1, p * 1.3))); if (p > .75) ctx.lineTo(lx - 20, ly); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ax, ay, 7, 0, 7); ctx.fill();
    if (p > .8) { const k = E.outC(seg(t, 4.65 + i * .3, 5 + i * .3)); ctx.globalAlpha = k; T(ctx, a1, lx, ly + 10, 38, INK, 800); T(ctx, a2, lx, ly + 62, 34, RED, 800, 'left', SANS); ctx.globalAlpha = 1; } });
  // 方糖一块块落进右边的 5×3 格子 + 计数
  const gx = 2420, gy = 260; for (let i = 0; i < 15; i++) { const cx = gx + (i % 5) * 84, cy = gy + Math.floor(i / 5) * 84, k0 = E.outBack(seg(t, 4.2 + i * .02, 4.5 + i * .02)); if (k0 <= 0) continue;
    ctx.strokeStyle = '#9BA7B4'; ctx.lineWidth = 2.5; ctx.strokeRect(cx, cy, 70 * k0, 70 * k0); }
  for (let i = 0; i < n; i++) { const k = spring(t - 4.9 - i * .12, 3, .45), cx = gx + (i % 5) * 84 + 35, cy = gy + Math.floor(i / 5) * 84 + 32; piece(ctx, CUBE, cx, cy - (1 - Math.min(1, k)) * 50, .62 * k, (i % 3 - 1) * .1); }
  if (t > 4.9) { ctx.globalAlpha = E.outC(seg(t, 4.9, 5.2)); T(ctx, `${n}`, gx, gy + 340, 120, RED, 900, 'left', SANS); ctx.font = `900 120px ${SANS}`; const w = ctx.measureText(`${n}`).width; T(ctx, '块方糖', gx + w + 16, gy + 330, 40, INK, 800); T(ctx, '≈ 62 g 添加糖', gx + w + 16, gy + 380, 28, '#4A5664', 600); ctx.globalAlpha = 1; }
}
function chrome(ctx, t, dark = false) {   // 左下品牌角标 + 底部章节进度
  const c = dark ? '#E8EDF2' : INK; ctx.fillStyle = RED; ctx.fillRect(60, 1012, 16, 16); T(ctx, '量一量', 88, 1028, 22, c, 800); T(ctx, 'MEASURE LAB', 168, 1027, 14, dark ? 'rgba(232,237,242,.6)' : '#8A97A6', 700, 'left', SANS, 3);
  const ch = t < 3.6 ? 0 : t < 6.6 ? 1 : 3; ['01 拆解', '02 计数', '03 对比', '04 结论'].forEach((s, i) => { const x = 820 + i * 230; ctx.fillStyle = i === ch ? RED : (dark ? 'rgba(232,237,242,.25)' : '#C3CCD6'); ctx.fillRect(x, 1000, 200, 3); T(ctx, s, x, 1032, 18, i === ch ? (dark ? '#FFF' : INK) : (dark ? 'rgba(232,237,242,.45)' : '#8A97A6'), 600); });
}
function conclusion(ctx, t) {
  ctx.fillStyle = '#1F2730'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = 'rgba(255,255,255,.04)'; for (let x = 0; x < W; x += 40) for (let y = 20; y < H; y += 40) ctx.fillRect(x, y, 3, 3);
  // 画中画：手机里是前面那页
  const p = E.outExpo(seg(t, 6.6, 7.4)), px = lerp(-500, 180, p); ctx.save(); ctx.translate(px, 90); ctx.rotate(-.04);
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(0, 0, 520, 960, 70); ctx.fill(); ctx.fillStyle = '#0E1216'; ctx.beginPath(); ctx.roundRect(14, 14, 492, 932, 58); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.roundRect(26, 26, 468, 908, 48); ctx.clip(); ctx.drawImage(PAGE, 0, 0, 1920, 1080, -40, 26, 1920 * .84, 1080 * .84); ctx.restore();
  ctx.fillStyle = '#0E1216'; ctx.beginPath(); ctx.roundRect(200, 34, 120, 26, 13); ctx.fill(); ctx.restore();
  // 右边：大数字 + 结论
  const a = E.outC(seg(t, 7, 7.4)); ctx.globalAlpha = a; ctx.fillStyle = RED; ctx.fillRect(840, 220, 16, 16); T(ctx, '一杯全糖奶茶的添加糖', 870, 237, 28, '#E8EDF2', 800); T(ctx, 'MEASURE · NO.012', 1190, 236, 16, 'rgba(232,237,242,.5)', 700, 'left', SANS, 3); ctx.globalAlpha = 1;
  const v = Math.round(62 * E.outC(seg(t, 7.2, 8.2))); if (t > 7.2) { ctx.save(); ctx.font = `900 330px ${SANS}`; ctx.fillStyle = '#FF5A36'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(`${v}g`, 820, 560); const w = ctx.measureText(`${v}g`).width; ctx.font = `800 110px ${SANS}`; ctx.fillStyle = '#7D8996'; ctx.fillText('/25g', 840 + w, 560); ctx.restore(); }
  const c = E.outC(seg(t, 8, 8.5)); ctx.globalAlpha = c; T(ctx, '一杯，就超了每日建议的 ', 840, 680, 52, '#FFFFFF', 800); ctx.font = `800 52px ${CN}`; const w0 = ctx.measureText('一杯，就超了每日建议的 ').width, ul = E.inOutC(seg(t, 8.3, 8.7));
  ctx.font = `900 52px ${CN}`; const w1 = ctx.measureText('2.5 倍').width; ctx.fillStyle = RED; ctx.fillRect(840 + w0, 664, w1 * ul, 18); T(ctx, '2.5 倍', 840 + w0, 680, 52, '#FFFFFF', 900);
  T(ctx, '* 示意数据：按 500 ml 全糖估算；每日建议添加糖不超过 25 g。', 842, 760, 20, 'rgba(232,237,242,.5)', 500); ctx.globalAlpha = 1;
}

export default {
  width: W, height: H, fps: 30, duration: DUR,
  fonts: [[`900 112px ${CN}`, '一杯奶茶里，藏着多少块方糖？拆开全糖一块数量一量拆解计数对比结论奶盖炼乳果糖糖浆珍珠浸泡块方糖的添加糖就超了每日建议倍示意数据按估算不超过']],
  setup() { CUP = makeCup(); CUBE = makeCube(); PAGE = document.createElement('canvas'); PAGE.width = W; PAGE.height = H; pctx = PAGE.getContext('2d'); },
  draw(ctx, t) {
    if (t < 6.6) { const c = camAt(t); ctx.save(); ctx.translate(960 - c.x, 0); world(ctx, t); ctx.restore(); chrome(ctx, t);
      if (t > 6.2) { pctx.save(); pctx.clearRect(0, 0, W, H); pctx.translate(0, 0); world(pctx, 3.5); pctx.restore(); }
      const wipe = E.inC(seg(t, 6.3, 6.6)); if (wipe > 0) { ctx.fillStyle = '#1F2730'; ctx.fillRect(W * (1 - wipe), 0, W * wipe, H); } }
    else { if (!PAGE.__done) { pctx.clearRect(0, 0, W, H); world(pctx, 3.5); chrome(pctx, 3.5); PAGE.__done = true; } conclusion(ctx, t); chrome(ctx, t, true); }
    grain(ctx, t, .02);
  },
  audio() {
    const m = new Mix(DUR + .3); backing(m, DUR, { bpm: 100, root: 62, drums: true });
    m.whoosh(.2, .4, .08); m.pop(1.2, .1); for (let i = 0; i < 15; i++) m.tone(1.8 + i * .03, .02, 2400, { vol: .02 }); m.whoosh(.9, .6, .08);
    m.whoosh(3.6, .9, .07); [4.3, 4.6, 4.9].forEach(t0 => m.pop(t0 + .35, .12)); for (let i = 0; i < 15; i++) m.tone(4.9 + i * .12, .04, 1400 + i * 40, { vol: .05 });
    m.whoosh(6.3, .4, .1); m.thud(6.7, .4); for (let i = 0; i < 20; i++) m.tone(7.2 + i * .05, .015, 3000, { wave: 'noise', vol: .03 }); m.ding(8.2, .14); m.pop(8.6, .12);
    m.echo(.2, .25, .15); return m.master();
  },
};
