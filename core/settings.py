"""QMCL — Settings manager (JSON-backed)."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from core.constants import SETTINGS_FILE


_DEFAULTS: dict[str, Any] = {
    "theme": "dark",
    "language": "en",
    "close_on_launch": False,
    "java_path": "",
    "default_ram_mb": 2048,
    "jvm_args": "-XX:+UseG1GC -XX:+ParallelRefProcEnabled",
    "width": 1280,
    "height": 720,
    "curseforge_api_key": "",
    "show_snapshots": False,
    "analytics": False,
    "sidebar_collapsed": False,
    "last_instance_id": None,
    "last_account_id": None,
}


class Settings:
    """Thin wrapper around a JSON settings file."""

    def __init__(self, path: Path = SETTINGS_FILE) -> None:
        self._path = path
        self._data: dict[str, Any] = dict(_DEFAULTS)
        self.load()

    # ── Persistence ──────────────────────────────────────────────────────────

    def load(self) -> None:
        if self._path.exists():
            try:
                with self._path.open("r", encoding="utf-8") as f:
                    saved = json.load(f)
                self._data.update(saved)
            except (json.JSONDecodeError, OSError):
                pass  # fallback to defaults

    def save(self) -> None:
        with self._path.open("w", encoding="utf-8") as f:
            json.dump(self._data, f, indent=2, ensure_ascii=False)

    # ── Access ───────────────────────────────────────────────────────────────

    def get(self, key: str, default: Any = None) -> Any:
        return self._data.get(key, default)

    def set(self, key: str, value: Any) -> None:
        self._data[key] = value
        self.save()

    def __getitem__(self, key: str) -> Any:
        return self._data[key]

    def __setitem__(self, key: str, value: Any) -> None:
        self.set(key, value)


# Singleton
_instance: Settings | None = None


def get_settings() -> Settings:
    global _instance
    if _instance is None:
        _instance = Settings()
    return _instance
