"""QMCL — Instance (profile) model and manager."""
from __future__ import annotations

import json
import shutil
import uuid
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional

from core.constants import INSTANCES_DIR, INSTANCES_FILE


@dataclass
class Instance:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "New Instance"
    mc_version: str = ""
    loader: str = "vanilla"          # vanilla | forge | fabric | quilt | neoforge
    loader_version: str = ""
    icon: str = ""                   # path to PNG / SVG or empty
    # paths
    directory: str = ""              # resolved below
    java_path: str = ""              # empty = auto-detect
    # JVM
    ram_mb: int = 2048
    jvm_args: str = "-XX:+UseG1GC -XX:+ParallelRefProcEnabled"
    extra_args: str = ""
    # meta
    created_at: float = 0.0
    last_played: float = 0.0
    play_time_secs: int = 0
    installed: bool = False
    group: str = ""

    def resolve_directory(self) -> Path:
        if self.directory:
            return Path(self.directory)
        return INSTANCES_DIR / self.id

    def launch_version_id(self) -> str:
        """Version-profile id that is actually launched (loader-aware)."""
        lv = self.loader_version
        if lv:
            if self.loader == "fabric":
                return f"fabric-loader-{lv}-{self.mc_version}"
            if self.loader == "quilt":
                return f"quilt-loader-{lv}-{self.mc_version}"
            if self.loader == "forge":
                return f"{self.mc_version}-forge-{lv}"
            if self.loader == "neoforge":
                return f"neoforge-{lv}"
        return self.mc_version

    def mods_dir(self) -> Path:
        return self.resolve_directory() / "mods"

    def resource_packs_dir(self) -> Path:
        return self.resolve_directory() / "resourcepacks"

    def shaderpacks_dir(self) -> Path:
        return self.resolve_directory() / "shaderpacks"

    def saves_dir(self) -> Path:
        return self.resolve_directory() / "saves"

    def ensure_dirs(self) -> None:
        for d in (self.resolve_directory(), self.mods_dir(),
                  self.resource_packs_dir(), self.shaderpacks_dir(),
                  self.saves_dir()):
            d.mkdir(parents=True, exist_ok=True)

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "Instance":
        known = set(cls.__dataclass_fields__)
        return cls(**{k: v for k, v in d.items() if k in known})


class InstanceManager:
    def __init__(self, path: Path = INSTANCES_FILE) -> None:
        self._path = path
        self._instances: dict[str, Instance] = {}
        self.load()

    # ── Persistence ──────────────────────────────────────────────────────────

    def load(self) -> None:
        if self._path.exists():
            try:
                with self._path.open("r", encoding="utf-8") as f:
                    raw = json.load(f)
                for item in raw:
                    inst = Instance.from_dict(item)
                    self._instances[inst.id] = inst
            except (json.JSONDecodeError, OSError, TypeError):
                pass

    def save(self) -> None:
        with self._path.open("w", encoding="utf-8") as f:
            json.dump([i.to_dict() for i in self._instances.values()],
                      f, indent=2)

    # ── CRUD ─────────────────────────────────────────────────────────────────

    def add(self, instance: Instance) -> None:
        import time
        if not instance.created_at:
            instance.created_at = time.time()
        if not instance.directory:
            instance.directory = str(INSTANCES_DIR / instance.id)
        instance.ensure_dirs()
        self._instances[instance.id] = instance
        self.save()

    def remove(self, instance_id: str) -> None:
        inst = self._instances.pop(instance_id, None)
        if inst:
            d = inst.resolve_directory()
            if d.exists():
                shutil.rmtree(d, ignore_errors=True)
        self.save()

    def update(self, instance: Instance) -> None:
        self._instances[instance.id] = instance
        self.save()

    def duplicate(self, instance_id: str, new_name: str) -> Optional[Instance]:
        src = self._instances.get(instance_id)
        if not src:
            return None
        import copy, time
        new_inst = copy.deepcopy(src)
        new_inst.id = str(uuid.uuid4())
        new_inst.name = new_name
        new_inst.directory = str(INSTANCES_DIR / new_inst.id)
        new_inst.created_at = time.time()
        new_inst.last_played = 0.0
        new_inst.play_time_secs = 0
        # copy files
        src_dir = src.resolve_directory()
        dst_dir = new_inst.resolve_directory()
        if src_dir.exists():
            shutil.copytree(str(src_dir), str(dst_dir), dirs_exist_ok=True)
        self._instances[new_inst.id] = new_inst
        self.save()
        return new_inst

    def get_all(self) -> list[Instance]:
        return sorted(self._instances.values(),
                      key=lambda i: i.last_played, reverse=True)

    def get(self, instance_id: str) -> Optional[Instance]:
        return self._instances.get(instance_id)


_instance: InstanceManager | None = None


def get_instance_manager() -> InstanceManager:
    global _instance
    if _instance is None:
        _instance = InstanceManager()
    return _instance
