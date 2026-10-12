"""QMCL — Main application window."""
from __future__ import annotations

import subprocess
import time
from typing import Optional

from PySide6.QtCore import (
    QEasingCurve, QPropertyAnimation, QSize,
    Qt, QThreadPool, QTimer,
)
from PySide6.QtWidgets import (
    QFrame, QHBoxLayout, QLabel, QSizePolicy,
    QStackedWidget, QVBoxLayout, QWidget,
)

from core.accounts import get_account_manager
from core.instances import get_instance_manager
from core.settings import get_settings

from ui.stylesheet import STYLESHEET
from ui.widgets.background import BackgroundCanvas
from ui.widgets.titlebar import TitleBar
from ui.widgets.sidebar import Sidebar
from ui.widgets.bottombar import BottomBar
from ui.widgets.toast import show_toast

from ui.pages.home_page import HomePage
from ui.pages.instances_page import InstancesPage
from ui.pages.store_page import StorePage
from ui.pages.skin_page import SkinPage

from ui.dialogs.settings_panel import SettingsPanel
from ui.dialogs.account_panel import AccountPanel
from ui.dialogs.install_dialog import InstallDialog


class MainWindow(QWidget):
    def __init__(self) -> None:
        super().__init__()
        self.setObjectName("MainWindow")
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint |
            Qt.WindowType.Window)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setMinimumSize(1100, 680)

        s = get_settings()
        self.resize(s.get("width", 1280), s.get("height", 720))

        self.setStyleSheet(STYLESHEET)

        self._account_manager = get_account_manager()
        self._instance_manager = get_instance_manager()
        self._active_proc: Optional[subprocess.Popen] = None
        self._proc_timer = QTimer(self)
        self._proc_timer.setInterval(500)
        self._proc_timer.timeout.connect(self._check_proc)

        self._build_ui()
        self._connect_signals()
        self._refresh_status_bar()

    # ── Build UI ──────────────────────────────────────────────────────────────

    def _build_ui(self) -> None:
        # Root layout stacks background + chrome
        root_layout = QVBoxLayout(self)
        root_layout.setContentsMargins(0, 0, 0, 0)
        root_layout.setSpacing(0)

        # Outer rounded container
        self._container = QWidget()
        self._container.setObjectName("MainWindow")
        self._container.setStyleSheet("""
            QWidget#MainWindow {
                background: #121212;
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,0.06);
            }
        """)
        root_layout.addWidget(self._container)

        container_layout = QVBoxLayout(self._container)
        container_layout.setContentsMargins(0, 0, 0, 0)
        container_layout.setSpacing(0)

        # Animated background (behind everything)
        self._bg = BackgroundCanvas(self._container)
        self._bg.setGeometry(0, 0, self.width(), self.height())
        self._bg.lower()

        # Title bar
        self._titlebar = TitleBar(self)
        container_layout.addWidget(self._titlebar)

        # Separator
        sep = QFrame()
        sep.setFrameShape(QFrame.Shape.HLine)
        sep.setFixedHeight(1)
        sep.setStyleSheet("background: rgba(255,255,255,0.05);")
        container_layout.addWidget(sep)

        # Body: sidebar + content
        body = QHBoxLayout()
        body.setContentsMargins(0, 0, 0, 0)
        body.setSpacing(0)

        self._sidebar = Sidebar()
        body.addWidget(self._sidebar)

        # Vertical separator
        vsep = QFrame()
        vsep.setFrameShape(QFrame.Shape.VLine)
        vsep.setFixedWidth(1)
        vsep.setStyleSheet("background: rgba(255,255,255,0.05);")
        body.addWidget(vsep)

        # Content stack
        self._stack = QStackedWidget()
        self._stack.setContentsMargins(0, 0, 0, 0)
        body.addWidget(self._stack)

        # Pages
        self._home_page = HomePage()
        self._instances_page = InstancesPage()
        self._skin_page = SkinPage()
        self._store_page = StorePage()

        self._stack.addWidget(self._home_page)      # 0
        self._stack.addWidget(self._instances_page) # 1
        self._stack.addWidget(self._skin_page)      # 2
        self._stack.addWidget(self._store_page)     # 3

        self._page_map = {
            "home": 0,
            "instances": 1,
            "skin": 2,
            "store": 3,
        }

        container_layout.addLayout(body)

        # Bottom bar
        bsep = QFrame()
        bsep.setFrameShape(QFrame.Shape.HLine)
        bsep.setFixedHeight(1)
        bsep.setStyleSheet("background: rgba(255,255,255,0.05);")
        container_layout.addWidget(bsep)

        self._bottombar = BottomBar()
        container_layout.addWidget(self._bottombar)

        # Slide-in panels (floating over content)
        self._settings_panel = SettingsPanel(self._container)
        self._account_panel = AccountPanel(self._container)

    # ── Signals ───────────────────────────────────────────────────────────────

    def _connect_signals(self) -> None:
        # Sidebar navigation
        self._sidebar.page_changed.connect(self._navigate)

        # Title bar buttons
        self._titlebar.settings_btn.clicked.connect(
            self._settings_panel.toggle)
        self._titlebar.account_btn.clicked.connect(
            self._account_panel.toggle)

        # Home page navigation links
        self._home_page.set_nav_callback(self._navigate)

        # Instances page
        self._instances_page.instance_selected.connect(
            self._on_instance_selected)

        # Store install
        self._store_page.install_mod.connect(self._on_install_mod)

        # Account panel
        self._account_panel.account_changed.connect(
            self._bottombar.set_account)

        # Play button
        self._bottombar.play_clicked = self._on_play_clicked

    # ── Navigation ────────────────────────────────────────────────────────────

    def _navigate(self, page_id: str) -> None:
        idx = self._page_map.get(page_id, 0)

        # Fade transition
        current = self._stack.currentWidget()
        from PySide6.QtWidgets import QGraphicsOpacityEffect
        effect = QGraphicsOpacityEffect(current)
        current.setGraphicsEffect(effect)

        anim = QPropertyAnimation(effect, b"opacity")
        anim.setDuration(120)
        anim.setStartValue(1.0)
        anim.setEndValue(0.0)
        anim.setEasingCurve(QEasingCurve.Type.OutQuad)

        def _switch():
            self._stack.setCurrentIndex(idx)
            new_widget = self._stack.currentWidget()
            new_effect = QGraphicsOpacityEffect(new_widget)
            new_widget.setGraphicsEffect(new_effect)
            in_anim = QPropertyAnimation(new_effect, b"opacity")
            in_anim.setDuration(180)
            in_anim.setStartValue(0.0)
            in_anim.setEndValue(1.0)
            in_anim.setEasingCurve(QEasingCurve.Type.OutCubic)
            in_anim.start()
            self._fade_in_anim = in_anim

        anim.finished.connect(_switch)
        anim.start()
        self._fade_out_anim = anim

        # Sync sidebar
        self._sidebar.set_current(page_id)

    # ── Instance & Launch ─────────────────────────────────────────────────────

    def _on_instance_selected(self, inst_id: str) -> None:
        inst = self._instance_manager.get(inst_id)
        if inst:
            self._bottombar.set_instance(inst.name)
            self._bottombar.set_play_enabled(True)
            get_settings().set("last_instance_id", inst_id)
            self._store_page.set_active_instance(inst_id)

    def _on_play_clicked(self) -> None:
        inst_id = get_settings().get("last_instance_id")
        if not inst_id:
            show_toast(self, "Select an instance first.", "warning")
            return

        inst = self._instance_manager.get(inst_id)
        if not inst:
            show_toast(self, "Instance not found.", "error")
            return

        acc = self._account_manager.get_active()
        if not acc:
            show_toast(self, "Add an account first.", "warning")
            self._account_panel.show_panel()
            return

        if not inst.installed:
            self._install_and_launch(inst)
        else:
            self._launch(inst)

    def _install_and_launch(self, inst) -> None:
        dlg = InstallDialog(inst, self)
        dlg.install_finished.connect(
            lambda ok, msg: self._on_install_done(ok, msg, inst))
        dlg.show()
        dlg.run_install()

    def _on_install_done(self, ok: bool, msg: str, inst) -> None:
        if ok:
            show_toast(self, f"{inst.name} installed!", "success")
            self._launch(inst)
        else:
            show_toast(self, f"Install failed: {msg}", "error")

    def _launch(self, inst) -> None:
        from core.launcher import launch

        acc = self._account_manager.get_active()
        if not acc:
            return

        self._bottombar.set_play_text("RUNNING")
        self._bottombar.set_play_enabled(False)
        self._bottombar.set_status("Launching…")

        def _do_launch(progress_cb=None, status_cb=None):
            return launch(inst, acc, status_cb, progress_cb)

        from ui.workers import Worker
        worker = Worker(_do_launch)
        worker.signals.status.connect(self._bottombar.set_status)
        worker.signals.finished.connect(self._on_launched)
        worker.signals.error.connect(self._on_launch_error)
        QThreadPool.globalInstance().start(worker)

        # Update last played
        inst.last_played = time.time()
        self._instance_manager.update(inst)

    def _on_launched(self, proc: subprocess.Popen) -> None:
        self._active_proc = proc
        if get_settings().get("close_on_launch", False):
            self.showMinimized()
        self._proc_timer.start()
        self._bottombar.set_status("Game running")
        show_toast(self, "Minecraft launched!", "success")

    def _on_launch_error(self, error: str) -> None:
        self._bottombar.set_play_text("PLAY")
        self._bottombar.set_play_enabled(True)
        self._bottombar.set_status("")
        show_toast(self, f"Launch failed: {error}", "error")

    def _check_proc(self) -> None:
        if self._active_proc and self._active_proc.poll() is not None:
            self._active_proc = None
            self._proc_timer.stop()
            self._bottombar.set_play_text("PLAY")
            self._bottombar.set_play_enabled(True)
            self._bottombar.set_status("")

    # ── Store mod install ──────────────────────────────────────────────────────

    def _on_install_mod(self, mod_data: dict, source: str) -> None:
        inst_id = get_settings().get("last_instance_id")
        if not inst_id:
            show_toast(self, "Select an instance first.", "warning")
            return

        inst = self._instance_manager.get(inst_id)
        if not inst:
            return

        from ui.workers import Worker
        from PySide6.QtCore import QThreadPool

        if source == "modrinth":
            from api.mod_platforms import modrinth_get_versions, modrinth_download_mod

            project_id = mod_data.get("project_id", mod_data.get("slug", ""))

            def _install_mr(progress_cb=None, status_cb=None):
                versions = modrinth_get_versions(
                    project_id, inst.mc_version, inst.loader)
                if not versions:
                    raise ValueError("No compatible version found.")
                ver_id = versions[0]["id"]
                if status_cb:
                    status_cb(f"Downloading {mod_data.get('title', '')}…")
                modrinth_download_mod(ver_id, inst.mods_dir(), progress_cb, status_cb)

            worker = Worker(_install_mr)
            worker.signals.status.connect(self._bottombar.set_status)
            worker.signals.finished.connect(
                lambda _: show_toast(self, "Mod installed!", "success"))
            worker.signals.error.connect(
                lambda e: show_toast(self, f"Install failed: {e}", "error"))
            QThreadPool.globalInstance().start(worker)

        elif source == "curseforge":
            from api.mod_platforms import curseforge_get_files, curseforge_download_file

            mod_id = mod_data.get("id")

            def _install_cf(progress_cb=None, status_cb=None):
                files = curseforge_get_files(mod_id, inst.mc_version)
                if not files:
                    raise ValueError("No compatible file found.")
                file_id = files[0]["id"]
                if status_cb:
                    status_cb(f"Downloading {mod_data.get('name', '')}…")
                curseforge_download_file(
                    file_id, inst.mods_dir(), progress_cb, status_cb)

            worker = Worker(_install_cf)
            worker.signals.status.connect(self._bottombar.set_status)
            worker.signals.finished.connect(
                lambda _: show_toast(self, "Mod installed!", "success"))
            worker.signals.error.connect(
                lambda e: show_toast(self, f"Install failed: {e}", "error"))
            QThreadPool.globalInstance().start(worker)

    # ── Status bar refresh ────────────────────────────────────────────────────

    def _refresh_status_bar(self) -> None:
        acc = self._account_manager.get_active()
        self._bottombar.set_account(acc.username if acc else "Not logged in")

        last_id = get_settings().get("last_instance_id")
        if last_id:
            inst = self._instance_manager.get(last_id)
            if inst:
                self._bottombar.set_instance(inst.name)
                self._bottombar.set_play_enabled(True)
                self._instances_page._active_id = last_id
                return

        self._bottombar.set_instance("No instance selected")
        self._bottombar.set_play_enabled(False)

    # ── Resize ────────────────────────────────────────────────────────────────

    def resizeEvent(self, event) -> None:
        super().resizeEvent(event)
        self._bg.setGeometry(0, 0, self._container.width(),
                             self._container.height())
        # Reposition panels if open
        for panel in (self._settings_panel, self._account_panel):
            if panel.isVisible() and panel._visible:
                panel.setFixedHeight(max(100, self._container.height() - 53 - 73))
                panel.move(self._container.width() - panel.width(), 53)

    def closeEvent(self, event) -> None:
        s = get_settings()
        s.set("width", self.width())
        s.set("height", self.height())
        super().closeEvent(event)
