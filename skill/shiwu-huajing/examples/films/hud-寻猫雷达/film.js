// 赛博 HUD · 寻猫雷达（重做版）。学原版 HUD 的「语法」：外框 + 顶栏、左右两列编号数据面板、中央罗盘瞄准镜套在被观察的地图上、
// 底部航向带、扫描 → 发现信号 → 候选比对 → 锁定（全屏变琥珀色 + 横向锁定带 + 冲击波）→ 俯冲放大 → 上传 → 关机。内容全部是自己的。
import { clamp, lerp, seg, E, rng, noise1, Mix } from './lib/core.js';
import { grain, vignette } from './lib/draw.js';

const W = 1920, H = 1080, CX = 960, CY = 530, R = 390, RM = 322;
const MONO = '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace';
const CN = '"PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif';
const CYAN = [63, 230, 255], AMBER = [255, 150, 40];
const K = { frame: .12, ringOuter: .4, ringTicks: .55, ringInner: .7, panelL: .9, panelR: 1.15, hex: 1.2, map: 1.4, live: 2.4, sweepEnd: 4.6,
  signal: 4.4, cands: [4.9, 5.4, 5.9], brackets: 5.9, snap: 6.233, LOCK: 6.4, dive: [6.433, 7.7], coords: 7.25, pulses: [6.9, 7.4, 7.9, 8.4], uplink: [9.0, 9.4], off: 9.767, end: 10 };
const LOG = [['OPTIC CORE v4.2.1', .4], ['THERMAL FPA 640x512', .65], ['ACOUSTIC ARRAY 8CH', .9], ['STREET GRID LOAD', 1.15], ['CAM MESH 128 NODES', 1.4], ['PET DB 2.4K PROFILES', 1.65], ['> SEARCH MODE ENGAGED', 2.4], ['! SIGNAL - BRG 041', 4.4], ['# TGT-03 LOCKED', 6.4]];
const CANDS = [['CND-01', '黑猫', '3号楼', 'NO MATCH'], ['CND-02', '狸花', '车棚', 'NO MATCH'], ['CND-03', '橘猫', '快递柜', 'MATCH 99.7%']];
const BLIPS = [[118, .62], [205, .41], [262, .78], [331, .55]];

let ink = CYAN;                                   // 当前墨色：锁定前青、锁定后琥珀
const C = (a = 1) => `rgba(${ink[0]},${ink[1]},${ink[2]},${a})`;
function T(ctx, s, x, y, { size = 15, a = .9, align = 'left', font = MONO, weight = 500, color } = {}) {
  ctx.font = `${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = color || C(a); ctx.fillText(s, x, y);
}
function line(ctx, x1, y1, x2, y2, a = .5, lw = 1.5) { ctx.strokeStyle = C(a); ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
const typed = (s, t, t0, cps = 40) => s.slice(0, Math.max(0, Math.floor((t - t0) * cps)));
const roll = (t, n, dig = 4) => String(Math.floor(rng(Math.floor(t * 30) * 7 + n)() * 10 ** dig)).padStart(dig, '0');

// ---------- 地图：一个原创小区街区（网格坐标，整体旋转一点） ----------
const S = 96, ROT = -.18, TG = { x: 1.5 * S, y: .5 * S };
const rotp = p => ({ x: p.x * Math.cos(ROT) - p.y * Math.sin(ROT), y: p.x * Math.sin(ROT) + p.y * Math.cos(ROT) });
const MAP = { blds: [], parks: [] };
{ const r = rng(7);
  for (let bx = -7; bx <= 7; bx++) for (let by = -7; by <= 7; by++) { if (by === -4) continue; const x0 = bx * S + 8, y0 = by * S + 8, s = S - 16, q = r();
    if (q < .1) { MAP.parks.push([x0, y0, s]); continue; } if (q < .16) continue;
    const n = 1 + Math.floor(r() * 3), vert = r() < .5; let acc = 0;
    for (let i = 0; i < n; i++) { const w = i === n - 1 ? s - acc : Math.round(s * (.3 + r() * .3)); if (w < 14) break;
      MAP.blds.push(vert ? [x0 + acc + 3, y0 + 3, w - 6, s - 6] : [x0 + 3, y0 + acc + 3, s - 6, w - 6]); acc += w; } } }
const LABELS = [[{ x: TG.x - 70, y: TG.y - 62 }, '3号楼', 'B3 · 12 M'], [{ x: TG.x + 58, y: TG.y - 72 }, '车棚', 'TRK 11 · 24 M'], [{ x: TG.x - 74, y: TG.y + 52 }, '便利店', 'SHOP · 31 M'], [{ x: TG.x + 72, y: TG.y + 56 }, '花园', 'PARK · 40 M']];

function view(t) {   // 俯冲：放大并把目标移到正中
  const d = E.inOutC(seg(t, K.dive[0], K.dive[1])), z = 1 + 2 * d, tg = rotp(TG);
  return { z, px: tg.x * d, py: tg.y * d, d };
}
const toScr = (p, v) => { const q = rotp(p); return { x: CX + (q.x - v.px) * v.z, y: CY + (q.y - v.py) * v.z }; };

function drawMap(ctx, t, v) {
  const show = E.outC(seg(t, K.map, K.map + .8)); if (show <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.arc(CX, CY, RM, 0, Math.PI * 2); ctx.clip();
  ctx.beginPath(); ctx.rect(0, CY - RM, W, 2 * RM * show); ctx.clip();          // 自上而下扫出来
  ctx.translate(CX, CY); ctx.scale(v.z, v.z); ctx.translate(-v.px, -v.py); ctx.rotate(ROT);
  const lw = 1.3 / v.z;
  ctx.fillStyle = C(.05); ctx.fillRect(-8 * S, -4 * S, 16 * S, S);                // 河
  ctx.strokeStyle = C(.35); ctx.lineWidth = lw; ctx.beginPath();
  for (let x = -8 * S; x <= 8 * S; x += 12) ctx.lineTo(x, -4 * S + 6 + 5 * Math.sin(x / 40)); ctx.stroke(); ctx.beginPath();
  for (let x = -8 * S; x <= 8 * S; x += 12) ctx.lineTo(x, -3 * S - 6 + 5 * Math.sin(x / 40 + 1)); ctx.stroke();
  ctx.strokeStyle = C(.12); ctx.lineWidth = lw;                                     // 街道中线
  for (let i = -7; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(i * S, -7 * S); ctx.lineTo(i * S, 8 * S); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-7 * S, i * S); ctx.lineTo(8 * S, i * S); ctx.stroke(); }
  for (const [x, y, w, h] of MAP.blds) { ctx.fillStyle = C(.07); ctx.fillRect(x, y, w, h); ctx.strokeStyle = C(.55); ctx.lineWidth = lw; ctx.strokeRect(x, y, w, h); }
  ctx.fillStyle = C(.35); for (const [x, y, s] of MAP.parks) for (let i = 6; i < s; i += 10) for (let j = 6; j < s; j += 10) ctx.fillRect(x + i, y + j, 1.6 / v.z * 1.5, 1.6 / v.z * 1.5);
  ctx.restore();
}

// ---------- 中央瞄准镜 ----------
function scope(ctx, t, v) {
  const pO = E.outC(seg(t, K.ringOuter, K.ringOuter + .6)), pT = seg(t, K.ringTicks, K.ringTicks + .5), pI = E.outC(seg(t, K.ringInner, K.ringInner + .5));
  ctx.lineCap = 'butt';
  for (let i = 0; i < 8; i++) { const a0 = i / 8 * Math.PI * 2 + t * .05; ctx.strokeStyle = C(.75); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(CX, CY, R, a0, a0 + (Math.PI / 4 - .14) * pO); ctx.stroke(); }
  for (let i = 0; i < 4; i++) { const a0 = i / 4 * Math.PI * 2 - t * .12 + .4; ctx.strokeStyle = C(.95); ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(CX, CY, R - 16, a0, a0 + .32 * pO); ctx.stroke(); }
  const nT = Math.floor(72 * pT);
  for (let i = 0; i < nT; i++) { const a = i / 72 * Math.PI * 2 - Math.PI / 2, l = i % 6 ? 7 : 16, r0 = R - 34; line(ctx, CX + Math.cos(a) * r0, CY + Math.sin(a) * r0, CX + Math.cos(a) * (r0 - l), CY + Math.sin(a) * (r0 - l), i % 6 ? .4 : .8, 1.5);
    if (i % 6 === 0) T(ctx, String(i * 5).padStart(3, '0'), CX + Math.cos(a) * (R + 26), CY + Math.sin(a) * (R + 26), { size: 13, a: .55, align: 'center' }); }
  ctx.strokeStyle = C(.6); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(CX, CY, RM, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pI); ctx.stroke();
  if (pI > .5) { line(ctx, CX - 46, CY, CX - 14, CY, .9, 2); line(ctx, CX + 14, CY, CX + 46, CY, .9, 2); line(ctx, CX, CY - 46, CX, CY - 14, .9, 2); line(ctx, CX, CY + 14, CX, CY + 46, .9, 2); }
  // 四角读数
  if (t > K.ringInner) { const mag = v.z.toFixed(1), fov = (12.4 / v.z).toFixed(2), hdg = (41.28 + noise1(t * .6) * 3).toFixed(2), tlt = (20.63 + noise1(t * .5, 3) * 2).toFixed(2);
    T(ctx, 'MAG', CX - 320, CY - 330, { size: 13, a: .5 }); T(ctx, `x ${mag}`, CX - 284, CY - 330, { size: 15 });
    T(ctx, 'FOV', CX + 250, CY - 330, { size: 13, a: .5 }); T(ctx, `${fov}°`, CX + 286, CY - 330, { size: 15 });
    T(ctx, 'HDG', CX - 320, CY + 330, { size: 13, a: .5 }); T(ctx, `${hdg}°`, CX - 284, CY + 330, { size: 15 });
    T(ctx, 'TLT', CX + 250, CY + 330, { size: 13, a: .5 }); T(ctx, `${tlt}°`, CX + 286, CY + 330, { size: 15 }); }
}
function headingTape(ctx, t) {
  const p = E.outC(seg(t, K.ringInner, K.ringInner + .6)); if (p <= 0) return;
  const y = 1000, x0 = 660, x1 = 1260, hdg = 41.28 + noise1(t * .6) * 3; ctx.save(); ctx.beginPath(); ctx.rect(CX - 300 * p, y - 30, 600 * p, 60); ctx.clip();
  line(ctx, x0, y, x1, y, .35, 1);
  for (let d = Math.floor(hdg - 30); d <= hdg + 30; d++) { const x = CX + (d - hdg) * 10, big = d % 10 === 0; line(ctx, x, y, x, y - (big ? 12 : 5), big ? .7 : .3, 1.2);
    if (big) T(ctx, 'E' + String(d).padStart(3, '0'), x, y + 16, { size: 12, a: .45, align: 'center' }); }
  ctx.fillStyle = C(.95); ctx.beginPath(); ctx.moveTo(CX, y - 14); ctx.lineTo(CX - 6, y - 24); ctx.lineTo(CX + 6, y - 24); ctx.fill();
  T(ctx, `E${hdg.toFixed(2).padStart(6, '0')}°`, CX, y - 38, { size: 15, align: 'center', weight: 600 }); ctx.restore();
}

// ---------- 雷达扫描 + 信号 ----------
const sweepAng = t => (52 - 90) * Math.PI / 180 + (t - K.live) / 2 * Math.PI * 2;
function radar(ctx, t, v) {
  if (t < K.live || t > K.LOCK) return; const a = sweepAng(t), fade = 1 - seg(t, K.sweepEnd, K.sweepEnd + .4);
  ctx.save(); ctx.beginPath(); ctx.arc(CX, CY, RM, 0, Math.PI * 2); ctx.clip(); ctx.globalAlpha = fade;
  const g = ctx.createConicGradient(a, CX, CY); g.addColorStop(0, C(0)); g.addColorStop(.9, C(0)); g.addColorStop(.995, C(.35)); g.addColorStop(1, C(0)); ctx.fillStyle = g; ctx.fillRect(CX - RM, CY - RM, 2 * RM, 2 * RM);
  line(ctx, CX, CY, CX + Math.cos(a) * RM, CY + Math.sin(a) * RM, .95, 2.5); ctx.restore();
  for (const [brg, r] of BLIPS) { const ba = (brg - 90) * Math.PI / 180, since = ((a - ba) % (Math.PI * 2) + Math.PI * 4) % (Math.PI * 2), k = Math.max(0, 1 - since / 2.2) * fade;
    if (k > 0) { const x = CX + Math.cos(ba) * r * RM, y = CY + Math.sin(ba) * r * RM; ctx.fillStyle = C(k); ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = C(k * .6); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 5 + (1 - k) * 18, 0, Math.PI * 2); ctx.stroke(); } }
}
function target(ctx, t, v) {
  if (t < K.signal) return; const p = toScr(TG, v), pulse = .5 + .5 * Math.sin(t * 14);
  ctx.fillStyle = C(.9); ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = C(.4 + .5 * pulse); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 14 + 8 * pulse, 0, Math.PI * 2); ctx.stroke();
  if (t < K.LOCK) { line(ctx, p.x + 10, p.y - 10, p.x + 60, p.y - 50, .6, 1.2); line(ctx, p.x + 60, p.y - 50, p.x + 150, p.y - 50, .6, 1.2);
    T(ctx, 'UNK-03', p.x + 66, p.y - 64, { size: 14, weight: 700 }); T(ctx, '未知热源 · 0.62 kHz', p.x + 66, p.y - 36, { size: 13, a: .7, font: CN }); }
}
function brackets(ctx, t, v) {
  if (t < K.brackets) return; const p = toScr(TG, v), u = E.inOutC(seg(t, K.brackets, K.brackets + .267)), snap = t > K.snap ? 1 + .12 * Math.exp(-(t - K.snap) * 18) : 1;
  const h = lerp(250, 54, u) * snap * (t > K.LOCK ? lerp(1, 1.3, E.outC(seg(t, K.dive[0], K.dive[1]))) : 1), l = 22;
  ctx.strokeStyle = C(1); ctx.lineWidth = 4; ctx.beginPath();
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.moveTo(p.x + sx * h, p.y + sy * (h - l)); ctx.lineTo(p.x + sx * h, p.y + sy * h); ctx.lineTo(p.x + sx * (h - l), p.y + sy * h); } ctx.stroke();
}
function mapLabels(ctx, t, v) {
  const p0 = seg(t, K.coords - .2, K.coords + .3); if (p0 <= 0) return;
  LABELS.forEach(([g, cn, en], i) => { const k = E.outC(seg(t, K.coords - .2 + i * .1, K.coords + .2 + i * .1)); if (k <= 0) return; const p = toScr(g, v);
    if (Math.hypot(p.x - CX, p.y - CY) > RM - 12) return; ctx.globalAlpha = k;
    ctx.strokeStyle = C(.9); ctx.lineWidth = 1.5; ctx.strokeRect(p.x - 5, p.y - 5, 10, 10);
    T(ctx, cn, p.x + 14, p.y - 10, { size: 18, font: CN, weight: 700 }); T(ctx, en, p.x + 14, p.y + 10, { size: 12, a: .7 }); ctx.globalAlpha = 1; });
}

// ---------- 两侧面板 ----------
function header(ctx, x, y, w, en, cn, p) {
  if (p <= 0) return; ctx.globalAlpha = p; T(ctx, en, x, y, { size: 12, weight: 700, a: .95 }); T(ctx, cn, x + w, y, { size: 12, a: .5, align: 'right', font: CN });
  line(ctx, x, y + 11, x + w * p, y + 11, .35, 1); for (let i = 0; i < 3; i++) { ctx.fillStyle = C(.6); ctx.fillRect(x + w - 4 - i * 6, y + 16, 3, 3); } ctx.globalAlpha = 1;
}
function leftPanels(ctx, t, v) {
  const x = 56, w = 290, p = E.outC(seg(t, K.panelL, K.panelL + .5)); if (p <= 0) return;
  header(ctx, x, 112, w, '01  SYS BOOT', '系统自检', p);
  LOG.forEach(([s, t0], i) => { if (t < t0) return; const y = 142 + i * 21, txt = typed(s, t, t0), bad = s[0] === '!' || s[0] === '#';
    T(ctx, txt, x + 4, y, { size: 13, a: bad ? 1 : .8, weight: bad ? 700 : 500 }); if (s[0] !== '>' && !bad && txt.length === s.length) T(ctx, '[OK]', x + w, y, { size: 13, a: .8, align: 'right' }); });
  const last = LOG.filter(l => t >= l[1]).length; if (Math.floor(t * 3) % 2) { ctx.fillStyle = C(.9); ctx.fillRect(x + 4, 142 + last * 21 - 7, 8, 14); }
  header(ctx, x, 360, w, 'SLANT RNG', '目标距离', p);
  let rngv = t < K.live ? null : t < K.LOCK ? lerp(412.6, 18.4, E.inOutC(seg(t, K.live, K.LOCK))) + noise1(t * 9) * 4 : 18.4;
  T(ctx, rngv === null ? '----.-' : rngv.toFixed(1).padStart(6, '0'), x, 412, { size: 60, weight: 600, a: 1 }); T(ctx, 'M', x + w, 424, { size: 15, align: 'right', weight: 700 });
  T(ctx, `MAG x${v.z.toFixed(1)}`, x, 460, { size: 13, a: .7 }); T(ctx, `FOV ${(12.4 / v.z).toFixed(2)}°`, x + w, 460, { size: 13, a: .7, align: 'right' });
  header(ctx, x, 510, w, '02  NAV TELEMETRY', '定位遥测', p);
  const rows = [['AZM', 41.28, 2, '°'], ['ELV', 20.63, 2, '°'], ['ALT', 12.0, 1, 'M'], ['VEL', .42, 2, 'M/S'], ['SNR', 11.7, 1, 'dB']];
  rows.forEach(([lb, val, dg, un], i) => { const y = 542 + i * 26, live = t > K.live, vv = val * (1 + .03 * noise1(t * 2, i));
    T(ctx, lb, x + 4, y, { size: 12, a: .5 }); T(ctx, live ? vv.toFixed(dg).padStart(6, '0') : '---.--', x + 120, y, { size: 15, align: 'right' }); T(ctx, un, x + 128, y, { size: 11, a: .45 });
    const bw = live ? 100 * clamp(.4 + .35 * noise1(t * 1.5, i + 9) + .25) : 0; ctx.fillStyle = C(.2); ctx.fillRect(x + 180, y - 3, 110, 6); ctx.fillStyle = C(.85); ctx.fillRect(x + 180, y - 3, bw, 6); });
  header(ctx, x, 690, w, '03  RDR MINIMAP', '小地图', p);
  const mx = x + 66, my = 790; ctx.strokeStyle = C(.35); ctx.lineWidth = 1; for (const r of [24, 48, 66]) { ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.stroke(); }
  line(ctx, mx - 66, my, mx + 66, my, .2, 1); line(ctx, mx, my - 66, mx, my + 66, .2, 1);
  if (t > K.live) { const a = sweepAng(t); line(ctx, mx, my, mx + Math.cos(a) * 66, my + Math.sin(a) * 66, .9, 2); BLIPS.forEach(([b, r]) => { const ba = (b - 90) * Math.PI / 180; ctx.fillStyle = C(.8); ctx.fillRect(mx + Math.cos(ba) * r * 66 - 2, my + Math.sin(ba) * r * 66 - 2, 4, 4); }); }
  T(ctx, 'CONTACTS', x + w, 740, { size: 11, a: .45, align: 'right' });
  if (t > K.live) BLIPS.forEach(([b, r], i) => T(ctx, `C-${i + 1}  ${String(b).padStart(3, '0')}°  ${r.toFixed(2)}`, x + w, 764 + i * 20, { size: 12, a: .7, align: 'right' }));
  if (t > K.signal) T(ctx, 'SIG 041° 0.34', x + w, 764 + 4 * 20, { size: 12, a: 1, align: 'right', weight: 700 });
}
function spark(ctx, x, y, w, h, t, seed, spike) {
  ctx.strokeStyle = C(.85); ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i <= 60; i++) { const u = i / 60, n = noise1(u * 8 + t * 1.6, seed) * .35 + noise1(u * 25 + t * 3, seed + 5) * .15, sp = spike * Math.exp(-((u - .8) ** 2) / .002); ctx.lineTo(x + u * w, y + h / 2 - (n + sp) * h); }
  ctx.stroke(); line(ctx, x, y + h, x + w, y + h, .2, 1);
}
function rightPanels(ctx, t, v) {
  const x = 1574, w = 290, p = E.outC(seg(t, K.panelR, K.panelR + .5)); if (p <= 0) return;
  const live = t > K.live, sp = t > K.signal ? .5 : 0;
  header(ctx, x, 112, w, '04  SIGNAL ANALYSIS', '信号分析', p);
  T(ctx, 'MEOW PWR', x, 140, { size: 11, a: .5 }); T(ctx, live ? `${(-62.4 + sp * 18 + noise1(t * 4) * 1.2).toFixed(1)} dBm` : '--', x + w, 140, { size: 14, align: 'right' });
  if (live) spark(ctx, x, 152, w, 50, t, 1, sp);
  T(ctx, 'THERMAL', x, 226, { size: 11, a: .5 }); T(ctx, live ? `${(24.1 + sp * 25 + noise1(t * 3, 2)).toFixed(1)} °C` : '--', x + w, 226, { size: 14, align: 'right' });
  if (live) spark(ctx, x, 238, w, 50, t, 4, sp * .8);
  header(ctx, x, 330, w, '05  CANDIDATES', '候选目标', p);
  CANDS.forEach(([id, cat, place, res], i) => { const y = 364 + i * 46, on = t > K.cands[i], hit = i === 2 && on;
    if (hit) { ctx.fillStyle = C(.16); ctx.fillRect(x - 6, y - 16, w + 12, 40); ctx.fillStyle = C(1); ctx.fillRect(x - 6, y - 16, 3, 40); }
    T(ctx, id, x, y - 4, { size: 13, a: on ? .9 : .35, weight: 700 }); T(ctx, on ? `${cat} · ${place}` : '------', x + 70, y - 4, { size: 14, a: on ? .9 : .3, font: CN, weight: 600 });
    T(ctx, on ? res : 'AWAITING', x + w, y - 4, { size: 13, a: on ? (hit ? 1 : .55) : .3, align: 'right', weight: hit ? 700 : 500 });
    if (on) T(ctx, `${(31.2 + i * .07).toFixed(2)}N  ${(121.47 + i * .03).toFixed(2)}E`, x, y + 15, { size: 11, a: .4 }); });
  header(ctx, x, 540, w, '06  SPECTRUM', '声纹', p);
  for (let i = 0; i < 36; i++) { const hgt = live ? 8 + 70 * clamp(.3 + .45 * noise1(i * .7 + t * 5, 3) + (sp && i === 22 ? .5 : 0)) : 3; ctx.fillStyle = C(i === 22 && sp ? 1 : .6); ctx.fillRect(x + i * 8, 660 - hgt, 5, hgt); }
  if (sp) T(ctx, '▲ 0.62 kHz', x + 22 * 8 - 30, 566, { size: 12, weight: 700 });
  header(ctx, x, 700, w, 'DATA LINK  QKD-7', '数据链', p);
  const up = E.inOutC(seg(t, K.uplink[0], K.uplink[1])), fill = t < K.LOCK ? .35 + .1 * noise1(t) : lerp(.5, 1, up);
  ctx.fillStyle = C(.2); ctx.fillRect(x, 724, w, 8); ctx.fillStyle = C(.9); ctx.fillRect(x, 724, w * fill, 8);
  for (let i = 0; i < 4; i++) { const r = rng(Math.floor(t * 6) + i * 31), hx = Array.from({ length: 8 }, () => Math.floor(r() * 256).toString(16).toUpperCase().padStart(2, '0')).join(' ');
    T(ctx, `${(0x3F80 + i * 8).toString(16).toUpperCase()}  ${live ? hx : '-- -- -- --'}`, x, 756 + i * 20, { size: 12, a: .45 }); }
  if (t > K.uplink[1]) { ctx.strokeStyle = C(1); ctx.lineWidth = 1.5; ctx.strokeRect(x + w - 92, 846, 92, 26); T(ctx, 'SENT ✓', x + w - 46, 859, { size: 13, align: 'center', weight: 700 }); T(ctx, 'UPLINK 已上传', x, 859, { size: 12, a: .8, font: CN }); }
}

// ---------- 外框和顶栏 ----------
function chrome(ctx, t) {
  const p = E.outC(seg(t, K.frame, K.frame + .5)); if (p <= 0) return; const m = 24;
  ctx.globalAlpha = p; ctx.strokeStyle = C(.18); ctx.lineWidth = 1; ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
  ctx.strokeStyle = C(.85); ctx.lineWidth = 2; ctx.beginPath();
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { ctx.moveTo(x, y + sy * 36); ctx.lineTo(x, y); ctx.lineTo(x + sx * 36, y); } ctx.stroke();
  ctx.strokeStyle = C(.9); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(70, 58, 10, 0, Math.PI * 2); ctx.stroke(); line(ctx, 63, 65, 77, 51, .9, 2);
  T(ctx, 'MIAO-SCAN', 90, 58, { size: 20, weight: 800, a: 1 }); T(ctx, '寻猫 · 社区雷达系统', 214, 58, { size: 13, a: .55, font: CN });
  const tab = t < K.live ? 'BOOT SEQUENCE   系统自检' : t < K.LOCK ? 'SEARCH   扫描中' : 'TARGET LOCKED   目标锁定';
  ctx.fillStyle = C(t >= K.LOCK ? .25 : .1); ctx.strokeStyle = C(.8); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(CX - 190, 44); ctx.lineTo(CX + 190, 44); ctx.lineTo(CX + 172, 72); ctx.lineTo(CX - 172, 72); ctx.closePath(); ctx.fill(); ctx.stroke();
  T(ctx, tab, CX, 58, { size: 14, align: 'center', weight: 700, font: `${MONO.split(',')[0]}, ${CN}`, a: 1 });
  const f = Math.floor(t * 30), ss = (15 + t).toFixed(2).padStart(5, '0');
  T(ctx, `F ${String(f).padStart(4, '0')} · 30P`, W - 56, 44, { size: 12, a: .5, align: 'right' }); T(ctx, `UTC 07:42:${ss}`, W - 56, 64, { size: 15, align: 'right', weight: 600 });
  if (Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = '#FF3B30'; ctx.beginPath(); ctx.arc(W - 252, 64, 5, 0, Math.PI * 2); ctx.fill(); } T(ctx, 'REC', W - 240, 64, { size: 12, a: .7 });
  ctx.globalAlpha = 1;
}

// ---------- 锁定 ----------
function lockBand(ctx, t) {
  if (t < K.LOCK) return; const p = E.outExpo(seg(t, K.LOCK, K.LOCK + .3)), hw = 400 * p, y = CY, h = 50;
  ctx.fillStyle = C(.14); ctx.fillRect(CX - hw, y - h, hw * 2, h * 2); line(ctx, CX - hw, y - h, CX + hw, y - h, .9, 2); line(ctx, CX - hw, y + h, CX + hw, y + h, .9, 2);
  ctx.save(); ctx.beginPath(); ctx.rect(CX - hw - 34, y - h, 34, h * 2); ctx.rect(CX + hw, y - h, 34, h * 2); ctx.clip(); ctx.strokeStyle = C(.9); ctx.lineWidth = 5;
  for (let i = -6; i < 30; i++) { const xx = CX - hw - 40 + i * 12; ctx.beginPath(); ctx.moveTo(xx, y + h); ctx.lineTo(xx + 40, y - h); ctx.stroke(); const x2 = CX + hw - 10 + i * 12; ctx.beginPath(); ctx.moveTo(x2, y + h); ctx.lineTo(x2 + 40, y - h); ctx.stroke(); }
  ctx.restore(); if (p < .6) return;
  T(ctx, '警报 · ALERT 03', CX - 250, y - 30, { size: 13, a: .8, align: 'center', font: CN, weight: 600 }); T(ctx, 'T A R G E T', CX + 250, y - 30, { size: 13, a: .8, align: 'center', weight: 700 });
  T(ctx, '目标锁定', CX - 250, y + 10, { size: 54, align: 'center', font: CN, weight: 900, a: 1 }); T(ctx, 'LOCKED', CX + 250, y + 10, { size: 54, align: 'center', weight: 800, a: 1 });
}
function coordBox(ctx, t) {
  const p = E.outC(seg(t, K.coords, K.coords + .35)); if (p <= 0) return; const y = CY + 112, w = 420 * p;
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(CX - w / 2, y - 34, w, 78); ctx.strokeStyle = C(.8); ctx.lineWidth = 1.5; ctx.strokeRect(CX - w / 2, y - 34, w, 78); if (p < .9) return;
  T(ctx, 'COORD · 位置', CX, y - 20, { size: 11, a: .55, align: 'center', font: CN });
  T(ctx, '3号楼东侧 · 快递柜 B-07', CX, y + 6, { size: 26, align: 'center', font: CN, weight: 700, a: 1 }); T(ctx, 'DIST 18.4 M · CONF 99.7% · 橘猫「年糕」', CX, y + 32, { size: 12, a: .7, align: 'center', font: CN });
}

let hexC = null, buf = null, bctx = null;
export default {
  width: W, height: H, fps: 30, duration: K.end,
  fonts: [[`700 40px ${CN}`, '寻猫社区雷达系统自检扫描中目标锁定距离定位遥测小地图信号分析候选声纹数据链黑猫狸花橘猫号楼车棚快递柜东侧便利店花园警报位置年糕已上传未知热源'], [`500 20px ${MONO}`, 'A0']],
  setup() {
    hexC = [CYAN, AMBER].map(col => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.strokeStyle = `rgb(${col})`; x.lineWidth = 1; const r = 22, hh = r * Math.sqrt(3);
      for (let j = -1; j < H / hh + 1; j++) for (let i = -1; i < W / (r * 1.5) + 1; i++) { const cx = i * r * 1.5, cy = j * hh + (i % 2 ? hh / 2 : 0); x.beginPath(); for (let k = 0; k < 6; k++) x.lineTo(cx + Math.cos(k * Math.PI / 3) * r * .92, cy + Math.sin(k * Math.PI / 3) * r * .92); x.closePath(); x.stroke(); }
      return c; });
    buf = document.createElement('canvas'); buf.width = W; buf.height = H; bctx = buf.getContext('2d');
  },
  draw(ctx, t) {
    const fr = Math.round(t * 30), lockF = Math.round(K.LOCK * 30); ink = t >= K.LOCK ? AMBER : CYAN;
    const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, 1100); g.addColorStop(0, t >= K.LOCK ? '#140A03' : '#04161D'); g.addColorStop(1, '#010305'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const hp = E.outC(seg(t, K.hex, K.hex + 1.2)); if (hp > 0) { ctx.save(); ctx.globalAlpha = .07; ctx.beginPath(); ctx.arc(CX, CY, hp * 1300, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(hexC[t >= K.LOCK ? 1 : 0], 0, 0); ctx.restore(); }
    const v = view(t);
    drawMap(ctx, t, v); radar(ctx, t, v); scope(ctx, t, v); headingTape(ctx, t); target(ctx, t, v); mapLabels(ctx, t, v);
    leftPanels(ctx, t, v); rightPanels(ctx, t, v); chrome(ctx, t); brackets(ctx, t, v); lockBand(ctx, t); coordBox(ctx, t);
    if (t >= K.LOCK) { const w = E.outC(seg(t, K.LOCK, K.LOCK + .45)); if (w < 1) { ctx.strokeStyle = C(1 - w); ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(CX, CY, w * 1350, 0, Math.PI * 2); ctx.stroke(); } }
    for (const tp of K.pulses) { const k = Math.max(0, 1 - Math.abs(t - tp) / .12); if (k > 0) { ctx.strokeStyle = C(.6 * k); ctx.lineWidth = 14; ctx.strokeRect(7, 7, W - 14, H - 14); } }
    // 后期：辉光（模糊叠加）→ 故障切片 → 闪白 → 扫描线 → 暗角颗粒
    bctx.clearRect(0, 0, W, H); bctx.drawImage(ctx.canvas, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.filter = 'blur(8px)'; ctx.globalAlpha = .45; ctx.drawImage(buf, 0, 0); ctx.filter = 'blur(28px)'; ctx.globalAlpha = .35; ctx.drawImage(buf, 0, 0); ctx.restore();
    const GL = [[0, .2, 1], [K.signal, .14, .8], [K.LOCK + 1 / 30, .1, .5], [2.93, .067, .35], [5.43, .067, .3], [7.1, .067, .3], [8.13, .067, .3]];
    let gl = 0; for (const [t0, d, a] of GL) if (t >= t0 && t < t0 + d) gl = Math.max(gl, a);
    if (gl > 0) { const r = rng(fr * 13); bctx.drawImage(ctx.canvas, 0, 0); for (let i = 0; i < 7; i++) { const y = r() * H, h = 6 + r() * 40, dx = (r() - .5) * 120 * gl; ctx.drawImage(buf, 0, y, W, h, dx, y, W, h); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .25 * gl; ctx.drawImage(buf, 8 * gl, 0); ctx.drawImage(buf, -8 * gl, 0); ctx.restore(); }
    const flash = fr === lockF ? .55 : fr === lockF + 1 ? .18 : fr === Math.round(K.signal * 30) ? .2 : 0; if (flash) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = 'rgba(0,0,0,.16)'; for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
    vignette(ctx, .45); grain(ctx, t, .035);
    // 开机：从中间一条横线展开；关机：收成一条线
    const open = E.outC(seg(t, 0, .3)), close = seg(t, K.off, K.off + .2), hgt = H * open * (1 - E.inC(close));
    if (hgt < H) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, (H - hgt) / 2); ctx.fillRect(0, (H + hgt) / 2, W, H); if (close > 0 || open < 1) { ctx.fillStyle = C(.9); ctx.fillRect(0, H / 2 - 1, W, 2); } }
  },
  audio() {
    const m = new Mix(K.end + .3);
    m.tone(0, K.end - .3, 55, { wave: 'saw', vol: .035, env: [1.5, .1, 1, .3] }); m.tone(0, K.end - .3, 82.4, { wave: 'sine', vol: .07, env: [1, .1, 1, .3] });
    for (let b = K.live; b < K.off; b += .5) { m.kick(b, b >= K.LOCK ? .45 : .3); m.hat(b + .25, .03); }
    LOG.forEach(([, t0]) => m.tone(t0, .04, 1800, { wave: 'square', vol: .035 }));
    m.thud(K.ringOuter, .35); m.whoosh(K.ringOuter - .2, .5, .1);
    for (let s = K.live; s < K.sweepEnd; s += 2) m.whoosh(s, 1.2, .06);
    for (let s = K.live; s < K.sweepEnd; s += 2) BLIPS.forEach(([b]) => { const tb = s + (((b - 52) % 360 + 360) % 360) / 360 * 2; if (tb < K.sweepEnd + .2) m.tone(tb, .05, 1250, { vol: .045 }); });
    m.tone(K.signal, .12, 880, { wave: 'pulse25', vol: .06 }); m.tone(K.signal + .15, .12, 1320, { wave: 'pulse25', vol: .06 });
    K.cands.forEach((c, i) => i < 2 ? m.tone(c, .06, 520, { wave: 'square', vol: .04 }) : (m.tone(c, .08, 1320, { vol: .08 }), m.tone(c + .09, .14, 1760, { vol: .08 })));
    m.whoosh(K.brackets, .3, .1); m.tone(K.snap, .03, 2600, { wave: 'square', vol: .05 });
    m.thud(K.LOCK, .8); m.tone(K.LOCK, .6, 110, { wave: 'saw', vol: .08, slide: -.4 });
    for (let i = 0; i < 8; i++) m.tone(K.LOCK + .05 + i * .125, .1, i % 2 ? 660 : 880, { wave: 'square', vol: .045 });
    K.pulses.forEach(p => m.tone(p, .2, 440, { wave: 'tri', vol: .06 }));
    m.whoosh(K.dive[0], .9, .12);
    [0, 4, 7, 12].forEach((n, i) => m.tone(K.uplink[0] + i * .08, .08, 440 * 2 ** ((n + 3) / 12) * 2, { wave: 'tri', vol: .06 }));
    m.tone(K.off, .2, 500, { vol: .1, slide: -.9 });
    m.echo(.19, .25, .18); return m.master();
  },
};
