// 文字体检：只在检查模式（film.html?check）下加载，正常预览和导出不受影响。
// 原理：拦下画布上每一次 fillText / strokeText，记下这段字在画面上的真实位置、字号，
// 并对比「画之前」和「画之后」的像素，算出字和它脚下背景的对比度。不管你用 text() 还是直接 ctx.fillText，都查得到。
// tools/check.mjs 读取 window.__GUARD.frames 出报告。
const main = document.querySelector('canvas');
const P = CanvasRenderingContext2D.prototype, rawFill = P.fillText, rawStroke = P.strokeText;
const lum = (r, g, b) => { const f = v => (v /= 255) <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
const G = window.__GUARD = { frames: [], cur: null, frame(t) { this.cur = { t, texts: [] }; this.frames.push(this.cur); } };

function box(ctx, s, x, y, maxW) {
  const m = ctx.measureText(s), sc = maxW && m.width > maxW ? maxW / m.width : 1;
  const l = -m.actualBoundingBoxLeft * sc, r = m.actualBoundingBoxRight * sc, tp = -m.actualBoundingBoxAscent, bt = m.actualBoundingBoxDescent;
  const T = ctx.getTransform(), pts = [[l, tp], [r, tp], [l, bt], [r, bt]].map(([a, b]) => [T.a * (x + a) + T.c * (y + b) + T.e, T.b * (x + a) + T.d * (y + b) + T.f]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), px = parseFloat(/(\d+(?:\.\d+)?)px/.exec(ctx.font)?.[1] || 10);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), size: px * Math.sqrt(Math.abs(T.a * T.d - T.b * T.c)) };
}
function grab(ctx, b) {
  const W = main.width, H = main.height, x = Math.max(0, Math.floor(b.x0) - 2), y = Math.max(0, Math.floor(b.y0) - 2);
  const w = Math.min(W, Math.ceil(b.x1) + 2) - x, h = Math.min(H, Math.ceil(b.y1) + 2) - y;
  if (w <= 0 || h <= 0) return null; return { x, y, w, h, d: ctx.getImageData(x, y, w, h).data };
}
// 同一段字常常要画好几层（立体厚度、外描边、内描边、填充）。连着画的同一段字算一组，
// 每层都和「这一组开画之前」的背景比，最后一层的结果就是观众看到的整段字和背景的反差。
let group = null;
function wrap(raw, kind) {
  return function (s, x, y, maxW) {
    if (this.canvas !== main || !G.cur || s == null || !String(s).trim() || this.globalAlpha < .35) return raw.apply(this, arguments);
    const str = String(s), b = box(this, str, x, y, maxW);
    const same = group && group.frame === G.cur && group.s === str && Math.abs(group.b.x0 - b.x0) < b.size * .6 && Math.abs(group.b.y0 - b.y0) < b.size * .6;
    if (!same) group = { frame: G.cur, s: str, b, before: grab(this, { x0: b.x0 - b.size * .35, y0: b.y0 - b.size * .35, x1: b.x1 + b.size * .35, y1: b.y1 + b.size * .35 }) };
    const out = raw.apply(this, arguments), before = group.before;
    if (!before) { G.cur.texts.push({ s: str, ...b, kind, alpha: this.globalAlpha, contrast: null }); return out; }
    const after = this.getImageData(before.x, before.y, before.w, before.h).data, ratios = [], bgL = [];
    for (let i = 0; i < after.length; i += 4) {
      const dd = Math.abs(after[i] - before.d[i]) + Math.abs(after[i + 1] - before.d[i + 1]) + Math.abs(after[i + 2] - before.d[i + 2]);
      const bg = lum(before.d[i], before.d[i + 1], before.d[i + 2]);
      if (dd < 40) { bgL.push(bg); continue; }   // 没被字盖到的像素：就是字周围的背景
      const a = lum(after[i], after[i + 1], after[i + 2]);
      ratios.push((Math.max(a, bg) + .05) / (Math.min(a, bg) + .05));
    }
    ratios.sort((p, q) => p - q);
    // 取第 80 百分位：字的边缘有抗锯齿，看笔画实心部分的反差
    const contrast = ratios.length > 8 ? ratios[Math.floor(ratios.length * .8)] : null;
    // 背景花不花：字周围背景亮度的起伏（0～1），珠子、照片、密集图案会很高
    const m = bgL.reduce((a, c) => a + c, 0) / (bgL.length || 1), busy = bgL.length > 20 ? Math.sqrt(bgL.reduce((a, c) => a + (c - m) ** 2, 0) / bgL.length) : 0;
    G.cur.texts.push({ s: str, ...b, kind, alpha: this.globalAlpha, contrast, busy, covered: ratios.length });
    return out;
  };
}
P.fillText = wrap(rawFill, 'fill'); P.strokeText = wrap(rawStroke, 'stroke');
