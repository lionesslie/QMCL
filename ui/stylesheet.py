"""QMCL — Global QSS stylesheet (glassmorphism dark theme)."""

STYLESHEET = """
/* ── Global ──────────────────────────────────────────────────────────── */
* {
    font-family: "Inter", "Segoe UI", "SF Pro Display", sans-serif;
    color: #F5F5F7;
    selection-background-color: #6C63FF;
    selection-color: #FFFFFF;
}

QWidget {
    background: transparent;
}

QMainWindow, #MainWindow {
    background: #121212;
}

/* ── Scrollbars ──────────────────────────────────────────────────────── */
QScrollBar:vertical {
    background: rgba(255,255,255,0.03);
    width: 6px;
    margin: 0;
    border-radius: 3px;
}
QScrollBar::handle:vertical {
    background: rgba(108,99,255,0.5);
    min-height: 30px;
    border-radius: 3px;
}
QScrollBar::handle:vertical:hover {
    background: rgba(108,99,255,0.8);
}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
    height: 0;
}
QScrollBar:horizontal {
    background: rgba(255,255,255,0.03);
    height: 6px;
    border-radius: 3px;
}
QScrollBar::handle:horizontal {
    background: rgba(108,99,255,0.5);
    min-width: 30px;
    border-radius: 3px;
}

/* ── Title Bar ───────────────────────────────────────────────────────── */
#TitleBar {
    background: rgba(18,18,18,0.95);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    min-height: 52px;
    max-height: 52px;
}

#TitleBarBtn {
    background: transparent;
    border: none;
    border-radius: 8px;
    padding: 6px;
    color: #A0A0A8;
}
#TitleBarBtn:hover {
    background: rgba(255,255,255,0.08);
    color: #F5F5F7;
}

#CloseBtn {
    background: transparent;
    border: none;
    border-radius: 8px;
    padding: 6px;
    color: #A0A0A8;
}
#CloseBtn:hover {
    background: rgba(248,113,113,0.25);
    color: #F87171;
}

#MinimizeBtn, #MaximizeBtn {
    background: transparent;
    border: none;
    border-radius: 8px;
    padding: 6px;
    color: #A0A0A8;
}
#MinimizeBtn:hover, #MaximizeBtn:hover {
    background: rgba(255,255,255,0.08);
    color: #F5F5F7;
}

/* ── Sidebar ─────────────────────────────────────────────────────────── */
#Sidebar {
    background: rgba(20,20,24,0.97);
    border-right: 1px solid rgba(255,255,255,0.06);
}

#SidebarCollapsed {
    background: rgba(20,20,24,0.97);
    border-right: 1px solid rgba(255,255,255,0.06);
}

#SidebarBtn {
    background: transparent;
    border: none;
    border-radius: 10px;
    padding: 10px 14px;
    color: #A0A0A8;
    text-align: left;
    font-size: 14px;
    font-weight: 500;
    margin: 1px 8px;
}
#SidebarBtn:hover {
    background: rgba(108,99,255,0.12);
    color: #F5F5F7;
}
#SidebarBtn[active="true"] {
    background: rgba(108,99,255,0.2);
    color: #8B5CF6;
}

#CollapseBtn {
    background: transparent;
    border: none;
    border-radius: 8px;
    padding: 8px;
    color: #A0A0A8;
}
#CollapseBtn:hover {
    background: rgba(255,255,255,0.06);
    color: #F5F5F7;
}

/* ── Bottom Bar ──────────────────────────────────────────────────────── */
#BottomBar {
    background: rgba(18,18,18,0.97);
    border-top: 1px solid rgba(255,255,255,0.06);
    min-height: 72px;
    max-height: 72px;
}

#PlayButton {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                                stop:0 #6C63FF, stop:1 #8B5CF6);
    border: none;
    border-radius: 14px;
    color: #FFFFFF;
    font-size: 16px;
    font-weight: 700;
    padding: 0 40px;
    min-height: 48px;
    min-width: 180px;
}
#PlayButton:hover {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                                stop:0 #7C72FF, stop:1 #9B6CFF);
}
#PlayButton:pressed {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                                stop:0 #5C53EF, stop:1 #7B4CE6);
}
#PlayButton:disabled {
    background: rgba(108,99,255,0.3);
    color: rgba(255,255,255,0.4);
}

/* ── Glass Cards ─────────────────────────────────────────────────────── */
#GlassCard {
    background: rgba(30,30,35,0.6);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
}

#GlassCardHover {
    background: rgba(35,35,42,0.7);
    border: 1px solid rgba(108,99,255,0.25);
    border-radius: 16px;
}

/* ── Instance Cards ──────────────────────────────────────────────────── */
#InstanceCard {
    background: rgba(28,28,34,0.7);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 0;
}
#InstanceCard:hover {
    background: rgba(35,35,44,0.85);
    border: 1px solid rgba(108,99,255,0.3);
}

/* ── Buttons ─────────────────────────────────────────────────────────── */
#PrimaryBtn {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                                stop:0 #6C63FF, stop:1 #8B5CF6);
    border: none;
    border-radius: 10px;
    color: #FFFFFF;
    font-size: 14px;
    font-weight: 600;
    padding: 8px 20px;
    min-height: 38px;
}
#PrimaryBtn:hover {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                                stop:0 #7C72FF, stop:1 #9B6CFF);
}
#PrimaryBtn:pressed {
    background: #5A52DD;
}

#SecondaryBtn {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: #F5F5F7;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 20px;
    min-height: 38px;
}
#SecondaryBtn:hover {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.18);
}

#DangerBtn {
    background: rgba(248,113,113,0.15);
    border: 1px solid rgba(248,113,113,0.3);
    border-radius: 10px;
    color: #F87171;
    font-size: 13px;
    font-weight: 500;
    padding: 6px 14px;
}
#DangerBtn:hover {
    background: rgba(248,113,113,0.25);
}

#IconBtn {
    background: transparent;
    border: none;
    border-radius: 8px;
    padding: 6px;
    color: #A0A0A8;
}
#IconBtn:hover {
    background: rgba(255,255,255,0.08);
    color: #F5F5F7;
}

/* ── Line Edit / Search ──────────────────────────────────────────────── */
QLineEdit, #SearchBox {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: #F5F5F7;
    font-size: 14px;
    padding: 8px 14px;
    min-height: 36px;
    selection-background-color: #6C63FF;
}
QLineEdit:focus, #SearchBox:focus {
    border: 1px solid rgba(108,99,255,0.6);
    background: rgba(108,99,255,0.08);
}

/* ── ComboBox ────────────────────────────────────────────────────────── */
QComboBox {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: #F5F5F7;
    font-size: 14px;
    padding: 6px 12px;
    min-height: 36px;
    selection-background-color: #6C63FF;
}
QComboBox:hover {
    border: 1px solid rgba(255,255,255,0.2);
}
QComboBox:focus {
    border: 1px solid rgba(108,99,255,0.6);
}
QComboBox::drop-down {
    border: none;
    width: 28px;
}
QComboBox::down-arrow {
    image: none;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 5px solid #A0A0A8;
}
QComboBox QAbstractItemView {
    background: #1E1E26;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: #F5F5F7;
    selection-background-color: rgba(108,99,255,0.3);
    padding: 4px;
    outline: none;
}

/* ── SpinBox ─────────────────────────────────────────────────────────── */
QSpinBox {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: #F5F5F7;
    font-size: 14px;
    padding: 6px 12px;
    min-height: 36px;
}
QSpinBox:focus {
    border: 1px solid rgba(108,99,255,0.6);
}
QSpinBox::up-button, QSpinBox::down-button {
    background: rgba(255,255,255,0.05);
    border: none;
    width: 24px;
    border-radius: 4px;
}

/* ── Slider ──────────────────────────────────────────────────────────── */
QSlider::groove:horizontal {
    background: rgba(255,255,255,0.1);
    height: 4px;
    border-radius: 2px;
}
QSlider::handle:horizontal {
    background: #6C63FF;
    width: 16px;
    height: 16px;
    border-radius: 8px;
    margin: -6px 0;
}
QSlider::sub-page:horizontal {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                                stop:0 #6C63FF, stop:1 #8B5CF6);
    border-radius: 2px;
}

/* ── ProgressBar ─────────────────────────────────────────────────────── */
QProgressBar {
    background: rgba(255,255,255,0.08);
    border: none;
    border-radius: 6px;
    height: 8px;
    text-align: center;
    color: transparent;
}
QProgressBar::chunk {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                                stop:0 #6C63FF, stop:1 #22D3EE);
    border-radius: 6px;
}

/* ── TabWidget ───────────────────────────────────────────────────────── */
QTabWidget::pane {
    background: transparent;
    border: none;
}
QTabBar {
    background: transparent;
}
QTabBar::tab {
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: #A0A0A8;
    font-size: 14px;
    font-weight: 500;
    padding: 10px 20px;
    margin-right: 4px;
}
QTabBar::tab:selected {
    color: #8B5CF6;
    border-bottom: 2px solid #8B5CF6;
}
QTabBar::tab:hover {
    color: #F5F5F7;
}

/* ── Labels ──────────────────────────────────────────────────────────── */
#H1 { font-size: 28px; font-weight: 700; color: #F5F5F7; }
#H2 { font-size: 22px; font-weight: 700; color: #F5F5F7; }
#H3 { font-size: 18px; font-weight: 600; color: #F5F5F7; }
#Body { font-size: 14px; font-weight: 400; color: #F5F5F7; }
#Muted { font-size: 13px; font-weight: 400; color: #A0A0A8; }
#Tag  { font-size: 11px; font-weight: 600; color: #6C63FF; }

/* ── Dialogs / Panels ────────────────────────────────────────────────── */
#SlidePanel {
    background: rgba(22,22,28,0.97);
    border-left: 1px solid rgba(255,255,255,0.08);
}

#DialogOverlay {
    background: rgba(0,0,0,0.6);
}

#Dialog {
    background: #1A1A22;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px;
}

/* ── CheckBox toggle ─────────────────────────────────────────────────── */
#Toggle {
    spacing: 8px;
    font-size: 14px;
    color: #F5F5F7;
}
#Toggle::indicator {
    width: 44px;
    height: 24px;
    border-radius: 12px;
    background: rgba(255,255,255,0.12);
    border: none;
}
#Toggle::indicator:checked {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                                stop:0 #6C63FF, stop:1 #8B5CF6);
}

/* ── Menu ────────────────────────────────────────────────────────────── */
QMenu {
    background: #1E1E28;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    padding: 6px;
    color: #F5F5F7;
}
QMenu::item {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
}
QMenu::item:selected {
    background: rgba(108,99,255,0.25);
    color: #F5F5F7;
}
QMenu::separator {
    height: 1px;
    background: rgba(255,255,255,0.08);
    margin: 4px 8px;
}

/* ── Tooltip ─────────────────────────────────────────────────────────── */
QToolTip {
    background: #2A2A35;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px;
    color: #F5F5F7;
    font-size: 12px;
    padding: 6px 10px;
}

/* ── Status badges ───────────────────────────────────────────────────── */
#BadgeSuccess {
    background: rgba(74,222,128,0.15);
    border: 1px solid rgba(74,222,128,0.3);
    border-radius: 6px;
    color: #4ADE80;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
}
#BadgeError {
    background: rgba(248,113,113,0.15);
    border: 1px solid rgba(248,113,113,0.3);
    border-radius: 6px;
    color: #F87171;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
}
#BadgeWarning {
    background: rgba(251,191,36,0.15);
    border: 1px solid rgba(251,191,36,0.3);
    border-radius: 6px;
    color: #FBBF24;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
}
#BadgeInfo {
    background: rgba(34,211,238,0.12);
    border: 1px solid rgba(34,211,238,0.25);
    border-radius: 6px;
    color: #22D3EE;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
}
"""
