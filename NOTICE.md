# 来源与许可（整个仓库）

本仓库自己写的代码、文档和样片按 MIT 许可（见 `LICENSE`）。来自别处的文件保留原来的许可，逐项如下。

## 1. mg-styles-15（上游项目）

- 项目：https://github.com/Vincentwei1021/mg-styles-15
- 作者：Vincentwei1021
- 许可：MIT（原文 `licenses/mg-styles-15.MIT.txt`）。MIT 允许使用、修改、合并、出版、分发、再授权和销售，条件是保留版权声明和许可文本。

我们用到它的地方：

| 位置 | 怎么用的 |
|---|---|
| `legacy/v0.3-模板版/demos/`、`legacy/v0.3-模板版/harness/`、各片 `cues.json` 和配乐 | 模板版（v0.3，历史版本）直接基于原片源码修改：文字和配色抽成配置，改动处标「十五画境」，原文件保留为 `*.orig.*`。配乐从原成片音轨提取。详见 `legacy/v0.3-模板版/CREDITS.md`、`legacy/v0.3-模板版/LICENSE` |
| `skills/shiwu-huajing/references/styles/` | 对照原片总结每种风格的版式、零件、节奏、质感，用自己的话写成风格卡，没有复制原片代码 |
| `skills/shiwu-huajing/examples/films/`、`样片/手艺书版/` | 按风格卡重新做的原创样片：主题、文案、角色、构图、配乐都是新的 |
| `skills/shiwu-huajing/examples/films/collage-漫游周刊/assets/` | 原项目素材库里的 CC0 / 公有领域图片（报纸、纸张、鸟、蝴蝶、玫瑰） |
| `样片/手艺书版/对比-HUD-左原版右我们.jpg` | 左半边是原片截帧，用于对照说明 |

原项目说明中的第三方素材：照片、纸张纹理、HDRI、乐器采样（VCSL）、地图数据（Natural Earth）为 CC0 或公有领域；字形轮廓来自 OFL 字体，仍按 OFL。

## 2. 字体

仓库里只放可以再分发的开源字体，全部为 SIL OFL 1.1（Luckiest Guy 为 Apache-2.0）。OFL 正文见 `licenses/OFL-1.1.txt`。

- `skills/shiwu-huajing/examples/assets/fonts/`：逐个版权见同目录 `FONTS.md`
- `legacy/v0.3-模板版/assets/fonts/` 与各片目录：见 `legacy/v0.3-模板版/CREDITS.md`

阿里巴巴普惠体、HarmonyOS Sans、抖音美好体、阿里妈妈数黑体、资源圆体等厂商字体**不随仓库分发**，缺失时用系统字体代替。

## 3. 代码库

| 库 | 位置 | 许可 |
|---|---|---|
| mp4-muxer（Vanilagy） | `*/lib/mp4-muxer.js`、`legacy/v0.3-模板版/mp/` | MIT，附 `mp4-muxer.LICENSE` |
| three.js | `legacy/v0.3-模板版/vendor/three/`；3D 样片运行时从 CDN 加载 | MIT |
| Remotion、React（`starter/tools/remotion-lock.json` 锁定的版本） | 不随仓库分发，`node tools/remotion.mjs setup` 时才下载 | Remotion License（个人和员工不超过 3 人（含 3 人）的公司免费，更大的公司商用要买许可）；React 为 MIT |
| d3、topojson-client | `legacy/v0.3-模板版/vendor/` | ISC |
| opentype.js、simplex-noise | `legacy/v0.3-模板版/vendor/` | MIT |
| hanzi-writer-data（源自 Make Me a Hanzi） | `legacy/v0.3-模板版/demos/05-cel-boil/assets/hanzi-medians.json` | Arphic Public License，附原文 |
| puppeteer-core | 只在 `npm install` 后出现，不在仓库里 | Apache-2.0 |

## 4. 参考了这些项目的做法

`skills/shiwu-huajing/references/07-动画手艺进阶.md`、`skills/shiwu-huajing/references/08-单风格与合集.md` 和 `skills/shiwu-huajing/starter/lib/` 里的动画手法、参数，参考了下面这些开源项目公开的经验。我们按自己的理解重写，没有复制它们的代码：

| 项目 | 学了什么 | 许可 |
|---|---|---|
| LottieFiles/motion-design-skill（https://github.com/LottieFiles/motion-design-skill） | 三层动、时长按距离、离场比进场短、反向动作、三分之一规则、动效性格和材质表 | MIT |
| HyperFrames（https://github.com/heygen-com/hyperframes） | 动态模糊的采样方式和适用边界、慢快慢平移、转场即退场、按叙事位置和能量选转场 | Apache-2.0 |
| Remotion（https://github.com/remotion-dev/remotion） | 感知缩放、推切转场的参数、转场与覆盖层分开 | Remotion License |
| Motion Canvas（https://github.com/motion-canvas/motion-canvas） | 7 组弹簧预设的数值（`SPRINGS`）、放大钻入转场的缓动 | MIT |
| Orkas VideoStudio（https://github.com/Orkas-AI/Orkas-VideoStudio） | 幻灯片风险关卡、第一帧当封面、反差 4.5 : 1、音效比画面早 10～20 毫秒 | MIT |
| video-shotcraft（https://github.com/Vincentwei1021/video-shotcraft） | 风格卡头部的速查信息、可筛选的在线速查页和复制点单、并排打磨的流程和验收标准、全画面冲击的次数上限；从需求到方案的流程（简报表、两根轴定动效性格、方向静帧、分镜、独立复查）；`starter/tools/remotion.mjs` 的副工程做法（镜头卡不随仓库分发，用时从原仓库下载固定版本） | Apache-2.0 |

## 5. 免责

本仓库按「原样」提供，不提供任何担保（见 `LICENSE`）。仓库中的版权说明是整理来源用的，不构成法律意见。用本项目做视频时的版权注意事项见 `skills/shiwu-huajing/references/06-版权与素材.md`。
