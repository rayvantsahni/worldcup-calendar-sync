"""Minimal .env loader (no dependency).

Populates os.environ from a local .env for the data scripts. In CI the values
come from real environment variables / secrets, so this is a no-op there.
"""
from __future__ import annotations

import os

from .config import APP_DIR


def load_env() -> None:
    candidates = [APP_DIR.parent / ".env", APP_DIR.parents[1] / ".env"]
    for path in candidates:
        if not path.exists():
            continue
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
        return
