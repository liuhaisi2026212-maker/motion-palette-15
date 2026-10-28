# 来源与许可

## 本 skill 自己写的部分：MIT

`SKILL.md`、`references/`、`starter/`、`examples/` 里的代码和文字是本项目写的，按 MIT 许可（见 `LICENSE`）：可以用、改、商用、再分发，只要保留版权声明和许可文本。

## 致谢：mg-styles-15

15 张风格卡是对照开源项目 **mg-styles-15**（https://github.com/Vincentwei1021/mg-styles-15 ，作者 Vincentwei1021，MIT 许可）的 15 支样片学出来的：我们总结了每种风格的版式、零件、节奏和质感，用自己的话写成卡片，样片的内容（主题、文案、角色、构图、配乐）是重新做的。MIT 许可原文见 `licenses/mg-styles-15.MIT.txt`。

## 参考了这些项目的做法

`references/07-动画手艺进阶.md`、`references/08-单风格与合集.md` 和 `starter/lib/` 里的动画手法、参数，参考了下面这些开源项目公开的经验。我们按自己的理解重写，没有复制它们的代码：

| 项目 | 学了什么 | 许可 |
|---|---|---|
| LottieFiles/motion-design-skill（https://github.com/LottieFiles/motion-design-skill） | 三层动、时长按距离、离场比进场短、反向动作、三分之一规则、动效性格和材质表 | MIT |
| HyperFrames（https://github.com/heygen-com/hyperframes） | 动态模糊的采样方式和适用边界、慢快慢平移、转场即退场、按叙事位置和能量选转场 | Apache-2.0 |
| Remotion（https://github.com/remotion-dev/remotion） | 感知缩放、推切转场的参数、转场与覆盖层分开 | Remotion License |
| Motion Canvas（https://github.com/motion-canvas/motion-canvas） | 7 组弹簧预设的数值（`SPRINGS`）、放大钻入转场的缓动 | MIT |
| Orkas VideoStudio（https://github.com/Orkas-AI/Orkas-VideoStudio） | 幻灯片风险关卡、第一帧当封面、反差 4.5 : 1、音效比画面早 10～20 毫秒 | MIT |

## 第三方文件

| 位置 | 来源 | 许可 |
|---|---|---|
| `examples/assets/fonts/` | Fredoka、霞鹜漫黑、Press Start 2P、站酷快乐体、缝合像素字体 | SIL OFL 1.1，逐个见 `examples/assets/fonts/FONTS.md` |
| `examples/films/collage-漫游周刊/assets/` | mg-styles-15 素材库里的报纸、纸张、鸟、蝴蝶、玫瑰 | CC0 / 公有领域，见同目录 `CREDITS.md` |
| `starter/lib/mp4-muxer.js`、`examples/lib/mp4-muxer.js` | mp4-muxer（Vanilagy） | MIT，见同目录 `mp4-muxer.LICENSE` |
| `examples/films/3d-render-泡芙工作室/` 运行时从 CDN 加载 | three.js 0.170.0 | MIT（不随包分发） |
| `starter/` 可选依赖 | puppeteer-core（只在本地截帧时用，`npm install` 才会装） | Apache-2.0（不随包分发） |

配乐和音效都是 `starter/lib/core.js` 里的合成器用代码现场生成的，没有用任何录音或现成曲子。

## 用它做出来的片子

本 skill 不对你做出来的片子主张任何权利。版权、字体、素材、商标和平台规则怎么注意，见 `references/06-版权与素材.md`。
