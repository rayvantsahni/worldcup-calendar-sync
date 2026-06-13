"""Resolve newly decided knockout teams and update the data.

Fetches the World Cup matches from football-data.org, plans which placeholder
slots can be filled (structurally validated, frozen-once-set), and — only if the
result fully validates and actually changed — writes results.json and rebuilds
the static fixtures.json the frontend reads. On any error or empty token it does
nothing, leaving the known-good data in place.

Run from the backend directory:
    FOOTBALL_DATA_TOKEN=xxxxx PYTHONPATH=. python scripts/update_results.py
"""
from __future__ import annotations

import json
import os
import sys

from app.config import RESULTS_FILE
from app.data_loader import load_fixtures, timed_baseline
from app.envfile import load_env
from app.resolver import Bracket
from app.sources import FootballDataSource
from app.updater import plan_resolutions

import scripts.build_static_data as build_static_data


def main() -> int:
    load_env()
    token = os.environ.get("FOOTBALL_DATA_TOKEN")
    if not token:
        print("FOOTBALL_DATA_TOKEN not set — nothing to do")
        return 0

    bracket = Bracket(timed_baseline())
    existing = json.loads(RESULTS_FILE.read_text(encoding="utf-8")) if RESULTS_FILE.exists() else {}

    try:
        matches = FootballDataSource(token).fetch_matches()
    except Exception as exc:  # noqa: BLE001 - network/transient; keep baseline
        print(f"fetch failed, leaving data unchanged: {exc}")
        return 0

    working, added = plan_resolutions(bracket, matches, existing)

    if working == existing:
        print("no new resolutions")
        return 0

    problems = bracket.validate(working)
    if problems:
        print("computed results failed validation, NOT writing:")
        for p in problems:
            print(f"  - {p}")
        return 1

    RESULTS_FILE.write_text(
        json.dumps(working, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8"
    )
    load_fixtures.cache_clear()
    build_static_data.main()

    print(f"resolved {len(added)} slot(s):")
    for source, name in added:
        print(f"  {source} -> {name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
