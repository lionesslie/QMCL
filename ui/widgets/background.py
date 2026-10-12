"""QMCL — Animated background: gradient blobs + particle system."""
from __future__ import annotations

import math
import random
from dataclasses import dataclass, field

from PySide6.QtCore import QPointF, QRectF, Qt, QTimer
from PySide6.QtGui import (
    QColor, QLinearGradient, QPainter, QPainterPath,
    QRadialGradient,
)
from PySide6.QtWidgets import QWidget


@dataclass
class _Blob:
    x: float
    y: float
    vx: float
    vy: float
    radius: float
    color_a: QColor
    color_b: QColor
    phase: float
    speed: float


@dataclass
class _Particle:
    x: float
    y: float
    vy: float
    alpha: float
    size: float
    color: QColor


class BackgroundCanvas(QWidget):
    """Full-window animated background painted purely in QPainter."""

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)
        self.setAttribute(Qt.WidgetAttribute.WA_NoSystemBackground)

        self._blobs: list[_Blob] = []
        self._particles: list[_Particle] = []
        self._frame = 0

        self._timer = QTimer(self)
        self._timer.setInterval(16)   # ~60 fps
        self._timer.timeout.connect(self._tick)
        self._timer.start()

    # ── Initialise scene ─────────────────────────────────────────────────────

    def _init_blobs(self) -> None:
        w, h = self.width(), self.height()
        palette = [
            (QColor(108, 99, 255, 55), QColor(139, 92, 246, 35)),
            (QColor(34, 211, 238, 40), QColor(108, 99, 255, 30)),
            (QColor(139, 92, 246, 45), QColor(34, 211, 238, 25)),
        ]
        self._blobs = []
        for i in range(3):
            ca, cb = palette[i % len(palette)]
            self._blobs.append(_Blob(
                x=random.uniform(0.1, 0.9) * w,
                y=random.uniform(0.1, 0.9) * h,
                vx=random.uniform(-0.12, 0.12),
                vy=random.uniform(-0.08, 0.08),
                radius=random.uniform(200, 340),
                color_a=ca,
                color_b=cb,
                phase=random.uniform(0, math.pi * 2),
                speed=random.uniform(0.003, 0.007),
            ))

    def _init_particles(self, count: int = 45) -> None:
        w, h = self.width(), self.height()
        self._particles = []
        colors = [
            QColor(108, 99, 255),
            QColor(34, 211, 238),
            QColor(139, 92, 246),
        ]
        for _ in range(count):
            self._particles.append(_Particle(
                x=random.uniform(0, w),
                y=random.uniform(0, h),
                vy=random.uniform(-0.25, -0.06),
                alpha=random.uniform(0.04, 0.18),
                size=random.uniform(1.5, 3.5),
                color=random.choice(colors),
            ))

    # ── Animation tick ───────────────────────────────────────────────────────

    def _tick(self) -> None:
        self._frame += 1
        w, h = self.width(), self.height()

        for blob in self._blobs:
            blob.phase += blob.speed
            blob.x += blob.vx + math.sin(blob.phase) * 0.35
            blob.y += blob.vy + math.cos(blob.phase * 0.7) * 0.25
            # bounce
            if blob.x < -blob.radius:
                blob.x = w + blob.radius
            elif blob.x > w + blob.radius:
                blob.x = -blob.radius
            if blob.y < -blob.radius:
                blob.y = h + blob.radius
            elif blob.y > h + blob.radius:
                blob.y = -blob.radius

        for p in self._particles:
            p.y += p.vy
            if p.y < -10:
                p.y = h + 5
                p.x = random.uniform(0, w)

        self.update()

    # ── Paint ────────────────────────────────────────────────────────────────

    def paintEvent(self, _event) -> None:
        if not self._blobs:
            self._init_blobs()
        if not self._particles:
            self._init_particles()

        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        # Background gradient
        bg_grad = QLinearGradient(0, 0, 0, self.height())
        bg_grad.setColorAt(0.0, QColor(0x12, 0x12, 0x12))
        bg_grad.setColorAt(0.5, QColor(0x18, 0x18, 0x1E))
        bg_grad.setColorAt(1.0, QColor(0x10, 0x10, 0x16))
        painter.fillRect(self.rect(), bg_grad)

        # Blobs
        painter.save()
        painter.setCompositionMode(QPainter.CompositionMode.CompositionMode_Plus)
        for blob in self._blobs:
            rad = QRadialGradient(blob.x, blob.y, blob.radius)
            rad.setColorAt(0.0, blob.color_a)
            rad.setColorAt(1.0, QColor(0, 0, 0, 0))
            path = QPainterPath()
            path.addEllipse(
                QRectF(blob.x - blob.radius, blob.y - blob.radius,
                       blob.radius * 2, blob.radius * 2)
            )
            painter.fillPath(path, rad)
        painter.restore()

        # Particles
        painter.save()
        for p in self._particles:
            c = QColor(p.color)
            c.setAlphaF(p.alpha)
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(c)
            painter.drawEllipse(QPointF(p.x, p.y), p.size, p.size)
        painter.restore()

        painter.end()

    def resizeEvent(self, event) -> None:
        super().resizeEvent(event)
        self._init_blobs()
        self._init_particles()
