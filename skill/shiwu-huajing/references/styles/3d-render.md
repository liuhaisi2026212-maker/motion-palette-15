# 3D 质感（软胶 / 玻璃 / 金属）

## 一眼认出它
像 C4D、Blender 渲染的产品片：糖果色软胶、磨砂玻璃、镀铬金属；柔和的棚拍光、浅景深；东西掉下来会软软地弹、互相挤开；一大片克隆出来的小球或胶囊像波浪一样起伏。

## 适合 / 不适合
适合：高端产品、品牌 ident、logo 演绎。不适合：信息讲解（字少）。

## 最容易做成「不像」的原因（先看这个）
做成了平面的圆和字——不像。对照原版，味道来自：
1. **软萌材质**：充气感的粗圆字（粉色、光滑、大高光）、一颗镜面金属球、满地铺着的小圆珠（像豆袋/抱枕面），被球滚过的地方会凹下去、起波浪。
2. **柔光**：粉紫色的环境光，阴影很软，没有硬边。
3. **物理感**：字和球落下会弹、会挤压，小珠子跟着起伏。
Canvas 2D 做法：每个小珠子用径向渐变画（左上亮、右下暗），按 `sin(距离 - 时间)` 起伏；字用多层偏移 + 高光叠出体积。强模型用 Three.js。

## 必备元素
1. **真实材质**：至少两种——软胶（次表面散射，边缘透亮）、光滑塑料、玻璃或金属。
2. **柔光**：大面积柔光 + 环境光遮蔽（物体接触处有柔和暗影）。
3. **浅景深**：焦点外的东西虚掉。
4. **克隆阵列**：一大片重复的小物体，被一个「波」推着起伏。
5. **物理感运动**：掉落、挤压、回弹、碰撞让周围的东西让开；运动用长尾缓动（前 20% 时间走 80% 的路）。
6. **24fps + 运动模糊**。

## 配色
- 糖果粉：背景 `#F6D5DC`，软胶 `#FF7AA2`、桃 `#FFB38A`，奶油 `#FFF1E0`，点缀铬银
- 薰衣草：背景 `#DCD6F7`，软胶 `#A78BFA`、`#F9A8D4`，白 `#FFFFFF`

## 技术路线
- **强模型**：Three.js（`MeshPhysicalMaterial`：`transmission`、`roughness`、`clearcoat`、`sheen`）+ `RoomEnvironment` 环境光 + 后期景深；或 Blender 命令行渲染序列帧（需要用户装 Blender）。
- **一般模型**：做不出真 3D，用 **2.5D 近似**：每个物体用径向渐变画出球体 / 胶囊（亮面、暗面、高光点、边缘透亮），落地阴影用模糊椭圆，背景虚化用 `ctx.filter = 'blur(8px)'` 画远处物体。

```js
// 2.5D 软胶球：底色 + 暗部 + 边缘透亮 + 高光
function softBall(ctx, x, y, r, base) {
  const g = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
  g.addColorStop(0, shade(base, .45)); g.addColorStop(.55, base); g.addColorStop(.92, shade(base, -.25)); g.addColorStop(1, shade(base, .15));   // 最外圈略亮=透光
  circle(ctx, x, y, r, g);
  ctx.save(); ctx.globalAlpha = .75; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x - r * .35, y - r * .45, r * .22, r * .12, -.6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
// 接触阴影：离地越高越淡越大
function contactShadow(ctx, x, groundY, r, height) { ctx.save(); ctx.filter = `blur(${8 + height * .05}px)`; ctx.globalAlpha = .35 / (1 + height / 200); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, groundY, r * (1 + height / 400), r * .22, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
```

## 最小可行做法（一般模型）
1. 浅色背景 + 地面（底部稍深的渐变）。
2. 一排 30～60 个小软胶球（`softBall`），高度按 `sin(x * 0.02 - t * 3)` 起伏（克隆波浪）。
3. 主角（大球或胶囊做成的字母形）从上面掉下来：下落加速、落地挤压拉伸 20%、回弹 2～3 次；落点附近的小球被压下去再弹起（高度再减一个以落点为中心向外扩散的波）。
4. 远处一层小球用 `blur` 虚化，制造景深。

## 进阶做法（强模型）
- Three.js：`InstancedMesh` 做几百个胶囊，顶点动画做波浪；主角用 `TextGeometry` + bevel 做成「充气字」，用弹簧做落地变形（`scale.y` / `scale.xz`）。
- 物理可以预先算好（离线跑简单的弹簧质点），存成每帧数据，渲染时按 t 读取——保持确定性。
- 配一层 Canvas 叠文字和颗粒。

## 常见做砸
- 材质像塑料玩具：高光太硬、没有边缘透光、没有环境光遮蔽。
- 运动匀速、没有重量感。
- 画面太满，没有浅景深的层次。

## 配乐
ASMR 式的满足感音效：软软的咚、挤压声、气泡 pop；空气感的电影 pad 铺底。

## 样片源码
`examples/films/3d-render-泡芙工作室/film.js`：按这张卡做的一支完整短片（内容原创），可以对照着看手法。
