# 复古霓虹 / VHS

## 一眼认出它
80 年代：紫黑夜空、条纹切开的落日、一张向镜头冲来的霓虹透视网格、线框山、棕榈剪影、铬金大字砸下来、霓虹灯管手写字闪两下亮起；整个画面有录像带扫描线和色偏。

## 适合 / 不适合
适合：复古、夜生活、游戏、音乐、汽车、潮牌、怀旧主题。不适合：清新、自然、严肃。

## 必备元素
1. **透视网格**：一点透视，横线向镜头滚动（越近越快、越疏），竖线汇聚到地平线中点。
2. **条纹落日**：半圆，上黄下粉的渐变，被几条越往下越粗的横条切开。
3. **双层辉光**：霓虹线内层窄而亮（4px）、外层宽而淡（30px）。
4. **铬金字**：多段金属渐变（上冷白 → 天蓝 → 一道深色地平线 → 下暖粉），粗描边，一道星光扫过。
5. **VHS 质感**：扫描线（每 3～4 像素一条 10% 黑线）、红蓝通道各偏 1～2px、偶尔一条横向噪声带滚过、角落「PLAY ▶」字样。
6. **配色**：深紫 `#12002B` → 洋红 → 橙的天空，网格洋红 `#FF2FD0`，点缀青 `#3FF7FF`。

## 字体
铬金字：Archivo Black / 粗斜体压缩字；霓虹手写：Mr Dafoe、Monoton 类；OSD 小字：VT323（像素等宽）。中文：思源黑体 Heavy 斜切 + 铬金渐变。

## 动画语法
- 网格滚动速度恒定（速度感来自近处横线），镜头可以轻微上下晃。
- 铬金字：从 2.4 倍大小 6 帧内砸到 1.0，伴随闪白和镜头光晕。
- 霓虹字：像灯管通电，闪 2～3 下（亮-灭-亮）再稳定。

```js
// 透视网格（地平线 hz，消失点 vx）
function grid(ctx, W, H, hz, t, color = '#FF2FD0') {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.shadowColor = color; ctx.shadowBlur = 12;
  for (let i = -18; i <= 18; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * W * .02, hz); ctx.lineTo(W / 2 + i * W * .16, H * 1.3); ctx.stroke(); }
  const sp = (t * .6) % 1; for (let k = 0; k < 12; k++) { const z = (k + sp) / 10, y = hz + (H * 1.2 - hz) * z * z; ctx.globalAlpha = Math.min(1, .2 + z); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
}
// 条纹落日：先 clip 半圆，填渐变，再用背景色画几条越往下越粗的横条
function sun(ctx, cx, hz, r, bg) { ctx.save(); ctx.beginPath(); ctx.arc(cx, hz, r, Math.PI, 0); ctx.clip(); const g = ctx.createLinearGradient(0, hz - r, 0, hz); g.addColorStop(0, '#FFE66D'); g.addColorStop(1, '#FF3C8E'); ctx.fillStyle = g; ctx.fillRect(cx - r, hz - r, r * 2, r);
  ctx.fillStyle = bg; for (let i = 0; i < 7; i++) { const y = hz - r * .6 * (i / 7), h = (7 - i) * 1.6 + 2; ctx.fillRect(cx - r, y - h, r * 2, h); } ctx.restore(); }
// 扫描线 + 色偏：最后在整幅画面上做
```

## 技术路线
Canvas 2D 完全够（辉光用 `shadowBlur`）。强模型可以用 Three.js 做真 3D 的公路和车。

## 最小可行做法（一般模型）
1. 渐变夜空 + 星星闪 + 条纹落日 + 透视网格（上面两个函数）。
2. 两层线框山（折线 + 辉光）在地平线上。
3. 铬金字砸下来（`fancyText` 改成铬金渐变颜色），砸下那一帧全屏闪白 30%。
4. 霓虹手写副标题闪亮。
5. 全屏扫描线 + 暗角；开头 1 秒「PLAY ▶」+ 噪声带。

## 进阶做法（强模型）
- 真 3D：Three.js 公路、跑车尾灯、路灯杆掠过（速度参照物），后期 bloom。
- VHS 全链：通道分离、横向波浪扭曲、偶尔抽帧卡顿、4:3 圆角遮罩。
- 铬金字的星光扫过：一道斜向白色高光带从左扫到右（用文字做 clip）。

## 常见做砸
- 辉光太多，整个画面糊成一片；车体、字的轮廓看不清。
- 只有渐变没有网格的「运动」，没有速度感。
- 颜色用了绿、蓝紫以外的冷色，就不是 80 年代了。

## 配乐
Synthwave：门限混响军鼓、锯齿波琶音贝斯、厚 pad；铬金字砸下时一个大和弦 + 镲。
