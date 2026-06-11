"""Builds and returns a downloadable .ics for a user's selected matches."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from ..data_loader import load_fixtures, venues_by_id
from ..services.ics import build_calendar

router = APIRouter()


class IcsRequest(BaseModel):
    match_numbers: list[int]


@router.post("/calendar/ics")
def create_ics(req: IcsRequest) -> Response:
    if not req.match_numbers:
        raise HTTPException(status_code=400, detail="Select at least one match.")

    fixtures = load_fixtures()
    wanted = set(req.match_numbers)
    selected = [m for m in fixtures.matches if m.match_number in wanted]

    if not selected:
        raise HTTPException(status_code=404, detail="No matches found for the given numbers.")

    ics_bytes = build_calendar(
        selected,
        venues_by_id(),
        duration_minutes=fixtures.meta.default_match_duration_minutes,
    )

    return Response(
        content=ics_bytes,
        media_type="text/calendar",
        headers={"Content-Disposition": 'attachment; filename="worldcup-2026.ics"'},
    )
