"""Serves the full tournament dataset to the frontend."""
from __future__ import annotations

from fastapi import APIRouter

from ..data_loader import load_fixtures, load_venues

router = APIRouter()


@router.get("/fixtures")
def get_fixtures():
    fixtures = load_fixtures()
    return {
        "meta": fixtures.meta,
        "venues": load_venues(),
        "matches": fixtures.matches,
    }
