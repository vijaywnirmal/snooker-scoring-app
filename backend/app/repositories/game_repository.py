"""
Game state repository - persistence layer
"""

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.game_state import GameStateStore, GameStateHistory


def get_game(db: Session, game_id: str) -> dict | None:
    """Load game state by ID"""
    row = db.query(GameStateStore).filter(GameStateStore.id == game_id).first()
    if not row:
        return None
    return dict(row.state_json)


def save_game(db: Session, state: dict) -> dict:
    """Create or update game state"""
    game_id = state["id"]
    row = db.query(GameStateStore).filter(GameStateStore.id == game_id).first()

    if row:
        row.state_json = state
        row.updated_at = datetime.utcnow()
    else:
        row = GameStateStore(id=game_id, state_json=state)
        db.add(row)

    db.commit()
    db.refresh(row)
    return dict(row.state_json)


def push_history(db: Session, game_id: str, state: dict) -> None:
    """Save state to history for undo"""
    row = GameStateHistory(game_id=game_id, state_json=state)
    db.add(row)
    db.commit()


def pop_history(db: Session, game_id: str) -> dict | None:
    """Get and remove last history entry"""
    row = (
        db.query(GameStateHistory)
        .filter(GameStateHistory.game_id == game_id)
        .order_by(GameStateHistory.created_at.desc())
        .first()
    )
    if not row:
        return None

    state = dict(row.state_json)
    db.delete(row)
    db.commit()
    return state


def has_history(db: Session, game_id: str) -> bool:
    """Check if undo is available"""
    return (
        db.query(GameStateHistory)
        .filter(GameStateHistory.game_id == game_id)
        .count()
        > 0
    )


def delete_game(db: Session, game_id: str) -> None:
    """Delete game and its history"""
    db.query(GameStateHistory).filter(GameStateHistory.game_id == game_id).delete()
    db.query(GameStateStore).filter(GameStateStore.id == game_id).delete()
    db.commit()
