"""Tests for source parsing and name calibration (no network/tokens)."""
from __future__ import annotations

import json

from app.config import FIXTURES_FILE
from app.models import FixturesFile
from app.resolver import Bracket
from app.sources import FootballDataSource, SourceTeam, TheSportsDbSource
from scripts.calibrate_names import calibrate


def bracket() -> Bracket:
    return Bracket(FixturesFile.model_validate(json.loads(FIXTURES_FILE.read_text(encoding="utf-8"))))


def test_football_data_parse_extracts_name_and_code():
    payload = {"teams": [{"name": "Mexico", "tla": "MEX"}, {"name": "Korea Republic", "tla": "KOR"}]}
    teams = FootballDataSource.parse_teams(payload)
    assert SourceTeam("Mexico", "MEX") in teams
    assert SourceTeam("Korea Republic", "KOR") in teams


def test_thesportsdb_parse_handles_null_teams():
    assert TheSportsDbSource.parse_teams({"teams": None}) == []
    teams = TheSportsDbSource.parse_teams({"teams": [{"strTeam": "USA"}]})
    assert teams == [SourceTeam("USA", None)]


def test_match_by_fifa_code_wins_over_name():
    b = bracket()
    # Source name differs from ours, but the code nails it.
    assert b.match_external("Korea Republic", "KOR")["name"] == "South Korea"


def test_match_falls_back_to_name_and_alias():
    b = bracket()
    assert b.match_external("USA")["name"] == "United States"
    assert b.match_external("Czech Republic")["name"] == "Czechia"
    assert b.match_external("Türkiye")["name"] == "Türkiye"
    assert b.match_external("Definitely Not A Country") is None


def test_calibrate_builds_map_and_reports_unmatched():
    b = bracket()
    teams = [
        SourceTeam("Korea Republic", "KOR"),
        SourceTeam("USA", "USA"),
        SourceTeam("Some Club FC", "ZZZ"),  # not a roster team
    ]
    mapping, unmatched = calibrate(b, teams)
    assert mapping["Korea Republic"] == "South Korea"
    assert mapping["USA"] == "United States"
    assert "Some Club FC" in unmatched
