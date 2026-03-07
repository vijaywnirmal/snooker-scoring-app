/**
 * Scoring engine - pure logic for snooker scoring rules
 * User Stories: 3.1, 3.2, 3.3, 4.2, 4.3
 */

import type { BallOnType, BallType, FoulBallType } from '../types/game'
import {
  BALL_VALUES,
  FINAL_COLOR_SEQUENCE,
} from '../types/game'

export function getBallValue(ball: BallType): number {
  return BALL_VALUES[ball]
}

/** Value of ball_on for foul calculation (CR-001). Colour = 4 when unspecified. */
export function getBallOnValue(ballOn: BallOnType): number {
  if (ballOn === 'red') return 1
  if (ballOn === 'colour') return 4
  return BALL_VALUES[ballOn as BallType] ?? 4
}

/** Value of ball involved in foul. Cue ball = 4 (minimum foul). */
export function getFoulBallValue(ball: FoulBallType): number {
  if (ball === 'cue_ball') return 4
  return getBallValue(ball)
}

/** Calculate foul points: max(4, value(ball_on), value(ball_involved)) - CR-001 */
export function calculateFoulPoints(ballOn: BallOnType, ballInvolved: FoulBallType): number {
  const vOn = getBallOnValue(ballOn)
  const vInvolved = getFoulBallValue(ballInvolved)
  return Math.min(7, Math.max(4, vOn, vInvolved))
}

export function canPotBall(
  ball: BallType,
  redsRemaining: number,
  lastPottedColor?: BallType
): { valid: boolean; reason?: string } {
  if (ball === 'red') {
    if (redsRemaining <= 0) {
      return { valid: false, reason: 'No reds remaining' }
    }
    return { valid: true }
  }

  // Colored ball
  if (redsRemaining > 0) {
    // Reds on table: can only pot color after potting a red (or start of break)
    if (lastPottedColor && lastPottedColor !== 'red') {
      return { valid: false, reason: 'Must pot a red next' }
    }
    return { valid: true }
  }

  // Final color sequence: Yellow → Green → Brown → Blue → Pink → Black
  const expectedIndex = lastPottedColor
    ? FINAL_COLOR_SEQUENCE.indexOf(lastPottedColor) + 1
    : 0

  const ballIndex = FINAL_COLOR_SEQUENCE.indexOf(ball)
  if (ballIndex !== expectedIndex) {
    const expected = FINAL_COLOR_SEQUENCE[expectedIndex]
    return {
      valid: false,
      reason: `Expected ${expected}, got ${ball}`,
    }
  }

  return { valid: true }
}

export const DEFAULT_FOUL_POINTS = 4

/** Get current ball on from game state (CR-001) */
export function getBallOn(
  redsRemaining: number,
  lastPottedColor?: BallType
): BallOnType {
  if (redsRemaining > 0) {
    if (!lastPottedColor || lastPottedColor === 'red') return 'red'
    return 'colour'
  }
  if (!lastPottedColor || lastPottedColor === 'red') return 'yellow'
  const idx = FINAL_COLOR_SEQUENCE.indexOf(lastPottedColor)
  if (idx < 0 || idx >= FINAL_COLOR_SEQUENCE.length - 1) return 'black'
  return FINAL_COLOR_SEQUENCE[idx + 1]
}
