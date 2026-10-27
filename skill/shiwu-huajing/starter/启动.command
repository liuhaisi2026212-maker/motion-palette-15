#!/bin/bash
# 双击启动预览与导出页（macOS）。关掉这个窗口就停止。
cd "$(dirname "$0")"
PORT=7920
( sleep 1.5; open "http://127.0.0.1:$PORT/" ) &
if command -v node >/dev/null 2>&1; then node lib/server.mjs $PORT; else python3 -m http.server $PORT --bind 127.0.0.1; fi
