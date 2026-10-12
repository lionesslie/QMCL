"""QMCL — Store page: browse and install from Modrinth & CurseForge."""
from __future__ import annotations

from PySide6.QtCore import Qt, QThreadPool, Signal
from PySide6.QtWidgets import (
    QFrame, QHBoxLayout, QLabel, QLineEdit,
    QPushButton, QScrollArea, QSizePolicy, QTabWidget,
    QVBoxLayout, QWidget, QComboBox,
)

from ui.icons import get_icon
from ui.widgets.remote_image import RemoteImage
from ui.workers import SimpleWorker


def _cover_url(data: dict) -> str:
    """Best available cover image URL for a Modrinth / CurseForge hit."""
    url = data.get("icon_url")
    if url:
        return url
    logo = data.get("logo") or {}
    return logo.get("thumbnailUrl") or logo.get("url") or ""


class _ModCard(QWidget):
    install_clicked = Signal(dict)

    def __init__(self, data: dict, source: str = "modrinth",
                 parent=None) -> None:
        super().__init__(parent)
        self.setObjectName("GlassCard")
        self.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        self.setFixedHeight(104)
        self.setSizePolicy(QSizePolicy.Policy.Expanding,
                           QSizePolicy.Policy.Fixed)
        self._data = data
        self._source = source

        layout = QHBoxLayout(self)
        layout.setContentsMargins(16, 12, 16, 12)
        layout.setSpacing(12)

        # Cover image (Modrinth: icon_url, CurseForge: logo.thumbnailUrl)
        self.cover = RemoteImage(size=68, radius=14)
        self.cover.load(_cover_url(data))
        layout.addWidget(self.cover,
                         alignment=Qt.AlignmentFlag.AlignVCenter)

        # Text
        text_col = QVBoxLayout()
        text_col.setSpacing(3)

        name = (data.get("title") or data.get("name", "Unknown"))
        name_lbl = QLabel(name[:50])
        name_lbl.setStyleSheet(
            "color: #F5F5F7; font-size: 14px; font-weight: 600; "
            "background: transparent; border: none;")
        text_col.addWidget(name_lbl)

        desc = data.get("description") or data.get("summary") or ""
        desc_lbl = QLabel(desc[:80] + ("…" if len(desc) > 80 else ""))
        desc_lbl.setStyleSheet(
            "color: #A0A0A8; font-size: 12px; "
            "background: transparent; border: none;")
        text_col.addWidget(desc_lbl)

        meta_row = QHBoxLayout()
        dl = data.get("downloads", data.get("downloadCount", 0))
        dl_icon = QLabel()
        dl_icon.setPixmap(
            get_icon("download", "#A0A0A8", 12).pixmap(12, 12))
        dl_icon.setStyleSheet("background: transparent; border: none;")
        meta_row.addWidget(dl_icon)
        dl_lbl = QLabel(f"{int(dl):,}")
        dl_lbl.setStyleSheet(
            "color: #A0A0A8; font-size: 11px; "
            "background: transparent; border: none;")
        meta_row.addWidget(dl_lbl)
        meta_row.addStretch()
        text_col.addLayout(meta_row)

        layout.addLayout(text_col)
        layout.addStretch()

        # Install button
        inst_btn = QPushButton()
        inst_btn.setObjectName("PrimaryBtn")
        inst_btn.setIcon(get_icon("download", "#FFFFFF", 14))
        inst_btn.setText("  Install")
        inst_btn.setFixedWidth(100)
        inst_btn.clicked.connect(lambda: self.install_clicked.emit(self._data))
        layout.addWidget(inst_btn,
                         alignment=Qt.AlignmentFlag.AlignVCenter)


class StorePage(QWidget):
    install_mod = Signal(dict, str)   # (mod_data, source)

    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self._current_instance_id: str | None = None

        root = QVBoxLayout(self)
        root.setContentsMargins(32, 28, 32, 28)
        root.setSpacing(16)

        # ── Header ────────────────────────────────────────────────────────────
        title = QLabel("Store")
        title.setObjectName("H1")
        root.addWidget(title)

        # ── Search bar ────────────────────────────────────────────────────────
        search_row = QHBoxLayout()

        self.search_edit = QLineEdit()
        self.search_edit.setObjectName("SearchBox")
        self.search_edit.setPlaceholderText("Search mods, modpacks, shaders…")
        self.search_edit.returnPressed.connect(self._do_search)
        search_row.addWidget(self.search_edit)

        self.loader_combo = QComboBox()
        self.loader_combo.addItems(
            ["All Loaders", "fabric", "forge", "quilt", "neoforge"])
        self.loader_combo.setFixedWidth(140)
        search_row.addWidget(self.loader_combo)

        search_btn = QPushButton()
        search_btn.setObjectName("PrimaryBtn")
        search_btn.setIcon(get_icon("magnifying-glass", "#FFFFFF", 14))
        search_btn.setText("  Search")
        search_btn.clicked.connect(self._do_search)
        search_row.addWidget(search_btn)

        root.addLayout(search_row)

        # ── Source tabs ───────────────────────────────────────────────────────
        self.tabs = QTabWidget()
        self.tabs.tabBar().setObjectName("StoreTabBar")

        self.mr_page = self._make_list_page()
        self.cf_page = self._make_list_page()

        modrinth_tab = QWidget()
        ml = QVBoxLayout(modrinth_tab)
        ml.setContentsMargins(0, 8, 0, 0)
        ml.addWidget(self.mr_page)

        cf_tab = QWidget()
        cl = QVBoxLayout(cf_tab)
        cl.setContentsMargins(0, 8, 0, 0)
        cl.addWidget(self.cf_page)

        self.tabs.addTab(modrinth_tab, "Modrinth")
        self.tabs.addTab(cf_tab, "CurseForge")
        self.tabs.tabBar().setTabIcon(
            0, get_icon("leaf", "#4ADE80", 14))
        self.tabs.tabBar().setTabIcon(
            1, get_icon("fire", "#F97316", 14))

        root.addWidget(self.tabs)

        # Kick off default search
        from PySide6.QtCore import QTimer
        QTimer.singleShot(200, lambda: self._search_modrinth(""))

    def _make_list_page(self) -> QScrollArea:
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        content = QWidget()
        vbox = QVBoxLayout(content)
        vbox.setContentsMargins(0, 0, 8, 0)
        vbox.setSpacing(8)
        vbox.addStretch()
        scroll.setWidget(content)
        return scroll

    def _clear_list(self, scroll: QScrollArea) -> QVBoxLayout:
        w = scroll.widget()
        layout = w.layout()
        while layout.count() > 1:
            item = layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        return layout

    def _do_search(self) -> None:
        query = self.search_edit.text().strip()
        loader_raw = self.loader_combo.currentText()
        loader = "" if loader_raw == "All Loaders" else loader_raw
        self._search_modrinth(query, loader)
        self._search_curseforge(query)

    def _search_modrinth(self, query: str, loader: str = "") -> None:
        from api.mod_platforms import modrinth_search

        def _search(progress_cb=None, status_cb=None):
            return modrinth_search(query, loader=loader)

        worker = SimpleWorker(_search)
        worker.signals.finished.connect(self._on_modrinth_results)
        worker.signals.error.connect(lambda e: print(f"Modrinth: {e}"))
        QThreadPool.globalInstance().start(worker)

    def _search_curseforge(self, query: str) -> None:
        from api.mod_platforms import curseforge_search
        from core.settings import get_settings

        if not get_settings().get("curseforge_api_key", ""):
            layout = self._clear_list(self.cf_page)
            lbl = QLabel("Set your CurseForge API key in Settings to browse.")
            lbl.setObjectName("Muted")
            lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            layout.insertWidget(0, lbl)
            return

        def _search(progress_cb=None, status_cb=None):
            return curseforge_search(query)

        worker = SimpleWorker(_search)
        worker.signals.finished.connect(self._on_cf_results)
        worker.signals.error.connect(lambda e: print(f"CurseForge: {e}"))
        QThreadPool.globalInstance().start(worker)

    def _on_modrinth_results(self, data: dict) -> None:
        layout = self._clear_list(self.mr_page)
        hits = data.get("hits", [])
        if not hits:
            lbl = QLabel("No results found.")
            lbl.setObjectName("Muted")
            lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            layout.insertWidget(0, lbl)
            return
        for item in hits[:20]:
            card = _ModCard(item, "modrinth")
            card.install_clicked.connect(
                lambda d: self.install_mod.emit(d, "modrinth"))
            layout.insertWidget(layout.count() - 1, card)

    def _on_cf_results(self, data: dict) -> None:
        layout = self._clear_list(self.cf_page)
        mods = data.get("data", [])
        if not mods:
            lbl = QLabel("No results found.")
            lbl.setObjectName("Muted")
            lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            layout.insertWidget(0, lbl)
            return
        for item in mods[:20]:
            card = _ModCard(item, "curseforge")
            card.install_clicked.connect(
                lambda d: self.install_mod.emit(d, "curseforge"))
            layout.insertWidget(layout.count() - 1, card)

    def set_active_instance(self, inst_id: str) -> None:
        self._current_instance_id = inst_id
