"""Loads and caches the venue/fixture data from disk, with integrity checks."""
from __future__ import annotations

import json
import logging
from datetime import timezone
from functools import lru_cache
from zoneinfo import ZoneInfo

from .config import FIXTURES_FILE, RESULTS_FILE, VENUES_FILE
from .models import FixturesFile, Venue
from .resolver import Bracket, apply_results

logger = logging.getLogger(__name__)


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

    _apply_resolved_results(fixtures)

    # Stable chronological order regardless of file ordering.
    fixtures.matches.sort(key=lambda m: (m.kickoff_utc, m.match_number))
    return fixtures


def _apply_resolved_results(fixtures: FixturesFile) -> None:
    """Overlay results.json onto the baseline, but only if it fully validates.

    Any problem (missing/corrupt file, an illegal resolution) is logged and the
    overlay is skipped, so the app always falls back to the known-good baseline.
    """
    if not RESULTS_FILE.exists():
        return
    try:
        results = json.loads(RESULTS_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Ignoring results.json (could not read): %s", exc)
        return
    if not results:
        return

    problems = Bracket(fixtures).validate(results)
    if problems:
        logger.warning("Ignoring results.json (failed validation): %s", problems)
        return

    apply_results(fixtures, results)


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
