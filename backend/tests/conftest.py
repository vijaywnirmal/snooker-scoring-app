"""
Pytest configuration and fixtures for backend tests.
Uses a file-based SQLite DB so all connections share the same database
(in-memory creates a new DB per connection).
"""

import os

import pytest
from fastapi.testclient import TestClient

# Use test DB file - must be set before app imports (file-based so all connections share DB)
os.environ["DATABASE_URL"] = "sqlite:///./test_snooker.db"


@pytest.fixture
def client():
    """FastAPI test client with fresh in-memory database per test."""
    from app.main import app
    with TestClient(app) as c:
        yield c


def _make_state(players: list[dict], teams: list[dict] | None = None, **overrides) -> dict:
    """Build a minimal game state dict for scoring engine tests."""
    state = {
        "id": "test-game-id",
        "mode": "doubles" if teams else "singles",
        "players": [{"id": p["id"], "name": p["name"], "score": p.get("score", 0), "teamId": p.get("teamId")} for p in players],
        "teams": teams or [],
        "currentPlayerIndex": 0,
        "redsRemaining": 15,
        "currentBreak": 0,
        "lastPottedColor": None,
        "ballOn": "red",
        "events": [],
        "status": "active",
        "createdAt": "2025-01-01T00:00:00Z",
    }
    state.update(overrides)
    return state


@pytest.fixture
def two_player_state():
    """Minimal 2-player game state."""
    return _make_state([
        {"id": "p1", "name": "Alice", "score": 0},
        {"id": "p2", "name": "Bob", "score": 0},
    ])
