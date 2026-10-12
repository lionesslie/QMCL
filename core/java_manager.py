"""QMCL — Java detection and auto-download via Adoptium API."""
from __future__ import annotations

import os
import platform
import subprocess
import sys
import zipfile
from pathlib import Path
from typing import Optional

import requests

from core.constants import ADOPTIUM_API, JAVA_DIR


def _run(cmd: list[str]) -> Optional[str]:
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=10,
                           creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0)
                           if sys.platform == "win32" else 0)
        return r.stdout.strip() or r.stderr.strip()
    except Exception:
        return None


def detect_java_version(java_path: str) -> Optional[int]:
    """Return major version (8, 11, 17, 21, 25…) or None."""
    import re
    out = _run([java_path, "-version"])
    if not out:
        return None
    m = re.search(r'version "(\d+)(?:\.(\d+))?', out)
    if not m:
        return None
    major = int(m.group(1))
    if major == 1 and m.group(2):          # old style 1.8.x
        major = int(m.group(2))
    return major


def find_java(required_major: int = 8) -> Optional[str]:
    """Search PATH, common dirs, and QMCL's own JAVA_DIR."""
    candidates: list[str] = []

    # 1) QMCL-managed runtimes
    exe_name = "java.exe" if sys.platform == "win32" else "java"
    if JAVA_DIR.exists():
        for exe in JAVA_DIR.rglob(exe_name):
            if exe.parent.name == "bin":
                candidates.append(str(exe))

    # 2) PATH
    import shutil
    which = shutil.which("java")
    if which:
        candidates.append(which)

    # 3) Common OS locations
    if sys.platform == "win32":
        for base in (r"C:\Program Files\Java",
                     r"C:\Program Files\Eclipse Adoptium",
                     r"C:\Program Files\Microsoft",
                     r"C:\Program Files\BellSoft"):
            p = Path(base)
            if p.exists():
                for d in p.iterdir():
                    candidates.append(str(d / "bin" / "java.exe"))
    elif sys.platform == "darwin":
        candidates += [
            "/usr/bin/java",
            "/Library/Java/JavaVirtualMachines",
        ]
    else:
        for base in ("/usr/lib/jvm", "/opt/java", "/opt/jdk"):
            p = Path(base)
            if p.exists():
                for d in p.iterdir():
                    candidates.append(str(d / "bin" / "java"))
        candidates.append("/usr/bin/java")

    best: Optional[str] = None
    best_major = 0
    for c in candidates:
        if not Path(c).exists():
            continue
        ver = detect_java_version(c)
        if not ver or ver < required_major:
            continue
        if ver == required_major:
            return c
        if best is None or ver < best_major:
            best = c
            best_major = ver

    return best


# ── Adoptium download ─────────────────────────────────────────────────────────

def _adoptium_asset(major: int) -> Optional[dict]:
    os_name = {"win32": "windows", "darwin": "mac"}.get(sys.platform, "linux")
    arch = "x64" if platform.machine() in ("x86_64", "AMD64") else "aarch64"
    url = (f"{ADOPTIUM_API}/assets/latest/{major}/hotspot"
           f"?os={os_name}&architecture={arch}&image_type=jre")
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        assets = resp.json()
        if assets:
            return assets[0]
    except Exception:
        pass
    return None


def download_java(major: int,
                  progress_cb=None,
                  status_cb=None) -> Optional[str]:
    """Download JRE from Adoptium. Returns path to java binary or None."""
    asset = _adoptium_asset(major)
    if not asset:
        return None

    binary = asset.get("binary", {})
    pkg = binary.get("package", {})
    url = pkg.get("link")
    size = pkg.get("size", 0)
    name = pkg.get("name", f"java{major}.zip")
    checksum = pkg.get("checksum")

    if not url:
        return None

    dest_archive = JAVA_DIR / name
    dest_dir = JAVA_DIR / f"jre-{major}"

    if status_cb:
        status_cb(f"Downloading Java {major}…")

    import hashlib
    sha256 = hashlib.sha256()
    downloaded = 0

    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        with dest_archive.open("wb") as f:
            for chunk in r.iter_content(chunk_size=65536):
                f.write(chunk)
                sha256.update(chunk)
                downloaded += len(chunk)
                if progress_cb and size:
                    progress_cb(int(downloaded / size * 100))

    if checksum and sha256.hexdigest() != checksum:
        dest_archive.unlink(missing_ok=True)
        return None

    if status_cb:
        status_cb("Extracting Java…")

    dest_dir.mkdir(parents=True, exist_ok=True)
    if name.endswith(".zip"):
        with zipfile.ZipFile(dest_archive) as zf:
            zf.extractall(dest_dir)
    else:
        import tarfile
        with tarfile.open(dest_archive) as tf:
            tf.extractall(dest_dir)

    dest_archive.unlink(missing_ok=True)

    # locate java binary inside extracted folder
    for root, _, files in os.walk(dest_dir):
        for fname in files:
            if fname in ("java", "java.exe"):
                return str(Path(root) / fname)

    return None
