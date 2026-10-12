"""QMCL — Mojang API: version manifest, version JSON, asset index."""
from __future__ import annotations

import hashlib
import json
import os
import sys
import zipfile
from pathlib import Path
from typing import Callable, Optional

import requests

from core.constants import (
    VERSION_MANIFEST, MOJANG_ASSETS, MOJANG_LIBRARIES,
    VERSIONS_DIR, LIBRARIES_DIR, ASSETS_DIR,
)


def _sha1_file(path: Path) -> str:
    h = hashlib.sha1()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _download(url: str, dest: Path,
              expected_sha1: Optional[str] = None,
              progress_cb: Optional[Callable[[int, int], None]] = None) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and expected_sha1:
        if _sha1_file(dest) == expected_sha1:
            return
    with requests.get(url, stream=True, timeout=30) as r:
        r.raise_for_status()
        total = int(r.headers.get("content-length", 0))
        done = 0
        with dest.open("wb") as f:
            for chunk in r.iter_content(65536):
                f.write(chunk)
                done += len(chunk)
                if progress_cb:
                    progress_cb(done, total)


# ── Version manifest ──────────────────────────────────────────────────────────

def get_version_manifest(show_snapshots: bool = False) -> list[dict]:
    r = requests.get(VERSION_MANIFEST, timeout=15)
    r.raise_for_status()
    versions = r.json()["versions"]
    if not show_snapshots:
        versions = [v for v in versions if v["type"] == "release"]
    return versions


def get_version_info(version_id: str) -> dict:
    """Fetch and cache the per-version JSON."""
    cache = VERSIONS_DIR / version_id / f"{version_id}.json"
    if cache.exists():
        with cache.open("r") as f:
            return json.load(f)
    # find url from manifest
    manifest = requests.get(VERSION_MANIFEST, timeout=15).json()
    url = next((v["url"] for v in manifest["versions"]
                if v["id"] == version_id), None)
    if not url:
        raise ValueError(f"Version {version_id} not found in manifest")
    r = requests.get(url, timeout=15)
    r.raise_for_status()
    data = r.json()
    cache.parent.mkdir(parents=True, exist_ok=True)
    with cache.open("w") as f:
        json.dump(data, f, indent=2)
    return data


# ── Client JAR ───────────────────────────────────────────────────────────────

def download_client(version_id: str,
                    progress_cb=None,
                    status_cb=None) -> Path:
    info = get_version_info(version_id)
    client = info["downloads"]["client"]
    dest = VERSIONS_DIR / version_id / f"{version_id}.jar"
    if status_cb:
        status_cb(f"Downloading client {version_id}…")
    _download(client["url"], dest, client.get("sha1"), progress_cb)
    return dest


# ── Libraries ─────────────────────────────────────────────────────────────────

def _native_classifier() -> str:
    if sys.platform == "win32":
        return "natives-windows"
    if sys.platform == "darwin":
        return "natives-macos"
    return "natives-linux"


def _rules_allow(rules: list) -> bool:
    if not rules:
        return True
    allow = False
    for rule in rules:
        action = rule["action"] == "allow"
        os_rule = rule.get("os", {})
        if not os_rule:
            allow = action
        else:
            os_name = os_rule.get("name", "")
            cur_os = {"win32": "windows",
                      "darwin": "osx"}.get(sys.platform, "linux")
            if os_name == cur_os:
                allow = action
    return allow


def download_libraries(version_id: str,
                       progress_cb=None,
                       status_cb=None) -> list[Path]:
    info = get_version_info(version_id)
    classpath: list[Path] = []
    libs = info.get("libraries", [])
    total = len(libs)

    for i, lib in enumerate(libs):
        if not _rules_allow(lib.get("rules", [])):
            continue

        downloads = lib.get("downloads", {})
        artifact = downloads.get("artifact")
        if artifact:
            dest = LIBRARIES_DIR / artifact["path"]
            if status_cb:
                status_cb(f"Library {i+1}/{total}: {lib['name']}")
            _download(artifact["url"], dest, artifact.get("sha1"))
            classpath.append(dest)
            if progress_cb:
                progress_cb(int((i + 1) / total * 100))

        # natives
        native_key = _native_classifier()
        classifiers = downloads.get("classifiers", {})
        native = classifiers.get(native_key)
        if native:
            dest = LIBRARIES_DIR / native["path"]
            _download(native["url"], dest, native.get("sha1"))
            # extract to natives dir
            natives_dest = VERSIONS_DIR / version_id / "natives"
            natives_dest.mkdir(parents=True, exist_ok=True)
            if dest.exists():
                with zipfile.ZipFile(dest) as zf:
                    for name in zf.namelist():
                        if not name.startswith("META-INF"):
                            zf.extract(name, natives_dest)

    return classpath


# ── Assets ────────────────────────────────────────────────────────────────────

def download_assets(version_id: str,
                    progress_cb=None,
                    status_cb=None) -> None:
    info = get_version_info(version_id)
    asset_index_info = info.get("assetIndex", {})
    index_url = asset_index_info.get("url")
    index_id = asset_index_info.get("id", version_id)

    indexes_dir = ASSETS_DIR / "indexes"
    indexes_dir.mkdir(parents=True, exist_ok=True)
    index_file = indexes_dir / f"{index_id}.json"

    if not index_file.exists():
        _download(index_url, index_file)

    with index_file.open("r") as f:
        index = json.load(f)

    objects = index.get("objects", {})
    total = len(objects)
    if status_cb:
        status_cb(f"Downloading {total} assets…")

    for i, (name, obj) in enumerate(objects.items()):
        h = obj["hash"]
        prefix = h[:2]
        dest = ASSETS_DIR / "objects" / prefix / h
        if not dest.exists():
            url = f"{MOJANG_ASSETS}/{prefix}/{h}"
            _download(url, dest, h)
        if progress_cb and total:
            progress_cb(int((i + 1) / total * 100))


# ── Full installation ─────────────────────────────────────────────────────────

def install_version(version_id: str,
                    progress_cb=None,
                    status_cb=None) -> None:
    """Download client, libraries and assets for a Vanilla version."""
    if status_cb:
        status_cb("Fetching version info…")
    get_version_info(version_id)

    if status_cb:
        status_cb("Downloading client JAR…")
    download_client(version_id, progress_cb, status_cb)

    if status_cb:
        status_cb("Downloading libraries…")
    download_libraries(version_id, progress_cb, status_cb)

    if status_cb:
        status_cb("Downloading assets…")
    download_assets(version_id, progress_cb, status_cb)

    if status_cb:
        status_cb("Installation complete.")
