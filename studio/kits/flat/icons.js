// 扁平矢量零件库 · 图标（全部原创，用最简单的几何拼出来：主色 + 半边阴影 + 少量深色细节）
// 每个图标画在以 (0,0) 为中心、边长约 1 的方框里；调用方负责缩放。p = { a 主色, b 辅色, c 第三色, ink 深色, light 浅色, sh 阴影 }
const rr = (x, ctx, X, Y, W, H, R) => { ctx.beginPath(); ctx.roundRect(X, Y, W, H, R); ctx[x](); };
const circ = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
function shadeRight(ctx, draw, sh) { ctx.save(); draw(); ctx.clip(); ctx.fillStyle = sh; ctx.fillRect(0, -1, 1, 2); ctx.restore(); }
export const ICONS = {
  bulb(ctx, p) { ctx.fillStyle = p.b; circ(ctx, 0, -.12, .3); ctx.fillRect(-.13, .08, .26, .14);
    ctx.save(); ctx.beginPath(); ctx.arc(0, -.12, .3, 0, Math.PI * 2); ctx.rect(-.13, .08, .26, .14); ctx.clip(); ctx.fillStyle = p.sh; ctx.fillRect(.02, -.5, .4, 1); ctx.restore();
    ctx.fillStyle = p.ink; rr('fill', ctx, -.14, .23, .28, .07, .03); rr('fill', ctx, -.1, .33, .2, .06, .03);
    ctx.fillStyle = p.light; circ(ctx, -.12, -.22, .05); },
  chat(ctx, p) { ctx.fillStyle = p.a; rr('fill', ctx, -.42, -.32, .84, .52, .14); ctx.beginPath(); ctx.moveTo(-.2, .18); ctx.lineTo(-.28, .38); ctx.lineTo(.02, .18); ctx.fill();
    ctx.fillStyle = p.light; for (let i = 0; i < 3; i++) circ(ctx, -.2 + i * .2, -.06, .055); },
  phone(ctx, p) { ctx.fillStyle = p.ink; rr('fill', ctx, -.24, -.42, .48, .84, .08); ctx.fillStyle = p.a; rr('fill', ctx, -.19, -.34, .38, .62, .04);
    ctx.fillStyle = p.light; rr('fill', ctx, -.13, -.26, .26, .08, .03); rr('fill', ctx, -.13, -.13, .18, .05, .02); rr('fill', ctx, -.13, -.04, .22, .05, .02); circ(ctx, 0, .35, .035); },
  laptop(ctx, p) { ctx.fillStyle = p.ink; rr('fill', ctx, -.38, -.3, .76, .5, .04); ctx.fillStyle = p.a; ctx.fillRect(-.33, -.25, .66, .4);
    ctx.fillStyle = p.light; ctx.fillRect(-.27, -.18, .3, .05); ctx.fillRect(-.27, -.09, .42, .05); ctx.fillStyle = p.ink; rr('fill', ctx, -.48, .2, .96, .08, .04); },
  rocket(ctx, p) { ctx.save(); ctx.rotate(.6); ctx.fillStyle = p.b; ctx.beginPath(); ctx.moveTo(-.1, .2); ctx.lineTo(-.26, .36); ctx.lineTo(-.1, .32); ctx.moveTo(.1, .2); ctx.lineTo(.26, .36); ctx.lineTo(.1, .32); ctx.fill();
    ctx.fillStyle = p.light; ctx.beginPath(); ctx.moveTo(0, -.46); ctx.bezierCurveTo(.2, -.3, .16, .1, .12, .3); ctx.lineTo(-.12, .3); ctx.bezierCurveTo(-.16, .1, -.2, -.3, 0, -.46); ctx.fill();
    ctx.fillStyle = p.sh; ctx.beginPath(); ctx.moveTo(0, -.46); ctx.bezierCurveTo(.2, -.3, .16, .1, .12, .3); ctx.lineTo(0, .3); ctx.fill();
    ctx.fillStyle = p.a; circ(ctx, 0, -.1, .08); ctx.fillStyle = p.c; ctx.beginPath(); ctx.moveTo(-.08, .32); ctx.lineTo(0, .5); ctx.lineTo(.08, .32); ctx.fill(); ctx.restore(); },
  check(ctx, p) { ctx.fillStyle = p.c; circ(ctx, 0, 0, .42); ctx.strokeStyle = p.light; ctx.lineWidth = .1; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-.18, 0); ctx.lineTo(-.04, .14); ctx.lineTo(.2, -.12); ctx.stroke(); },
  cross(ctx, p) { ctx.fillStyle = p.a; circ(ctx, 0, 0, .42); ctx.strokeStyle = p.light; ctx.lineWidth = .1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-.14, -.14); ctx.lineTo(.14, .14); ctx.moveTo(.14, -.14); ctx.lineTo(-.14, .14); ctx.stroke(); },
  clock(ctx, p) { ctx.fillStyle = p.light; circ(ctx, 0, 0, .42); ctx.fillStyle = p.b; circ(ctx, 0, 0, .34); ctx.strokeStyle = p.ink; ctx.lineWidth = .07; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -.2); ctx.moveTo(0, 0); ctx.lineTo(.14, .08); ctx.stroke(); ctx.fillStyle = p.ink; circ(ctx, 0, 0, .04); },
  chart(ctx, p) { const h = [.25, .42, .62]; h.forEach((v, i) => { ctx.fillStyle = [p.b, p.c, p.a][i]; rr('fill', ctx, -.36 + i * .26, .34 - v, .2, v, .04); }); ctx.fillStyle = p.ink; rr('fill', ctx, -.44, .34, .88, .06, .03); },
  coin(ctx, p) { ctx.fillStyle = p.sh; circ(ctx, .03, .03, .4); ctx.fillStyle = p.b; circ(ctx, 0, 0, .4); ctx.fillStyle = p.light; circ(ctx, 0, 0, .3); ctx.fillStyle = p.b; ctx.font = '900 .42px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('¥', 0, .02); },
  heart(ctx, p) { ctx.fillStyle = p.a; ctx.beginPath(); ctx.moveTo(0, .36); ctx.bezierCurveTo(-.5, 0, -.36, -.42, 0, -.18); ctx.bezierCurveTo(.36, -.42, .5, 0, 0, .36); ctx.fill(); ctx.fillStyle = p.light; circ(ctx, -.18, -.12, .05); },
  target(ctx, p) { [[.42, p.a], [.31, p.light], [.2, p.a], [.09, p.light]].forEach(([r, c]) => { ctx.fillStyle = c; circ(ctx, 0, 0, r); }); ctx.strokeStyle = p.ink; ctx.lineWidth = .05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(.36, -.36); ctx.stroke(); ctx.fillStyle = p.b; ctx.beginPath(); ctx.moveTo(.36, -.36); ctx.lineTo(.46, -.3); ctx.lineTo(.3, -.46); ctx.fill(); },
  gear(ctx, p) { ctx.fillStyle = p.b; ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = i % 2 ? .3 : .42; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); ctx.fillStyle = p.light; circ(ctx, 0, 0, .14); },
  person(ctx, p) { ctx.fillStyle = p.ink; circ(ctx, 0, -.2, .17); ctx.fillStyle = p.a; ctx.beginPath(); ctx.arc(0, .42, .36, Math.PI, 0); ctx.fill(); ctx.fillStyle = p.light; circ(ctx, .06, -.22, .03); },
  robot(ctx, p) { ctx.fillStyle = p.ink; ctx.fillRect(-.02, -.46, .04, .12); circ(ctx, 0, -.47, .05); ctx.fillStyle = p.c; rr('fill', ctx, -.34, -.34, .68, .52, .14);
    ctx.fillStyle = p.light; rr('fill', ctx, -.26, -.24, .52, .3, .1); ctx.fillStyle = p.ink; circ(ctx, -.11, -.1, .05); circ(ctx, .11, -.1, .05); ctx.fillStyle = p.c; rr('fill', ctx, -.22, .22, .44, .22, .08); },
  book(ctx, p) { ctx.fillStyle = p.a; rr('fill', ctx, -.4, -.3, .38, .6, .04); ctx.fillStyle = p.b; rr('fill', ctx, .02, -.3, .38, .6, .04); ctx.fillStyle = p.light; for (let i = 0; i < 3; i++) { ctx.fillRect(-.32, -.18 + i * .12, .22, .04); ctx.fillRect(.1, -.18 + i * .12, .22, .04); } },
  warning(ctx, p) { ctx.fillStyle = p.b; ctx.beginPath(); ctx.moveTo(0, -.42); ctx.lineTo(.44, .34); ctx.lineTo(-.44, .34); ctx.closePath(); ctx.fill(); ctx.fillStyle = p.ink; rr('fill', ctx, -.04, -.14, .08, .28, .03); circ(ctx, 0, .23, .045); },
  question(ctx, p) { ctx.fillStyle = p.c; circ(ctx, 0, 0, .42); ctx.fillStyle = p.light; ctx.font = '900 .56px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, .03); },
  star(ctx, p) { ctx.fillStyle = p.b; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .18 : .44; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); },
  search(ctx, p) { ctx.strokeStyle = p.ink; ctx.lineWidth = .1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(.14, .14); ctx.lineTo(.36, .36); ctx.stroke(); ctx.fillStyle = p.light; circ(ctx, -.06, -.06, .27); ctx.lineWidth = .08; ctx.strokeStyle = p.a; ctx.beginPath(); ctx.arc(-.06, -.06, .27, 0, Math.PI * 2); ctx.stroke(); },
  camera(ctx, p) { ctx.fillStyle = p.ink; rr('fill', ctx, -.42, -.24, .84, .52, .1); ctx.fillRect(-.14, -.34, .28, .12); ctx.fillStyle = p.light; circ(ctx, 0, .02, .18); ctx.fillStyle = p.a; circ(ctx, 0, .02, .11); ctx.fillStyle = p.b; circ(ctx, .28, -.12, .04); },
  fire(ctx, p) { ctx.fillStyle = p.a; ctx.beginPath(); ctx.moveTo(0, -.46); ctx.bezierCurveTo(.4, -.1, .36, .4, 0, .42); ctx.bezierCurveTo(-.36, .4, -.4, 0, -.12, -.18); ctx.bezierCurveTo(-.1, -.05, 0, 0, 0, -.46); ctx.fill();
    ctx.fillStyle = p.b; ctx.beginPath(); ctx.moveTo(0, -.05); ctx.bezierCurveTo(.2, .1, .18, .38, 0, .4); ctx.bezierCurveTo(-.18, .38, -.2, .15, 0, -.05); ctx.fill(); },
};
export const ICON_NAMES = Object.keys(ICONS);
// 中文名 → 图标，方便 AI 直接写中文
export const ICON_ALIAS = { 灯泡: 'bulb', 想法: 'bulb', 灵感: 'bulb', 对话: 'chat', 聊天: 'chat', 消息: 'chat', 手机: 'phone', 电脑: 'laptop', 笔记本: 'laptop', 火箭: 'rocket', 增长: 'rocket', 对: 'check', 对勾: 'check', 正确: 'check',
  错: 'cross', 错误: 'cross', 叉: 'cross', 时钟: 'clock', 时间: 'clock', 图表: 'chart', 数据: 'chart', 钱: 'coin', 金币: 'coin', 赚钱: 'coin', 爱心: 'heart', 喜欢: 'heart', 目标: 'target', 靶子: 'target', 齿轮: 'gear', 设置: 'gear', 工具: 'gear',
  人: 'person', 用户: 'person', 机器人: 'robot', AI: 'robot', 书: 'book', 学习: 'book', 警告: 'warning', 注意: 'warning', 问号: 'question', 问题: 'question', 星星: 'star', 星: 'star', 搜索: 'search', 放大镜: 'search', 相机: 'camera', 拍摄: 'camera', 视频: 'camera', 火: 'fire', 爆款: 'fire', 热门: 'fire' };
export const iconOf = n => ICONS[n] ? n : ICON_ALIAS[n] || (ICON_NAMES.find(k => String(n || '').toLowerCase().includes(k)) ?? 'star');
