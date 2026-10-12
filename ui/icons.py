"""QMCL — Inline SVG icon set (Phosphor-style, outline weight 1.5).

All icons rendered via QSvgRenderer → QPixmap → QIcon.
Color is injected at load time so icons adapt to any tint.
"""
from __future__ import annotations

from PySide6.QtCore import QByteArray, QSize, Qt
from PySide6.QtGui import QColor, QIcon, QPainter, QPixmap
from PySide6.QtSvg import QSvgRenderer


_ICONS: dict[str, str] = {
    "house": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77Z"/></svg>',
    "layers": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><polygon points="128 16 232 72 128 128 24 72 128 16"/><polyline points="24 128 128 184 232 128"/><polyline points="24 184 128 240 232 184"/></svg>',
    "user-circle": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><circle cx="128" cy="128" r="96"/><circle cx="128" cy="96" r="40"/><path d="M25,211.86A96,96,0,0,1,224,211.86"/></svg>',
    "gear": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><circle cx="128" cy="128" r="40"/><path d="M130.05,16h-4.1a12,12,0,0,0-11.9,10.49L112,40.54a80.59,80.59,0,0,0-16.83,7l-11.62-7.56A12,12,0,0,0,68.28,41.9L65.37,44.81a12,12,0,0,0-.93,15.27L71,72.7A81.17,81.17,0,0,0,64,89.53l-14.07,2.06A12,12,0,0,0,40,103.48v4.1a12,12,0,0,0,10.49,11.9L54,119.5l.51,4a80.4,80.4,0,0,0,7,16.83l-7.56,11.62A12,12,0,0,0,55,167.23l2.91,2.91a12,12,0,0,0,15.27.93L85.3,164a80.4,80.4,0,0,0,16.83,7l2.06,14.07A12,12,0,0,0,116.1,195h4.1a12,12,0,0,0,11.9-10.49l2.06-14.07a80.4,80.4,0,0,0,16.83-7l11.62,7.56a12,12,0,0,0,15.27-.93l2.91-2.91a12,12,0,0,0,.93-15.27l-7.56-11.62a80.59,80.59,0,0,0,7-16.83l14.07-2.06A12,12,0,0,0,205.5,128.52v-4.1a12,12,0,0,0-10.49-11.9l-14.07-2.06a80.59,80.59,0,0,0-7-16.83l7.56-11.62a12,12,0,0,0-.93-15.27l-2.91-2.91a12,12,0,0,0-15.27-.93l-11.62,7.56a80.59,80.59,0,0,0-16.83-7l-2.06-14.07A12,12,0,0,0,130.05,16Z"/></svg>',
    "bell": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><path d="M208,192H48a16,16,0,0,1-12.83-25.58C40.81,159.59,48,148.31,48,128a80,80,0,0,1,160,0c0,20.31,7.19,31.59,12.83,38.42A16,16,0,0,1,208,192Z"/><path d="M96,192v8a32,32,0,0,0,64,0v-8"/></svg>',
    "minus": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="20" stroke-linecap="round"><line x1="40" y1="128" x2="216" y2="128"/></svg>',
    "square": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"><rect x="40" y="40" width="176" height="176" rx="8"/></svg>',
    "x": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="20" stroke-linecap="round"><line x1="200" y1="56" x2="56" y2="200"/><line x1="56" y1="56" x2="200" y2="200"/></svg>',
    "chevron-left": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"><polyline points="160 208 80 128 160 48"/></svg>',
    "chevron-right": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"><polyline points="96 48 176 128 96 208"/></svg>',
    "plus": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="20" stroke-linecap="round"><line x1="40" y1="128" x2="216" y2="128"/><line x1="128" y1="40" x2="128" y2="216"/></svg>',
    "dots-three-vertical": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="COLOR"><circle cx="128" cy="60" r="16"/><circle cx="128" cy="128" r="16"/><circle cx="128" cy="196" r="16"/></svg>',
    "magnifying-glass": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><circle cx="112" cy="112" r="80"/><line x1="168.57" y1="168.57" x2="224" y2="224"/></svg>',
    "funnel": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><polygon points="40 40 216 40 152 128 152 216 104 184 104 128 40 40"/></svg>',
    "puzzle-piece": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><path d="M103.33,104H24V208H128V128.67"/><path d="M152.67,152H232V48H128v79.33"/><circle cx="104" cy="152" r="24"/><circle cx="152" cy="104" r="24"/></svg>',
    "pencil": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><path d="M92,216H48a8,8,0,0,1-8-8V164a8,8,0,0,1,2.34-5.66l120-120a8,8,0,0,1,11.32,0l44,44a8,8,0,0,1,0,11.32l-120,120A8,8,0,0,1,92,216Z"/><line x1="136" y1="64" x2="192" y2="120"/></svg>',
    "copy": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><rect x="40" y="88" width="128" height="128" rx="8"/><path d="M88,88V56a8,8,0,0,1,8-8H216a8,8,0,0,1,8,8V176a8,8,0,0,1-8,8H184"/></svg>',
    "trash": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><polyline points="216 60 40 60"/><rect x="88" y="20" width="80" height="40" rx="8"/><path d="M200,60l-16,152a8,8,0,0,1-8,8H80a8,8,0,0,1-8-8L56,60"/><line x1="128" y1="104" x2="128" y2="176"/><line x1="96" y1="104" x2="100" y2="176"/><line x1="160" y1="104" x2="156" y2="176"/></svg>',
    "download": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><path d="M128,24V184"/><path d="M56,152l72,72,72-72"/><path d="M24,208H232"/></svg>',
    "upload-simple": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><path d="M128,224V88"/><path d="M56,152l72-72,72,72"/><path d="M24,208H232"/></svg>',
    "play": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="COLOR"><polygon points="40 24 216 128 40 232 40 24"/></svg>',
    "star": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><polygon points="128 24 159 90 232 101 180 152 193 225 128 192 63 225 76 152 24 101 97 90 128 24"/></svg>',
    "cube": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><path d="M32,90.49l96,55.71L224,90.49"/><path d="M128,224V146.2"/><path d="M211.19,73.22l-83.2-48a8,8,0,0,0-7.98,0l-83.2,48a8,8,0,0,0-4.01,6.93V175.85a8,8,0,0,0,4.01,6.93l83.2,48a8,8,0,0,0,7.98,0l83.2-48a8,8,0,0,0,4.01-6.93V80.15A8,8,0,0,0,211.19,73.22Z"/></svg>',
    "info": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><circle cx="128" cy="128" r="96"/><line x1="128" y1="176" x2="128" y2="120"/><circle cx="128" cy="84" r="4" fill="COLOR" stroke="none"/></svg>',
    "sign-out": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><path d="M112,216H64a16,16,0,0,1-16-16V56A16,16,0,0,1,64,40h48"/><polyline points="168 176 224 128 168 80"/><line x1="96" y1="128" x2="224" y2="128"/></svg>',
    "cpu": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><rect x="64" y="64" width="128" height="128" rx="8"/><rect x="96" y="96" width="64" height="64"/><line x1="96" y1="40" x2="96" y2="64"/><line x1="128" y1="40" x2="128" y2="64"/><line x1="160" y1="40" x2="160" y2="64"/><line x1="96" y1="192" x2="96" y2="216"/><line x1="128" y1="192" x2="128" y2="216"/><line x1="160" y1="192" x2="160" y2="216"/><line x1="40" y1="96" x2="64" y2="96"/><line x1="40" y1="128" x2="64" y2="128"/><line x1="40" y1="160" x2="64" y2="160"/><line x1="192" y1="96" x2="216" y2="96"/><line x1="192" y1="128" x2="216" y2="128"/><line x1="192" y1="160" x2="216" y2="160"/></svg>',
    "folder-open": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><path d="M232,208H32a8,8,0,0,1-8-8V64a8,8,0,0,1,8-8H104l24,32h80a8,8,0,0,1,8,8V96"/><path d="M24,200l28.69-92.21A8,8,0,0,1,60.28,102H247.06a8,8,0,0,1,7.65,10.29L228,200"/></svg>',
    "image": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><rect x="32" y="48" width="192" height="160" rx="8"/><circle cx="156" cy="100" r="20"/><path d="M32,168l50-50a8,8,0,0,1,11.31,0L148,172.69A8,8,0,0,0,159.31,172.69L180,152a8,8,0,0,1,11.31,0L224,184"/></svg>',
    "globe": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><circle cx="128" cy="128" r="96"/><line x1="32" y1="128" x2="224" y2="128"/><ellipse cx="128" cy="128" rx="40" ry="96"/></svg>',
    "fire": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><path d="M96,216a80,80,0,1,1,124.29-69.78C215,183.72,189,208,160,208c-17.67,0-32-8-32-16,0-12,14-16,14-32a34,34,0,0,0-34-34c-10,0-28,6-28,38A79.31,79.31,0,0,0,96,216Z"/></svg>',
    "leaf": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><path d="M64,216s0-112,64-112c47.86,0,80-64,80-64s-48,16-80,48S64,152,64,216Z"/><line x1="64" y1="216" x2="192" y2="88"/></svg>',
    "package": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><path d="M224,167.68V88.32a8,8,0,0,0-4.07-6.98l-88-48.09a8,8,0,0,0-7.86,0l-88,48.09A8,8,0,0,0,32,88.32v79.36a8,8,0,0,0,4.07,6.98l88,48.09a8,8,0,0,0,7.86,0l88-48.09A8,8,0,0,0,224,167.68Z"/><line x1="128" y1="136" x2="128" y2="224"/><path d="M32.07,93.08,128,144l95.93-50.92"/><line x1="80" y1="69" x2="176" y2="117.29"/></svg>',
    "arrows-clockwise": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><polyline points="224 64 224 128 160 128"/><path d="M32,176a96,96,0,0,1,167.36-64.07L224,128"/><polyline points="32 192 32 128 96 128"/><path d="M224,80A96,96,0,0,1,56.64,144.07L32,128"/></svg>',
    "check-circle": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><circle cx="128" cy="128" r="96"/><polyline points="88 136 112 160 168 104"/></svg>',
    "users-three": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><circle cx="128" cy="96" r="40"/><path d="M24,208a104,104,0,0,1,208,0"/><circle cx="32" cy="128" r="28"/><path d="M4,192A56.07,56.07,0,0,1,60,152"/><circle cx="224" cy="128" r="28"/><path d="M252,192A56.07,56.07,0,0,0,196,152"/></svg>',
    "paint-brush": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><path d="M232,24c-52,0-88,76.75-106.06,122.75C107.06,182,88,200,64,200a40,40,0,0,0,0,80,16,16,0,0,0,16-16V248h16a40,40,0,0,0,40-40c0-24,18-43.06,53.25-61.94C235.25,112,256,76,256,24Z"/><circle cx="164" cy="92" r="12" fill="COLOR" stroke="none"/></svg>',
    "sliders": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><line x1="40" y1="128" x2="216" y2="128"/><circle cx="160" cy="128" r="24"/><line x1="40" y1="64" x2="216" y2="64"/><circle cx="96" cy="64" r="24"/><line x1="40" y1="192" x2="216" y2="192"/><circle cx="128" cy="192" r="24"/></svg>',
    "clock": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><circle cx="128" cy="128" r="96"/><polyline points="128 72 128 128 168 168"/></svg>',
    "sort-ascending": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="COLOR" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><line x1="40" y1="128" x2="148" y2="128"/><line x1="40" y1="64" x2="180" y2="64"/><line x1="40" y1="192" x2="116" y2="192"/><polyline points="184 152 216 184 184 216"/><line x1="216" y1="184" x2="216" y2="40"/></svg>',
}


def _colorize_svg(svg: str, color: str) -> bytes:
    return svg.replace("COLOR", color).encode("utf-8")


def get_icon(name: str, color: str = "#A0A0A8", size: int = 20) -> QIcon:
    """Return a QIcon for the given icon name, tinted to *color*."""
    svg_str = _ICONS.get(name)
    if not svg_str:
        # Return empty icon if name not found
        px = QPixmap(size, size)
        px.fill(Qt.GlobalColor.transparent)
        return QIcon(px)

    svg_bytes = _colorize_svg(svg_str, color)
    renderer = QSvgRenderer(QByteArray(svg_bytes))

    px = QPixmap(size, size)
    px.fill(Qt.GlobalColor.transparent)
    painter = QPainter(px)
    renderer.render(painter)
    painter.end()
    return QIcon(px)


def get_pixmap(name: str, color: str = "#A0A0A8", size: int = 20) -> QPixmap:
    svg_str = _ICONS.get(name)
    if not svg_str:
        px = QPixmap(size, size)
        px.fill(Qt.GlobalColor.transparent)
        return px

    svg_bytes = _colorize_svg(svg_str, color)
    renderer = QSvgRenderer(QByteArray(svg_bytes))

    px = QPixmap(size, size)
    px.fill(Qt.GlobalColor.transparent)
    painter = QPainter(px)
    renderer.render(painter)
    painter.end()
    return px
