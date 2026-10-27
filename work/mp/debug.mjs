// 打开一支片，打印页面错误，确认 __ready
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import puppeteer from 'puppeteer-core';
const ROOT = path.resolve(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)), '..'); const [demo, query = ''] = process.argv.slice(2);
const srv = http.createServer((q, r) => { const u = new URL(q.url, 'http://x'); let p = path.join(ROOT, decodeURIComponent(u.pathname)); if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!fs.existsSync(p)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': p.endsWith('.js') || p.endsWith('.mjs') ? 'text/javascript' : p.endsWith('.html') ? 'text/html; charset=utf-8' : p.endsWith('.json') ? 'application/json' : 'application/octet-stream' }); fs.createReadStream(p).pipe(r); }).listen(0);
await new Promise(r => srv.on('listening', r));
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' }); const pg = await b.newPage();
pg.on('pageerror', e => console.log('PAGEERROR', e.message)); pg.on('console', m => m.type() !== 'log' && console.log('CONSOLE', m.type(), m.text())); pg.on('requestfailed', r => console.log('REQFAIL', r.url()));
pg.on('response', r => r.status() >= 400 && console.log('HTTP', r.status(), r.url()));
await pg.goto(`http://127.0.0.1:${srv.address().port}/${demo}/index.html${query ? '?' + query : ''}`); await new Promise(r => setTimeout(r, 6000));
console.log('READY', await pg.evaluate(() => window.__ready)); await b.close(); srv.close();
