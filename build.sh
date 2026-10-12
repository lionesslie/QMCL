#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "============================================"
echo " QMCL Linux Build Script"
echo "============================================"

if ! command -v python3 &>/dev/null; then
    echo "ERROR: python3 not found in PATH."
    exit 1
fi

python3 -m venv .venv
# shellcheck disable=SC1091
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
pip install pyinstaller

# PyInstaller aborts if --add-data source is missing
mkdir -p assets/icons assets/fonts

rm -rf dist build QMCL.spec

ICON_ARG=()
if [ -f assets/icons/app_icon.png ]; then
    ICON_ARG=(--icon assets/icons/app_icon.png)
fi

pyinstaller \
    --name QMCL \
    --onefile \
    --windowed \
    "${ICON_ARG[@]}" \
    --add-data "assets:assets" \
    --hidden-import PySide6.QtSvg \
    --hidden-import PySide6.QtSvgWidgets \
    --hidden-import msal \
    --hidden-import requests \
    --hidden-import psutil \
    --exclude-module tkinter \
    --exclude-module matplotlib \
    --exclude-module PySide6.QtWebEngineCore \
    --exclude-module PySide6.QtWebEngineWidgets \
    --exclude-module PySide6.QtPdf \
    main.py

echo ""
echo "============================================"
echo " Build complete: dist/QMCL"
echo "============================================"
