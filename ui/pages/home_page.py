"""QMCL — Home page: news carousel + quick access cards."""
from __future__ import annotations

from PySide6.QtCore import Qt, QTimer
from PySide6.QtGui import QColor, QFont, QLinearGradient, QPainter
from PySide6.QtWidgets import (
    QFrame, QGridLayout, QHBoxLayout, QLabel, QPushButton,
    QScrollArea, QSizePolicy, QVBoxLayout, QWidget,
)

from ui.icons import get_icon


class _NewsCard(QWidget):
    def __init__(self, title: str, tag: str, tag_color: str,
                 parent=None) -> None:
        super().__init__(parent)
        self.setObjectName("GlassCard")
        self.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        self.setFixedHeight(180)
        self.setSizePolicy(QSizePolicy.Policy.Expanding,
                           QSizePolicy.Policy.Fixed)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 16, 20, 16)

        tag_lbl = QLabel(tag)
        tag_lbl.setStyleSheet(
            f"background: {tag_color}22; color: {tag_color}; "
            "border-radius: 6px; font-size: 11px; font-weight: 700; "
            "padding: 2px 8px; border: none;")
        tag_lbl.setFixedWidth(tag_lbl.sizeHint().width() + 4)
        layout.addWidget(tag_lbl)
        layout.addSpacing(8)

        title_lbl = QLabel(title)
        title_lbl.setWordWrap(True)
        title_lbl.setStyleSheet(
            "color: #F5F5F7; font-size: 18px; font-weight: 700; "
            "background: transparent; border: none;")
        layout.addWidget(title_lbl)
        layout.addStretch()


class _QuickCard(QWidget):
    def __init__(self, icon_name: str, title: str, subtitle: str,
                 callback=None, parent=None) -> None:
        super().__init__(parent)
        self.setObjectName("GlassCard")
        self.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        self.setFixedHeight(100)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self._callback = callback

        layout = QHBoxLayout(self)
        layout.setContentsMargins(16, 12, 16, 12)
        layout.setSpacing(14)

        icon_lbl = QLabel()
        icon_lbl.setPixmap(get_icon(icon_name, "#6C63FF", 28).pixmap(28, 28))
        icon_lbl.setFixedSize(48, 48)
        icon_lbl.setStyleSheet(
            "background: rgba(108,99,255,0.12); border-radius: 12px; "
            "padding: 10px;")
        icon_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(icon_lbl)

        text_col = QVBoxLayout()
        text_col.setSpacing(2)
        t = QLabel(title)
        t.setStyleSheet(
            "color: #F5F5F7; font-size: 14px; font-weight: 600; "
            "background: transparent; border: none;")
        s = QLabel(subtitle)
        s.setStyleSheet(
            "color: #A0A0A8; font-size: 12px; "
            "background: transparent; border: none;")
        text_col.addWidget(t)
        text_col.addWidget(s)
        layout.addLayout(text_col)
        layout.addStretch()

    def mousePressEvent(self, event) -> None:
        if self._callback and event.button() == Qt.MouseButton.LeftButton:
            self._callback()
        super().mousePressEvent(event)


class HomePage(QWidget):
    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self._nav_callback = None

        root = QVBoxLayout(self)
        root.setContentsMargins(32, 28, 32, 28)
        root.setSpacing(24)

        # ── Header ────────────────────────────────────────────────────────────
        hdr = QLabel("Welcome back")
        hdr.setObjectName("H1")
        root.addWidget(hdr)

        sub = QLabel("What are you playing today?")
        sub.setObjectName("Muted")
        root.addWidget(sub)

        # ── News ──────────────────────────────────────────────────────────────
        news_hdr = QHBoxLayout()
        news_title = QLabel("Latest News")
        news_title.setObjectName("H3")
        news_hdr.addWidget(news_title)
        news_hdr.addStretch()

        prev_btn = QPushButton()
        prev_btn.setObjectName("IconBtn")
        prev_btn.setIcon(get_icon("chevron-left", "#A0A0A8", 16))
        prev_btn.setFixedSize(32, 32)
        next_btn = QPushButton()
        next_btn.setObjectName("IconBtn")
        next_btn.setIcon(get_icon("chevron-right", "#A0A0A8", 16))
        next_btn.setFixedSize(32, 32)
        news_hdr.addWidget(prev_btn)
        news_hdr.addWidget(next_btn)
        root.addLayout(news_hdr)

        news_data = [
            ("Minecraft 1.21.4 — The Garden Awakens Update",
             "RELEASE", "#4ADE80"),
            ("Fabric Loader 0.16 Released — Performance Improvements",
             "MOD LOADER", "#6C63FF"),
            ("CurseForge Modpack Spotlight: Create: Above and Beyond",
             "SPOTLIGHT", "#22D3EE"),
        ]

        news_row = QHBoxLayout()
        news_row.setSpacing(12)
        for title, tag, color in news_data:
            card = _NewsCard(title, tag, color)
            news_row.addWidget(card)
        root.addLayout(news_row)

        # ── Quick Access ──────────────────────────────────────────────────────
        qa_title = QLabel("Quick Access")
        qa_title.setObjectName("H3")
        root.addWidget(qa_title)

        grid = QGridLayout()
        grid.setSpacing(12)

        quick_items = [
            ("download",   "Install New Version", "Download Minecraft releases",
             lambda: self._nav("instances")),
            ("star",       "Featured Modpacks",   "Browse curated packs",
             lambda: self._nav("store")),
            ("clock",      "Recent Instances",    "Jump back in",
             lambda: self._nav("instances")),
            ("puzzle-piece", "Browse Mods",       "Find mods on Modrinth & CurseForge",
             lambda: self._nav("store")),
        ]
        for idx, (icon, title, sub, cb) in enumerate(quick_items):
            card = _QuickCard(icon, title, sub, cb)
            grid.addWidget(card, idx // 2, idx % 2)

        root.addLayout(grid)
        root.addStretch()

    def _nav(self, page: str) -> None:
        if self._nav_callback:
            self._nav_callback(page)

    def set_nav_callback(self, cb) -> None:
        self._nav_callback = cb
