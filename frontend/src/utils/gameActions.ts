/**
 * Game actions - pot, foul, change turn, plus variant rules (replay after foul, Trace frames, RD)
 * User Stories: 3.1, 3.2, 4.1, 4.2, 4.3, 6.1 | CR-001
 */

import type { BallOnType, BallType, FoulBallType, GameState, GameEvent, Player } from '../types/game'
import { getBallValue, canPotBall, calculateFoulPoints, getBallOn, getFoulBallValue } from '../services/scoringEngine'

function generateId(): string {
  return crypto.randomUUID()
}

function cloneGame(game: GameState): GameState {
  return JSON.parse(JSON.stringify(game))
}

function hasTeams(game: GameState): boolean {
  return (game.teams?.length ?? 0) >= 2
}

function updateTeamScores(game: GameState): GameState {
  if (!game.teams) return game
  const next = cloneGame(game)
  for (const team of next.teams!) {
    team.score = next.players
      .filter((p) => p.teamId === team.id)
      .reduce((sum, p) => sum + p.score, 0)
  }
  return next
}

function addEvent(game: GameState, event: Omit<GameEvent, 'id' | 'timestamp'>): void {
  game.events = [...game.events, { ...event, id: generateId(), timestamp: new Date().toISOString() }]
}

/** Players still at the table (Trace sits players out) */
export function activePlayers(game: GameState): Player[] {
  return game.players.filter((p) => !p.sitting)
}

/** Number of opposing sides: teams, or players still at the table */
export function sideCount(game: GameState): number {
  return hasTeams(game) ? game.teams!.length : activePlayers(game).length
}

/**
 * With exactly two sides a foul gives points to the opponent.
 * With three or more, and always in RD, they come off the fouler's score.
 */
export function foulsAreDeducted(game: GameState): boolean {
  return game.variant === 'rd' || sideCount(game) !== 2
}

/** Who plays after the current player: teams take turns, members rotate within their team */
function nextTurn(game: GameState): { playerIndex: number; teamTurn?: Record<string, number> } {
  const current = game.players[game.currentPlayerIndex]
  const teamIndex = hasTeams(game) ? game.teams!.findIndex((t) => t.id === current.teamId) : -1

  if (teamIndex >= 0) {
    const teams = game.teams!
    const team = teams[teamIndex]
    const teamTurn = { ...(game.teamTurn ?? {}) }
    teamTurn[team.id] = (team.playerIds.indexOf(current.id) + 1) % team.playerIds.length

    const nextTeam = teams[(teamIndex + 1) % teams.length]
    const nextPlayerId = nextTeam.playerIds[teamTurn[nextTeam.id] ?? 0]
    const playerIndex = game.players.findIndex((p) => p.id === nextPlayerId)
    if (playerIndex >= 0) return { playerIndex, teamTurn }
  }

  const count = game.players.length
  for (let step = 1; step <= count; step++) {
    const playerIndex = (game.currentPlayerIndex + step) % count
    if (!game.players[playerIndex].sitting) return { playerIndex }
  }
  return { playerIndex: game.currentPlayerIndex }
}

/** Hand the table to the next player (mutates the clone it is given) */
function passTurn(next: GameState): void {
  const turn = nextTurn(next)
  next.currentPlayerIndex = turn.playerIndex
  if (turn.teamTurn) next.teamTurn = turn.teamTurn
  next.currentBreak = 0
  next.lastPottedColor = undefined
  next.ballOn = next.variant === 'rd' ? undefined : getBallOn(next.redsRemaining, undefined)
}

/** Update ball_on after a pot (CR-001) */
function getNextBallOn(ball: BallType, redsRemaining: number, freeColour: boolean): BallOnType {
  if (ball === 'red') return 'colour'
  if (redsRemaining > 0) return 'red'
  if (freeColour) return 'yellow'
  const seq = ['yellow', 'green', 'brown', 'blue', 'pink', 'black'] as const
  const idx = seq.indexOf(ball)
  if (idx < 0 || idx >= seq.length - 1) return 'black'
  return seq[idx + 1]
}

export function potBall(game: GameState, ball: BallType): { success: boolean; game?: GameState; error?: string } {
  const validation = canPotBall(ball, game.redsRemaining, game.lastPottedColor)
  if (!validation.valid) {
    return { success: false, error: validation.reason }
  }

  const next = cloneGame(game)
  const points = getBallValue(ball)
  const player = next.players[next.currentPlayerIndex]
  // Colour taken with the last red: it is respotted and the sequence starts at yellow
  const freeColour = ball !== 'red' && game.redsRemaining === 0 && game.lastPottedColor === 'red'

  player.score += points
  next.currentBreak += points

  if (ball === 'red') {
    next.redsRemaining = Math.max(0, next.redsRemaining - 1)
  }
  next.lastPottedColor = freeColour ? undefined : ball
  next.ballOn = getNextBallOn(ball, next.redsRemaining, freeColour)
  delete next.pendingReplay

  addEvent(next, {
    type: 'pot',
    playerId: player.id,
    ball,
    points,
    description: `${player.name} potted ${ball} (+${points})`,
  })

  return { success: true, game: updateTeamScores(next) }
}

/** Record foul with ball_on and ball_involved (CR-001) */
export function recordFoul(game: GameState, ballInvolved: FoulBallType): GameState {
  if (game.variant === 'rd') return rdFoul(game, ballInvolved)

  const next = cloneGame(game)
  const foulerIndex = next.currentPlayerIndex
  const fouler = next.players[foulerIndex]

  const ballOn = next.ballOn ?? getBallOn(next.redsRemaining, next.lastPottedColor)
  const foulPoints = calculateFoulPoints(ballOn, ballInvolved)
  const deducted = foulsAreDeducted(game)

  // The next player may put the fouler back in, so remember where play came from
  next.pendingReplay = { playerIndex: foulerIndex, teamTurn: game.teamTurn }
  passTurn(next)

  const opponent = next.players[next.currentPlayerIndex]
  if (deducted) {
    fouler.score -= foulPoints
  } else {
    opponent.score += foulPoints
  }

  const ballOnLabel = ballOn === 'colour' ? 'COLOUR' : ballOn.toUpperCase()
  const ballInvolvedLabel = ballInvolved === 'cue_ball' ? 'CUE BALL' : ballInvolved.toUpperCase()
  const pointsLabel = deducted ? `-${foulPoints} from ${fouler.name}` : `+${foulPoints} to ${opponent.name}`

  addEvent(next, {
    type: 'foul',
    playerId: fouler.id,
    points: foulPoints,
    description: `${fouler.name} committed FOUL | Ball on: ${ballOnLabel} | Ball involved: ${ballInvolvedLabel} | ${pointsLabel}`,
    ballOn,
    ballInvolved,
    deducted,
  })

  return updateTeamScores(next)
}

/** After a foul, the next player declines the table and the fouler plays again */
export function replayFoul(game: GameState): GameState {
  if (!game.pendingReplay) return game
  const next = cloneGame(game)
  next.currentPlayerIndex = game.pendingReplay.playerIndex
  if (game.pendingReplay.teamTurn) {
    next.teamTurn = game.pendingReplay.teamTurn
  } else {
    delete next.teamTurn
  }
  delete next.pendingReplay
  return next
}

/** Pot a ball; a pot that isn't allowed counts as a foul on that ball (CR-001) */
export function registerPot(game: GameState, ball: BallType): GameState {
  if (game.variant === 'rd') return rdPot(game, ball)
  const result = potBall(game, ball)
  return result.success && result.game ? result.game : recordFoul(game, ball)
}

export function changeTurn(game: GameState): GameState {
  const next = cloneGame(game)
  passTurn(next)
  delete next.pendingReplay
  return next
}

// --- Trace: highest scorer sits out after each frame ---

/** Players at the table with the highest score; more than one means a tie to settle by hand */
export function frameLeaders(game: GameState): Player[] {
  const active = activePlayers(game)
  const top = Math.max(...active.map((p) => p.score))
  return active.filter((p) => p.score === top)
}

/** End the frame: the leader is safe and sits out, the rest start a new frame with scores carried over */
export function endFrame(game: GameState, sitterId?: string): GameState {
  const leaders = frameLeaders(game)
  const chosen = leaders.find((p) => p.id === sitterId) ?? (leaders.length === 1 ? leaders[0] : undefined)
  if (!chosen) return game

  const next = cloneGame(game)
  const sitter = next.players.find((p) => p.id === chosen.id)!
  sitter.sitting = true
  sitter.finishPosition = next.players.filter((p) => p.sitting).length

  addEvent(next, {
    type: 'frame',
    playerId: sitter.id,
    points: 0,
    description: `Frame ${next.frame ?? 1}: ${sitter.name} sits out on ${sitter.score}`,
  })
  delete next.pendingReplay
  next.currentBreak = 0

  const remaining = activePlayers(next)
  if (remaining.length <= 1) {
    if (remaining[0]) remaining[0].finishPosition = next.players.length
    next.status = 'finished'
    next.winnerId = next.players.find((p) => p.finishPosition === 1)?.id
    return next
  }

  next.frame = (next.frame ?? 1) + 1
  next.redsRemaining = 15
  next.lastPottedColor = undefined
  next.ballOn = 'red'
  next.currentPlayerIndex = next.players.findIndex((p) => !p.sitting)
  return next
}

// --- RD: one high-value red, race to a target, efficiency barrier ---

/** Whether a player has made the agreed red attempts and pots */
export function rdBarrierMet(game: GameState, player: Player): boolean {
  if (!game.rd) return true
  return (player.redAttempts ?? 0) >= game.rd.minAttempts && (player.redPots ?? 0) >= game.rd.minPots
}

/** Balls may be potted in any order; the win needs the target and the efficiency barrier */
function rdPot(game: GameState, ball: BallType): GameState {
  const rd = game.rd!
  const next = cloneGame(game)
  const player = next.players[next.currentPlayerIndex]
  const points = ball === 'red' ? rd.redValue : getBallValue(ball)

  player.score += points
  next.currentBreak += points
  if (ball === 'red') {
    player.redAttempts = (player.redAttempts ?? 0) + 1
    player.redPots = (player.redPots ?? 0) + 1
  }

  addEvent(next, {
    type: 'pot',
    playerId: player.id,
    ball,
    points,
    description: `${player.name} potted ${ball} (+${points})`,
  })

  if (player.score >= rd.target && rdBarrierMet(next, player)) {
    next.status = 'finished'
    next.winnerId = player.id
  }
  return next
}

function rdPenalty(game: GameState, points: number, description: (name: string) => string): GameState {
  const next = cloneGame(game)
  const player = next.players[next.currentPlayerIndex]
  player.score -= points
  // Every foul counts as a missed red attempt
  player.redAttempts = (player.redAttempts ?? 0) + 1

  addEvent(next, {
    type: 'foul',
    playerId: player.id,
    points,
    description: description(player.name),
    deducted: true,
  })
  passTurn(next)
  return next
}

/** RD: missing the red is a foul costing the red's value */
export function missRed(game: GameState): GameState {
  if (!game.rd) return game
  const points = game.rd.redValue
  return rdPenalty(game, points, (name) => `${name} missed the red (-${points})`)
}

function rdFoul(game: GameState, ballInvolved: FoulBallType): GameState {
  // A foul on the red costs what the red is worth; other balls cost the standard foul value
  const points = ballInvolved === 'red' && game.rd ? game.rd.redValue : Math.max(4, getFoulBallValue(ballInvolved))
  const label = ballInvolved === 'cue_ball' ? 'cue ball' : ballInvolved
  return rdPenalty(game, points, (name) => `${name} committed FOUL on ${label} (-${points})`)
}
