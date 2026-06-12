"""Emit the merged, browser-ready fixtures JSON for the static frontend.

Reuses the backend loader so timezone derivation and the validated results
overlay are applied exactly as the API would. Output mirrors GET /api/fixtures.

Run from the backend directory:
    python scripts/build_static_data.py
"""
from __future__ import annotations

import json
from pathlib import Path

from app.data_loader import load_fixtures, load_venues

OUT = (
    Path(__file__).resolve().parents[2]
    / "frontend"
    / "public"
    / "data"
    / "fixtures.json"
)


def main() -> None:
    fixtures = load_fixtures()
    payload = {
        "meta": fixtures.meta.model_dump(mode="json"),
        "venues": [v.model_dump(mode="json") for v in load_venues()],
        "matches": [m.model_dump(mode="json") for m in fixtures.matches],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {len(payload['matches'])} matches -> {OUT}")


if __name__ == "__main__":
    main()
