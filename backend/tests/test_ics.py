"""Unit tests for .ics generation, using constructed objects (data-independent)."""
from __future__ import annotations

from datetime import datetime, timezone

from icalendar import Calendar

from app.models import Match, Stage, Team, Venue
from app.services.ics import build_calendar, event_summary

VENUE = Venue(
    id="mexico-city-estadio-azteca",
    stadium="Estadio Azteca",
    city="Mexico City",
    country="Mexico",
    country_code="MX",
    capacity=87523,
    timezone="America/Mexico_City",
)

MATCH = Match(
    match_number=1,
    stage=Stage.GROUP,
    group="A",
    matchday=1,
    home=Team(name="Mexico", code="mx", fifa_code="MEX"),
    away=Team(name="Portugal", code="pt", fifa_code="POR"),
    venue_id="mexico-city-estadio-azteca",
    kickoff_local=datetime(2026, 6, 11, 20, 0, 0),
    kickoff_utc=datetime(2026, 6, 12, 2, 0, 0, tzinfo=timezone.utc),
)


def _calendar() -> Calendar:
    raw = build_calendar([MATCH], {VENUE.id: VENUE})
    return Calendar.from_ical(raw)


def test_summary_format():
    assert event_summary(MATCH) == "Group Stage: Mexico vs Portugal"


def test_calendar_has_one_event_with_core_fields():
    cal = _calendar()
    events = [c for c in cal.walk() if c.name == "VEVENT"]
    assert len(events) == 1

    event = events[0]
    assert str(event["summary"]) == "Group Stage: Mexico vs Portugal"
    assert str(event["uid"]) == "wc2026-match-1@worldcup-calendar-sync"
    assert "Estadio Azteca" in str(event["location"])
    assert "Capacity: 87,523" in str(event["description"])


def test_event_start_is_utc_kickoff():
    event = [c for c in _calendar().walk() if c.name == "VEVENT"][0]
    start = event.decoded("dtstart")
    assert start == datetime(2026, 6, 12, 2, 0, 0, tzinfo=timezone.utc)


def test_event_duration_is_two_hours():
    event = [c for c in _calendar().walk() if c.name == "VEVENT"][0]
    delta = event.decoded("dtend") - event.decoded("dtstart")
    assert delta.total_seconds() == 2 * 60 * 60
