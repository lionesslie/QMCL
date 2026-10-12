"""QMCL — Instances page: list, create, manage game profiles."""
from __future__ import annotations

from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QFont
from PySide6.QtWidgets import (
    QDialog, QDialogButtonBox, QFormLayout, QHBoxLayout,
    QLabel, QLineEdit, QMenu, QPushButton, QScrollArea,
    QSizePolicy, QSpacerItem, QStackedWidget, QVBoxLayout,
    QWidget, QComboBox, QSpinBox, QFrame, QTabWidget,
)

from core.instances import Instance, get_instance_manager
from ui.icons import get_icon


class _InstanceCard(QWidget):
    selected = Signal(str)
    action = Signal(str, str)   # (action, instance_id)

    def __init__(self, instance: Instance, is_active: bool = False,
                 parent=None) -> None:
        super().__init__(parent)
        self.instance = instance
        self.setObjectName("InstanceCard")
        self.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setFixedHeight(88)
        self.setSizePolicy(QSizePolicy.Policy.Expanding,
                           QSizePolicy.Policy.Fixed)

        layout = QHBoxLayout(self)
        layout.setContentsMargins(16, 12, 12, 12)
        layout.setSpacing(12)

        # Icon area
        icon_frame = QFrame()
        icon_frame.setFixedSize(56, 56)
        icon_frame.setStyleSheet(
            "background: rgba(108,99,255,0.15); border-radius: 12px;")
        icon_layout = QVBoxLayout(icon_frame)
        icon_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        icon_lbl = QLabel()
        icon_lbl.setPixmap(get_icon("cube", "#6C63FF", 26).pixmap(26, 26))
        icon_layout.addWidget(icon_lbl)
        layout.addWidget(icon_frame)

        # Text
        text_col = QVBoxLayout()
        text_col.setSpacing(3)
        name_lbl = QLabel(instance.name)
        name_lbl.setStyleSheet(
            "color: #F5F5F7; font-size: 15px; font-weight: 600; "
            "background: transparent; border: none;")
        text_col.addWidget(name_lbl)

        meta_row = QHBoxLayout()
        meta_row.setSpacing(8)

        ver_icon = QLabel()
        ver_icon.setPixmap(
            get_icon("cube", "#A0A0A8", 12).pixmap(12, 12))
        meta_row.addWidget(ver_icon)

        ver_lbl = QLabel(
            f"{instance.mc_version or 'No version'}"
            + (f"  •  {instance.loader.title()}"
               if instance.loader != "vanilla" else ""))
        ver_lbl.setStyleSheet(
            "color: #A0A0A8; font-size: 12px; "
            "background: transparent; border: none;")
        meta_row.addWidget(ver_lbl)
        meta_row.addStretch()

        # Installed badge
        if instance.installed:
            badge = QLabel("INSTALLED")
            badge.setObjectName("BadgeSuccess")
            meta_row.addWidget(badge)
        else:
            badge = QLabel("NOT INSTALLED")
            badge.setObjectName("BadgeWarning")
            meta_row.addWidget(badge)

        text_col.addLayout(meta_row)
        layout.addLayout(text_col)
        layout.addStretch()

        # Three-dot menu
        menu_btn = QPushButton()
        menu_btn.setObjectName("IconBtn")
        menu_btn.setIcon(
            get_icon("dots-three-vertical", "#A0A0A8", 16))
        menu_btn.setFixedSize(32, 32)
        menu_btn.clicked.connect(self._show_menu)
        layout.addWidget(menu_btn,
                         alignment=Qt.AlignmentFlag.AlignTop)

        if is_active:
            self.setStyleSheet(
                "QWidget#InstanceCard { "
                "background: rgba(108,99,255,0.15); "
                "border: 1px solid rgba(108,99,255,0.4); "
                "border-radius: 16px; }")

    def mousePressEvent(self, event) -> None:
        if event.button() == Qt.MouseButton.LeftButton:
            self.selected.emit(self.instance.id)
        super().mousePressEvent(event)

    def _show_menu(self) -> None:
        menu = QMenu(self)
        edit_act = menu.addAction(
            get_icon("pencil", "#F5F5F7", 14), "Edit")
        dup_act = menu.addAction(
            get_icon("copy", "#F5F5F7", 14), "Duplicate")
        menu.addSeparator()
        del_act = menu.addAction(
            get_icon("trash", "#F87171", 14), "Delete")
        del_act.setToolTip("Permanently remove this instance")

        chosen = menu.exec(
            self.mapToGlobal(self.rect().topRight()))
        if chosen == edit_act:
            self.action.emit("edit", self.instance.id)
        elif chosen == dup_act:
            self.action.emit("duplicate", self.instance.id)
        elif chosen == del_act:
            self.action.emit("delete", self.instance.id)


class NewInstanceDialog(QDialog):
    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self.setWindowTitle("New Instance")
        self.setFixedSize(480, 360)
        self.setObjectName("Dialog")
        self.setWindowFlags(
            Qt.WindowType.Dialog | Qt.WindowType.FramelessWindowHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)

        outer = QVBoxLayout(self)
        outer.setContentsMargins(0, 0, 0, 0)

        container = QWidget()
        container.setObjectName("Dialog")
        container.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        outer.addWidget(container)

        layout = QVBoxLayout(container)
        layout.setContentsMargins(28, 24, 28, 24)
        layout.setSpacing(16)

        title = QLabel("Create New Instance")
        title.setObjectName("H2")
        layout.addWidget(title)

        form = QFormLayout()
        form.setSpacing(12)
        form.setLabelAlignment(Qt.AlignmentFlag.AlignRight)

        self.name_edit = QLineEdit()
        self.name_edit.setPlaceholderText("My Instance")
        form.addRow("Name:", self.name_edit)

        self.loader_combo = QComboBox()
        self.loader_combo.addItems(
            ["Vanilla", "Fabric", "Quilt", "Forge", "NeoForge"])
        form.addRow("Loader:", self.loader_combo)

        self.version_combo = QComboBox()
        self.version_combo.addItem("Loading versions…")
        self.version_combo.setEnabled(False)
        form.addRow("MC Version:", self.version_combo)

        self.ram_spin = QSpinBox()
        self.ram_spin.setRange(512, 32768)
        self.ram_spin.setValue(2048)
        self.ram_spin.setSuffix(" MB")
        self.ram_spin.setSingleStep(512)
        form.addRow("RAM:", self.ram_spin)

        layout.addLayout(form)
        layout.addStretch()

        buttons = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Ok |
            QDialogButtonBox.StandardButton.Cancel)
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)

        # Load versions async after dialog opens
        from PySide6.QtCore import QTimer
        QTimer.singleShot(0, self._load_versions)

    def _load_versions(self) -> None:
        from ui.workers import SimpleWorker
        from api.mojang import get_version_manifest
        from PySide6.QtCore import QThreadPool
        from core.settings import get_settings

        show_snap = get_settings().get("show_snapshots", False)
        worker = SimpleWorker(get_version_manifest, show_snap)
        worker.signals.finished.connect(self._on_versions)
        worker.signals.error.connect(lambda _: None)
        QThreadPool.globalInstance().start(worker)

    def _on_versions(self, versions: list) -> None:
        self.version_combo.clear()
        for v in versions:
            self.version_combo.addItem(v["id"], v)
        self.version_combo.setEnabled(True)

    def get_values(self) -> dict:
        return {
            "name": self.name_edit.text().strip() or "New Instance",
            "loader": self.loader_combo.currentText().lower(),
            "mc_version": self.version_combo.currentText(),
            "ram_mb": self.ram_spin.value(),
        }


class InstancesPage(QWidget):
    instance_selected = Signal(str)
    launch_requested = Signal(str)

    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self._manager = get_instance_manager()
        self._active_id: str | None = None

        root = QVBoxLayout(self)
        root.setContentsMargins(32, 28, 32, 28)
        root.setSpacing(16)

        # ── Toolbar ───────────────────────────────────────────────────────────
        toolbar = QHBoxLayout()

        title = QLabel("Instances")
        title.setObjectName("H1")
        toolbar.addWidget(title)
        toolbar.addStretch()

        # Search
        self.search_edit = QLineEdit()
        self.search_edit.setObjectName("SearchBox")
        self.search_edit.setPlaceholderText("Search instances…")
        self.search_edit.setFixedWidth(220)
        search_icon = get_icon("magnifying-glass", "#A0A0A8", 14)
        self.search_edit.textChanged.connect(self._filter)
        toolbar.addWidget(self.search_edit)

        new_btn = QPushButton()
        new_btn.setObjectName("PrimaryBtn")
        new_btn.setIcon(get_icon("plus", "#FFFFFF", 14))
        new_btn.setText("  New Instance")
        new_btn.clicked.connect(self._create_instance)
        toolbar.addWidget(new_btn)

        root.addLayout(toolbar)

        # ── List area ─────────────────────────────────────────────────────────
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        scroll.setHorizontalScrollBarPolicy(
            Qt.ScrollBarPolicy.ScrollBarAlwaysOff)

        self._list_widget = QWidget()
        self._list_layout = QVBoxLayout(self._list_widget)
        self._list_layout.setContentsMargins(0, 0, 0, 0)
        self._list_layout.setSpacing(8)
        self._list_layout.addStretch()

        scroll.setWidget(self._list_widget)
        root.addWidget(scroll)

        self.refresh()

    # ── Data ──────────────────────────────────────────────────────────────────

    def refresh(self) -> None:
        # Clear existing cards (except stretch)
        while self._list_layout.count() > 1:
            item = self._list_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

        instances = self._manager.get_all()
        query = self.search_edit.text().lower()

        if not instances:
            empty = QLabel("No instances yet — create one!")
            empty.setObjectName("Muted")
            empty.setAlignment(Qt.AlignmentFlag.AlignCenter)
            self._list_layout.insertWidget(0, empty)
            return

        for inst in instances:
            if query and query not in inst.name.lower():
                continue
            card = _InstanceCard(
                inst, is_active=(inst.id == self._active_id))
            card.selected.connect(self._on_select)
            card.action.connect(self._on_action)
            self._list_layout.insertWidget(
                self._list_layout.count() - 1, card)

    def _filter(self, _: str) -> None:
        self.refresh()

    def _on_select(self, inst_id: str) -> None:
        self._active_id = inst_id
        self.instance_selected.emit(inst_id)
        self.refresh()

    def _on_action(self, action: str, inst_id: str) -> None:
        if action == "delete":
            self._manager.remove(inst_id)
            if self._active_id == inst_id:
                self._active_id = None
            self.refresh()
        elif action == "duplicate":
            inst = self._manager.get(inst_id)
            if inst:
                self._manager.duplicate(inst_id, f"{inst.name} (copy)")
                self.refresh()
        elif action == "edit":
            self._edit_instance(inst_id)

    def _create_instance(self) -> None:
        dlg = NewInstanceDialog(self)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            vals = dlg.get_values()
            inst = Instance(
                name=vals["name"],
                mc_version=vals["mc_version"],
                loader=vals["loader"],
                ram_mb=vals["ram_mb"],
            )
            self._manager.add(inst)
            self._active_id = inst.id
            self.instance_selected.emit(inst.id)
            self.refresh()

    def _edit_instance(self, inst_id: str) -> None:
        inst = self._manager.get(inst_id)
        if not inst:
            return
        dlg = NewInstanceDialog(self)
        dlg.setWindowTitle("Edit Instance")
        dlg.name_edit.setText(inst.name)
        dlg.ram_spin.setValue(inst.ram_mb)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            vals = dlg.get_values()
            inst.name = vals["name"]
            inst.ram_mb = vals["ram_mb"]
            self._manager.update(inst)
            self.refresh()

    def get_active_instance(self) -> Instance | None:
        if self._active_id:
            return self._manager.get(self._active_id)
        return None
