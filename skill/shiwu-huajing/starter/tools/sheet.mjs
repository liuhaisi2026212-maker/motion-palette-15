// 出关键帧拼图，用来自查（不需要 ffmpeg）。
// 用法：node tools/sheet.mjs                → 均匀取 12 帧，存成 out/sheet.png
//       node tools/sheet.mjs 0.5,2,4.25,8   → 只取这些秒，同时把每张原图存到 out/stills/
import fs from 'node:fs'; import path from 'node:path'; import { openFilm, ROOT } from './_page.mjs';
const arg = process.argv[2]; const { pg, demo, errors, close } = await openFilm();
const times = arg ? arg.split(',').map(Number) : Array.from({ length: 12 }, (_, i) => +(demo.duration * (i + .5) / 12).toFixed(2));
const out = path.join(ROOT, 'out'); fs.mkdirSync(path.join(out, 'stills'), { recursive: true });
const data = await pg.evaluate(async times => {
  const cv = document.querySelector('canvas'), cols = Math.min(4, times.length), rows = Math.ceil(times.length / cols), tw = 640, th = Math.round(tw * cv.height / cv.width);
  const sheet = document.createElement('canvas'); sheet.width = cols * tw; sheet.height = rows * (th + 34); const sx = sheet.getContext('2d'); sx.fillStyle = '#111'; sx.fillRect(0, 0, sheet.width, sheet.height);
  const singles = [];
  for (let i = 0; i < times.length; i++) { await window.renderAt(times[i]); singles.push(cv.toDataURL('image/png')); const x = (i % cols) * tw, y = Math.floor(i / cols) * (th + 34);
    sx.drawImage(cv, x, y + 34, tw, th); sx.fillStyle = '#fff'; sx.font = '600 22px sans-serif'; sx.fillText(times[i].toFixed(2) + ' 秒', x + 10, y + 25); }
  return { sheet: sheet.toDataURL('image/png'), singles };
}, times);
fs.writeFileSync(path.join(out, 'sheet.png'), Buffer.from(data.sheet.split(',')[1], 'base64'));
if (arg) data.singles.forEach((d, i) => fs.writeFileSync(path.join(out, 'stills', `t${times[i].toFixed(2)}.png`), Buffer.from(d.split(',')[1], 'base64')));
console.log(`时长 ${demo.duration.toFixed(2)} 秒，${demo.width}×${demo.height}。拼图：out/sheet.png`); if (errors.length) console.log('页面报错：', errors.slice(0, 5));
await close();
