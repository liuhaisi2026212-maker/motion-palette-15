# 液态流动

## 一眼认出它
颜色像糖浆一样：滴下来、溅开、两团靠近就「粘」在一起（中间拉出一条颈）、扯断时两头回弹；表面有高光和边缘反光，看起来有厚度；转场是一大泼液体漫过屏幕。

## 适合 / 不适合
适合：饮品、美妆、音乐、潮玩、转场包装、logo 演绎。不适合：需要大量文字的讲解。

## 必备元素
1. **融合（metaball）**：两团液体靠近时自动连成一体，有圆润的颈。
2. **立体感**：高光点 + 边缘一圈亮（菲涅尔）+ 暗部，不能是扁平的色块。
3. **甩出去的缓动**：`cubic-bezier(0.22, 1, 0.36, 1)`，液体只会被甩出去，不会匀速走。
4. **跟随的小液滴**：主体动了，小液滴晚 2～3 帧跟上；落地压扁。
5. **拉丝-断裂-回弹**：分开时留一条细颈，断的一瞬间两头各回弹 2～3 帧。
6. **波浪形转场**：液面前沿有 3～5 个错相位的凸起，扫过整屏。

## 配色
- 糖果：底深梅 `#2A0F2E`，液体 橙 `#FF7A2F` → 粉 `#FF3D8B` → 紫 `#9B5CFF`
- 薄荷苏打：底 `#06262B`，液体 `#00E0C6` → `#7CF7A5` → `#E9FF70`

## 技术路线
- **强模型**：WebGL 片元着色器，2D 距离场 metaball（smooth-min 合并多个圆 / 胶囊 / 文字距离场），用距离场的梯度当法线做假 3D 光照。
- **一般模型**：Canvas 的「模糊 + 阈值」近似：先在离屏画白色圆团，`filter: blur(20px)`，再把透明度阈值化（靠近就粘连），最后着色加高光。

```js
// 一般模型版：离屏画模糊的圆，再按 alpha 阈值得到液体轮廓（慢但简单；画在 1/2 分辨率上再放大）
function goo(ctx, blobs, color, W, H) {
  const s = .5, off = goo.c ||= document.createElement('canvas'); off.width = W * s; off.height = H * s; const o = off.getContext('2d', { willReadFrequently: true });
  o.clearRect(0, 0, off.width, off.height); o.filter = `blur(${18 * s}px)`; o.fillStyle = '#fff';
  for (const b of blobs) { o.beginPath(); o.arc(b.x * s, b.y * s, b.r * s, 0, Math.PI * 2); o.fill(); }
  o.filter = 'none'; const d = o.getImageData(0, 0, off.width, off.height), [r, g, bb] = [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)];
  for (let i = 0; i < d.data.length; i += 4) { const a = d.data[i + 3]; const k = Math.min(1, Math.max(0, (a - 110) / 20)); d.data[i] = r; d.data[i + 1] = g; d.data[i + 2] = bb; d.data[i + 3] = k * 255; }
  o.putImageData(d, 0, 0); ctx.drawImage(off, 0, 0, W, H);
}
// 再在每个 blob 的左上方画一个白色小椭圆高光（透明度 0.6），立体感就出来了
```

着色器版的核心（强模型）：

```glsl
float smin(float a, float b, float k) { float h = clamp(.5 + .5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
// d = 所有圆的距离场用 smin 合并；inside = d < 0；法线 n = normalize(vec3(dFdx(d), dFdy(d), .02))；漫反射 + 高光 + 边缘 fresnel
```

## 最小可行做法（一般模型）
1. 深色背景。
2. 3～4 团液体（圆）按甩出曲线移动、靠近、融合（`goo`），融合后整体变大一点。
3. 每团加高光小椭圆 + 一圈稍亮的边。
4. 落地的液滴压扁（`scaleY .6`）再回弹。
5. 品牌名在液体融合完成后用圆体粗字出现，下方滴一滴。

## 进阶做法（强模型）
- 着色器 metaball + 文字距离场：液体直接聚合成文字的形状。
- 液面转场：一条正弦叠加的前沿从左到右扫过，前沿后面是下一场的颜色。
- 渐变着色：按位置在 2～3 个邻近色之间过渡。

## 常见做砸
- 像扁平色块，没有高光和厚度。
- 匀速移动。
- 融合时颈太粗或没有颈（模糊半径和阈值没调好）。

## 配乐
咕嘟声、倒水声、水花、滴答；底下一层低频合成器铺底。
