"""QMCL — Custom frameless title bar."""
from __future__ import annotations

from PySide6.QtCore import QPoint, Qt
from PySide6.QtGui import QFont
from PySide6.QtWidgets import (
    QHBoxLayout, QLabel, QPushButton, QSizePolicy, QWidget,
)

from ui.icons import get_icon


class TitleBar(QWidget):
    """Drag-capable custom title bar for a frameless window."""

    def __init__(self, parent: QWidget) -> None:
        super().__init__(parent)
        self.setObjectName("TitleBar")
        self.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        self.setFixedHeight(52)
        self._drag_pos: QPoint | None = None

        layout = QHBoxLayout(self)
        layout.setContentsMargins(16, 0, 8, 0)
        layout.setSpacing(4)

        # Logo + app name
        logo_label = QLabel()
        logo_label.setPixmap(get_icon("cube", "#6C63FF", 24).pixmap(24, 24))
        layout.addWidget(logo_label)

        name_label = QLabel("QMCL")
        name_label.setFont(QFont("Inter", 14, QFont.Weight.Bold))
        name_label.setStyleSheet("color: #F5F5F7; margin-left: 6px;")
        layout.addWidget(name_label)

        layout.addStretch()

        # Notification / Account / Settings
        for icon_name, obj_name, tooltip in [
            ("bell",        "notif_btn",   "Notifications"),
            ("user-circle", "account_btn", "Account"),
            ("gear",        "settings_btn","Settings"),
        ]:
            btn = QPushButton()
            btn.setObjectName("TitleBarBtn")
            btn.setIcon(get_icon(icon_name, "#A0A0A8", 18))
            btn.setFixedSize(36, 36)
            btn.setToolTip(tooltip)
            setattr(self, obj_name, btn)
            layout.addWidget(btn)

        layout.addSpacing(8)

        # Window controls
        self.minimize_btn = QPushButton()
        self.minimize_btn.setObjectName("MinimizeBtn")
        self.minimize_btn.setIcon(get_icon("minus", "#A0A0A8", 14))
        self.minimize_btn.setFixedSize(32, 32)
        self.minimize_btn.setToolTip("Minimize")
        self.minimize_btn.clicked.connect(parent.showMinimized)
        layout.addWidget(self.minimize_btn)

        self.maximize_btn = QPushButton()
        self.maximize_btn.setObjectName("MaximizeBtn")
        self.maximize_btn.setIcon(get_icon("square", "#A0A0A8", 12))
        self.maximize_btn.setFixedSize(32, 32)
        self.maximize_btn.setToolTip("Maximize")
        self.maximize_btn.clicked.connect(self._toggle_maximize)
        layout.addWidget(self.maximize_btn)

        self.close_btn = QPushButton()
        self.close_btn.setObjectName("CloseBtn")
        self.close_btn.setIcon(get_icon("x", "#A0A0A8", 14))
        self.close_btn.setFixedSize(32, 32)
        self.close_btn.setToolTip("Close")
        self.close_btn.clicked.connect(parent.close)
        layout.addWidget(self.close_btn)

    # ── Drag ─────────────────────────────────────────────────────────────────

    def mousePressEvent(self, event) -> None:
        if event.button() == Qt.MouseButton.LeftButton:
            handle = self.window().windowHandle()
            if handle is not None and handle.startSystemMove():
                return  # native move (Windows / X11 / Wayland)
            self._drag_pos = event.globalPosition().toPoint()

    def mouseMoveEvent(self, event) -> None:
        if self._drag_pos and event.buttons() & Qt.MouseButton.LeftButton:
            window = self.window()
            delta = event.globalPosition().toPoint() - self._drag_pos
            window.move(window.pos() + delta)
            self._drag_pos = event.globalPosition().toPoint()

    def mouseReleaseEvent(self, event) -> None:
        self._drag_pos = None

    def mouseDoubleClickEvent(self, event) -> None:
        self._toggle_maximize()

    def _toggle_maximize(self) -> None:
        w = self.window()
        if w.isMaximized():
            w.showNormal()
        else:
            w.showMaximized()
