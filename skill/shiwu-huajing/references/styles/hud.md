# 赛博 HUD（科幻界面）

## 一眼认出它
科幻电影里的控制台界面：深青黑底，青色细线框一层层展开，同心圆环带刻度在转，雷达扫描扇区转圈，数字快速乱跳再停在真实值，打字机状态栏，最后锁定框从大收小吸住目标，全屏变橙色警报：「目标锁定」。

## 适合 / 不适合
适合：科技、数据、AI、悬念揭晓、游戏、航天军事科普、产品发布倒计时。不适合：温情、生活化内容。

## 必备元素
1. **线框生长**：所有线条和面板按层级依次「画」出来（描边生长），不是整体淡入。
2. **青 + 橙两种状态**：平时青色 `#00E5FF`，警报 / 锁定时全部切成橙红 `#FF6A00`。
3. **同心圆环 + 刻度**：几层圆环以不同速度、不同方向旋转，有刻度和缺口。
4. **雷达扫描**：一个扇形渐变绕中心转，扫过的地方光点闪一下。
5. **数据动起来**：数字乱跳 3～5 帧再落定、等宽小字打字机、迷你折线图。
6. **锁定框**：四个角括号从 1.4 倍大小快速收到 1.0，吸到目标上。
7. **辉光 + 扫描线 + 轻微色差**统一质感，但要克制，主体始终清楚。

## 配色
底 `#020A0D`→`#062038`，主线 `#00E5FF`，暗线 `#0B7C8C`，面板底 `#0E3A42`（半透明），高亮白 `#E8FEFF`，警报 `#FF6A00` / `#FF2A1F`。

## 字体
等宽：JetBrains Mono / IBM Plex Mono；标题：Rajdhani、Chakra Petch（窄、科技感）；中文：思源黑体 Medium。

## 技术路线
Canvas 2D 足够（强模型可加 Three.js 线框地球 / 无人机全息）。

```js
// 描边生长：用 setLineDash 控制画到多长
function growStroke(ctx, path, len, p) { ctx.save(); ctx.setLineDash([len * p, len]); ctx.stroke(path); ctx.restore(); }
// 带刻度的圆环
function ring(ctx, cx, cy, r, rot, ticks = 60, gap = .15) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.beginPath(); ctx.arc(0, 0, r, gap, Math.PI * 2 - gap); ctx.stroke();
  for (let i = 0; i < ticks; i++) { const a = i / ticks * Math.PI * 2, l = i % 5 ? 6 : 14; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a) * (r - l), Math.sin(a) * (r - l)); ctx.stroke(); } ctx.restore(); }
// 雷达扫描：锥形渐变
function radar(ctx, cx, cy, r, ang) { const g = ctx.createConicGradient(ang, cx, cy); g.addColorStop(0, 'rgba(0,229,255,.45)'); g.addColorStop(.12, 'rgba(0,229,255,0)'); g.addColorStop(1, 'rgba(0,229,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); }
// 数字乱跳再落定
const rolling = (t, t0, target, digits = 4) => t < t0 + .15 ? String(Math.floor(rng(Math.floor(t * 30))() * 10 ** digits)).padStart(digits, '0') : String(target);
// 锁定框四个角
function lockOn(ctx, cx, cy, s, p) { const k = lerp(1.4, 1, E.outExpo(p)), h = s * k / 2, l = s * .2; ctx.beginPath(); for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.moveTo(cx + sx * h, cy + sy * (h - l)); ctx.lineTo(cx + sx * h, cy + sy * h); ctx.lineTo(cx + sx * (h - l), cy + sy * h); } ctx.stroke(); }
```

## 最小可行做法（一般模型）
1. 深色底 + 淡淡的六边形网格或点阵。
2. 中央 3 层刻度圆环（不同速度旋转）+ 雷达扫描。
3. 左右两侧面板：先画出边框（生长），再出现打字机文字和乱跳的数字。
4. 高潮：锁定框吸住中心，全屏颜色从青切到橙，中央大字「目标锁定」+ 英文「LOCKED」。
5. 全局：辉光（`shadowBlur 12`）、扫描线、暗角。

## 进阶做法（强模型）
- Three.js 线框地球，雷达扫到目标时镜头俯冲推近，经纬度坐标显示。
- 面板里的迷你折线图、频谱、候选目标列表（比对百分比滚动，命中的那一条闪烁）。
- 微故障：偶尔 1～2 帧的横向错位、色差加大。

## 常见做砸
- 堆满了线和字，但没有层级、没有焦点。
- 辉光太强、画面过曝。
- 全程同一个颜色状态，没有「锁定」的高潮。
- 字太小糊成一片（等宽小字至少 14px，关键信息 28px 以上）。

## 配乐
Dark synth 脉冲；界面 beep、扫描音、锁定时上升的提示音 + 警报。
