"""Adapters for the free football data sources.

Each adapter knows how to fetch and parse the team list for the World Cup from
one provider. Fetch (HTTP) and parse (pure) are kept separate so the parsing and
matching logic can be unit-tested without network access or tokens.

Docs:
  - football-data.org: GET /v4/competitions/WC/teams, header X-Auth-Token
  - TheSportsDB: lookup_all_teams.php?id={leagueId}, free key "123"
"""
from __future__ import annotations

import json
import urllib.request
from dataclasses import dataclass


@dataclass(frozen=True)
class SourceTeam:
    name: str
    code: str | None = None  # 3-letter code if the source provides one


def _get_json(url: str, headers: dict[str, str] | None = None) -> dict:
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=30) as resp:  # noqa: S310 (trusted hosts)
        return json.load(resp)


class FootballDataSource:
    name = "football-data"
    BASE = "https://api.football-data.org/v4"

    def __init__(self, token: str):
        self.token = token

    def fetch_teams(self) -> list[SourceTeam]:
        data = _get_json(
            f"{self.BASE}/competitions/WC/teams", headers={"X-Auth-Token": self.token}
        )
        return self.parse_teams(data)

    @staticmethod
    def parse_teams(data: dict) -> list[SourceTeam]:
        return [
            SourceTeam(name=(t.get("name") or "").strip(), code=t.get("tla"))
            for t in data.get("teams", [])
        ]


class TheSportsDbSource:
    name = "thesportsdb"
    BASE = "https://www.thesportsdb.com/api/v1/json"

    def __init__(self, key: str = "123", league_id: str = "4429"):
        self.key = key
        self.league_id = league_id

    def fetch_teams(self) -> list[SourceTeam]:
        data = _get_json(f"{self.BASE}/{self.key}/lookup_all_teams.php?id={self.league_id}")
        return self.parse_teams(data)

    @staticmethod
    def parse_teams(data: dict) -> list[SourceTeam]:
        teams = data.get("teams") or []
        return [SourceTeam(name=(t.get("strTeam") or "").strip(), code=None) for t in teams]
