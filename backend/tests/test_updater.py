"""Tests for the knockout resolution planner (pure logic, no network)."""
from __future__ import annotations

from app.data_loader import timed_baseline
from app.resolver import Bracket
from app.sources import SourceMatch, SourceTeam
from app.updater import plan_resolutions


def make_bracket() -> Bracket:
    return Bracket(timed_baseline())


def utc_iso(m) -> str:
    return m.kickoff_utc.isoformat().replace("+00:00", "Z")


def group_team(b: Bracket, group: str, index: int = 0) -> dict:
    name = sorted(b.group_teams[group])[index]
    return b.roster[name]


def r32_match(b: Bracket):
    # Match 73 is Runner-up A (2A) vs Runner-up B (2B).
    return b.matches[73]


def source_for(m, home: dict, away: dict, winner: str | None = None) -> SourceMatch:
    return SourceMatch(
        utc=utc_iso(m),
        stage="LAST_32",
        status="FINISHED",
        home=SourceTeam(home["name"], home["fifa_code"]),
        away=SourceTeam(away["name"], away["fifa_code"]),
        winner=winner,
    )


def finished_source_for(m, home: dict, away: dict, winner: str) -> SourceMatch:
    """Simulate a finished match with a known winner side."""
    return SourceMatch(
        utc=utc_iso(m),
        stage="LAST_32",
        status="FINISHED",
        home=SourceTeam(home["name"], home["fifa_code"]),
        away=SourceTeam(away["name"], away["fifa_code"]),
        winner=winner,
    )


def test_fills_both_slots_from_a_decided_match():
    b = make_bracket()
    m = r32_match(b)
    a, bb = group_team(b, "A"), group_team(b, "B")
    working, added = plan_resolutions(b, [source_for(m, a, bb)], {})
    assert working["2A"]["name"] == a["name"]
    assert working["2B"]["name"] == bb["name"]
    assert b.validate(working) == []
    assert len(added) == 2


def test_assignment_is_by_eligibility_not_home_away_order():
    b = make_bracket()
    m = r32_match(b)
    a, bb = group_team(b, "A"), group_team(b, "B")
    # Source lists them swapped; each still lands in its eligible slot.
    working, _ = plan_resolutions(b, [source_for(m, bb, a)], {})
    assert working["2A"]["name"] == a["name"]
    assert working["2B"]["name"] == bb["name"]


def test_skips_when_a_team_is_not_eligible():
    b = make_bracket()
    m = r32_match(b)
    a, c = group_team(b, "A"), group_team(b, "C")  # C can't fill 2B
    working, added = plan_resolutions(b, [source_for(m, a, c)], {})
    assert added == []
    assert "2A" not in working and "2B" not in working


def test_existing_results_are_frozen():
    b = make_bracket()
    m = r32_match(b)
    a, bb = group_team(b, "A"), group_team(b, "B")
    other_a = group_team(b, "A", index=1)
    existing = {"2A": other_a}
    working, _ = plan_resolutions(b, [source_for(m, a, bb)], existing)
    assert working["2A"]["name"] == other_a["name"]  # not overwritten


# --- WM slot resolution from finished match scores ---

def test_wm_slot_resolved_home_team_wins():
    b = make_bracket()
    m = r32_match(b)  # match 73: 2A vs 2B
    a, bb = group_team(b, "A"), group_team(b, "B")
    existing = {"2A": a, "2B": bb}
    sm = finished_source_for(m, a, bb, winner="HOME_TEAM")
    working, added = plan_resolutions(b, [sm], existing)
    assert working["WM73"]["name"] == a["name"]
    assert ("WM73", a["name"]) in added
    assert b.validate(working) == []


def test_wm_slot_resolved_away_team_wins():
    b = make_bracket()
    m = r32_match(b)
    a, bb = group_team(b, "A"), group_team(b, "B")
    existing = {"2A": a, "2B": bb}
    sm = finished_source_for(m, a, bb, winner="AWAY_TEAM")
    working, added = plan_resolutions(b, [sm], existing)
    assert working["WM73"]["name"] == bb["name"]


def test_wm_slot_not_resolved_without_winner():
    b = make_bracket()
    m = r32_match(b)
    a, bb = group_team(b, "A"), group_team(b, "B")
    existing = {"2A": a, "2B": bb}
    sm = source_for(m, a, bb)  # no winner field → defaults to None
    working, _ = plan_resolutions(b, [sm], existing)
    assert "WM73" not in working


def test_wm_slot_frozen_once_set():
    b = make_bracket()
    m = r32_match(b)
    a, bb = group_team(b, "A"), group_team(b, "B")
    other_a = group_team(b, "A", index=1)
    # WM73 already resolved to some team — subsequent runs must not overwrite it.
    existing = {"2A": a, "2B": bb, "WM73": other_a}
    sm = finished_source_for(m, a, bb, winner="HOME_TEAM")
    working, added = plan_resolutions(b, [sm], existing)
    assert working["WM73"]["name"] == other_a["name"]
    assert all(source != "WM73" for source, _ in added)
