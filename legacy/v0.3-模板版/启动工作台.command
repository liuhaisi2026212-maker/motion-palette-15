#!/bin/bash
# 十五画境工作台（macOS）：双击启动，浏览器会自动打开。关掉这个窗口就停止。
cd "$(dirname "$0")"
PORT=7915
URL="http://127.0.0.1:$PORT/"
( sleep 1.5; open "$URL" ) &
if command -v node >/dev/null 2>&1; then
  node mp/server.mjs $PORT
else
  python3 -m http.server $PORT --bind 127.0.0.1
fi
