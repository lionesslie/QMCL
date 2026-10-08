<div align="center">

<img src="build/screenshots/01_home.png" width="100%" alt="QMCL Home Screen"/>

# ⚡ QMCL — Quantum Minecraft Launcher

**A modern, glassmorphism-styled Minecraft launcher built with Go + Wails**

[![Go](https://img.shields.io/badge/Go-1.21-00ADD8?style=flat-square&logo=go)](https://go.dev)
[![Wails](https://img.shields.io/badge/Wails-v2.16-FF3E00?style=flat-square)](https://wails.io)
[![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20Windows-6C63FF?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-22D3EE?style=flat-square)]()

</div>

---

## ✨ Features

- 🔐 **Microsoft & Offline Auth** — Full OAuth2 loopback flow, no device codes
- 📦 **Multi-Profile System** — Unlimited profiles, each with isolated game directories
- ⬇️ **Automatic Version Install** — Downloads JARs, libraries, and assets in parallel
- 🧩 **Mod Manager** — Search & install from Modrinth and CurseForge with infinite scroll
- 📦 **Modpack Support** — Install `.mrpack` and CurseForge modpacks directly
- ☕ **Smart Java Detection** — Auto-finds Java from PATH, JAVA_HOME, and common install locations
- 🖥️ **Native on Linux & Windows** — ArchLinux + Windows builds, frameless glass window
- 🎨 **Modern Glassmorphism UI** — Dark theme, animated blobs, Lucide icons, no emojis

---

## 📸 Screenshots

<table>
<tr>
<td width="50%">

**🏠 Home Dashboard**
<img src="build/screenshots/01_home.png" alt="Home Screen"/>

Profile overview, news carousel, quick stats and recent profiles.

</td>
<td width="50%">

**📦 Profile Manager**
<img src="build/screenshots/02_profiles.png" alt="Profiles Screen"/>

Create and manage unlimited game profiles with custom icons, RAM, and mod loaders.

</td>
</tr>
<tr>
<td width="50%">

**🧩 Mod Marketplace**
<img src="build/screenshots/03_mods.png" alt="Mods Screen"/>

Browse and install mods from Modrinth and CurseForge with infinite scroll.

</td>
<td width="50%">

**⚙️ Settings & Accounts**

<img src="build/screenshots/04_settings.png" alt="Settings Panel" width="49%"/> <img src="build/screenshots/05_accounts.png" alt="Accounts Panel" width="49%"/>

RAM slider, Java detection, toggle switches, Microsoft & offline account management.

</td>
</tr>
</table>

---

## 🚀 Getting Started

### Prerequisites

```bash
# ArchLinux
sudo pacman -S go nodejs npm webkit2gtk-4.1

# Wails CLI
go install github.com/wailsapp/wails/v2/cmd/wails@latest
fish_add_path ~/go/bin  # or: export PATH="$HOME/go/bin:$PATH"

# webkit2gtk compatibility symlink (ArchLinux)
sudo ln -sf /usr/lib/pkgconfig/webkit2gtk-4.1.pc \
            /usr/lib/pkgconfig/webkit2gtk-4.0.pc
```

### Build

```bash
git clone https://github.com/youruser/QMCL.git
cd QMCL

# Linux
./build.sh linux

# Windows (cross-compile from Linux)
./build.sh windows

# Development (hot reload)
wails dev
```

The binary is output to `build/bin/QMCL`.

---

## 🏗️ Architecture

```
QMCL/
├── main.go                  # Wails entry point
├── app.go                   # All backend bindings
├── backend/
│   ├── auth/auth.go         # Microsoft OAuth2 loopback + Offline
│   ├── profiles/profiles.go # Multi-profile management
│   ├── versions/versions.go # Version manifest + parallel download
│   ├── mods/mods.go         # Modrinth + CurseForge search & install
│   ├── mods/modpack.go      # .mrpack + CurseForge modpack installer
│   ├── download/download.go # Concurrent download manager
│   └── launcher/launcher.go # JVM launcher + classpath builder
└── frontend/
    ├── index.html
    └── src/
        ├── app.js           # Full UI (glassmorphism, all pages)
        ├── style.css        # Design system
        ├── icons.js         # Lucide SVG icon library
        └── wails.js         # Wails bridge + dev mock
```

---

## ⚙️ Configuration

### CurseForge API Key

Get a free key at [console.curseforge.com](https://console.curseforge.com) and add it to `backend/mods/mods.go`:

```go
const CurseForgeAPIKey = "your-api-key-here"
```

### Data Directory

| Platform | Path |
|----------|------|
| Linux    | `~/.local/share/QMCL/` |
| Windows  | `%APPDATA%\QMCL\` |

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Go 1.21 |
| Desktop Bridge | Wails v2.16 |
| Frontend | Vanilla JS (ES Modules) + Vite |
| Icons | [Lucide](https://lucide.dev) (inline SVG) |
| Auth | Microsoft Live OAuth2 (loopback redirect) |
| Mod Sources | Modrinth API v2, CurseForge API v1 |

---

## 📋 Supported Mod Loaders

| Loader | Status |
|--------|--------|
| Vanilla | ✅ Full support |
| Fabric | ✅ Full support |
| Forge | ✅ JAR detection |
| NeoForge | ✅ JAR detection |
| Quilt | ✅ Profile support |

---

## 🗺️ Roadmap

- [ ] Forge/NeoForge automatic installer
- [ ] Auto-update system for the launcher
- [ ] Shader & resource pack manager
- [ ] Server browser integration
- [ ] Java 21 automatic download
- [ ] Import from other launchers (MultiMC, Prism)

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

<div align="center">

Made with ❤️ using [Wails](https://wails.io) · [Lucide Icons](https://lucide.dev) · [Modrinth](https://modrinth.com)

</div>
