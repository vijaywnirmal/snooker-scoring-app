/**
 * Game state initialization
 * User Story 1.1 - Create New Game
 */

import type { GameState, GameVariant, Player, RdSettings, Team } from '../types/game'

function generateId(): string {
  return crypto.randomUUID()
}

export const DEFAULT_RD_SETTINGS: RdSettings = {
  target: 100,
  redValue: 10,
  minAttempts: 5,
  minPots: 3,
}

export interface GameOptions {
  variant?: GameVariant
  rd?: RdSettings
}

export function createInitialGameState(
  playerNames: string[],
  teamAssignments?: number[], // team number per player, e.g. [0, 0, 1, 1] or [0, 1, 2, 0, 1, 2]
  firstPlayerIndex = 0,
  options: GameOptions = {}
): GameState {
  const now = new Date().toISOString()
  const variant = options.variant ?? (teamAssignments ? 'doubles' : 'snooker')

  const teamNumbers = teamAssignments ? [...new Set(teamAssignments)].sort((a, b) => a - b) : []
  const teamIds = new Map(teamNumbers.map((n) => [n, generateId()]))

  const players: Player[] = playerNames.map((name, i) => ({
    id: generateId(),
    name: name.trim(),
    score: 0,
    teamId: teamAssignments ? teamIds.get(teamAssignments[i]) : undefined,
    ...(variant === 'rd' ? { redAttempts: 0, redPots: 0 } : {}),
  }))

  let teams: Team[] | undefined
  if (teamNumbers.length >= 2) {
    teams = teamNumbers.map((n, i) => ({
      id: teamIds.get(n)!,
      name: `Team ${i + 1}`,
      playerIds: players.filter((p) => p.teamId === teamIds.get(n)).map((p) => p.id),
      score: 0,
    }))
  }

  return {
    id: generateId(),
    variant,
    mode: teams ? 'doubles' : 'singles',
    players,
    teams,
    currentPlayerIndex: firstPlayerIndex,
    redsRemaining: variant === 'rd' ? 1 : 15,
    currentBreak: 0,
    ballOn: variant === 'rd' ? undefined : 'red',
    events: [],
    status: 'active',
    createdAt: now,
    frame: variant === 'trace' ? 1 : undefined,
    rd: variant === 'rd' ? (options.rd ?? DEFAULT_RD_SETTINGS) : undefined,
  }
}
