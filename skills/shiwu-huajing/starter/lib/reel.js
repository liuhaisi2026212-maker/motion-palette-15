// 把几支单独的片子按顺序拼成一支（比如 15 种风格各做 5～10 秒，再串成一支合集）。
// 每一段都是一个完整的片子对象（和 film.js 导出的一样），可以先单独预览、单独检查、单独导出，满意了再拼。
//
// import { reel } from './lib/reel.js';
// import hud from './films/hud.js';
// import pixel from './films/pixel.js';
// export default reel([
//   { film: hud },                                                     // 用它自己的 duration
//   { film: pixel, cut: { type: 'iris', dur: .4, x: 540, y: 900 } },   // 从上一段转进来的方式
// ], { bpm: 120, bed: (m, dur) => backing(m, dur, { bpm: 120 }) });
//
// cut.type：'cut' 硬切（默认）、'flash' 硬切 + 白闪 2 帧、'iris' 圆形放大（x, y 是圆心）、'wipe' 斜擦（angle）、'bars' 横条、
//           'push' 整屏推走（dir 写新画面从哪边进来：left / right / up / down）。给了 bpm 时，切点会自动吸到最近的拍子上。
// 每段都要自己铺满背景（第一行先 fillRect 整个画面），否则转场时会透出上一段。
// 转场期间两段都在画：上一段在走它的最后 dur 秒，下一段在走它的前 dur 秒。所以每段开头别留空画面，结尾也别提前收光。
import { clamp, seg, E, Mix, SR } from './core.js';
import { revealClip } from './motion.js';

export function reel(items, { bpm = 0, bed = null, audioGap = 0 } = {}) {
  const first = items[0].film, W = first.width, H = first.height, fps = first.fps || 30, beat = bpm ? 60 / bpm : 0;
  // 排时间：每段的起点。有 bpm 时把每个切点吸到最近的拍子上，转场就卡在鼓点上
  let t = 0; const segs = items.map((it, i) => {
    const d = it.dur ?? it.film.duration, cut = i ? { type: 'cut', dur: 0, ...it.cut } : { type: 'cut', dur: 0 };
    if (i) t -= cut.dur; if (beat && i) t = Math.round(t / beat) * beat;
    const s = { film: it.film, t0: t, dur: d, cut }; t += d; return s;
  });
  const duration = t;
  for (const s of segs) if (s.film.width !== W || s.film.height !== H) console.warn('拼接的片子尺寸不一致：', s.film.width, s.film.height, '≠', W, H);
  if (typeof window !== 'undefined') (window.__BEATS ||= []).push(segs.map((s, i) => ['段' + (i + 1), s.dur]));
  let off = null, offCtx = null;
  const local = (s, t) => clamp(t - s.t0, 0, s.dur - 1e-4);

  return {
    width: W, height: H, fps, duration,
    fonts: segs.flatMap(s => s.film.fonts || []),
    segments: segs.map(s => ({ t0: s.t0, t1: s.t0 + s.dur })),
    async setup(canvas) {
      off = document.createElement('canvas'); off.width = W; off.height = H; offCtx = off.getContext('2d');
      for (const s of segs) if (s.film.setup) await s.film.setup(canvas);
    },
    draw(ctx, t) {
      let i = 0; while (i < segs.length - 1 && t >= segs[i + 1].t0) i++;   // 转场期间已经算进下一段
      const cur = segs[i], prev = segs[i - 1], c = cur.cut, inT = t - cur.t0;
      if (!prev || c.dur <= 0 || inT >= c.dur || c.type === 'cut' || c.type === 'flash') {
        ctx.save(); cur.film.draw(ctx, local(cur, t)); ctx.restore();
        if (c.type === 'flash' && inT >= 0 && inT < 2 / fps) { ctx.save(); ctx.globalAlpha = .85 * (1 - inT * fps / 2); ctx.fillStyle = c.color || '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
        return;
      }
      const u = (c.ease || E.inOutC)(seg(inT, 0, c.dur));
      ctx.save(); if (c.type === 'push') ctx.translate(...pushOff(c, -u, W, H)); prev.film.draw(ctx, local(prev, t)); ctx.restore();
      offCtx.setTransform(1, 0, 0, 1, 0, 0); offCtx.clearRect(0, 0, W, H); offCtx.save(); cur.film.draw(offCtx, local(cur, t)); offCtx.restore();
      ctx.save();
      if (c.type === 'push') { ctx.translate(...pushOff(c, 1 - u, W, H)); ctx.drawImage(off, 0, 0); }
      else { revealClip(ctx, c.type, u, c); ctx.drawImage(off, 0, 0); }
      ctx.restore();
    },
    audio() {
      // 每段的声音按位置混进来，再垫一层贯穿全片的底乐（可选），最后整体拉响度
      const m = new Mix(duration + .3);
      if (bed) bed(m, duration);
      for (const s of segs) {
        if (!s.film.audio) continue; const a = s.film.audio(), i0 = Math.floor((s.t0 + audioGap) * SR), n = Math.min(a.left.length, Math.floor(s.dur * SR));
        const fadeIn = Math.floor((s.cut.dur || .02) * SR), fadeOut = Math.floor(.05 * SR), g = bed ? .7 : 1;
        for (let k = 0; k < n && i0 + k < m.n; k++) { if (i0 + k < 0) continue; const f = Math.min(1, k / fadeIn, (n - k) / fadeOut) * g; m.L[i0 + k] += a.left[k] * f; m.R[i0 + k] += a.right[k] * f; }
      }
      return m.master();
    },
  };
}
function pushOff(c, u, W, H) { const d = c.dir || 'left'; return d === 'left' ? [u * -W, 0] : d === 'right' ? [u * W, 0] : d === 'up' ? [0, u * -H] : [0, u * H]; }
