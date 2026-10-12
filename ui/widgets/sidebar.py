"""QMCL — Collapsible sidebar with animated width."""
from __future__ import annotations

from PySide6.QtCore import (
    QEasingCurve, QPropertyAnimation, QSize, Qt, Signal,
)
from PySide6.QtGui import QFont
from PySide6.QtWidgets import (
    QHBoxLayout, QLabel, QPushButton, QSizePolicy,
    QSpacerItem, QVBoxLayout, QWidget,
)

from ui.icons import get_icon

EXPANDED_WIDTH = 220
COLLAPSED_WIDTH = 64


class SidebarButton(QPushButton):
    def __init__(self, icon_name: str, label: str, parent=None) -> None:
        super().__init__(parent)
        self.setObjectName("SidebarBtn")
        self._icon_name = icon_name
        self._label = label
        self._expanded = True
        self._active = False
        self._rebuild()

    def _rebuild(self) -> None:
        self.setIcon(get_icon(
            self._icon_name,
            "#8B5CF6" if self._active else "#A0A0A8",
            18
        ))
        self.setIconSize(QSize(18, 18))
        if self._expanded:
            self.setText(f"  {self._label}")
            self.setFixedHeight(40)
            self.setFixedWidth(EXPANDED_WIDTH - 16)
        else:
            self.setText("")
            self.setFixedHeight(40)
            self.setFixedWidth(COLLAPSED_WIDTH - 16)
            self.setToolTip(self._label)

    def set_active(self, active: bool) -> None:
        self._active = active
        self.setProperty("active", "true" if active else "false")
        self.style().unpolish(self)
        self.style().polish(self)
        self._rebuild()

    def set_expanded(self, expanded: bool) -> None:
        self._expanded = expanded
        self._rebuild()


class Sidebar(QWidget):
    page_changed = Signal(str)      # emits page id

    PAGES = [
        ("home",      "house",        "Home"),
        ("instances", "layers",       "Instances"),
        ("skin",      "user-circle",  "Skin"),
        ("store",     "package",      "Store"),
    ]

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setObjectName("Sidebar")
        self.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        self.setMinimumWidth(EXPANDED_WIDTH)
        self.setMaximumWidth(EXPANDED_WIDTH)
        self._expanded = True
        self._current_page = "home"
        self._buttons: dict[str, SidebarButton] = {}

        outer = QVBoxLayout(self)
        outer.setContentsMargins(8, 16, 8, 16)
        outer.setSpacing(4)

        for page_id, icon_name, label in self.PAGES:
            btn = SidebarButton(icon_name, label)
            btn.clicked.connect(lambda _=False, pid=page_id: self._select(pid))
            self._buttons[page_id] = btn
            outer.addWidget(btn, alignment=Qt.AlignmentFlag.AlignHCenter)

        outer.addStretch()

        # Collapse toggle
        self._toggle_btn = QPushButton()
        self._toggle_btn.setObjectName("CollapseBtn")
        self._toggle_btn.setIcon(get_icon("chevron-left", "#A0A0A8", 16))
        self._toggle_btn.setFixedSize(36, 36)
        self._toggle_btn.setToolTip("Collapse sidebar")
        self._toggle_btn.clicked.connect(self._toggle_collapse)
        outer.addWidget(self._toggle_btn, alignment=Qt.AlignmentFlag.AlignHCenter)

        # Start on home
        self._select("home")

        # Animation
        self._anim = QPropertyAnimation(self, b"maximumWidth")
        self._anim.setDuration(220)
        self._anim.setEasingCurve(QEasingCurve.Type.InOutCubic)

        self._anim2 = QPropertyAnimation(self, b"minimumWidth")
        self._anim2.setDuration(220)
        self._anim2.setEasingCurve(QEasingCurve.Type.InOutCubic)

    def _select(self, page_id: str) -> None:
        for pid, btn in self._buttons.items():
            btn.set_active(pid == page_id)
        self._current_page = page_id
        self.page_changed.emit(page_id)

    def _toggle_collapse(self) -> None:
        self._expanded = not self._expanded
        target = EXPANDED_WIDTH if self._expanded else COLLAPSED_WIDTH

        self._anim.setStartValue(self.width())
        self._anim.setEndValue(target)
        self._anim2.setStartValue(self.width())
        self._anim2.setEndValue(target)
        self._anim.start()
        self._anim2.start()

        for btn in self._buttons.values():
            btn.set_expanded(self._expanded)

        self._toggle_btn.setIcon(get_icon(
            "chevron-left" if self._expanded else "chevron-right",
            "#A0A0A8", 16
        ))
        self._toggle_btn.setToolTip(
            "Collapse sidebar" if self._expanded else "Expand sidebar"
        )

    def set_current(self, page_id: str) -> None:
        """Highlight a page without emitting page_changed."""
        for pid, btn in self._buttons.items():
            btn.set_active(pid == page_id)
        self._current_page = page_id

    def navigate(self, page_id: str) -> None:
        self.set_current(page_id)
