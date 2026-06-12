# World Cup 2026 Calendar Sync

A personalized FIFA World Cup 2026 schedule manager. Browse all 104 fixtures,
select the matches you care about, and download a single `.ics` file that imports
cleanly into Google Calendar, Outlook, Apple Calendar, and any other standard
calendar app — no account linking or OAuth required.

## Architecture

The deployed app is a **fully static** React site: the browser reads a prebuilt
`fixtures.json` and generates the `.ics` (with optional reminders) client-side,
so it can be hosted for free with no server.

The **Python backend is a build/test tool**, not a runtime dependency. It owns
the source data, derives kickoff times, applies the validated knockout overlay,
and emits the static data file the frontend consumes.

```
worldcup-calendar-sync/
├── backend/          Python: data source of truth + static data builder + tests
│   ├── app/
│   │   ├── data/         venues.json, fixtures.json (baseline), results.json (overlay)
│   │   ├── resolver.py   knockout bracket resolution + structural validation
│   │   └── services/     reference .ics generation (mirrored in the frontend)
│   ├── scripts/
│   │   └── build_static_data.py   emits frontend/public/data/fixtures.json
│   └── tests/
└── frontend/         React + TypeScript (Vite) — the static app that ships
    ├── public/data/  fixtures.json (generated; the browser reads this)
    └── src/          ics.ts (client .ics), components, themes
```

## Frontend — quick start

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

The dev server reads `public/data/fixtures.json` directly — no backend needed to
run the UI. `npm run build` produces a static `dist/` for any static host
(Cloudflare Pages, Vercel, Netlify, GitHub Pages).

## Updating the data

`fixtures.json` is the immutable 104-match baseline. As knockout teams are
decided, they go into `results.json` as an overlay keyed by bracket source code
(`1A`, `2B`, `WM89`, ...). Every resolution is structurally validated (right
group / correct match participant); anything invalid is ignored and the baseline
is served unchanged.

After editing the data, regenerate the static file the frontend reads:

```bash
cd backend
# activate .venv, then:
PYTHONPATH=. python scripts/build_static_data.py
```

## Backend — setup & tests

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows  (or: source .venv/bin/activate)
pip install -r requirements.txt
pytest
```

The optional API (`uvicorn app.main:app --reload`) still serves
`GET /api/fixtures` and `POST /api/calendar/ics` for local inspection.
