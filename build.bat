@echo off
setlocal enabledelayedexpansion

echo ============================================
echo  QMCL Windows Build Script
echo ============================================

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found in PATH.
    exit /b 1
)

:: Upgrade pip + install deps
echo Installing dependencies...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install pyinstaller

:: Clean previous builds
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build
if exist QMCL.spec del /f QMCL.spec

echo Building QMCL.exe with PyInstaller...
pyinstaller ^
    --name QMCL ^
    --onefile ^
    --windowed ^
    --icon assets\icons\app_icon.ico ^
    --add-data "assets;assets" ^
    --hidden-import PySide6.QtSvg ^
    --hidden-import PySide6.QtSvgWidgets ^
    --hidden-import msal ^
    --hidden-import requests ^
    --hidden-import psutil ^
    --exclude-module tkinter ^
    --exclude-module matplotlib ^
    main.py

if errorlevel 1 (
    echo BUILD FAILED.
    exit /b 1
)

echo.
echo ============================================
echo  Build complete: dist\QMCL.exe
echo ============================================
