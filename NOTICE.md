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
| d3、topojson-client | `legacy/v0.3-模板版/vendor/` | ISC |
| opentype.js、simplex-noise | `legacy/v0.3-模板版/vendor/` | MIT |
| hanzi-writer-data（源自 Make Me a Hanzi） | `legacy/v0.3-模板版/demos/05-cel-boil/assets/hanzi-medians.json` | Arphic Public License，附原文 |
| puppeteer-core | 只在 `npm install` 后出现，不在仓库里 | Apache-2.0 |

## 4. 免责

本仓库按「原样」提供，不提供任何担保（见 `LICENSE`）。仓库中的版权说明是整理来源用的，不构成法律意见。用本项目做视频时的版权注意事项见 `skills/shiwu-huajing/references/06-版权与素材.md`。
