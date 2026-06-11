"""Loads and caches the venue/fixture data from disk, with integrity checks."""
from __future__ import annotations

import json
from datetime import timezone
from functools import lru_cache
from zoneinfo import ZoneInfo

from .config import FIXTURES_FILE, VENUES_FILE
from .models import FixturesFile, Venue


@lru_cache(maxsize=1)
def load_venues() -> list[Venue]:
    data = json.loads(VENUES_FILE.read_text(encoding="utf-8"))
    return [Venue.model_validate(v) for v in data]


@lru_cache(maxsize=1)
def load_fixtures() -> FixturesFile:
    data = json.loads(FIXTURES_FILE.read_text(encoding="utf-8"))
    fixtures = FixturesFile.model_validate(data)

    # kickoff_local is the single source of truth: derive kickoff_utc from it via
    # the venue's timezone so the two can never drift (any stored UTC is ignored).
    venues = venues_by_id()
    for m in fixtures.matches:
        venue = venues.get(m.venue_id)
        if venue is None:
            continue  # dangling venue ref; surfaced by dangling_venue_refs()
        m.kickoff_utc = m.kickoff_local.replace(tzinfo=ZoneInfo(venue.timezone)).astimezone(
            timezone.utc
        )

    # Stable chronological order regardless of file ordering.
    fixtures.matches.sort(key=lambda m: (m.kickoff_utc, m.match_number))
    return fixtures


@lru_cache(maxsize=1)
def venues_by_id() -> dict[str, Venue]:
    return {v.id: v for v in load_venues()}


def dangling_venue_refs() -> list[tuple[int, str]]:
    """Returns (match_number, venue_id) for any match pointing at an unknown venue."""
    known = set(venues_by_id())
    return [
        (m.match_number, m.venue_id)
        for m in load_fixtures().matches
        if m.venue_id not in known
    ]
