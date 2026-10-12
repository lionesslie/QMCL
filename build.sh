#!/usr/bin/env bash
set -euo pipefail

echo "============================================"
echo " QMCL Linux Build Script"
echo "============================================"

# Check Python
if ! command -v python3 &>/dev/null; then
    echo "ERROR: python3 not found in PATH."
    exit 1
fi

# Create venv
echo "Setting up virtual environment..."
python3 -m venv .venv
source .venv/bin/activate

# Install deps
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install pyinstaller

# Clean
rm -rf dist build QMCL.spec

echo "Building QMCL binary with PyInstaller..."
pyinstaller \
    --name QMCL \
    --onefile \
    --windowed \
    --add-data "assets:assets" \
    --hidden-import PySide6.QtSvg \
    --hidden-import PySide6.QtSvgWidgets \
    --hidden-import msal \
    --hidden-import requests \
    --hidden-import psutil \
    --exclude-module tkinter \
    --exclude-module matplotlib \
    main.py

echo ""
echo "============================================"
echo " Build complete: dist/QMCL"
echo "============================================"
echo ""
echo "To run: ./dist/QMCL"
