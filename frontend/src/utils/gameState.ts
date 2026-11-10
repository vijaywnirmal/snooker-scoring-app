/**
 * Game state initialization
 * User Story 1.1 - Create New Game
 */

import type { GameState, GameVariant, Player, RdSettings, ShuffleSettings, Team } from '../types/game'

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
  shuffle?: ShuffleSettings
}

/** Reds on the table in a full rack */
export const FULL_RACK = 15

/**
 * Shuffle: 12 reds shared equally (6 each for 2, 4 for 3, 3 for 4), leaving 3 or more on the table.
 * With more players each still gets at least one red.
 */
export function defaultRedsPerPlayer(numPlayers: number): number {
  return Math.max(1, Math.floor(12 / numPlayers))
}

/** Most reds each player can be asked to pot from one rack */
export function maxRedsPerPlayer(numPlayers: number): number {
  return Math.max(1, Math.floor(FULL_RACK / numPlayers))
}

/** Random order (Fisher–Yates): every arrangement is equally likely */
export function shuffled<T>(items: T[], random: () => number = Math.random): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
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
    ...(variant === 'shuffle' ? { redPots: 0 } : {}),
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
    ballOn: variant === 'rd' || variant === 'shuffle' ? undefined : 'red',
    events: [],
    status: 'active',
    createdAt: now,
    frame: variant === 'trace' || variant === 'shuffle' ? 1 : undefined,
    rd: variant === 'rd' ? (options.rd ?? DEFAULT_RD_SETTINGS) : undefined,
    shuffle:
      variant === 'shuffle'
        ? (options.shuffle ?? { redsPerPlayer: defaultRedsPerPlayer(players.length) })
        : undefined,
    frameBreakerIndex: variant === 'shuffle' ? firstPlayerIndex : undefined,
  }
}
