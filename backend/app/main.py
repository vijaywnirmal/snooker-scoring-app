"""
Smart Snooker Scoring System - FastAPI Backend
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import game
from app.db import Base, engine
from app.models.game_state import GameStateHistory, GameStateStore  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables on startup if they don't exist"""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    lifespan=lifespan,
    title="Smart Snooker Scoring API",
    description="Backend API for snooker match scoring",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(game.router, prefix="/game", tags=["game"])


@app.get("/")
def root():
    return {"message": "Smart Snooker Scoring API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/db")
def health_db():
    """Check database connectivity"""
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}
