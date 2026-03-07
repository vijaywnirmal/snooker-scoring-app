"""
Game API endpoints
FRD Section 14: POST /game/start, POST /game/pot, GET /game/state, POST /game/reset
"""

from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.schemas import (
    GameStartRequest,
    GameStartResponse,
    GamePotRequest,
    GameStateResponse,
    FoulRequest,
)
from app.db import get_db
from app.repositories.game_repository import (
    delete_game,
    get_game,
    has_history,
    pop_history,
    push_history,
    save_game,
)
from app.services.scoring import change_turn, pot_ball, record_foul

router = APIRouter()


def _create_initial_state(players: list[dict], teams: list[dict] | None) -> dict:
    """Create initial game state"""
    game_id = str(uuid4())
    now = datetime.utcnow().isoformat() + "Z"

    return {
        "id": game_id,
        "mode": "doubles" if teams else "singles",
        "players": [
            {
                "id": p["id"],
                "name": p["name"],
                "score": 0,
                "teamId": p.get("teamId"),
            }
            for p in players
        ],
        "teams": teams or [],
        "currentPlayerIndex": 0,
        "redsRemaining": 15,
        "currentBreak": 0,
        "lastPottedColor": None,
        "ballOn": "red",
        "events": [],
        "status": "active",
        "createdAt": now,
    }


def _state_with_can_undo(state: dict, can_undo: bool) -> dict:
    out = dict(state)
    out["canUndo"] = can_undo
    return out


@router.post("/start", response_model=GameStartResponse)
def start_game(request: GameStartRequest, db: Session = Depends(get_db)):
    """POST /game/start - Create a new game"""
    if len(request.player_names) != request.num_players:
        raise HTTPException(
            status_code=400,
            detail=f"Expected {request.num_players} player names, got {len(request.player_names)}",
        )

    players = []
    for i, name in enumerate(request.player_names):
        players.append({
            "id": str(uuid4()),
            "name": (name or "").strip()[:30],
            "teamId": None,
        })

    teams = None
    if request.num_players == 4:
        if request.team_assignments and len(request.team_assignments) >= 4:
            team_ids = [t or str(uuid4()) for t in request.team_assignments[:4]]
        else:
            t1, t2 = str(uuid4()), str(uuid4())
            team_ids = [t1, t1, t2, t2]

        for i, p in enumerate(players):
            p["teamId"] = team_ids[i] if i < len(team_ids) else None

        unique_teams = list(dict.fromkeys(team_ids))
        if len(unique_teams) >= 2:
            teams = [
                {
                    "id": tid,
                    "name": f"Team {i+1}",
                    "playerIds": [p["id"] for p in players if p.get("teamId") == tid],
                    "score": 0,
                }
                for i, tid in enumerate(unique_teams)
            ]

    state = _create_initial_state(players, teams)
    state["currentPlayerIndex"] = min(
        request.first_player_index,
        len(state["players"]) - 1,
    )

    save_game(db, state)

    return GameStartResponse(
        game_id=state["id"],
        message="Game started",
        state=GameStateResponse(**_state_with_can_undo(state, False)),
    )


@router.get("/state/{game_id}", response_model=GameStateResponse)
def get_game_state(game_id: str, db: Session = Depends(get_db)):
    """GET /game/state - Retrieve current game state"""
    state = get_game(db, game_id)
    if not state:
        raise HTTPException(status_code=404, detail="Game not found")
    can_undo = has_history(db, game_id)
    return GameStateResponse(**_state_with_can_undo(state, can_undo))


@router.post("/{game_id}/pot", response_model=GameStateResponse)
def register_pot(game_id: str, request: GamePotRequest, db: Session = Depends(get_db)):
    """POST /game/{game_id}/pot - Register pot or foul (CR-001: wrong pot = foul)"""
    state = get_game(db, game_id)
    if not state:
        raise HTTPException(status_code=404, detail="Game not found")

    success, new_state, error = pot_ball(state, request.ball)

    if not success:
        # CR-001: Invalid pot = foul, ball_involved = ball they attempted
        push_history(db, game_id, state)
        new_state = record_foul(state, request.ball)
        save_game(db, new_state)
        return GameStateResponse(**_state_with_can_undo(new_state, True))

    push_history(db, game_id, state)
    save_game(db, new_state)

    return GameStateResponse(**_state_with_can_undo(new_state, True))


@router.post("/{game_id}/foul", response_model=GameStateResponse)
def register_foul(game_id: str, request: FoulRequest, db: Session = Depends(get_db)):
    """POST /game/{game_id}/foul - Record a foul (CR-001: ball_involved required)"""
    state = get_game(db, game_id)
    if not state:
        raise HTTPException(status_code=404, detail="Game not found")

    push_history(db, game_id, state)
    new_state = record_foul(state, request.ball_involved)
    save_game(db, new_state)

    return GameStateResponse(**_state_with_can_undo(new_state, True))


@router.post("/{game_id}/turn", response_model=GameStateResponse)
def register_turn_change(game_id: str, db: Session = Depends(get_db)):
    """POST /game/{game_id}/turn - Change player turn"""
    state = get_game(db, game_id)
    if not state:
        raise HTTPException(status_code=404, detail="Game not found")

    push_history(db, game_id, state)
    new_state = change_turn(state)
    save_game(db, new_state)

    return GameStateResponse(**_state_with_can_undo(new_state, True))


@router.post("/{game_id}/undo", response_model=GameStateResponse)
def undo_last_action(game_id: str, db: Session = Depends(get_db)):
    """POST /game/{game_id}/undo - Undo last action"""
    state = get_game(db, game_id)
    if not state:
        raise HTTPException(status_code=404, detail="Game not found")

    prev_state = pop_history(db, game_id)
    if not prev_state:
        raise HTTPException(status_code=400, detail="Nothing to undo")

    save_game(db, prev_state)

    return GameStateResponse(**_state_with_can_undo(prev_state, has_history(db, game_id)))


@router.post("/{game_id}/reset")
def reset_game(game_id: str, db: Session = Depends(get_db)):
    """POST /game/{game_id}/reset - Reset the match"""
    delete_game(db, game_id)
    return {"message": "Game reset"}
