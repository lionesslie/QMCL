#!/usr/bin/env python3
"""QMCL — Quantum Minecraft Launcher — entry point."""
from __future__ import annotations

import sys
import os

# Ensure project root is on the path when run directly
sys.path.insert(0, os.path.dirname(__file__))


def main() -> int:
    from PySide6.QtWidgets import QApplication
    from PySide6.QtCore import Qt, QThreadPool
    from PySide6.QtGui import QFont, QFontDatabase

    app = QApplication(sys.argv)
    app.setApplicationName("QMCL")
    app.setApplicationVersion("1.0.0")
    app.setOrganizationName("QMCL")

    # Thread pool
    QThreadPool.globalInstance().setMaxThreadCount(8)

    # Font — try to load bundled Inter, fall back gracefully
    _load_fonts()

    # Apply Inter as default if available
    _families = QFontDatabase.families()
    if "Inter" in _families:
        app.setFont(QFont("Inter", 10))
    elif "Segoe UI" in _families:
        app.setFont(QFont("Segoe UI", 10))

    from ui.main_window import MainWindow
    window = MainWindow()
    window.show()

    return app.exec()


def _load_fonts() -> None:
    """Load bundled fonts from assets/fonts/ if present."""
    from PySide6.QtGui import QFontDatabase
    from pathlib import Path

    fonts_dir = Path(__file__).parent / "assets" / "fonts"
    if fonts_dir.exists():
        for f in fonts_dir.glob("*.ttf"):
            QFontDatabase.addApplicationFont(str(f))
        for f in fonts_dir.glob("*.otf"):
            QFontDatabase.addApplicationFont(str(f))


if __name__ == "__main__":
    sys.exit(main())
