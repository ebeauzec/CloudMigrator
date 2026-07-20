@echo off
title Pure-Grid StorageSync Launcher
cls
echo =========================================================================
echo  Pure-Grid StorageSync | StorageGRID to Pure S3 Migration Engine
echo =========================================================================
echo.
echo [1/2] Verifying application environment ^& dependencies...

if not exist "%~dp0node_modules\" (
    echo First-time launch: installing required dependencies via npm install...
    cd /d "%~dp0"
    call npm install --silent
)

echo [2/2] Launching Pure-Grid StorageSync engine...
echo.

where node >nul 2>nul
if %errorlevel%==0 (
    if exist "%~dp0server\index.js" (
        echo Starting Node.js S3 Engine on port 3001...
        start "" "http://localhost:3001"
        cd /d "%~dp0"
        node server/index.js
        goto END
    )
)

where python >nul 2>nul
if %errorlevel%==0 (
    echo Starting local web server on port 3000...
    start "" "http://localhost:3000"
    python -m http.server 3000 --bind 127.0.0.1
    goto END
)

echo Opening standalone single-file web app directly...
start "" "%~dp0index.html"

:END
echo.
echo Launch sequence finished.
