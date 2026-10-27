// 十五画境工作台的本地服务：只在本机 127.0.0.1 提供文件，不联网。
// 另外提供 /api/frame：用本机 Chrome/Edge 无头打开片子、按时间截一帧（给 HTML 图层的片子导出用，浏览器自己截不了）。
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.m4a': 'audio/mp4', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8' };
const port = +(process.argv[2] || 7915);

const CHROMES = [process.env.MG_CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
let browser = null, session = null;   // 同一时间只渲染一支片（同一份配置复用同一个页面）
async function pageFor(id, cfg, w, h) {
  const key = `${id}|${cfg}|${w}x${h}`;
  if (session && session.key === key) return session.page;
  if (!browser) {
    const { default: puppeteer } = await import('puppeteer-core');
    const exe = CHROMES.find(p => { try { return fs.existsSync(p); } catch (e) { return false; } });
    if (!exe) throw new Error('找不到 Chrome 或 Edge，请先安装 Chrome');
    browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: process.platform === 'darwin' ? ['--use-angle=metal'] : [] });
  }
  if (session) await session.page.close().catch(() => {});
  const page = await browser.newPage(); await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${port}/demos/${id}/index.html?cfg=${encodeURIComponent(cfg)}`);
  await page.waitForFunction(() => window.__ready === true && typeof window.renderAt === 'function', { timeout: 120000 });
  session = { key, page }; return page;
}
let queue = Promise.resolve();
async function frame(q) {
  const id = q.get('id'), cfg = q.get('cfg') || '{}', t = +q.get('t') || 0, w = +q.get('w') || 1920, h = +q.get('h') || 1080;
  if (!/^[0-9a-z-]+$/.test(id) || !fs.existsSync(path.join(ROOT, 'demos', id))) throw new Error('bad id');
  const page = await pageFor(id, cfg, w, h);
  await page.evaluate(async tt => { await window.renderAt(tt); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, t);
  return page.screenshot({ type: 'jpeg', quality: 95, clip: { x: 0, y: 0, width: w, height: h } });
}

http.createServer((q, r) => {
  const u = new URL(q.url, 'http://x');
  if (u.pathname === '/api/ping') { r.writeHead(200, { 'Content-Type': 'application/json' }); return r.end('{"frames":true}'); }
  if (u.pathname === '/api/frame') {
    queue = queue.then(() => frame(u.searchParams)).then(buf => { r.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store' }); r.end(buf); },
      e => { r.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }); r.end(String(e.message || e)); });
    return;
  }
  let p = path.join(ROOT, decodeURIComponent(u.pathname));
  if (!p.startsWith(ROOT)) { r.writeHead(403); return r.end(); } if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!fs.existsSync(p)) { r.writeHead(404); return r.end('404'); } r.writeHead(200, { 'Content-Type': T[path.extname(p).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(p).pipe(r);
}).listen(port, '127.0.0.1', () => console.log(`十五画境工作台：http://127.0.0.1:${port}/  （关掉这个窗口就停止）`));
process.on('exit', () => browser && browser.close());
