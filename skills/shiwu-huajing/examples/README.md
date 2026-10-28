# 参考作品（学手法，不要照抄内容）

这里是三套完整写好的风格零件库，用来看「一种风格落到代码里具体长什么样」：

| 文件夹 | 风格 | 看点 |
|---|---|---|
| `kits/pixel/` | 像素风 | 小画布整数放大、原创精灵字符画（`sprites.js`）、抖动天空、视差卷轴、像素中文阈值化、8-bit 配乐合成 |
| `kits/flat/` | 扁平矢量 | 9 种镜头（标题、金句、图标、对比、清单、步骤……）、平衡换行、图标与底色对比、方块转场 |
| `kits/variety/` | 综艺花字（竖屏） | 10 种花字镜头、多层描边、震屏放大、照片当背景、抖音安全区 |

每个文件夹里：`kit.js` 是画法，`example.js` 是一份示例镜头表（主题是「为什么大多数人用不好 AI」）。

## 怎么看

双击 `启动例子.command`（Mac）或 `启动例子.bat`（Windows），浏览器会打开工作台，可以预览、改镜头表、导出 MP4。需要装 Node.js 或 Python。

## 怎么用（给 AI 看的）

- **学**：缓动参数、错峰节奏、描边层次、配色怎么挑、转场怎么接、音效怎么卡点。
- **不要**：把示例里的文字、角色、栏目名原样搬进用户的片子；也不要只改 `example.js` 的文字就交付——那是套模板，不是做片子。
- 用户的片子请在 `starter/` 里按用户的主题从头写，需要某个画法时再来这里翻。

字体都是可商用开源字体（OFL），授权文件在 `assets/fonts/`。

## 完整短片（`films/`）：15 种风格各一支

对照原版风格语法、内容全部原创的样片源码。每支一个 `film.js`（+ `film.html`），拷进一份 `starter/` 替换同名文件就能预览、导出。

| 文件夹 | 风格卡 | 主题 | 看点 |
|---|---|---|---|
| `films/flat-vector-早一点/` | flat-vector | 早起十分钟 | 完整场景插画、橙点贯穿当转场、2×2 分屏 |
| `films/line-art-山间茶事/` | line-art | 茶 | 一根线不断（自己写的曲线采样）、笔头发光、圆形标志 |
| `films/isometric-一亩田/` | isometric | 农场数据 | 等轴沙盘、白模长出来再从中心染色、数据卡引线、拉远出立体字 |
| `films/3d-render-泡芙工作室/` | 3d-render | 软糖品牌 | Three.js：管子拼的充气字、满地圆珠波纹、软阴影（CDN 加载） |
| `films/cel-boil-米米手作/` | cel-boil | 饭团手作 | 每 2 帧抖动、扇贝边标牌、字一个个写出、红笔批注 |
| `films/collage-漫游周刊/` | collage | 旅行杂志 | 代码画相机再转网点剪报、沿虚线剪开、CC0 素材拼贴、撕纸转场 |
| `films/liquid-啵啵果饮/` | liquid | 果饮 | 元球场 + 用梯度当法线打光、果冻字、地面倒影 |
| `films/morph-nova/` | morph | 极简品牌 | 所有零件 = 粗描边中心线，逐点插值形变、拖影、彩色轨道 |
| `films/synthwave-深夜电台/` | synthwave | 电台 | VHS 外壳、条纹落日、霓虹网格、铬金属字 + 霓虹签名 |
| `films/aurora-glass-Muse/` | aurora-glass | AI 笔记 App | 真界面玻璃卡、景深分层、液态玻璃胶囊放大 |
| `films/sticker-explainer-奶茶多少糖/` | sticker-explainer | 科普 | 超粗标题 + 红底线、贴纸、镜头平移、画中画结论页 |
| `films/pixel-厨房闯关记/` | pixel | 学做饭 | 只写镜头表，用 `kits/pixel` 零件库渲染（`index.html` 直接打开） |
| `films/hud-寻猫雷达/` | hud | 找猫 | 满屏 HUD 版式、锁定戏、辉光故障 |
| `films/bauhaus-形意周/` | bauhaus | 设计周 | 出血大几何、印刷外框、图案爆发 |
| `films/variety-周一早上/` | variety-captions | 打工人 | 贴纸主体、栏目牌、名牌、仪表、相框 + 印章 |

用到开源字体的几支（cel-boil、variety）：把 `examples/assets/fonts/` 里的 `ZCOOLKuaiLe-Regular.ttf`、`LXGWMarkerGothic-Regular.ttf` 拷进 `starter/fonts/`。拼贴那支要连 `assets/` 一起拷。
