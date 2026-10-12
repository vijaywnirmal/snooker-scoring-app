import { useEffect, useState } from 'react'
import type { GameState, BallType, FoulBallType } from './types/game'
import GameSetup from './components/GameSetup'
import Scoreboard from './components/Scoreboard'
import { registerPot, recordFoul, changeTurn, replayFoul, missRed, newFrame, sitOut, quitGame } from './utils/gameActions'
import { loadSavedGame, saveGame, MAX_HISTORY, type SavedGame } from './services/gameStorage'

function App() {
  const [saved, setSaved] = useState<SavedGame | null>(loadSavedGame)

  useEffect(() => {
    saveGame(saved)
  }, [saved])

  const handleGameStart = (newGame: GameState) => {
    setSaved({ game: newGame, history: [] })
  }

  /** Apply a scoring action, keeping the previous state for undo */
  const applyAction = (action: (game: GameState) => GameState) => {
    setSaved((prev) =>
      prev && prev.game.status !== 'finished'
        ? {
            game: action(prev.game),
            history: [...prev.history, prev.game].slice(-MAX_HISTORY),
          }
        : prev
    )
  }

  const handlePot = async (ball: BallType) => {
    applyAction((g) => registerPot(g, ball))
    return { success: true }
  }

  const handleFoul = (ballInvolved: FoulBallType) => {
    applyAction((g) => recordFoul(g, ballInvolved))
  }

  const handleChangeTurn = () => {
    applyAction(changeTurn)
  }

  const handleReplayFoul = () => {
    applyAction(replayFoul)
  }

  const handleMissRed = () => {
    applyAction(missRed)
  }

  const handleNewFrame = () => {
    applyAction(newFrame)
  }

  const handleSitOut = (sitterId?: string) => {
    applyAction((g) => sitOut(g, sitterId))
  }

  const handleQuit = (quitterId: string) => {
    applyAction((g) => quitGame(g, quitterId))
  }

  const handleUndo = () => {
    setSaved((prev) =>
      prev && prev.history.length > 0
        ? { game: prev.history[prev.history.length - 1], history: prev.history.slice(0, -1) }
        : prev
    )
  }

  const handleReset = () => {
    setSaved(null)
  }

  return (
    <div className="app">
      {saved ? (
        <Scoreboard
          game={saved.game}
          canUndo={saved.history.length > 0}
          onPot={handlePot}
          onFoul={handleFoul}
          onChangeTurn={handleChangeTurn}
          onUndo={handleUndo}
          onReset={handleReset}
          onReplayFoul={handleReplayFoul}
          onMissRed={handleMissRed}
          onNewFrame={handleNewFrame}
          onSitOut={handleSitOut}
          onQuit={handleQuit}
        />
      ) : (
        <GameSetup onGameStart={handleGameStart} />
      )}
    </div>
  )
}

export default App
