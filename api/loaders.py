"""QMCL — Mod loader installers: Fabric, Quilt, Forge, NeoForge."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Callable, Optional

import requests

from core.constants import (
    FABRIC_META, QUILT_META,
    VERSIONS_DIR, LIBRARIES_DIR,
)


# ── Fabric ────────────────────────────────────────────────────────────────────

def get_fabric_versions(mc_version: str) -> list[dict]:
    url = f"{FABRIC_META}/versions/loader/{mc_version}"
    r = requests.get(url, timeout=15)
    if r.status_code == 404:
        return []
    r.raise_for_status()
    return r.json()


def install_fabric(mc_version: str, loader_version: str,
                   java_path: str,
                   progress_cb=None, status_cb=None) -> None:
    """Download and install the Fabric profile JSON."""
    if status_cb:
        status_cb(f"Installing Fabric {loader_version}…")

    url = (f"{FABRIC_META}/versions/loader/{mc_version}"
           f"/{loader_version}/profile/json")
    r = requests.get(url, timeout=15)
    r.raise_for_status()
    profile = r.json()

    profile_id = profile["id"]
    dest = VERSIONS_DIR / profile_id / f"{profile_id}.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open("w") as f:
        json.dump(profile, f, indent=2)

    # download Fabric libraries
    from api.mojang import _download, _rules_allow, LIBRARIES_DIR
    libs = profile.get("libraries", [])
    total = len(libs)
    for i, lib in enumerate(libs):
        if not _rules_allow(lib.get("rules", [])):
            continue
        downloads = lib.get("downloads", {})
        artifact = downloads.get("artifact")
        if artifact and artifact.get("url"):
            dest_lib = LIBRARIES_DIR / artifact["path"]
            _download(artifact["url"], dest_lib, artifact.get("sha1"))
        if progress_cb:
            progress_cb(int((i + 1) / total * 100))

    if status_cb:
        status_cb("Fabric installed.")


# ── Quilt ─────────────────────────────────────────────────────────────────────

def get_quilt_versions(mc_version: str) -> list[dict]:
    url = f"{QUILT_META}/versions/loader/{mc_version}"
    r = requests.get(url, timeout=15)
    if r.status_code == 404:
        return []
    r.raise_for_status()
    return r.json()


def install_quilt(mc_version: str, loader_version: str,
                  java_path: str,
                  progress_cb=None, status_cb=None) -> None:
    if status_cb:
        status_cb(f"Installing Quilt {loader_version}…")

    url = (f"{QUILT_META}/versions/loader/{mc_version}"
           f"/{loader_version}/profile/json")
    r = requests.get(url, timeout=15)
    r.raise_for_status()
    profile = r.json()

    profile_id = profile["id"]
    dest = VERSIONS_DIR / profile_id / f"{profile_id}.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open("w") as f:
        json.dump(profile, f, indent=2)

    from api.mojang import _download, _rules_allow, LIBRARIES_DIR
    libs = profile.get("libraries", [])
    total = len(libs)
    for i, lib in enumerate(libs):
        if not _rules_allow(lib.get("rules", [])):
            continue
        downloads = lib.get("downloads", {})
        artifact = downloads.get("artifact")
        if artifact and artifact.get("url"):
            dest_lib = LIBRARIES_DIR / artifact["path"]
            _download(artifact["url"], dest_lib, artifact.get("sha1"))
        if progress_cb:
            progress_cb(int((i + 1) / total * 100))

    if status_cb:
        status_cb("Quilt installed.")


# ── Forge ─────────────────────────────────────────────────────────────────────

def get_forge_versions(mc_version: str) -> list[str]:
    """Fetch Forge version list from Maven metadata."""
    url = (f"https://files.minecraftforge.net/net/minecraftforge/forge/"
           f"maven-metadata.json")
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        data = r.json()
        return data.get(mc_version, [])
    except Exception:
        return []


def install_forge(mc_version: str, forge_version: str,
                  java_path: str,
                  progress_cb=None, status_cb=None) -> None:
    """Download and run the Forge installer JAR."""
    if status_cb:
        status_cb(f"Downloading Forge {forge_version}…")

    installer_name = f"forge-{mc_version}-{forge_version}-installer.jar"
    url = (f"https://files.minecraftforge.net/net/minecraftforge/forge/"
           f"{mc_version}-{forge_version}/{installer_name}")

    from api.mojang import _download
    dest = VERSIONS_DIR / "forge_installers" / installer_name
    _download(url, dest)

    if status_cb:
        status_cb("Running Forge installer…")

    result = subprocess.run(
        [java_path, "-jar", str(dest), "--installClient",
         str(VERSIONS_DIR.parent)],
        capture_output=True, text=True, timeout=300
    )
    if result.returncode != 0:
        raise RuntimeError(f"Forge install failed:\n{result.stderr}")

    if status_cb:
        status_cb("Forge installed.")


# ── NeoForge ──────────────────────────────────────────────────────────────────

def get_neoforge_versions(mc_version: str) -> list[str]:
    try:
        # NeoForge uses a different version scheme: mc_version without "1."
        neo_mc = mc_version.lstrip("1.")  # e.g. "1.20.4" -> "20.4"
        url = ("https://maven.neoforged.net/releases/net/neoforged/neoforge/"
               "maven-metadata.xml")
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        import xml.etree.ElementTree as ET
        root = ET.fromstring(r.text)
        versions_el = root.find(".//versions")
        if versions_el is None:
            return []
        all_v = [el.text for el in versions_el.findall("version")
                 if el.text and el.text.startswith(neo_mc)]
        return list(reversed(all_v))
    except Exception:
        return []


def install_neoforge(mc_version: str, neoforge_version: str,
                     java_path: str,
                     progress_cb=None, status_cb=None) -> None:
    if status_cb:
        status_cb(f"Downloading NeoForge {neoforge_version}…")

    installer_name = f"neoforge-{neoforge_version}-installer.jar"
    url = (f"https://maven.neoforged.net/releases/net/neoforged/neoforge/"
           f"{neoforge_version}/{installer_name}")

    from api.mojang import _download
    dest = VERSIONS_DIR / "neoforge_installers" / installer_name
    _download(url, dest)

    if status_cb:
        status_cb("Running NeoForge installer…")

    result = subprocess.run(
        [java_path, "-jar", str(dest), "--install-client",
         str(VERSIONS_DIR.parent)],
        capture_output=True, text=True, timeout=300
    )
    if result.returncode != 0:
        raise RuntimeError(f"NeoForge install failed:\n{result.stderr}")

    if status_cb:
        status_cb("NeoForge installed.")
