// 自动测试：打开工作台 → 选风格 → 填配置 → 导出 → 存 MP4
import puppeteer from 'puppeteer-core'; import fs from 'node:fs'; import { spawn } from 'node:child_process'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)); const [id, cfgJson, out, quality = '1'] = process.argv.slice(2);
const srv = spawn(process.execPath, [path.join(here, 'server.mjs'), '7931']); await new Promise(r => setTimeout(r, 600));
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--use-angle=metal'] });
const pg = await b.newPage(); await pg.setViewport({ width: 1500, height: 950 }); pg.on('pageerror', e => console.log('PAGEERROR', e.message));
await pg.goto('http://127.0.0.1:7931/'); await pg.waitForFunction(() => window.__wb && window.__wb.ready, { timeout: 60000 });
await pg.evaluate(id => window.__wb.pick(id), id); await new Promise(r => setTimeout(r, 1500)); await pg.waitForFunction(() => window.__wb.ready, { timeout: 120000 });
if (cfgJson) { await pg.evaluate(c => window.__wb.setCfg(JSON.parse(c)), cfgJson); await new Promise(r => setTimeout(r, 1500)); await pg.waitForFunction(() => window.__wb.ready, { timeout: 120000 }); }
await pg.screenshot({ path: out.replace(/\.mp4$/, '_ui.png') });
await pg.select('#quality', quality); const t0 = Date.now(); await pg.evaluate(() => document.getElementById('export').click());
const iv = setInterval(async () => { try { console.log('progress', await pg.evaluate(() => document.getElementById('barI').style.width)); } catch (e) {} }, 15000);
await pg.waitForFunction(() => window.__lastExport, { timeout: 900000 }); clearInterval(iv); const res = await pg.evaluate(() => window.__lastExport); console.log('export', JSON.stringify(res), ((Date.now() - t0) / 1000).toFixed(1) + 's');
if (!res.error) { const b64 = await pg.evaluate(async () => await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(window.__lastBlob); })); fs.writeFileSync(out, Buffer.from(b64, 'base64')); }
await b.close(); srv.kill();
