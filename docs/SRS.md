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
| App | React, TypeScript, Vite | React 19, TS 5+, Vite 7 |
| Scoring engine | TypeScript, runs in the browser | — |
| Storage | Browser `localStorage` | — |

There is no backend server and no database.

### 2.2 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  UI (React + Vite)                                               │
│  - Game setup (components/GameSetup.tsx)                         │
│  - Scoreboard, ball controls, foul modal, event history          │
│    (components/Scoreboard.tsx)                                   │
│  - App.tsx holds the current game and undo history               │
└────────────────────────────┬────────────────────────────────────┘
                             │ function calls
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐
│ Scoring rules   │ │ Game actions     │ │ Game storage             │
│ scoringEngine.ts│ │ gameActions.ts   │ │ gameStorage.ts           │
│ - canPotBall    │ │ - registerPot    │ │ - loadSavedGame          │
│ - getBallOn     │ │ - recordFoul     │ │ - saveGame               │
│ - foul points   │ │ - changeTurn     │ │                          │
└─────────────────┘ └─────────────────┘ └────────────┬────────────┘
                                                      │
                                                      ▼
                                        ┌─────────────────────────┐
                                        │ Browser localStorage     │
                                        │ { game, history }        │
                                        └─────────────────────────┘
```

### 2.3 Deployment

| Environment | How it runs |
|-------------|-------------|
| Development | `npm run dev` in `frontend/` (Vite, port 5173) |
| Production | Static build (`npm run build`) served by Vercel, root directory `frontend` |

No environment variables are required.

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

### 3.6 Browser Storage

The current game is stored in `localStorage` under the key `snooker-scoring:game:v1` as one JSON value:

| Field | Type | Description |
|-------|------|-------------|
| game | GameState | Current game state |
| history | GameState[] | Earlier states for undo, oldest first, at most 50 |

- Written after every state change; removed on reset
- Read once when the app loads; invalid or missing data means no saved game
- Read and write failures are ignored: the game keeps working but does not survive a reload

---

## 4. Scoring Actions

Scoring actions are plain functions in `frontend/src/utils/gameActions.ts` and `gameState.ts`. Each takes the current `GameState` and returns a new one; the state passed in is never modified. There is no API.

| Function | Input | Behavior |
|----------|-------|----------|
| `createInitialGameState` | player names, team numbers?, first player index, options | Creates a new game |
| `registerPot` | game, ball | Valid pot: score, break and ball on updated, event recorded. Pot not allowed: recorded as a foul on that ball (CR-001) |
| `recordFoul` | game, ball involved | Applies the foul penalty, ends the break, passes the turn, records the event |
| `changeTurn` | game | Passes to the next player and resets the break |

`ball` is one of red, yellow, green, brown, blue, pink, black. `ball involved` may also be `cue_ball`.

Undo and reset are handled in `App.tsx` (see section 6).

### 4.1 Input Validation

Player names are validated on the setup screen before a game is created: 1–30 characters each, and unique.

---

## 5. Scoring Engine Behavior

### 5.1 Pot Validation (`canPotBall`)

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

- Before each state-modifying action (pot, foul, turn), the current state is added to the in-memory history, which is saved to `localStorage` with the game
- Undo pops the last history entry and restores it as current state
- History is not pushed for invalid pot that becomes foul (state before foul is pushed, then foul applied)
- Undo is available when the history is non-empty
- The history keeps the most recent 50 states

---

## 7. Configuration

| Item | Value |
|------|-------|
| Dev server port | 5173 |
| Environment variables | None |

---

## 8. Non-Functional Requirements

### 8.1 Performance

- Scoring actions complete instantly in the browser; no network requests are made
- Game state JSON size: < 100 KB for typical match

### 8.2 Security

- No authentication; game data never leaves the device
- No secrets or server-side configuration

### 8.3 Compatibility

- Browsers: Chrome, Firefox, Safari, Edge (latest 2 versions)
- Node.js 18+ (development only)

---

## 9. Traceability

| FRD Section | SRS Section |
|-------------|-------------|
| FR-1 to FR-3 (Game Setup) | 3.5 Game State, 4 `createInitialGameState` |
| FR-4 to FR-9 (Scoreboard) | 3.5, 4, 5 |
| FR-10 to FR-16 (Scoring Engine) | 3.1, 5 |
| FR-17, FR-18 (Turn Management) | 5.4, 4 `changeTurn` |
| FR-19, FR-20 (History) | 3.4, 3.5 events |
| Data Storage | 3.6 |
| Scoring Actions | 4 |
| CR-001 (Foul) | 5.3, 5.4, 4 `recordFoul` |

---

## 10. Future Phase Notes

### Vision Integration (Phase 2)

- The vision engine will need a way to deliver `{ ball, pocket? }` events to the device scoring the table; this is likely to need a server component, which does not exist today
- Same validation and scoring logic as manual pot
- May require idempotency keys for duplicate detection

### Extensions

- Game finished detection (all balls potted)
- Export match data (JSON/CSV)
- Player/team persistence across games
