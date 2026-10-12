"""QMCL — Mojang API: version manifest, version JSON, libraries, assets."""
from __future__ import annotations

import hashlib
import json
import platform
import sys
import threading
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Callable, Optional

import requests

from core.constants import (
    VERSION_MANIFEST, MOJANG_ASSETS, MOJANG_LIBRARIES,
    VERSIONS_DIR, LIBRARIES_DIR, ASSETS_DIR, required_java,
)

ProgressCb = Optional[Callable[[int], None]]
StatusCb = Optional[Callable[[str], None]]

_OS_KEY = {"win32": "windows", "darwin": "osx"}.get(sys.platform, "linux")


# ── Low-level download helpers ────────────────────────────────────────────────

def _sha1_file(path: Path) -> str:
    h = hashlib.sha1()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _download(url: str, dest: Path,
              expected_sha1: Optional[str] = None,
              progress_cb: Optional[Callable[[int, int], None]] = None,
              retries: int = 3) -> None:
    """Download *url* to *dest*.

    ``progress_cb`` receives ``(bytes_done, bytes_total)``.
    Existing files are reused when their checksum matches.
    """
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        if expected_sha1 is None or _sha1_file(dest) == expected_sha1:
            return

    last_exc: Exception | None = None
    for _ in range(retries):
        tmp = dest.with_name(dest.name + ".part")
        try:
            with requests.get(url, stream=True, timeout=30) as r:
                r.raise_for_status()
                total = int(r.headers.get("content-length", 0))
                done = 0
                with tmp.open("wb") as f:
                    for chunk in r.iter_content(65536):
                        f.write(chunk)
                        done += len(chunk)
                        if progress_cb:
                            progress_cb(done, total)
            if expected_sha1 and _sha1_file(tmp) != expected_sha1:
                raise IOError(f"Checksum mismatch for {dest.name}")
            tmp.replace(dest)
            return
        except Exception as exc:        # noqa: BLE001
            last_exc = exc
            tmp.unlink(missing_ok=True)
    assert last_exc is not None
    raise last_exc


def _download_many(items: list[tuple[str, Path, Optional[str]]],
                   progress_cb: ProgressCb = None,
                   workers: int = 16) -> None:
    """Parallel download of (url, dest, sha1) triples with 0-100 progress."""
    total = len(items)
    if total == 0:
        if progress_cb:
            progress_cb(100)
        return
    done = 0
    last_pct = -1
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futures = [ex.submit(_download, url, dest, sha1)
                   for url, dest, sha1 in items]
        for fut in as_completed(futures):
            fut.result()                    # re-raise errors
            done += 1
            pct = int(done * 100 / total)
            if progress_cb and pct != last_pct:
                last_pct = pct
                progress_cb(pct)


def _scaled(progress_cb: ProgressCb, lo: int, hi: int) -> ProgressCb:
    """Map a 0-100 stage progress into the [lo, hi] overall range."""
    if progress_cb is None:
        return None

    def cb(pct: int) -> None:
        progress_cb(lo + int(pct * (hi - lo) / 100))
    return cb


# ── Rules (os / arch / features) ──────────────────────────────────────────────

def _rule_matches(rule: dict) -> bool:
    # Feature-gated rules (demo mode, custom resolution, quick-play…) never
    # apply: QMCL enables none of those features.
    if "features" in rule:
        return False
    os_rule = rule.get("os")
    if os_rule:
        name = os_rule.get("name")
        if name and name != _OS_KEY:
            return False
        arch = os_rule.get("arch")
        if arch == "x86" and platform.machine().lower() in (
                "amd64", "x86_64", "arm64", "aarch64"):
            return False
    return True


def _rules_allow(rules: list | None) -> bool:
    if not rules:
        return True
    allowed = False
    for rule in rules:
        if _rule_matches(rule):
            allowed = rule.get("action") == "allow"
    return allowed


# ── Maven / library artifact resolution ───────────────────────────────────────

def maven_to_path(name: str) -> str:
    """group:artifact:version[:classifier][@ext] → repository path."""
    ext = "jar"
    if "@" in name:
        name, ext = name.split("@", 1)
    parts = name.split(":")
    group, artifact, version = parts[0], parts[1], parts[2]
    classifier = parts[3] if len(parts) > 3 else None
    fname = f"{artifact}-{version}" + (f"-{classifier}" if classifier else "")
    return f"{group.replace('.', '/')}/{artifact}/{version}/{fname}.{ext}"


def library_artifact(lib: dict) -> Optional[tuple[str, str, Optional[str]]]:
    """Return (relative_path, url, sha1) for a library entry.

    Handles both Mojang style (``downloads.artifact``) and Fabric/Quilt style
    (``name`` + ``url`` maven base).
    """
    art = lib.get("downloads", {}).get("artifact")
    if art:
        return art["path"], art.get("url", ""), art.get("sha1")
    name = lib.get("name")
    if not name:
        return None
    path = maven_to_path(name)
    base = lib.get("url", MOJANG_LIBRARIES + "/")
    if not base.endswith("/"):
        base += "/"
    return path, base + path, None


# ── Version manifest / info ───────────────────────────────────────────────────

def get_version_manifest(show_snapshots: bool = False) -> list[dict]:
    r = requests.get(VERSION_MANIFEST, timeout=15)
    r.raise_for_status()
    versions = r.json()["versions"]
    if not show_snapshots:
        versions = [v for v in versions if v["type"] == "release"]
    return versions


def load_local_version(version_id: str) -> dict:
    f = VERSIONS_DIR / version_id / f"{version_id}.json"
    if not f.exists():
        raise FileNotFoundError(
            f"Version '{version_id}' is not installed ({f}).")
    with f.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def get_version_info(version_id: str) -> dict:
    """Fetch (and cache) the per-version JSON from Mojang."""
    cache = VERSIONS_DIR / version_id / f"{version_id}.json"
    if cache.exists():
        with cache.open("r", encoding="utf-8") as f:
            return json.load(f)
    manifest = requests.get(VERSION_MANIFEST, timeout=15).json()
    url = next((v["url"] for v in manifest["versions"]
                if v["id"] == version_id), None)
    if not url:
        raise ValueError(f"Version {version_id} not found in manifest")
    r = requests.get(url, timeout=15)
    r.raise_for_status()
    data = r.json()
    cache.parent.mkdir(parents=True, exist_ok=True)
    with cache.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    return data


def required_java_for(version_id: str) -> int:
    """Java major version required by a Minecraft version.

    Uses Mojang's own ``javaVersion.majorVersion`` field and only falls back
    to a static table if it is missing (very old versions).
    """
    try:
        info = get_version_info(version_id)
        major = info.get("javaVersion", {}).get("majorVersion")
        if major:
            return int(major)
    except Exception:       # noqa: BLE001
        pass
    return required_java(version_id)


# ── Client JAR ────────────────────────────────────────────────────────────────

def download_client(version_id: str,
                    progress_cb: ProgressCb = None,
                    status_cb: StatusCb = None) -> Path:
    info = get_version_info(version_id)
    client = info["downloads"]["client"]
    dest = VERSIONS_DIR / version_id / f"{version_id}.jar"
    if status_cb:
        status_cb(f"Downloading client {version_id}…")

    def on_bytes(done: int, total: int) -> None:
        if progress_cb and total:
            progress_cb(int(done * 100 / total))

    _download(client["url"], dest, client.get("sha1"), on_bytes)
    if progress_cb:
        progress_cb(100)
    return dest


# ── Libraries ─────────────────────────────────────────────────────────────────

def download_libraries_from_info(info: dict,
                                 natives_dir: Optional[Path] = None,
                                 progress_cb: ProgressCb = None,
                                 status_cb: StatusCb = None) -> list[Path]:
    """Download every library that applies to this OS (parallel)."""
    items: list[tuple[str, Path, Optional[str]]] = []
    classpath: list[Path] = []
    native_jobs: list[tuple[Path, dict]] = []

    for lib in info.get("libraries", []):
        if not _rules_allow(lib.get("rules")):
            continue

        art = library_artifact(lib)
        if art:
            rel, url, sha1 = art
            dest = LIBRARIES_DIR / rel
            classpath.append(dest)
            if url:
                items.append((url, dest, sha1))

        # Legacy-style natives (classifiers)
        native_name = lib.get("natives", {}).get(_OS_KEY)
        if native_name:
            classifier = native_name.replace("${arch}", "64")
            nat = lib.get("downloads", {}).get("classifiers", {}).get(classifier)
            if nat:
                dest = LIBRARIES_DIR / nat["path"]
                items.append((nat["url"], dest, nat.get("sha1")))
                native_jobs.append((dest, lib.get("extract", {})))

    if status_cb:
        status_cb(f"Downloading {len(items)} libraries…")
    _download_many(items, progress_cb)

    if natives_dir is not None and native_jobs:
        natives_dir.mkdir(parents=True, exist_ok=True)
        for jar, extract in native_jobs:
            excludes = extract.get("exclude", [])
            with zipfile.ZipFile(jar) as zf:
                for member in zf.namelist():
                    if member.endswith("/"):
                        continue
                    if any(member.startswith(x) for x in excludes):
                        continue
                    zf.extract(member, natives_dir)
    return classpath


def download_libraries(version_id: str,
                       progress_cb: ProgressCb = None,
                       status_cb: StatusCb = None) -> list[Path]:
    info = get_version_info(version_id)
    return download_libraries_from_info(
        info, VERSIONS_DIR / version_id / "natives", progress_cb, status_cb)


# ── Assets ────────────────────────────────────────────────────────────────────

def download_assets(version_id: str,
                    progress_cb: ProgressCb = None,
                    status_cb: StatusCb = None) -> None:
    info = get_version_info(version_id)
    idx = info.get("assetIndex", {})
    index_id = idx.get("id", version_id)

    indexes_dir = ASSETS_DIR / "indexes"
    index_file = indexes_dir / f"{index_id}.json"
    _download(idx["url"], index_file, idx.get("sha1"))

    with index_file.open("r", encoding="utf-8") as f:
        objects = json.load(f).get("objects", {})

    items: list[tuple[str, Path, Optional[str]]] = []
    for obj in objects.values():
        h = obj["hash"]
        items.append((f"{MOJANG_ASSETS}/{h[:2]}/{h}",
                      ASSETS_DIR / "objects" / h[:2] / h, h))
    # de-duplicate identical hashes
    items = list({it[1]: it for it in items}.values())

    if status_cb:
        status_cb(f"Downloading {len(items)} assets…")
    _download_many(items, progress_cb)


# ── Full vanilla installation ─────────────────────────────────────────────────

def install_version(version_id: str,
                    progress_cb: ProgressCb = None,
                    status_cb: StatusCb = None) -> None:
    """Client JAR (0-10 %), libraries (10-30 %), assets (30-100 %)."""
    if status_cb:
        status_cb("Fetching version info…")
    get_version_info(version_id)

    download_client(version_id, _scaled(progress_cb, 0, 10), status_cb)
    download_libraries(version_id, _scaled(progress_cb, 10, 30), status_cb)
    download_assets(version_id, _scaled(progress_cb, 30, 100), status_cb)

    if progress_cb:
        progress_cb(100)
    if status_cb:
        status_cb("Minecraft files ready.")
