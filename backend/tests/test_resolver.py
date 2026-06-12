"""Tests for the bracket resolver and its structural validators (no APIs)."""
from __future__ import annotations

import json

from app.config import FIXTURES_FILE
from app.models import FixturesFile
from app.resolver import Bracket, apply_results


def load_baseline() -> FixturesFile:
    """Fresh baseline straight from disk (no overlay, no caching)."""
    return FixturesFile.model_validate(json.loads(FIXTURES_FILE.read_text(encoding="utf-8")))


def a_team(b: Bracket, group: str) -> dict:
    return b.roster[sorted(b.group_teams[group])[0]]


def test_accepts_legal_group_resolution():
    b = Bracket(load_baseline())
    assert b.validate({"1A": a_team(b, "A")}) == []


def test_rejects_team_from_wrong_group():
    b = Bracket(load_baseline())
    # A Group B team can't win Group A.
    assert b.validate({"1A": a_team(b, "B")})


def test_rejects_unknown_source_code():
    b = Bracket(load_baseline())
    assert b.validate({"ZZ": a_team(b, "A")})


def test_rejects_unknown_team_name():
    b = Bracket(load_baseline())
    assert b.validate({"1A": {"name": "Atlantis", "code": "xx", "fifa_code": "ATL"}})


def test_match_winner_must_be_a_participant():
    b = Bracket(load_baseline())
    # Match 73 is Runner-up A (2A) vs Runner-up B (2B).
    base = {"2A": a_team(b, "A"), "2B": a_team(b, "B")}

    ok = {**base, "WM73": a_team(b, "A")}
    assert b.validate(ok) == []

    bad = {**base, "WM73": a_team(b, "C")}  # team C didn't play match 73
    assert b.validate(bad)


def test_holds_when_parent_match_unresolved():
    b = Bracket(load_baseline())
    # WM73 can't be validated until 2A and 2B are known.
    assert b.validate({"WM73": a_team(b, "A")})


def test_apply_fills_placeholder_slot():
    fixtures = load_baseline()
    b = Bracket(fixtures)
    team = a_team(b, "A")
    apply_results(fixtures, {"1A": team})

    m = next(m for m in fixtures.matches if m.home.source == "1A" or m.away.source == "1A")
    slot = m.home if m.home.source == "1A" else m.away
    assert slot.placeholder is False
    assert slot.name == team["name"]
    assert slot.code == team["code"]


def test_name_mapping_handles_aliases_and_accents():
    b = Bracket(load_baseline())
    assert b.map_name("Korea Republic")["name"] == "South Korea"
    assert b.map_name("USA")["name"] == "United States"
    assert b.map_name("türkiye")["name"] == "Türkiye"
    assert b.map_name("Czech Republic")["name"] == "Czechia"
    assert b.map_name("Nowhere FC") is None
