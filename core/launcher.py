"""QMCL — Game launcher: build JVM command and launch via subprocess."""
from __future__ import annotations

import json
import os
import platform
import subprocess
import sys
from pathlib import Path
from typing import Callable, Optional

from core.constants import (
    VERSIONS_DIR, LIBRARIES_DIR, ASSETS_DIR,
    required_java,
)
from core.instances import Instance
from core.accounts import Account
from core.java_manager import find_java, download_java


def _classpath_sep() -> str:
    return ";" if sys.platform == "win32" else ":"


def _get_classpath(version_id: str) -> str:
    """Collect all library JARs + client JAR into classpath string."""
    info_file = VERSIONS_DIR / version_id / f"{version_id}.json"
    if not info_file.exists():
        raise FileNotFoundError(f"Version JSON missing: {info_file}")

    with info_file.open("r") as f:
        info = json.load(f)

    jars: list[str] = []

    for lib in info.get("libraries", []):
        downloads = lib.get("downloads", {})
        artifact = downloads.get("artifact")
        if artifact:
            path = LIBRARIES_DIR / artifact["path"]
            if path.exists():
                jars.append(str(path))

    client_jar = VERSIONS_DIR / version_id / f"{version_id}.jar"
    if client_jar.exists():
        jars.append(str(client_jar))

    # Check for parent version (Fabric/Quilt/Forge profiles inherit)
    inherits = info.get("inheritsFrom")
    if inherits:
        jars = _get_classpath(inherits).split(_classpath_sep()) + jars

    return _classpath_sep().join(jars)


def _resolve_args(args, instance: Instance, account: Account,
                  version_info: dict, natives_dir: Path,
                  asset_index_id: str) -> list[str]:
    """Resolve ${variable} placeholders in argument lists."""
    mc_dir = instance.resolve_directory()
    width = 854
    height = 480

    vars_map = {
        "auth_player_name": account.username,
        "version_name": instance.mc_version,
        "game_directory": str(mc_dir),
        "assets_root": str(ASSETS_DIR),
        "assets_index_name": asset_index_id,
        "auth_uuid": account.uuid,
        "auth_access_token": account.access_token or "offline",
        "clientid": account.client_token,
        "auth_xuid": account.xuid or "",
        "user_type": "msa" if account.is_microsoft() else "legacy",
        "version_type": "release",
        "natives_directory": str(natives_dir),
        "launcher_name": "QMCL",
        "launcher_version": "1.0.0",
        "classpath": _get_classpath(instance.mc_version),
        "resolution_width": str(width),
        "resolution_height": str(height),
    }

    result: list[str] = []
    for arg in args:
        if isinstance(arg, str):
            for k, v in vars_map.items():
                arg = arg.replace(f"${{{k}}}", v)
            result.append(arg)
        elif isinstance(arg, dict):
            rules = arg.get("rules", [])
            from api.mojang import _rules_allow
            if not _rules_allow(rules):
                continue
            val = arg.get("value", [])
            if isinstance(val, str):
                val = [val]
            for v in val:
                for k, rep in vars_map.items():
                    v = v.replace(f"${{{k}}}", rep)
                result.append(v)

    return result


def build_launch_command(instance: Instance, account: Account,
                         status_cb: Optional[Callable[[str], None]] = None,
                         progress_cb: Optional[Callable[[int], None]] = None,
                         ) -> list[str]:
    """Build the full JVM + Minecraft command list."""
    version_id = instance.mc_version
    info_file = VERSIONS_DIR / version_id / f"{version_id}.json"

    if not info_file.exists():
        raise FileNotFoundError(
            f"Version {version_id} not installed. Please install it first.")

    with info_file.open("r") as f:
        info = json.load(f)

    # resolve inheritance
    if "inheritsFrom" in info:
        parent_id = info["inheritsFrom"]
        parent_file = VERSIONS_DIR / parent_id / f"{parent_id}.json"
        if not parent_file.exists():
            raise FileNotFoundError(f"Parent version {parent_id} not installed.")
        with parent_file.open("r") as f:
            parent = json.load(f)
        # merge: child overrides parent
        merged = dict(parent)
        merged.update(info)
        # merge arguments separately
        if "arguments" in parent and "arguments" in info:
            for key in ("game", "jvm"):
                merged["arguments"][key] = (
                    parent["arguments"].get(key, []) +
                    info["arguments"].get(key, [])
                )
        info = merged

    # Java
    java = instance.java_path or ""
    if not java:
        req = required_java(version_id)
        java = find_java(req) or ""
    if not java:
        if status_cb:
            status_cb("Downloading Java…")
        req = required_java(version_id)
        java = download_java(req, progress_cb, status_cb) or "java"

    natives_dir = VERSIONS_DIR / version_id / "natives"
    natives_dir.mkdir(parents=True, exist_ok=True)

    asset_index = info.get("assetIndex", {}).get("id", version_id)

    # JVM args
    jvm_default = [
        f"-Xmx{instance.ram_mb}M",
        f"-Xms{min(512, instance.ram_mb)}M",
        f"-Djava.library.path={natives_dir}",
        f"-Dminecraft.launcher.brand=QMCL",
        f"-Dminecraft.launcher.version=1.0.0",
    ]
    if sys.platform == "darwin":
        jvm_default.append("-XstartOnFirstThread")

    if instance.jvm_args:
        jvm_default += instance.jvm_args.split()

    # New-style arguments
    arguments = info.get("arguments", {})
    game_args = arguments.get("game", [])
    jvm_args_spec = arguments.get("jvm", [])

    if jvm_args_spec:
        extra_jvm = _resolve_args(jvm_args_spec, instance, account,
                                  info, natives_dir, asset_index)
        jvm_default += extra_jvm
    else:
        # Old-style
        jvm_default += [
            f"-cp", _get_classpath(version_id),
        ]

    main_class = info.get("mainClass", "net.minecraft.client.main.Main")

    game_resolved = _resolve_args(game_args, instance, account,
                                  info, natives_dir, asset_index)

    # Handle old minecraftArguments
    if not game_args:
        old_args = info.get("minecraftArguments", "")
        if old_args:
            for token in old_args.split():
                for k, v in {
                    "auth_player_name": account.username,
                    "version_name": version_id,
                    "game_directory": str(instance.resolve_directory()),
                    "assets_root": str(ASSETS_DIR),
                    "assets_index_name": asset_index,
                    "auth_uuid": account.uuid,
                    "auth_access_token": account.access_token or "offline",
                    "user_type": "msa" if account.is_microsoft() else "legacy",
                }.items():
                    token = token.replace(f"${{{k}}}", v)
                game_resolved.append(token)

    cmd = [java] + jvm_default + [main_class] + game_resolved

    if instance.extra_args:
        cmd += instance.extra_args.split()

    return cmd


def launch(instance: Instance, account: Account,
           status_cb: Optional[Callable[[str], None]] = None,
           progress_cb: Optional[Callable[[int], None]] = None,
           ) -> subprocess.Popen:
    """Build command, then launch Minecraft. Returns Popen handle."""
    if status_cb:
        status_cb("Building launch command…")

    cmd = build_launch_command(instance, account, status_cb, progress_cb)

    if status_cb:
        status_cb("Launching Minecraft…")

    mc_dir = instance.resolve_directory()
    mc_dir.mkdir(parents=True, exist_ok=True)

    env = os.environ.copy()
    env["_JAVA_OPTIONS"] = ""   # prevent double-flagging

    proc = subprocess.Popen(
        cmd,
        cwd=str(mc_dir),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    return proc
