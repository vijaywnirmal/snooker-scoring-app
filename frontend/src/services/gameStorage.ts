/**
 * Game persistence - keeps the current game in this browser's localStorage
 * so a refresh or closed tab doesn't lose the frame.
 */

import type { GameState } from '../types/game'

const STORAGE_KEY = 'snooker-scoring:game:v1'

/** Undo steps kept; each one is a full state snapshot */
export const MAX_HISTORY = 50

export interface SavedGame {
  game: GameState
  history: GameState[]
}

export function loadSavedGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as SavedGame
    if (!Array.isArray(saved?.game?.players) || !Array.isArray(saved.game.events)) return null
    // Games saved before variants existed were classic snooker
    const game = { ...saved.game, variant: saved.game.variant ?? 'snooker' }
    return { game, history: Array.isArray(saved.history) ? saved.history : [] }
  } catch {
    return null
  }
}

export function saveGame(saved: SavedGame | null): void {
  try {
    if (saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Storage unavailable or full - the game still works, it just won't survive a refresh
  }
}
