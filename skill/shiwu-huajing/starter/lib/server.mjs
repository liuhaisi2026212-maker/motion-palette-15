// 十五画境脚手架的本地服务：只在本机 127.0.0.1 提供文件，不联网
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8' };
const port = +(process.argv[2] || 7920);
http.createServer((q, r) => { const u = new URL('http://x' + q.url); let p = path.join(ROOT, decodeURIComponent(u.pathname));
  if (!p.startsWith(ROOT)) { r.writeHead(403); return r.end(); } if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!fs.existsSync(p)) { r.writeHead(404); return r.end('404'); } r.writeHead(200, { 'Content-Type': T[path.extname(p).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(p).pipe(r); }).listen(port, '127.0.0.1', () => console.log(`预览与导出页：http://127.0.0.1:${port}/  （关掉这个窗口就停止）`));
