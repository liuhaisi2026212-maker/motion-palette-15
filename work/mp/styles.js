// 十五画境 v0.3：风格目录 + 每支片能改什么（给播放页表单、给 AI 提示词共用）
// field 类型：text（单行）、color（#RRGGBB）、list（固定个数的短词）、pairs（固定个数的 [英文, 中文]）、ui（对象，见 keys）
export const STYLES = [
  { id: '01-flat-vector', name: '扁平矢量', en: 'Flat Vector', work: 'popwise「One Dot」', ready: true,
    about: '明亮大色块、弹性缓动、一个小圆点贯穿全片：落地、变太阳、长出城市、跳进四格，最后落在品牌名上。适合品牌片头、产品介绍。',
    fields: [
      { key: 'brand', label: '品牌名', type: 'text', max: 10, tip: '英文最好，含字母 i 时圆点会落在 i 上（原片效果）；中文也行，圆点落在末尾当句号' },
      { key: 'slogan', label: '中文标语', type: 'text', max: 14, tip: '含「点」字会触发原片的「点点变色」彩蛋' },
      { key: 'sloganEn', label: '英文标语', type: 'text', max: 32 },
      { key: 'words', label: '四格小词', type: 'list', n: 4, max: 4, tip: '四个格子依次是：上涨柱子、对勾、爱心、硬币' },
      { key: 'bg', label: '主背景色', type: 'color' }, { key: 'hero', label: '圆点/主角色', type: 'color' },
      { key: 'yellow', label: '辅助色·黄', type: 'color' }, { key: 'mint', label: '辅助色·绿', type: 'color' },
      { key: 'cream', label: '浅色/字色', type: 'color' }, { key: 'ink', label: '深色线条', type: 'color' },
    ],
    example: { brand: 'liuye', slogan: '把AI讲成人话', sloganEn: 'AI IN PLAIN WORDS', words: ['省时', '靠谱', '好玩', '赚钱'],
      bg: '#0E7C66', hero: '#FF7A1A', yellow: '#FFD23F', mint: '#7FD8FF', cream: '#FFF8EC', ink: '#1A1A2E' } },
  { id: '02-line-art', name: '线条动画', en: 'Line Art', work: 'ATELIER LINEA「一笔画」', ready: true,
    about: '深色底上一根发光的线一笔画到底：长出一株植物、画出整座城市的天际线、卷成海浪，最后收成一枚门形徽章，品牌名浮现。适合高级感品牌、设计工作室、地产、文旅。',
    fields: [
      { key: 'brand', label: '品牌名', type: 'text', max: 20, tip: '英文大写最有味道，中文也行' },
      { key: 'tagline', label: '中文标语', type: 'text', max: 8 },
      { key: 'gold', label: '线条/文字色', type: 'color', tip: '原片是香槟金' }, { key: 'bg', label: '底色', type: 'color' },
    ],
    example: { brand: 'LIUYE STUDIO', tagline: '一笔成片', gold: '#9FE3D0', bg: '#101418' } },
  { id: '03-isometric', name: '等轴 2.5D', en: 'Isometric', work: 'ISOPOLIS「让城市自己生长」' },
  { id: '04-3d-render', name: '3D 渲染', en: '3D Render', work: 'soft.「柔软着陆」' },
  { id: '05-cel-boil', name: '逐帧手绘', en: 'Frame-by-Frame', work: '手作 HAND MADE' },
  { id: '06-collage', name: '拼贴剪贴', en: 'Collage', work: 'NOGGIN 脑洞季刊' },
  { id: '07-liquid', name: '液态流动', en: 'Liquid', work: 'drop.「万物始于一滴」' },
  { id: '08-morph', name: '形变动画', en: 'Morph', work: 'morphe.「一形万象」', ready: true,
    about: '一个形状一路变形讲完一天：咖啡杯 → 太阳 → 落日 → 海鸥 → 纸飞机 → 定位针 → 爱心，最后变成品牌名的第一个字母，其余字母飞进来落定。适合讲一个过程、一段旅程。',
    fields: [
      { key: 'brand', label: '品牌名', type: 'text', max: 9, tip: '只能用英文字母和数字（字形是提前算好的）；原片是 morphe' },
      { key: 'words', label: '7 个场景词', type: 'list', n: 7, max: 4, tip: '左下角依次出现，对应：杯子、太阳、落日、海鸥、纸飞机、定位针、爱心' },
      { key: 'en', label: '7 个英文小字', type: 'list', n: 7, max: 14 },
      { key: 'tagline', label: '中文标语', type: 'text', max: 4, tip: '正好 4 个字，中间会放一个红点，前两字和后两字分开' },
      { key: 'taglineEn', label: '英文标语', type: 'text', max: 28 },
      { key: 'cream', label: '纸色/主形状', type: 'color' }, { key: 'ink', label: '深色', type: 'color' }, { key: 'mari', label: '黄', type: 'color' },
      { key: 'verm', label: '红/句点', type: 'color' }, { key: 'ultra', label: '蓝', type: 'color' },
    ],
    example: { brand: 'liuye', words: ['起床', '开工', '灵感', '动手', '剪辑', '发布', '上热门'], en: ['WAKE UP', 'WORK', 'IDEA', 'MAKE', 'EDIT', 'POST', 'TRENDING'],
      tagline: '一念成片', taglineEn: 'ONE THOUGHT · ONE FILM', verm: '#E8473D', ultra: '#0B6E4F', mari: '#FFC93C' } },
  { id: '09-bauhaus', name: '包豪斯', en: 'Bauhaus', work: '二十拍构成 KONSTRUKTION', ready: true,
    about: '红黄蓝几何块按节拍一块块砸进版面，中段翻成满屏卡片阵列，最后拼出一张印刷海报。适合有态度的品牌、展览、栏目片头。',
    fields: [
      { key: 'word', label: '竖排大字', type: 'text', max: 10, tip: '只能用英文字母或数字，4–10 个，会自动转大写' },
      { key: 'caption', label: '三个英文词', type: 'list', n: 3, max: 10, tip: '大字旁边的一行小字，原片是 FORM · FARBE · FUNKTION' },
      { key: 'zh', label: '三个中文词', type: 'list', n: 3, max: 2, tip: '每个两个字，竖排在英文词旁边' },
      { key: 'labels', label: '色块标签', type: 'pairs', n: 3, tip: '黄 / 红 / 蓝三块下面的标签，每组一个英文词 + 一个汉字' },
      { key: 'header', label: '右上角小字', type: 'text', max: 44 }, { key: 'footer', label: '左下角小字', type: 'text', max: 60 },
      { key: 'counter', label: '左上角计数词', type: 'text', max: 8 },
      { key: 'paper', label: '纸色', type: 'color' }, { key: 'yellow', label: '黄油墨', type: 'color' }, { key: 'red', label: '红油墨', type: 'color' },
      { key: 'blue', label: '蓝油墨', type: 'color' }, { key: 'black', label: '黑油墨', type: 'color' },
    ],
    example: { word: 'LIUYE', caption: ['THINK', 'MAKE', 'SHARE'], zh: ['思考', '动手', '分享'], labels: [['IDEA', '想'], ['DO', '做'], ['SHOW', '秀']],
      header: '把 AI 讲成人话 · 第 09 期', footer: 'LIUYE STUDIO · 10 SECONDS · 20 BEATS', counter: 'BEAT', blue: '#0B6E4F' } },
  { id: '10-synthwave', name: '复古 Synthwave', en: 'Synthwave', work: 'NEON DRIVE「霓虹夜驰 1986」', ready: true,
    about: '80 年代录像带开场：PLAY 键、霓虹网格公路、跑车冲向落日，铬金大字砸下来，霓虹手写字一笔写出，最后 STOP。适合复古、夜生活、音乐、汽车、游戏主题。',
    fields: [
      { key: 'title', label: '铬金大字', type: 'text', max: 10, tip: '英文 4–10 个字母或中文 2–4 个字（中文会用原片的中文铬字排法）' },
      { key: 'script', label: '霓虹手写字', type: 'text', max: 10, tip: '只能英文，一个词最好看，原片是 Midnight' },
      { key: 'tag', label: '顶部小字', type: 'text', max: 32 },
    ],
    example: { title: '柳爷夜驰', script: 'Liuye', tag: 'SUMMER 2026  ·  把 AI 讲成人话' } },
  { id: '12-aurora-glass', name: '弥散玻璃', en: 'Aurora Glass', work: 'Aurora「思考，自有光」', ready: true,
    about: '流动的极光光斑上叠着几张磨砂玻璃卡片，演一段 AI 助手对话，最后卡片散开，玻璃镜头变成品牌名的一部分。适合 AI 产品、App、科技品牌。',
    fields: [
      { key: 'brand', label: '品牌名', type: 'text', max: 8, tip: '英文：玻璃镜头会变成名字里的字母 o（没有 o 就挂在末尾）；中文：做成磨砂玻璃字 + 玻璃句号' },
      { key: 'tagline', label: '英文标语', type: 'text', max: 28 }, { key: 'taglineCn', label: '中文标语', type: 'text', max: 10 },
      { key: 'ui', label: '卡片里的文字', type: 'ui', keys: [
        ['name', '助手名字', 6], ['ask', '用户提问', 18], ['reply', '助手回答（4 行）', 14, 4], ['chips', '两个按钮', 8, 2],
        ['now', '时间标记', 4], ['thinking', '思考中', 6], ['listening', '语音卡片标题', 6], ['caption', '语音字幕', 12],
        ['focus', '开关标题', 6], ['focusSub', '开关说明', 12], ['glow', '滑块标题', 6]] },
      { key: 'base', label: '底色', type: 'color' }, { key: 'violet', label: '光斑 1', type: 'color' }, { key: 'magenta', label: '光斑 2', type: 'color' },
      { key: 'cyan', label: '光斑 3', type: 'color' }, { key: 'blue', label: '光斑 4', type: 'color' }, { key: 'indigo', label: '光斑 5', type: 'color' },
      { key: 'periwinkle', label: '光斑 6', type: 'color' },
    ],
    example: { brand: '柳爷AI', tagline: 'Think less, do more.', taglineCn: '把AI讲成人话',
      ui: { name: '小柳', now: '刚刚', thinking: '思考中', ask: '帮我写一条抖音口播开头', reply: ['先抛一个反常识的问题，', '再给一个具体的数字，', '最后一句留个钩子。', '三秒内让人停下来。'],
        chips: ['存成草稿', '明早提醒我'], listening: '聆听中', caption: '“……这条能火”', focus: '专注模式', focusSub: '只接收重要消息', glow: '光晕' },
      base: '#120408', violet: '#FF6A3D', magenta: '#FF3D9A', cyan: '#FFC93C', blue: '#E8473D', indigo: '#7A1F3D', periwinkle: '#FFB38C' } },
  { id: '18-hanazi', name: '综艺花字', en: 'Variety Captions', work: '喵呜日记 EP.07 · 竖屏', portrait: true },
  { id: '19-paperclip', name: '贴纸人科普', en: 'Sticker Explainer', work: '一部手机里，藏着多少种元素？' },
  { id: '20-pixel', name: '像素风', en: 'Pixel Art', work: 'PIXEL QUEST 像素冒险', ready: true,
    about: '16 位横版小游戏：小勇士跑跳过桥、天色从白天变黄昏、宝箱开口说话、发光拿到宝物，最后大标题砸下来。适合游戏化的栏目、活动、闯关主题。',
    fields: [
      { key: 'title', label: '大标题', type: 'text', max: 6, tip: '中文 2–5 个字最好看；英文也行，会用像素字体放大成 logo' },
      { key: 'ribbon', label: '彩带小字', type: 'text', max: 6 },
      { key: 'speaker', label: '说话人', type: 'text', max: 4, tip: '对话框上面的名牌，原片是「神秘宝箱」' },
      { key: 'line', label: '台词', type: 'text', max: 10 },
      { key: 'press', label: '开始提示', type: 'text', max: 14, tip: '只能英文，原片是 PRESS START' },
      { key: 'score', label: '计分词', type: 'text', max: 6, tip: '只能英文，左上角，原片是 SCORE' },
    ],
    example: { title: '柳爷闯关', ribbon: '第一关', speaker: 'AI精灵', line: '把AI讲成人话！', press: 'TAP TO START', score: 'LIKES' } },
  { id: '22-hud', name: '赛博 HUD', en: 'Cyber HUD', work: '隼眼-9 · 目标锁定' },
];

// 把用户或 AI 给的配置按字段规则收拾干净：去掉不认识的键、截断超长、颜色不合法就丢掉
export function cleanCfg(style, raw) {
  const out = {}, warn = [];
  if (!raw || typeof raw !== 'object') return { cfg: out, warn: ['配置不是一个 JSON 对象'] };
  const cut = (s, n, label) => { s = String(s ?? ''); const a = [...s]; if (n && a.length > n) { warn.push(`「${label}」超过 ${n} 个字，已截断`); return a.slice(0, n).join(''); } return s; };
  for (const f of style.fields || []) {
    const v = raw[f.key]; if (v == null || v === '') continue;
    if (f.type === 'text') out[f.key] = cut(v, f.max, f.label);
    else if (f.type === 'color') { const s = String(v).trim(); if (/^#?[0-9a-fA-F]{6}$/.test(s)) out[f.key] = (s[0] === '#' ? s : '#' + s).toUpperCase(); else warn.push(`「${f.label}」${s} 不是 #RRGGBB 颜色，已忽略`); }
    else if (f.type === 'list') { const a = Array.isArray(v) ? v : String(v).split(/[,，、\s]+/); if (a.length !== f.n) warn.push(`「${f.label}」需要 ${f.n} 个，收到 ${a.length} 个`); out[f.key] = Array.from({ length: f.n }, (_, i) => cut(a[i] ?? '', f.max, f.label)); }
    else if (f.type === 'pairs') { const a = Array.isArray(v) ? v : []; out[f.key] = Array.from({ length: f.n }, (_, i) => { const p = Array.isArray(a[i]) ? a[i] : [a[i] ?? '', '']; return [cut(p[0], 8, f.label), cut(p[1], 1, f.label)]; }); }
    else if (f.type === 'ui') { const o = {}; for (const [k, lab, mx, n] of f.keys) { const x = v[k]; if (x == null) continue;
      o[k] = n ? Array.from({ length: n }, (_, i) => cut((Array.isArray(x) ? x : [x])[i] ?? '', mx, lab)) : cut(x, mx, lab); } out[f.key] = o; }
  }
  const known = new Set((style.fields || []).map(f => f.key)); for (const k in raw) if (!known.has(k)) warn.push(`不认识的字段「${k}」，已忽略`);
  return { cfg: out, warn };
}

// 弱模型也能看懂的提示词：只让它写这一支片的配置
export function promptFor(style) {
  const lines = (style.fields || []).map(f => {
    const lim = f.type === 'text' ? `，最多 ${f.max} 个字` : f.type === 'list' ? `，正好 ${f.n} 个，每个最多 ${f.max} 个字` : f.type === 'pairs' ? `，正好 ${f.n} 组，每组 [英文词, 一个汉字]` : f.type === 'color' ? '，写 #RRGGBB 颜色' : '';
    const sub = f.type === 'ui' ? '\n' + f.keys.map(([k, lab, mx, n]) => `    - ${k}：${lab}${n ? `，正好 ${n} 条` : ''}，每条最多 ${mx} 个字`).join('\n') : '';
    return `- ${f.key}：${f.label}${lim}${f.tip ? `（${f.tip}）` : ''}${sub}`; }).join('\n');
  return `你是品牌短片文案和配色设计师。我有一支做好的 10 秒「${style.name}」风格动画（原片：${style.work}），画面和动作都是固定的，你只需要帮我写一份配置，替换片子里的文字和颜色。

【这支片是什么样】
${style.about}

【我的需求】
（在这里写：品牌或栏目叫什么、想表达什么、想要什么颜色感觉）

【你要输出的】
只输出一段 JSON，不要解释，不要 Markdown 标题。可以写的字段如下，没把握的字段就不写（会用原片的值）：
${lines}

【要求】
1. 文字要短，说人话，不要标题党，不要错别字，中文标点用全角。
2. 字数一定不能超过上面的限制，超了画面会挤。
3. 颜色要一套搭配好的：深浅要有对比，字要看得清。
4. 只输出 JSON。

参考示例：
${JSON.stringify(style.example, null, 2)}`;
}
