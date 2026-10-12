"""QMCL — Account model and manager (JSON-backed)."""
from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional

from core.constants import ACCOUNTS_FILE


@dataclass
class Account:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    type: str = "offline"           # "offline" | "microsoft"
    username: str = ""
    uuid: str = ""
    access_token: str = ""
    refresh_token: str = ""
    xuid: str = ""
    client_token: str = field(default_factory=lambda: str(uuid.uuid4()))
    # timestamps
    expires_at: float = 0.0         # Unix timestamp

    def is_microsoft(self) -> bool:
        return self.type == "microsoft"

    def is_valid(self) -> bool:
        import time
        if self.type == "offline":
            return bool(self.username)
        return bool(self.access_token) and time.time() < self.expires_at

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "Account":
        return cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})


class AccountManager:
    def __init__(self, path: Path = ACCOUNTS_FILE) -> None:
        self._path = path
        self._accounts: dict[str, Account] = {}
        self._active_id: Optional[str] = None
        self.load()

    # ── Persistence ──────────────────────────────────────────────────────────

    def load(self) -> None:
        if self._path.exists():
            try:
                with self._path.open("r", encoding="utf-8") as f:
                    raw = json.load(f)
                for item in raw.get("accounts", []):
                    acc = Account.from_dict(item)
                    self._accounts[acc.id] = acc
                self._active_id = raw.get("active_id")
            except (json.JSONDecodeError, OSError, TypeError):
                pass

    def save(self) -> None:
        payload = {
            "accounts": [a.to_dict() for a in self._accounts.values()],
            "active_id": self._active_id,
        }
        with self._path.open("w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

    # ── CRUD ─────────────────────────────────────────────────────────────────

    def add(self, account: Account) -> None:
        self._accounts[account.id] = account
        if not self._active_id:
            self._active_id = account.id
        self.save()

    def remove(self, account_id: str) -> None:
        self._accounts.pop(account_id, None)
        if self._active_id == account_id:
            self._active_id = next(iter(self._accounts), None)
        self.save()

    def update(self, account: Account) -> None:
        self._accounts[account.id] = account
        self.save()

    # ── Queries ───────────────────────────────────────────────────────────────

    def get_all(self) -> list[Account]:
        return list(self._accounts.values())

    def get(self, account_id: str) -> Optional[Account]:
        return self._accounts.get(account_id)

    def get_active(self) -> Optional[Account]:
        if self._active_id:
            return self._accounts.get(self._active_id)
        return None

    def set_active(self, account_id: str) -> None:
        if account_id in self._accounts:
            self._active_id = account_id
            self.save()


_instance: AccountManager | None = None


def get_account_manager() -> AccountManager:
    global _instance
    if _instance is None:
        _instance = AccountManager()
    return _instance
