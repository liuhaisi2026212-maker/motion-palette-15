// 十五画境·创作版 公共工具：镜头表读取、时间线、缓动、随机数、配乐合成。
// 每个风格包（kits/<名字>/）用它搭成一个「给时间 t 就画出那一帧」的页面：window.renderAt(t)，和原项目的渲染脚本兼容。

export const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
export const lerp = (a, b, u) => a + (b - a) * u;
export const inv = (a, b, x) => clamp((x - a) / (b - a));
export const E = {
  lin: u => u, inQ: u => u * u, outQ: u => 1 - (1 - u) ** 2, ioQ: u => u < .5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2,
  outC: u => 1 - (1 - u) ** 3, ioC: u => u < .5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2, inC: u => u ** 3,
  outBack: (u, s = 1.70158) => 1 + (s + 1) * (u - 1) ** 3 + s * (u - 1) ** 2,
  outElastic: u => u <= 0 ? 0 : u >= 1 ? 1 : 2 ** (-10 * u) * Math.sin((u * 10 - .75) * (2 * Math.PI / 3)) + 1,
  outBounce: u => { const n = 7.5625, d = 2.75; if (u < 1 / d) return n * u * u; if (u < 2 / d) return n * (u -= 1.5 / d) * u + .75; if (u < 2.5 / d) return n * (u -= 2.25 / d) * u + .9375; return n * (u -= 2.625 / d) * u + .984375; },
};
// 阻尼弹簧 0→1（闭式解，任意 t 都能直接算，适合逐帧渲染）
export function spring(t, f = 2.2, z = .42) { if (t <= 0) return 0; const w = 2 * Math.PI * f, a = z * w, b = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-a * t) * (Math.cos(b * t) + (a / b) * Math.sin(b * t)); }
export function hashStr(s) { let h = 2166136261 >>> 0; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; }
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const hash01 = (...a) => { let h = 2166136261 >>> 0; for (const v of a) { h ^= Math.floor(v * 1000) >>> 0; h = Math.imul(h ^ (h >>> 13), 1597334677) >>> 0; } return (h >>> 0) / 4294967296; };

// ---------- 镜头表 ----------
// 来源（优先级从高到低）：URL ?spec=<JSON>，父页面 window.__MP_SPEC（工作台），风格包自带的示例
export function readSpec(fallback) {
  try { const q = new URLSearchParams(location.search).get('spec'); if (q) return JSON.parse(q); } catch (e) { console.warn('spec 参数解析失败', e); }
  try { if (window.parent && window.parent !== window && window.parent.__MP_SPEC) return JSON.parse(JSON.stringify(window.parent.__MP_SPEC)); } catch (e) {}
  return fallback;
}
// 用户上传的图片：镜头表里写 "@1" 表示第 1 张（工作台把图片放在 window.parent.__MP_IMAGES）
export function imageURL(ref) {
  if (!ref) return null; const m = /^@(\d+)$/.exec(String(ref));
  if (m) { try { return (window.parent.__MP_IMAGES || [])[+m[1] - 1] || null; } catch (e) { return null; } }
  return String(ref);
}
export const loadImage = src => new Promise(res => { if (!src) return res(null); const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });

// 把镜头排到时间线上：每个镜头有 t0、t1、dur、i
export function timeline(shots, minDur = 1.5, maxDur = 8) {
  let t = 0; const out = shots.map((s, i) => { const dur = clamp(+s.seconds || +s.dur || 3, minDur, maxDur); const o = { ...s, i, t0: t, t1: t + dur, dur }; t += dur; return o; });
  return { shots: out, duration: t };
}
export const shotAt = (tl, t) => { for (const s of tl.shots) if (t < s.t1) return s; return tl.shots[tl.shots.length - 1]; };

// ---------- 页面启动 ----------
export async function boot({ width, height, fps = 30, fonts = [] }, init) {
  await Promise.all(fonts.map(f => document.fonts.load(f[0], f[1] || 'A').catch(() => {})));
  await document.fonts.ready;
  const film = await init();
  window.DEMO = { width, height, fps, duration: film.duration, motionBlur: { samples: 1, shutter: .5 } };
  window.renderAt = async t => film.render(clamp(t, 0, film.duration - 1e-4));
  if (film.audio) window.MP_AUDIO = film.audio;   // 工作台导出时调用，返回 { sampleRate, left, right }
  window.MP_INFO = film.info || {};
  await window.renderAt(0);
  window.__ready = true;
}

// ---------- 配乐合成（纯数学，不依赖 WebAudio，结果每次一样） ----------
export const SR = 48000;
export const noteHz = n => { if (typeof n === 'number') return 440 * 2 ** ((n - 69) / 12);
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(n); const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); return 440 * 2 ** ((base + (+m[3] + 1) * 12 - 69) / 12); };
export class Mix {
  constructor(sec) { this.n = Math.ceil(sec * SR); this.L = new Float32Array(this.n); this.R = new Float32Array(this.n); }
  // wave: square/pulse25/tri/saw/sine/noise；env: [起音, 衰减, 持续电平, 释放]（秒）
  tone(t0, dur, hz, { wave = 'square', vol = .2, env = [.005, .08, .6, .05], pan = 0, slide = 0, vib = 0, seed = 1 } = {}) {
    const [a, d, s, r] = env, i0 = Math.max(0, Math.floor(t0 * SR)), len = Math.floor((dur + r) * SR), gl = vol * Math.min(1, 1 - pan), gr = vol * Math.min(1, 1 + pan);
    let ph = 0, nz = 0, rs = seed * 9301 + 49297;
    for (let k = 0; k < len && i0 + k < this.n; k++) {
      const tt = k / SR; let e = tt < a ? tt / a : tt < a + d ? 1 - (1 - s) * (tt - a) / d : tt < dur ? s : s * Math.max(0, 1 - (tt - dur) / r);
      const f = hz * (1 + slide * tt / Math.max(dur, .001)) * (1 + vib * Math.sin(2 * Math.PI * 5.5 * tt));
      ph += f / SR; ph -= Math.floor(ph); let v;
      if (wave === 'square') v = ph < .5 ? 1 : -1; else if (wave === 'pulse25') v = ph < .25 ? 1 : -1; else if (wave === 'tri') v = 4 * Math.abs(ph - .5) - 1;
      else if (wave === 'saw') v = 2 * ph - 1; else if (wave === 'sine') v = Math.sin(2 * Math.PI * ph);
      else { if (Math.floor(ph * 8) !== nz) { nz = Math.floor(ph * 8); rs = (rs * 9301 + 49297) % 233280; } v = rs / 116640 - 1; }
      v *= e; this.L[i0 + k] += v * gl; this.R[i0 + k] += v * gr;
    }
  }
  // 简单回声，让合成音更饱满
  echo(delay = .18, fb = .28, wet = .22) { const d = Math.floor(delay * SR); for (let i = d; i < this.n; i++) { this.L[i] += this.R[i - d] * fb * wet; this.R[i] += this.L[i - d] * fb * wet; } }
  master(peak = .89) { let m = 1e-6; for (let i = 0; i < this.n; i++) m = Math.max(m, Math.abs(this.L[i]), Math.abs(this.R[i]));
    const g = peak / m, fade = Math.floor(.25 * SR); for (let i = 0; i < this.n; i++) { const f = i > this.n - fade ? (this.n - i) / fade : 1; this.L[i] = Math.tanh(this.L[i] * g * 1.1) * f; this.R[i] = Math.tanh(this.R[i] * g * 1.1) * f; }
    return { sampleRate: SR, left: this.L, right: this.R }; }
}
