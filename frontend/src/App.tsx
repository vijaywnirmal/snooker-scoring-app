import { useState } from 'react'
import type { GameState, BallType } from './types/game'
import GameSetup from './components/GameSetup'
import Scoreboard from './components/Scoreboard'
import {
  registerPot,
  recordFoul,
  changeTurn,
  undoLastAction,
  resetGame,
} from './services/api'

function App() {
  const [game, setGame] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleGameStart = (newGame: GameState) => {
    setGame(newGame)
    setActionError(null)
  }

  const apiAction = async (
    fn: () => Promise<import('./services/api').GameState>,
    onSuccess?: () => void
  ) => {
    setActionError(null)
    setLoading(true)
    try {
      const newState = await fn()
      setGame(newState as unknown as GameState)
      onSuccess?.()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePot = async (ball: BallType) => {
    if (!game) return { success: false, error: 'No game' }
    try {
      setActionError(null)
      setLoading(true)
      const newState = await registerPot(game.id, ball)
      setGame(newState as unknown as GameState)
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid pot'
      setActionError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  const handleFoul = (ballInvolved: import('./types/game').FoulBallType) => {
    if (!game) return
    apiAction(() => recordFoul(game!.id, ballInvolved))
  }

  const handleChangeTurn = () => {
    if (!game) return
    apiAction(() => changeTurn(game!.id))
  }

  const handleUndo = () => {
    if (!game) return
    apiAction(() => undoLastAction(game!.id))
  }

  const handleReset = async () => {
    if (!game) return
    const gameId = game.id
    setLoading(true)
    setActionError(null)
    try {
      await resetGame(gameId)
      setGame(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  const canUndo = !!(game as (GameState & { canUndo?: boolean }) | null)?.canUndo

  return (
    <div className="app">
      {game ? (
        <Scoreboard
          game={game}
          canUndo={!!canUndo}
          loading={loading}
          actionError={actionError}
          onPot={handlePot}
          onFoul={handleFoul}
          onChangeTurn={handleChangeTurn}
          onUndo={handleUndo}
          onReset={handleReset}
          onClearError={() => setActionError(null)}
        />
      ) : (
        <GameSetup onGameStart={handleGameStart} />
      )}
    </div>
  )
}

export default App
