# docs

演示素材和在线观看页，不是 skill 的一部分。

- `index.html`：在线风格速查页（GitHub Pages 从这个文件夹发布）：https://liuhaisi2026212-maker.github.io/motion-palette-15/ 。可按场景筛选、悬停预览、复制点单语。
- `styles.json`：速查页的数据，由 `node docs/sync-styles.mjs` 从每张风格卡开头的速查头生成。改了风格卡就重跑一次，不要手改这个文件。
- 本地预览速查页要用本地服务打开（直接双击 `index.html` 读不到 `styles.json`），比如在仓库根目录运行 `npx serve docs` 或 `python3 -m http.server -d docs`。
- `videos/`：每种风格一支样片（`01.mp4`～`16.mp4`）和 45 秒总览（`00.mp4`，只含前 15 种），压成 720p 供网页播放；原画质在 [Releases](https://github.com/liuhaisi2026212-maker/motion-palette-15/releases)
- `readme/`：仓库首页 README 用的动图预览
