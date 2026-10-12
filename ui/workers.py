"""QMCL — QRunnable workers for all background I/O tasks."""
from __future__ import annotations

from typing import Any, Callable

from PySide6.QtCore import QObject, QRunnable, Signal, Slot


class _Signals(QObject):
    progress = Signal(int)           # 0–100
    status = Signal(str)             # status text
    finished = Signal(object)        # result
    error = Signal(str)              # error message


class Worker(QRunnable):
    """Generic worker: runs *fn* in a thread pool, emits signals."""

    def __init__(self, fn: Callable[..., Any], *args, **kwargs) -> None:
        super().__init__()
        self.fn = fn
        self.args = args
        self.kwargs = kwargs
        self.signals = _Signals()
        self.setAutoDelete(True)

        # inject callbacks
        self.kwargs["progress_cb"] = self.signals.progress.emit
        self.kwargs["status_cb"] = self.signals.status.emit

    @Slot()
    def run(self) -> None:
        try:
            result = self.fn(*self.args, **self.kwargs)
            self.signals.finished.emit(result)
        except Exception as exc:
            self.signals.error.emit(str(exc))


class SimpleWorker(QRunnable):
    """Worker without injected callbacks."""

    def __init__(self, fn: Callable[..., Any], *args, **kwargs) -> None:
        super().__init__()
        self.fn = fn
        self.args = args
        self.kwargs = kwargs
        self.signals = _Signals()
        self.setAutoDelete(True)

    @Slot()
    def run(self) -> None:
        try:
            result = self.fn(*self.args, **self.kwargs)
            self.signals.finished.emit(result)
        except Exception as exc:
            self.signals.error.emit(str(exc))
