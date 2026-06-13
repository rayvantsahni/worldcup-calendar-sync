"""One-off: learn how each source spells the 48 World Cup teams.

Fetches each provider's team list, matches every team to our roster (by FIFA
code first, then name/alias), and writes a verified per-source name map to
app/data/source_team_maps.json. Anything it can't match is printed so you can add
a one-time alias to team_aliases.json and re-run.

Run from the backend directory (with the venv active):
    FOOTBALL_DATA_TOKEN=xxxxx PYTHONPATH=. python scripts/calibrate_names.py

TheSportsDB uses the free "123" key by default, so no secret is required for it.
"""
from __future__ import annotations

import json
import os

from app.config import DATA_DIR, FIXTURES_FILE
from app.envfile import load_env
from app.models import FixturesFile
from app.resolver import Bracket
from app.sources import FootballDataSource, TheSportsDbSource

OUT = DATA_DIR / "source_team_maps.json"


def _build_sources():
    sources = []
    token = os.environ.get("FOOTBALL_DATA_TOKEN")
    if token:
        sources.append(FootballDataSource(token))
    else:
        print("FOOTBALL_DATA_TOKEN not set — skipping football-data")

    # TheSportsDB only when a real World Cup league id is supplied; its free key
    # does not expose the tournament, so it stays opt-in as a secondary source.
    league_id = os.environ.get("THESPORTSDB_WC_LEAGUE_ID")
    if league_id:
        sources.append(
            TheSportsDbSource(key=os.environ.get("THESPORTSDB_KEY", "123"), league_id=league_id)
        )
    return sources


def calibrate(bracket: Bracket, teams) -> tuple[dict[str, str], list[str]]:
    """Return (api_name -> our canonical name) and a list of unmatched names."""
    mapping: dict[str, str] = {}
    unmatched: list[str] = []
    for t in teams:
        if not t.name:
            continue
        entry = bracket.match_external(t.name, t.code)
        if entry:
            mapping[t.name] = entry["name"]
        else:
            unmatched.append(t.name)
    return mapping, unmatched


def main() -> None:
    load_env()
    fixtures = FixturesFile.model_validate(json.loads(FIXTURES_FILE.read_text(encoding="utf-8")))
    bracket = Bracket(fixtures)
    roster_size = len(bracket.roster)

    out: dict[str, dict[str, str]] = {}
    for src in _build_sources():
        try:
            teams = src.fetch_teams()
        except Exception as exc:  # noqa: BLE001 - report and continue to next source
            print(f"[{src.name}] fetch failed: {exc}")
            continue

        mapping, unmatched = calibrate(bracket, teams)
        out[src.name] = mapping
        print(f"[{src.name}] matched {len(mapping)}/{roster_size} roster teams")
        if unmatched:
            print(f"[{src.name}] {len(unmatched)} unmatched (non-roster or needs an alias):")
            for name in unmatched[:60]:
                print(f"    - {name}")

    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
