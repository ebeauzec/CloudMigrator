#!/usr/bin/env bash

echo "========================================================================="
echo " Pure-Grid StorageSync | StorageGRID to Pure S3 Direct Migration Tool"
echo "========================================================================="
echo ""
echo "[1/2] Verifying application environment..."
echo "[2/2] Launching Pure-Grid StorageSync engine..."
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

open_browser() {
    URL="$1"
    if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$URL" >/dev/null 2>&1 &
    elif command -v open >/dev/null 2>&1; then
        open "$URL" >/dev/null 2>&1 &
    elif command -v sensible-browser >/dev/null 2>&1; then
        sensible-browser "$URL" >/dev/null 2>&1 &
    fi
}

# Prioritize Node.js Express backend server
if command -v node >/dev/null 2>&1; then
    if [ -f "$SCRIPT_DIR/server/index.js" ]; then
        echo "Starting Node.js S3 SDK Backend Server on port 3001..."
        (sleep 1 && open_browser "http://localhost:3001") &
        cd "$SCRIPT_DIR" && node server/index.js
        exit 0
    fi
fi

if command -v python3 >/dev/null 2>&1; then
    echo "Starting local web server on port 3000..."
    open_browser "http://localhost:3000"
    cd "$SCRIPT_DIR" && python3 -m http.server 3000 --bind 127.0.0.1
    exit 0
fi

echo "Opening standalone single-file web app directly..."
open_browser "$SCRIPT_DIR/index.html"
echo "Pure-Grid StorageSync launched!"
