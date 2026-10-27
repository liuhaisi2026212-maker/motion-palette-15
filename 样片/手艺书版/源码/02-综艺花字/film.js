// 综艺花字竖屏（重做版）· 主题「周一早上」。学原版的语法：主体做成白边贴纸（撕纸底）放在放射底上、强调线、双层爆炸框、
// 警示条、人物名牌、检测仪表、相框卡 + 圆形印章、渐变花字、闪光星星、左上角栏目牌贯穿全片。主体是自己画的咖啡杯吉祥物（实际使用时换成用户照片抠图）。
import { clamp, lerp, seg, E, spring, rng, beats, Mix, backing } from './lib/core.js';
import { text, fancyText, rrect, burst, speedLines, grain, vignette } from './lib/draw.js';

const W = 1080, H = 1920, CX = 470;    // 右侧留给抖音按钮，主体略偏左
const FUN = '"ZCOOL KuaiLe", sans-serif', HAND = '"LXGW Marker Gothic", sans-serif', CN = '"PingFang SC", "Noto Sans SC", sans-serif';
const NAVY = '#1B1F4B';
const TEXT = { show: '打工人日记', ep: 'EP.01', role: '本期主角', name: '咖啡杯', duty: '续命担当', warn: '周一预警', boom: '周一了!!', gauge: '困意检测', over: '爆表!', sub: '（小声）但还是得去上班', end: '冲鸭!', follow: '关注我～', stamp: ['打工人', '认证'], ring: 'MONDAY SURVIVOR · OFFICIAL · ' };
const INK = {
  red: { top: '#FFE3E3', bot: '#FF2D55', outer: NAVY, deep: '#0B0E2E' },
  blue: { top: '#E6FBFF', bot: '#2F9BFF', outer: NAVY, deep: '#0B0E2E' },
  purple: { top: '#FFD6F5', bot: '#B35CFF', outer: '#4A1A9E', deep: '#24084F' },
  orange: { top: '#FFF6A8', bot: '#FF9A1F', outer: '#FF3D8B', deep: '#8E0F4A' },
};
const B = beats([['open', 1.6], ['intro', 1.8], ['boom', 2.0], ['sub', 1.2], ['end', 1.8]]);

// ---------- 背景 ----------
function stripes(ctx, t, a = '#2EC5F0', b = '#FFFFFF') { ctx.fillStyle = a; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.fillStyle = b; ctx.translate(-400 + (t * 60) % 140, 0); ctx.rotate(-.5);
  for (let x = -1400; x < 2600; x += 140) ctx.fillRect(x, -800, 62, 4000); ctx.restore(); }
function sunburst(ctx, t, cx, cy, a = '#FF6FAE', b = '#FFC93C', n = 22) { ctx.fillStyle = a; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * .12); ctx.fillStyle = b;
  for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 2600, i / n * Math.PI * 2, (i + .5) / n * Math.PI * 2); ctx.fill(); } ctx.restore(); }
function sparkle(ctx, x, y, r, col = '#FFF6B0') { ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * .22 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fillStyle = col; ctx.fill(); }
function sparkles(ctx, t, list) { list.forEach(([x, y, r, ph]) => { const k = .5 + .5 * Math.sin(t * 6 + ph); if (k > .15) sparkle(ctx, x, y, r * k); }); }

// ---------- 吉祥物（画一次存成贴纸） ----------
function mascot(x, mood) {
  x.lineJoin = 'round'; x.lineCap = 'round';
  // 把手
  x.lineWidth = 34; x.strokeStyle = NAVY; x.beginPath(); x.arc(200, 20, 90, -1.2, 1.2); x.stroke(); x.lineWidth = 16; x.strokeStyle = '#FFFFFF'; x.stroke();
  // 杯身
  const body = new Path2D(); body.moveTo(-190, -160); body.lineTo(190, -160); body.lineTo(150, 230); body.quadraticCurveTo(145, 260, 115, 260); body.lineTo(-115, 260); body.quadraticCurveTo(-145, 260, -150, 230); body.closePath();
  x.fillStyle = '#FFFFFF'; x.fill(body); x.save(); x.clip(body); x.fillStyle = '#FF8A3D'; x.fillRect(-220, 70, 440, 110); x.fillStyle = 'rgba(27,31,75,.08)'; x.fillRect(80, -170, 140, 440); x.restore();
  x.lineWidth = 12; x.strokeStyle = NAVY; x.stroke(body);
  x.font = `400 70px ${FUN}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#FFFFFF'; x.fillText('MON', 0, 128);
  // 咖啡液面
  x.beginPath(); x.ellipse(0, -160, 190, 38, 0, 0, Math.PI * 2); x.fillStyle = '#FFFFFF'; x.fill(); x.lineWidth = 12; x.stroke();
  x.beginPath(); x.ellipse(0, -156, 160, 26, 0, 0, Math.PI * 2); x.fillStyle = '#7A4A2A'; x.fill();
  // 脸
  x.fillStyle = '#FF9EB5'; x.beginPath(); x.ellipse(-105, 10, 30, 18, 0, 0, Math.PI * 2); x.ellipse(105, 10, 30, 18, 0, 0, Math.PI * 2); x.fill();
  x.strokeStyle = NAVY; x.fillStyle = NAVY; x.lineWidth = 10;
  if (mood === 'sleepy') { for (const s of [-1, 1]) { x.beginPath(); x.arc(s * 70, -50, 30, .2, Math.PI - .2); x.stroke(); }
    x.beginPath(); x.ellipse(0, 30, 16, 20, 0, 0, Math.PI * 2); x.fill(); }
  else if (mood === 'shock') { for (const s of [-1, 1]) { x.beginPath(); x.arc(s * 70, -45, 36, 0, Math.PI * 2); x.fillStyle = '#FFFFFF'; x.fill(); x.stroke(); x.fillStyle = NAVY; x.beginPath(); x.arc(s * 70, -40, 11, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.moveTo(s * 40, -105); x.lineTo(s * 100, -118); x.stroke(); }
    x.beginPath(); x.moveTo(-40, 40); for (let i = 0; i <= 8; i++) x.lineTo(-40 + i * 10, 40 + (i % 2 ? -10 : 10)); x.stroke(); }
  else { for (const s of [-1, 1]) { x.beginPath(); x.arc(s * 70, -40, 26, Math.PI + .3, -.3); x.stroke(); }
    x.beginPath(); x.moveTo(-50, 20); x.quadraticCurveTo(0, 90, 50, 20); x.closePath(); x.fillStyle = NAVY; x.fill(); x.fillStyle = '#FF6F8E'; x.beginPath(); x.ellipse(0, 52, 22, 12, 0, 0, Math.PI * 2); x.fill(); }
}
// 贴纸：主体外面一圈白边 + 一圈深色细边（把图在一圈方向上偏移叠印，再填色）
function stickerize(src, white = 18, dark = 6) {
  const out = document.createElement('canvas'); out.width = src.width; out.height = src.height; const o = out.getContext('2d');
  const ring = (r, col) => { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const x = c.getContext('2d');
    for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2; x.drawImage(src, Math.cos(a) * r, Math.sin(a) * r); } x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return c; };
  o.drawImage(ring(white + dark, NAVY), 0, 0); o.drawImage(ring(white, '#FFFFFF'), 0, 0); o.drawImage(src, 0, 0); return out;
}
function tornPaper(seed) {   // 撕纸底：锯齿边的白纸 + 一点灰色纸边
  const c = document.createElement('canvas'); c.width = 900; c.height = 980; const x = c.getContext('2d'), r = rng(seed); x.translate(450, 500);
  const pts = []; for (let i = 0; i < 90; i++) { const a = i / 90 * Math.PI * 2, k = 1 + (r() - .5) * .16 + (i % 2 ? .05 : -.05); pts.push([Math.cos(a) * 360 * k, Math.sin(a) * 420 * k]); }
  x.beginPath(); pts.forEach(([a, b]) => x.lineTo(a + 8, b + 10)); x.closePath(); x.fillStyle = 'rgba(0,0,0,.18)'; x.fill();
  x.beginPath(); pts.forEach(([a, b]) => x.lineTo(a, b)); x.closePath(); x.fillStyle = '#FFFFFF'; x.fill(); x.lineWidth = 4; x.strokeStyle = '#D9D9E3'; x.stroke(); return c;
}
function stampCanvas() {   // 圆形红印章：双圈 + 环形字 + 中间两行字 + 斑驳
  const c = document.createElement('canvas'); c.width = c.height = 360; const x = c.getContext('2d'); x.translate(180, 180); const red = '#E0282E';
  x.strokeStyle = red; x.lineWidth = 10; x.beginPath(); x.arc(0, 0, 160, 0, Math.PI * 2); x.stroke(); x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 112, 0, Math.PI * 2); x.stroke();
  x.fillStyle = red; x.font = `700 26px ${CN}`; x.textAlign = 'center'; x.textBaseline = 'middle'; const ring = [...TEXT.ring];
  ring.forEach((ch, i) => { x.save(); x.rotate(i / ring.length * Math.PI * 2); x.fillText(ch, 0, -136); x.restore(); });
  x.font = `400 70px ${FUN}`; x.fillText(TEXT.stamp[0], 0, -30); x.fillText(TEXT.stamp[1], 0, 46);
  x.globalCompositeOperation = 'destination-out'; const r = rng(5); for (let i = 0; i < 900; i++) { x.globalAlpha = r() * .8; x.beginPath(); x.arc((r() - .5) * 360, (r() - .5) * 360, r() * 4, 0, Math.PI * 2); x.fill(); }
  return c;
}
let ST = {}, PAPER = null, STAMP = null;

// ---------- 零件 ----------
function showTag(ctx, x, y, s) {   // 栏目牌：黄色胶囊 + 深蓝粗边 + 顶上两缕热气 + 粉色期号
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-.04);
  ctx.strokeStyle = NAVY; ctx.lineWidth = 8; ctx.lineCap = 'round'; for (const dx of [-70, 70]) { ctx.beginPath(); ctx.moveTo(dx, -48); ctx.bezierCurveTo(dx - 18, -70, dx + 18, -84, dx, -104); ctx.stroke(); }
  rrect(ctx, -180, -50, 360, 100, 50, '#FFD84A', NAVY, 10); text(ctx, TEXT.show, 0, 2, { size: 62, font: FUN, weight: 400, color: NAVY });
  ctx.rotate(.08); rrect(ctx, 196, -34, 130, 64, 20, '#FF3D8B', NAVY, 8); text(ctx, TEXT.ep, 261, -1, { size: 40, font: FUN, weight: 400, color: '#FFFFFF' });
  ctx.restore();
}
function subject(ctx, mood, x, y, s, rot = 0, paper = true) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); if (paper) ctx.drawImage(PAPER, -450, -500); ctx.drawImage(ST[mood], -400, -470); ctx.restore(); }
function ticks(ctx, t, cx, cy, r, n = 6) {   // 强调线：主体周围一组一组的短弧线，轮流闪
  ctx.strokeStyle = NAVY; ctx.lineCap = 'round'; ctx.lineWidth = 9;
  for (let i = 0; i < n; i++) { if ((Math.floor(t * 8) + i) % 3 === 0) continue; const a = -Math.PI / 2 + (i - (n - 1) / 2) * .5 + (i >= n / 2 ? .6 : -.6);
    for (let j = -1; j <= 1; j++) { const aa = a + j * .09; ctx.beginPath(); ctx.moveTo(cx + Math.cos(aa) * r, cy + Math.sin(aa) * r); ctx.lineTo(cx + Math.cos(aa) * (r + 60), cy + Math.sin(aa) * (r + 60)); ctx.stroke(); } }
}
function hazardBar(ctx, x, y, w, h, s) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-.05); ctx.scale(s, s);
  ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.clip(); ctx.fillStyle = '#1B1B1B'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.fillStyle = '#FFD400';
  for (let i = -20; i < 40; i++) { ctx.beginPath(); ctx.moveTo(-w / 2 + i * 40, h / 2); ctx.lineTo(-w / 2 + i * 40 + 20, h / 2); ctx.lineTo(-w / 2 + i * 40 + 20 + h, -h / 2); ctx.lineTo(-w / 2 + i * 40 + h, -h / 2); ctx.fill(); } ctx.restore();
  rrect(ctx, -w / 2 + 16, -h / 2 + 14, w - 32, h - 28, 8, '#FFE45E', NAVY, 5);
  for (const sx of [-1, 1]) { const tx = sx * (w / 2 - 70); ctx.beginPath(); ctx.moveTo(tx, -24); ctx.lineTo(tx + 26, 22); ctx.lineTo(tx - 26, 22); ctx.closePath(); ctx.fillStyle = '#FF2D55'; ctx.fill(); text(ctx, '!', tx, 6, { size: 30, color: '#FFF', weight: 900 }); }
  text(ctx, TEXT.warn, 0, 4, { size: 70, font: FUN, weight: 400, color: '#FF2D55', stroke: '#FFFFFF', strokeW: 12 }); ctx.restore();
}
function nameplate(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-.12); ctx.scale(s, s);
  rrect(ctx, -110, -110, 220, 54, 27, NAVY); text(ctx, TEXT.role, 0, -82, { size: 34, font: FUN, weight: 400, color: '#FFFFFF' });
  fancyText(ctx, TEXT.name, 0, 10, 120, INK.blue, { font: FUN, weight: 400 });
  rrect(ctx, -100, 80, 200, 50, 25, '#FFD84A', NAVY, 5); text(ctx, TEXT.duty, 0, 106, { size: 32, font: FUN, weight: 400, color: NAVY }); ctx.restore();
}
function gauge(ctx, t, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(.06); ctx.scale(s, s);
  rrect(ctx, -150, -100, 300, 210, 26, '#FFFFFF', NAVY, 8); rrect(ctx, -100, -128, 200, 50, 25, '#FF3D8B', NAVY, 6); text(ctx, TEXT.gauge, 0, -103, { size: 32, font: FUN, weight: 400, color: '#FFF' });
  const cols = ['#2FCB6B', '#9BDB3A', '#FFD400', '#FF9A1F', '#FF2D55']; cols.forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 26; ctx.beginPath(); ctx.arc(0, 60, 90, Math.PI + i / 5 * Math.PI + .02, Math.PI + (i + 1) / 5 * Math.PI - .02); ctx.stroke(); });
  const u = seg(t, B.boom.t0 + .5, B.boom.t0 + 1.2), ang = Math.PI + lerp(.15, 1.08, E.outElastic(u)) * Math.PI + (u >= 1 ? .03 * Math.sin(t * 40) : 0);   // 指针甩过头到爆表，抖着停住
  ctx.strokeStyle = NAVY; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 60); ctx.lineTo(Math.cos(ang) * 92, 60 + Math.sin(ang) * 92); ctx.stroke(); ctx.fillStyle = NAVY; ctx.beginPath(); ctx.arc(0, 60, 14, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (t > B.boom.t0 + 1.1) { const k = spring(t - B.boom.t0 - 1.1, 3, .4); ctx.save(); ctx.translate(x + 60, y + 150); ctx.scale(k, k); fancyText(ctx, TEXT.over, 0, 0, 84, INK.red, { rot: -.15, font: FUN, weight: 400 }); ctx.restore(); }
}
function sweat(ctx, x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath(); ctx.moveTo(0, -46); ctx.bezierCurveTo(26, -10, 30, 10, 0, 30); ctx.bezierCurveTo(-30, 10, -26, -10, 0, -46); ctx.fillStyle = '#BFF0FF'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = NAVY; ctx.stroke(); ctx.restore(); }

// ---------- 镜头 ----------
function shotOpen(ctx, t) {
  stripes(ctx, t);
  const k = spring(t - .1, 2.4, .42), mv = E.inOutC(seg(t, 1.3, 1.6));
  showTag(ctx, lerp(CX - 70, 210, mv), lerp(900, 250, mv), lerp(1.5 * k, .5, mv));
  if (t < 1.3) sparkles(ctx, t, [[160, 640, 40, 0], [880, 760, 30, 2], [220, 1140, 34, 4], [820, 1220, 44, 1]]);
}
function shotIntro(ctx, t) {
  const t0 = B.intro.t0; sunburst(ctx, t, CX, 860);
  const k = spring(t - t0, 2.6, .45); subject(ctx, 'sleepy', CX, 860, .95 * k, -.03);
  steam(ctx, t, CX - 10, 860 - 270 * .95 * k, k);
  nameplate(ctx, 250, 1320, spring(t - t0 - .45, 2.8, .45));
  const w = spring(t - t0 - .8, 2.4, .5); if (w > 0) hazardBar(ctx, CX, 1520, 780, 130, w);
}
function steam(ctx, t, x, y, k) { if (k < .5) return; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 10; ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); for (let j = 0; j < 12; j++) { const yy = y - 20 - j * 12, xx = x + i * 60 + Math.sin(j * .6 + t * 5 + i) * 14; j ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); } }
function shotBoom(ctx, t) {
  const t0 = B.boom.t0; sunburst(ctx, t, CX, 760, '#FF5FA2', '#FFC93C');
  speedLines(ctx, CX, 820, Math.floor(t * 15), 'rgba(255,255,255,.8)', 44, 520);
  subject(ctx, 'shock', CX, 680, .95 * (1 + .04 * Math.sin((t - t0) * 30) * Math.exp(-(t - t0) * 4)), .02);
  ticks(ctx, t, CX, 600, 400);
  const bp = E.outElastic(seg(t, t0 + .1, t0 + .8));
  burst(ctx, CX, 1400, 400 * bp, 16, '#FF3D8B', NAVY, -.1); burst(ctx, CX, 1400, 315 * bp, 14, '#FFE45E', NAVY, .1);
  const k = spring(t - t0 - .15, 3, .38); ctx.save(); ctx.translate(CX, 1400); ctx.scale(k, k); fancyText(ctx, TEXT.boom, 0, 0, 170, INK.red, { rot: -.1 + .02 * Math.sin(t * 7), font: FUN, weight: 400 }); ctx.restore();
  gauge(ctx, t, 790, 400, spring(t - t0 - .4, 2.6, .45));
}
function shotSub(ctx, t) {
  const t0 = B.sub.t0; sunburst(ctx, t, CX, 760, '#FF5FA2', '#FFC93C');
  subject(ctx, 'sleepy', CX, 780, .95, .02); ticks(ctx, t, CX, 700, 400, 4);
  sweat(ctx, CX + 230, 560 + E.inQ(seg(t, t0 + .2, t0 + 1.1)) * 140, 1.4);
  const n = Math.floor(clamp((t - t0 - .1) * 16, 0, [...TEXT.sub].length));
  text(ctx, [...TEXT.sub].slice(0, n).join(''), CX, 1400, { size: 74, font: FUN, weight: 400, color: '#FFFFFF', stroke: '#2F6BFF', strokeW: 16 });
}
function shotEnd(ctx, t) {
  const t0 = B.end.t0; stripes(ctx, t, '#38C8F2', '#7FDCF7');
  sparkles(ctx, t, [[120, 420, 34, 0], [940, 380, 26, 1.5], [110, 1060, 30, 3], [960, 1000, 40, 4.5], [180, 1560, 26, 2], [900, 1500, 30, 5]]);
  // 相框卡：白边相片，里面是放射底 + 主体（开心）
  const k = spring(t - t0, 2.4, .5); ctx.save(); ctx.translate(CX, 700); ctx.rotate(.05); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(-300, -340, 620, 700); rrect(ctx, -320, -360, 620, 700, 18, '#FFFFFF');
  ctx.save(); ctx.beginPath(); ctx.rect(-290, -330, 560, 600); ctx.clip(); ctx.translate(-CX, -700); sunburst(ctx, t, CX - 10, 760); ctx.restore();
  ctx.drawImage(ST.happy, -400 * .72 - 10, -470 * .72 + 20, 800 * .72, 900 * .72); ctx.restore();
  // 印章：从 2 倍砸下来
  const st = t0 + .5; if (t > st) { const u = seg(t, st, st + .14), s = lerp(2, 1, E.inQ(u)) * (1 + .05 * Math.exp(-(t - st - .14) * 14) * (u >= 1 ? 1 : 0));
    ctx.save(); ctx.translate(CX + 250, 930); ctx.rotate(-.25); ctx.scale(s * 1.05, s * 1.05); ctx.globalAlpha = Math.min(1, u * 3); ctx.drawImage(STAMP, -180, -180); ctx.restore(); ctx.globalAlpha = 1; }
  const a = spring(t - t0 - .7, 2.8, .42); ctx.save(); ctx.translate(CX, 1210); ctx.scale(a, a); fancyText(ctx, TEXT.end, 0, 0, 250, INK.purple, { rot: -.04 + .015 * Math.sin(t * 6), font: FUN, weight: 400 }); ctx.restore();
  const b = spring(t - t0 - 1, 2.8, .42); ctx.save(); ctx.translate(CX + 10, 1440); ctx.scale(b, b); fancyText(ctx, TEXT.follow, 0, 0, 140, INK.orange, { rot: .03, font: FUN, weight: 400 }); ctx.restore();
}

export default {
  width: W, height: H, fps: 30, duration: B.duration,
  fonts: [['400 100px "ZCOOL KuaiLe"', Object.values(TEXT).flat().join('') + 'MON'], [`700 26px ${CN}`, TEXT.ring]],
  setup() {
    for (const mood of ['sleepy', 'shock', 'happy']) { const c = document.createElement('canvas'); c.width = 800; c.height = 900; const x = c.getContext('2d'); x.translate(400, 470); mascot(x, mood); ST[mood] = stickerize(c); }
    PAPER = tornPaper(3); STAMP = stampCanvas();
  },
  draw(ctx, t) {
    const name = ['open', 'intro', 'boom', 'sub', 'end'].find(n => t < B[n].t1) || 'end';
    const d = t - B.boom.t0, shake = d > 0 ? 24 * Math.max(0, 1 - d / .4) : 0, punch = d > 0 ? .08 * Math.max(0, 1 - d / .25) : 0, r = rng(Math.floor(t * 30));
    ctx.save(); ctx.translate((r() - .5) * 2 * shake, (r() - .5) * 2 * shake); ctx.translate(CX, 900); ctx.scale(1 + punch, 1 + punch); ctx.translate(-CX, -900);
    ({ open: shotOpen, intro: shotIntro, boom: shotBoom, sub: shotSub, end: shotEnd })[name](ctx, t);
    ctx.restore();
    if (d > 0 && d < 1 / 30) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); }
    if (t > 1.6) showTag(ctx, 210, 250, .5);
    grain(ctx, t, .025); vignette(ctx, .12);
  },
  audio() {
    const m = new Mix(B.duration + .3); backing(m, B.duration, { bpm: 126, root: 60 });
    m.boing(.1); m.whoosh(1.3, .3); m.pop(B.intro.t0); m.pop(B.intro.t0 + .45, .2); m.thud(B.intro.t0 + .8, .35); m.boing(B.intro.t0 + .8, .12);
    m.whoosh(B.boom.t0 - .3, .3); m.thud(B.boom.t0, .7); m.tone(B.boom.t0 + .5, .5, 300, { wave: 'saw', vol: .05, slide: 2 }); m.ding(B.boom.t0 + 1.1);
    for (let i = 0; i < 10; i++) m.tone(B.sub.t0 + .1 + i / 16, .03, 1600, { wave: 'square', vol: .025 });
    m.pop(B.end.t0); m.thud(B.end.t0 + .64, .5); m.boing(B.end.t0 + .7); m.ding(B.end.t0 + 1);
    m.echo(); return m.master();
  },
};
