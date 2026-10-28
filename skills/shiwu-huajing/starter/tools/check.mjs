// 自动体检：导出前跑一遍，把「人眼容易漏、观众一眼就看到」的问题找出来。
// 用法：node tools/check.mjs                     检查 film.js
//       node tools/check.mjs --film films/hud.js 只检查某一段
//       node tools/check.mjs --step 0.5          抽帧间隔（默认 0.25 秒）
// 输出：out/check.png（按手机实际大小缩小的拼图，画了平台遮挡区，问题字用红框标出）+ out/check.md（问题清单）
// 查什么：字太小、字和背景反差不够、字被平台界面挡住、字叠在一起、字出画、开头空屏、画面停住太久、每段一样长、音量不对。
import fs from 'node:fs'; import path from 'node:path'; import { openFilm, ROOT, FILM } from './_page.mjs';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const STEP = +arg('--step', .25);
const { pg, demo, errors, close } = await openFilm({ check: true });
const W = demo.width, H = demo.height, vertical = H / W > 1.4;
// 手机上看到的大小：竖屏铺满约 390 点宽；横屏按 640 点宽算。eff 就是「手机上的字号（点）」
const REF = vertical ? 390 : 640, eff = px => px * REF / W;
const times = []; for (let t = 0; t < demo.duration - 1e-3; t += STEP) times.push(+t.toFixed(3));

const res = await pg.evaluate(async (times) => {
  const cv = document.querySelector('canvas'), tiny = document.createElement('canvas'); tiny.width = 48; tiny.height = Math.round(48 * cv.height / cv.width);
  const tx = tiny.getContext('2d', { willReadFrequently: true }), out = [];
  const th = document.createElement('canvas'); th.width = 270; th.height = Math.round(270 * cv.height / cv.width); const thx = th.getContext('2d');
  for (const t of times) {
    await window.renderAt(t); tx.drawImage(cv, 0, 0, tiny.width, tiny.height);
    const d = tx.getImageData(0, 0, tiny.width, tiny.height).data, g = []; for (let i = 0; i < d.length; i += 4) g.push((d[i] + d[i + 1] + d[i + 2]) / 3);
    const fr = window.__GUARD.frames[window.__GUARD.frames.length - 1];
    let thumb = null; if (Math.abs(t - Math.round(t * 2) / 2) < 1e-3) { thx.drawImage(cv, 0, 0, th.width, th.height); thumb = th.toDataURL('image/jpeg', .85); }
    out.push({ t, g, texts: fr ? fr.texts : [], thumb });
  }
  let audio = null;
  if (window.MP_AUDIO) { const a = await window.MP_AUDIO(), { loudness } = await import('./lib/core.js'); let pk = 0; for (let i = 0; i < a.left.length; i++) pk = Math.max(pk, Math.abs(a.left[i]), Math.abs(a.right[i]));
    audio = { lufs: a.lufs ?? loudness(a.left, a.right), peak: 20 * Math.log10(pk || 1e-9) }; }
  return { frames: out, beats: window.__BEATS || [], audio };
}, times);

// ---------- 文字问题 ----------
const issues = new Map();   // key → { type, s, times: [], box }
// 滚动数字每帧都不一样，数字一律当成 # 来归组
const add = (type, s, t, b, extra = '') => { const k = type + '|' + s.replace(/\d+/g, '#'); if (!issues.has(k)) issues.set(k, { type, s, times: [], boxes: new Map(), extra }); const it = issues.get(k); it.times.push(t); it.boxes.set(t, b); if (extra) it.extra = extra; };
const meaningful = s => (s.match(/[一-鿿]/g) || []).length >= 4 || (s.match(/[A-Za-z]/g) || []).length >= 10;
const inter = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
const area = a => (a.x1 - a.x0) * (a.y1 - a.y0);
for (const f of res.frames) {
  // 同一段字画了好几层（立体、描边、填充）算一个：反差看最后一层（guard 已经拿它和整组开画前的背景比）
  const merged = [];
  for (const x of f.texts) { const m = merged.find(y => y.s === x.s && inter(x, y) > .5 * Math.min(area(x), area(y)));
    if (m) { if (x.contrast != null) { m.contrast = x.contrast; m.busy = x.busy; } m.x0 = Math.min(m.x0, x.x0); m.y0 = Math.min(m.y0, x.y0); m.x1 = Math.max(m.x1, x.x1); m.y1 = Math.max(m.y1, x.y1); m.size = Math.max(m.size, x.size); }
    else merged.push({ ...x }); }
  for (const x of merged) {
    const e = eff(x.size), s = x.s.trim(); if (!s) continue;
    if (e < 12 && meaningful(s)) add('small', s, f.t, x, `手机上约 ${e.toFixed(0)} 点（画布 ${x.size.toFixed(0)}px）`);
    if (x.contrast != null && e >= 10) {
      if (x.contrast < 3) add('contrast', s, f.t, x, `反差 ${x.contrast.toFixed(1)} : 1`);
      else if (x.busy > .08 && x.contrast < 4.5) add('contrast', s, f.t, x, `背景很花，反差只有 ${x.contrast.toFixed(1)} : 1`);
    }
    if (x.x0 < -2 || x.y0 < -2 || x.x1 > W + 2 || x.y1 > H + 2) { if (e >= 12) add('out', s, f.t, x); }
    if (vertical && e >= 12 && (meaningful(s) || e >= 16)) {
      const k = H / 1920, kw = W / 1080;
      if (x.y1 > H - 420 * k) add('safe', s, f.t, x, '底部（标题、文案区）');
      else if (x.y0 < 160 * k) add('safe', s, f.t, x, '顶部（状态栏、搜索）');
      else if (x.x1 > W - 140 * kw && x.y0 > 800 * k) add('safe', s, f.t, x, '右侧（点赞、评论按钮）');
    }
  }
  for (let i = 0; i < merged.length; i++) for (let j = i + 1; j < merged.length; j++) {
    const a = merged[i], b = merged[j]; if (a.s === b.s || eff(a.size) < 10 || eff(b.size) < 10 || a.alpha < .6 || b.alpha < .6) continue;
    const o = inter(a, b); if (o > .2 * Math.min(area(a), area(b))) add('overlap', `「${a.s.trim()}」和「${b.s.trim()}」`, f.t, { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) });
  }
}
// 只保留持续至少 0.5 秒的问题（动画进场、转场中间的一两帧不算）
const runs = ts => { const r = []; for (const t of ts.sort((a, b) => a - b)) { const l = r[r.length - 1]; if (l && t - l[1] <= STEP * 1.5) l[1] = t; else r.push([t, t]); } return r; };
const keep = [...issues.values()].map(it => ({ ...it, runs: runs(it.times).filter(([a, b]) => b - a >= .5 - 1e-6) })).filter(it => it.runs.length);

// ---------- 画面问题 ----------
const other = [];
const diff = (a, b) => a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / a.length;
const sd = g => { const m = g.reduce((a, b) => a + b, 0) / g.length; return Math.sqrt(g.reduce((a, b) => a + (b - m) ** 2, 0) / g.length); };
const f0 = res.frames[0], f1 = res.frames.find(f => f.t >= .3) || f0;
if (sd(f0.g) < 4 && sd(f1.g) < 4) other.push('开头 0.3 秒还是空屏（几乎纯色）。第一帧就要有主体或文字，观众才不会划走。');
let st = null;
for (let i = 1; i < res.frames.length; i++) { const still = diff(res.frames[i].g, res.frames[i - 1].g) < .6;
  if (still && st == null) st = res.frames[i - 1].t; if ((!still || i === res.frames.length - 1) && st != null) { const end = res.frames[still ? i : i - 1].t; if (end - st >= 1.5 && end < demo.duration - 1.3) other.push(`${st.toFixed(1)}–${end.toFixed(1)} 秒画面几乎完全不动（${(end - st).toFixed(1)} 秒）。停住的画面也要有微动：慢推镜头、呼吸、漂浮（lib/motion.js 的 camera / idle）。`); st = null; } }
for (const list of res.beats) { if (list.length < 5) continue; const d = list.map(x => x[1]), m = d.reduce((a, b) => a + b, 0) / d.length, cv = Math.sqrt(d.reduce((a, b) => a + (b - m) ** 2, 0) / d.length) / m;
  if (cv < .15) other.push(`节拍表里 ${d.length} 段几乎一样长（平均 ${m.toFixed(1)} 秒），看起来会像在翻幻灯片。重点段放长（钩子、高潮、结尾），过渡段压短。`); }
if (res.audio) { const { lufs, peak } = res.audio;
  if (lufs < -16 || lufs > -12) other.push(`整体响度 ${lufs.toFixed(1)} LUFS，平台标准是 -14 左右（${lufs < -16 ? '偏小，手机外放会比别的视频轻' : '偏大，会被平台压低还可能破音'}）。audio() 最后用 m.master() 会自动拉到 -14。`);
  if (peak > -.5) other.push(`峰值 ${peak.toFixed(1)} dB，太接近 0，可能破音。`); }
else other.push('没有声音（film 里没有 audio()）。如果要发抖音、视频号，至少配一层底乐和关键音效。');

// ---------- 出拼图 ----------
const NAMES = { small: '字太小', contrast: '反差不够', safe: '会被平台界面挡住', overlap: '文字叠在一起', out: '字出了画面' };
const flagged = new Map(); for (const it of keep) for (const [t, b] of it.boxes) { const k = Math.round(t * 2) / 2; if (Math.abs(k - t) < 1e-3) (flagged.get(k) || flagged.set(k, []).get(k)).push(b); }
const thumbs = res.frames.filter(f => f.thumb);
const sheet = await pg.evaluate(async ({ thumbs, flagged, W, H, vertical }) => {
  const tw = 270, th = Math.round(tw * H / W), cols = Math.min(vertical ? 10 : 6, thumbs.length), rows = Math.ceil(thumbs.length / cols);
  const c = document.createElement('canvas'); c.width = cols * tw; c.height = rows * (th + 26); const x = c.getContext('2d'); x.fillStyle = '#111'; x.fillRect(0, 0, c.width, c.height);
  const s = tw / W;
  for (let i = 0; i < thumbs.length; i++) { const im = new Image(); im.src = thumbs[i].thumb; await im.decode(); const ox = (i % cols) * tw, oy = Math.floor(i / cols) * (th + 26) + 26;
    x.drawImage(im, ox, oy, tw, th); x.fillStyle = '#ddd'; x.font = '600 16px sans-serif'; x.fillText(thumbs[i].t.toFixed(1) + ' 秒', ox + 6, oy - 7);
    if (vertical) { x.fillStyle = 'rgba(255,0,80,.16)'; x.fillRect(ox, oy + th - 420 * H / 1920 * s, tw, 420 * H / 1920 * s); x.fillRect(ox, oy, tw, 160 * H / 1920 * s); x.fillRect(ox + tw - 140 * W / 1080 * s, oy + 800 * H / 1920 * s, 140 * W / 1080 * s, th - (800 + 420) * H / 1920 * s); }
    for (const b of flagged[thumbs[i].t] || []) { x.strokeStyle = '#ff2d55'; x.lineWidth = 2; x.strokeRect(ox + b.x0 * s - 2, oy + b.y0 * s - 2, (b.x1 - b.x0) * s + 4, (b.y1 - b.y0) * s + 4); } }
  return c.toDataURL('image/png');
}, { thumbs: thumbs.map(f => ({ t: f.t, thumb: f.thumb })), flagged: Object.fromEntries(flagged), W, H, vertical });
const out = path.join(ROOT, 'out'); fs.mkdirSync(out, { recursive: true });
const tag = FILM ? '-' + path.basename(FILM, '.js') : '';
fs.writeFileSync(path.join(out, `check${tag}.png`), Buffer.from(sheet.split(',')[1], 'base64'));

// ---------- 报告 ----------
const fmt = r => r.map(([a, b]) => a === b ? `${a.toFixed(1)}s` : `${a.toFixed(1)}–${b.toFixed(1)}s`).join('、');
const FIX = { small: '想让观众读的句子，竖屏至少 44px（手机上约 16 点），最小也别低于 34px；装饰性的小数据可以忽略这条。',
  contrast: '字和脚下背景太接近：换深浅相反的颜色，或用 lib/draw.js 的 readable() 自动加描边 / 底板。',
  safe: '挪进安全区：竖屏 1080×1920 时，重要文字放在 y = 300～1500、x ≤ 940。', overlap: '两段字的位置算重了：数字用 counter() 预留位数；后出现的字要给先出现的字让位。', out: '字超出画面了：缩小字号（fitSize）或自动换行（text 的 maxW）。' };
let md = `# 自动体检报告\n\n片子：${FILM || 'film.js'}　${W}×${H}，${demo.fps}fps，${demo.duration.toFixed(1)} 秒。抽帧间隔 ${STEP} 秒，拼图见 out/check${tag}.png（红框 = 有问题的字，粉色区 = 平台界面会挡住的地方）。\n\n`;
const total = keep.length + other.length;
md += total ? `**发现 ${total} 个问题，改完再导出。**\n\n` : '**没有发现问题。** 仍然要自己按 04-自查与评审.md 看一遍动画。\n\n';
for (const type of Object.keys(NAMES)) { const list = keep.filter(i => i.type === type); if (!list.length) continue;
  // 小字往往很多（HUD 数据、英文小标），只列最大的 12 条：越接近及格线的越可能是想让人读的句子
  const shown = type === 'small' ? [...list].sort((a, b) => parseFloat(/画布 (\d+)/.exec(b.extra)[1]) - parseFloat(/画布 (\d+)/.exec(a.extra)[1])).slice(0, 12) : list;
  md += `## ${NAMES[type]}（${list.length}）\n\n${FIX[type]}\n\n`; for (const it of shown) md += `- ${type === 'overlap' ? it.s : '「' + it.s.trim().slice(0, 24) + '」'}　${fmt(it.runs)}${it.extra ? '　' + it.extra : ''}\n`;
  if (shown.length < list.length) md += `- ……另有 ${list.length - shown.length} 处更小的字没列出。装饰性的数据、英文小标可以不管；想让观众读的句子一律放大。\n`; md += '\n'; }
if (other.length) { md += `## 画面、节奏和声音（${other.length}）\n\n`; for (const o of other) md += `- ${o}\n`; md += '\n'; }
if (errors.length) md += `## 页面报错\n\n${errors.slice(0, 8).map(e => '- ' + e).join('\n')}\n`;
fs.writeFileSync(path.join(out, `check${tag}.md`), md);
console.log(md); await close();
