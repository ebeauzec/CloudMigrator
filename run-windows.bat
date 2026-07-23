@echo off
title Pure-Grid StorageSync Launcher
cls
echo =========================================================================
echo  Pure-Grid StorageSync | StorageGRID to Pure S3 Migration Engine
echo =========================================================================
echo.
echo [1/2] Verifying application environment ^& dependencies...

:: Check npm and node_modules
where npm >nul 2>nul
if errorlevel 1 goto SKIP_NPM
if exist "%~dp0node_modules\" goto SKIP_NPM

echo First-time launch: installing required dependencies via npm install...
cd /d "%~dp0"
call npm install --silent

:SKIP_NPM
echo.
echo [2/2] Launching Pure-Grid StorageSync engine...
echo.

:: Check Node.js and serve
where node >nul 2>nul
if errorlevel 1 goto TRY_PYTHON
if not exist "%~dp0server\index.js" goto TRY_PYTHON

echo Starting Node.js S3 Engine on port 3001...
start "" "http://localhost:3001"
cd /d "%~dp0"
node server/index.js
if errorlevel 1 (
    echo WARNING: Node.js server failed to start. Port 3001 may be in use.
) else (
    goto END
)

:TRY_PYTHON
:: Check Python and serve
where python >nul 2>nul
if errorlevel 1 goto FALLBACK_DIRECT

echo Starting local web server on port 3000...
start "" "http://localhost:3000"
python -m http.server 3000 --bind 127.0.0.1
if errorlevel 1 goto TRY_PYTHON_FALLBACK
goto END

:TRY_PYTHON_FALLBACK
echo.
echo WARNING: Failed to start web server on port 3000. Port may be in use.
echo Attempting to start on fallback port 8000...
start "" "http://localhost:8000"
python -m http.server 8000 --bind 127.0.0.1
if errorlevel 1 (
    echo ERROR: Failed to start server on fallback ports.
    goto FALLBACK_DIRECT
)
goto END

:FALLBACK_DIRECT
echo.
echo Opening standalone single-file web app directly in default browser...
start "" "%~dp0index.html"

:END
echo.
echo Launch sequence completed.
pause
