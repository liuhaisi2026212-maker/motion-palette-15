// 开发用：渲染某个风格包在若干时间点的静帧。用法：node tools/stills.mjs <kit> <输出目录> <t1,t2,...> [spec.json]
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, '..', 'work', 'package.json')); const puppeteer = require('puppeteer-core');
const [kit, out, times, specFile] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg' };
const srv = http.createServer((q, r) => { const u = new URL('http://x' + q.url); const p = path.join(ROOT, decodeURIComponent(u.pathname)); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': T[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); }).listen(0);
await new Promise(r => srv.on('listening', r));
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const pg = await b.newPage(); pg.on('pageerror', e => console.log('PAGEERROR', e.message)); pg.on('console', m => m.type() === 'error' && console.log('ERR', m.text()));
const spec = specFile ? '?spec=' + encodeURIComponent(fs.readFileSync(specFile, 'utf8')) : '';
const info = await pg.evaluate(() => 0); await pg.goto(`http://127.0.0.1:${srv.address().port}/kits/${kit}/index.html${spec}`);
await pg.waitForFunction(() => window.__ready, { timeout: 60000 }); const D = await pg.evaluate(() => window.DEMO); await pg.setViewport({ width: D.width, height: D.height });
console.log('duration', D.duration.toFixed(2));
for (const t of times.split(',').map(Number)) { await pg.evaluate(t => window.renderAt(t), t); const c = await pg.$('canvas'); await c.screenshot({ path: path.join(out, `t${t.toFixed(2).padStart(6, '0')}.png`) }); }
await b.close(); srv.close();
