"""
Database models for snooker scoring
FRD Section 13: Player, Game, Event tables
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db import Base


def generate_uuid():
    return str(uuid4())


class Player(Base):
    __tablename__ = "players"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    name = Column(String(30), nullable=False)
    game_id = Column(UUID(as_uuid=False), ForeignKey("games.id"), nullable=False)
    team_id = Column(UUID(as_uuid=False), ForeignKey("teams.id"), nullable=True)
    score = Column(Integer, default=0)

    game = relationship("Game", back_populates="players")
    team = relationship("Team", back_populates="players")
    events = relationship("GameEvent", back_populates="player")


class Team(Base):
    __tablename__ = "teams"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    name = Column(String(50), nullable=False)
    game_id = Column(UUID(as_uuid=False), ForeignKey("games.id"), nullable=False)
    score = Column(Integer, default=0)

    game = relationship("Game", back_populates="teams")
    players = relationship("Player", back_populates="team")


class Game(Base):
    __tablename__ = "games"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    mode = Column(String(20), default="singles")  # singles | doubles
    current_player_index = Column(Integer, default=0)
    reds_remaining = Column(Integer, default=15)
    current_break = Column(Integer, default=0)
    last_potted_color = Column(String(20), nullable=True)
    status = Column(String(20), default="active")  # setup | active | finished
    start_time = Column(DateTime, default=datetime.utcnow)

    players = relationship("Player", back_populates="game", cascade="all, delete-orphan")
    teams = relationship("Team", back_populates="game", cascade="all, delete-orphan")
    events = relationship("GameEvent", back_populates="game", cascade="all, delete-orphan")


class GameEvent(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    game_id = Column(UUID(as_uuid=False), ForeignKey("games.id"), nullable=False)
    player_id = Column(UUID(as_uuid=False), ForeignKey("players.id"), nullable=False)
    event_type = Column(String(20), nullable=False)  # pot | foul
    ball = Column(String(20), nullable=True)
    points = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    game = relationship("Game", back_populates="events")
    player = relationship("Player", back_populates="events")
