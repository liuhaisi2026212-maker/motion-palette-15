// 脚手架核心：时间、缓动、随机数、启动片子、配乐合成（自动拉响度）。
// 约定：片子只由时间 t 决定（同一个 t 永远画出同一帧），这样才能逐帧导出、和配乐对齐。

// ---------- 数学 ----------
export const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
export const lerp = (a, b, u) => a + (b - a) * u;
// seg(t, a, b)：t 在 a→b 之间时从 0 走到 1，之前是 0，之后是 1。写动画最常用
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const E = {
  lin: u => u,
  inQ: u => u * u, outQ: u => 1 - (1 - u) ** 2, inOutQ: u => u < .5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2,
  inC: u => u ** 3, outC: u => 1 - (1 - u) ** 3, inOutC: u => u < .5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2,
  outExpo: u => u >= 1 ? 1 : 1 - 2 ** (-10 * u),
  outBack: (u, s = 1.70158) => 1 + (s + 1) * (u - 1) ** 3 + s * (u - 1) ** 2,          // 冲过头再回来
  outElastic: u => u <= 0 ? 0 : u >= 1 ? 1 : 2 ** (-10 * u) * Math.sin((u * 10 - .75) * (2 * Math.PI / 3)) + 1,
  outBounce: u => { const n = 7.5625, d = 2.75; if (u < 1 / d) return n * u * u; if (u < 2 / d) return n * (u -= 1.5 / d) * u + .75; if (u < 2.5 / d) return n * (u -= 2.25 / d) * u + .9375; return n * (u -= 2.625 / d) * u + .984375; },
  sine: u => .5 - Math.cos(Math.PI * u) / 2,                                              // 呼吸感
};
// 长名字别名：E.outCubic 和 E.outC 是同一个，写哪个都行
Object.assign(E, { linear: E.lin, inQuad: E.inQ, outQuad: E.outQ, inOutQuad: E.inOutQ, inCubic: E.inC, outCubic: E.outC, inOutCubic: E.inOutC, inOutSine: E.sine });
// 三次贝塞尔缓动（和 CSS cubic-bezier 一样），比如 bezier(0.34, 1.56, 0.64, 1) 是经典回弹
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = t => ((ax * t + bx) * t + cx) * t, sy = t => ((ay * t + by) * t + cy) * t, dx = t => (3 * ax * t + 2 * bx) * t + cx;
  return u => { if (u <= 0) return 0; if (u >= 1) return 1; let t = u; for (let i = 0; i < 8; i++) { const d = dx(t); if (Math.abs(d) < 1e-6) break; t = clamp(t - (sx(t) - u) / d); } return sy(t); };
}
// 弹簧：t 秒后的位置（0→1，带回弹）。f 每秒振几次，z 阻尼（0.3 很弹 / 0.6 几乎不弹）
export function spring(t, f = 2.5, z = .42) { if (t <= 0) return 0; const w = 2 * Math.PI * f, a = z * w, b = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-a * t) * (Math.cos(b * t) + (a / b) * Math.sin(b * t)); }
// 挤压拉伸：给一个「冲击」时刻，返回 [scaleX, scaleY]，面积不变
export function squash(t, hitT, amount = .2, f = 4, z = .35) { const d = t - hitT; if (d < 0) return [1, 1]; const k = Math.exp(-z * 2 * Math.PI * f * d) * Math.cos(2 * Math.PI * f * d) * amount; return [1 + k, 1 / (1 + k)]; }
// 带种子的随机数（不要用 Math.random，否则每次导出都不一样）
export function rng(seed = 1) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const noise1 = (x, seed = 0) => { const i = Math.floor(x), f = x - i, h = n => { const s = Math.sin((n + seed * 131) * 127.1) * 43758.5453; return s - Math.floor(s); }; const u = f * f * (3 - 2 * f); return lerp(h(i), h(i + 1), u) * 2 - 1; };

// ---------- 节拍表 ----------
// beats([['hook', 1.5], ['grow', 2.5], ...]) → { hook: {t0, t1}, grow: {...}, duration }
export function beats(list) { const out = {}; let t = 0; for (const [name, dur] of list) { out[name] = { t0: t, t1: t + dur, dur }; t += dur; } out.duration = t;
  if (typeof window !== 'undefined') (window.__BEATS ||= []).push(list.map(([name, dur]) => [name, dur]));   // 给 tools/check.mjs 看节奏用
  return out; }

// ---------- 启动片子 ----------
// film = { width, height, fps, duration, fonts: [['900 100px "某字体"', '要用到的字']], setup(canvas) 可选, draw(ctx, t), audio() 可选,
//          motionBlur: { windows: [[t0, t1], ...], samples: 16, frames: 2 } 可选：只在这些时间段给整帧加动态模糊（快速甩镜头、推切时用） }
// fps 可以写 60：快节奏的片子更顺，导出时间和文件大小翻倍。
export async function run(film, canvas = document.querySelector('canvas')) {
  canvas.width = film.width; canvas.height = film.height;
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('check')) await import('./guard.js');   // 检查模式：tools/check.mjs 用
  for (const [f, txt] of film.fonts || []) await document.fonts.load(f, txt || 'A').catch(() => {});
  await document.fonts.ready;
  if (film.setup) await film.setup(canvas);
  const ctx = canvas.getContext('2d'), fps = film.fps || 30, mb = film.motionBlur;
  window.DEMO = { width: film.width, height: film.height, fps, duration: film.duration, motionBlur: mb || null };
  const inBlur = t => mb && (mb.windows || []).some(([a, b]) => t >= a && t <= b);
  window.renderAt = async t => {
    t = clamp(t, 0, film.duration - 1e-4); if (window.__GUARD) window.__GUARD.frame(t);
    if (!inBlur(t)) { ctx.save(); film.draw(ctx, t); ctx.restore(); return; }
    // 整帧动态模糊：在「上一帧 → 下一帧」之间均匀取 samples 个时刻，各画一遍再平均（对照 After Effects 实测的做法）
    const n = mb.samples || 16, span = (mb.frames ?? 2) / fps, W = canvas.width, H = canvas.height, acc = new Float32Array(W * H * 4);
    for (let i = 0; i < n; i++) { const tt = clamp(t + ((i + .5) / n - .5) * span, 0, film.duration - 1e-4);
      ctx.save(); film.draw(ctx, tt); ctx.restore(); const d = ctx.getImageData(0, 0, W, H).data; for (let k = 0; k < d.length; k++) acc[k] += d[k]; }
    const img = ctx.createImageData(W, H); for (let k = 0; k < acc.length; k++) img.data[k] = acc[k] / n; ctx.putImageData(img, 0, 0);
  };
  if (film.audio) window.MP_AUDIO = async () => film.audio();
  await window.renderAt(0); window.__ready = true;
}

// ---------- 配乐合成（纯数学，结果每次一样，不依赖声卡） ----------
export const SR = 48000;
export const hz = n => { if (typeof n === 'number') return 440 * 2 ** ((n - 69) / 12); const m = /^([A-G])(#|b)?(-?\d)$/.exec(n); const k = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); return 440 * 2 ** ((k + (+m[3] + 1) * 12 - 69) / 12); };
export class Mix {
  constructor(seconds) { this.n = Math.ceil(seconds * SR); this.L = new Float32Array(this.n); this.R = new Float32Array(this.n); }
  // 一个音：t0 开始，dur 秒，频率 f（用 hz('C4') 或 hz(60)）。wave: sine / tri / square / pulse25 / saw / noise
  // env: [起音, 衰减, 持续电平, 释放]；slide: 音高滑动（-0.5 往下滑一半）；pan: -1 左 ~ 1 右
  tone(t0, dur, f, { wave = 'sine', vol = .2, env = [.005, .08, .6, .05], pan = 0, slide = 0, vib = 0 } = {}) {
    const [a, d, s, r] = env, i0 = Math.max(0, Math.floor(t0 * SR)), len = Math.floor((dur + r) * SR), gl = vol * Math.min(1, 1 - pan), gr = vol * Math.min(1, 1 + pan);
    let ph = 0, nz = 0, rs = 12345;
    for (let k = 0; k < len && i0 + k < this.n; k++) {
      const tt = k / SR, e = tt < a ? tt / a : tt < a + d ? 1 - (1 - s) * (tt - a) / d : tt < dur ? s : s * Math.max(0, 1 - (tt - dur) / r);
      ph += f * (1 + slide * tt / Math.max(dur, .001)) * (1 + vib * Math.sin(2 * Math.PI * 5.5 * tt)) / SR; ph -= Math.floor(ph); let v;
      if (wave === 'square') v = ph < .5 ? 1 : -1; else if (wave === 'pulse25') v = ph < .25 ? 1 : -1; else if (wave === 'tri') v = 4 * Math.abs(ph - .5) - 1;
      else if (wave === 'saw') v = 2 * ph - 1; else if (wave === 'sine') v = Math.sin(2 * Math.PI * ph);
      else { if (Math.floor(ph * 8) !== nz) { nz = Math.floor(ph * 8); rs = (rs * 9301 + 49297) % 233280; } v = rs / 116640 - 1; }
      this.L[i0 + k] += v * e * gl; this.R[i0 + k] += v * e * gr;
    }
  }
  // 常用音效
  kick(t, vol = .55) { this.tone(t, .14, 95, { wave: 'sine', vol, slide: -.6, env: [.001, .12, .1, .03] }); }
  snare(t, vol = .2) { this.tone(t, .12, 1800, { wave: 'noise', vol, env: [.001, .1, .05, .03] }); }
  hat(t, vol = .05) { this.tone(t, .03, 9000, { wave: 'noise', vol, env: [.001, .02, .1, .01] }); }
  pop(t, vol = .25) { this.tone(t, .08, 600, { wave: 'sine', vol, slide: 1.2, env: [.001, .06, .2, .02] }); }
  boing(t, vol = .2) { this.tone(t, .35, 220, { wave: 'tri', vol, slide: .8, vib: .15 }); }
  whoosh(t, dur = .4, vol = .14) { this.tone(t, dur, 400, { wave: 'noise', vol, slide: 2, env: [dur * .7, .05, .5, .08] }); }
  ding(t, vol = .18) { this.tone(t, .5, hz(91), { wave: 'sine', vol, env: [.001, .5, .05, .2] }); }
  thud(t, vol = .6) { this.tone(t, .4, 70, { wave: 'sine', vol, slide: -.6, env: [.001, .3, .1, .1] }); }
  echo(delay = .18, fb = .28, wet = .22) { const d = Math.floor(delay * SR); for (let i = d; i < this.n; i++) { this.L[i] += this.R[i - d] * fb * wet; this.R[i] += this.L[i - d] * fb * wet; } }
  // 收尾：响度拉到 -14 LUFS（抖音、视频号、B 站都按这个标准），峰值压在 -1 dB 以内，末尾 0.25 秒淡出。
  // master() 用默认值就行；想更轻一点写 master({ lufs: -16 })。旧写法 master(0.89) 还能用（只按峰值拉）。
  master(o = {}) {
    const fade = Math.floor(.25 * SR), n = this.n, L = this.L, R = this.R;
    if (typeof o === 'number') { let m = 1e-6; for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(L[i]), Math.abs(R[i]));
      const g = o / m; for (let i = 0; i < n; i++) { const f = i > n - fade ? (n - i) / fade : 1; L[i] = Math.tanh(L[i] * g * 1.1) * f; R[i] = Math.tanh(R[i] * g * 1.1) * f; }
      return { sampleRate: SR, left: L, right: R, lufs: loudness(L, R) }; }
    const { lufs = -14, ceil = .89 } = o, now = loudness(L, R);
    if (isFinite(now)) { const g = 10 ** ((lufs - now) / 20); for (let i = 0; i < n; i++) { L[i] *= g; R[i] *= g; } }
    limit(L, R, ceil);
    for (let i = n - fade; i < n; i++) { const f = (n - i) / fade; L[i] *= f; R[i] *= f; }
    return { sampleRate: SR, left: L, right: R, lufs: loudness(L, R) }; }
}
// 响度（LUFS，按 ITU BS.1770：K 加权 + 400ms 分块 + 两道门限）。只认 48kHz
export function loudness(L, R) {
  const kw = x => { const y = new Float32Array(x.length); let a1 = 0, a2 = 0, b1 = 0, b2 = 0, c1 = 0, c2 = 0, d1 = 0, d2 = 0;
    for (let i = 0; i < x.length; i++) { const v = x[i], s = 1.53512485958697 * v - 2.69169618940638 * a1 + 1.19839281085285 * a2 + 1.69065929318241 * b1 - .73248077421585 * b2; a2 = a1; a1 = v; b2 = b1; b1 = s;
      const h = s - 2 * c1 + c2 + 1.99004745483398 * d1 - .99007225036621 * d2; c2 = c1; c1 = s; d2 = d1; d1 = h; y[i] = h; } return y; };
  const l = kw(L), r = kw(R), blk = Math.floor(.4 * SR), hop = Math.floor(.1 * SR), ms = [];
  for (let i = 0; i + blk <= l.length; i += hop) { let z = 0; for (let k = i; k < i + blk; k++) z += l[k] * l[k] + r[k] * r[k]; ms.push(z / blk); }
  const lk = z => -.691 + 10 * Math.log10(z), avg = a => a.reduce((p, q) => p + q, 0) / a.length;
  const g1 = ms.filter(z => lk(z) > -70); if (!g1.length) return -Infinity;
  const rel = lk(avg(g1)) - 10, g2 = g1.filter(z => lk(z) > rel); return lk(avg(g2));
}
// 限幅：提前 5ms 看到峰值就把音量压下来，再用 80ms 慢慢放开（不会像硬削波那样破音）
function limit(L, R, ceil) {
  const n = L.length, look = Math.floor(.005 * SR), rel = Math.exp(-1 / (.08 * SR)), need = new Float32Array(n);
  for (let i = 0; i < n; i++) { const p = Math.max(Math.abs(L[i]), Math.abs(R[i])); need[i] = p > ceil ? ceil / p : 1; }
  const q = [], minAhead = new Float32Array(n);   // 滑动窗口最小值：i 往后 look 个样本里要压得最狠的那个
  for (let i = n - 1; i >= 0; i--) { while (q.length && need[q[q.length - 1]] >= need[i]) q.pop(); q.push(i); while (q[0] > i + look) q.shift(); minAhead[i] = need[q[0]]; }
  let g = 1; for (let i = 0; i < n; i++) { const target = minAhead[i]; g = target < g ? target : target + (g - target) * rel; L[i] *= g; R[i] *= g; if (Math.abs(L[i]) > ceil) L[i] = Math.sign(L[i]) * ceil; if (Math.abs(R[i]) > ceil) R[i] = Math.sign(R[i]) * ceil; }
}
// 一段四拍子伴奏：bpm、根音（MIDI 号，60=中央 C）、和弦走向（相对根音的半音数组）
export function backing(m, seconds, { bpm = 118, root = 60, prog = [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]], drums = true, pad = 'saw', arp = 'sine', bass = 'tri' } = {}) {
  const beat = 60 / bpm, bars = Math.ceil(seconds / (beat * 4));
  for (let b = 0; b < bars; b++) { const ch = prog[b % prog.length], t0 = b * 4 * beat;
    if (drums) for (let i = 0; i < 4; i++) { m.kick(t0 + i * beat, .45); if (i % 2) m.snare(t0 + i * beat, .15); m.hat(t0 + i * beat + beat / 2); }
    if (pad) for (const n of ch) m.tone(t0, beat * 3.8, hz(root + n), { wave: pad, vol: .025, pan: n % 2 ? -.3 : .3, env: [.08, .4, .5, .4] });
    if (bass) for (let i = 0; i < 4; i++) m.tone(t0 + i * beat, beat * .9, hz(root - 24 + ch[0]), { wave: bass, vol: .28, env: [.005, .15, .6, .05] });
    if (arp) for (let i = 0; i < 8; i++) m.tone(t0 + i * beat / 2, .2, hz(root + 12 + ch[i % ch.length]), { wave: arp, vol: .08, pan: .25, env: [.002, .18, .05, .1] });
  }
  return beat;
}
