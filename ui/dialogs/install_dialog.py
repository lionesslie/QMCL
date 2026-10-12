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
        """Start installation in background thread."""
        from api.mojang import install_version
        from api.loaders import (
            install_fabric, install_quilt,
            install_forge, install_neoforge,
            get_fabric_versions, get_quilt_versions,
        )
        from core.instances import get_instance_manager
        from core.java_manager import find_java, download_java
        from core.constants import required_java

        inst = self.instance

        def _install(progress_cb=None, status_cb=None):
            # 1. Base Minecraft
            install_version(inst.mc_version, progress_cb, status_cb)

            # 2. Loader
            java = inst.java_path or ""
            if not java:
                req = required_java(inst.mc_version)
                java = find_java(req) or ""
            if not java:
                if status_cb:
                    status_cb("Downloading Java…")
                req = required_java(inst.mc_version)
                java = download_java(req, progress_cb, status_cb) or "java"

            if inst.loader == "fabric":
                versions = get_fabric_versions(inst.mc_version)
                lv = (inst.loader_version
                      or (versions[0]["loader"]["version"]
                          if versions else ""))
                if lv:
                    install_fabric(inst.mc_version, lv, java,
                                   progress_cb, status_cb)
                    inst.loader_version = lv

            elif inst.loader == "quilt":
                versions = get_quilt_versions(inst.mc_version)
                lv = (inst.loader_version
                      or (versions[0]["loader"]["version"]
                          if versions else ""))
                if lv:
                    install_quilt(inst.mc_version, lv, java,
                                  progress_cb, status_cb)
                    inst.loader_version = lv

            elif inst.loader == "forge":
                from api.loaders import get_forge_versions
                versions = get_forge_versions(inst.mc_version)
                lv = inst.loader_version or (versions[0] if versions else "")
                if lv:
                    install_forge(inst.mc_version, lv, java,
                                  progress_cb, status_cb)
                    inst.loader_version = lv

            elif inst.loader == "neoforge":
                from api.loaders import get_neoforge_versions
                versions = get_neoforge_versions(inst.mc_version)
                lv = inst.loader_version or (versions[0] if versions else "")
                if lv:
                    install_neoforge(inst.mc_version, lv, java,
                                     progress_cb, status_cb)
                    inst.loader_version = lv

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
