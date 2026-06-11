# World Cup 2026 Calendar Sync

A personalized FIFA World Cup 2026 schedule manager. Browse all 104 fixtures,
select the matches you care about, and download a single `.ics` file that imports
cleanly into Google Calendar, Outlook, Apple Calendar, and any other standard
calendar app — no account linking or OAuth required.

## Project layout

```
worldcup-calendar-sync/
├── backend/          FastAPI service: owns fixture data + generates the .ics
│   ├── app/
│   │   ├── data/         venues.json + fixtures.json (the source of truth)
│   │   ├── models.py     Pydantic schemas
│   │   ├── routers/      /api/fixtures, /api/calendar/ics
│   │   └── services/     icalendar (.ics) generation
│   └── tests/
└── frontend/         React + TypeScript UI (coming in Milestone 2)
```

## Backend — quick start

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Then open http://127.0.0.1:8000/docs for the interactive API.

### Endpoints
- `GET  /api/health` — liveness check.
- `GET  /api/fixtures` — `{ meta, venues, matches }` for the whole tournament.
- `POST /api/calendar/ics` — body `{ "match_numbers": [1, 5, 12] }` → downloads `worldcup-2026.ics`.

### The data files
`backend/app/data/venues.json` and `backend/app/data/fixtures.json` ship with a
small **sample** payload so the app boots. Replace their contents with the full
16-venue / 104-match dataset (same schema) and everything else works unchanged.

### Tests
```bash
cd backend
pytest
```
