// 把已经导出好的几支 MP4 首尾相接拼成一支（需要 ffmpeg）。
// 用法：node tools/join.mjs 输出.mp4 第一段.mp4 第二段.mp4 ...
//       加 --fade 0.3：每两段之间交叉淡化 0.3 秒（默认硬切）
// 尺寸以第一段为准，其它段自动缩放、补边；声音统一拉到 -14 LUFS。
// 能在代码里拼（lib/reel.js）就优先在代码里拼：转场可以做成圆形放大、推屏、卡拍子，比视频文件之间的淡化好看得多。
// 这个工具是给「几段是分别做的、或者别人做的，手里只有 MP4」的情况用。
import { spawnSync } from 'node:child_process';
const args = process.argv.slice(2), fi = args.indexOf('--fade'), fade = fi >= 0 ? +args.splice(fi, 2)[1] : 0;
const [out, ...ins] = args;
if (!out || ins.length < 2) { console.error('用法：node tools/join.mjs 输出.mp4 第一段.mp4 第二段.mp4 ...'); process.exit(1); }
const probe = f => { const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height:format=duration', '-of', 'json', f], { encoding: 'utf8' });
  if (r.error) { console.error('找不到 ffprobe / ffmpeg，请先安装 ffmpeg。'); process.exit(1); }
  const j = JSON.parse(r.stdout), v = j.streams.find(s => s.codec_type === 'video'); return { w: v.width, h: v.height, dur: +j.format.duration, audio: j.streams.some(s => s.codec_type === 'audio') }; };
const info = ins.map(probe), { w: W, h: H } = info[0];
let fc = '';
info.forEach((p, i) => {
  fc += `[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p[v${i}];`;
  fc += p.audio ? `[${i}:a]aresample=48000,aformat=channel_layouts=stereo[a${i}];` : `anullsrc=r=48000:cl=stereo,atrim=0:${p.dur}[a${i}];`;
});
if (!fade) fc += info.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${info.length}:v=1:a=1[v][a0];`;
else { let t = 0, lv = 'v0', la = 'a0';
  for (let i = 1; i < info.length; i++) { t += info[i - 1].dur - fade; fc += `[${lv}][v${i}]xfade=transition=fade:duration=${fade}:offset=${t.toFixed(3)}[x${i}];[${la}][a${i}]acrossfade=d=${fade}[y${i}];`; lv = `x${i}`; la = `y${i}`; }
  fc += `[${lv}]null[v];[${la}]anull[a0];`; }
fc += '[a0]loudnorm=I=-14:TP=-1:LRA=11[a]';
const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', ...ins.flatMap(f => ['-i', f]), '-filter_complex', fc, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out], { stdio: 'inherit' });
if (r.status) process.exit(r.status);
console.log(`完成：${out}（${ins.length} 段，${W}×${H}${fade ? `，段间淡化 ${fade} 秒` : ''}）`);
