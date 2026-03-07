/**
 * Game actions - pot, foul, change turn, undo
 * User Stories: 3.1, 3.2, 4.1, 4.2, 4.3, 6.1 | CR-001
 */

import type { BallOnType, BallType, FoulBallType, GameState, GameEvent } from '../types/game'
import { getBallValue, canPotBall, calculateFoulPoints, getBallOn } from '../services/scoringEngine'

function generateId(): string {
  return crypto.randomUUID()
}

function cloneGame(game: GameState): GameState {
  return JSON.parse(JSON.stringify(game))
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

/** Update ball_on after a pot (CR-001) */
function getNextBallOn(ball: BallType, redsRemaining: number): BallOnType {
  if (ball === 'red') return 'colour'
  if (redsRemaining > 0) return 'red'
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

  player.score += points
  next.currentBreak += points

  if (ball === 'red') {
    next.redsRemaining = Math.max(0, next.redsRemaining - 1)
  }
  next.lastPottedColor = ball
  next.ballOn = getNextBallOn(ball, next.redsRemaining)

  const event: GameEvent = {
    id: generateId(),
    type: 'pot',
    playerId: player.id,
    ball,
    points,
    timestamp: new Date().toISOString(),
    description: `${player.name} potted ${ball} (+${points})`,
  }
  next.events = [...next.events, event]

  return { success: true, game: updateTeamScores(next) }
}

/** Record foul with ball_on and ball_involved (CR-001) */
export function recordFoul(game: GameState, ballInvolved: FoulBallType): GameState {
  const next = cloneGame(game)
  const currentPlayerIndex = next.currentPlayerIndex
  const currentPlayer = next.players[currentPlayerIndex]

  const ballOn = next.ballOn ?? getBallOn(next.redsRemaining, next.lastPottedColor)
  const foulPoints = calculateFoulPoints(ballOn, ballInvolved)

  let opponentIndex: number
  let opponentName: string

  if (game.teams && game.teams.length >= 2) {
    const currentTeamId = currentPlayer.teamId
    const opposingTeam = game.teams.find((t) => t.id !== currentTeamId)
    const opponentPlayerId = opposingTeam?.playerIds[0]
    opponentIndex = next.players.findIndex((p) => p.id === opponentPlayerId) ?? 0
    opponentName = next.players[opponentIndex]?.name ?? 'Opponent'
  } else {
    opponentIndex = (currentPlayerIndex + 1) % next.players.length
    opponentName = next.players[opponentIndex].name
  }

  const opponent = next.players[opponentIndex]
  opponent.score += foulPoints
  next.currentBreak = 0
  next.currentPlayerIndex = opponentIndex
  next.lastPottedColor = undefined
  next.ballOn = getBallOn(next.redsRemaining, undefined)

  const ballOnLabel = ballOn === 'colour' ? 'COLOUR' : ballOn.toUpperCase()
  const ballInvolvedLabel = ballInvolved === 'cue_ball' ? 'CUE BALL' : ballInvolved.toUpperCase()

  const event: GameEvent = {
    id: generateId(),
    type: 'foul',
    playerId: currentPlayer.id,
    points: foulPoints,
    timestamp: new Date().toISOString(),
    description: `${currentPlayer.name} committed FOUL\nBall on: ${ballOnLabel}\nBall involved: ${ballInvolvedLabel}\n+${foulPoints} points to ${opponentName}`,
    ballOn,
    ballInvolved,
  }
  next.events = [...next.events, event]

  return updateTeamScores(next)
}

export function changeTurn(game: GameState): GameState {
  const next = cloneGame(game)
  next.currentPlayerIndex = (next.currentPlayerIndex + 1) % next.players.length
  next.currentBreak = 0
  next.lastPottedColor = undefined
  next.ballOn = getBallOn(next.redsRemaining, undefined)
  return next
}
