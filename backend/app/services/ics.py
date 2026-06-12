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

from ..models import Match, Team, Venue

PRODID = "-//worldcup-calendar-sync//FIFA World Cup 2026//EN"

# Emoji for flags that aren't a plain ISO 3166-1 alpha-2 country (UK home nations
# use Unicode subdivision tag sequences).
_SUBDIVISION_FLAGS = {
    "gb-eng": "\U0001F3F4\U000E0067\U000E0062\U000E0065\U000E006E\U000E0067\U000E007F",
    "gb-sct": "\U0001F3F4\U000E0067\U000E0062\U000E0073\U000E0063\U000E0074\U000E007F",
    "gb-wls": "\U0001F3F4\U000E0067\U000E0062\U000E0077\U000E006C\U000E0073\U000E007F",
}


def flag_emoji(team: Team) -> str:
    """Emoji flag for a team's country code, or '' for placeholders/unknowns."""
    code = team.code
    if not code:
        return ""
    if code in _SUBDIVISION_FLAGS:
        return _SUBDIVISION_FLAGS[code]
    if len(code) == 2 and code.isalpha():
        return "".join(chr(0x1F1E6 + ord(c) - ord("a")) for c in code.lower())
    return ""


def _team_label(team: Team) -> str:
    emoji = flag_emoji(team)
    return f"{emoji} {team.name}" if emoji else team.name


def event_summary(match: Match) -> str:
    return f"{match.stage.value}: {_team_label(match.home)} vs {_team_label(match.away)}"


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
