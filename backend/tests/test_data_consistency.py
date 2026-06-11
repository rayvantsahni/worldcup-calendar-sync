"""Guards the integrity of the committed fixture data.

kickoff_local is the single source of truth; kickoff_utc is derived from it via
the venue's timezone at load time. These tests ensure that derivation is sound:
every venue timezone is a real IANA zone, and every match ends up with a UTC
kickoff that matches its local time through that zone.
"""
from __future__ import annotations

from datetime import timezone
from zoneinfo import ZoneInfo

from app.data_loader import load_fixtures, load_venues, venues_by_id


def test_every_venue_timezone_is_valid_iana():
    bad = []
    for v in load_venues():
        try:
            ZoneInfo(v.timezone)
        except Exception:
            bad.append(f"{v.id}: invalid timezone {v.timezone!r}")
    assert not bad, "Invalid venue timezones:\n" + "\n".join(bad)


def test_derived_kickoff_utc_matches_local_through_venue_timezone():
    venues = venues_by_id()
    mismatches = []
    for m in load_fixtures().matches:
        venue = venues[m.venue_id]
        expected = (
            m.kickoff_local.replace(tzinfo=ZoneInfo(venue.timezone)).astimezone(timezone.utc)
        )
        if m.kickoff_utc is None:
            mismatches.append(f"Match {m.match_number}: kickoff_utc was not derived")
        elif m.kickoff_utc != expected:
            mismatches.append(
                f"Match {m.match_number} @ {venue.id}: derived {m.kickoff_utc.isoformat()} "
                f"!= expected {expected.isoformat()}"
            )
    assert not mismatches, "Derived UTC inconsistencies:\n" + "\n".join(mismatches)
