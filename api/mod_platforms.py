"""QMCL — Modrinth and CurseForge API clients."""
from __future__ import annotations

import hashlib
import json
import zipfile
from pathlib import Path
from typing import Callable, Optional

import requests

from core.constants import (
    MODRINTH_API, CURSEFORGE_API,
)
from core.settings import get_settings


# ── Modrinth ──────────────────────────────────────────────────────────────────

MODRINTH_HEADERS = {
    "User-Agent": "QMCL/1.0.0 (github.com/qmcl/qmcl)",
    "Accept": "application/json",
}


def modrinth_search(query: str,
                    mc_version: str = "",
                    loader: str = "",
                    project_type: str = "mod",
                    limit: int = 20,
                    offset: int = 0) -> dict:
    facets: list[list[str]] = [[f"project_type:{project_type}"]]
    if mc_version:
        facets.append([f"versions:{mc_version}"])
    if loader:
        facets.append([f"categories:{loader}"])

    params = {
        "query": query,
        "facets": json.dumps(facets),
        "limit": limit,
        "offset": offset,
    }
    r = requests.get(f"{MODRINTH_API}/search",
                     headers=MODRINTH_HEADERS,
                     params=params, timeout=15)
    r.raise_for_status()
    return r.json()


def modrinth_get_versions(project_id: str,
                          mc_version: str = "",
                          loader: str = "") -> list[dict]:
    params: dict = {}
    if mc_version:
        params["game_versions"] = json.dumps([mc_version])
    if loader:
        params["loaders"] = json.dumps([loader])
    r = requests.get(f"{MODRINTH_API}/project/{project_id}/version",
                     headers=MODRINTH_HEADERS,
                     params=params, timeout=15)
    r.raise_for_status()
    return r.json()


def modrinth_download_mod(version_id: str,
                          dest_dir: Path,
                          progress_cb=None,
                          status_cb=None) -> Path:
    r = requests.get(f"{MODRINTH_API}/version/{version_id}",
                     headers=MODRINTH_HEADERS, timeout=15)
    r.raise_for_status()
    version = r.json()
    file_info = version["files"][0]
    url = file_info["url"]
    fname = file_info["filename"]
    sha512 = file_info.get("hashes", {}).get("sha512")

    dest = dest_dir / fname
    _download_file(url, dest, progress_cb, status_cb)

    if sha512:
        h = hashlib.sha512()
        with dest.open("rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                h.update(chunk)
        if h.hexdigest() != sha512:
            dest.unlink(missing_ok=True)
            raise ValueError(f"Checksum mismatch for {fname}")

    return dest


def modrinth_install_mrpack(mrpack_path: Path,
                            instances_dir: Path,
                            progress_cb=None,
                            status_cb=None) -> dict:
    """Extract a .mrpack file and return instance metadata."""
    with zipfile.ZipFile(mrpack_path) as zf:
        with zf.open("modrinth.index.json") as f:
            index = json.load(f)

        name = index.get("name", "Modpack")
        mc_version = index.get("dependencies", {}).get("minecraft", "")
        loader = "vanilla"
        loader_version = ""
        for dep, ver in index.get("dependencies", {}).items():
            if dep in ("fabric-loader", "quilt-loader", "forge", "neoforge"):
                loader = dep.replace("-loader", "")
                loader_version = ver

        inst_dir = instances_dir / name.replace(" ", "_")
        inst_dir.mkdir(parents=True, exist_ok=True)

        # extract overrides
        for item in zf.namelist():
            if item.startswith("overrides/"):
                rel = item[len("overrides/"):]
                if not rel:
                    continue
                dest = inst_dir / rel
                dest.parent.mkdir(parents=True, exist_ok=True)
                with zf.open(item) as src, dest.open("wb") as dst:
                    dst.write(src.read())

    files = index.get("files", [])
    total = len(files)
    for i, f in enumerate(files):
        url = f["downloads"][0]
        rel_path = f["path"]
        dest = inst_dir / rel_path
        dest.parent.mkdir(parents=True, exist_ok=True)
        if status_cb:
            status_cb(f"Downloading {dest.name}…")
        _download_file(url, dest)
        if progress_cb:
            progress_cb(int((i + 1) / total * 100))

    return {
        "name": name,
        "mc_version": mc_version,
        "loader": loader,
        "loader_version": loader_version,
        "directory": str(inst_dir),
    }


# ── CurseForge ────────────────────────────────────────────────────────────────

def _cf_headers() -> dict:
    key = get_settings().get("curseforge_api_key", "")
    return {
        "x-api-key": key,
        "Accept": "application/json",
        "User-Agent": "QMCL/1.0.0",
    }


def curseforge_search(query: str,
                      mc_version: str = "",
                      loader: int = 0,
                      class_id: int = 6,  # 6=mods
                      page_size: int = 20,
                      index: int = 0) -> dict:
    params: dict = {
        "gameId": 432,
        "classId": class_id,
        "searchFilter": query,
        "pageSize": page_size,
        "index": index,
        "sortField": 2,
        "sortOrder": "desc",
    }
    if mc_version:
        params["gameVersion"] = mc_version
    if loader:
        params["modLoaderType"] = loader

    r = requests.get(f"{CURSEFORGE_API}/mods/search",
                     headers=_cf_headers(),
                     params=params, timeout=15)
    r.raise_for_status()
    return r.json()


def curseforge_get_files(mod_id: int, mc_version: str = "") -> list[dict]:
    params: dict = {"gameVersion": mc_version} if mc_version else {}
    r = requests.get(f"{CURSEFORGE_API}/mods/{mod_id}/files",
                     headers=_cf_headers(),
                     params=params, timeout=15)
    r.raise_for_status()
    return r.json().get("data", [])


def curseforge_download_file(file_id: int,
                             dest_dir: Path,
                             progress_cb=None,
                             status_cb=None) -> Path:
    r = requests.get(f"{CURSEFORGE_API}/files/{file_id}/download-url",
                     headers=_cf_headers(), timeout=15)
    r.raise_for_status()
    url = r.json().get("data", "")
    if not url:
        raise ValueError("No download URL from CurseForge")
    fname = url.split("/")[-1]
    dest = dest_dir / fname
    _download_file(url, dest, progress_cb, status_cb)
    return dest


def curseforge_install_zip(zip_path: Path,
                           instances_dir: Path,
                           java_path: str = "java",
                           progress_cb=None,
                           status_cb=None) -> dict:
    """Extract a CurseForge modpack .zip and download mods."""
    with zipfile.ZipFile(zip_path) as zf:
        with zf.open("manifest.json") as f:
            manifest = json.load(f)

        name = manifest.get("name", "CurseForge Pack")
        mc_info = manifest.get("minecraft", {})
        mc_version = mc_info.get("version", "")
        modloaders = mc_info.get("modLoaders", [])
        loader = "vanilla"
        loader_version = ""
        if modloaders:
            ml_id = modloaders[0].get("id", "")
            if ml_id.startswith("forge-"):
                loader = "forge"
                loader_version = ml_id[6:]
            elif ml_id.startswith("neoforge-"):
                loader = "neoforge"
                loader_version = ml_id[9:]
            elif ml_id.startswith("fabric-"):
                loader = "fabric"
                loader_version = ml_id[7:]

        inst_dir = instances_dir / name.replace(" ", "_")
        inst_dir.mkdir(parents=True, exist_ok=True)

        # overrides
        for item in zf.namelist():
            if item.startswith("overrides/"):
                rel = item[len("overrides/"):]
                if not rel:
                    continue
                dest_f = inst_dir / rel
                dest_f.parent.mkdir(parents=True, exist_ok=True)
                with zf.open(item) as src, dest_f.open("wb") as dst:
                    dst.write(src.read())

    files = manifest.get("files", [])
    total = len(files)
    mods_dir = inst_dir / "mods"
    mods_dir.mkdir(exist_ok=True)
    for i, finfo in enumerate(files):
        if not finfo.get("required", True):
            continue
        try:
            mod_id = finfo["projectID"]
            file_id = finfo["fileID"]
            if status_cb:
                status_cb(f"Downloading mod {i+1}/{total}…")
            curseforge_download_file(file_id, mods_dir)
        except Exception:
            pass
        if progress_cb:
            progress_cb(int((i + 1) / total * 100))

    return {
        "name": name,
        "mc_version": mc_version,
        "loader": loader,
        "loader_version": loader_version,
        "directory": str(inst_dir),
    }


# ── Shared helpers ────────────────────────────────────────────────────────────

def _download_file(url: str, dest: Path,
                   progress_cb=None,
                   status_cb=None) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        return
    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        total = int(r.headers.get("content-length", 0))
        done = 0
        with dest.open("wb") as f:
            for chunk in r.iter_content(65536):
                f.write(chunk)
                done += len(chunk)
                if progress_cb and total:
                    progress_cb(int(done / total * 100))
