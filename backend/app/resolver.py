"""Knockout bracket resolution and validation.

The baseline fixtures.json holds the full 104-match skeleton with knockout
placeholders carrying a structured `source` code (e.g. "1A", "2B", "3CDFGH",
"WM89", "LM101"). As teams are decided, results.json maps those source codes to
resolved teams. This module knows the bracket structure, so it can:

  - map an external team name to our canonical team (via team_aliases.json),
  - validate that a proposed resolution is *structurally legal* for its slot,
  - apply validated results onto the fixtures.

The structural checks are the heart of the automated safety: a wrong name almost
never satisfies "must be one of the four teams in Group A" or "must be one of the
two teams that played Match 89", so bad data rejects itself.
"""
from __future__ import annotations

import json
import unicodedata
from collections import defaultdict
from functools import lru_cache

from .config import ALIASES_FILE
from .models import FixturesFile, Stage, Team


def _normalize(name: str) -> str:
    """Casefold, strip accents, drop dots, collapse whitespace."""
    decomposed = unicodedata.normalize("NFKD", name)
    stripped = "".join(c for c in decomposed if not unicodedata.combining(c))
    return " ".join(stripped.casefold().replace(".", " ").split())


@lru_cache(maxsize=1)
def _aliases() -> dict[str, str]:
    try:
        raw = json.loads(ALIASES_FILE.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {}
    return {_normalize(k): v for k, v in raw.items()}


class Bracket:
    """Derives group membership and the bracket graph from baseline fixtures."""

    def __init__(self, fixtures: FixturesFile):
        self.matches = {m.match_number: m for m in fixtures.matches}
        self.group_teams: dict[str, set[str]] = defaultdict(set)
        self.roster: dict[str, dict] = {}
        self.valid_sources: set[str] = set()
        self._by_norm: dict[str, dict] = {}
        self._by_fifa: dict[str, dict] = {}

        for m in fixtures.matches:
            for slot in (m.home, m.away):
                if slot.placeholder:
                    if slot.source:
                        self.valid_sources.add(slot.source)
                else:
                    entry = {"name": slot.name, "code": slot.code, "fifa_code": slot.fifa_code}
                    self.roster[slot.name] = entry
                    self._by_norm[_normalize(slot.name)] = entry
                    if slot.fifa_code:
                        self._by_fifa[slot.fifa_code.upper()] = entry
                    if m.stage == Stage.GROUP and m.group:
                        self.group_teams[m.group].add(slot.name)

    def map_name(self, name: str) -> dict | None:
        """Resolve an external team name to our canonical team entry, or None."""
        norm = _normalize(name)
        canonical = _aliases().get(norm, norm)
        return self._by_norm.get(_normalize(canonical))

    def match_external(self, name: str, code: str | None = None) -> dict | None:
        """Match a source's team by FIFA code first (most reliable), then name."""
        if code:
            entry = self._by_fifa.get(code.strip().upper())
            if entry:
                return entry
        return self.map_name(name)

    def _slot_name(self, slot: Team, results: dict) -> str | None:
        if not slot.placeholder:
            return slot.name
        resolved = results.get(slot.source)
        return resolved["name"] if resolved else None

    def _participants(self, match_number: int, results: dict) -> tuple[str | None, str | None]:
        m = self.matches[match_number]
        return self._slot_name(m.home, results), self._slot_name(m.away, results)

    def allowed_set(self, source: str, results: dict) -> set[str] | None:
        """Teams structurally eligible for a slot. None = can't decide yet."""
        if source[:2] in ("WM", "LM"):
            try:
                n = int(source[2:])
            except ValueError:
                return None
            if n not in self.matches:
                return None
            home, away = self._participants(n, results)
            if home is None or away is None:
                return None
            return {home, away}

        kind, letters = source[0], source[1:]
        if kind in ("1", "2"):
            return set(self.group_teams.get(letters, set()))
        if kind == "3":
            eligible: set[str] = set()
            for letter in letters:
                eligible |= self.group_teams.get(letter, set())
            return eligible
        return None

    def validate(self, results: dict) -> list[str]:
        """Return a list of problems; empty means the whole overlay is legal."""
        problems: list[str] = []
        for source, team in results.items():
            if source not in self.valid_sources:
                problems.append(f"{source}: not a knockout slot in the bracket")
                continue
            name = (team or {}).get("name")
            if not name or name not in self.roster:
                problems.append(f"{source}: '{name}' is not a known team")
                continue
            allowed = self.allowed_set(source, results)
            if allowed is None:
                problems.append(f"{source}: cannot be validated yet (parent match unresolved)")
            elif name not in allowed:
                problems.append(f"{source}: '{name}' is not eligible for this slot")
        return problems


def apply_results(fixtures: FixturesFile, results: dict) -> None:
    """Fill resolved placeholder slots in place. Assumes `results` is validated."""
    for m in fixtures.matches:
        for slot in (m.home, m.away):
            if slot.placeholder and slot.source in results:
                resolved = results[slot.source]
                slot.name = resolved["name"]
                slot.code = resolved.get("code")
                slot.fifa_code = resolved.get("fifa_code")
                slot.placeholder = False
