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

export interface Player {
  id: string
  name: string
  score: number
  teamId?: string
}

export interface Team {
  id: string
  name: string
  playerIds: string[]
  score: number
}

export type GameEventType = 'pot' | 'foul'

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
}

export interface GameState {
  id: string
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
  createdAt: string
}
