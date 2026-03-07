"""
Game state storage - JSON-based for simplicity with scoring engine
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON

from app.db import Base


def generate_uuid():
    return str(uuid4())


class GameStateStore(Base):
    """Stores current game state as JSON - matches in-memory structure"""
    __tablename__ = "game_states"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    state_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    history = relationship("GameStateHistory", back_populates="game", cascade="all, delete-orphan")


class GameStateHistory(Base):
    """Stores game state snapshots for undo"""
    __tablename__ = "game_state_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    game_id = Column(String(36), ForeignKey("game_states.id", ondelete="CASCADE"), nullable=False)
    state_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    game = relationship("GameStateStore", back_populates="history")
