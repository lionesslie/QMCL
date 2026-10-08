@echo off
setlocal enabledelayedexpansion

title QMCL Build Script

echo.
echo ╔══════════════════════════════════════╗
echo ║   QMCL Build Script v1.0.0           ║
echo ╚══════════════════════════════════════╝
echo.

:: ── Check Go ──────────────────────────────────────────────
echo [*] Checking dependencies...
where go >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Go not found. Download from https://go.dev/dl/
    pause & exit /b 1
)
for /f "tokens=3" %%v in ('go version') do set GOVERSION=%%v
echo     [OK] Go %GOVERSION%

:: ── Check Wails ───────────────────────────────────────────
where wails >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Wails not found. Installing...
    go install github.com/wailsapp/wails/v2/cmd/wails@v2.16.0
    if %errorlevel% neq 0 (
        echo [!] Failed to install Wails
        pause & exit /b 1
    )
)
echo     [OK] Wails found

:: ── Check Node ────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Node.js not found. Download from https://nodejs.org
    pause & exit /b 1
)
for /f %%v in ('node --version') do set NODEVERSION=%%v
echo     [OK] Node %NODEVERSION%

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] npm not found
    pause & exit /b 1
)
for /f %%v in ('npm --version') do set NPMVERSION=%%v
echo     [OK] npm %NPMVERSION%

echo.

:: ── Install frontend deps ─────────────────────────────────
echo [*] Installing frontend dependencies...
cd frontend
call npm install --prefer-offline 2>nul
if %errorlevel% neq 0 (
    call npm install
    if %errorlevel% neq 0 (
        echo [!] npm install failed
        cd ..
        pause & exit /b 1
    )
)
cd ..
echo     [OK] Frontend dependencies installed
echo.

:: ── Build ─────────────────────────────────────────────────
echo [*] Building QMCL for Windows...
echo.

wails build -platform windows/amd64 -ldflags "-X main.Version=1.0.0" -clean

if %errorlevel% neq 0 (
    echo.
    echo ╔══════════════════════════════════════╗
    echo ║   Build FAILED                        ║
    echo ╚══════════════════════════════════════╝
    echo.
    echo Common fixes:
    echo   1. Run: go mod tidy
    echo   2. Check that all .go files compile
    echo   3. Make sure frontend/src/app.js has no syntax errors
    echo.
    pause
    exit /b 1
)

echo.
echo ╔══════════════════════════════════════╗
echo ║   Build Complete!                     ║
echo ╚══════════════════════════════════════╝
echo.

:: ── Find output ───────────────────────────────────────────
if exist "build\bin\QMCL.exe" (
    echo [OK] Output: build\bin\QMCL.exe
    for %%A in ("build\bin\QMCL.exe") do set SIZE=%%~zA
    set /a SIZEMB=!SIZE! / 1048576
    echo [OK] Size: ~!SIZEMB! MB
    echo.
    set /p LAUNCH="Launch QMCL now? [Y/N]: "
    if /i "!LAUNCH!"=="Y" start "" "build\bin\QMCL.exe"
) else if exist "build\bin\QMCL-amd64-installer.exe" (
    echo [OK] Installer: build\bin\QMCL-amd64-installer.exe
) else (
    echo [?] Build finished, check build\bin\ for output
)

echo.
pause
