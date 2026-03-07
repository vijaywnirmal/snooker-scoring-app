# Smart Snooker Scoring System

Digital snooker scoring application with manual scoring (Phase 1) and future camera-based automation.

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Python + FastAPI
- **Database:** PostgreSQL (persistent storage)
- **State:** Local state first

## Project Structure

```
snooker-scoring-app/
├── frontend/          # React app
│   └── src/
│       ├── components/
│       ├── services/  # Scoring engine, API client
│       └── types/     # Game state types
├── backend/           # FastAPI API
│   └── app/
│       ├── api/       # Routes, schemas
│       ├── models/    # SQLAlchemy models (PostgreSQL)
│       └── db.py
└── docs/              # BRD, FRD, User Stories
```

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL 14+

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at http://localhost:5173

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Runs at http://localhost:8000  
API docs: http://localhost:8000/docs

### Database Setup

**Option A – SQLite (default, no setup):**  
Uses `./snooker_scoring.db` by default. No extra configuration.

**Option B – PostgreSQL:**  
1. Create the database: `createdb snooker_scoring`  
   Or Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=snooker_scoring postgres:16`

2. Create `backend/.env`:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/snooker_scoring
   ```

Tables are created automatically on first backend startup.

The frontend proxies `/api` to the backend when both run locally.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/game/start` | Start new game |
| GET | `/game/state/{game_id}` | Get game state |
| POST | `/game/{game_id}/pot` | Register potted ball |
| POST | `/game/{game_id}/foul` | Record foul |
| POST | `/game/{game_id}/turn` | Change player turn |
| POST | `/game/{game_id}/undo` | Undo last action |
| POST | `/game/{game_id}/reset` | Reset game |

## Development Phases

1. **Foundation** – Types, scoring engine ✅
2. **Game Setup UI** – Player config, teams
3. **Scoreboard UI** – Display, ball buttons, controls
4. **Backend Integration** – Connect frontend to API
5. **Database** – PostgreSQL persistence ✅

## Ball Values

| Ball | Points |
|------|--------|
| Red | 1 |
| Yellow | 2 |
| Green | 3 |
| Brown | 4 |
| Blue | 5 |
| Pink | 6 |
| Black | 7 |
