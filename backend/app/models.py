"""Pydantic models mirroring the venues.json / fixtures.json schema.

These are the single source of truth for the data contract. If the JSON schema
changes, change it here too.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel


class Stage(str, Enum):
    GROUP = "Group Stage"
    R32 = "Round of 32"
    R16 = "Round of 16"
    QF = "Quarter-final"
    SF = "Semi-final"
    THIRD = "Third-place Play-off"
    FINAL = "Final"


class Venue(BaseModel):
    id: str
    stadium: str
    city: str
    country: str
    country_code: str
    capacity: int
    timezone: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class Team(BaseModel):
    name: str
    # ISO 3166-1 alpha-2 (lowercase) for flag rendering; null for knockout placeholders.
    code: Optional[str] = None
    # FIFA 3-letter code; null for placeholders.
    fifa_code: Optional[str] = None
    placeholder: bool = False
    # Progression code for placeholders, e.g. "1A", "2B", "WM89"; null for real teams.
    source: Optional[str] = None


class Match(BaseModel):
    match_number: int
    stage: Stage
    group: Optional[str] = None
    matchday: Optional[int] = None
    home: Team
    away: Team
    venue_id: str
    # Naive wall-clock time at the stadium, e.g. 2026-06-11T20:00:00.
    # This is the single source of truth for kickoff.
    kickoff_local: datetime
    # Derived from kickoff_local + the venue's timezone at load time. Any value in
    # the data file is advisory only and gets overwritten with the computed UTC.
    kickoff_utc: Optional[datetime] = None


class Meta(BaseModel):
    tournament: str
    version: str
    total_matches: int
    default_match_duration_minutes: int = 120
    generated_at: Optional[str] = None


class FixturesFile(BaseModel):
    meta: Meta
    matches: list[Match]
