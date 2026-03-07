# User Stories

**Project:** Smart Snooker Scoring System  
**Document Version:** 1.0  
**Last Updated:** March 2025  
**Related Documents:** BRD.md, FRD.md, SRS.md

---

## 1. Document Purpose

This document defines user stories for the Smart Snooker Scoring System. Each story follows the format: *As a [role], I want [action] so that [benefit]*, with detailed acceptance criteria and scenarios. Stories are grouped by epic and traceable to FRD requirements.

---

## 2. User Personas (Reference)

| Persona | Description | Primary Needs |
|---------|-------------|---------------|
| **Casual Player** | Plays occasionally for fun | Simple scoreboard, no pen and paper |
| **Competitive Player** | Plays regularly, tracks performance | Accurate scoring, match history |
| **Score Operator** | Enters scores (may not be a player) | Easy interface, one-tap scoring |
| **Snooker Club** | Manages facilities | Automation, multi-table (future) |

---

## 3. Epic: Game Setup

### US-1.1 Start a Two-Player Game

**As a** casual player  
**I want** to start a new two-player game by entering our names  
**So that** we can track our match digitally instead of using pen and paper.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | I am on the game setup screen | I enter 2 player names and start the game | A new game is created with both players at 0 points |
| AC2 | I start a game | The game begins | Reds remaining = 15, ball on = RED |
| AC3 | I start a game | The game begins | I am taken to the scoreboard screen |
| AC4 | I enter player names | I click Start | Each player name is 1–30 characters and not empty |
| AC5 | I enter duplicate names | I try to start | System shows "Player names must be unique" (or equivalent validation) |

**Traceability:** FR-1, FR-2

---

### US-1.2 Start a Four-Player Team Game

**As a** competitive player  
**I want** to start a four-player team game with my partner against another pair  
**So that** we can play doubles and have team scores tracked automatically.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | I am on the game setup screen | I select 4 players and enter names | Teams are auto-assigned (Team 1: players 1–2, Team 2: players 3–4) |
| AC2 | I start a 4-player game | The game begins | Team scores are shown and aggregate player scores |
| AC3 | I start a 4-player game | The game begins | Each team has exactly 2 players |
| AC4 | I provide team assignments | I start the game | Custom team groupings are applied (if supported) |

**Traceability:** FR-1, FR-3

---

### US-1.3 Choose Who Breaks First

**As a** score operator  
**I want** to select which player breaks first before the game starts  
**So that** the correct player is shown as active when the match begins.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | I am setting up a 2-player game | I select Player 2 to break first | Player 2 is highlighted as current player when the scoreboard loads |
| AC2 | I am setting up a 4-player game | I select Player 3 to break first | Player 3 is highlighted as current player |
| AC3 | I do not change the default | The game starts | Player 1 (index 0) breaks first |

**Traceability:** FR-1

---

## 4. Epic: Scoreboard Display

### US-2.1 View the Scoreboard

**As a** score operator  
**I want** to see the current game state clearly on the scoreboard  
**So that** I can verify scores and know what ball is on before entering the next event.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | A game is active | I view the scoreboard | I see player names and their current scores |
| AC2 | A game is active | I view the scoreboard | I see the current player highlighted |
| AC3 | A game is active | I view the scoreboard | I see "Ball on" (RED, COLOUR, or color name) |
| AC4 | A game is active | I view the scoreboard | I see reds remaining (0–15) |
| AC5 | A game is active | I view the scoreboard | I see the current break for the active player |
| AC6 | A 4-player game is active | I view the scoreboard | I see team names and team scores |
| AC7 | At least one event has occurred | I view the scoreboard | I see the last scoring event (pot or foul) with details |

**Traceability:** FR-4

---

## 5. Epic: Scoring (Pots)

### US-3.1 Record a Valid Pot

**As a** score operator  
**I want** to tap the ball that was potted  
**So that** the score updates automatically and I don't have to calculate points myself.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Ball on is RED, reds remaining > 0 | I tap Red | Current player gains 1 point, break increases, reds decrease by 1 |
| AC2 | Ball on is COLOUR, last pot was red | I tap Blue | Current player gains 5 points, break increases, ball on becomes RED |
| AC3 | Ball on is COLOUR, last pot was red | I tap any colour | Current player gains that ball's value, ball on becomes RED |
| AC4 | Reds are gone, ball on is Yellow | I tap Yellow | Current player gains 2 points, ball on becomes Green |
| AC5 | Reds are gone, ball on is Black | I tap Black | Current player gains 7 points, ball on becomes Black (end of colours) |
| AC6 | I record a valid pot | The pot is processed | The event appears in the history with ball, points, and timestamp |
| AC7 | A 4-player game is active | I record a pot | The team score updates to reflect the player's new total |

**Traceability:** FR-5, FR-10, FR-11, FR-15, FR-16

---

### US-3.2 Wrong Pot Treated as Foul

**As a** score operator  
**I want** the system to treat a wrong ball selection as a foul automatically  
**So that** I don't have to manually record a foul when someone pots the wrong ball.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Ball on is RED, reds = 0 | I tap Red | System records a foul; ball involved = red; opponent receives penalty |
| AC2 | Ball on is COLOUR, last pot was colour | I tap Blue | System records a foul; ball involved = blue; opponent receives penalty |
| AC3 | Reds gone, ball on is Yellow | I tap Green | System records a foul; ball involved = green; opponent receives penalty |
| AC4 | A wrong pot is recorded as foul | The foul is processed | Turn switches to opponent, break resets to 0 |
| AC5 | A wrong pot is recorded as foul | The foul is processed | Event history shows foul with ball on, ball involved, and points |

**Traceability:** FR-5, FR-13

---

## 6. Epic: Foul Handling

### US-4.1 Record a Foul with Ball Involved

**As a** score operator  
**I want** to record a foul and select which ball was involved (including cue ball)  
**So that** the correct penalty is applied per official snooker rules.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | A foul occurs (e.g. cue ball potted) | I tap Foul and select Cue ball | Opponent receives 4 points (minimum foul) |
| AC2 | Ball on is RED | I record foul with ball involved = Black | Opponent receives 7 points |
| AC3 | Ball on is BLACK | I record foul with ball involved = Red | Opponent receives 7 points |
| AC4 | Ball on is RED | I record foul with ball involved = Blue | Opponent receives 5 points |
| AC5 | I record a foul | The foul is processed | Turn switches to opponent, break resets to 0 |
| AC6 | I record a foul | The foul is processed | Event shows ball on, ball involved, and points in history |
| AC7 | A 4-player game | I record a foul | The opposing team receives the penalty points |

**Traceability:** FR-6, FR-14

---

### US-4.2 Foul Modal Shows All Ball Options

**As a** score operator  
**I want** a foul modal that lists all possible balls involved  
**So that** I can accurately record any type of foul (object ball or cue ball).

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | I tap the Foul button | The modal opens | I see options: Red, Yellow, Green, Brown, Blue, Pink, Black, Cue ball |
| AC2 | I select a ball and confirm | The modal closes | The foul is recorded with that ball as ball involved |
| AC3 | I cancel the modal | I close without selecting | No foul is recorded, game state unchanged |

**Traceability:** FR-6

---

## 7. Epic: Turn Management

### US-5.1 Change Turn Manually

**As a** score operator  
**I want** to manually change the active player when someone misses or chooses not to pot  
**So that** the correct player is shown as "on" for the next shot.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Player 1 is active in a 2-player game | I tap Change Turn | Player 2 becomes active |
| AC2 | Player 2 is active | I tap Change Turn | Player 1 becomes active |
| AC3 | Player 4 is active in a 4-player game | I tap Change Turn | Player 1 becomes active |
| AC4 | I change turn | The turn changes | Break resets to 0 |
| AC5 | I change turn | The turn changes | Ball on is recalculated (e.g. RED if reds remain, no last pot) |

**Traceability:** FR-7, FR-17

---

### US-5.2 Track Current Break

**As a** competitive player  
**I want** to see my current break (consecutive points) while I'm at the table  
**So that** I know how many points I've scored in this visit.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | I pot a red | My break increases | Break shows 1 |
| AC2 | I pot red then blue | My break increases | Break shows 6 |
| AC3 | I commit a foul or change turn | — | Break resets to 0 |
| AC4 | Opponent pots | — | My break stays 0; opponent's break increases |

**Traceability:** FR-4, FR-18

---

## 8. Epic: Game History

### US-6.1 View Event History

**As a** competitive player  
**I want** to see the last scoring events (pots and fouls)  
**So that** I can review what happened and verify the score is correct.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Events have occurred | I view the history | I see the most recent events first |
| AC2 | A pot was recorded | I view the history | I see player name, ball, points, and timestamp |
| AC3 | A foul was recorded | I view the history | I see player, ball on, ball involved, points, and opponent who received them |
| AC4 | Many events exist | I view the history | At least the last 10 events are shown |

**Traceability:** FR-19, FR-20

---

## 9. Epic: Undo and Reset

### US-7.1 Undo Last Action

**As a** score operator  
**I want** to undo the last scoring action if I made a mistake  
**So that** I can correct errors without resetting the entire game.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | I just recorded a pot | I tap Undo | The pot is removed, scores revert, ball on and reds revert |
| AC2 | I just recorded a foul | I tap Undo | The foul is removed, scores revert, turn reverts |
| AC3 | I just changed turn | I tap Undo | The turn reverts to the previous player |
| AC4 | No actions have been taken (or all undone) | I tap Undo | Undo is disabled or shows "Nothing to undo" |
| AC5 | I undo | The state is restored | Event history no longer shows the undone event |

**Traceability:** FR-8

---

### US-7.2 Reset Game

**As a** casual player  
**I want** to reset the game and return to setup  
**So that** we can start a new match without closing the app.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | A game is in progress | I tap Reset | I am returned to the game setup screen |
| AC2 | I reset the game | Reset completes | All scores cleared, reds = 15, event history cleared |
| AC3 | I reset the game | Reset completes | The previous game is deleted; a new game must be started |

**Traceability:** FR-9

---

## 10. Epic: Data Persistence (Implicit)

### US-8.1 Game State Persists Across Page Refresh

**As a** score operator  
**I want** the game state to be saved so that if I refresh the page, the match is not lost  
**So that** I don't lose progress due to accidental refresh or browser issues.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | A game is in progress | I refresh the browser (with game ID in URL) | The same game state is loaded |
| AC2 | I have made several pots | I refresh | Scores, ball on, reds, and events are preserved |

**Traceability:** FR-10 (Database), SRS 3.6

---

## 11. Story Summary

| ID | Epic | Title |
|----|------|-------|
| US-1.1 | Game Setup | Start a Two-Player Game |
| US-1.2 | Game Setup | Start a Four-Player Team Game |
| US-1.3 | Game Setup | Choose Who Breaks First |
| US-2.1 | Scoreboard | View the Scoreboard |
| US-3.1 | Scoring | Record a Valid Pot |
| US-3.2 | Scoring | Wrong Pot Treated as Foul |
| US-4.1 | Foul Handling | Record a Foul with Ball Involved |
| US-4.2 | Foul Handling | Foul Modal Shows All Ball Options |
| US-5.1 | Turn Management | Change Turn Manually |
| US-5.2 | Turn Management | Track Current Break |
| US-6.1 | Game History | View Event History |
| US-7.1 | Undo and Reset | Undo Last Action |
| US-7.2 | Undo and Reset | Reset Game |
| US-8.1 | Data Persistence | Game State Persists Across Page Refresh |

---

## 12. Future Phase Stories (Placeholder)

| ID | Epic | Title | Phase |
|----|------|-------|-------|
| US-9.1 | Vision | Receive automatic pot events from camera | Phase 2 |
| US-9.2 | Vision | Override or correct vision-detected events | Phase 2 |
| US-10.1 | Analytics | Export match data (JSON/CSV) | Future |
| US-10.2 | Game Finish | Detect when all balls are potted and mark game finished | Future |
