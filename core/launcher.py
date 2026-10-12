"""QMCL — Game launcher: resolve version profile, build command, launch."""
from __future__ import annotations

import os
import shlex
import subprocess
import sys
from pathlib import Path
from typing import Callable, Optional

from api.mojang import (
    _rules_allow, library_artifact, load_local_version, required_java_for,
)
from core.accounts import Account
from core.constants import ASSETS_DIR, LIBRARIES_DIR, VERSIONS_DIR
from core.instances import Instance
from core.java_manager import download_java, find_java
from core.settings import get_settings

StatusCb = Optional[Callable[[str], None]]
ProgressCb = Optional[Callable[[int], None]]

_CP_SEP = ";" if sys.platform == "win32" else ":"
_NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0) if sys.platform == "win32" else 0


# ── Version profile resolution (inheritsFrom) ─────────────────────────────────

def _lib_key(lib: dict) -> str:
    """group:artifact[:classifier] — identifies a library regardless of version."""
    parts = lib.get("name", "").split(":")
    key = ":".join(parts[:2])
    if len(parts) > 3:
        key += ":" + parts[3]
    return key


def load_merged_version(version_id: str, _depth: int = 0) -> dict:
    """Load a version JSON and merge it with everything it inherits from."""
    if _depth > 5:
        raise RuntimeError("inheritsFrom chain too deep")
    info = load_local_version(version_id)
    parent_id = info.get("inheritsFrom")
    if not parent_id:
        info["_jar_id"] = version_id
        return info

    parent = load_merged_version(parent_id, _depth + 1)
    merged = dict(parent)
    for k, v in info.items():
        if k not in ("libraries", "arguments", "inheritsFrom"):
            merged[k] = v

    libs: dict[str, dict] = {}
    for lib in parent.get("libraries", []) + info.get("libraries", []):
        libs[_lib_key(lib)] = lib          # child overrides parent version
    merged["libraries"] = list(libs.values())

    pa, ca = parent.get("arguments", {}), info.get("arguments", {})
    merged["arguments"] = {
        "game": pa.get("game", []) + ca.get("game", []),
        "jvm": pa.get("jvm", []) + ca.get("jvm", []),
    }
    merged["_jar_id"] = parent["_jar_id"]
    return merged


def _classpath(info: dict) -> str:
    jars: list[str] = []
    for lib in info.get("libraries", []):
        if not _rules_allow(lib.get("rules")):
            continue
        art = library_artifact(lib)
        if not art:
            continue
        path = LIBRARIES_DIR / art[0]
        if path.exists():
            jars.append(str(path))
    jar_id = info["_jar_id"]
    client = VERSIONS_DIR / jar_id / f"{jar_id}.jar"
    if not client.exists():
        raise FileNotFoundError(f"Client JAR missing: {client}")
    jars.append(str(client))
    return _CP_SEP.join(jars)


# ── Argument resolution ───────────────────────────────────────────────────────

def _expand(args: list, variables: dict[str, str]) -> list[str]:
    out: list[str] = []

    def sub(text: str) -> str:
        for k, v in variables.items():
            text = text.replace("${" + k + "}", v)
        return text

    for arg in args:
        if isinstance(arg, str):
            out.append(sub(arg))
        elif isinstance(arg, dict):
            if not _rules_allow(arg.get("rules")):
                continue
            val = arg.get("value", [])
            out.extend(sub(v) for v in ([val] if isinstance(val, str) else val))
    return out


def _resolve_java(instance: Instance, info: dict,
                  status_cb: StatusCb, progress_cb: ProgressCb) -> str:
    if instance.java_path and Path(instance.java_path).exists():
        return instance.java_path
    global_java = get_settings().get("java_path", "")
    if global_java and Path(global_java).exists():
        return global_java

    major = int(info.get("javaVersion", {}).get("majorVersion")
                or required_java_for(instance.mc_version))
    java = find_java(major)
    if java:
        return java
    if status_cb:
        status_cb(f"Downloading Java {major}…")
    java = download_java(major, progress_cb, status_cb)
    if not java:
        raise RuntimeError(
            f"Java {major} is required but could not be found or downloaded. "
            "Set a Java path in Settings.")
    return java


def build_launch_command(instance: Instance, account: Account,
                         status_cb: StatusCb = None,
                         progress_cb: ProgressCb = None) -> list[str]:
    version_id = instance.launch_version_id()
    info = load_merged_version(version_id)

    java = _resolve_java(instance, info, status_cb, progress_cb)

    jar_id = info["_jar_id"]
    natives_dir = VERSIONS_DIR / jar_id / "natives"
    natives_dir.mkdir(parents=True, exist_ok=True)
    asset_index = info.get("assetIndex", {}).get("id", jar_id)
    game_dir = instance.resolve_directory()

    classpath = _classpath(info)
    variables = {
        "auth_player_name": account.username,
        "version_name": version_id,
        "game_directory": str(game_dir),
        "assets_root": str(ASSETS_DIR),
        "assets_index_name": asset_index,
        "auth_uuid": account.uuid.replace("-", ""),
        "auth_access_token": account.access_token or "0",
        "clientid": account.client_token,
        "auth_xuid": account.xuid or "0",
        "user_type": "msa" if account.is_microsoft() else "legacy",
        "version_type": info.get("type", "release"),
        "natives_directory": str(natives_dir),
        "launcher_name": "QMCL",
        "launcher_version": "1.0.0",
        "classpath": classpath,
        "classpath_separator": _CP_SEP,
        "library_directory": str(LIBRARIES_DIR),
        "game_assets": str(ASSETS_DIR / "virtual" / "legacy"),
        "user_properties": "{}",
        "resolution_width": "854",
        "resolution_height": "480",
    }

    arguments = info.get("arguments", {})
    jvm_spec = arguments.get("jvm")

    jvm: list[str] = [f"-Xmx{instance.ram_mb}M",
                      f"-Xms{min(512, instance.ram_mb)}M"]
    if sys.platform == "darwin":
        jvm.append("-XstartOnFirstThread")
    if instance.jvm_args:
        jvm += shlex.split(instance.jvm_args, posix=(sys.platform != "win32"))

    if jvm_spec:
        jvm += _expand(jvm_spec, variables)
    else:                                   # pre-1.13 versions
        jvm += [f"-Djava.library.path={natives_dir}",
                "-Dminecraft.launcher.brand=QMCL",
                "-Dminecraft.launcher.version=1.0.0",
                "-cp", classpath]

    if arguments.get("game"):
        game = _expand(arguments["game"], variables)
    else:
        game = _expand(info.get("minecraftArguments", "").split(), variables)

    if instance.extra_args:
        game += shlex.split(instance.extra_args, posix=(sys.platform != "win32"))

    main_class = info.get("mainClass", "net.minecraft.client.main.Main")
    return [java] + jvm + [main_class] + game


def launch(instance: Instance, account: Account,
           status_cb: StatusCb = None,
           progress_cb: ProgressCb = None) -> subprocess.Popen:
    if status_cb:
        status_cb("Building launch command…")
    cmd = build_launch_command(instance, account, status_cb, progress_cb)

    if status_cb:
        status_cb("Launching Minecraft…")
    game_dir = instance.resolve_directory()
    game_dir.mkdir(parents=True, exist_ok=True)

    env = os.environ.copy()
    env.pop("_JAVA_OPTIONS", None)

    log = (game_dir / "qmcl-launch.log").open("w", encoding="utf-8")
    log.write("COMMAND:\n" + " ".join(shlex.quote(c) for c in cmd[:1]) +
              f" ... ({len(cmd)} args)\n\n")
    log.flush()
    return subprocess.Popen(
        cmd, cwd=str(game_dir), env=env,
        stdout=log, stderr=subprocess.STDOUT,
        creationflags=_NO_WINDOW)
