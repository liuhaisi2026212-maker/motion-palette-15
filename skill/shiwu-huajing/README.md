# 十五画境 shiwu-huajing

一本给 AI 看的「用代码做 MG 动画短片」手艺书：15 种动态设计风格各自的门道、通用的节奏和排版手艺、踩坑清单、自查清单，外加一套能逐帧渲染、直接导出 MP4（带配乐）的脚手架。

不是模板库：AI 读完后按你的主题自己写画面代码，每次做出来都是新的片子。模型越强做得越好，一般的模型照着「一般模型怎么做」走，也能做到像样。

## 安装

把整个 `shiwu-huajing` 文件夹拷到你的 Agent 的技能目录：

- Claude Code：`~/.claude/skills/shiwu-huajing/`
- Codex：`~/.codex/skills/shiwu-huajing/`
- 其他支持 Skill / 规则文件的 Agent（Cursor、Trae、国产 Agent 等）：放进项目里，让它先读 `SKILL.md`。
- 只能聊天的平台（豆包、DeepSeek、Kimi 网页版等）：把 `SKILL.md`、`references/05-一般模型怎么做.md`、你要的那张风格卡（`references/styles/xxx.md`）一起上传或粘贴，再说你的主题。它会给你写出代码，你把代码放进 `starter/` 打开预览和导出。

然后直接说：「用十五画境做一个 15 秒的像素风片头，主题是……」

## 自己预览和导出

1. 双击 `starter/启动.command`（Mac）或 `starter/启动.bat`（Windows），浏览器打开预览页，点「导出 MP4」。需要 Chrome / Edge，以及 Node.js 或 Python 其中一个。
2. 想用命令行批量抽帧、渲染：在 `starter/` 里运行 `npm install`，然后 `npm run sheet`（出一张缩略图总览）、`npm run render`（需要 ffmpeg）。

## 目录

- `SKILL.md`：入口，流程和文件地图
- `references/`：通用手艺、渲染导出、踩坑、自查、一般模型做法
- `references/styles/`：15 张风格门道卡 + 选风格索引
- `starter/`：脚手架（改 `film.js` 就是做片子）
- `examples/films/`：15 种风格各一支完整样片的源码（内容原创，学手法用）
- `examples/kits/`：像素、扁平、综艺花字三套零件库
- `LICENSE`、`NOTICE.md`、`licenses/`：许可和来源

## 底线

学风格、学手法，不照搬别人的片子；字体、图片、音乐只用可商用的；导出失败就如实说。版权和素材的细则见 `references/06-版权与素材.md`。

## 许可

MIT（见 `LICENSE`）。风格卡对照开源项目 [mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15)（MIT）学习写成；自带字体为 SIL OFL 1.1，拼贴样片图片为 CC0。来源逐项列在 `NOTICE.md`。
