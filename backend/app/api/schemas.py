"""
Pydantic schemas for API request/response
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class GameStartRequest(BaseModel):
    num_players: int = Field(..., ge=2, le=4)
    player_names: list[str] = Field(..., min_length=2, max_length=4)
    team_assignments: list[str | None] | None = None  # team_id per player, for 4-player mode
    first_player_index: int = Field(0, ge=0, le=3)  # Who breaks first


class GamePotRequest(BaseModel):
    ball: str = Field(..., pattern="^(red|yellow|green|brown|blue|pink|black)$")


class FoulRequest(BaseModel):
    ball_involved: str = Field(..., pattern="^(red|yellow|green|brown|blue|pink|black|cue_ball)$")


class PlayerState(BaseModel):
    id: str
    name: str
    score: int
    teamId: str | None = None


class TeamState(BaseModel):
    id: str
    name: str
    playerIds: list[str]
    score: int


class GameEventState(BaseModel):
    id: str
    type: str
    playerId: str
    ball: str | None = None
    points: int
    timestamp: str
    description: str | None = None
    ballOn: str | None = None
    ballInvolved: str | None = None


class GameStateResponse(BaseModel):
    id: str
    mode: str
    players: list[PlayerState]
    teams: list[TeamState] = []
    currentPlayerIndex: int
    redsRemaining: int
    currentBreak: int
    lastPottedColor: str | None = None
    ballOn: str | None = None
    events: list[GameEventState] = []
    status: str
    createdAt: str
    canUndo: bool = False  # Whether undo is available (backend-managed)


class GameStartResponse(BaseModel):
    game_id: str
    message: str
    state: GameStateResponse | None = None  # Full state to avoid extra fetch
