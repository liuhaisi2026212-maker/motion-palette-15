@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PORT=7920
start "" "http://127.0.0.1:%PORT%/"
where node >nul 2>nul && (node lib\server.mjs %PORT% & goto :eof)
where python >nul 2>nul && (python -m http.server %PORT% --bind 127.0.0.1 & goto :eof)
echo 需要先安装 Node.js（https://nodejs.org）或 Python（https://python.org）。
pause
