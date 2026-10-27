// 十五画境 v0.3：读取可改配置。优先级：URL ?cfg=<JSON> > window.MP_CFG > 片子自带默认值
export function loadCfg(defaults) {
  const out = JSON.parse(JSON.stringify(defaults));
  const merge = src => { if (src && typeof src === 'object') for (const k in src) if (k in out && src[k] != null && src[k] !== '') out[k] = src[k]; };
  try { merge(window.MP_CFG); } catch (e) {}
  try { const q = new URLSearchParams(location.search).get('cfg'); if (q) merge(JSON.parse(q)); } catch (e) { console.warn('cfg parse failed', e); }
  return out;
}
const h2r = h => { h = String(h).replace('#', ''); if (h.length === 3) h = [...h].map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const r2h = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
export const mix = (a, b, t) => { const x = h2r(a), y = h2r(b); return r2h(x.map((v, i) => v + (y[i] - v) * t)); };
export const darken = (a, t) => mix(a, '#000000', t);
export const lighten = (a, t) => mix(a, '#FFFFFF', t);
export const isHex = s => /^#?[0-9a-fA-F]{6}$/.test(String(s || ''));
