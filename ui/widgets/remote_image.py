"""QMCL — RemoteImage: async-loaded, disk-cached, rounded thumbnail."""
from __future__ import annotations

import hashlib

import requests
from PySide6.QtCore import QByteArray, QThreadPool, Qt
from PySide6.QtGui import QColor, QGuiApplication, QPainter, QPainterPath, QPixmap
from PySide6.QtSvg import QSvgRenderer
from PySide6.QtWidgets import QLabel

from core.constants import DATA_DIR
from ui.icons import get_pixmap
from ui.workers import SimpleWorker

_CACHE_DIR = DATA_DIR / "cache" / "images"
_CACHE_DIR.mkdir(parents=True, exist_ok=True)
_MAX_BYTES = 6 * 1024 * 1024

# Dedicated pool so thumbnails never starve search / install workers.
_POOL = QThreadPool()
_POOL.setMaxThreadCount(6)

# Keep workers alive until their queued signals have been delivered.
_ACTIVE: set = set()


def _fetch(url: str) -> tuple[str, bytes]:
    """Runs in a worker thread: disk cache first, then HTTP."""
    cache_file = _CACHE_DIR / hashlib.sha1(url.encode("utf-8")).hexdigest()
    if cache_file.exists() and cache_file.stat().st_size > 0:
        return url, cache_file.read_bytes()
    r = requests.get(url, timeout=15, headers={"User-Agent": "QMCL/1.0.0"})
    r.raise_for_status()
    data = r.content
    if len(data) > _MAX_BYTES:
        raise ValueError("image too large")
    cache_file.write_bytes(data)
    return url, data


def _decode(data: bytes) -> QPixmap:
    px = QPixmap()
    if px.loadFromData(data):
        return px
    renderer = QSvgRenderer(QByteArray(data))          # SVG icons
    if renderer.isValid():
        px = QPixmap(256, 256)
        px.fill(Qt.GlobalColor.transparent)
        p = QPainter(px)
        renderer.render(p)
        p.end()
        return px
    return QPixmap()


class RemoteImage(QLabel):
    """Square thumbnail with rounded corners that loads itself from a URL."""

    def __init__(self, size: int = 64, radius: int = 12,
                 parent=None) -> None:
        super().__init__(parent)
        self._size = size
        self._radius = radius
        self._url = ""
        self.setFixedSize(size, size)
        self.setStyleSheet("background: transparent; border: none;")
        self.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.setPixmap(self._placeholder())

    # ── Painting helpers ──────────────────────────────────────────────────────

    def _dpr(self) -> float:
        screen = QGuiApplication.primaryScreen()
        return screen.devicePixelRatio() if screen else 1.0

    def _canvas(self) -> tuple[QPixmap, int]:
        dpr = self._dpr()
        target = int(self._size * dpr)
        out = QPixmap(target, target)
        out.fill(Qt.GlobalColor.transparent)
        out.setDevicePixelRatio(dpr)
        return out, target

    def _placeholder(self) -> QPixmap:
        out, _ = self._canvas()
        p = QPainter(out)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        p.setPen(Qt.PenStyle.NoPen)
        p.setBrush(QColor(108, 99, 255, 30))
        p.drawRoundedRect(0, 0, self._size, self._size,
                          self._radius, self._radius)
        icon_size = self._size // 2
        icon = get_pixmap("puzzle-piece", "#6C63FF", icon_size)
        off = (self._size - icon_size) // 2
        p.drawPixmap(off, off, icon_size, icon_size, icon)
        p.end()
        return out

    def _rounded(self, src: QPixmap) -> QPixmap:
        out, target = self._canvas()
        scaled = src.scaled(target, target,
                            Qt.AspectRatioMode.KeepAspectRatioByExpanding,
                            Qt.TransformationMode.SmoothTransformation)
        x = (scaled.width() - target) // 2
        y = (scaled.height() - target) // 2
        scaled = scaled.copy(x, y, target, target)

        p = QPainter(out)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        p.setRenderHint(QPainter.RenderHint.SmoothPixmapTransform)
        path = QPainterPath()
        path.addRoundedRect(0, 0, self._size, self._size,
                            self._radius, self._radius)
        p.setClipPath(path)
        p.drawPixmap(0, 0, self._size, self._size, scaled)
        p.end()
        return out

    # ── Loading ───────────────────────────────────────────────────────────────

    def load(self, url: str | None) -> None:
        self._url = url or ""
        if not self._url.startswith(("http://", "https://")):
            self.setPixmap(self._placeholder())
            return
        worker = SimpleWorker(_fetch, self._url)
        worker.signals.finished.connect(self._on_loaded)
        worker.signals.error.connect(lambda _e: None)
        _ACTIVE.add(worker)
        worker.signals.finished.connect(lambda _r, w=worker: _ACTIVE.discard(w))
        worker.signals.error.connect(lambda _e, w=worker: _ACTIVE.discard(w))
        _POOL.start(worker)

    def _on_loaded(self, result) -> None:
        url, data = result
        if url != self._url:            # widget was re-used for another URL
            return
        px = _decode(data)
        if not px.isNull():
            self.setPixmap(self._rounded(px))
