# 来源与许可

## 片子本身

- `demos/`、`harness/`、`cues.json`、各片配乐（`music.m4a`，从原成片音轨提取）来自 **mg-styles-15**（https://github.com/Vincentwei1021/mg-styles-15），MIT 许可，原文见 `LICENSE`。十五画境在其基础上把文字和配色改成可配置，改动处标注了「十五画境」，原文件保留为 `*.orig.*`。
- 原项目说明：片中照片、纸张纹理、HDRI、乐器采样、地图数据（Natural Earth）均为 CC0 或公有领域；字形轮廓取自 OFL 字体，仍按 OFL。

## 十五画境新增的部分

- 工作台（`index.html`、`mp/`）、配置抽取、启动器：MIT。
- `mp/mp4-muxer.js`：mp4-muxer（Vanilagy），MIT，见 `mp/mp4-muxer.LICENSE`。
- `demos/05-cel-boil/assets/hanzi-medians.json`：汉字笔顺中线数据，来自 hanzi-writer-data（源自 Make Me a Hanzi），Arphic Public License，见同目录 `hanzi-medians.ARPHICPL.TXT`。
- `vendor/`：three.js（MIT）、d3（ISC）、topojson-client（ISC）、opentype.js（MIT）、simplex-noise（MIT），许可文本在各自目录。
- `node_modules/`（打包版才有）：puppeteer-core（Apache-2.0）及其依赖，只给本地服务截帧用。

## 字体（均可免费商用、可再分发）

`assets/fonts/` 下：Anton、Archivo、Bebas Neue、Caveat、Chakra Petch、Cormorant Garamond、Fredoka、IBM Plex Mono、Instrument Serif、Inter、JetBrains Mono、Michroma、Poppins、Press Start 2P、Rajdhani、Sora、Unbounded、VT323、Long Cang、ZCOOL KuaiLe —— Google Fonts，SIL OFL 1.1（Luckiest Guy 为 Apache-2.0）；LXGW Marker Gothic（霞鹜）、Fusion Pixel（TakWolf）—— SIL OFL 1.1。

片子自带的静态字重（从 OFL 可变字体切出）：`demos/03-isometric/assets/fonts/Unbounded-800-static.ttf`、`demos/07-liquid/assets/Fraunces-Liquid-72-900-Soft.ttf`、`demos/08-morph/assets/fonts/Outfit-SemiBold.ttf`、`demos/10-synthwave/assets/fonts/MrDafoe-Regular.ttf`，均 OFL。

原片还用到阿里巴巴普惠体、阿里妈妈数黑体、HarmonyOS Sans、抖音美好体、资源圆体等厂商字体，这些不随包分发，缺失时用系统字体代替。

## 使用提醒

用自己的品牌名和文案，不要用别人的商标。片中照片（如综艺花字里的猫）来自原项目的 CC0 / 公有领域素材。
