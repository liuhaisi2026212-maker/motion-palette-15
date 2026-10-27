# 十五画境 · Motion Palette 15（v0.3）

15 种 MG 动画风格的**模板版** skill。每种风格是一支做好的 10 秒高质量短片（来自开源项目 [mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15)，MIT），文字和配色抽成了配置。用任何 AI（包括豆包、DeepSeek）写一份配置，或者直接在网页表单里填，就能导出带配乐的 MP4。

**现状：15 支里 14 支可用**（04 3D 渲染要 Blender，暂不支持）。详见 [进度记录.md](进度记录.md)。

## 下载即用

到本仓库的 Releases 下载 `motion-palette-15-v0.3.zip`，解压后看里面的 `使用说明.md`：双击 `启动工作台`，选风格、改字、导出。

## 目录

- `work/`：开发目录（就是打包前的 skill 本体）
  - `index.html`：工作台
  - `mp/styles.js`：每种风格能改哪些字段（表单和给 AI 的提示词都从这里生成）
  - `mp/server.mjs`：本地服务（含无头 Chrome 逐帧截图）
  - `demos/<风格>/`：每支片的源码，`*.orig.*` 是改之前的原版
  - `SKILL.md`：给 AI 看的使用规则
- `打包.py`：生成 `dist/motion-palette-15-v0.3.zip`
- `进度记录.md`：做到哪一步、已知问题、日志

原片版权与许可见 `work/LICENSE`、`work/CREDITS.md`。
