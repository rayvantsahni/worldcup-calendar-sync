"""Plan knockout resolutions from a source's matches.

Pure logic (no network/IO): given the timed baseline bracket, a provider's
matches, and the current results, work out which placeholder slots can be filled
now. Each knockout match is joined to the provider's match by kickoff time +
stage, and each real team is placed into the slot whose structural `allowed_set`
it satisfies — so we never need standings or the third-place allocation table,
and a team can only land in a slot it's actually eligible for.
"""
from __future__ import annotations

from datetime import datetime

from .models import Match
from .resolver import Bracket
from .sources import SourceMatch

# Provider stage label -> our Stage value.
STAGE_MAP = {
    "LAST_32": "Round of 32",
    "LAST_16": "Round of 16",
    "QUARTER_FINALS": "Quarter-final",
    "SEMI_FINALS": "Semi-final",
    "THIRD_PLACE": "Third-place Play-off",
    "FINAL": "Final",
}


def _to_utc(iso: str) -> datetime:
    return datetime.fromisoformat(iso.replace("Z", "+00:00"))


def _assign(bracket: Bracket, match: Match, teams: list[dict], working: dict) -> dict | None:
    """Place each of `teams` into one of the match's two slots, or None if ambiguous."""
    pool = list(teams)
    assignment: dict[str, dict] = {}
    for slot in (match.home, match.away):
        if not slot.placeholder or slot.source in working:
            fixed = slot.name if not slot.placeholder else working.get(slot.source, {}).get("name")
            pool = [t for t in pool if t["name"] != fixed]
            continue
        allowed = bracket.allowed_set(slot.source, working)
        if allowed is None:
            return None
        candidates = [t for t in pool if t["name"] in allowed]
        if len(candidates) != 1:
            return None
        assignment[slot.source] = candidates[0]
        pool = [t for t in pool if t["name"] != candidates[0]["name"]]
    return assignment or None


def plan_resolutions(
    bracket: Bracket, source_matches: list[SourceMatch], existing: dict
) -> tuple[dict, list[tuple[str, str]]]:
    """Return (updated results, list of newly added (source, team) pairs)."""
    working = dict(existing)
    added: list[tuple[str, str]] = []

    decided = [
        sm for sm in source_matches if sm.home and sm.away and sm.stage in STAGE_MAP
    ]

    knockouts = sorted(
        (m for m in bracket.matches.values() if m.stage.value in STAGE_MAP.values()),
        key=lambda m: m.match_number,
    )

    for m in knockouts:
        needs = [s for s in (m.home, m.away) if s.placeholder and s.source not in working]
        if not needs:
            continue

        valid_assignments: list[dict] = []
        for sm in decided:
            if STAGE_MAP[sm.stage] != m.stage.value:
                continue
            if _to_utc(sm.utc) != m.kickoff_utc:
                continue
            home = bracket.match_external(sm.home.name, sm.home.code)
            away = bracket.match_external(sm.away.name, sm.away.code)
            if not home or not away:
                continue
            assignment = _assign(bracket, m, [home, away], working)
            if assignment:
                valid_assignments.append(assignment)

        # Only act when exactly one source match unambiguously fits this slot pair.
        if len(valid_assignments) == 1:
            for source, team in valid_assignments[0].items():
                working[source] = {
                    "name": team["name"],
                    "code": team["code"],
                    "fifa_code": team["fifa_code"],
                }
                added.append((source, team["name"]))

    return working, added
