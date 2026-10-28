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

