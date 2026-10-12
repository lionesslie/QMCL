"""QMCL — Bottom action bar with animated Play button."""
from __future__ import annotations

import math

from PySide6.QtCore import (
    Property, QEasingCurve, QPointF, QPropertyAnimation, QRectF,
    Qt, QTimer,
)
from PySide6.QtGui import (
    QColor, QFont, QLinearGradient, QPainter, QPen, QRadialGradient,
)
from PySide6.QtWidgets import (
    QHBoxLayout, QLabel, QSizePolicy, QWidget,
)

from ui.icons import get_icon


class PlayButton(QWidget):
    """Custom animated play button with pulse glow and ripple."""

    clicked = None   # set by owner

    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self.setFixedSize(200, 52)
        self.setCursor(Qt.CursorShape.PointingHandCursor)

        self._glow = 0.0
        self._ripple_radius = 0.0
        self._ripple_alpha = 0.0
        self._hovered = False
        self._disabled = False
        self._text = "PLAY"

        # Pulse animation
        self._pulse_anim = QPropertyAnimation(self, b"glow_value")
        self._pulse_anim.setStartValue(0.4)
        self._pulse_anim.setEndValue(1.0)
        self._pulse_anim.setDuration(1400)
        self._pulse_anim.setEasingCurve(QEasingCurve.Type.SineCurve)
        self._pulse_anim.setLoopCount(-1)
        self._pulse_anim.start()

        self._ripple_timer = QTimer(self)
        self._ripple_timer.setInterval(16)
        self._ripple_timer.timeout.connect(self._advance_ripple)

    # ── Qt property for animation ─────────────────────────────────────────────

    def get_glow_value(self) -> float:
        return self._glow

    def set_glow_value(self, v: float) -> None:
        self._glow = v
        self.update()

    glow_value = Property(float, get_glow_value, set_glow_value)

    # ── Ripple ────────────────────────────────────────────────────────────────

    def _start_ripple(self) -> None:
        self._ripple_radius = 0.0
        self._ripple_alpha = 0.5
        self._ripple_timer.start()

    def _advance_ripple(self) -> None:
        self._ripple_radius += 6
        self._ripple_alpha -= 0.03
        if self._ripple_alpha <= 0 or self._ripple_radius > 200:
            self._ripple_timer.stop()
            self._ripple_alpha = 0
        self.update()

    # ── Mouse events ──────────────────────────────────────────────────────────

    def mousePressEvent(self, event) -> None:
        if not self._disabled and event.button() == Qt.MouseButton.LeftButton:
            self._start_ripple()
            if self.clicked:
                self.clicked()

    def enterEvent(self, event) -> None:
        self._hovered = True
        self.update()

    def leaveEvent(self, event) -> None:
        self._hovered = False
        self.update()

    def set_disabled(self, disabled: bool) -> None:
        self._disabled = disabled
        self.update()

    def set_text(self, text: str) -> None:
        self._text = text
        self.update()

    # ── Paint ─────────────────────────────────────────────────────────────────

    def paintEvent(self, _) -> None:
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)

        w, h = self.width(), self.height()
        rect = QRectF(2, 2, w - 4, h - 4)

        if self._disabled:
            grad = QLinearGradient(0, 0, w, 0)
            grad.setColorAt(0.0, QColor(108, 99, 255, 80))
            grad.setColorAt(1.0, QColor(139, 92, 246, 80))
        elif self._hovered:
            grad = QLinearGradient(0, 0, w, 0)
            grad.setColorAt(0.0, QColor(124, 114, 255))
            grad.setColorAt(1.0, QColor(155, 108, 255))
        else:
            grad = QLinearGradient(0, 0, w, 0)
            grad.setColorAt(0.0, QColor(108, 99, 255))
            grad.setColorAt(1.0, QColor(139, 92, 246))

        # Glow shadow
        if not self._disabled:
            glow_alpha = int(self._glow * 80)
            for i in range(4, 0, -1):
                shadow_rect = QRectF(2 - i * 2, 2 - i * 2,
                                     w - 4 + i * 4, h - 4 + i * 4)
                glow_c = QColor(108, 99, 255, glow_alpha // i)
                pen = QPen(glow_c, 1)
                p.setPen(pen)
                p.setBrush(Qt.BrushStyle.NoBrush)
                p.drawRoundedRect(shadow_rect, 14, 14)

        p.setPen(Qt.PenStyle.NoPen)
        p.setBrush(grad)
        p.drawRoundedRect(rect, 14, 14)

        # Ripple
        if self._ripple_alpha > 0:
            rp_c = QColor(255, 255, 255, int(self._ripple_alpha * 120))
            rp_grad = QRadialGradient(w / 2, h / 2, self._ripple_radius)
            rp_grad.setColorAt(0, rp_c)
            rp_grad.setColorAt(1, QColor(255, 255, 255, 0))
            p.setBrush(rp_grad)
            p.drawRoundedRect(rect, 14, 14)

        # Play icon + text
        icon_px = get_icon("play", "#FFFFFF", 16).pixmap(16, 16)
        icon_x = int(w / 2 - 52)
        icon_y = int(h / 2 - 8)
        p.drawPixmap(icon_x, icon_y, icon_px)

        font = QFont("Inter", 13, QFont.Weight.Bold)
        font.setLetterSpacing(QFont.SpacingType.AbsoluteSpacing, 1.5)
        p.setFont(font)
        text_color = (QColor(255, 255, 255, 100)
                      if self._disabled else QColor(255, 255, 255))
        p.setPen(text_color)
        p.drawText(QRectF(icon_x + 24, 0, w, h),
                   Qt.AlignmentFlag.AlignVCenter, self._text)

        p.end()


class BottomBar(QWidget):
    """Bottom status + play bar."""

    play_clicked = None   # set externally

    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self.setObjectName("BottomBar")
        self.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        self.setFixedHeight(72)

        layout = QHBoxLayout(self)
        layout.setContentsMargins(20, 0, 20, 0)
        layout.setSpacing(12)

        # Instance info
        inst_icon = QLabel()
        inst_icon.setPixmap(get_icon("layers", "#A0A0A8", 14).pixmap(14, 14))
        layout.addWidget(inst_icon)

        self.instance_label = QLabel("No instance selected")
        self.instance_label.setStyleSheet(
            "color: #A0A0A8; font-size: 13px; font-weight: 500;")
        layout.addWidget(self.instance_label)

        layout.addSpacing(20)

        # Account info
        acc_icon = QLabel()
        acc_icon.setPixmap(get_icon("user-circle", "#A0A0A8", 14).pixmap(14, 14))
        layout.addWidget(acc_icon)

        self.account_label = QLabel("Not logged in")
        self.account_label.setStyleSheet(
            "color: #A0A0A8; font-size: 13px; font-weight: 500;")
        layout.addWidget(self.account_label)

        layout.addStretch()

        # Status label
        self.status_label = QLabel("")
        self.status_label.setStyleSheet(
            "color: #6C63FF; font-size: 12px; font-weight: 500;")
        layout.addWidget(self.status_label)

        layout.addSpacing(12)

        # Play button
        self.play_btn = PlayButton()
        self.play_btn.clicked = self._on_play
        layout.addWidget(self.play_btn)

    def _on_play(self) -> None:
        if self.play_clicked:
            self.play_clicked()

    def set_instance(self, name: str) -> None:
        self.instance_label.setText(name or "No instance selected")

    def set_account(self, name: str) -> None:
        self.account_label.setText(name or "Not logged in")

    def set_status(self, text: str) -> None:
        self.status_label.setText(text)

    def set_play_enabled(self, enabled: bool) -> None:
        self.play_btn.set_disabled(not enabled)

    def set_play_text(self, text: str) -> None:
        self.play_btn.set_text(text)
