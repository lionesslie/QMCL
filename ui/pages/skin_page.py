"""QMCL — Skin page: upload, preview skin."""
from __future__ import annotations

from pathlib import Path

from PySide6.QtCore import Qt
from PySide6.QtGui import QColor, QPainter, QPixmap
from PySide6.QtWidgets import (
    QFileDialog, QHBoxLayout, QLabel, QPushButton,
    QSizePolicy, QVBoxLayout, QWidget,
)

from ui.icons import get_icon


class _SkinPreview(QWidget):
    """Simple 2D skin preview (front face)."""

    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self.setFixedSize(200, 340)
        self._skin_px: QPixmap | None = None

    def set_skin(self, path: str) -> None:
        px = QPixmap(path)
        if not px.isNull():
            self._skin_px = px
            self.update()

    def paintEvent(self, _) -> None:
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)

        # Draw dark background
        p.setBrush(QColor(30, 30, 38))
        p.setPen(Qt.PenStyle.NoPen)
        p.drawRoundedRect(self.rect(), 16, 16)

        if self._skin_px:
            # Minecraft skin layout: head 8x8 at (8,8), body 8x12 at (20,20)
            src_w = self._skin_px.width()
            src_h = self._skin_px.height()
            scale = src_w / 64.0

            s = 4  # display scale per pixel

            def draw_section(src_x, src_y, w, h, dst_x, dst_y):
                section = self._skin_px.copy(
                    int(src_x * scale), int(src_y * scale),
                    int(w * scale), int(h * scale))
                section = section.scaled(
                    w * s, h * s,
                    Qt.AspectRatioMode.IgnoreAspectRatio,
                    Qt.TransformationMode.FastTransformation)
                p.drawPixmap(dst_x, dst_y, section)

            cx = self.width() // 2
            head_x = cx - 4 * s
            head_y = 20

            # Head
            draw_section(8, 8, 8, 8, head_x, head_y)
            # Body
            draw_section(20, 20, 8, 12, head_x, head_y + 8 * s)
            # Arms
            draw_section(44, 20, 4, 12, head_x - 4 * s, head_y + 8 * s)
            draw_section(36, 52, 4, 12, head_x + 8 * s, head_y + 8 * s)
            # Legs
            draw_section(4, 20, 4, 12, head_x, head_y + 20 * s)
            draw_section(20, 52, 4, 12, head_x + 4 * s, head_y + 20 * s)
        else:
            p.setPen(QColor(160, 160, 168))
            p.drawText(self.rect(),
                       Qt.AlignmentFlag.AlignCenter,
                       "No skin loaded")
        p.end()


class SkinPage(QWidget):
    def __init__(self, parent=None) -> None:
        super().__init__(parent)

        root = QHBoxLayout(self)
        root.setContentsMargins(32, 28, 32, 28)
        root.setSpacing(32)

        # ── Left: preview ─────────────────────────────────────────────────────
        left = QVBoxLayout()
        left.setSpacing(16)

        title = QLabel("Skin")
        title.setObjectName("H1")
        left.addWidget(title)

        self.preview = _SkinPreview()
        left.addWidget(self.preview,
                       alignment=Qt.AlignmentFlag.AlignHCenter)
        left.addStretch()
        root.addLayout(left)

        # ── Right: controls ───────────────────────────────────────────────────
        right = QVBoxLayout()
        right.setSpacing(16)

        ctrl_title = QLabel("Skin Settings")
        ctrl_title.setObjectName("H3")
        right.addWidget(ctrl_title)

        upload_btn = QPushButton()
        upload_btn.setObjectName("SecondaryBtn")
        upload_btn.setIcon(get_icon("upload-simple", "#F5F5F7", 16))
        upload_btn.setText("  Upload Skin PNG")
        upload_btn.setFixedWidth(200)
        upload_btn.clicked.connect(self._upload_skin)
        right.addWidget(upload_btn)

        reset_btn = QPushButton()
        reset_btn.setObjectName("IconBtn")
        reset_btn.setIcon(get_icon("arrows-clockwise", "#A0A0A8", 14))
        reset_btn.setText("  Reset to default")
        reset_btn.setFixedWidth(200)
        reset_btn.clicked.connect(lambda: self.preview.set_skin(""))
        right.addWidget(reset_btn)

        right.addStretch()

        info = QLabel(
            "Skin changes apply the next time you launch the game.\n"
            "Only PNG format is supported (64×64 or 64×32 pixels).")
        info.setObjectName("Muted")
        info.setWordWrap(True)
        right.addWidget(info)

        root.addLayout(right)
        root.addStretch()

    def _upload_skin(self) -> None:
        path, _ = QFileDialog.getOpenFileName(
            self, "Select Skin PNG", "",
            "PNG Images (*.png)")
        if path:
            self.preview.set_skin(path)
