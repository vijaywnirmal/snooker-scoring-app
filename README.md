# Smart Snooker Scoring System

Digital snooker scoring application with manual scoring (Phase 1) and future camera-based automation.

## Tech Stack

- **App:** React + TypeScript + Vite
- **Scoring:** runs entirely in the browser – no backend, no database
- **State:** current game is saved in the browser's `localStorage`

Each device keeps its own game, so any number of tables can score at the same time without affecting each other. A game is only visible on the device that started it.

## Score Keepers

The setup screen offers a catalogue of games (`frontend/src/variants.ts`):

| Game | Players | Rules |
|------|---------|-------|
| **Snooker** | 2 | Classic frame. |
| **Doubles** | 2–6 | Individuals, or any number of teams. Teams take turns at the table and players rotate within their team. |
| **Trace** | 3–6 | After each frame the highest scorer is safe and sits out; the rest play another frame with scores carried over. The player left after the final two-player frame loses. |
| **RD** | 2–6 | One red worth an agreed value (typically 10 or 15), colours at face value, potted in any order. First to the agreed target wins, but only once they have made the agreed minimum red attempts and red pots. |

Foul rules:

- **Play again:** in Snooker, Doubles and Trace, after a foul the next player can take the table or make the fouler play again.
- **Two sides** (2 players, or 2 teams): foul points go to the opponent.
- **Three or more sides:** foul points are taken off the fouler's score and nobody gains.
- **RD:** points always come off the fouler – the red's value for a missed red or a foul on the red, otherwise the standard foul value (4 to 7). Every foul counts as a red attempt.

## Project Structure

```
snooker-scoring-app/
├── frontend/          # React app
│   └── src/
│       ├── components/  # Game setup, scoreboard
│       ├── services/    # Scoring rules, localStorage persistence
│       ├── utils/       # Game actions (pot, foul, change turn), initial state
│       └── types/       # Game state types
└── docs/              # BRD, FRD, User Stories
```

The documents in `docs/` describe the browser-only design. They cover classic snooker scoring; the Doubles, Trace and RD games are described in the Score Keepers section above.

## Quick Start

### Prerequisites

- Node.js 18+

### Run

```bash
cd frontend
npm install
npm run dev
```

Runs at http://localhost:5173

### Test

```bash
cd frontend
npm run test:run
```

## Deployment

Static site on Vercel with `frontend` as the root directory. No environment variables are needed.

## Development Phases

1. **Foundation** – Types, scoring engine ✅
2. **Game Setup UI** – Player config, teams ✅
3. **Scoreboard UI** – Display, ball buttons, controls ✅
4. **Camera-based automation** – future

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
