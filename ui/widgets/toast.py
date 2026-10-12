"""QMCL — Toast notification widget (slides in from bottom-right)."""
from __future__ import annotations

from PySide6.QtCore import (
    QEasingCurve, QPropertyAnimation, QTimer, Qt,
)
from PySide6.QtWidgets import QHBoxLayout, QLabel, QWidget

from ui.icons import get_icon

_COLORS = {
    "success": ("#4ADE80", "#1A2B1A"),
    "error":   ("#F87171", "#2B1A1A"),
    "warning": ("#FBBF24", "#2B241A"),
    "info":    ("#22D3EE", "#1A2528"),
}

_ICONS = {
    "success": "check-circle",
    "error":   "x",
    "warning": "info",
    "info":    "info",
}


class Toast(QWidget):
    def __init__(self, parent: QWidget, message: str,
                 kind: str = "info", duration: int = 3000) -> None:
        super().__init__(parent)
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint |
                            Qt.WindowType.WindowStaysOnTopHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setAttribute(Qt.WidgetAttribute.WA_ShowWithoutActivating)

        color, bg = _COLORS.get(kind, _COLORS["info"])
        icon_name = _ICONS.get(kind, "info")

        self.setStyleSheet(f"""
            QWidget {{
                background: {bg};
                border: 1px solid {color}44;
                border-radius: 12px;
                padding: 0;
            }}
        """)

        layout = QHBoxLayout(self)
        layout.setContentsMargins(14, 10, 14, 10)
        layout.setSpacing(10)

        icon_lbl = QLabel()
        icon_lbl.setPixmap(get_icon(icon_name, color, 16).pixmap(16, 16))
        icon_lbl.setStyleSheet("background: transparent; border: none;")
        layout.addWidget(icon_lbl)

        msg_lbl = QLabel(message)
        msg_lbl.setStyleSheet(
            f"color: {color}; font-size: 13px; font-weight: 500; "
            "background: transparent; border: none;")
        msg_lbl.setWordWrap(True)
        layout.addWidget(msg_lbl)

        self.setFixedWidth(320)
        self.adjustSize()
        self._reposition()

        # Fade in
        self._opacity_anim = QPropertyAnimation(self, b"windowOpacity")
        self._opacity_anim.setDuration(200)
        self._opacity_anim.setStartValue(0.0)
        self._opacity_anim.setEndValue(1.0)
        self._opacity_anim.setEasingCurve(QEasingCurve.Type.OutQuad)

        self.show()
        self._opacity_anim.start()

        # Auto-dismiss
        QTimer.singleShot(duration, self._fade_out)

    def _reposition(self) -> None:
        parent = self.parentWidget()
        if parent:
            margin = 16
            top_left = parent.window().mapToGlobal(parent.window().rect().topLeft())
            x = top_left.x() + parent.window().width() - self.width() - margin
            y = top_left.y() + parent.window().height() - self.height() - 90
            self.move(x, y)

    def _fade_out(self) -> None:
        anim = QPropertyAnimation(self, b"windowOpacity")
        anim.setDuration(300)
        anim.setStartValue(1.0)
        anim.setEndValue(0.0)
        anim.setEasingCurve(QEasingCurve.Type.InQuad)
        anim.finished.connect(self.deleteLater)
        anim.start()
        self._fade_anim = anim


def show_toast(parent: QWidget, message: str,
               kind: str = "info", duration: int = 3000) -> Toast:
    t = Toast(parent, message, kind, duration)
    return t
