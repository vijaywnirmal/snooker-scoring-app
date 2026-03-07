# Manual Test Plan

**Project:** Smart Snooker Scoring System  
**Document Version:** 1.0  
**Last Updated:** March 2025  
**Related Documents:** BRD.md, FRD.md, SRS.md, UserStories.md, TestPlan.md, TestCaseScenarios.md, TestReportSummary.md

---

## 1. Document Purpose

This document provides a manual test checklist for the Smart Snooker Scoring System. Testers use it to verify functionality before release. Each test case maps to User Story acceptance criteria.

**Test deliverables in docs/:**
- **TestPlan.md** – Test strategy, scope, approach
- **TestCaseScenarios.md** – Detailed scenarios with preconditions and priority
- **ManualTestPlan.md** – This checklist for execution
- **TestReportSummary.md** – Template for execution results and sign-off

---

## 2. Prerequisites

| Item | Requirement |
|------|-------------|
| Backend running | `cd backend && uvicorn app.main:app --reload` (port 8000) |
| Frontend running | `cd frontend && npm run dev` (port 5173) |
| Browser | Chrome, Firefox, Safari, or Edge (latest) |
| Database | SQLite (default) or PostgreSQL |

**Start both servers before testing.**

---

## 3. Test Case Format

- **TC-ID:** Unique test case identifier  
- **User Story:** Reference to UserStories.md  
- **Steps:** Numbered actions to perform  
- **Expected:** What should happen  
- **Pass/Fail:** Checkbox for tester

---

## 4. Epic: Game Setup

### TC-GS-01: Start Two-Player Game

| Field | Value |
|-------|-------|
| **User Story** | US-1.1 |
| **Steps** | 1. Open app (http://localhost:5173) |
| | 2. Enter "Alice" for Player 1, "Bob" for Player 2 |
| | 3. Click Start Game |
| **Expected** | Scoreboard shows Alice and Bob at 0 points; Reds remaining = 15; Ball on = RED |
| **Pass/Fail** | ☐ |

### TC-GS-02: Validation – Empty Player Name

| Field | Value |
|-------|-------|
| **User Story** | US-1.1 |
| **Steps** | 1. Leave Player 1 name empty |
| | 2. Enter "Bob" for Player 2 |
| | 3. Click Start Game |
| **Expected** | Error message: "Player 1 name is required" |
| **Pass/Fail** | ☐ |

### TC-GS-03: Validation – Duplicate Player Names

| Field | Value |
|-------|-------|
| **User Story** | US-1.1 |
| **Steps** | 1. Enter "Alice" for both players |
| | 2. Click Start Game |
| **Expected** | Error message: "Player names must be unique" |
| **Pass/Fail** | ☐ |

### TC-GS-04: Start Four-Player Team Game

| Field | Value |
|-------|-------|
| **User Story** | US-1.2 |
| **Steps** | 1. Select "4 Players (Teams)" |
| | 2. Enter names: Alice, Bob, Carol, Dave |
| | 3. Click Start Game |
| **Expected** | Scoreboard shows Team 1 and Team 2; team scores aggregate player scores |
| **Pass/Fail** | ☐ |

### TC-GS-05: Choose Who Breaks First

| Field | Value |
|-------|-------|
| **User Story** | US-1.3 |
| **Steps** | 1. Enter "Alice" and "Bob" |
| | 2. Select "Bob" as first to break |
| | 3. Click Start Game |
| **Expected** | Bob is highlighted as current player on scoreboard |
| **Pass/Fail** | ☐ |

---

## 5. Epic: Scoreboard Display

### TC-SB-01: Scoreboard Shows All Elements

| Field | Value |
|-------|-------|
| **User Story** | US-2.1 |
| **Steps** | 1. Start a 2-player game |
| | 2. Observe scoreboard |
| **Expected** | Player names, scores, current player, Ball on, Reds remaining, Current break visible |
| **Pass/Fail** | ☐ |

### TC-SB-02: Current Player Highlighted

| Field | Value |
|-------|-------|
| **User Story** | US-2.1 |
| **Steps** | 1. Start game with Alice and Bob |
| | 2. Check which player is highlighted |
| **Expected** | First player to break has visible "active" styling |
| **Pass/Fail** | ☐ |

### TC-SB-03: Last Scoring Event Displayed

| Field | Value |
|-------|-------|
| **User Story** | US-2.1 |
| **Steps** | 1. Start game, pot a red |
| | 2. Check "Last scoring event" section |
| **Expected** | Shows "Alice potted red (+1)" or similar |
| **Pass/Fail** | ☐ |

---

## 6. Epic: Scoring (Pots)

### TC-SC-01: Pot Red (Valid)

| Field | Value |
|-------|-------|
| **User Story** | US-3.1 |
| **Steps** | 1. Start game, pot a red |
| **Expected** | Current player +1, break +1, reds 14, ball on = COLOUR |
| **Pass/Fail** | ☐ |

### TC-SC-02: Pot Colour After Red (Valid)

| Field | Value |
|-------|-------|
| **User Story** | US-3.1 |
| **Steps** | 1. Start game, pot red, then pot blue |
| **Expected** | Player gains 6 total (1+5); ball on = RED; reds = 14 |
| **Pass/Fail** | ☐ |

### TC-SC-03: Wrong Pot – Colour After Colour (Foul)

| Field | Value |
|-------|-------|
| **User Story** | US-3.2 |
| **Steps** | 1. Start game, pot red, pot blue |
| | 2. Try to pot blue again (invalid – must pot red) |
| **Expected** | Foul recorded; opponent gets 5 points; turn switches |
| **Pass/Fail** | ☐ |

### TC-SC-04: Event History Shows Pot

| Field | Value |
|-------|-------|
| **User Story** | US-3.1 |
| **Steps** | 1. Start game, pot red, pot blue |
| | 2. Check Event history |
| **Expected** | Both pots listed with ball, points, player |
| **Pass/Fail** | ☐ |

---

## 7. Epic: Foul Handling

### TC-FH-01: Foul Modal Opens

| Field | Value |
|-------|-------|
| **User Story** | US-4.2 |
| **Steps** | 1. Start game, click Foul |
| **Expected** | Modal opens with Red, Yellow, Green, Brown, Blue, Pink, Black, Cue ball options |
| **Pass/Fail** | ☐ |

### TC-FH-02: Record Foul – Cue Ball

| Field | Value |
|-------|-------|
| **User Story** | US-4.1 |
| **Steps** | 1. Start game, click Foul, select Cue ball |
| **Expected** | Opponent gets 4 points; turn switches; break resets |
| **Pass/Fail** | ☐ |

### TC-FH-03: Record Foul – Ball Involved Black

| Field | Value |
|-------|-------|
| **User Story** | US-4.1 |
| **Steps** | 1. Start game (ball on = RED), click Foul, select Black |
| **Expected** | Opponent gets 7 points |
| **Pass/Fail** | ☐ |

### TC-FH-04: Cancel Foul Modal

| Field | Value |
|-------|-------|
| **User Story** | US-4.2 |
| **Steps** | 1. Click Foul, then Cancel (or click overlay) |
| **Expected** | Modal closes; no foul recorded; game state unchanged |
| **Pass/Fail** | ☐ |

### TC-FH-05: Foul Event in History

| Field | Value |
|-------|-------|
| **User Story** | US-4.1 |
| **Steps** | 1. Record a foul with ball involved = Blue |
| | 2. Check Event history |
| **Expected** | Foul event shows ball on, ball involved, points |
| **Pass/Fail** | ☐ |

---

## 8. Epic: Turn Management

### TC-TM-01: Change Turn

| Field | Value |
|-------|-------|
| **User Story** | US-5.1 |
| **Steps** | 1. Start 2-player game |
| | 2. Click Change Turn |
| **Expected** | Other player highlighted; break resets to 0 |
| **Pass/Fail** | ☐ |

### TC-TM-02: Break Reset on Turn Change

| Field | Value |
|-------|-------|
| **User Story** | US-5.2 |
| **Steps** | 1. Pot red, pot blue (break = 6) |
| | 2. Click Change Turn |
| **Expected** | Break shows 0 for new player |
| **Pass/Fail** | ☐ |

---

## 9. Epic: Undo and Reset

### TC-UR-01: Undo Last Pot

| Field | Value |
|-------|-------|
| **User Story** | US-7.1 |
| **Steps** | 1. Start game, pot red |
| | 2. Click Undo |
| **Expected** | Score reverts to 0; reds = 15; event removed |
| **Pass/Fail** | ☐ |

### TC-UR-02: Undo Foul

| Field | Value |
|-------|-------|
| **User Story** | US-7.1 |
| **Steps** | 1. Start game, record foul |
| | 2. Click Undo |
| **Expected** | Opponent's score reverts; turn reverts |
| **Pass/Fail** | ☐ |

### TC-UR-03: Undo Disabled When No History

| Field | Value |
|-------|-------|
| **User Story** | US-7.1 |
| **Steps** | 1. Start game (no actions yet) |
| **Expected** | Undo button is disabled |
| **Pass/Fail** | ☐ |

### TC-UR-04: Reset Game

| Field | Value |
|-------|-------|
| **User Story** | US-7.2 |
| **Steps** | 1. Start game, pot some balls |
| | 2. Click Reset Game |
| **Expected** | Return to setup screen; game cleared |
| **Pass/Fail** | ☐ |

---

## 10. Epic: Data Persistence

### TC-DP-01: Game State Persists on Refresh

| Field | Value |
|-------|-------|
| **User Story** | US-8.1 |
| **Steps** | 1. Start game, pot a few balls |
| | 2. Note URL (contains game ID) |
| | 3. Refresh browser |
| **Expected** | Same game state loaded; scores preserved |
| **Pass/Fail** | ☐ |

**Note:** Requires game ID in URL (e.g. via routing). If app does not persist URL, skip or mark N/A.

---

## 11. Regression / Smoke Tests

### TC-SMOKE-01: Full Flow – 2 Player

| Steps | 1. Start 2-player game |
| | 2. Pot red, pot blue, change turn |
| | 3. Record foul (cue ball), undo |
| | 4. Reset game |
| **Expected** | All actions work; no errors |
| **Pass/Fail** | ☐ |

### TC-SMOKE-02: Full Flow – 4 Player

| Steps | 1. Start 4-player game |
| | 2. Pot red, pot blue |
| | 3. Verify team scores update |
| | 4. Record foul, verify opposing team gets points |
| **Expected** | Team play works correctly |
| **Pass/Fail** | ☐ |

---

## 12. Test Execution Summary

| Epic | Total Cases | Passed | Failed | Blocked |
|------|-------------|-------|--------|---------|
| Game Setup | 5 | | | |
| Scoreboard | 3 | | | |
| Scoring | 4 | | | |
| Foul Handling | 5 | | | |
| Turn Management | 2 | | | |
| Undo and Reset | 4 | | | |
| Data Persistence | 1 | | | |
| Smoke | 2 | | | |
| **Total** | **26** | | | |

---

## 13. Defect Reporting

When a test fails, record:

- **TC-ID:** Test case that failed  
- **Steps to reproduce:** Exact actions  
- **Expected vs actual:** What was observed  
- **Environment:** Browser, OS, backend/frontend versions  

---

## 14. Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | | | |
| QA Lead | | | |
