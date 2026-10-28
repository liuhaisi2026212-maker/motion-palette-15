// 风格包目录 + 每种镜头类型的说明（工作台和「给 AI 的提示词」都从这里生成）
import { EXAMPLE as PIXEL } from '../kits/pixel/example.js';
import { EXAMPLE as FLAT } from '../kits/flat/example.js';
import { EXAMPLE as VARIETY } from '../kits/variety/example.js';

export const KITS = [
  { id: 'pixel', name: '像素风', ratio: '16:9', example: PIXEL,
    about: '16 位横版小游戏：小蓝帽主角闯关，天色随剧情从白天走到夜晚。适合「闯关、升级、打怪、通关」这种有过程的主题。',
    top: { stage: 'HUD 上方的关卡名前缀（英文或数字，3~6 个字符，例如 AI）' },
    types: {
      title: { desc: '片头：大标题从天上掉下来', fields: { text: '大标题，2~6 个字最好', sub: '标题下的小字，最多 14 个字', press: '闪烁提示（英文，默认 PRESS START）' } },
      run: { desc: '主角奔跑跳过障碍，顶部飘下一条字幕', fields: { text: '字幕，最多 14 个字', sub: '第二行小字，可空' } },
      dialog: { desc: '老法师和主角对话，对话框逐字打出', fields: { speaker: '说话人名字，最多 5 个字', text: '台词，最多 36 个字' } },
      boss: { desc: '打怪：怪物带血条，主角扔星星把它打爆，然后出字幕', fields: { name: '怪物名字（写成要解决的问题），最多 10 个字', text: '打赢后的字幕，最多 14 个字', sub: '小字，可空' } },
      items: { desc: '主角依次顶砖块，每块弹出一个道具名', fields: { items: '道具名列表，2~4 个，每个最多 4 个字', text: '顶部字幕，可空' } },
      levelup: { desc: '升级：彩色 LEVEL UP 大字 + 能力条', fields: { text: '大字，默认 LEVEL UP!', stats: '能力条，1~3 个，每个写成 ["名字", 0到100的数字]' } },
      chest: { desc: '开宝箱：光芒四射，弹出结论', fields: { text: '结论，最多 12 个字', sub: '补充，最多 16 个字' } },
      ending: { desc: '通关：跳上旗杆、放烟花、大字', fields: { text: '大字，2~5 个字（如：关注我）', sub: '小字，最多 10 个字' } },
    } },
  { id: 'flat', name: '扁平矢量', ratio: '16:9', example: FLAT,
    about: '大色块、弹性动画、扁平图标，一个小方块贯穿全片串起转场。适合讲道理、讲方法、讲对比的知识类内容。',
    top: { palette: '配色：mint 薄荷 / night 夜色 / lemon 柠檬 / forest 森林' },
    types: {
      title: { desc: '片头大标题，逐字弹出', fields: { text: '标题，最多 16 个字，可用【】标出要高亮的词', sub: '副标题，最多 20 个字' } },
      statement: { desc: '一句金句 + 一个大图标', fields: { text: '金句，最多 24 个字，用【】标重点', icon: '图标名（见下方图标列表），可空' } },
      icon: { desc: '一个大图标居中 + 一句话', fields: { icon: '图标名', text: '一句话，最多 16 个字', sub: '小字，可空' } },
      compare: { desc: '左右分屏对比（左边错、右边对）', fields: { text: '顶部标题，可空', left: '{ "icon": 图标, "text": 左边标题最多 10 个字, "sub": 小字 }', right: '同 left' } },
      list: { desc: '2~4 张卡片依次弹出', fields: { text: '标题', items: '卡片列表，每个 { "icon": 图标, "text": 最多 6 个字 }' } },
      steps: { desc: '1→2→3 步骤，线条一路画过去', fields: { text: '标题', items: '步骤列表，2~4 个，每个 { "text": 最多 8 个字, "icon": 可空 }' } },
      number: { desc: '一个大数字从 0 涨上去', fields: { value: '数字（如 3 或 87.5）', unit: '单位（如 倍、%、万）', text: '解释，最多 18 个字' } },
      quote: { desc: '大引号 + 一句话 + 署名', fields: { text: '一句话，最多 30 个字', by: '署名，可空' } },
      outro: { desc: '结尾：大字 + 关注按钮被点击', fields: { text: '大字（如：关注我）', sub: '小字', button: '按钮文字（默认 + 关注）' } },
    } },
  { id: 'variety', name: '综艺花字（竖屏）', ratio: '9:16', portrait: true, example: VARIETY, photos: true,
    about: '抖音综艺剪辑风：彩色立体花字、爆炸框、警示条、仪表盘、印章。可以上传自己的照片当背景（镜头里写 "image": "@1" 用第 1 张）。',
    top: { show: '左上角栏目名，最多 6 个字', ep: '期数，如 EP.01' },
    types: {
      title: { desc: '开场大花字逐字弹出', fields: { text: '大字，最多 12 个字', sub: '黑底小字条，最多 14 个字' } },
      caption: { desc: '底部字幕条，打字机效果', fields: { text: '字幕，最多 20 个字', sub: '黄色小字，可空' } },
      boom: { desc: '爆炸框 + 速度线 + 画面震动（「震惊」「答非所问」这种时刻）', fields: { text: '大字，最多 6 个字', sub: '小字，最多 16 个字' } },
      warn: { desc: '黄黑警示条 + 「前方高能」', fields: { text: '警示字，最多 6 个字' } },
      whisper: { desc: '手写小声吐槽 + 汗滴', fields: { paren: '括号字，默认（小声）', text: '吐槽，最多 16 个字' } },
      vertical: { desc: '竖排大字一个个掉下来（「空气突然安静」）', fields: { text: '2~7 个字', sub: '小字，可空', side: 'left 或 right' } },
      tag: { desc: '人物名牌 + 箭头指向画面', fields: { label: '粉色小标签，最多 5 个字', text: '大名，最多 6 个字', sub: '黄色小字，最多 18 个字' } },
      meter: { desc: '检测仪表，指针甩到爆表', fields: { text: '仪表标题，最多 6 个字', low: '左端字', high: '右端字', boom: '爆表时的大字，最多 6 个字' } },
      stamp: { desc: '红色印章砸下来', fields: { text: '印章字，2~4 个字', sub: '下方小字，可空' } },
      bye: { desc: '结尾：大字 + 关注按钮 + 爱心', fields: { text: '大字，最多 7 个字', sub: '按钮文字' } },
    } },
];
export const ICON_LIST = '灯泡、对话、手机、电脑、火箭、对勾、错、时钟、图表、金币、爱心、目标、齿轮、人、机器人、书、警告、问号、星星、搜索、相机、火（也可以写英文名 bulb chat phone laptop rocket check cross clock chart coin heart target gear person robot book warning question star search camera fire）';

export function promptFor(kit) {
  const types = Object.entries(kit.types).map(([k, v]) => `- ${k}：${v.desc}\n` + Object.entries(v.fields).map(([f, d]) => `    - ${f}：${d}`).join('\n')).join('\n');
  const top = Object.entries(kit.top || {}).map(([k, d]) => `- ${k}：${d}`).join('\n');
  return `你是短视频动画导演。我有一个「${kit.name}」风格的动画工具（${kit.ratio}），它已经做好了各种镜头的画面和动画，你只需要根据我的主题写一份「镜头表」，它就能生成视频。

【这个风格是什么样】
${kit.about}

【我的主题和需求】
（在这里写：这条视频讲什么、给谁看、想让观众记住哪句话、大概多长）

【你要输出的】
只输出一段 JSON，不要解释，不要 Markdown 标题。结构：
{
  "kit": "${kit.id}",
${Object.keys(kit.top || {}).map(k => `  "${k}": ...,`).join('\n')}
  "shots": [ { "type": 镜头类型, "seconds": 秒数, ...这种镜头需要的字段 } ]
}

顶层字段：
${top}

可用的镜头类型（type）和各自的字段：
${types}
${kit.id === 'flat' ? '\n可用的图标：' + ICON_LIST + '\n' : ''}
【写镜头表的要求】
1. 先想故事：开头抛问题或钩子 → 中间讲清楚 → 结尾给结论或引导关注。
2. 一般 6~10 个镜头；每个镜头 2~4 秒，字多的镜头给长一点。总长 15~35 秒。
3. 相邻镜头不要用同一种 type，让画面有变化。
4. 字数一定不能超过上面的限制；说人话，不要标题党，不要错别字。
5. 只能用上面列出的 type 和字段。
${kit.photos ? '6. 如果我说了有照片，镜头里加 "image": "@1"（第 1 张照片）、"@2"……；没说就不要写 image。\n' : ''}
只输出 JSON。

参考示例（换成我的主题，不要照抄内容）：
${JSON.stringify(kit.example, null, 2)}`;
}

// 宽松解析：去掉代码块标记、中文引号、多余逗号
export function parseLoose(text) {
  let s = String(text).replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, ''); const a = s.indexOf('{'), b = s.lastIndexOf('}'); if (a >= 0 && b > a) s = s.slice(a, b + 1);
  try { return [JSON.parse(s), false]; } catch (e) {}
  const f = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/"\s*：/g, '":').replace(/，(\s*")/g, ',$1').replace(/,(\s*[}\]])/g, '$1');
  return [JSON.parse(f), true];
}
// 检查镜头表：不认识的镜头类型、缺字段、秒数离谱，都给出提示（尽量修正，不报死）
export function checkSpec(kit, spec) {
  const warn = []; if (!spec || typeof spec !== 'object') return { spec: kit.example, warn: ['不是一个 JSON 对象，用了示例'] };
  if (!Array.isArray(spec.shots) || !spec.shots.length) return { spec: { ...spec, shots: kit.example.shots }, warn: ['没有 shots，用了示例的镜头'] };
  const types = Object.keys(kit.types);
  spec.shots = spec.shots.slice(0, 16).map((s, i) => { if (!types.includes(s.type)) { warn.push(`第 ${i + 1} 个镜头的类型「${s.type}」不认识，改成 ${types[1]}`); s = { ...s, type: types[1] }; }
    const sec = +s.seconds; if (!(sec >= 1.2 && sec <= 8)) { if (s.seconds != null) warn.push(`第 ${i + 1} 个镜头的秒数 ${s.seconds} 不合理，改成 3`); s = { ...s, seconds: 3 }; } return s; });
  return { spec, warn };
}
