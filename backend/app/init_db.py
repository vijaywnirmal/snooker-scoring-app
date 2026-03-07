"""
Create database tables
Run: python -m app.init_db
"""

from app.db import Base, engine
from app.models.game_state import GameStateHistory, GameStateStore  # noqa: F401 - register with Base


def init_db():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")


if __name__ == "__main__":
    init_db()
