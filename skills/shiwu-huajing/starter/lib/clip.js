// 把一支现成的 MP4 包成片子对象：别的工具（Remotion、Three.js、HyperFrames、实拍素材）做好的镜头，
// 可以和代码写的片子一起放进 reel() 里拼，转场、配乐照常用。
//
// import { clip } from './lib/clip.js';
// const shot = await clip('shots/卡片飞入.mp4');                         // 用整支，尺寸和时长自动读
// const hero = await clip('shots/开场.mp4', { start: 1.2, duration: 3 }); // 只用其中一段
// export default reel([{ film: hero }, { film: myCanvasFilm, cut: { type: 'pushcut', dur: .4 } }, { film: shot, cut: { type: 'iris', dur: .5 } }]);
//
// 视频要和预览页在同一个本地服务下（放进 starter 目录里），否则浏览器不让读画面。
// fit：'cover' 铺满裁边（默认），'contain' 完整显示、留黑边。片子尺寸以 width/height 为准，默认 1920×1080。
// 每画一帧都会把视频精确跳到那个时刻（prepare），逐帧导出时画面和时间一一对应。声音会原样带进来。
export async function clip(src, { start = 0, duration, width = 1920, height = 1080, fps = 30, fit = 'cover', audio = true } = {}) {
  // 先把整支视频读进内存再放：很多本地服务不支持按段读取，直接用文件地址时浏览器没法跳到指定时刻
  const res = await fetch(src); if (!res.ok) throw new Error(`视频读不了：${src}（${res.status}）`); const bytes = await res.arrayBuffer();
  const v = document.createElement('video'); v.src = URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' })); v.muted = true; v.preload = 'auto'; v.playsInline = true;
  await new Promise((res, rej) => { v.addEventListener('loadeddata', res, { once: true }); v.addEventListener('error', () => rej(new Error(`视频读不了：${src}`)), { once: true }); });
  const dur = duration ?? Math.max(.1, v.duration - start), eps = .001;
  const seek = t => new Promise(res => { const target = Math.min(v.duration - eps, start + t + eps); if (Math.abs(v.currentTime - target) < 1e-4 && v.readyState >= 2) return res();
    v.addEventListener('seeked', () => res(), { once: true }); v.currentTime = target; });
  return {
    width, height, fps, duration: dur,
    async prepare(t) { await seek(Math.max(0, Math.min(t, dur))); },
    draw(ctx) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
      const s = fit === 'contain' ? Math.min(width / v.videoWidth, height / v.videoHeight) : Math.max(width / v.videoWidth, height / v.videoHeight), w = v.videoWidth * s, h = v.videoHeight * s;
      ctx.drawImage(v, (width - w) / 2, (height - h) / 2, w, h);
    },
    async audio() {   // 解出视频里的声音（48kHz 立体声），截出用到的那一段；没有声音就返回静音
      const n = Math.ceil(dur * 48000), left = new Float32Array(n), right = new Float32Array(n);
      if (audio) try { const ab = await new OfflineAudioContext(2, 48000, 48000).decodeAudioData(bytes.slice(0)), i0 = Math.floor(start * 48000);
        const L = ab.getChannelData(0), R = ab.numberOfChannels > 1 ? ab.getChannelData(1) : L; for (let i = 0; i < n && i0 + i < L.length; i++) { left[i] = L[i0 + i]; right[i] = R[i0 + i]; } } catch { /* 没有音轨 */ }
      return { sampleRate: 48000, left, right };
    },
  };
}
