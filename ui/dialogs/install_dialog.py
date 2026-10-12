"""QMCL — Installation progress dialog."""
from __future__ import annotations

from PySide6.QtCore import Qt, Signal, QThreadPool
from PySide6.QtWidgets import (
    QDialog, QHBoxLayout, QLabel, QProgressBar,
    QPushButton, QVBoxLayout, QWidget,
)

from ui.icons import get_icon
from ui.workers import Worker


class InstallDialog(QDialog):
    """Modal progress dialog for version installation."""

    install_finished = Signal(bool, str)   # (success, message)

    def __init__(self, instance, parent=None) -> None:
        super().__init__(parent)
        self.instance = instance
        self.setWindowTitle("Installing")
        self.setFixedSize(480, 260)
        self.setWindowFlags(
            Qt.WindowType.Dialog | Qt.WindowType.FramelessWindowHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setModal(True)

        outer = QVBoxLayout(self)
        outer.setContentsMargins(0, 0, 0, 0)

        container = QWidget()
        container.setObjectName("Dialog")
        container.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        outer.addWidget(container)

        layout = QVBoxLayout(container)
        layout.setContentsMargins(28, 24, 28, 24)
        layout.setSpacing(16)

        # Header row
        hdr = QHBoxLayout()
        icon_lbl = QLabel()
        icon_lbl.setPixmap(
            get_icon("download", "#6C63FF", 22).pixmap(22, 22))
        hdr.addWidget(icon_lbl)
        self._title_lbl = QLabel(f"Installing {instance.mc_version}…")
        self._title_lbl.setObjectName("H3")
        hdr.addWidget(self._title_lbl)
        hdr.addStretch()
        layout.addLayout(hdr)

        # Status text
        self._status_lbl = QLabel("Preparing…")
        self._status_lbl.setObjectName("Muted")
        self._status_lbl.setWordWrap(True)
        layout.addWidget(self._status_lbl)

        # Progress bar
        self._progress = QProgressBar()
        self._progress.setRange(0, 100)
        self._progress.setValue(0)
        self._progress.setFixedHeight(10)
        layout.addWidget(self._progress)

        # Percentage label
        self._pct_lbl = QLabel("0%")
        self._pct_lbl.setObjectName("Muted")
        self._pct_lbl.setAlignment(Qt.AlignmentFlag.AlignRight)
        layout.addWidget(self._pct_lbl)

        layout.addStretch()

        # Cancel button
        self._cancel_btn = QPushButton("Cancel")
        self._cancel_btn.setObjectName("SecondaryBtn")
        self._cancel_btn.setFixedWidth(100)
        self._cancel_btn.clicked.connect(self.reject)
        layout.addWidget(
            self._cancel_btn, alignment=Qt.AlignmentFlag.AlignRight)

    def set_progress(self, value: int) -> None:
        self._progress.setValue(value)
        self._pct_lbl.setText(f"{value}%")

    def set_status(self, text: str) -> None:
        self._status_lbl.setText(text)

    def run_install(self) -> None:
        """Start installation in a background thread."""
        from api.mojang import install_version, required_java_for, _scaled
        from api.loaders import (
            get_fabric_versions, get_quilt_versions, pick_stable,
            get_forge_versions, get_neoforge_versions,
            install_fabric, install_quilt, install_forge, install_neoforge,
        )
        from core.instances import get_instance_manager
        from core.java_manager import find_java, download_java

        inst = self.instance

        def _java_for_installer(status_cb, progress_cb) -> str:
            major = required_java_for(inst.mc_version)
            java = inst.java_path or find_java(major)
            if not java:
                if status_cb:
                    status_cb(f"Downloading Java {major}…")
                java = download_java(major, progress_cb, status_cb)
            if not java:
                raise RuntimeError(f"Java {major} could not be found or downloaded.")
            return java

        def _install(progress_cb=None, status_cb=None):
            # 1) vanilla Minecraft  → 0-85 % of the bar
            install_version(inst.mc_version, _scaled(progress_cb, 0, 85), status_cb)

            # 2) mod loader         → 85-100 % of the bar
            lp = _scaled(progress_cb, 85, 100)
            loader = inst.loader
            if loader == "fabric":
                lv = inst.loader_version or pick_stable(
                    get_fabric_versions(inst.mc_version))
                if not lv:
                    raise RuntimeError(
                        f"No Fabric loader available for {inst.mc_version}.")
                install_fabric(inst.mc_version, lv, "", lp, status_cb)
                inst.loader_version = lv

            elif loader == "quilt":
                lv = inst.loader_version or pick_stable(
                    get_quilt_versions(inst.mc_version))
                if not lv:
                    raise RuntimeError(
                        f"No Quilt loader available for {inst.mc_version}.")
                install_quilt(inst.mc_version, lv, "", lp, status_cb)
                inst.loader_version = lv

            elif loader == "forge":
                versions = get_forge_versions(inst.mc_version)
                lv = inst.loader_version or (versions[0] if versions else "")
                if not lv:
                    raise RuntimeError(
                        f"No Forge build available for {inst.mc_version}.")
                java = _java_for_installer(status_cb, progress_cb)
                install_forge(inst.mc_version, lv, java, lp, status_cb)
                inst.loader_version = lv

            elif loader == "neoforge":
                versions = get_neoforge_versions(inst.mc_version)
                lv = inst.loader_version or (versions[0] if versions else "")
                if not lv:
                    raise RuntimeError(
                        f"No NeoForge build available for {inst.mc_version}.")
                java = _java_for_installer(status_cb, progress_cb)
                install_neoforge(inst.mc_version, lv, java, lp, status_cb)
                inst.loader_version = lv

            if progress_cb:
                progress_cb(100)
            inst.installed = True
            get_instance_manager().update(inst)
            return True

        worker = Worker(_install)
        worker.signals.progress.connect(self.set_progress)
        worker.signals.status.connect(self.set_status)
        worker.signals.finished.connect(self._on_finished)
        worker.signals.error.connect(self._on_error)
        QThreadPool.globalInstance().start(worker)

    def _on_finished(self, _) -> None:
        self._status_lbl.setText("Installation complete!")
        self._progress.setValue(100)
        self._cancel_btn.setText("Close")
        self._cancel_btn.setObjectName("PrimaryBtn")
        self._cancel_btn.style().unpolish(self._cancel_btn)
        self._cancel_btn.style().polish(self._cancel_btn)
        self._cancel_btn.clicked.disconnect()
        self._cancel_btn.clicked.connect(self.accept)
        self.install_finished.emit(True, "")

    def _on_error(self, error: str) -> None:
        self._status_lbl.setText(f"Error: {error}")
        self._status_lbl.setStyleSheet("color: #F87171;")
        self._cancel_btn.setText("Close")
        self._cancel_btn.clicked.disconnect()
        self._cancel_btn.clicked.connect(self.reject)
        self.install_finished.emit(False, error)
