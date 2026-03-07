# Business Requirements Document (BRD)

**Project:** Smart Snooker Scoring System with Camera Integration  
**Document Version:** 1.0  
**Last Updated:** March 2025  
**Status:** Approved

---

## 1. Document Control

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | March 2025 | Business Analyst | Initial BRD |

---

## 2. Executive Summary

The Smart Snooker Scoring System is a digital application that enables snooker players to track scores, manage teams, and monitor game progress through an intuitive interface. The solution provides manual score tracking, allowing players or score operators to input potted balls and manage turns. In future phases, the system will integrate with CCTV-based computer vision to automatically detect ball potting events and update scores in real time. The product aims to improve accuracy, convenience, and game analytics for snooker players at all levels.

---

## 3. Business Objectives

| # | Objective | Description |
|---|-----------|-------------|
| 1 | Digital Scoreboard | Provide a simple, clear digital scoreboard to replace pen-and-paper scoring |
| 2 | Flexible Gameplay | Support multiple gameplay configurations including individual (2-player) and team (4-player) play |
| 3 | Reduce Errors | Minimize manual score calculation errors through automated scoring logic |
| 4 | Automated Scoring | Enable future camera-based automatic scoring (Phase 2) |
| 5 | Game History | Provide match history and basic statistics for players |
| 6 | Scalability | Create a platform that can support snooker clubs and tournaments in the future |

---

## 4. Scope

### 4.1 In Scope

| Category | Items |
|----------|-------|
| **Game Management** | Create new game, add players, configure teams, select first player to break |
| **Scoring** | Select ball potted, update score automatically, track remaining balls |
| **Turn Management** | Change player turns, handle missed shots, track break score |
| **Foul Handling** | Record fouls with ball-on and ball-involved, calculate penalty points per official rules |
| **Display** | Scoreboard with player names, team scores, current player, reds remaining, current break, last scoring event |
| **Controls** | Ball input buttons, foul button, change turn, undo last action, reset game |
| **Data** | Save player profiles, store match results, store scoring events |
| **Future** | Camera-based ball detection, automatic scoring updates |

### 4.2 Out of Scope (Initial Release)

| Item | Reason |
|------|--------|
| Advanced referee foul detection | Complex rule set; manual foul entry sufficient for MVP |
| Multiple table tracking | Single-table focus for initial release |
| Live streaming integration | Future enhancement |
| Mobile push notifications | Future enhancement |
| Tournament bracket management | Future enhancement |

---

## 5. Stakeholders

| Role | Responsibility |
|------|----------------|
| **Project Owner** | Defines project vision, approves scope and priorities |
| **Business Analyst** | Defines and documents requirements |
| **Developers** | Build and maintain the system |
| **Snooker Players** | End users (casual and competitive) |
| **Snooker Clubs** | Potential customers; need automation and multi-table tracking |

---

## 6. User Personas

| Persona | Description | Primary Needs |
|---------|-------------|---------------|
| **Casual Players** | Play occasionally for fun | Simple scoreboard instead of pen and paper |
| **Competitive Players** | Play regularly, track performance | Accurate scoring, match history |
| **Snooker Clubs** | Manage multiple tables | Automation, match tracking across tables |
| **Score Operator** | Person entering scores (may not be a player) | Easy-to-use interface, one-tap scoring |

---

## 7. Business Rules

### 7.1 Ball Values

| Ball | Points |
|------|--------|
| Red | 1 |
| Yellow | 2 |
| Green | 3 |
| Brown | 4 |
| Blue | 5 |
| Pink | 6 |
| Black | 7 |

### 7.2 Game Configuration

- Minimum players: 2  
- Maximum players: 4  
- Team mode: Required when 4 players; each team has 2 players  
- Player names: 1–30 characters, must be unique within a game  

### 7.3 Foul Scoring (CR-001)

- Foul points = max(4, value of ball on, value of ball involved)  
- Maximum foul: 7 points  
- Minimum foul: 4 points  
- Cue ball potted: Treated as foul value of 4  
- Opponent receives penalty points; break resets; turn switches  

### 7.4 Wrong Pot

- If a player pots the wrong ball (not the ball on), the system registers a foul with the potted ball as ball involved  

---

## 8. Success Criteria

| # | Criterion | Measurement |
|---|-----------|-------------|
| 1 | Digital match setup | Users can set up and track a snooker match digitally |
| 2 | Accurate scoring | Scores update correctly in real time |
| 3 | Team play | System supports 2-player and 4-player team modes |
| 4 | Foul handling | Fouls are scored per official snooker rules |
| 5 | Future automation | Architecture supports camera integration |

---

## 9. High-Level System Architecture

```
┌─────────────────────────────────────┐
│     User Interface (Scoreboard App)  │
│     React + TypeScript               │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│     Backend API (FastAPI)            │
│     REST endpoints                  │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│     Game Logic Engine                │
│     Scoring, turn management, fouls │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│     Database (PostgreSQL / SQLite)   │
│     Game state, events, history      │
└─────────────────────────────────────┘

Future Addition:
┌─────────────────┐     ┌──────────────────────┐
│ Camera System   │────▶│ Computer Vision Engine│
└─────────────────┘     └──────────┬────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │ Scoring API           │
                        └──────────────────────┘
```

---

## 10. Project Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Requirements & Planning | Complete |
| 2 | Scoring Engine Development | Complete |
| 3 | Manual Scoreboard Interface | Complete |
| 4 | Backend API | Complete |
| 5 | Data Storage | Complete |
| 6 | Computer Vision Prototype | Future |
| 7 | Vision Integration | Future |
| 8 | Final System Enhancements | Future |

---

## 11. Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Lighting variability | May affect ball detection accuracy | Test under various conditions; manual override available |
| Ball overlap | Could cause detection errors | Manual correction; improve CV algorithms |
| Motion blur | Fast shots may reduce detection accuracy | Manual entry fallback |
| Incorrect manual input | Score errors | Undo functionality; validation |

---

## 12. Assumptions and Dependencies

### Assumptions

- Users have basic familiarity with snooker rules  
- Score operator is present during the match  
- Single table per game instance  
- Web-based interface is acceptable (desktop/tablet)  

### Dependencies

- Node.js 18+ and Python 3.10+ for development  
- PostgreSQL or SQLite for data persistence  
- Future: CCTV camera and computer vision infrastructure  

---

## 13. Glossary

| Term | Definition |
|------|------------|
| **Ball on** | The ball that must be struck first in the current turn |
| **Break** | Consecutive points scored by a player in one visit |
| **Cue ball** | The white ball used to strike object balls |
| **Foul** | Rule violation; opponent receives penalty points |
| **Pot** | To pocket a ball legally |
| **Reds remaining** | Number of red balls still on the table |

---

## 14. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Owner | | | |
| Business Analyst | | | |
| Technical Lead | | | |
