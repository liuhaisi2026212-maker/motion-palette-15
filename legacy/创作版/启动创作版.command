#!/bin/bash
# 十五画境创作版（macOS）：双击启动，浏览器会自动打开。关掉这个窗口就停止。
cd "$(dirname "$0")"
PORT=7916
( sleep 1.5; open "http://127.0.0.1:$PORT/" ) &
if command -v node >/dev/null 2>&1; then node lib/server.mjs $PORT; else python3 -m http.server $PORT --bind 127.0.0.1; fi
