/**
 * Shared types for the Smart Snooker Scoring System
 */

export type BallType = 'red' | 'yellow' | 'green' | 'brown' | 'blue' | 'pink' | 'black'

/** Ball involved in foul - includes cue ball (potted white) */
export type FoulBallType = BallType | 'cue_ball'

/** Ball on = ball that must be struck first (CR-001) */
export type BallOnType = 'red' | 'colour' | BallType

export const BALL_VALUES: Record<BallType, number> = {
  red: 1,
  yellow: 2,
  green: 3,
  brown: 4,
  blue: 5,
  pink: 6,
  black: 7,
}

/** Color sequence when reds are gone (FRD 3.3) */
export const FINAL_COLOR_SEQUENCE: BallType[] = [
  'yellow',
  'green',
  'brown',
  'blue',
  'pink',
  'black',
]

/** Score keeper chosen at setup */
export type GameVariant = 'snooker' | 'doubles' | 'trace' | 'rd'

/** RD settings agreed before the game */
export interface RdSettings {
  /** Points needed to win */
  target: number
  /** Points for potting the red, also lost for missing it */
  redValue: number
  /** Efficiency barrier: red attempts and red pots needed before a player can win */
  minAttempts: number
  minPots: number
}

export interface Player {
  id: string
  name: string
  score: number
  teamId?: string
  /** Trace: safe and sitting out, with the place they finished in */
  sitting?: boolean
  finishPosition?: number
  /** RD efficiency barrier counters */
  redAttempts?: number
  redPots?: number
}

export interface Team {
  id: string
  name: string
  playerIds: string[]
  score: number
}

export type GameEventType = 'pot' | 'foul' | 'frame'

export interface GameEvent {
  id: string
  type: GameEventType
  playerId: string
  ball?: BallType
  points: number
  timestamp: string
  description?: string
  /** Foul metadata (CR-001) */
  ballOn?: BallOnType
  ballInvolved?: FoulBallType
  /** Foul points were taken off the fouler instead of given to an opponent */
  deducted?: boolean
}

/** Where play returns to if the next player makes the fouler play again */
export interface PendingReplay {
  playerIndex: number
  teamTurn?: Record<string, number>
}

export interface GameState {
  id: string
  variant: GameVariant
  mode: 'singles' | 'doubles'
  players: Player[]
  teams?: Team[]
  currentPlayerIndex: number
  redsRemaining: number
  currentBreak: number
  lastPottedColor?: BallType
  /** Ball that must be struck first (CR-001) */
  ballOn?: BallOnType
  events: GameEvent[]
  status: 'setup' | 'active' | 'finished'
  /** Next member to play for each team, as an index into the team's playerIds */
  teamTurn?: Record<string, number>
  /** Set after a foul until the next player plays or puts the fouler back in */
  pendingReplay?: PendingReplay
  /** Trace: current frame number */
  frame?: number
  rd?: RdSettings
  winnerId?: string
  createdAt: string
}
