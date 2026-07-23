@echo off
title Pure-Grid StorageSync - Portable Launcher
cls
echo =========================================================================
echo   Pure-Grid StorageSync - Portable Self-Contained Launcher
echo   StorageGRID to Pure S3 Cross-Cluster Migration Engine v3.1.0
echo =========================================================================
echo.

:: -----------------------------------------------------------------------
:: CONFIGURATION - Change this version if you need a different Node.js LTS
:: -----------------------------------------------------------------------
set "NODE_VER=v24.18.0"
set "NODE_DIST=node-%NODE_VER%-win-x64"
set "NODE_ZIP=%NODE_DIST%.zip"
set "NODE_URL=https://nodejs.org/dist/%NODE_VER%/%NODE_ZIP%"
set "RUNTIME_DIR=%~dp0runtime"
set "NODE_EXE=%RUNTIME_DIR%\%NODE_DIST%\node.exe"
set "NPM_CMD=%RUNTIME_DIR%\%NODE_DIST%\npm.cmd"

:: -----------------------------------------------------------------------
:: STEP 1: Locate or download Node.js portable runtime
:: -----------------------------------------------------------------------
echo [Step 1 of 3] Checking for Node.js runtime...

if exist "%NODE_EXE%" goto FOUND_BUNDLED_NODE

:: Check if Node.js is already installed system-wide
where node >nul 2>nul
if not errorlevel 1 goto FOUND_SYSTEM_NODE

:: No Node.js anywhere - download portable runtime
echo.
echo   Node.js not found on this system.
echo   Downloading portable Node.js %NODE_VER% LTS runtime...
echo   Source: %NODE_URL%
echo.

if not exist "%RUNTIME_DIR%" mkdir "%RUNTIME_DIR%"

echo   Downloading... this may take 1-2 minutes on first run.
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('%NODE_URL%', '%RUNTIME_DIR%\%NODE_ZIP%')"
if errorlevel 1 goto DOWNLOAD_FAILED
if not exist "%RUNTIME_DIR%\%NODE_ZIP%" goto DOWNLOAD_FAILED

echo   Extracting portable runtime...
powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::ExtractToDirectory('%RUNTIME_DIR%\%NODE_ZIP%', '%RUNTIME_DIR%')"
if errorlevel 1 goto DOWNLOAD_FAILED

del "%RUNTIME_DIR%\%NODE_ZIP%" >nul 2>nul

if exist "%NODE_EXE%" goto FOUND_BUNDLED_NODE
goto DOWNLOAD_FAILED

:: -----------------------------------------------------------------------
:: STEP 1 RESOLUTION
:: -----------------------------------------------------------------------
:FOUND_BUNDLED_NODE
echo   Using bundled portable Node.js: %NODE_EXE%
goto STEP2

:FOUND_SYSTEM_NODE
set "NODE_EXE=node"
set "NPM_CMD=npm"
echo   Using system-installed Node.js.
goto STEP2

:DOWNLOAD_FAILED
echo.
echo   ERROR: Could not download or extract Node.js portable runtime.
echo   Please check your internet connection, or install Node.js manually
echo   from https://nodejs.org and re-run this launcher.
echo.
echo   Falling back to static file server...
goto TRY_PYTHON

:: -----------------------------------------------------------------------
:: STEP 2: Install npm dependencies if missing
:: Cloud-synced drives (Google Drive, OneDrive, Dropbox) cause npm tar
:: write errors. We install to a local temp directory, then copy back.
:: -----------------------------------------------------------------------
:STEP2
echo.
echo [Step 2 of 3] Checking npm dependencies...

if exist "%~dp0node_modules\express" goto DEPS_OK

echo   Installing npm packages... please wait.
echo   (Installing to local temp directory to avoid cloud sync conflicts)

:: Create a staging directory on the local filesystem
set "STAGING=%TEMP%\puregrid-npm-staging"
if exist "%STAGING%" rmdir /s /q "%STAGING%"
mkdir "%STAGING%"

:: Copy package.json to staging
copy /y "%~dp0package.json" "%STAGING%\package.json" >nul
if exist "%~dp0package-lock.json" copy /y "%~dp0package-lock.json" "%STAGING%\package-lock.json" >nul

:: Run npm install in the staging directory (on local disk, no sync issues)
cd /d "%STAGING%"
call "%NPM_CMD%" install --omit=dev
if errorlevel 1 goto NPM_FAILED

:: Copy node_modules back to project directory
echo   Copying dependencies to project directory...
robocopy "%STAGING%\node_modules" "%~dp0node_modules" /E /NFL /NDL /NJH /NJS /NP >nul

:: Copy the package-lock.json back
if exist "%STAGING%\package-lock.json" copy /y "%STAGING%\package-lock.json" "%~dp0package-lock.json" >nul

:: Clean up staging
rmdir /s /q "%STAGING%" >nul 2>nul

if exist "%~dp0node_modules\express" goto DEPS_OK
goto NPM_FAILED

:NPM_FAILED
echo.
echo   ERROR: npm install failed.
echo   If on a cloud-synced drive, try copying the project to a local folder.
goto TRY_PYTHON

:DEPS_OK
echo   Dependencies ready.

:: -----------------------------------------------------------------------
:: STEP 3: Launch the Node.js backend server
:: -----------------------------------------------------------------------
echo.
echo [Step 3 of 3] Starting Migration Engine...
echo.
echo   =============================================
echo    Server running at http://localhost:3001
echo    Press Ctrl+C to stop the server
echo   =============================================
echo.

start "" "http://localhost:3001"
cd /d "%~dp0"
"%NODE_EXE%" server/index.js
goto END

:: -----------------------------------------------------------------------
:: FALLBACK: Python static file server
:: -----------------------------------------------------------------------
:TRY_PYTHON
echo.
where python >nul 2>nul
if errorlevel 1 goto FALLBACK_DIRECT

echo   Starting Python static web server on port 3000...
echo   NOTE: Running in DEMO SIMULATION MODE - S3 operations are simulated.
echo.
start "" "http://localhost:3000"
cd /d "%~dp0"
python -m http.server 3000 --bind 127.0.0.1
goto END

:: -----------------------------------------------------------------------
:: FALLBACK: Open HTML directly in browser
:: -----------------------------------------------------------------------
:FALLBACK_DIRECT
echo.
echo   No runtime available. Opening standalone HTML in browser...
echo   NOTE: Running in DEMO SIMULATION MODE.
echo.
start "" "%~dp0index.html"

:END
echo.
echo Server stopped.
pause
