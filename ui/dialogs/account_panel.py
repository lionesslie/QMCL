"""QMCL — Account management panel."""
from __future__ import annotations

import uuid

from PySide6.QtCore import (
    QEasingCurve, QPoint, QPropertyAnimation, QThreadPool, Qt, Signal,
)
from PySide6.QtWidgets import (
    QDialog, QDialogButtonBox, QFrame, QHBoxLayout,
    QLabel, QLineEdit, QPushButton, QScrollArea,
    QVBoxLayout, QWidget,
)

from core.accounts import Account, get_account_manager
from ui.icons import get_icon
from ui.workers import Worker


class _AccountRow(QWidget):
    remove_clicked = Signal(str)
    select_clicked = Signal(str)

    def __init__(self, account: Account, is_active: bool = False,
                 parent=None) -> None:
        super().__init__(parent)
        self.account = account
        self.setFixedHeight(60)

        layout = QHBoxLayout(self)
        layout.setContentsMargins(12, 8, 12, 8)
        layout.setSpacing(10)

        # Avatar placeholder
        av = QLabel()
        av.setFixedSize(36, 36)
        av.setAlignment(Qt.AlignmentFlag.AlignCenter)
        av.setStyleSheet(
            "background: rgba(108,99,255,0.2); border-radius: 18px;")
        av.setPixmap(get_icon("user-circle", "#6C63FF", 18).pixmap(18, 18))
        layout.addWidget(av)

        # Name + type
        text_col = QVBoxLayout()
        text_col.setSpacing(1)
        name_lbl = QLabel(account.username or "Unknown")
        name_lbl.setStyleSheet(
            "color: #F5F5F7; font-size: 14px; font-weight: 600; "
            "background: transparent; border: none;")
        type_lbl = QLabel(
            "Microsoft" if account.is_microsoft() else "Offline")
        type_lbl.setStyleSheet(
            "color: #A0A0A8; font-size: 11px; "
            "background: transparent; border: none;")
        text_col.addWidget(name_lbl)
        text_col.addWidget(type_lbl)
        layout.addLayout(text_col)
        layout.addStretch()

        if is_active:
            active_badge = QLabel("ACTIVE")
            active_badge.setObjectName("BadgeSuccess")
            layout.addWidget(active_badge)
        else:
            select_btn = QPushButton("Select")
            select_btn.setObjectName("SecondaryBtn")
            select_btn.setFixedWidth(64)
            select_btn.clicked.connect(
                lambda: self.select_clicked.emit(account.id))
            layout.addWidget(select_btn)

        remove_btn = QPushButton()
        remove_btn.setObjectName("IconBtn")
        remove_btn.setIcon(get_icon("trash", "#F87171", 14))
        remove_btn.setFixedSize(30, 30)
        remove_btn.clicked.connect(
            lambda: self.remove_clicked.emit(account.id))
        layout.addWidget(remove_btn)


class _OfflineDialog(QDialog):
    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self.setWindowTitle("Offline Login")
        self.setFixedSize(340, 180)
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
        layout.setContentsMargins(24, 20, 24, 20)

        title = QLabel("Enter username")
        title.setObjectName("H3")
        layout.addWidget(title)

        self.username_edit = QLineEdit()
        self.username_edit.setPlaceholderText("Steve")
        layout.addWidget(self.username_edit)

        buttons = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Ok |
            QDialogButtonBox.StandardButton.Cancel)
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)

    def get_username(self) -> str:
        return self.username_edit.text().strip()


class AccountPanel(QWidget):
    account_changed = Signal(str)   # emits account username

    def __init__(self, parent: QWidget) -> None:
        super().__init__(parent)
        self.setObjectName("SlidePanel")
        self.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        self.setFixedWidth(360)
        self.hide()
        self._visible = False
        self._manager = get_account_manager()
        self._device_flow: dict | None = None
        self._setup_anim()
        self._build_ui()

    def _build_ui(self) -> None:
        root = QVBoxLayout(self)
        root.setContentsMargins(24, 24, 24, 24)
        root.setSpacing(16)

        # Header
        hdr = QHBoxLayout()
        title = QLabel("Accounts")
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

        # Account list
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        self._list_widget = QWidget()
        self._list_layout = QVBoxLayout(self._list_widget)
        self._list_layout.setSpacing(6)
        self._list_layout.addStretch()
        scroll.setWidget(self._list_widget)
        root.addWidget(scroll)

        sep2 = QFrame()
        sep2.setFrameShape(QFrame.Shape.HLine)
        sep2.setStyleSheet("color: rgba(255,255,255,0.08);")
        root.addWidget(sep2)

        # Add account buttons
        ms_btn = QPushButton()
        ms_btn.setObjectName("SecondaryBtn")
        ms_btn.setText("  Add Microsoft Account")
        ms_btn.setIcon(get_icon("user-circle", "#6C63FF", 16))
        ms_btn.clicked.connect(self._start_ms_login)
        root.addWidget(ms_btn)

        offline_btn = QPushButton()
        offline_btn.setObjectName("SecondaryBtn")
        offline_btn.setText("  Add Offline Account")
        offline_btn.setIcon(get_icon("user-circle", "#A0A0A8", 16))
        offline_btn.clicked.connect(self._add_offline)
        root.addWidget(offline_btn)

        # Status
        self._status_lbl = QLabel("")
        self._status_lbl.setObjectName("Muted")
        self._status_lbl.setWordWrap(True)
        root.addWidget(self._status_lbl)

        self.refresh()

    def refresh(self) -> None:
        while self._list_layout.count() > 1:
            item = self._list_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

        active = self._manager.get_active()
        for acc in self._manager.get_all():
            row = _AccountRow(acc, is_active=(
                active and acc.id == active.id))
            row.remove_clicked.connect(self._remove_account)
            row.select_clicked.connect(self._select_account)
            self._list_layout.insertWidget(
                self._list_layout.count() - 1, row)

    def _remove_account(self, acc_id: str) -> None:
        self._manager.remove(acc_id)
        self.refresh()
        active = self._manager.get_active()
        self.account_changed.emit(active.username if active else "")

    def _select_account(self, acc_id: str) -> None:
        self._manager.set_active(acc_id)
        self.refresh()
        acc = self._manager.get(acc_id)
        if acc:
            self.account_changed.emit(acc.username)

    def _add_offline(self) -> None:
        dlg = _OfflineDialog(self)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            name = dlg.get_username()
            if name:
                acc = Account(
                    type="offline",
                    username=name,
                    uuid=str(uuid.uuid3(
                        uuid.NAMESPACE_DNS, f"OfflinePlayer:{name}")),
                )
                self._manager.add(acc)
                self.refresh()
                self.account_changed.emit(acc.username)

    def _start_ms_login(self) -> None:
        from api.microsoft_auth import start_device_code_flow

        self._status_lbl.setText("Starting device code flow…")

        def _init(progress_cb=None, status_cb=None):
            return start_device_code_flow()

        worker = Worker(_init)
        worker.signals.finished.connect(self._on_device_code)
        worker.signals.error.connect(
            lambda e: self._status_lbl.setText(f"Error: {e}"))
        QThreadPool.globalInstance().start(worker)

    def _on_device_code(self, flow: dict) -> None:
        code = flow.get("user_code", "")
        url = flow.get("verification_uri", "https://microsoft.com/link")
        self._status_lbl.setText(
            f"Go to {url} and enter code:\n{code}\n\nWaiting…")
        self._device_flow = flow

        from api.microsoft_auth import poll_device_code_flow, full_microsoft_auth

        def _poll(progress_cb=None, status_cb=None):
            ms_result = poll_device_code_flow(flow, status_cb)
            ms_token = ms_result["access_token"]
            return full_microsoft_auth(ms_token, status_cb)

        worker = Worker(_poll)
        worker.signals.status.connect(self._status_lbl.setText)
        worker.signals.finished.connect(self._on_ms_auth_done)
        worker.signals.error.connect(
            lambda e: self._status_lbl.setText(f"Auth failed: {e}"))
        QThreadPool.globalInstance().start(worker)

    def _on_ms_auth_done(self, info: dict) -> None:
        acc = Account(
            type="microsoft",
            username=info["username"],
            uuid=info["uuid"],
            access_token=info["access_token"],
            expires_at=info["expires_at"],
            xuid=info.get("xuid", ""),
        )
        self._manager.add(acc)
        self._status_lbl.setText(f"Logged in as {acc.username}")
        self.refresh()
        self.account_changed.emit(acc.username)

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
