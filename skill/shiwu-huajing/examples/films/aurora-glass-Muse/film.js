// 弥散玻璃 · 虚构 App「Muse 灵感本」。原版语法：极光底 + 多张「真界面」的磨砂玻璃卡片分前中后三层（远的更糊）、
// 卡片里有对话 / 录音波形 / 开关滑杆，一个液态玻璃胶囊滑过放大内容（边缘色散），一切都很慢；结尾渐变品牌名 + 玻璃圆点 + 中英标语。
import { clamp, lerp, seg, E, rng, Mix } from './lib/core.js';
import { grain } from './lib/draw.js';

const W = 1920, H = 1080, DUR = 9;
const CN = '"Noto Sans SC", "PingFang SC", sans-serif', SANS = '"Helvetica Neue", "PingFang SC", Arial, sans-serif';
const BLOBS = [[420, 320, 620, '#6A4BFF', 0], [1500, 260, 560, '#2D6BFF', 1.7], [1200, 820, 640, '#35D0F0', 3.1], [560, 860, 520, '#B455F5', 4.4], [960, 520, 420, '#FF6FC8', 2.2]];
let buf, bctx;

function aurora(ctx, t) {
  ctx.fillStyle = '#06041A'; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const [x, y, r, c, p] of BLOBS) { const bx = x + Math.sin(t * .14 + p) * 160, by = y + Math.cos(t * .11 + p * 1.7) * 110, g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
    g.addColorStop(0, c + 'B0'); g.addColorStop(.5, c + '40'); g.addColorStop(1, c + '00'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}
// 玻璃卡：拷一份当前画面，在卡片区域里模糊后贴回去，再加白色薄填充、1px 白边、顶部高光
function glass(ctx, x, y, w, h, r, blur, alpha) {
  bctx.clearRect(0, 0, W, H); bctx.drawImage(ctx.canvas, 0, 0);
  ctx.save(); ctx.globalAlpha *= alpha; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.clip(); ctx.filter = `blur(${blur}px)`; ctx.drawImage(buf, 0, 0); ctx.filter = 'none';
  ctx.fillStyle = 'rgba(255,255,255,.09)'; ctx.fillRect(x, y, w, h); const hl = ctx.createLinearGradient(0, y, 0, y + h); hl.addColorStop(0, 'rgba(255,255,255,.16)'); hl.addColorStop(.3, 'rgba(255,255,255,0)'); ctx.fillStyle = hl; ctx.fillRect(x, y, w, h); ctx.restore();
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = 'rgba(255,255,255,.34)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(x + .75, y + .75, w - 1.5, h - 1.5, r); ctx.stroke(); ctx.restore();
}
// 远处的卡片整体再糊一点：拷出卡片区域，模糊后贴回（景深）
function soften(ctx, x, y, w, h, b) { bctx.clearRect(0, 0, W, H); bctx.drawImage(ctx.canvas, 0, 0); ctx.save(); ctx.beginPath(); ctx.rect(x - 20, y - 20, w + 40, h + 40); ctx.clip(); ctx.filter = `blur(${b}px)`; ctx.drawImage(buf, 0, 0); ctx.restore(); }
const tx = (ctx, s, x, y, size, a = .9, w = 400, align = 'left', font = CN) => { ctx.font = `${w} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillText(s, x, y); };
// 卡片的「浮上来」：.9 秒 outExpo，透明度 + 30px
const rise = (t, t0) => E.outExpo(seg(t, t0, t0 + 1.1));

const REPLY = ['① 新版首页周五前定稿，小林负责', '② 用户访谈再约 5 位，下周二前', '③ 预算先按 A 方案走，月底复盘'];
function chatCard(ctx, t, x, y) {
  const w = 760, h = 470, ga = ctx.globalAlpha; glass(ctx, x, y, w, h, 36, 26, 1);
  ctx.fillStyle = '#7CE7FF'; ctx.shadowColor = '#7CE7FF'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(x + 48, y + 48, 12, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  tx(ctx, 'Muse', x + 72, y + 48, 22, .95, 600, 'left', SANS); tx(ctx, '刚刚', x + w - 36, y + 48, 16, .5, 400, 'right');
  const u = E.outC(seg(t, 2.2, 2.7)); if (u > 0) { ctx.globalAlpha = ga * u; ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.roundRect(x + w - 470, y + 92 + (1 - u) * 10, 434, 54, 27); ctx.fill(); tx(ctx, '帮我把今天的会议记录整理成三点', x + w - 448, y + 119 + (1 - u) * 10, 20, .95); ctx.globalAlpha = ga; }
  let shown = Math.floor(clamp((t - 2.8) * 22, 0, 999));
  REPLY.forEach((s, i) => { const n = Math.min(s.length, shown); shown -= n; if (n > 0) tx(ctx, s.slice(0, n), x + 44, y + 200 + i * 52, 24, .92); if (n > 0 && n < s.length && Math.floor(t * 3) % 2) { ctx.fillStyle = '#7CE7FF'; ctx.fillRect(x + 44 + ctx.measureText(s.slice(0, n)).width + 6, y + 186 + i * 52, 3, 28); } });
  const b = E.outC(seg(t, 4.3, 4.8)); if (b > 0) { ctx.globalAlpha = ga * b; for (const [bx, s] of [[x + 44, '复制'], [x + 160, '继续展开']]) { ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(bx, y + 380, s.length * 22 + 40, 44, 22); ctx.stroke(); tx(ctx, s, bx + 20, y + 402, 18, .85); } ctx.globalAlpha = ga; }
}
function voiceCard(ctx, t, x, y, blur) {
  glass(ctx, x, y, 420, 170, 30, blur, 1); const on = Math.floor(t * 2) % 2; ctx.fillStyle = `rgba(255,90,110,${on ? 1 : .5})`; ctx.beginPath(); ctx.arc(x + 40, y + 42, 8, 0, 7); ctx.fill();
  tx(ctx, '录音中', x + 60, y + 42, 18, .85); tx(ctx, `00:${String(Math.floor(8 + t)).padStart(2, '0')}`, x + 380, y + 42, 18, .6, 400, 'right', SANS);
  for (let i = 0; i < 34; i++) { const hgt = 8 + 46 * Math.abs(Math.sin(i * .7 + t * 4) * Math.sin(i * .23 + t * 1.3)); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.roundRect(x + 40 + i * 10.5, y + 110 - hgt / 2, 5, hgt, 3); ctx.fill(); }
}
function settingsCard(ctx, t, x, y, blur) {
  glass(ctx, x, y, 460, 220, 30, blur, 1);
  tx(ctx, '专注模式', x + 40, y + 56, 22, .92, 500); tx(ctx, '屏蔽打扰，只留灵感', x + 40, y + 86, 15, .5);
  const k = E.inOutC(seg(t, 3, 3.4)); ctx.fillStyle = `rgba(${lerp(255, 80, k)},${lerp(255, 200, k)},255,${lerp(.25, .9, k)})`; ctx.beginPath(); ctx.roundRect(x + 360, y + 52, 64, 36, 18); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x + 378 + 28 * k, y + 70, 14, 0, 7); ctx.fill();
  tx(ctx, '灵感温度', x + 40, y + 160, 18, .8); const v = lerp(.3, .72, E.inOutC(seg(t, 3.5, 4.3))); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.roundRect(x + 140, y + 157, 220, 6, 3); ctx.fill();
  ctx.fillStyle = '#9FDBFF'; ctx.beginPath(); ctx.roundRect(x + 140, y + 157, 220 * v, 6, 3); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x + 140 + 220 * v, y + 160, 11, 0, 7); ctx.fill(); tx(ctx, `${Math.round(v * 100)}%`, x + 420, y + 160, 16, .6, 400, 'right', SANS);
}
function noteCard(ctx, t, x, y, blur) { glass(ctx, x, y, 330, 90, 26, blur, 1); ctx.strokeStyle = '#8CF5C8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 32, y + 46); ctx.lineTo(x + 42, y + 56); ctx.lineTo(x + 60, y + 36); ctx.stroke(); tx(ctx, '已同步到 3 台设备', x + 78, y + 46, 18, .85); }
// 液态玻璃胶囊：把下面的画面放大 1.3 倍贴进胶囊，边缘一圈红蓝色散 + 高光
function lens(ctx, t) {
  const u = E.inOutC(seg(t, 4.6, 6.2)); if (u <= 0 || u >= 1) return; const cx = lerp(560, 1500, u), cy = 560, w = 300, h = 120;
  bctx.clearRect(0, 0, W, H); bctx.drawImage(ctx.canvas, 0, 0); ctx.save(); ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2); ctx.clip();
  ctx.translate(cx, cy); ctx.scale(1.3, 1.3); ctx.translate(-cx, -cy); ctx.drawImage(buf, 0, 0); ctx.restore();
  ctx.save(); ctx.lineWidth = 3; for (const [c, d] of [['rgba(255,80,120,.6)', -2], ['rgba(80,180,255,.6)', 2]]) { ctx.strokeStyle = c; ctx.beginPath(); ctx.roundRect(cx - w / 2 + d, cy - h / 2, w, h, h / 2); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2); ctx.stroke();
  const g = ctx.createLinearGradient(0, cy - h / 2, 0, cy); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(cx - w / 2 + 20, cy - h / 2 + 8, w - 40, h * .3, 20); ctx.fill(); ctx.restore();
}

export default {
  width: W, height: H, fps: 30, duration: DUR,
  fonts: [[`400 24px ${CN}`, '帮我把今天的会议记录整理成三点新版首页周五前定稿小林负责用户访谈再约位下周二前预算先按方案走月底复盘复制继续展开录音中专注模式屏蔽打扰只留灵感温度已同步到台设备想到的都留下刚刚']],
  setup() { buf = document.createElement('canvas'); buf.width = W; buf.height = H; bctx = buf.getContext('2d'); },
  draw(ctx, t) {
    aurora(ctx, t);
    const out = E.inOutC(seg(t, 5.9, 7.1)), pan = t * 6;   // out：卡片慢慢散开
    const L = (t0, d, dx, dy) => { const r = rise(t, t0); return { a: r * (1 - out), x: -pan * d + dx * out * 900, y: (1 - r) * 30 - dy * out * 0 + dy * out * 600 }; };
    const s1 = L(.6, .4, -1, .4), s2 = L(.8, .6, -1, -.5), s3 = L(1, 1, .6, .1), s4 = L(1.3, .5, 1, -.6);
    const layer = (o, fn) => { if (o.a <= 0) return; ctx.save(); ctx.globalAlpha = 1; ctx.translate(o.x, o.y); fn(); ctx.restore(); if (o.a < 1) { ctx.save(); ctx.globalAlpha = 1 - o.a; aurora(ctx, t); ctx.restore(); } };
    // 从远到近画：远的模糊大、透明度低
    if (s1.a > 0) { ctx.save(); ctx.globalAlpha = s1.a; ctx.translate(s1.x, s1.y); settingsCard(ctx, t, 230, 640, 40); ctx.restore(); soften(ctx, 230 + s1.x, 640 + s1.y, 460, 220, 2.6); }
    if (s2.a > 0) { ctx.save(); ctx.globalAlpha = s2.a; ctx.translate(s2.x, s2.y); voiceCard(ctx, t, 300, 300, 34); ctx.restore(); soften(ctx, 300 + s2.x, 300 + s2.y, 420, 170, 1.6); }
    if (s4.a > 0) { ctx.save(); ctx.globalAlpha = s4.a; ctx.translate(s4.x, s4.y); noteCard(ctx, t, 1430, 170, 30); ctx.restore(); soften(ctx, 1430 + s4.x, 170 + s4.y, 330, 90, 1.2); }
    if (s3.a > 0) { ctx.save(); ctx.globalAlpha = s3.a; ctx.translate(s3.x, s3.y); chatCard(ctx, t, 820, 320); ctx.restore(); }
    lens(ctx, t);
    // 结尾：品牌名 + 玻璃圆点 + 标语
    const b = E.outExpo(seg(t, 7.0, 8.2)); if (b > 0) { ctx.save(); ctx.globalAlpha = b; ctx.font = `300 150px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = `${lerp(30, 6, b)}px`;
      const g = ctx.createLinearGradient(700, 0, 1220, 0); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.6, '#CFE6FF'); g.addColorStop(1, '#F2C6FF'); ctx.fillStyle = g; ctx.fillText('Muse', 940, 500 + (1 - b) * 8); ctx.letterSpacing = '0px';
      const dx = 1170, dy = 530; glass(ctx, dx - 22, dy - 22, 44, 44, 22, 8, b); ctx.restore();
      const s = E.outC(seg(t, 7.6, 8.4)); ctx.globalAlpha = s; tx(ctx, '想到的，都留下', 930, 650, 38, .92, 300, 'right'); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(959, 630, 1.5, 40); tx(ctx, 'Keep every spark.', 990, 650, 32, .65, 300, 'left', SANS); ctx.globalAlpha = 1; }
    grain(ctx, t, .045);
  },
  audio() {
    const m = new Mix(DUR + .5), chords = [[57, 64, 69, 72], [53, 60, 65, 69], [55, 62, 67, 71], [52, 59, 64, 67]];
    chords.forEach((c, i) => c.forEach(n => m.tone(i * 2.25, 2.4, 440 * 2 ** ((n - 69) / 12), { wave: 'sine', vol: .035, env: [.8, .3, .8, 1.2] })));
    [.6, .8, 1, 1.3].forEach(t0 => m.tone(t0 + .1, .5, 1760, { vol: .025, env: [.01, .3, .1, .6] }));
    m.pop(2.2, .08); for (let i = 0; i < 30; i++) m.tone(2.8 + i * .045, .015, 4000, { wave: 'noise', vol: .015 }); m.tone(3, .05, 1200, { vol: .05 });
    m.whoosh(4.6, 1.6, .05); [84, 88, 91, 96].forEach((n, i) => m.tone(6.9 + i * .12, 1.6, 440 * 2 ** ((n - 69) / 12), { vol: .04, env: [.01, .5, .3, 1.2] }));
    m.echo(.35, .45, .35); return m.master();
  },
};
