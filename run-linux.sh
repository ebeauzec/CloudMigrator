#!/usr/bin/env bash

echo "========================================================================="
echo " Pure-Grid StorageSync | StorageGRID to Pure S3 Migration Engine"
echo "========================================================================="
echo ""
echo "[1/2] Verifying application environment & dependencies..."

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

# Auto-install node_modules if missing on fresh clone
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    if command -v npm >/dev/null 2>&1; then
        echo "First-time launch: installing required dependencies..."
        cd "$SCRIPT_DIR" && npm install --silent
    else
        echo "NOTE: npm is not detected in your PATH. Skipping dependency installation."
    fi
fi

echo "[2/2] Launching Pure-Grid StorageSync engine..."

# Prioritize Node.js Express backend server
if command -v node >/dev/null 2>&1; then
    if [ -f "$SCRIPT_DIR/server/index.js" ]; then
        echo "Starting Node.js S3 Engine on port 3001..."
        (sleep 1 && open_browser "http://localhost:3001") &
        cd "$SCRIPT_DIR" && node server/index.js
        if [ $? -eq 0 ]; then
            exit 0
        fi
        echo "WARNING: Node.js server failed to start (port 3001 may be in use)."
    fi
fi

if command -v python3 >/dev/null 2>&1; then
    echo "Starting local web server on port 3000..."
    (sleep 1 && open_browser "http://localhost:3000") &
    cd "$SCRIPT_DIR" && python3 -m http.server 3000 --bind 127.0.0.1
    if [ $? -ne 0 ]; then
        echo "WARNING: Failed to start web server on port 3000. Trying fallback port 8000..."
        (sleep 1 && open_browser "http://localhost:8000") &
        cd "$SCRIPT_DIR" && python3 -m http.server 8000 --bind 127.0.0.1
    fi
    exit 0
fi

echo "Opening standalone single-file web app directly..."
open_browser "$SCRIPT_DIR/index.html"
echo "Pure-Grid StorageSync launched!"
