/**
 * Scoring engine and game action tests
 * User Stories: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3 | CR-001
 */

import { describe, it, expect } from 'vitest'
import type { GameState } from '../types/game'
import {
  calculateFoulPoints,
  canPotBall,
  getBallOn,
  getBallOnValue,
  getFoulBallValue,
} from '../services/scoringEngine'
import {
  canQuit,
  canSitOut,
  changeTurn,
  frameLeaders,
  missRed,
  newFrame,
  potBall,
  quitGame,
  recordFoul,
  registerPot,
  replayFoul,
  sitOut,
} from './gameActions'
import { createInitialGameState } from './gameState'

function twoPlayerState(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialGameState(['Alice', 'Bob']), ...overrides }
}

describe('foul values', () => {
  it('cue ball counts as 4', () => {
    expect(getFoulBallValue('cue_ball')).toBe(4)
    expect(getFoulBallValue('black')).toBe(7)
  })

  it('ball on values', () => {
    expect(getBallOnValue('red')).toBe(1)
    expect(getBallOnValue('colour')).toBe(4)
    expect(getBallOnValue('pink')).toBe(6)
  })

  it('foul points are the highest of ball on and ball involved, between 4 and 7', () => {
    expect(calculateFoulPoints('red', 'blue')).toBe(5)
    expect(calculateFoulPoints('red', 'black')).toBe(7)
    expect(calculateFoulPoints('black', 'red')).toBe(7)
    expect(calculateFoulPoints('red', 'cue_ball')).toBe(4)
    expect(calculateFoulPoints('colour', 'cue_ball')).toBe(4)
    expect(calculateFoulPoints('red', 'red')).toBe(4)
  })
})

describe('getBallOn', () => {
  it('is red at the start and after a turn change while reds remain', () => {
    expect(getBallOn(15, undefined)).toBe('red')
  })

  it('is yellow first once reds are gone, then follows the sequence', () => {
    expect(getBallOn(0, undefined)).toBe('yellow')
    expect(getBallOn(0, 'red')).toBe('colour')
    expect(getBallOn(0, 'yellow')).toBe('green')
    expect(getBallOn(0, 'blue')).toBe('pink')
    expect(getBallOn(0, 'pink')).toBe('black')
    expect(getBallOn(0, 'black')).toBe('black')
  })
})

describe('canPotBall', () => {
  it('allows red while reds remain', () => {
    expect(canPotBall('red', 15, undefined).valid).toBe(true)
    expect(canPotBall('red', 0, undefined).valid).toBe(false)
  })

  it('allows a colour only straight after a red', () => {
    expect(canPotBall('black', 14, 'red').valid).toBe(true)
    expect(canPotBall('black', 14, 'blue').valid).toBe(false)
    expect(canPotBall('black', 15, undefined).valid).toBe(false)
  })

  it('enforces the final colour sequence', () => {
    expect(canPotBall('yellow', 0, undefined).valid).toBe(true)
    expect(canPotBall('green', 0, undefined).valid).toBe(false)
    expect(canPotBall('green', 0, 'yellow').valid).toBe(true)
    expect(canPotBall('brown', 0, 'green').valid).toBe(true)
  })
})

describe('potBall', () => {
  it('scores a red and puts a colour on', () => {
    const result = potBall(twoPlayerState(), 'red')
    expect(result.success).toBe(true)
    expect(result.game!.players[0].score).toBe(1)
    expect(result.game!.currentBreak).toBe(1)
    expect(result.game!.redsRemaining).toBe(14)
    expect(result.game!.ballOn).toBe('colour')
    expect(result.game!.events).toHaveLength(1)
  })

  it('scores red then colour and puts red back on', () => {
    const afterRed = potBall(twoPlayerState(), 'red').game!
    const afterBlack = potBall(afterRed, 'black').game!
    expect(afterBlack.players[0].score).toBe(8)
    expect(afterBlack.currentBreak).toBe(8)
    expect(afterBlack.ballOn).toBe('red')
  })

  it('rejects a red when none remain', () => {
    expect(potBall(twoPlayerState({ redsRemaining: 0 }), 'red').success).toBe(false)
  })

  it('does not mutate the game it was given', () => {
    const game = twoPlayerState()
    potBall(game, 'red')
    expect(game.players[0].score).toBe(0)
    expect(game.events).toHaveLength(0)
  })
})

describe('last red', () => {
  const lastRedPotted = () => potBall(twoPlayerState({ redsRemaining: 1 }), 'red').game!

  it('puts any colour on after the last red', () => {
    const game = lastRedPotted()
    expect(game.redsRemaining).toBe(0)
    expect(game.ballOn).toBe('colour')
    expect(canPotBall('black', 0, 'red').valid).toBe(true)
    expect(canPotBall('yellow', 0, 'red').valid).toBe(true)
  })

  it('scores the free colour and then starts the sequence at yellow', () => {
    const afterBlack = registerPot(lastRedPotted(), 'black')
    expect(afterBlack.players[0].score).toBe(8)
    expect(afterBlack.currentPlayerIndex).toBe(0)
    expect(afterBlack.ballOn).toBe('yellow')

    const afterYellow = registerPot(afterBlack, 'yellow')
    expect(afterYellow.players[0].score).toBe(10)
    expect(afterYellow.ballOn).toBe('green')
  })

  it('still needs yellow next when yellow was the free colour', () => {
    const afterFreeYellow = registerPot(lastRedPotted(), 'yellow')
    expect(afterFreeYellow.ballOn).toBe('yellow')

    const afterYellow = registerPot(afterFreeYellow, 'yellow')
    expect(afterYellow.players[0].score).toBe(5)
    expect(afterYellow.ballOn).toBe('green')
  })

  it('rejects an out-of-sequence colour once the free colour is taken', () => {
    const afterBlack = registerPot(lastRedPotted(), 'black')
    const next = registerPot(afterBlack, 'blue')
    expect(next.events[next.events.length - 1].type).toBe('foul')
    expect(next.players[1].score).toBe(5)
  })

  it('starts at yellow if the free colour is missed', () => {
    expect(changeTurn(lastRedPotted()).ballOn).toBe('yellow')
  })
})

describe('registerPot', () => {
  it('treats a pot that is not allowed as a foul on that ball', () => {
    const next = registerPot(twoPlayerState(), 'black')
    expect(next.players[0].score).toBe(0)
    expect(next.players[1].score).toBe(7)
    expect(next.currentPlayerIndex).toBe(1)
    expect(next.events[0].type).toBe('foul')
  })

  it('scores a pot that is allowed', () => {
    const next = registerPot(twoPlayerState(), 'red')
    expect(next.players[0].score).toBe(1)
    expect(next.currentPlayerIndex).toBe(0)
  })
})

describe('recordFoul', () => {
  it('gives the opponent the points and the turn', () => {
    const next = recordFoul(twoPlayerState(), 'cue_ball')
    expect(next.currentPlayerIndex).toBe(1)
    expect(next.players[1].score).toBe(4)
    expect(next.currentBreak).toBe(0)
    expect(next.ballOn).toBe('red')
  })

  it('records the foul event', () => {
    const next = recordFoul(twoPlayerState(), 'blue')
    const event = next.events[0]
    expect(event.type).toBe('foul')
    expect(event.points).toBe(5)
    expect(event.ballOn).toBe('red')
    expect(event.ballInvolved).toBe('blue')
    expect(event.description).toContain('Alice committed FOUL')
  })

  it('gives the points to the other team in doubles and updates team scores', () => {
    const game = createInitialGameState(['A', 'B', 'C', 'D'], [0, 0, 1, 1])
    const next = recordFoul(game, 'black')
    expect(next.currentPlayerIndex).toBe(2)
    expect(next.players[2].score).toBe(7)
    expect(next.teams![0].score).toBe(0)
    expect(next.teams![1].score).toBe(7)
  })
})

describe('replay after a foul', () => {
  it('lets the next player put the fouler back in, keeping the foul points', () => {
    const fouled = recordFoul(twoPlayerState(), 'cue_ball')
    expect(fouled.pendingReplay?.playerIndex).toBe(0)

    const replayed = replayFoul(fouled)
    expect(replayed.currentPlayerIndex).toBe(0)
    expect(replayed.players[1].score).toBe(4)
    expect(replayed.pendingReplay).toBeUndefined()
  })

  it('is no longer offered once the next player plays', () => {
    const fouled = recordFoul(twoPlayerState(), 'cue_ball')
    expect(registerPot(fouled, 'red').pendingReplay).toBeUndefined()
    expect(changeTurn(fouled).pendingReplay).toBeUndefined()
  })
})

describe('three or more players', () => {
  const threePlayers = () => createInitialGameState(['A', 'B', 'C'], undefined, 0, { variant: 'doubles' })

  it('takes foul points off the fouler and gives nobody any', () => {
    const next = recordFoul(threePlayers(), 'blue')
    expect(next.players.map((p) => p.score)).toEqual([-5, 0, 0])
    expect(next.currentPlayerIndex).toBe(1)
    expect(next.events[0].deducted).toBe(true)
  })

  it('rotates through every player', () => {
    let game = threePlayers()
    const order = [game.currentPlayerIndex]
    for (let i = 0; i < 3; i++) {
      game = changeTurn(game)
      order.push(game.currentPlayerIndex)
    }
    expect(order).toEqual([0, 1, 2, 0])
  })
})

describe('teams', () => {
  it('alternates teams and rotates players within each team', () => {
    let game = createInitialGameState(['A1', 'A2', 'B1', 'B2'], [0, 0, 1, 1])
    const order = [game.players[game.currentPlayerIndex].name]
    for (let i = 0; i < 4; i++) {
      game = changeTurn(game)
      order.push(game.players[game.currentPlayerIndex].name)
    }
    expect(order).toEqual(['A1', 'B1', 'A2', 'B2', 'A1'])
  })

  it('handles three teams and deducts fouls from the fouler', () => {
    let game = createInitialGameState(['A1', 'B1', 'C1', 'A2', 'B2', 'C2'], [0, 1, 2, 0, 1, 2])
    expect(game.teams).toHaveLength(3)

    game = recordFoul(game, 'pink')
    expect(game.players[0].score).toBe(-6)
    expect(game.teams![0].score).toBe(-6)
    expect(game.teams![1].score).toBe(0)
    expect(game.players[game.currentPlayerIndex].name).toBe('B1')
  })

  it('returns to the same team member when the fouler is put back in', () => {
    let game = createInitialGameState(['A1', 'A2', 'B1', 'B2'], [0, 0, 1, 1])
    game = replayFoul(recordFoul(game, 'cue_ball'))
    expect(game.players[game.currentPlayerIndex].name).toBe('A1')
    game = changeTurn(game)
    expect(game.players[game.currentPlayerIndex].name).toBe('B1')
    game = changeTurn(game)
    expect(game.players[game.currentPlayerIndex].name).toBe('A2')
  })
})

/** Pot the six colours in order on a table with no reds left */
function clearColours(game: GameState): GameState {
  let next: GameState = { ...game, redsRemaining: 0, lastPottedColor: undefined, ballOn: 'yellow' }
  for (const ball of ['yellow', 'green', 'brown', 'blue', 'pink', 'black'] as const) {
    next = registerPot(next, ball)
  }
  return next
}

describe('table cleared', () => {
  it('is set by the final black and stops further scoring', () => {
    const game = clearColours(twoPlayerState())
    expect(game.tableCleared).toBe(true)
    expect(game.players[0].score).toBe(27)
    expect(registerPot(game, 'black')).toBe(game)
    expect(recordFoul(game, 'cue_ball')).toBe(game)
    expect(changeTurn(game)).toBe(game)
  })

  it('is not set by a black taken as the free colour after the last red', () => {
    let game = potBall(twoPlayerState({ redsRemaining: 1 }), 'red').game!
    game = registerPot(game, 'black')
    expect(game.tableCleared).toBeFalsy()
    expect(game.ballOn).toBe('yellow')
  })
})

describe('Trace', () => {
  const trace = () => createInitialGameState(['A', 'B', 'C'], undefined, 0, { variant: 'trace' })
  /** Frame 2 with A leading on 27 and at the table */
  const secondFrame = () => newFrame(clearColours(trace()))

  it('only starts a new frame once the table is cleared', () => {
    const midFrame = registerPot(trace(), 'red')
    expect(newFrame(midFrame)).toBe(midFrame)

    const game = secondFrame()
    expect(game.frame).toBe(2)
    expect(game.redsRemaining).toBe(15)
    expect(game.ballOn).toBe('red')
    expect(game.tableCleared).toBeUndefined()
    expect(game.players.map((p) => p.score)).toEqual([27, 0, 0])
    expect(game.players.some((p) => p.sitting)).toBe(false)
  })

  it('does not let anyone sit out during the first frame', () => {
    const game = registerPot(trace(), 'red')
    expect(canSitOut(game)).toBe(false)
    expect(sitOut(game)).toBe(game)
  })

  it('sits the highest scorer out mid-frame without resetting the table', () => {
    let game = secondFrame()
    game = registerPot(game, 'red') // A: 28, 14 reds left
    expect(frameLeaders(game).map((p) => p.name)).toEqual(['A'])

    game = sitOut(game)
    expect(game.players[0].sitting).toBe(true)
    expect(game.players[0].finishPosition).toBe(1)
    expect(game.frame).toBe(2)
    expect(game.redsRemaining).toBe(14)
    expect(game.status).toBe('active')
    // A was at the table, so play passes on
    expect(game.currentPlayerIndex).toBe(1)
  })

  it('keeps the current player at the table when someone else sits out', () => {
    let game = changeTurn(secondFrame()) // B to play, A leads
    game = sitOut(game)
    expect(game.players[0].sitting).toBe(true)
    expect(game.currentPlayerIndex).toBe(1)
  })

  it('skips players who are sitting out', () => {
    let game = sitOut(secondFrame()) // A sits, B to play
    game = changeTurn(game)
    expect(game.currentPlayerIndex).toBe(2)
    game = changeTurn(game)
    expect(game.currentPlayerIndex).toBe(1)
  })

  it('gives foul points to the opponent once only two are left', () => {
    let game = sitOut(secondFrame()) // A sits, B to play
    game = recordFoul(game, 'cue_ball')
    expect(game.players.map((p) => p.score)).toEqual([27, 0, 4])
  })

  it('needs a choice when the highest score is tied', () => {
    const game: GameState = { ...trace(), frame: 2 }
    expect(frameLeaders(game)).toHaveLength(3)
    expect(sitOut(game)).toBe(game)
    expect(sitOut(game, game.players[2].id).players[2].sitting).toBe(true)
  })

  it('does not sit anyone out once only two are left', () => {
    let game = sitOut(secondFrame()) // A sits
    game = registerPot(game, 'red') // B: 1
    expect(canSitOut(game)).toBe(false)
    expect(sitOut(game)).toBe(game)
    expect(game.status).toBe('active')
  })

  it('lets the last two keep playing new frames', () => {
    let game = sitOut(secondFrame()) // A sits, B and C left
    game = newFrame(clearColours(game))
    expect(game.frame).toBe(3)
    expect(game.status).toBe('active')
    expect(game.players.filter((p) => !p.sitting)).toHaveLength(2)
  })

  it('ends the game when one of the last two quits, and that player loses', () => {
    let game = secondFrame()
    expect(canQuit(game)).toBe(false)
    expect(quitGame(game, game.players[1].id)).toBe(game)

    game = sitOut(game) // A sits
    expect(canQuit(game)).toBe(true)
    game = quitGame(game, game.players[1].id) // B quits
    expect(game.status).toBe('finished')
    expect(game.players.map((p) => p.finishPosition)).toEqual([1, 3, 2])
    expect(game.winnerId).toBe(game.players[0].id)
  })
})

describe('RD', () => {
  const rdGame = (rd = { target: 30, redValue: 10, minAttempts: 3, minPots: 2 }) =>
    createInitialGameState(['A', 'B', 'C'], undefined, 0, { variant: 'rd', rd })

  it('scores the red at the agreed value and counts the attempt', () => {
    const game = registerPot(rdGame(), 'red')
    expect(game.players[0].score).toBe(10)
    expect(game.players[0].redAttempts).toBe(1)
    expect(game.players[0].redPots).toBe(1)
    expect(game.currentPlayerIndex).toBe(0)
  })

  it('lets colours be potted in any order at face value', () => {
    let game = registerPot(rdGame(), 'black')
    game = registerPot(game, 'blue')
    expect(game.players[0].score).toBe(12)
    expect(game.events.every((e) => e.type === 'pot')).toBe(true)
  })

  it('treats a missed red as a foul costing the red value', () => {
    const game = missRed(rdGame())
    expect(game.players[0].score).toBe(-10)
    expect(game.players[0].redAttempts).toBe(1)
    expect(game.players[0].redPots).toBe(0)
    expect(game.currentPlayerIndex).toBe(1)
    expect(game.pendingReplay).toBeUndefined()
  })

  it('deducts the standard foul value for other fouls, even with two players', () => {
    const twoPlayers = createInitialGameState(['A', 'B'], undefined, 0, { variant: 'rd' })
    const game = recordFoul(twoPlayers, 'pink')
    expect(game.players.map((p) => p.score)).toEqual([-6, 0])
    expect(recordFoul(twoPlayers, 'cue_ball').players[0].score).toBe(-4)
  })

  it('deducts the red value for a foul on the red', () => {
    const game = recordFoul(rdGame({ target: 100, redValue: 15, minAttempts: 5, minPots: 3 }), 'red')
    expect(game.players[0].score).toBe(-15)
    expect(game.events[0].description).toContain('FOUL on red (-15)')
  })

  it('does not win at the target until the efficiency barrier is met', () => {
    let game = rdGame()
    for (let i = 0; i < 3; i++) game = registerPot(game, 'red') // 30 points, 3 attempts, 3 pots
    expect(game.status).toBe('finished')
    expect(game.winnerId).toBe(game.players[0].id)

    let short = rdGame({ target: 20, redValue: 10, minAttempts: 3, minPots: 2 })
    short = registerPot(registerPot(short, 'red'), 'red') // 20 points but only 2 attempts
    expect(short.status).toBe('active')
    short = registerPot(short, 'red')
    expect(short.status).toBe('finished')
  })
})

describe('changeTurn', () => {
  it('moves to the next player and wraps around', () => {
    const next = changeTurn(twoPlayerState())
    expect(next.currentPlayerIndex).toBe(1)
    expect(changeTurn(next).currentPlayerIndex).toBe(0)
  })

  it('resets the break and ball on', () => {
    const afterRed = potBall(twoPlayerState(), 'red').game!
    const next = changeTurn(afterRed)
    expect(next.currentBreak).toBe(0)
    expect(next.ballOn).toBe('red')
    expect(next.players[0].score).toBe(1)
  })
})

describe('createInitialGameState', () => {
  it('starts a singles game with the chosen breaker', () => {
    const game = createInitialGameState(['Alice', 'Bob'], undefined, 1)
    expect(game.mode).toBe('singles')
    expect(game.currentPlayerIndex).toBe(1)
    expect(game.redsRemaining).toBe(15)
    expect(game.teams).toBeUndefined()
  })

  it('puts four players into two teams of two', () => {
    const game = createInitialGameState(['A', 'B', 'C', 'D'], [0, 0, 1, 1])
    expect(game.mode).toBe('doubles')
    expect(game.teams).toHaveLength(2)
    expect(game.teams![0].playerIds).toEqual([game.players[0].id, game.players[1].id])
    expect(game.teams![1].playerIds).toEqual([game.players[2].id, game.players[3].id])
  })
})
