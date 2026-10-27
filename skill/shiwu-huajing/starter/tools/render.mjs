// 命令行逐帧导出 MP4（需要 ffmpeg）。用法：node tools/render.mjs [输出文件，默认 out/film.mp4]
import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process'; import { openFilm, ROOT } from './_page.mjs';
const outFile = path.resolve(process.argv[2] || path.join(ROOT, 'out', 'film.mp4')); fs.mkdirSync(path.dirname(outFile), { recursive: true });
const { pg, demo, close } = await openFilm(); const N = Math.round(demo.duration * demo.fps);
// 配乐：调用 film.audio() 写成 wav
let wav = null; const a = await pg.evaluate(async () => { if (!window.MP_AUDIO) return null; const a = await window.MP_AUDIO(); const n = a.left.length, b = new Int16Array(n * 2); for (let i = 0; i < n; i++) { b[i * 2] = Math.max(-1, Math.min(1, a.left[i])) * 32767; b[i * 2 + 1] = Math.max(-1, Math.min(1, a.right[i])) * 32767; }
  let s = ''; const u = new Uint8Array(b.buffer); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return { sr: a.sampleRate, pcm: btoa(s) }; });
if (a) { const pcm = Buffer.from(a.pcm, 'base64'), h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(a.sr, 24); h.writeUInt32LE(a.sr * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  wav = path.join(path.dirname(outFile), '_audio.wav'); fs.writeFileSync(wav, Buffer.concat([h, pcm])); }
const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(demo.fps), '-i', '-', ...(wav ? ['-i', wav, '-c:a', 'aac', '-b:a', '192k', '-shortest'] : []),
  '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
ff.on('error', () => { console.error('找不到 ffmpeg。没有 ffmpeg 的话，用浏览器打开预览页点「导出 MP4」。'); process.exit(1); });
for (let i = 0; i < N; i++) { const d = await pg.evaluate(async t => { await window.renderAt(t); return document.querySelector('canvas').toDataURL('image/jpeg', .95); }, i / demo.fps);
  if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); if (i % (demo.fps * 2) === 0) console.log(`${i}/${N} 帧`); }
ff.stdin.end(); await new Promise(r => ff.on('close', r)); if (wav) fs.unlinkSync(wav); await close();
console.log(`完成：${outFile}（${demo.width}×${demo.height}，${demo.fps}fps，${N} 帧，${demo.duration.toFixed(2)} 秒${wav ? '，带配乐' : ''}）`);
