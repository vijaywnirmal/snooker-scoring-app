# Test Case Scenarios

**Project:** Smart Snooker Scoring System  
**Document Version:** 1.0  
**Last Updated:** March 2025  
**Related Documents:** TestPlan.md, ManualTestPlan.md, UserStories.md

---

## 1. Document Purpose

This document provides detailed test case scenarios for manual and automated testing. Each scenario includes preconditions, steps, expected results, and traceability to User Stories.

---

## 2. Scenario Format

- **TC-ID:** Test case identifier  
- **Title:** Short description  
- **User Story:** Reference  
- **Preconditions:** State before test  
- **Steps:** Numbered actions  
- **Expected Result:** What should happen  
- **Priority:** High / Medium / Low  

---

## 3. Game Setup Scenarios

### TC-GS-01: Start Two-Player Game

| Field | Value |
|-------|-------|
| **User Story** | US-1.1 |
| **Priority** | High |
| **Preconditions** | App open at setup screen |
| **Steps** | 1. Enter "Alice" for Player 1 |
| | 2. Enter "Bob" for Player 2 |
| | 3. Click Start Game |
| **Expected Result** | Scoreboard displays; Alice and Bob at 0; Reds = 15; Ball on = RED |

### TC-GS-02: Validation – Empty Player Name

| Field | Value |
|-------|-------|
| **User Story** | US-1.1 |
| **Priority** | High |
| **Preconditions** | App open at setup screen |
| **Steps** | 1. Leave Player 1 empty |
| | 2. Enter "Bob" for Player 2 |
| | 3. Click Start Game |
| **Expected Result** | Error: "Player 1 name is required"; game does not start |

### TC-GS-03: Validation – Duplicate Names

| Field | Value |
|-------|-------|
| **User Story** | US-1.1 |
| **Priority** | High |
| **Preconditions** | App open at setup screen |
| **Steps** | 1. Enter "Alice" for both players |
| | 2. Click Start Game |
| **Expected Result** | Error: "Player names must be unique"; game does not start |

### TC-GS-04: Start Four-Player Team Game

| Field | Value |
|-------|-------|
| **User Story** | US-1.2 |
| **Priority** | High |
| **Preconditions** | App open at setup screen |
| **Steps** | 1. Select "4 Players (Teams)" |
| | 2. Enter Alice, Bob, Carol, Dave |
| | 3. Click Start Game |
| **Expected Result** | Team 1 (Alice, Bob) and Team 2 (Carol, Dave); team scores shown |

### TC-GS-05: Choose Who Breaks First

| Field | Value |
|-------|-------|
| **User Story** | US-1.3 |
| **Priority** | Medium |
| **Preconditions** | App open at setup screen |
| **Steps** | 1. Enter Alice and Bob |
| | 2. Select Bob as first to break |
| | 3. Click Start Game |
| **Expected Result** | Bob highlighted as current player on scoreboard |

---

## 4. Scoreboard Scenarios

### TC-SB-01: Scoreboard Shows All Elements

| Field | Value |
|-------|-------|
| **User Story** | US-2.1 |
| **Priority** | High |
| **Preconditions** | 2-player game started |
| **Steps** | 1. Observe scoreboard |
| **Expected Result** | Player names, scores, current player, Ball on, Reds remaining, Current break, ball buttons, controls visible |

### TC-SB-02: Current Player Highlighted

| Field | Value |
|-------|-------|
| **User Story** | US-2.1 |
| **Priority** | Medium |
| **Preconditions** | Game started with Alice and Bob |
| **Steps** | 1. Check which player has active styling |
| **Expected Result** | First to break has "active" highlight |

### TC-SB-03: Last Scoring Event Displayed

| Field | Value |
|-------|-------|
| **User Story** | US-2.1 |
| **Priority** | Medium |
| **Preconditions** | Game started, one pot recorded |
| **Steps** | 1. Check "Last scoring event" section |
| **Expected Result** | Shows pot details (e.g. "Alice potted red (+1)") |

---

## 5. Scoring Scenarios

### TC-SC-01: Pot Red (Valid)

| Field | Value |
|-------|-------|
| **User Story** | US-3.1 |
| **Priority** | High |
| **Preconditions** | Game started, ball on = RED |
| **Steps** | 1. Click Red ball button |
| **Expected Result** | Player +1, break +1, reds 14, ball on = COLOUR |

### TC-SC-02: Pot Colour After Red (Valid)

| Field | Value |
|-------|-------|
| **User Story** | US-3.1 |
| **Priority** | High |
| **Preconditions** | Game started, red just potted (ball on = COLOUR) |
| **Steps** | 1. Click Blue ball button |
| **Expected Result** | Player +5, ball on = RED, reds = 14 |

### TC-SC-03: Wrong Pot – Colour After Colour (Foul)

| Field | Value |
|-------|-------|
| **User Story** | US-3.2 |
| **Priority** | High |
| **Preconditions** | Red and blue potted; ball on = RED |
| **Steps** | 1. Click Blue again (invalid) |
| **Expected Result** | Foul; opponent +5; turn switches; break resets |

### TC-SC-04: Event History Shows Pots

| Field | Value |
|-------|-------|
| **User Story** | US-3.1 |
| **Priority** | Medium |
| **Preconditions** | Game with pots recorded |
| **Steps** | 1. Check Event history |
| **Expected Result** | Pots listed with ball, points, player |

---

## 6. Foul Handling Scenarios

### TC-FH-01: Foul Modal Opens

| Field | Value |
|-------|-------|
| **User Story** | US-4.2 |
| **Priority** | High |
| **Preconditions** | Game started |
| **Steps** | 1. Click Foul button |
| **Expected Result** | Modal with Red, Yellow, Green, Brown, Blue, Pink, Black, Cue ball |

### TC-FH-02: Record Foul – Cue Ball

| Field | Value |
|-------|-------|
| **User Story** | US-4.1 |
| **Priority** | High |
| **Preconditions** | Game started |
| **Steps** | 1. Click Foul, select Cue ball |
| **Expected Result** | Opponent +4; turn switches; break resets |

### TC-FH-03: Record Foul – Ball Involved Black

| Field | Value |
|-------|-------|
| **User Story** | US-4.1 |
| **Priority** | High |
| **Preconditions** | Game started (ball on = RED) |
| **Steps** | 1. Click Foul, select Black |
| **Expected Result** | Opponent +7 |

### TC-FH-04: Cancel Foul Modal

| Field | Value |
|-------|-------|
| **User Story** | US-4.2 |
| **Priority** | Medium |
| **Preconditions** | Game started |
| **Steps** | 1. Click Foul, then Cancel |
| **Expected Result** | Modal closes; no foul; state unchanged |

### TC-FH-05: Foul Event in History

| Field | Value |
|-------|-------|
| **User Story** | US-4.1 |
| **Priority** | Medium |
| **Preconditions** | Foul recorded |
| **Steps** | 1. Check Event history |
| **Expected Result** | Foul shows ball on, ball involved, points |

---

## 7. Turn Management Scenarios

### TC-TM-01: Change Turn

| Field | Value |
|-------|-------|
| **User Story** | US-5.1 |
| **Priority** | High |
| **Preconditions** | 2-player game |
| **Steps** | 1. Click Change Turn |
| **Expected Result** | Other player highlighted; break = 0 |

### TC-TM-02: Break Reset on Turn Change

| Field | Value |
|-------|-------|
| **User Story** | US-5.2 |
| **Priority** | Medium |
| **Preconditions** | Break = 6 (e.g. red + blue) |
| **Steps** | 1. Click Change Turn |
| **Expected Result** | Break shows 0 for new player |

---

## 8. Undo and Reset Scenarios

### TC-UR-01: Undo Last Pot

| Field | Value |
|-------|-------|
| **User Story** | US-7.1 |
| **Priority** | High |
| **Preconditions** | Game with one pot |
| **Steps** | 1. Click Undo |
| **Expected Result** | Score 0; reds 15; event removed |

### TC-UR-02: Undo Foul

| Field | Value |
|-------|-------|
| **User Story** | US-7.1 |
| **Priority** | High |
| **Preconditions** | Game with one foul |
| **Steps** | 1. Click Undo |
| **Expected Result** | Opponent score reverts; turn reverts |

### TC-UR-03: Undo Disabled When No History

| Field | Value |
|-------|-------|
| **User Story** | US-7.1 |
| **Priority** | Medium |
| **Preconditions** | Fresh game, no actions |
| **Steps** | 1. Observe Undo button |
| **Expected Result** | Undo disabled |

### TC-UR-04: Reset Game

| Field | Value |
|-------|-------|
| **User Story** | US-7.2 |
| **Priority** | High |
| **Preconditions** | Game in progress |
| **Steps** | 1. Click Reset Game |
| **Expected Result** | Return to setup; game cleared |

---

## 9. Data Persistence Scenarios

### TC-DP-01: Game State Persists on Refresh

| Field | Value |
|-------|-------|
| **User Story** | US-8.1 |
| **Priority** | Medium |
| **Preconditions** | Game with pots; URL contains game ID |
| **Steps** | 1. Refresh browser |
| **Expected Result** | Same game state loaded |
| **Note** | N/A if app does not persist game ID in URL |

---

## 10. Smoke Scenarios

### TC-SMOKE-01: Full Flow – 2 Player

| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | App and backend running |
| **Steps** | 1. Start 2-player game. 2. Pot red, pot blue, change turn. 3. Record foul (cue ball), undo. 4. Reset game. |
| **Expected Result** | All actions succeed; no errors |

### TC-SMOKE-02: Full Flow – 4 Player

| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | App and backend running |
| **Steps** | 1. Start 4-player game. 2. Pot red, pot blue. 3. Verify team scores update. 4. Record foul; verify opposing team gets points. |
| **Expected Result** | Team play works correctly |

---

## 11. Scenario Summary

| Epic | Scenarios | High | Medium | Low |
|------|-----------|------|--------|-----|
| Game Setup | 5 | 4 | 1 | 0 |
| Scoreboard | 3 | 1 | 2 | 0 |
| Scoring | 4 | 2 | 2 | 0 |
| Foul Handling | 5 | 3 | 2 | 0 |
| Turn Management | 2 | 1 | 1 | 0 |
| Undo and Reset | 4 | 3 | 1 | 0 |
| Data Persistence | 1 | 0 | 1 | 0 |
| Smoke | 2 | 2 | 0 | 0 |
| **Total** | **26** | **16** | **10** | **0** |
