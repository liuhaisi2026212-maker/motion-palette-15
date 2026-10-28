@echo off
chcp 65001 >nul
rem 十五画境工作台（Windows）：双击启动，浏览器会自动打开。关掉这个窗口就停止。
cd /d "%~dp0"
set PORT=7915
start "" "http://127.0.0.1:%PORT%/"
where node >nul 2>nul && (node mp\server.mjs %PORT% & goto :eof)
where python >nul 2>nul && (python -m http.server %PORT% --bind 127.0.0.1 & goto :eof)
echo 需要先安装 Node.js（https://nodejs.org）或 Python（https://python.org），装好后再双击。
pause
