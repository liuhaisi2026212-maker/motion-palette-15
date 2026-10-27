"""十五画境 v0.3 打包：把 work/ 里给用户用的部分复制到 dist/motion-palette-15/，装好本地服务要用的 puppeteer-core，打成 zip。
用法：python3 打包.py
"""
import json, os, shutil, subprocess, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC, DIST = ROOT / 'work', ROOT / 'dist' / 'motion-palette-15'
KEEP = ['index.html', 'SKILL.md', '使用说明.md', 'CREDITS.md', 'LICENSE', '启动工作台.command', '启动工作台.bat', 'mp', 'demos', 'assets', 'vendor', 'covers', 'harness']
SKIP_DIRS = {'out', 'tools', 'work', '__pycache__', 'node_modules'}
SKIP_FILES = ('.orig.html', '.orig.js', 'audio.py', '.DS_Store', 'prep.py', 'prep_r2.py', 'prep_r2b.py')

if DIST.parent.exists(): shutil.rmtree(DIST.parent)
DIST.mkdir(parents=True)
for name in KEEP:
    s, d = SRC / name, DIST / name
    if s.is_dir():
        for p in s.rglob('*'):
            rel = p.relative_to(SRC)
            if any(part in SKIP_DIRS for part in rel.parts) or p.name.endswith(SKIP_FILES) or p.is_dir(): continue
            if name == 'mp' and p.name in ('debug.mjs', 'test-export.mjs'): continue
            (DIST / rel).parent.mkdir(parents=True, exist_ok=True); shutil.copy2(p, DIST / rel)
    elif s.exists():
        shutil.copy2(s, d)
# 04 3D 渲染不在工作台里，整个目录不需要
shutil.rmtree(DIST / 'demos' / '04-3d-render', ignore_errors=True)
# 本地服务（逐帧截图）只需要 puppeteer-core
ver = json.loads((SRC / 'node_modules' / 'puppeteer-core' / 'package.json').read_text())['version']
(DIST / 'package.json').write_text(json.dumps({'name': 'motion-palette-15', 'private': True, 'type': 'module', 'dependencies': {'puppeteer-core': ver}}, ensure_ascii=False, indent=2))
subprocess.run(['npm', 'install', '--omit=dev', '--no-audit', '--no-fund'], cwd=DIST, check=True)
os.chmod(DIST / '启动工作台.command', 0o755)

zp = ROOT / 'dist' / 'motion-palette-15-v0.3.zip'
with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for p in sorted(DIST.rglob('*')):
        if p.is_file():
            zi = zipfile.ZipInfo.from_file(p, Path('motion-palette-15') / p.relative_to(DIST))
            if p.name == '启动工作台.command': zi.external_attr = 0o100755 << 16
            with open(p, 'rb') as f: z.writestr(zi, f.read(), zipfile.ZIP_DEFLATED)
print('打包完成：', zp, f'{zp.stat().st_size / 1048576:.1f} MB')
