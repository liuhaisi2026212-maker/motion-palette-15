// 通用色板：风格卡里没有的风格、几种风格混用、或者要统一 Canvas 段和 Remotion 镜头的颜色时，从这里挑一套起步。
// 用了某张风格卡就用那张卡自己的配色，不用这里的。
// 每套都给齐：bg 底色（上→下渐变两色）、surface 卡片面、line 细线、text 正文、sub 次要字、accent 主强调、accent2 副强调。
// 有品牌色时：look('midnight', { accent: '#品牌色' })，只换强调色，其他不动。
// 正文字和底色的对比都在 7:1 以上，次要字在 4.5:1 以上；改了颜色跑一次 node tools/check.mjs 看反差。
// 亮底色板（paper、porcelain、candy）的强调色是给色块、线条用的，直接拿来写小字不够清楚：小字用 text，强调色块上写字用白色或 text。
export const LOOKS = {
  midnight: { dark: true, bg: ['#0B1222', '#05080F'], surface: '#131D33', line: '#2A3A5C', text: '#EAF1FF', sub: '#8FA3C7', accent: '#4D7CFF', accent2: '#3DE0D0', use: '科技、AI、数据、发布会：冷静的电光蓝' },
  aurora:   { dark: true, bg: ['#0E0B1F', '#060510'], surface: '#1A1533', line: '#3A2F66', text: '#F1ECFF', sub: '#A79CC9', accent: '#9B6BFF', accent2: '#3DDCB4', use: 'AI 产品、创意工具：紫绿极光' },
  ember:    { dark: true, bg: ['#160C08', '#0A0504'], surface: '#24140E', line: '#4A2A1C', text: '#FFF1E8', sub: '#C4A090', accent: '#FF6A2B', accent2: '#FFC23D', use: '冲击力、运动、燃：暗底橙红' },
  graphite: { dark: true, bg: ['#141416', '#0A0A0B'], surface: '#1E1E21', line: '#36363B', text: '#F4F4F5', sub: '#9A9AA2', accent: '#E8E8EA', accent2: '#FF4D4D', use: '高级、克制、硬件：黑白灰加一点红' },
  lime:     { dark: true, bg: ['#0C120A', '#060904'], surface: '#162012', line: '#2C3D24', text: '#F2FFE9', sub: '#9DB88E', accent: '#B6FF3D', accent2: '#3DD9FF', use: '开发者工具、终端感、年轻潮流：荧光绿' },
  paper:    { dark: false, bg: ['#F4EFE6', '#ECE5D8'], surface: '#FFFDF8', line: '#D6CCBA', text: '#1F1A14', sub: '#6B6152', accent: '#D9472B', accent2: '#2B5BD9', use: '知识讲解、手作、杂志感：米纸底红蓝' },
  porcelain:{ dark: false, bg: ['#F7F8FA', '#ECEFF4'], surface: '#FFFFFF', line: '#D5DBE5', text: '#111827', sub: '#5B6474', accent: '#2563EB', accent2: '#10B981', use: '产品介绍、SaaS、干净明亮' },
  candy:    { dark: false, bg: ['#FFF0F5', '#FCE4EE'], surface: '#FFFFFF', line: '#F2C6D6', text: '#2A1020', sub: '#7A5466', accent: '#FF4F8B', accent2: '#FFB02E', use: '可爱、消费品、轻松好玩：粉底撞色' },
};

export function look(name, over = {}) {
  const base = LOOKS[name];
  if (!base) throw new Error(`没有叫 ${name} 的色板，可选：${Object.keys(LOOKS).join('、')}`);
  return { name, ...base, ...over };
}

// 铺底：上下渐变，满屏。每段片子 draw 的第一行先铺它，转场时才不会透出上一段
export function paintBg(ctx, L, w = ctx.canvas.width, h = ctx.canvas.height) {
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, L.bg[0]); g.addColorStop(1, L.bg[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}
