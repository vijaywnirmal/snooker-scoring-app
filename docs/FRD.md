# Functional Requirements Document (FRD)

**Project:** Smart Snooker Scoring System  
**Document Version:** 1.0  
**Last Updated:** March 2025  
**Related Documents:** BRD.md

---

## 1. Document Purpose

This document defines the functional behavior of the Smart Snooker Scoring System. It describes how the system operates to meet the business requirements in the BRD. It covers system functionality, workflows, screen behavior, APIs, and data management.

---

## 2. System Overview

The Smart Snooker Scoring System is a digital application that tracks snooker match scores. The system supports manual scoring, allowing score operators to input potted balls and manage turns. In future phases, it will integrate with CCTV-based computer vision to automatically detect ball potting events and update scores in real time.

---

## 3. System Actors

| Actor | Description |
|-------|-------------|
| **Player** | Person participating in the match |
| **Score Operator** | Person entering scores into the system (may or may not be a player) |
| **System** | Backend scoring engine |
| **Vision Engine** | (Future) Computer vision module that detects potted balls |

---

## 4. Functional Modules

| # | Module | Description |
|---|--------|-------------|
| 1 | Game Setup Module | Create game, add players, configure teams |
| 2 | Scoreboard Module | Display game state and controls |
| 3 | Scoring Engine | Ball scoring logic, validation, foul calculation |
| 4 | Turn Management Module | Change turns, track breaks |
| 5 | Game History Module | Record and display scoring events |
| 6 | System Reset Module | Reset game, return to setup |
| 7 | Vision Integration Module | (Future) Receive and process camera events |

---

## 5. Game Setup Module

### FR-1 Create New Game

**Description:** The system shall allow users to start a new game.

**Inputs:**
- Number of players (2 or 4)
- Player names (one per player)
- Team configuration (when 4 players)
- First player to break (index 0–3)

**Behavior:**
- System initializes scores to zero
- Reds remaining set to 15
- Ball on set to RED
- Game moves to scoreboard screen

### FR-2 Player Configuration

**Description:** Users enter player names with validation.

**Rules:**
- Player names: 1–30 characters
- Names must not be empty
- Names must be unique within the game
- If 4 players selected, teams are auto-assigned (Team 1: players 1–2, Team 2: players 3–4)

### FR-3 Team Configuration

**Description:** When 4 players are selected, teams must be configured.

**Rules:**
- Each team contains exactly 2 players
- Team scores aggregate player scores
- Teams are displayed on the scoreboard

---

## 6. Scoreboard Module

### FR-4 Display Scoreboard

**Description:** The scoreboard displays the current game state.

**Display Elements:**
| Element | Description |
|---------|-------------|
| Player names | Names of all players |
| Player scores | Current score per player |
| Team scores | (4-player mode) Aggregated team scores |
| Current player | Highlighted/indicated active player |
| Ball on | Ball that must be struck next (RED, COLOUR, or color name) |
| Reds remaining | Count of red balls on table (0–15) |
| Current break | Consecutive points for current player |
| Last scoring event | Most recent pot or foul with details |

### FR-5 Ball Input Controls

**Description:** Users can select the ball that was potted.

**Controls:**
- Buttons for: Red, Yellow, Green, Brown, Blue, Pink, Black
- Each button shows ball name and point value
- Clicking a button triggers the scoring engine

**Behavior:**
- Valid pot: Score updates, break updates, ball on updates
- Invalid pot (wrong ball): Treated as foul; ball attempted = ball involved

### FR-6 Foul Control

**Description:** Users can record a foul with ball involved.

**Behavior:**
- Foul button opens modal to select ball involved
- Options: Red, Yellow, Green, Brown, Blue, Pink, Black, Cue ball
- System calculates penalty: max(4, value(ball_on), value(ball_involved))
- Opponent receives points; break resets; turn switches

### FR-7 Change Turn

**Description:** Users can manually change the active player.

**Behavior:**
- Clicking "Change Turn" switches to next player
- Break resets to zero
- Ball on resets based on game state

### FR-8 Undo Last Action

**Description:** Users can reverse the last scoring action.

**Behavior:**
- Last event removed from history
- Scores recalculated to previous state
- Game state restored
- Undo disabled when no history

### FR-9 Reset Game

**Description:** Users can reset the game and return to setup.

**Behavior:**
- All scores cleared
- Reds remaining reset to 15
- Event history cleared
- User returned to game setup screen

---

## 7. Scoring Engine

### FR-10 Ball Values

| Ball | Points |
|------|--------|
| Red | 1 |
| Yellow | 2 |
| Green | 3 |
| Brown | 4 |
| Blue | 5 |
| Pink | 6 |
| Black | 7 |

### FR-11 Ball Pot Event

**Description:** When a ball is selected for a pot.

**Valid Pot:**
1. Retrieve ball value
2. Add points to current player
3. Update break score
4. Update ball on
5. If red potted: decrease reds remaining
6. Record event in history

### FR-12 Pot Validation Rules

**Red ball:**
- Valid if reds remaining > 0
- Invalid if reds remaining = 0 ("No reds remaining")

**Colour ball (when reds on table):**
- Valid if last potted was red (or start of break)
- Invalid if last potted was colour ("Must pot a red next")

**Colour ball (when reds gone):**
- Must follow sequence: Yellow → Green → Brown → Blue → Pink → Black
- Invalid if wrong sequence ("Expected X, got Y")

### FR-13 Wrong Pot = Foul (CR-001)

**Description:** If user selects a ball that is not valid to pot, the system registers a foul.

**Behavior:**
- Ball attempted = ball involved
- Ball on = current ball on from state
- Foul points calculated per FR-14
- Opponent receives points; turn switches; break resets

### FR-14 Foul Point Calculation (CR-001)

**Formula:** `foul_points = max(4, value(ball_on), value(ball_involved))`

**Rules:**
- Minimum: 4 points
- Maximum: 7 points
- Cue ball: Treated as value 4
- Ball on "colour": Treated as value 4 when unspecified

**Examples:**
| Ball On | Ball Involved | Foul Points |
|---------|---------------|-------------|
| RED | BLUE | 5 |
| RED | BLACK | 7 |
| BLACK | RED | 7 |
| RED | Cue ball | 4 |

### FR-15 Track Reds Remaining

**Rules:**
- Initial value: 15
- Decreases by 1 when red is potted
- Cannot go below 0

### FR-16 Track Ball On (CR-001)

**Description:** System tracks which ball must be struck first.

**Transitions:**
| After | Ball On |
|-------|---------|
| Game start | RED |
| Red potted | COLOUR |
| Colour potted (reds > 0) | RED |
| Last red potted | YELLOW |
| Yellow potted | GREEN |
| Green potted | BROWN |
| Brown potted | BLUE |
| Blue potted | PINK |
| Pink potted | BLACK |

---

## 8. Turn Management Module

### FR-17 Change Turn

**Description:** User selects "Change Turn" to pass play to next player.

**Behavior:**
- Active player index advances (wraps for 2 or 4 players)
- Break resets to 0
- Ball on resets based on state (reds remaining, last potted)

### FR-18 Break Tracking

**Description:** System tracks consecutive scoring points for the active player.

**Behavior:**
- Add ball points to break on valid pot
- Reset break on: turn change, foul

---

## 9. Game History Module

### FR-19 Record Scoring Events

**Description:** Each scoring action is logged.

**Event Data:**
| Field | Description |
|-------|-------------|
| id | Unique identifier |
| type | "pot" or "foul" |
| playerId | Player who scored or committed foul |
| ball | (Pot) Ball potted; (Foul) Ball involved |
| points | Points awarded |
| timestamp | ISO 8601 timestamp |
| description | Human-readable summary |
| ballOn | (Foul) Ball that was on |
| ballInvolved | (Foul) Ball struck/potted |

### FR-20 Display Event History

**Description:** Users can view previous scoring events.

**Display:**
- List of events (most recent first)
- Last 10 events shown
- Foul events show: player, ball on, ball involved, points

---

## 10. Database Requirements

### Tables

**game_states**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| state_json | JSONB | Full game state |
| created_at | DateTime | Creation time |
| updated_at | DateTime | Last update |

**game_state_history**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| game_id | UUID | FK to game_states |
| state_json | JSONB | Snapshot for undo |
| created_at | DateTime | When saved |

---

## 11. API Requirements

### Base URL
- Development: `http://localhost:8000`
- Frontend proxy: `/api` → backend

### Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/game/start` | Start new game | num_players, player_names, first_player_index, team_assignments? | game_id, state |
| GET | `/game/state/{game_id}` | Get game state | — | GameState |
| POST | `/game/{game_id}/pot` | Register pot (or foul if invalid) | { ball } | GameState |
| POST | `/game/{game_id}/foul` | Record foul | { ball_involved } | GameState |
| POST | `/game/{game_id}/turn` | Change turn | — | GameState |
| POST | `/game/{game_id}/undo` | Undo last action | — | GameState |
| POST | `/game/{game_id}/reset` | Reset game | — | { message } |

### Error Responses

| Code | Condition |
|------|-----------|
| 400 | Invalid input, invalid pot (when not treated as foul), nothing to undo |
| 404 | Game not found |

---

## 12. System States

| State | Description |
|-------|-------------|
| **Game Setup** | Configuring players and teams |
| **Game Active** | Match in progress |
| **Break Active** | Player has potted and may continue |
| **Turn Change** | Switching to next player |
| **Game Finished** | (Future) All balls potted |

---

## 13. Error Handling

| Scenario | System Response |
|----------|-----------------|
| Invalid player input | Validation message (e.g., "Player 1 name is required") |
| Duplicate player names | "Player names must be unique" |
| Invalid ball sequence | Error or foul (wrong pot = foul) |
| API failure | Retry notification / error banner |
| Duplicate event | Ignored (idempotent where applicable) |
| Nothing to undo | "Nothing to undo" (400) |

---

## 14. Vision Integration (Future Phase)

### FR-21 Receive Vision Events

**Description:** System shall receive pot events from the vision engine.

**Behavior:**
- Vision API endpoint receives detected ball and pocket
- Validate event against current game state
- Trigger scoring engine
- Return updated state

### FR-22 Camera Event Processing

**Description:** Vision engine detects and sends events.

**Tasks:**
- Detect ball color
- Detect pocket event
- Send event to scoring API

---

## 15. Acceptance Criteria Summary

The system must:
- Allow match setup with 2 or 4 players
- Correctly update scores based on ball values
- Enforce pot validation and treat wrong pot as foul
- Calculate foul points per official rules (ball on, ball involved)
- Switch turns accurately
- Record event history with foul metadata
- Support undo functionality
- Support reset to return to setup
