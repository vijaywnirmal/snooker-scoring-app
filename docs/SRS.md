# Software Requirements Specification (SRS)

**Project:** Smart Snooker Scoring System  
**Document Version:** 1.0  
**Last Updated:** March 2025  
**Related Documents:** BRD.md, FRD.md

---

## 1. Document Purpose

This document specifies the technical requirements, data models, interfaces, and system behavior of the Smart Snooker Scoring System. It serves as the technical blueprint for development and testing, bridging the functional requirements (FRD) with implementation details.

---

## 2. System Architecture

### 2.1 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React, TypeScript, Vite | React 18+, TS 5+, Vite 5+ |
| Backend | FastAPI | 0.100+ |
| Database | SQLite (default) / PostgreSQL | SQLite 3 / PostgreSQL 14+ |
| ORM | SQLAlchemy | 2.x |

### 2.2 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                                         │
│  - Game setup UI                                                 │
│  - Scoreboard, ball controls, foul modal                         │
│  - Event history display                                         │
│  Port: 5173                                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP /api/* → proxy to backend
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend (FastAPI)                                               │
│  - REST API (game, state, pot, foul, turn, undo, reset)          │
│  - CORS: localhost:5173, 127.0.0.1:5173                          │
│  Port: 8000                                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐
│ Scoring Engine  │ │ Game Repository  │ │ Config (pydantic-settings)│
│ - pot_ball      │ │ - save_game      │ │ - DATABASE_URL           │
│ - record_foul   │ │ - get_game       │ │   (sqlite default)       │
│ - change_turn   │ │ - push/pop hist  │ └─────────────────────────┘
└─────────────────┘ └────────┬────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Database (SQLAlchemy)                                           │
│  - game_states (id, state_json, created_at, updated_at)           │
│  - game_state_history (id, game_id, state_json, created_at)      │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Deployment

| Environment | Frontend | Backend | Database |
|-------------|----------|---------|----------|
| Development | `npm run dev` (Vite) | `uvicorn app.main:app` | SQLite file |
| Production | Static build served | ASGI server | PostgreSQL (optional) |

---

## 3. Data Models

### 3.1 Domain Types

#### Ball Types

| Type | Values | Description |
|------|--------|-------------|
| `BallType` | red, yellow, green, brown, blue, pink, black | Object ball colors |
| `FoulBallType` | BallType + cue_ball | Ball involved in foul |
| `BallOnType` | red, colour, or BallType | Ball that must be struck first |

#### Ball Values (Points)

| Ball | Value |
|------|-------|
| red | 1 |
| yellow | 2 |
| green | 3 |
| brown | 4 |
| blue | 5 |
| pink | 6 |
| black | 7 |
| cue_ball | 4 (for foul calculation) |

#### Final Color Sequence (when reds gone)

`yellow → green → brown → blue → pink → black`

### 3.2 Player

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique identifier |
| name | string | 1–30 characters |
| score | number | Current score |
| teamId | string \| undefined | Team ID (4-player mode) |

### 3.3 Team

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique identifier |
| name | string | Display name (e.g. "Team 1") |
| playerIds | string[] | Player IDs in team |
| score | number | Aggregated team score |

### 3.4 Game Event

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique identifier |
| type | "pot" \| "foul" | Event type |
| playerId | string | Player who scored or committed foul |
| ball | string \| undefined | Ball potted (pot) or involved (foul) |
| points | number | Points awarded |
| timestamp | string (ISO 8601) | Event time |
| description | string \| undefined | Human-readable summary |
| ballOn | string \| undefined | (Foul) Ball that was on |
| ballInvolved | string \| undefined | (Foul) Ball struck/potted |

### 3.5 Game State

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Game identifier |
| mode | "singles" \| "doubles" | 2-player or 4-player |
| players | Player[] | Player list |
| teams | Team[] | Team list (doubles only) |
| currentPlayerIndex | number | Index of active player |
| redsRemaining | number | 0–15 |
| currentBreak | number | Consecutive points for current player |
| lastPottedColor | string \| undefined | Last potted ball color |
| ballOn | string \| undefined | Ball that must be struck next |
| events | GameEvent[] | Scoring event history |
| status | "setup" \| "active" \| "finished" | Game status |
| createdAt | string (ISO 8601) | Creation time |
| canUndo | boolean | Whether undo is available (response only) |

### 3.6 Database Schema

#### game_states

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR(36) | PRIMARY KEY, UUID |
| state_json | JSON | NOT NULL |
| created_at | DATETIME | DEFAULT utcnow |
| updated_at | DATETIME | DEFAULT utcnow, ON UPDATE utcnow |

#### game_state_history

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR(36) | PRIMARY KEY, UUID |
| game_id | VARCHAR(36) | FK → game_states.id, ON DELETE CASCADE |
| state_json | JSON | NOT NULL |
| created_at | DATETIME | DEFAULT utcnow |

---

## 4. API Specification

### 4.1 Base Configuration

| Item | Value |
|------|-------|
| Backend base URL | `http://localhost:8000` |
| Frontend proxy | `/api` → `http://localhost:8000` (path rewritten: `/api` stripped) |
| Content-Type | `application/json` |

### 4.2 Endpoints

#### POST /game/start

Create a new game.

**Request Body**

```json
{
  "num_players": 2,
  "player_names": ["Alice", "Bob"],
  "team_assignments": null,
  "first_player_index": 0
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| num_players | int | Yes | 2 or 4 |
| player_names | string[] | Yes | Length = num_players, 1–30 chars each |
| team_assignments | (string \| null)[] | No | 4 elements for 4-player; null = auto-assign |
| first_player_index | int | No | 0–3, default 0 |

**Response**

```json
{
  "game_id": "uuid",
  "message": "Game started",
  "state": { /* GameState */ }
}
```

**Errors:** 400 if `len(player_names) != num_players`

---

#### GET /game/state/{game_id}

Retrieve current game state.

**Response:** `GameState` (includes `canUndo`)

**Errors:** 404 if game not found

---

#### POST /game/{game_id}/pot

Register a pot. Invalid pot is treated as foul (CR-001).

**Request Body**

```json
{
  "ball": "red"
}
```

| Field | Value | Pattern |
|-------|-------|---------|
| ball | red \| yellow \| green \| brown \| blue \| pink \| black | Required |

**Response:** `GameState`

**Behavior:**
- Valid pot: Score updated, break updated, ball on updated, event recorded
- Invalid pot: Foul recorded with `ball_involved = ball` attempted; opponent receives penalty; turn switches

**Errors:** 404 if game not found

---

#### POST /game/{game_id}/foul

Record a foul with ball involved.

**Request Body**

```json
{
  "ball_involved": "cue_ball"
}
```

| Field | Value | Pattern |
|-------|-------|---------|
| ball_involved | red \| yellow \| green \| brown \| blue \| pink \| black \| cue_ball | Required |

**Response:** `GameState`

**Errors:** 404 if game not found

---

#### POST /game/{game_id}/turn

Change player turn (manual pass).

**Request Body:** None

**Response:** `GameState`

**Errors:** 404 if game not found

---

#### POST /game/{game_id}/undo

Undo last action. Restores previous state from history.

**Request Body:** None

**Response:** `GameState`

**Errors:**
- 404 if game not found
- 400 if nothing to undo

---

#### POST /game/{game_id}/reset

Reset game and delete from database.

**Request Body:** None

**Response**

```json
{
  "message": "Game reset"
}
```

**Errors:** 404 if game not found

---

### 4.3 Error Response Format

FastAPI returns JSON for validation errors:

```json
{
  "detail": "Error message" | [ { "loc": [...], "msg": "..." } ]
}
```

| Status | Condition |
|--------|-----------|
| 400 | Invalid input, nothing to undo |
| 404 | Game not found |
| 422 | Request body validation failure |

---

## 5. Scoring Engine Behavior

### 5.1 Pot Validation (`can_pot_ball`)

| Condition | Valid? | Error |
|-----------|--------|-------|
| ball = red, reds_remaining > 0 | Yes | — |
| ball = red, reds_remaining = 0 | No | "No reds remaining" |
| ball = colour, reds > 0, last_potted = red | Yes | — |
| ball = colour, reds > 0, last_potted = colour | No | "Must pot a red next" |
| ball = colour, reds = 0, correct sequence | Yes | — |
| ball = colour, reds = 0, wrong sequence | No | "Expected X, got Y" |

### 5.2 Ball On Transitions

| After | ballOn |
|-------|--------|
| Game start | red |
| Red potted | colour |
| Colour potted (reds > 0) | red |
| Last red potted | yellow |
| Yellow potted | green |
| Green potted | brown |
| Brown potted | blue |
| Blue potted | pink |
| Pink potted | black |

### 5.3 Foul Point Calculation (CR-001)

**Formula:** `foul_points = min(7, max(4, value(ball_on), value(ball_involved)))`

**Special values:**
- `ball_on = "colour"` → 4
- `ball_involved = "cue_ball"` → 4

**Examples:**

| Ball On | Ball Involved | Foul Points |
|---------|---------------|-------------|
| red | blue | 5 |
| red | black | 7 |
| black | red | 7 |
| red | cue_ball | 4 |
| colour | cue_ball | 4 |

### 5.4 Foul Effects

- Opponent (or opposing team) receives foul points
- Break resets to 0
- Turn switches to opponent
- `lastPottedColor` reset to null
- `ballOn` recalculated from `redsRemaining` and `lastPottedColor`
- Event recorded with `ballOn`, `ballInvolved`, `points`

---

## 6. Undo Mechanism

- Before each state-modifying action (pot, foul, turn), current state is pushed to `game_state_history`
- Undo pops the last history entry and restores it as current state
- History is not pushed for invalid pot that becomes foul (state before foul is pushed, then foul applied)
- `canUndo` is true when history stack is non-empty

---

## 7. Configuration

### 7.1 Backend (pydantic-settings)

| Variable | Default | Description |
|----------|---------|-------------|
| DATABASE_URL | `sqlite:///./snooker_scoring.db` | Database connection string |

Loaded from `.env` in backend root.

### 7.2 Frontend

| Item | Value |
|------|-------|
| Dev server port | 5173 |
| API proxy | `/api` → `http://localhost:8000` (path: `/api` → ``) |

---

## 8. Non-Functional Requirements

### 8.1 Performance

- API response time: < 200 ms for typical operations
- Game state JSON size: < 100 KB for typical match

### 8.2 Security

- CORS: Allow `http://localhost:5173`, `http://127.0.0.1:5173`
- No authentication in Phase 1 (single-user/local use)
- Database URL from environment (no secrets in code)

### 8.3 Compatibility

- Browsers: Chrome, Firefox, Safari, Edge (latest 2 versions)
- Node.js 18+
- Python 3.10+

---

## 9. Traceability

| FRD Section | SRS Section |
|-------------|-------------|
| FR-1 to FR-3 (Game Setup) | 3.5 Game State, 4.2 POST /game/start |
| FR-4 to FR-9 (Scoreboard) | 3.5, 4.2, 5 |
| FR-10 to FR-16 (Scoring Engine) | 3.1, 5 |
| FR-17, FR-18 (Turn Management) | 5.4, 4.2 turn |
| FR-19, FR-20 (History) | 3.4, 3.5 events |
| Database | 3.6 |
| API | 4 |
| CR-001 (Foul) | 5.3, 5.4, 4.2 foul |

---

## 10. Future Phase Notes

### Vision Integration (Phase 2)

- New endpoint: `POST /game/{game_id}/vision-event` (or similar)
- Request: `{ ball, pocket? }` from vision engine
- Same validation and scoring logic as manual pot
- May require idempotency keys for duplicate detection

### Extensions

- Game finished detection (all balls potted)
- Export match data (JSON/CSV)
- Player/team persistence across games
