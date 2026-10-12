# QMCL — Minecraft Launcher

A production-ready, modern Minecraft launcher built with Python 3.11+ and PySide6.  
Glassmorphism dark UI · Microsoft OAuth · Multi-instance · Modrinth & CurseForge · Real game launch

---

## Features

| Category | Details |
|---|---|
| **Auth** | Microsoft Device Code Flow (msal) → Xbox Live → XSTS → Minecraft token chain · Offline/guest mode · Multi-account with JSON persistence |
| **Instances** | Create / Edit / Duplicate / Delete · Per-instance MC version, loader, RAM, JVM args, Java path |
| **Loaders** | Vanilla · Fabric · Quilt · Forge · NeoForge — auto-detect latest compatible loader version |
| **Mods** | Modrinth search & install · CurseForge search & install (API key required) · `.mrpack` & CurseForge `.zip` modpack import |
| **Versions** | Full Mojang version manifest · Release + snapshots · Asset / library / native download with SHA-1 verification |
| **Java** | Auto-detect from PATH & common install dirs · Auto-download from Adoptium API if missing · Version-aware (Java 8/16/17/21) |
| **Launch** | `subprocess.Popen` with full classpath + JVM arg resolution · Real-time stdout capture · Process lifecycle tracking |
| **UI** | Frameless window · Custom title bar (drag, minimize, maximize, close) · Collapsible sidebar · Animated background canvas (blob + particles) · Slide-in settings & account panels · Toast notifications · Page-transition fade animations · Pulse-glow Play button with ripple |

---

## Quick Start

```bash
# 1. Clone / download the project
cd qmcl

# 2. Create virtual environment
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run
python main.py
```

> **Python 3.11+** required. Tested on Windows 11 and Arch Linux.

---

## Building a distributable

### Linux
```bash
bash build.sh
# Output: dist/QMCL
```

### Windows
```bat
build.bat
:: Output: dist\QMCL.exe
```

---

## Project Structure

```
qmcl/
├── main.py                     # Entry point
├── requirements.txt
├── build.sh / build.bat
│
├── core/                       # Business logic (no UI imports)
│   ├── constants.py            # Paths, URLs, colours
│   ├── settings.py             # JSON settings singleton
│   ├── accounts.py             # Account model + manager
│   ├── instances.py            # Instance model + manager
│   ├── java_manager.py         # Java detection + Adoptium download
│   └── launcher.py             # JVM command builder + subprocess launch
│
├── api/                        # External service clients
│   ├── microsoft_auth.py       # MS OAuth → Xbox → XSTS → Minecraft chain
│   ├── mojang.py               # Version manifest, client JAR, libs, assets
│   ├── loaders.py              # Fabric / Quilt / Forge / NeoForge installers
│   └── mod_platforms.py        # Modrinth + CurseForge search & download
│
├── ui/
│   ├── stylesheet.py           # Global QSS dark/glass theme
│   ├── icons.py                # Inline Phosphor SVG icon set
│   ├── workers.py              # QRunnable workers (progress/status signals)
│   ├── main_window.py          # Root window (assembles all components)
│   │
│   ├── widgets/
│   │   ├── background.py       # Animated blob + particle canvas
│   │   ├── titlebar.py         # Frameless drag-capable title bar
│   │   ├── sidebar.py          # Collapsible sidebar with animations
│   │   ├── bottombar.py        # Play button + status indicators
│   │   └── toast.py            # Fade-in/out notification toasts
│   │
│   ├── pages/
│   │   ├── home_page.py        # News cards + quick access
│   │   ├── instances_page.py   # Instance list, create/edit/delete dialogs
│   │   ├── store_page.py       # Modrinth + CurseForge mod browser
│   │   └── skin_page.py        # Skin upload + 2D preview
│   │
│   └── dialogs/
│       ├── settings_panel.py   # Slide-in settings panel
│       ├── account_panel.py    # Account management + MS login flow
│       └── install_dialog.py   # Real-time installation progress dialog
│
└── assets/
    ├── fonts/                  # Inter .ttf files (optional, bundled)
    └── icons/                  # Additional SVG/ICO assets
```

---

## Configuration

All data is stored in:
- **Linux:** `~/.QMCL/`  
- **Windows:** `%APPDATA%\QMCL\`

Key files:
- `accounts.json` — saved accounts (tokens stored locally)
- `instances.json` — instance profiles
- `settings.json` — global launcher settings
- `versions/` — cached version JARs and metadata
- `libraries/` — Minecraft library JARs
- `assets/` — Minecraft asset objects
- `java/` — auto-downloaded JRE runtimes

---

## CurseForge API Key

CurseForge requires a free API key. Get one at [console.curseforge.com](https://console.curseforge.com), then paste it in **Settings → CurseForge API**. Modrinth works without any key.

---

## Dependencies

| Package | Use |
|---|---|
| `PySide6` | Qt 6 GUI framework |
| `requests` | HTTP — API calls, streaming downloads |
| `msal` | Microsoft Authentication Library (Device Code Flow) |
| `Pillow` | Image processing for skin previews |
| `httpx` | Async HTTP (optional, future use) |
| `psutil` | System info (Java detection, RAM) |

---

## License

MIT — see LICENSE file.
