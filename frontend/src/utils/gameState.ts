/**
 * Game state initialization
 * User Story 1.1 - Create New Game
 */

import type { GameState, Player, Team } from '../types/game'

function generateId(): string {
  return crypto.randomUUID()
}

export function createInitialGameState(
  playerNames: string[],
  teamAssignments?: number[], // [0, 0, 1, 1] = players 0,1 in team 0, players 2,3 in team 1
  firstPlayerIndex = 0
): GameState {
  const now = new Date().toISOString()
  const team1Id = generateId()
  const team2Id = generateId()

  const players: Player[] = playerNames.map((name, i) => ({
    id: generateId(),
    name: name.trim(),
    score: 0,
    teamId: teamAssignments !== undefined ? (teamAssignments[i] === 0 ? team1Id : team2Id) : undefined,
  }))

  let teams: Team[] | undefined
  if (players.length === 4 && teamAssignments) {
    teams = [
      {
        id: team1Id,
        name: 'Team 1',
        playerIds: players.filter((p) => p.teamId === team1Id).map((p) => p.id),
        score: 0,
      },
      {
        id: team2Id,
        name: 'Team 2',
        playerIds: players.filter((p) => p.teamId === team2Id).map((p) => p.id),
        score: 0,
      },
    ]
  }

  return {
    id: generateId(),
    mode: players.length === 4 ? 'doubles' : 'singles',
    players,
    teams,
    currentPlayerIndex: firstPlayerIndex,
    redsRemaining: 15,
    currentBreak: 0,
    ballOn: 'red' as const,
    events: [],
    status: 'active',
    createdAt: now,
  }
}
