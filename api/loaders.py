"""QMCL — Mod loader installers: Fabric, Quilt, Forge, NeoForge."""
from __future__ import annotations

import json
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Callable, Optional

import requests

from core.constants import (
    DATA_DIR, FABRIC_META, QUILT_META, VERSIONS_DIR,
)
from api.mojang import _download, download_libraries_from_info

ProgressCb = Optional[Callable[[int], None]]
StatusCb = Optional[Callable[[str], None]]

_NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0) if sys.platform == "win32" else 0


# ── Shared: Fabric-style profile loaders (Fabric + Quilt) ─────────────────────

def _install_profile_loader(name: str, meta: str, mc_version: str,
                            loader_version: str,
                            progress_cb: ProgressCb, status_cb: StatusCb) -> str:
    if status_cb:
        status_cb(f"Installing {name} {loader_version}…")
    url = f"{meta}/versions/loader/{mc_version}/{loader_version}/profile/json"
    r = requests.get(url, timeout=20)
    r.raise_for_status()
    profile = r.json()

    profile_id = profile["id"]
    dest = VERSIONS_DIR / profile_id / f"{profile_id}.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open("w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2)

    # Fabric/Quilt libraries only carry a maven "name" + base "url";
    # library_artifact() turns them into real download URLs.
    download_libraries_from_info(profile, None, progress_cb, status_cb)
    if status_cb:
        status_cb(f"{name} installed.")
    return profile_id


# ── Fabric ────────────────────────────────────────────────────────────────────

def get_fabric_versions(mc_version: str) -> list[dict]:
    r = requests.get(f"{FABRIC_META}/versions/loader/{mc_version}", timeout=15)
    if r.status_code == 404:
        return []
    r.raise_for_status()
    return r.json()


def pick_stable(versions: list[dict]) -> str:
    """Latest *stable* loader version from a Fabric/Quilt meta list."""
    for v in versions:
        loader = v.get("loader", {})
        if loader.get("stable", True) and "beta" not in loader.get("version", ""):
            return loader["version"]
    return versions[0]["loader"]["version"] if versions else ""


def install_fabric(mc_version: str, loader_version: str, java_path: str = "",
                   progress_cb: ProgressCb = None,
                   status_cb: StatusCb = None) -> str:
    return _install_profile_loader("Fabric", FABRIC_META, mc_version,
                                   loader_version, progress_cb, status_cb)


# ── Quilt ─────────────────────────────────────────────────────────────────────

def get_quilt_versions(mc_version: str) -> list[dict]:
    r = requests.get(f"{QUILT_META}/versions/loader/{mc_version}", timeout=15)
    if r.status_code == 404:
        return []
    r.raise_for_status()
    return r.json()


def install_quilt(mc_version: str, loader_version: str, java_path: str = "",
                  progress_cb: ProgressCb = None,
                  status_cb: StatusCb = None) -> str:
    return _install_profile_loader("Quilt", QUILT_META, mc_version,
                                   loader_version, progress_cb, status_cb)


# ── Installer-based loaders (Forge / NeoForge) ────────────────────────────────

def _maven_versions(metadata_url: str) -> list[str]:
    r = requests.get(metadata_url, timeout=20)
    r.raise_for_status()
    root = ET.fromstring(r.text)
    return [el.text for el in root.findall(".//versions/version") if el.text]


def _ensure_launcher_profiles() -> None:
    """Forge/NeoForge installers refuse to run without this file."""
    f = DATA_DIR / "launcher_profiles.json"
    if not f.exists():
        f.write_text(json.dumps({"profiles": {}, "version": 3}), encoding="utf-8")


def _run_installer(java_path: str, jar: Path, flag: str) -> None:
    _ensure_launcher_profiles()
    result = subprocess.run(
        [java_path or "java", "-jar", str(jar), flag, str(DATA_DIR)],
        capture_output=True, text=True, timeout=900,
        creationflags=_NO_WINDOW)
    if result.returncode != 0:
        tail = (result.stderr or result.stdout or "")[-600:]
        raise RuntimeError(f"Installer failed (exit {result.returncode}):\n{tail}")


# Forge
def get_forge_versions(mc_version: str) -> list[str]:
    """Forge versions for *mc_version*, newest first (without the MC prefix)."""
    try:
        all_v = _maven_versions(
            "https://maven.minecraftforge.net/net/minecraftforge/forge/"
            "maven-metadata.xml")
    except Exception:       # noqa: BLE001
        return []
    prefix = f"{mc_version}-"
    found = [v[len(prefix):] for v in all_v if v.startswith(prefix)]
    return list(reversed(found))


def install_forge(mc_version: str, forge_version: str, java_path: str = "",
                  progress_cb: ProgressCb = None,
                  status_cb: StatusCb = None) -> str:
    if status_cb:
        status_cb(f"Downloading Forge {forge_version}…")
    full = f"{mc_version}-{forge_version}"
    name = f"forge-{full}-installer.jar"
    url = f"https://maven.minecraftforge.net/net/minecraftforge/forge/{full}/{name}"
    dest = VERSIONS_DIR / "_installers" / name
    _download(url, dest)
    if progress_cb:
        progress_cb(40)

    if status_cb:
        status_cb("Running Forge installer (this can take a few minutes)…")
    _run_installer(java_path, dest, "--installClient")
    if progress_cb:
        progress_cb(100)
    if status_cb:
        status_cb("Forge installed.")
    return f"{mc_version}-forge-{forge_version}"


# NeoForge
def get_neoforge_versions(mc_version: str) -> list[str]:
    """NeoForge versions for *mc_version* (1.21.1 → 21.1.x), newest first."""
    try:
        parts = mc_version.split(".")
        if len(parts) < 2 or parts[0] != "1":
            return []
        minor = parts[1]
        patch = parts[2] if len(parts) > 2 else "0"
        prefix = f"{minor}.{patch}."
        all_v = _maven_versions(
            "https://maven.neoforged.net/releases/net/neoforged/neoforge/"
            "maven-metadata.xml")
    except Exception:       # noqa: BLE001
        return []
    return list(reversed([v for v in all_v if v.startswith(prefix)]))


def install_neoforge(mc_version: str, neoforge_version: str,
                     java_path: str = "",
                     progress_cb: ProgressCb = None,
                     status_cb: StatusCb = None) -> str:
    if status_cb:
        status_cb(f"Downloading NeoForge {neoforge_version}…")
    name = f"neoforge-{neoforge_version}-installer.jar"
    url = ("https://maven.neoforged.net/releases/net/neoforged/neoforge/"
           f"{neoforge_version}/{name}")
    dest = VERSIONS_DIR / "_installers" / name
    _download(url, dest)
    if progress_cb:
        progress_cb(40)

    if status_cb:
        status_cb("Running NeoForge installer (this can take a few minutes)…")
    _run_installer(java_path, dest, "--installClient")
    if progress_cb:
        progress_cb(100)
    if status_cb:
        status_cb("NeoForge installed.")
    return f"neoforge-{neoforge_version}"
