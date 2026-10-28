// 工具共用：开本地服务 + 无头浏览器打开 film.html。需要先在 starter 目录运行一次：npm install puppeteer-core
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const CHROMES = [process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
// 命令行里写 --film films/hud.js 就只打开那一段；check 为 true 时打开文字体检
export const FILM = (() => { const i = process.argv.indexOf('--film'); if (i < 0) return null; const v = process.argv[i + 1]; process.argv.splice(i, 2); return v; })();
export async function openFilm({ check = false } = {}) {
  let puppeteer; try { puppeteer = (await import('puppeteer-core')).default; } catch (e) { console.error('缺少 puppeteer-core：请在 starter 目录运行 npm install puppeteer-core'); process.exit(1); }
  const srv = http.createServer((q, r) => { const u = new URL('http://x' + q.url); let p = path.join(ROOT, decodeURIComponent(u.pathname)); if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': T[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); }).listen(0, '127.0.0.1');
  await new Promise(r => srv.on('listening', r));
  const exe = CHROMES.find(p => fs.existsSync(p)); if (!exe) { console.error('找不到 Chrome/Edge，可以用环境变量 CHROME 指定路径'); process.exit(1); }
  const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: process.platform === 'darwin' ? ['--use-angle=metal'] : [] });
  const pg = await b.newPage(); const errors = []; pg.on('pageerror', e => errors.push(e.message)); pg.on('console', m => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errors.push(m.text())); pg.on('response', r => r.status() >= 400 && !r.url().endsWith('favicon.ico') && errors.push(`文件加载失败 ${r.status()}：${r.url()}`));
  const q = new URLSearchParams(); if (FILM) q.set('film', FILM); if (check) q.set('check', '1');
  await pg.goto(`http://127.0.0.1:${srv.address().port}/film.html${q.size ? '?' + q : ''}`);
  try { await pg.waitForFunction(() => window.__ready === true, { timeout: 60000 }); } catch (e) { console.error('片子没能加载完成，页面报错：', errors); await b.close(); srv.close(); process.exit(1); }
  const demo = await pg.evaluate(() => window.DEMO);
  return { pg, demo, errors, close: async () => { await b.close(); srv.close(); } };
}
