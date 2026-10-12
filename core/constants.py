"""QMCL — Core constants and paths."""
from __future__ import annotations

import os
import sys
from pathlib import Path

APP_NAME = "QMCL"
APP_VERSION = "1.0.0"
APP_AUTHOR = "QMCL Team"

# ── Data directory ───────────────────────────────────────────────────────────
if sys.platform == "win32":
    _BASE = Path(os.environ.get("APPDATA", Path.home()))
else:
    _BASE = Path.home()

DATA_DIR = _BASE / "QMCL"
INSTANCES_DIR = DATA_DIR / "instances"
ASSETS_DIR = DATA_DIR / "assets"
JAVA_DIR = DATA_DIR / "java"
VERSIONS_DIR = DATA_DIR / "versions"
LIBRARIES_DIR = DATA_DIR / "libraries"
NATIVES_DIR = DATA_DIR / "natives"

ACCOUNTS_FILE = DATA_DIR / "accounts.json"
SETTINGS_FILE = DATA_DIR / "settings.json"
INSTANCES_FILE = DATA_DIR / "instances.json"

for _d in (DATA_DIR, INSTANCES_DIR, ASSETS_DIR, JAVA_DIR, VERSIONS_DIR,
           LIBRARIES_DIR, NATIVES_DIR):
    _d.mkdir(parents=True, exist_ok=True)

# ── Mojang / Minecraft API ────────────────────────────────────────────────────
MOJANG_META = "https://launchermeta.mojang.com"
VERSION_MANIFEST = f"{MOJANG_META}/mc/game/version_manifest_v2.json"
MOJANG_ASSETS = "https://resources.download.minecraft.net"
MOJANG_LIBRARIES = "https://libraries.minecraft.net"

# ── Microsoft / Xbox ─────────────────────────────────────────────────────────
MS_CLIENT_ID = "00000000402b5328"          # public Xbox Live client id
MS_AUTHORITY = "https://login.microsoftonline.com/consumers"
MS_SCOPES = ["XboxLive.signin", "offline_access"]

XBOX_AUTH_URL = "https://user.auth.xboxlive.com/user/authenticate"
XSTS_AUTH_URL = "https://xsts.auth.xboxlive.com/xsts/authorize"
MC_AUTH_URL = "https://api.minecraftservices.com/authentication/login_with_xbox"
MC_PROFILE_URL = "https://api.minecraftservices.com/minecraft/profile"

# ── Fabric / Quilt / Forge / NeoForge ────────────────────────────────────────
FABRIC_META = "https://meta.fabricmc.net/v2"
QUILT_META = "https://meta.quiltmc.org/v3"
FORGE_META = "https://files.minecraftforge.net/net/minecraftforge/forge"
NEOFORGE_META = "https://maven.neoforged.net/releases/net/neoforged/neoforge"

# ── CurseForge & Modrinth ────────────────────────────────────────────────────
CURSEFORGE_API = "https://api.curseforge.com/v1"
CURSEFORGE_API_KEY = "$2a$10$placeholder_replace_with_real_key"   # users set their own
MODRINTH_API = "https://api.modrinth.com/v2"

# ── Adoptium (Java) ───────────────────────────────────────────────────────────
ADOPTIUM_API = "https://api.adoptium.net/v3"

# ── UI Colours ───────────────────────────────────────────────────────────────
COLOR_BG_PRIMARY      = "#121212"
COLOR_BG_SECONDARY    = "#1E1E22"
COLOR_GLASS           = "rgba(30, 30, 35, 0.6)"
COLOR_ACCENT_PRIMARY  = "#6C63FF"
COLOR_ACCENT_GRAD     = "#8B5CF6"
COLOR_ACCENT_CYAN     = "#22D3EE"
COLOR_TEXT_PRIMARY    = "#F5F5F7"
COLOR_TEXT_SECONDARY  = "#A0A0A8"
COLOR_BORDER          = "rgba(255, 255, 255, 0.08)"
COLOR_SUCCESS         = "#4ADE80"
COLOR_ERROR           = "#F87171"
COLOR_WARNING         = "#FBBF24"

# ── Java version requirements ─────────────────────────────────────────────────
JAVA_VERSION_MAP: dict[str, int] = {
    "1.20": 21, "1.19": 17, "1.18": 17, "1.17": 16,
    "1.16": 8,  "1.15": 8,  "1.14": 8,  "1.13": 8,
}

def required_java(mc_version: str) -> int:
    parts = mc_version.split(".")
    key = ".".join(parts[:2]) if len(parts) >= 2 else mc_version
    return JAVA_VERSION_MAP.get(key, 8)
