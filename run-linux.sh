#!/usr/bin/env bash

echo "========================================================================="
echo " Pure-Grid StorageSync | StorageGRID to Pure S3 Direct Migration Tool"
echo "========================================================================="
echo ""
echo "[1/2] Verifying self-contained application environment..."
echo "[2/2] Launching Pure-Grid StorageSync in default web browser..."
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

if command -v python3 >/dev/null 2>&1; then
    echo "Starting zero-dependency local web server on port 3000..."
    open_browser "http://localhost:3000"
    cd "$SCRIPT_DIR" && python3 -m http.server 3000 --bind 127.0.0.1
    exit 0
elif command -v python >/dev/null 2>&1; then
    echo "Starting zero-dependency local web server on port 3000..."
    open_browser "http://localhost:3000"
    cd "$SCRIPT_DIR" && python -m http.server 3000 --bind 127.0.0.1
    exit 0
fi

echo "Opening standalone single-file web app directly..."
open_browser "$SCRIPT_DIR/index.html"
echo "Pure-Grid StorageSync launched!"
