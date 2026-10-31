// 从每张风格卡头部的速查信息生成观看页用的 docs/styles.json。改了风格卡就跑一次：node docs/sync-styles.mjs
// 风格卡是唯一的数据源，观看页不再手抄。
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), SKILL = path.join(ROOT, 'skills/shiwu-huajing');
const CARDS = path.join(SKILL, 'references/styles'), FILMS = fs.readdirSync(path.join(SKILL, 'examples/films'));
const out = [];
for (const f of fs.readdirSync(CARDS).filter(f => f.endsWith('.md') && !f.startsWith('00') && !f.startsWith('_'))) {
  const src = fs.readFileSync(path.join(CARDS, f), 'utf8').replace(/\r\n?/g, '\n'), m = /^\uFEFF?---\n([\s\S]*?)\n---\n/.exec(src);   // Windows 换行、带 BOM 的文件也认
  if (!m) { console.error(`风格卡缺少速查头：${f}`); process.exitCode = 1; continue; }
  const meta = Object.fromEntries(m[1].split('\n').map(l => { const i = l.indexOf(':'); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
  if (!meta['样片']) { console.warn(`${f} 还没有样片，先不放进速查页（样片做好、填上编号再跑）`); continue; }   // 新写的风格卡可以先没有样片
  const card = f.replace(/\.md$/, ''), pre = [card, card.split('-')[0]].find(p => FILMS.some(d => d.startsWith(p + '-'))), film = pre && FILMS.find(d => d.startsWith(pre + '-'));   // 综艺花字的样片目录是 variety-…，只取前缀
  if (!film) { console.error(`找不到 ${card} 的样片源码目录`); process.exitCode = 1; }
  for (const k of ['风格', '一句话', '适合', '不适合', '场景', '能量', '动效性格', '难度', '画幅', '样片']) if (!meta[k]) { console.error(`${f} 的速查头缺「${k}」`); process.exitCode = 1; }
  out.push({ no: meta['样片'], name: meta['风格'], line: meta['一句话'], fit: meta['适合'], unfit: meta['不适合'], tags: (meta['场景'] || '').split(/\s+/).filter(Boolean),
    energy: meta['能量'], personality: meta['动效性格'], difficulty: meta['难度'], frame: meta['画幅'], card, film, topic: film ? film.slice(pre.length + 1) : '' });
}
out.sort((a, b) => a.no.localeCompare(b.no));
if (process.exitCode) { console.error('速查头有缺漏，没有写 styles.json。补齐上面报的字段再跑。'); process.exit(1); }
if (out.length < 15) { console.error(`只认出 ${out.length} 张风格卡（至少应该有 15 张），没有写 styles.json，免得速查页变空。`); process.exit(1); }
fs.writeFileSync(path.join(ROOT, 'docs/styles.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`已生成 docs/styles.json：${out.length} 种风格`);
