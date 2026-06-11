"""API + data-integrity tests that run against the committed data files."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.data_loader import dangling_venue_refs, load_fixtures, venues_by_id
from app.main import app

client = TestClient(app)


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_fixtures_endpoint_shape():
    body = client.get("/api/fixtures").json()
    assert {"meta", "venues", "matches"} <= body.keys()
    assert isinstance(body["matches"], list)
    assert isinstance(body["venues"], list)


def test_every_match_references_a_known_venue():
    assert dangling_venue_refs() == []


def test_ics_endpoint_returns_calendar():
    numbers = [m.match_number for m in load_fixtures().matches][:1]
    resp = client.post("/api/calendar/ics", json={"match_numbers": numbers})
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/calendar")
    assert resp.content.startswith(b"BEGIN:VCALENDAR")
    assert b"attachment" in resp.headers["content-disposition"].encode()


def test_ics_endpoint_rejects_empty_selection():
    assert client.post("/api/calendar/ics", json={"match_numbers": []}).status_code == 400


def test_ics_endpoint_unknown_numbers_404():
    assert client.post("/api/calendar/ics", json={"match_numbers": [999999]}).status_code == 404


def test_venue_index_covers_all_venues():
    from app.data_loader import load_venues

    assert len(venues_by_id()) == len(load_venues())
