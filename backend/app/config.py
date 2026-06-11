"""Filesystem paths and shared constants for the backend."""
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
DATA_DIR = APP_DIR / "data"

VENUES_FILE = DATA_DIR / "venues.json"
FIXTURES_FILE = DATA_DIR / "fixtures.json"

# Dev origins allowed to call the API (Vite default ports).
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
