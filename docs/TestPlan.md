# Test Plan

**Project:** Smart Snooker Scoring System  
**Document Version:** 1.0  
**Last Updated:** March 2025  
**Related Documents:** BRD.md, FRD.md, SRS.md, UserStories.md, TestCaseScenarios.md, TestReportSummary.md

---

## 1. Document Purpose

This document defines the test strategy, scope, approach, and schedule for the Smart Snooker Scoring System. It provides the high-level plan that guides test execution.

---

## 2. Test Objectives

| Objective | Description |
|-----------|-------------|
| Functional correctness | Verify all features work per FRD and User Stories |
| Scoring accuracy | Validate ball values, foul calculation, ball-on logic (CR-001) |
| User workflows | Ensure setup, scoring, foul, turn, undo, reset flows work end-to-end |
| Data integrity | Confirm game state survives a page reload and undo restores correctly |

---

## 3. Scope

### 3.1 In Scope

| Area | Description |
|------|-------------|
| Game Setup | 2/4 player creation, names, teams, first to break |
| Scoreboard | Display of scores, ball on, reds, break, events |
| Scoring | Valid pots, wrong pot = foul, event history |
| Foul Handling | Foul modal, ball involved, penalty calculation |
| Turn Management | Change turn, break tracking |
| Undo & Reset | Undo last action, reset game |
| Persistence | Game saved to and restored from browser localStorage (covered by automated tests) |
| Scoring Engine | Ball-on, foul formula (covered by automated tests) |

### 3.2 Out of Scope

| Area | Reason |
|------|--------|
| Vision integration | Future phase |
| Performance/load | Not required for MVP |
| Security/penetration | Single-user local use |
| Mobile responsiveness | Desktop/tablet focus |

---

## 4. Test Types

| Type | Tool/Method | Coverage |
|------|-------------|----------|
| **Unit tests** | Vitest | Scoring engine, ball values, foul calculation, game actions |
| **Component tests** | Vitest + React Testing Library | GameSetup, Scoreboard |
| **App flow tests** | Vitest + React Testing Library | Start, pot, foul, undo, reset, restore after reload |
| **Manual functional tests** | TestCaseScenarios.md | End-to-end user flows |
| **Smoke tests** | Manual | Critical path verification |

---

## 5. Test Environment

| Item | Requirement |
|------|-------------|
| App | Vite dev server on port 5173 |
| Storage | Browser localStorage |
| Browsers | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| OS | Windows, macOS, Linux |

**Start command:** `cd frontend && npm run dev`

---

## 6. Entry and Exit Criteria

### Entry Criteria

- [ ] Build succeeds (`npm run build`)
- [ ] Automated tests pass (`npm run test:run`)
- [ ] Test environment available

### Exit Criteria

- [ ] All planned test cases executed
- [ ] Critical and high defects resolved
- [ ] Test Report Summary completed and signed off

---

## 7. Test Deliverables

All test deliverables are in the `docs/` folder:

| Deliverable | File | Description |
|-------------|------|-------------|
| Test Plan | TestPlan.md | This document – strategy, scope, approach |
| Test Case Scenarios | TestCaseScenarios.md | Detailed scenarios with preconditions, steps, priority |
| Manual Test Plan | ManualTestPlan.md | Checklist format for test execution |
| Test Report Summary | TestReportSummary.md | Execution results, defect summary, sign-off |

---

## 8. Schedule (Example)

| Phase | Activity | Duration |
|-------|----------|----------|
| 1 | Automated test execution | 1 day |
| 2 | Manual functional testing | 2 days |
| 3 | Defect logging and retest | 1–2 days |
| 4 | Test report and sign-off | 0.5 day |

---

## 9. Roles and Responsibilities

| Role | Responsibility |
|------|----------------|
| Developer | Run automated tests; fix defects |
| Tester | Execute manual test cases; log defects |
| QA Lead | Review results; approve Test Report Summary |
