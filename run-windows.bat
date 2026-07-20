@echo off
title Pure-Grid StorageSync Launcher
cls
echo =========================================================================
echo  Pure-Grid StorageSync | StorageGRID to Pure S3 Direct Migration Tool
echo =========================================================================
echo.
echo [1/2] Verifying application environment...
echo [2/2] Launching Pure-Grid StorageSync engine...
echo.

where node >nul 2>nul
if %errorlevel%==0 (
    if exist "server\index.js" (
        echo Starting Node.js S3 SDK Backend Server on port 3001...
        start "" "http://localhost:3001"
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
