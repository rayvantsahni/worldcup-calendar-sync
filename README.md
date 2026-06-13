# World Cup 2026 Calendar Sync

A personalized FIFA World Cup 2026 schedule manager. Browse all 104 fixtures,
select the matches you care about, and download a single `.ics` file that imports
cleanly into Google Calendar, Outlook, Apple Calendar, and any other standard
calendar app. No account linking or OAuth required.

## Features

- Browse every fixture as a chronological **list** or a monthly **calendar**.
- **Filter** by team, group, stage, stadium, or day of week.
- Country **flags** (SVG) in the list, and flag emoji in the calendar event titles.
- A **LIVE** badge on matches that are in progress.
- Gallery-style **multi-select** (select all / clear), persisted across reloads.
- **Download** the selected matches as one `.ics`, with an optional **reminder**
  (none, at kickoff, 15 min, 30 min, 1 hour, 3 hours, or 1 day before).
- Three **themes** (Pop, Heritage, Floodlight) via a switcher, also persisted.
- Kickoffs shown in the viewer's local timezone; the `.ics` stores UTC so every
  calendar app renders the correct local time anywhere.

## Architecture

The deployed app is a **fully static** React site: the browser reads a prebuilt
`fixtures.json` and generates the `.ics` (with optional reminders) client-side,
so it can be hosted for free with no server.

The **Python backend is a build and test tool**, not a runtime dependency. It
owns the source data, derives kickoff times, applies the validated knockout
overlay, and emits the static data file the frontend consumes.

```
worldcup-calendar-sync/
├── backend/          Python: data source of truth + static data builder + tests
│   ├── app/
│   │   ├── data/         venues.json, fixtures.json (baseline), results.json (overlay)
│   │   ├── resolver.py   knockout bracket resolution + structural validation
│   │   ├── updater.py    plans which knockout slots can be filled from a source
│   │   ├── sources.py    free data-source adapters (football-data.org)
│   │   └── services/     reference .ics generation (mirrored in the frontend)
│   ├── scripts/         build_static_data.py, update_results.py, calibrate_names.py
│   └── tests/
└── frontend/         React + TypeScript (Vite): the static app that ships
    ├── public/data/  fixtures.json (generated; the browser reads this)
    └── src/          ics.ts (client .ics), components, themes
```

## Frontend quick start

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

The dev server reads `public/data/fixtures.json` directly, so no backend is
needed to run the UI. `npm run build` produces a static `dist/` for any static
host (GitHub Pages, Cloudflare Pages, Vercel, Netlify).

## Deploy (GitHub Pages)

Deployment is handled by `.github/workflows/deploy.yml`, which builds the
frontend and publishes it to Pages on every push to `main`.

1. Push the repo to GitHub.
2. Settings, then Pages, then set Source to **GitHub Actions**.
3. The deploy workflow runs automatically. Your site lands at
   `https://<username>.github.io/<repo>/`.

The build base is taken from `VITE_BASE` (the workflow sets it to `/<repo>/` for
a project site), so assets resolve under the repo subpath. For a user or org site
(`<username>.github.io`), leave the base as `/`.

## Updating the data

`fixtures.json` is the immutable 104-match baseline. As knockout teams are
decided, they go into `results.json` as an overlay keyed by bracket source code
(`1A`, `2B`, `WM89`, and so on). Every resolution is structurally validated
(right group, or a real participant of the referenced match); anything invalid is
ignored and the baseline is served unchanged.

After editing the data by hand, regenerate the static file the frontend reads:

```bash
cd backend
# activate .venv, then:
PYTHONPATH=. python scripts/build_static_data.py
```

### Automated knockout updates

`scripts/update_results.py` fetches the World Cup matches from football-data.org,
fills any newly decided knockout slots (each structurally validated and frozen
once set), and regenerates the static data. It does nothing if the result is
unchanged or fails validation. `scripts/calibrate_names.py` is a one-off that
learns the provider's exact team spellings.

The GitHub Action in `.github/workflows/update-results.yml` runs this every 6
hours during 28 Jun to 20 Jul 2026, commits any changes, and triggers a redeploy.
To enable it:

1. Add a repo secret `FOOTBALL_DATA_TOKEN` (free from football-data.org).
2. Settings, then Actions, then General, then Workflow permissions, then set
   **Read and write permissions**.

Locally, put the token in `backend/.env` (gitignored; see `.env.example`).

## Backend setup and tests

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows  (or: source .venv/bin/activate)
pip install -r requirements.txt
pytest
```

The optional API (`uvicorn app.main:app --reload`) still serves
`GET /api/fixtures` and `POST /api/calendar/ics` for local inspection.
