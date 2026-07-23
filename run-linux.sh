#!/usr/bin/env bash

echo "========================================================================="
echo "  Pure-Grid StorageSync - Portable Self-Contained Launcher"
echo "  StorageGRID to Pure S3 Cross-Cluster Migration Engine v3.1.0"
echo "========================================================================="
echo ""

# -----------------------------------------------------------------------
# CONFIGURATION
# -----------------------------------------------------------------------
NODE_VER="v24.18.0"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
RUNTIME_DIR="$SCRIPT_DIR/runtime"

# Detect OS and architecture
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
    Linux*)   NODE_OS="linux" ;;
    Darwin*)  NODE_OS="darwin" ;;
    *)        NODE_OS="linux" ;;
esac

case "$ARCH" in
    x86_64)   NODE_ARCH="x64" ;;
    aarch64)  NODE_ARCH="arm64" ;;
    arm64)    NODE_ARCH="arm64" ;;
    *)        NODE_ARCH="x64" ;;
esac

NODE_DIST="node-${NODE_VER}-${NODE_OS}-${NODE_ARCH}"
NODE_TAR="${NODE_DIST}.tar.xz"
NODE_URL="https://nodejs.org/dist/${NODE_VER}/${NODE_TAR}"
NODE_EXE="$RUNTIME_DIR/$NODE_DIST/bin/node"
NPM_CMD="$RUNTIME_DIR/$NODE_DIST/bin/npm"

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

# -----------------------------------------------------------------------
# STEP 1: Locate or download Node.js portable runtime
# -----------------------------------------------------------------------
echo "[Step 1 of 3] Checking for Node.js runtime..."

if [ -x "$NODE_EXE" ]; then
    echo "  Using bundled portable Node.js: $NODE_EXE"
elif command -v node >/dev/null 2>&1; then
    NODE_EXE="node"
    NPM_CMD="npm"
    echo "  Using system-installed Node.js."
else
    echo ""
    echo "  Node.js not found on this system."
    echo "  Downloading portable Node.js ${NODE_VER} LTS runtime..."
    echo "  Source: ${NODE_URL}"
    echo ""

    mkdir -p "$RUNTIME_DIR"

    if command -v curl >/dev/null 2>&1; then
        curl -fSL "$NODE_URL" -o "$RUNTIME_DIR/$NODE_TAR"
    elif command -v wget >/dev/null 2>&1; then
        wget -q "$NODE_URL" -O "$RUNTIME_DIR/$NODE_TAR"
    else
        echo "  ERROR: Neither curl nor wget found. Cannot download Node.js."
        echo "  Please install Node.js manually from https://nodejs.org"
        exit 1
    fi

    if [ ! -f "$RUNTIME_DIR/$NODE_TAR" ]; then
        echo "  ERROR: Download failed."
        exit 1
    fi

    echo "  Extracting portable runtime..."
    tar -xf "$RUNTIME_DIR/$NODE_TAR" -C "$RUNTIME_DIR"
    rm -f "$RUNTIME_DIR/$NODE_TAR"

    if [ ! -x "$NODE_EXE" ]; then
        echo "  ERROR: Extraction failed. Node.js binary not found at $NODE_EXE"
        exit 1
    fi

    echo "  Using bundled portable Node.js: $NODE_EXE"
fi

# -----------------------------------------------------------------------
# STEP 2: Install npm dependencies if missing
# -----------------------------------------------------------------------
echo ""
echo "[Step 2 of 3] Checking npm dependencies..."

if [ ! -d "$SCRIPT_DIR/node_modules/express" ]; then
    echo "  Installing npm packages... please wait."
    cd "$SCRIPT_DIR" && "$NPM_CMD" install --production
    if [ $? -ne 0 ]; then
        echo "  ERROR: npm install failed. Check your network connection."
        exit 1
    fi
else
    echo "  Dependencies ready."
fi

# -----------------------------------------------------------------------
# STEP 3: Launch the Node.js backend server
# -----------------------------------------------------------------------
echo ""
echo "[Step 3 of 3] Starting Migration Engine..."
echo ""
echo "  ============================================="
echo "   Server running at http://localhost:3001"
echo "   Press Ctrl+C to stop the server"
echo "  ============================================="
echo ""

(sleep 2 && open_browser "http://localhost:3001") &
cd "$SCRIPT_DIR" && "$NODE_EXE" server/index.js
