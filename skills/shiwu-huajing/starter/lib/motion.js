// 让动画更高级的小工具：关键帧、错峰、镜头、待机微动、弧线移动、转场遮罩。
// 都只依赖时间 t，导出时每一帧都一样。用法和讲究见 references/07-动画手艺进阶.md。
import { clamp, lerp, seg, E, noise1 } from './core.js';

// ---------- 关键帧 ----------
// keys(t, [[0, 0], [.4, 120, E.outBack], [1.2, 120], [1.5, -200, E.inC]])
// 每个关键帧 [时间, 值, 到这一帧用的缓动]。值可以是数字，也可以是 [x, y] 这样的数组。
// 比一串 seg + lerp 好读，也更容易做出「进场 → 停住 → 离场」的完整动作。
export function keys(t, ks) {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    const [t1, v1, ease = E.inOutC] = ks[i], [t0, v0] = ks[i - 1];
    if (t <= t1) { const u = ease(seg(t, t0, t1)); return Array.isArray(v0) ? v0.map((a, k) => lerp(a, v1[k], u)) : lerp(v0, v1, u); }
  }
  return ks[ks.length - 1][1];
}

// ---------- 错峰 ----------
// 第 i 个元素的进度 0→1：每个晚 gap 秒，各自用 dur 秒走完。order 可以是 'center'（从中间往两边）
export function stagger(t, t0, i, { n = 1, gap = 3 / 30, dur = 12 / 30, ease = E.outC, order = 'forward' } = {}) {
  const k = order === 'center' ? Math.abs(i - (n - 1) / 2) : order === 'reverse' ? n - 1 - i : i;
  return ease(seg(t, t0 + k * gap, t0 + k * gap + dur));
}

// ---------- 镜头 ----------
// 在画这一场之前调用：camera(ctx, t, { push, punch, shake, pan, cx, cy })，画完 ctx.restore()。
//   push:  [t0, t1, 1, 1.06]   慢推：整场从 1 倍推到 1.06 倍（静止画面立刻有了生气）
//   punch: [[1.2, .08], ...]    冲击放大：在 1.2 秒放大 8%，6 帧内弹回
//   shake: [[1.2, 18], ...]     震屏：在 1.2 秒震 18px，10 帧衰减完
//   pan:   [t0, t1, [x0, y0], [x1, y1]]   平移（长尾缓动：前 20% 时间走完大半路程）
export function camera(ctx, t, o = {}) {
  const W = ctx.canvas.width, H = ctx.canvas.height, cx = o.cx ?? W / 2, cy = o.cy ?? H / 2;
  let z = 1, x = 0, y = 0;
  if (o.push) { const [a, b, z0, z1] = o.push; z *= lerp(z0, z1, E.sine(seg(t, a, b))); }
  for (const [th, amt] of o.punch || []) { const d = t - th; if (d >= 0 && d < .6) z *= 1 + amt * Math.exp(-d * 9) * Math.cos(d * 14); }
  for (const [th, amp] of o.shake || []) { const d = t - th; if (d >= 0 && d < .4) { const k = amp * (1 - d / .4) ** 2; x += noise1(t * 40, th * 7) * k; y += noise1(t * 40, th * 7 + 3) * k; } }
  if (o.pan) { const [a, b, p0, p1] = o.pan, u = E.outExpo(seg(t, a, b)); x += lerp(p0[0], p1[0], u); y += lerp(p0[1], p1[1], u); }
  ctx.save(); ctx.translate(cx + x, cy + y); ctx.scale(z, z); ctx.translate(-cx, -cy);
}

// ---------- 待机微动 ----------
// 停住的东西也要有一点点动（漂浮、呼吸），否则像卡住了。返回 { x, y, r, s } 直接用在 translate/rotate/scale 上。
// seed 每个元素不一样，它们就不会同步晃。amp 是像素幅度，竖屏 1080 宽用 4～10。
export function idle(t, seed = 0, amp = 6) {
  return { x: noise1(t * .7, seed) * amp, y: noise1(t * .6, seed + 11) * amp, r: noise1(t * .5, seed + 23) * .012, s: 1 + noise1(t * .8, seed + 37) * .012 };
}

// ---------- 弧线移动 ----------
// 东西从 A 到 B 走弧线而不是直线（真实的运动几乎都是弧线）。bend 是弧的鼓起程度（占距离的比例，负数往另一边鼓）
export function arc(u, [x0, y0], [x1, y1], bend = .25) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, qx = mx - dy * bend, qy = my + dx * bend;
  return [(1 - u) ** 2 * x0 + 2 * (1 - u) * u * qx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * qy + u * u * y1];
}

// ---------- 进场 / 停住 / 离场 ----------
// 一个元素的完整生命：t0 进场（inDur 秒），t1 开始离场（outDur 秒）。返回 { in, out, alive }：
//   in  0→1 进场进度（已缓动），out 0→1 离场进度（已缓动），alive 是否需要画。
// 东西要「走掉」（飞出、缩小、被擦掉），不要凭空消失。
export function life(t, t0, t1, { inDur = .35, outDur = .25, inEase = E.outBack, outEase = E.inC } = {}) {
  return { in: inEase(seg(t, t0, t0 + inDur)), out: outEase(seg(t, t1, t1 + outDur)), alive: t >= t0 && t <= t1 + outDur };
}

// ---------- 转场遮罩 ----------
// 在 ctx 上裁出一块区域：u 从 0 到 1，新画面露出的部分越来越大。reel.js 用它在两段之间转场，你也可以在片子内部用。
//   iris  圆形从 (x, y) 放大     wipe  斜向擦除（angle 弧度）     push  由 dir 方向整体推进（这里只裁区域，平移由调用方做）
//   bars  多条横条错峰展开       shape 自定义：传 path(ctx, u) 函数
export function revealClip(ctx, kind, u, o = {}) {
  const W = ctx.canvas.width, H = ctx.canvas.height; ctx.beginPath();
  if (kind === 'iris') { const x = o.x ?? W / 2, y = o.y ?? H / 2, R = Math.hypot(Math.max(x, W - x), Math.max(y, H - y)); ctx.arc(x, y, Math.max(.01, R * u), 0, Math.PI * 2); }
  else if (kind === 'wipe') { const a = o.angle ?? -.35, D = Math.hypot(W, H), off = lerp(-D / 2, D / 2, u);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(a); ctx.rect(-D, -D, D + off, 2 * D); ctx.restore(); }
  else if (kind === 'bars') { const n = o.n ?? 6, h = H / n; for (let i = 0; i < n; i++) { const k = E.inOutC(clamp(u * 1.6 - i * .6 / n)); ctx.rect(0, i * h, W * k, h + 1); } }
  else if (kind === 'shape' && o.path) o.path(ctx, u);
  else ctx.rect(0, 0, W, H);
  ctx.clip();
}


// ---------- 慢快慢平移 ----------
// 整组东西挪位置（一排字、一叠卡片让位）用它。任何一条现成缓动都会「啪」地撞停，所以拆成三段：
//   起步 20% 时间走 10% 路（加速）→ 冲刺 18% 时间走 65% 路（匀速）→ 收尾 62% 时间走 25% 路（强减速）
// 返回 0→1 的进度。新内容在冲刺那一段（进度 0.1～0.75）出现，最自然。
export function nudge(t, t0, dur) {
  const u = clamp((t - t0) / dur);
  if (u < .2) return .1 * (u / .2) ** 3;
  if (u < .38) return .1 + .65 * (u - .2) / .18;
  return .75 + .25 * (1 - (1 - (u - .38) / .62) ** 5);
}

// ---------- 感知缩放 ----------
// 放大动画按倍数匀速变，越大看起来越慢；按面积匀速变，眼睛才觉得匀速。
// 用法：const s = pscale(0.2, 1, E.outC(u))
export const pscale = (s0, s1, u) => { const a = Math.sign(s0) * s0 * s0, b = Math.sign(s1) * s1 * s1, v = a + (b - a) * u; return Math.sign(v) * Math.sqrt(Math.abs(v)); };

// ---------- 物理弹簧 ----------
// 按质量 / 刚度 / 阻尼 / 初速度算 t 秒后的位置（0→1）。下面的预设取自 Motion Canvas，已经调好手感。
// 用法：const k = springTo(t - t0, SPRINGS.plop)
export const SPRINGS = {
  plop: { mass: .2, stiffness: 20, damping: .68, v0: 0 },       // 弹出
  bounce: { mass: .08, stiffness: 4.75, damping: .05, v0: 0 },   // 一直弹
  swing: { mass: .39, stiffness: 19.85, damping: 2.82, v0: 0 },  // 摆
  jump: { mass: .04, stiffness: 10, damping: .7, v0: 8 },        // 起跳（先冲出去）
  strike: { mass: .03, stiffness: 20, damping: .9, v0: 4.8 },    // 敲击
  smooth: { mass: .16, stiffness: 15.35, damping: 1.88, v0: 0 }, // 顺滑，几乎不弹
  beat: { mass: .13, stiffness: 5.7, damping: 1.2, v0: 10 },     // 卡拍子的一下
};
export function springTo(t, { mass = 1, stiffness = 100, damping = 10, v0 = 0 } = {}) {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(stiffness / mass), z = damping / (2 * Math.sqrt(stiffness * mass));
  if (z < 1) { const a = z * w0, wd = w0 * Math.sqrt(1 - z * z); return 1 + Math.exp(-a * t) * (-Math.cos(wd * t) + (v0 - a) / wd * Math.sin(wd * t)); }
  if (z === 1) return 1 + Math.exp(-w0 * t) * (-1 + (v0 - w0) * t);
  const q = w0 * Math.sqrt(z * z - 1), r1 = -w0 * z + q, r2 = -w0 * z - q, c1 = (v0 + r2) / (r1 - r2);
  return 1 + c1 * Math.exp(r1 * t) + (-1 - c1) * Math.exp(r2 * t);
}

// ---------- 单个元素的动态模糊 ----------
// 只给快动作用：每帧移动超过自身宽度的猛冲、甩出、急停、快速放大旋转。一支片子 1～3 处。
// 慢漂、呼吸、淡入淡出不要模糊（会显得糊、廉价）；字只模糊飞来的过程，落地那一刻必须清楚。
// blur(ctx, t, fps, (c, tt) => 画这个元素在 tt 时刻的样子, { samples: 16, frames: 2, box: [x, y, w, h] })
// 原理：在「上一帧 → 下一帧」之间均匀取 samples 个时刻各画一次，按透明度正确平均。box 给出元素可能出现的范围，越小越快。
let _mb = null;
export function blur(ctx, t, fps, draw, { samples = 16, frames = 2, box = null } = {}) {
  const W = ctx.canvas.width, H = ctx.canvas.height, [bx, by, bw, bh] = box ? box.map(Math.round) : [0, 0, W, H];
  if (!_mb || _mb.width !== bw || _mb.height !== bh) { _mb = document.createElement('canvas'); _mb.width = bw; _mb.height = bh; }
  const m = _mb.getContext('2d', { willReadFrequently: true }), acc = new Float32Array(bw * bh * 4), span = frames / fps;
  const T = ctx.getTransform();
  for (let i = 0; i < samples; i++) {
    m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, bw, bh); m.setTransform(T.a, T.b, T.c, T.d, T.e - bx, T.f - by);
    m.save(); draw(m, t + ((i + .5) / samples - .5) * span); m.restore();
    const d = m.getImageData(0, 0, bw, bh).data;
    for (let k = 0; k < d.length; k += 4) { const a = d[k + 3] / 255; acc[k] += d[k] * a; acc[k + 1] += d[k + 1] * a; acc[k + 2] += d[k + 2] * a; acc[k + 3] += d[k + 3]; }
  }
  const img = m.createImageData(bw, bh);
  for (let k = 0; k < acc.length; k += 4) { const a = acc[k + 3] / samples, w = a / 255; img.data[k + 3] = a;
    if (w > 0) { img.data[k] = acc[k] / samples / w; img.data[k + 1] = acc[k + 1] / samples / w; img.data[k + 2] = acc[k + 2] / samples / w; } }
  m.setTransform(1, 0, 0, 1, 0, 0); m.putImageData(img, 0, 0);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(_mb, bx, by); ctx.restore();
}
