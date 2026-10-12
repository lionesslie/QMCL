"""QMCL — Settings slide-in panel."""
from __future__ import annotations

from PySide6.QtCore import (
    QEasingCurve, QPoint, QPropertyAnimation, Qt,
)
from PySide6.QtWidgets import (
    QCheckBox, QFileDialog, QFormLayout, QHBoxLayout,
    QLabel, QLineEdit, QPushButton, QScrollArea,
    QSizePolicy, QSlider, QSpinBox, QVBoxLayout, QWidget, QFrame,
)

from core.settings import get_settings
from ui.icons import get_icon


class SettingsPanel(QWidget):
    """Slide-in panel from the right edge."""

    def __init__(self, parent: QWidget) -> None:
        super().__init__(parent)
        self.setObjectName("SlidePanel")
        self.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        self.setFixedWidth(380)
        self.hide()

        self._settings = get_settings()
        self._visible = False

        self._setup_anim()

        self._build_ui()

    def _build_ui(self) -> None:
        root = QVBoxLayout(self)
        root.setContentsMargins(24, 24, 24, 24)
        root.setSpacing(20)

        # Header
        hdr = QHBoxLayout()
        title = QLabel("Settings")
        title.setObjectName("H2")
        hdr.addWidget(title)
        hdr.addStretch()
        close_btn = QPushButton()
        close_btn.setObjectName("IconBtn")
        close_btn.setIcon(get_icon("x", "#A0A0A8", 16))
        close_btn.setFixedSize(32, 32)
        close_btn.clicked.connect(self.hide_panel)
        hdr.addWidget(close_btn)
        root.addLayout(hdr)

        sep = QFrame()
        sep.setFrameShape(QFrame.Shape.HLine)
        sep.setStyleSheet("color: rgba(255,255,255,0.08);")
        root.addWidget(sep)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        content = QWidget()
        form_layout = QVBoxLayout(content)
        form_layout.setSpacing(24)

        # ── Java & RAM section ─────────────────────────────────────────────
        self._add_section(form_layout, "cpu", "Java & Performance")

        java_row = QHBoxLayout()
        java_lbl = QLabel("Java Path:")
        java_lbl.setFixedWidth(90)
        java_lbl.setStyleSheet("color: #A0A0A8; font-size: 13px;")
        self.java_edit = QLineEdit()
        self.java_edit.setText(self._settings.get("java_path", ""))
        self.java_edit.setPlaceholderText("Auto-detect")
        java_browse = QPushButton()
        java_browse.setObjectName("IconBtn")
        java_browse.setIcon(get_icon("folder-open", "#A0A0A8", 14))
        java_browse.setFixedSize(32, 32)
        java_browse.clicked.connect(self._browse_java)
        java_row.addWidget(java_lbl)
        java_row.addWidget(self.java_edit)
        java_row.addWidget(java_browse)
        form_layout.addLayout(java_row)

        ram_row = QHBoxLayout()
        ram_lbl = QLabel("Default RAM:")
        ram_lbl.setFixedWidth(90)
        ram_lbl.setStyleSheet("color: #A0A0A8; font-size: 13px;")
        self.ram_slider = QSlider(Qt.Orientation.Horizontal)
        self.ram_slider.setRange(512, 16384)
        self.ram_slider.setSingleStep(512)
        self.ram_slider.setValue(
            self._settings.get("default_ram_mb", 2048))
        self.ram_val_lbl = QLabel(
            f"{self.ram_slider.value()} MB")
        self.ram_val_lbl.setFixedWidth(65)
        self.ram_val_lbl.setStyleSheet("color: #6C63FF; font-size: 13px;")
        self.ram_slider.valueChanged.connect(
            lambda v: self.ram_val_lbl.setText(f"{v} MB"))
        ram_row.addWidget(ram_lbl)
        ram_row.addWidget(self.ram_slider)
        ram_row.addWidget(self.ram_val_lbl)
        form_layout.addLayout(ram_row)

        # JVM args
        jvm_row = QHBoxLayout()
        jvm_lbl = QLabel("JVM Args:")
        jvm_lbl.setFixedWidth(90)
        jvm_lbl.setStyleSheet("color: #A0A0A8; font-size: 13px;")
        self.jvm_edit = QLineEdit()
        self.jvm_edit.setText(self._settings.get("jvm_args", ""))
        self.jvm_edit.setPlaceholderText("-XX:+UseG1GC …")
        jvm_row.addWidget(jvm_lbl)
        jvm_row.addWidget(self.jvm_edit)
        form_layout.addLayout(jvm_row)

        # ── Appearance section ─────────────────────────────────────────────
        self._add_section(form_layout, "paint-brush", "Appearance")

        self.snapshots_cb = QCheckBox("Show Snapshots")
        self.snapshots_cb.setObjectName("Toggle")
        self.snapshots_cb.setChecked(
            self._settings.get("show_snapshots", False))
        form_layout.addWidget(self.snapshots_cb)

        self.close_on_launch_cb = QCheckBox("Close launcher on launch")
        self.close_on_launch_cb.setObjectName("Toggle")
        self.close_on_launch_cb.setChecked(
            self._settings.get("close_on_launch", False))
        form_layout.addWidget(self.close_on_launch_cb)

        # ── CurseForge API ─────────────────────────────────────────────────
        self._add_section(form_layout, "fire", "CurseForge API")

        cf_lbl = QLabel("API Key:")
        cf_lbl.setStyleSheet("color: #A0A0A8; font-size: 13px;")
        form_layout.addWidget(cf_lbl)
        self.cf_key_edit = QLineEdit()
        self.cf_key_edit.setText(
            self._settings.get("curseforge_api_key", ""))
        self.cf_key_edit.setPlaceholderText("$2a$10$…")
        self.cf_key_edit.setEchoMode(
            QLineEdit.EchoMode.PasswordEchoOnEdit)
        form_layout.addWidget(self.cf_key_edit)

        cf_hint = QLabel(
            "Get your free API key at console.curseforge.com")
        cf_hint.setObjectName("Muted")
        cf_hint.setWordWrap(True)
        form_layout.addWidget(cf_hint)

        form_layout.addStretch()
        scroll.setWidget(content)
        root.addWidget(scroll)

        # Save button
        save_btn = QPushButton("Save Settings")
        save_btn.setObjectName("PrimaryBtn")
        save_btn.clicked.connect(self._save)
        root.addWidget(save_btn)

    def _add_section(self, layout, icon_name: str, label: str) -> None:
        row = QHBoxLayout()
        icon_lbl = QLabel()
        icon_lbl.setPixmap(
            get_icon(icon_name, "#6C63FF", 14).pixmap(14, 14))
        row.addWidget(icon_lbl)
        title = QLabel(label)
        title.setObjectName("H3")
        row.addWidget(title)
        row.addStretch()
        layout.addLayout(row)
        sep = QFrame()
        sep.setFrameShape(QFrame.Shape.HLine)
        sep.setStyleSheet(
            "color: rgba(255,255,255,0.06); margin-bottom: 4px;")
        layout.addWidget(sep)

    def _browse_java(self) -> None:
        path, _ = QFileDialog.getOpenFileName(
            self, "Select Java Executable", "", "")
        if path:
            self.java_edit.setText(path)

    def _save(self) -> None:
        self._settings.set("java_path", self.java_edit.text().strip())
        self._settings.set("default_ram_mb", self.ram_slider.value())
        self._settings.set("jvm_args", self.jvm_edit.text().strip())
        self._settings.set("show_snapshots", self.snapshots_cb.isChecked())
        self._settings.set("close_on_launch",
                           self.close_on_launch_cb.isChecked())
        self._settings.set("curseforge_api_key",
                           self.cf_key_edit.text().strip())
        self.hide_panel()

    # ── Slide animation ───────────────────────────────────────────────────────

    def _setup_anim(self) -> None:
        self._anim = QPropertyAnimation(self, b"pos", self)
        self._anim.setDuration(280)
        self._anim.setEasingCurve(QEasingCurve.Type.OutCubic)
        self._anim.finished.connect(self._on_anim_finished)
        self._hiding = False

    def _on_anim_finished(self) -> None:
        if self._hiding:
            self.hide()

    def show_panel(self) -> None:
        parent = self.parentWidget()
        if parent is None:
            return
        self._hiding = False
        self._anim.stop()
        top = 53
        h = max(100, parent.height() - top - 73)
        self.setFixedHeight(h)
        end = QPoint(parent.width() - self.width(), top)
        self.move(parent.width(), top)
        self.show()
        self.raise_()
        self._anim.setStartValue(QPoint(parent.width(), top))
        self._anim.setEndValue(end)
        self._anim.start()
        self._visible = True

    def hide_panel(self) -> None:
        parent = self.parentWidget()
        self._visible = False
        if parent is None or not self.isVisible():
            self.hide()
            return
        self._hiding = True
        self._anim.stop()
        self._anim.setStartValue(self.pos())
        self._anim.setEndValue(QPoint(parent.width(), self.y()))
        self._anim.start()

    def toggle(self) -> None:
        if self._visible:
            self.hide_panel()
        else:
            self.show_panel()
