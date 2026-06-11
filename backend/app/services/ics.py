"""Generates a standards-compliant .ics calendar from selected matches.

Design note: event times are written in UTC (from each match's kickoff_utc).
For fixed, one-time events this is the most portable choice — every calendar
client converts UTC to the viewer's own local timezone automatically, so the
kickoff shows correctly for every user with no VTIMEZONE blocks required. The
venue's local kickoff time is included in the description for reference.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from icalendar import Calendar, Event

from ..models import Match, Venue

PRODID = "-//worldcup-calendar-sync//FIFA World Cup 2026//EN"


def event_summary(match: Match) -> str:
    return f"{match.stage.value}: {match.home.name} vs {match.away.name}"


def _stage_line(match: Match) -> str:
    if match.group:
        line = f"{match.stage.value} - Group {match.group}"
        if match.matchday:
            line += f" (Matchday {match.matchday})"
        return line
    return match.stage.value


def event_description(match: Match, venue: Venue) -> str:
    lines = [
        f"Stage: {_stage_line(match)}",
        f"Fixture: Match {match.match_number}",
        f"Venue: {venue.stadium}, {venue.city}, {venue.country}",
        f"Capacity: {venue.capacity:,}",
        f"Kickoff (venue local time): {match.kickoff_local.strftime('%a %d %b %Y, %H:%M')}",
    ]
    # Streaming/broadcast info will be appended here in a later milestone.
    return "\n".join(lines)


def event_location(venue: Venue) -> str:
    return f"{venue.stadium}, {venue.city}, {venue.country}"


def build_calendar(
    matches: list[Match],
    venues: dict[str, Venue],
    duration_minutes: int = 120,
    calname: str = "FIFA World Cup 2026",
) -> bytes:
    cal = Calendar()
    cal.add("prodid", PRODID)
    cal.add("version", "2.0")
    cal.add("method", "PUBLISH")
    cal.add("x-wr-calname", calname)

    stamp = datetime.now(timezone.utc)

    for match in matches:
        venue = venues[match.venue_id]

        start = match.kickoff_utc
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        end = start + timedelta(minutes=duration_minutes)

        event = Event()
        event.add("uid", f"wc2026-match-{match.match_number}@worldcup-calendar-sync")
        event.add("summary", event_summary(match))
        event.add("dtstart", start)
        event.add("dtend", end)
        event.add("dtstamp", stamp)
        event.add("location", event_location(venue))
        event.add("description", event_description(match, venue))
        cal.add_component(event)

    return cal.to_ical()
