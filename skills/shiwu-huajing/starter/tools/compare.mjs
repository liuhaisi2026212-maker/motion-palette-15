// 打磨用的并排对比：改前、改后两支 MP4 左右并排成一支对比视频，再出一张对照拼图（上下两行，同一时刻对齐）。需要 ffmpeg。
// 用法：node tools/compare.mjs 改前.mp4 改后.mp4 [输出.mp4，默认 out/对比.mp4]
//       --labels 改前,改后   左右两边角上写的字（需要 puppeteer-core 来画字；没装就只出不带字的对比）
// 拼图和视频同名，扩展名换成 .png：每行 8 帧，上面一行是改前、下面一行是改后。
// 怎么用它打磨见 references/04-自查与评审.md「并排打磨」。
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const args = process.argv.slice(2), li = args.indexOf('--labels');
if (li >= 0 && (!args[li + 1] || args[li + 1].startsWith('--'))) { console.error('--labels 后面要写两个词，用逗号隔开，比如：--labels 改前,改后'); process.exit(1); }
const labels = li >= 0 ? args.splice(li, 2)[1].split(/[,，]/) : ['改前', '改后'];
if (labels.length < 2 || !labels[0] || !labels[1]) { console.error('--labels 要写两个词，用逗号隔开，比如：--labels 改前,改后'); process.exit(1); }
const [A, B, outArg] = args;
if (!A || !B) { console.error('用法：node tools/compare.mjs 改前.mp4 改后.mp4 [输出.mp4] [--labels 改前,改后]'); process.exit(1); }
const out = path.resolve(outArg || 'out/对比.mp4'), sheet = out.replace(/\.[^.]+$/, '.png'); fs.mkdirSync(path.dirname(out), { recursive: true });
const probe = f => { const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height:format=duration', '-of', 'json', f], { encoding: 'utf8' });
  if (r.error) { console.error('找不到 ffprobe / ffmpeg，请先安装 ffmpeg。'); process.exit(1); } if (r.status) { console.error(`读不了 ${f}`); process.exit(1); }
  const j = JSON.parse(r.stdout), v = j.streams.find(s => s.codec_type === 'video'); return { w: v.width, h: v.height, dur: +j.format.duration, audio: j.streams.some(s => s.codec_type === 'audio') }; };
const a = probe(A), b = probe(B), dur = Math.max(a.dur, b.dur), HW = 960, HH = Math.round(HW * a.h / a.w / 2) * 2;   // 每边 960 宽，高按改前的比例

// 角标：用无头浏览器画成透明 PNG（ffmpeg 很多版本没有写字的滤镜）
async function labelPngs() {
  let puppeteer; try { puppeteer = (await import('puppeteer-core')).default; } catch { return null; }
  const exe = [process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find(p => fs.existsSync(p));
  if (!exe) return null; const br = await puppeteer.launch({ executablePath: exe, headless: 'new' }), pg = await br.newPage(), files = [];
  for (const [i, s] of labels.entries()) { const url = await pg.evaluate((s, i) => { const c = document.createElement('canvas'), x = c.getContext('2d'); x.font = '700 30px "PingFang SC", "Microsoft YaHei", sans-serif'; const w = Math.ceil(x.measureText(s).width) + 36; c.width = w; c.height = 52;
      x.font = '700 30px "PingFang SC", "Microsoft YaHei", sans-serif'; x.fillStyle = i ? '#FF8A3D' : 'rgba(20,20,26,.78)'; x.beginPath(); x.roundRect(0, 0, w, 52, 26); x.fill(); x.fillStyle = i ? '#1A1006' : '#FFFFFF'; x.textBaseline = 'middle'; x.fillText(s, 18, 27); return c.toDataURL('image/png'); }, s, i);
    const f = path.join(path.dirname(out), `_label${i}.png`); fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); files.push(f); }
  await br.close(); return files;
}
const lab = await labelPngs();
// 两边各缩到 960 宽（不变形，补黑边），短的那支停在最后一帧，左右拼起来；声音用改后的
const side = (i, p) => `[${i}:v]scale=${HW}:${HH}:force_original_aspect_ratio=decrease,pad=${HW}:${HH}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,tpad=stop_mode=clone:stop_duration=${(dur - p.dur + .1).toFixed(2)},trim=duration=${dur.toFixed(3)},format=yuv420p[s${i}]`;
let fc = `${side(0, a)};${side(1, b)};[s0][s1]hstack=inputs=2[h]`, last = '[h]';
if (lab) { fc += `;[h][2:v]overlay=24:20[h1];[h1][3:v]overlay=${HW + 24}:20[v]`; last = '[v]'; }
const inputs = ['-i', A, '-i', B, ...(lab ? lab.flatMap(f => ['-i', f]) : [])];
const audio = b.audio ? ['-map', '1:a', '-c:a', 'aac', '-b:a', '192k'] : a.audio ? ['-map', '0:a', '-c:a', 'aac', '-b:a', '192k'] : [];
let r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', ...inputs, '-filter_complex', fc, '-map', last, ...audio, '-t', dur.toFixed(3), '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: 'inherit' });
if (r.status) process.exit(r.status);
// 对照拼图：8 个时刻，上面一行改前、下面一行改后（从对比视频里切左右两半）
const N = 8, tw = 400, th = Math.round(tw * HH / HW / 2) * 2, tmp = path.join(path.dirname(out), '_cmp');
fs.mkdirSync(tmp, { recursive: true });
for (let k = 0; k < N; k++) { const t = (dur * (k + .5) / N).toFixed(3);
  for (const [j, x] of [[0, 0], [1, HW]]) spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', t, '-i', out, '-frames:v', '1', '-vf', `crop=${HW}:${HH}:${x}:0,scale=${tw}:${th}`, path.join(tmp, `${j}_${k}.png`)]); }
const list = [0, 1].flatMap(j => [...Array(N)].map((_, k) => path.join(tmp, `${j}_${k}.png`)));
r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', ...list.flatMap(f => ['-i', f]), '-filter_complex', list.map((_, i) => `[${i}:v]`).join('') + `xstack=inputs=${list.length}:layout=${list.map((_, i) => `${(i % N) * tw}_${Math.floor(i / N) * th}`).join('|')}`, sheet], { stdio: 'inherit' });
fs.rmSync(tmp, { recursive: true, force: true }); if (lab) lab.forEach(f => fs.rmSync(f, { force: true }));
console.log(`完成：${out}（左 ${labels[0]}、右 ${labels[1]}，${dur.toFixed(1)} 秒）\n对照拼图：${sheet}（上 ${labels[0]}、下 ${labels[1]}）`);
