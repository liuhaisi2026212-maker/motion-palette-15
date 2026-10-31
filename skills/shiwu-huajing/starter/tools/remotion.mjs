// 用 Remotion 单独渲染镜头：video-shotcraft 的 124 张镜头卡大多是 Remotion 写的。渲出来的 MP4 放进 shots/，再用 lib/clip.js 拼进片子。
// 用法（在片子的工程目录里跑）：
//   node tools/remotion.mjs setup              第一次用：建 remotion/ 副工程，下载镜头卡（固定在核对过的版本），装依赖
//   node tools/remotion.mjs add <卡名> [Id]     把一张卡的代码拷进 remotion/src/shots/，并在 Root.tsx 里登记（卡名就是 demos/ 下的文件夹名，比如 fracture）
//   node tools/remotion.mjs render <Id>         渲成 shots/<Id>.mp4
// 卡都是按 1920×1080、30 帧调的：坐标写死了，别改尺寸；片子是 60 帧时照样能放。拷进来以后要按片子换配色、材质和文字，别原样用。
// 需要 git、Node 18+、联网（只在 setup 时）。许可：镜头卡是 Apache-2.0；Remotion 个人和员工不超过 3 人（含 3 人）的公司免费，更大的公司要买许可，见 references/10-工具怎么选.md。
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process'; import os from 'node:os'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), P = process.cwd(), R = path.join(P, 'remotion'), SC = path.join(R, 'shotcraft');
const COMMIT = '1266a3ec4831289c4d893d42dd5102723658039a';   // 镜头卡核对过的版本
const WIN = process.platform === 'win32', NPM = WIN ? 'npm.cmd' : 'npm', NPX = WIN ? 'npx.cmd' : 'npx';
const run = (cmd, args, opt = {}) => { const r = spawnSync(cmd, args, { stdio: 'inherit', shell: WIN, ...opt }); if (r.error || r.status) { console.error(`没跑成：${cmd} ${args.join(' ')}`); process.exit(1); } };
const [cmd, a1, a2] = process.argv.slice(2);
const pascal = s => s.split(/[^a-zA-Z0-9]+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join('');

if (cmd === 'setup') {
  fs.mkdirSync(path.join(R, 'src/shots'), { recursive: true }); fs.mkdirSync(path.join(P, 'shots'), { recursive: true });
  if (!fs.existsSync(SC)) {
    const ok = u => spawnSync('git', ['clone', '-q', u, SC], { stdio: 'inherit' }).status === 0;
    if (!ok('https://github.com/Vincentwei1021/video-shotcraft.git') && !ok('https://atomgit.com/VincentWei/video-shotcraft.git')) { console.error('镜头卡下载失败：检查网络，或者手动把 video-shotcraft 仓库放到 remotion/shotcraft'); process.exit(1); }
    run('git', ['-C', SC, 'checkout', '-q', COMMIT]);
  }
  fs.cpSync(path.join(SC, 'demos/_fixtures'), path.join(R, 'src/_fixtures'), { recursive: true });
  fs.cpSync(path.join(SC, 'demos/_textures'), path.join(R, 'src/_textures'), { recursive: true });           // 少数卡用到的示例截图：代码里 import 一份，
  fs.cpSync(path.join(SC, 'demos/_textures'), path.join(R, 'public/textures/live'), { recursive: true });   // 画面里再按 staticFile 读一份
  fs.writeFileSync(path.join(R, 'package.json'), JSON.stringify({ name: 'shots', private: true,
    dependencies: { '@remotion/cli': '4.0.484', '@remotion/motion-blur': '4.0.484', react: '19.2.7', 'react-dom': '19.2.7', remotion: '4.0.484' },
    devDependencies: { '@types/react': '19.2.17', typescript: '6.0.3' } }, null, 2) + '\n');
  fs.copyFileSync(path.join(SC, 'template/tsconfig.json'), path.join(R, 'tsconfig.json'));
  fs.copyFileSync(path.join(HERE, 'remotion-lock.json'), path.join(R, 'package-lock.json'));   // 实测过的依赖版本，npm ci 原样装
  fs.writeFileSync(path.join(R, 'src/index.ts'), "import { registerRoot } from 'remotion';\nimport { Root } from './Root';\nregisterRoot(Root);\n");
  if (!fs.existsSync(path.join(R, 'src/Root.tsx'))) fs.writeFileSync(path.join(R, 'src/Root.tsx'),
    "import React from 'react';\nimport { Composition } from 'remotion';\n// add 命令会在下面两行标记之间登记镜头。卡按 30 帧调的，fps 保持 30。\n// @imports\nexport const Root: React.FC = () => (\n  <>\n    {/* @shots */}\n  </>\n);\n");
  run(NPM, ['ci', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: R });
  console.log('Remotion 副工程好了：remotion/\n挑卡：看 remotion/shotcraft/references/shots/ 里的卡，或在线预览 https://vincentwei1021.github.io/video-shotcraft/\n然后：node tools/remotion.mjs add <卡名>');
} else if (cmd === 'add') {
  if (!a1) { console.error('用法：node tools/remotion.mjs add <卡名> [Id]'); process.exit(1); }
  if (!/^[a-z0-9-]+$/.test(a1) || (a2 && !/^[A-Za-z][A-Za-z0-9]*$/.test(a2))) { console.error('卡名只能是小写字母、数字和短横线（比如 deck-deal-flyin），Id 只能是英文字母和数字'); process.exit(1); }
  if (!fs.existsSync(SC)) { console.error('还没建副工程，先跑：node tools/remotion.mjs setup'); process.exit(1); }
  const cat = fs.readdirSync(path.join(SC, 'demos')).find(c => !c.startsWith('_') && fs.existsSync(path.join(SC, 'demos', c, a1)));
  if (!cat) { console.error(`找不到卡「${a1}」：卡名是 remotion/shotcraft/demos/<类>/ 下的文件夹名`); process.exit(1); }
  const src = path.join(SC, 'demos', cat, a1), dst = path.join(R, 'src/shots', a1);
  const tsx = fs.readdirSync(src).filter(f => f.endsWith('.tsx')).sort(); let main = null;
  // 已经拷过的卡不再覆盖：里面多半是改过配色和文字的代码。真要拿回原版，先删掉 remotion/src/shots/<卡名>/ 再 add
  if (fs.existsSync(dst)) console.log(`remotion/src/shots/${a1}/ 已经有了，没有覆盖（要拿回原版就先删掉这个文件夹）`);
  else {
    fs.mkdirSync(dst, { recursive: true });
    // 层级和原仓库一样（src/shots/<卡名>/），卡里 ../../_fixtures 的引用不用改
    for (const f of fs.readdirSync(src)) fs.cpSync(path.join(src, f), path.join(dst, f), { recursive: true });
    for (const f of fs.readdirSync(dst).filter(f => /\.tsx?$/.test(f))) {   // 个别卡引用仓库里的 assets/lib，改成指向下载下来的 shotcraft/
      const p = path.join(dst, f), s = fs.readFileSync(p, 'utf8'); if (s.includes("'../../../")) fs.writeFileSync(p, s.replaceAll("'../../../", "'../../../shotcraft/")); }
  }
  main = (tsx.find(f => !/Real\.tsx$/.test(f)) || tsx[0] || '').replace(/\.tsx$/, '');
  if (!main) { console.error(`卡「${a1}」里没有 .tsx 代码`); process.exit(1); }
  if (tsx.length > 1) console.log(`这张卡有 ${tsx.length} 个版本：${tsx.join('、')}，先登记了 ${main}；要别的版本就照着在 Root.tsx 里多登记一行`);
  const code = fs.readFileSync(path.join(dst, main + '.tsx'), 'utf8');
  // 组件一般和文件同名；不同名时取第一个 React.FC 导出（时长常量也是 export const，不能随便取第一个）
  const comp = new RegExp(`export (const|function) ${main}\\b`).test(code) ? main : (/export const (\w+)\s*:\s*React\.FC/.exec(code) || /export function ([A-Z]\w*)/.exec(code) || [])[1];
  const durName = (/export const (\w+_DUR(?:ATION)?)\b/.exec(code) || [])[1];   // 多数卡叫 XXX_DURATION，少数叫 XXX_DUR
  if (!comp) { console.error(`没认出 ${main}.tsx 里导出的组件，请手动在 remotion/src/Root.tsx 里登记`); process.exit(1); }
  const id = a2 || pascal(a1), rootF = path.join(R, 'src/Root.tsx'); let root = fs.readFileSync(rootF, 'utf8');
  if (root.includes(`id="${id}"`)) { console.log(`Root.tsx 里已经登记过 ${id} 了`); process.exit(0); }
  const dur = durName || '150';   // 没写时长常量的卡先给 5 秒，自己按卡上说的改
  root = root.replace('// @imports', `import { ${comp}${durName ? ', ' + durName : ''} } from './shots/${a1}/${main}';\n// @imports`)
             .replace('{/* @shots */}', `<Composition id="${id}" component={${comp}} durationInFrames={${dur}} fps={30} width={1920} height={1080} />\n    {/* @shots */}`);
  fs.writeFileSync(rootF, root);
  console.log(`已加入：${a1} → 镜头 ${id}（${durName ? '时长用卡里的 ' + durName : '卡里没写时长，先给了 5 秒'}）\n先读卡：remotion/shotcraft/references/shots/${cat}/${a1}.md\n改：remotion/src/shots/${a1}/${main}.tsx（换配色、材质、文字）\n渲：node tools/remotion.mjs render ${id}`);
} else if (cmd === 'render') {
  if (!a1) { console.error('用法：node tools/remotion.mjs render <Id>'); process.exit(1); }
  if (!fs.existsSync(path.join(R, 'node_modules'))) { console.error('还没建副工程，先跑：node tools/remotion.mjs setup'); process.exit(1); }
  // 优先用这台电脑上已有的无头 Chrome，省得 Remotion 再下一份（有些网络下很慢）
  const caches = [path.join(os.homedir(), '.cache/hyperframes/chrome/chrome-headless-shell'), path.join(os.homedir(), 'Library/Caches/ms-playwright'), path.join(os.homedir(), '.cache/ms-playwright'), path.join(os.homedir(), 'AppData/Local/ms-playwright')];
  const find = (d, depth) => { if (depth < 0 || !fs.existsSync(d)) return []; return fs.readdirSync(d, { withFileTypes: true }).flatMap(e => { const p = path.join(d, e.name);
    if (!e.isDirectory() && /^chrome-headless-shell(\.exe)?$/.test(e.name)) return [p]; return e.isDirectory() ? find(p, depth - 1) : []; }); };
  const shell = caches.flatMap(c => find(c, 3)).sort().pop();
  const out = path.join(P, 'shots', a1 + '.mp4'); fs.mkdirSync(path.dirname(out), { recursive: true });
  run(NPX, ['remotion', 'render', 'src/index.ts', a1, out, ...(shell ? ['--browser-executable', shell] : [])], { cwd: R });
  console.log(`完成：shots/${a1}.mp4\n拼进片子：const shot = await clip('shots/${a1}.mp4');（见 lib/clip.js）`);
} else {
  console.error('用法：node tools/remotion.mjs setup | add <卡名> [Id] | render <Id>'); process.exit(1);
}
