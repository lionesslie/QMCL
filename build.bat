@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ============================================
echo  QMCL Windows Build Script
echo ============================================

python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found in PATH.
    exit /b 1
)

echo Installing dependencies...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install pyinstaller
if errorlevel 1 (
    echo ERROR: dependency installation failed.
    exit /b 1
)

:: Make sure asset folders exist (PyInstaller aborts if --add-data source is missing)
if not exist assets\icons mkdir assets\icons
if not exist assets\fonts mkdir assets\fonts

:: Clean previous builds
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build
if exist QMCL.spec del /f QMCL.spec

:: Use the icon only if it exists
set ICON_ARG=
if exist assets\icons\app_icon.ico set ICON_ARG=--icon assets\icons\app_icon.ico

echo Building QMCL.exe with PyInstaller...
python -m PyInstaller ^
    --name QMCL ^
    --onefile ^
    --windowed ^
    %ICON_ARG% ^
    --add-data "assets;assets" ^
    --hidden-import PySide6.QtSvg ^
    --hidden-import PySide6.QtSvgWidgets ^
    --hidden-import msal ^
    --hidden-import requests ^
    --hidden-import psutil ^
    --exclude-module tkinter ^
    --exclude-module matplotlib ^
    --exclude-module PySide6.QtWebEngineCore ^
    --exclude-module PySide6.QtWebEngineWidgets ^
    --exclude-module PySide6.QtPdf ^
    main.py

if errorlevel 1 (
    echo BUILD FAILED.
    exit /b 1
)

echo.
echo ============================================
echo  Build complete: dist\QMCL.exe
echo ============================================
