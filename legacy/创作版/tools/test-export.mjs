// 开发用：打开创作版工作台 → 选风格 → 填镜头表 → 导出 → 存 MP4。用法：node tools/test-export.mjs <kit> <spec.json|-> <out.mp4> [照片...]
import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const require = createRequire(path.join(ROOT, '..', 'work', 'package.json')); const puppeteer = require('puppeteer-core');
const [kit, specFile, out, ...photos] = process.argv.slice(2);
const srv = spawn(process.execPath, [path.join(ROOT, 'lib', 'server.mjs'), '7941']); await new Promise(r => setTimeout(r, 600));
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const pg = await b.newPage(); await pg.setViewport({ width: 1500, height: 1000 }); pg.on('pageerror', e => console.log('PAGEERROR', e.message));
await pg.goto('http://127.0.0.1:7941/'); await pg.waitForFunction(() => window.__wb && window.__wb.ready, { timeout: 60000 });
await pg.evaluate(k => window.__wb.pick(k), kit); await new Promise(r => setTimeout(r, 800));
if (photos.length) { const inp = await pg.$('#file'); await inp.uploadFile(...photos); await new Promise(r => setTimeout(r, 1200)); }
if (specFile && specFile !== '-') { await pg.evaluate(s => window.__wb.setSpec(s), fs.readFileSync(specFile, 'utf8')); await new Promise(r => setTimeout(r, 1200)); }
await pg.waitForFunction(() => window.__wb.ready, { timeout: 120000 }); await new Promise(r => setTimeout(r, 1500));
await pg.screenshot({ path: out.replace(/\.mp4$/, '_ui.png') }); console.log('msg:', await pg.evaluate(() => document.getElementById('msg').textContent));
const t0 = Date.now(); await pg.evaluate(() => document.getElementById('export').click());
await pg.waitForFunction(() => window.__lastExport, { timeout: 900000, polling: 500 }); const res = await pg.evaluate(() => window.__lastExport); console.log('export', JSON.stringify(res), ((Date.now() - t0) / 1000).toFixed(1) + 's');
if (!res.error) { const b64 = await pg.evaluate(async () => await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(window.__lastBlob); })); fs.writeFileSync(out, Buffer.from(b64, 'base64')); }
await b.close(); srv.kill();
