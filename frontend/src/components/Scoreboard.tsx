/**
 * Scoreboard Screen
 * User Stories 2.1, 2.2, 2.3, 4.1, 4.3, 6.1, 6.2 | CR-001
 */

import { useState } from 'react'
import type { GameState, BallType, FoulBallType } from '../types/game'
import { BALL_VALUES } from '../types/game'

const BALLS: BallType[] = ['red', 'yellow', 'green', 'brown', 'blue', 'pink', 'black']

interface ScoreboardProps {
  game: GameState
  canUndo: boolean
  loading?: boolean
  actionError?: string | null
  onPot: (ball: BallType) => Promise<{ success: boolean; error?: string }>
  onFoul: (ballInvolved: FoulBallType) => void
  onChangeTurn: () => void
  onUndo: () => void
  onReset: () => void
  onClearError?: () => void
}

export default function Scoreboard({
  game,
  canUndo,
  loading = false,
  actionError,
  onPot,
  onFoul,
  onChangeTurn,
  onUndo,
  onReset,
  onClearError,
}: ScoreboardProps) {
  const [showFoulModal, setShowFoulModal] = useState(false)
  const currentPlayer = game.players[game.currentPlayerIndex]
  const lastEvent = game.events[game.events.length - 1]

  const handlePot = async (ball: BallType) => {
    onClearError?.()
    const result = await onPot(ball)
    if (!result.success && result.error) {
      onClearError?.() // Error is shown via actionError from parent
    }
  }

  const handleUndo = () => {
    onClearError?.()
    onUndo()
  }

  const handleControlClick = (fn: () => void) => {
    onClearError?.()
    fn()
  }

  const handleFoulSelect = (ball: FoulBallType) => {
    setShowFoulModal(false)
    onClearError?.()
    onFoul(ball)
  }

  return (
    <div className="scoreboard">
      <h1>Scoreboard</h1>

      {loading && (
        <div className="loading-overlay">
          <span>Updating...</span>
        </div>
      )}

      <div className="scores">
        {game.players.map((p, i) => (
          <div
            key={p.id}
            className={`player-score ${i === game.currentPlayerIndex ? 'active' : ''}`}
          >
            <span className="name">{p.name}</span>
            <span className="score">{p.score}</span>
          </div>
        ))}
      </div>

      {game.teams && game.teams.length > 0 && (
        <div className="team-scores">
          {game.teams.map((t) => (
            <div key={t.id} className="team-score">
              <span className="name">{t.name}</span>
              <span className="score">{t.score}</span>
            </div>
          ))}
        </div>
      )}

      <div className="game-info">
        <p>
          <strong>Current player:</strong> {currentPlayer?.name}
        </p>
        <p>
          <strong>Ball on:</strong> {(game as GameState & { ballOn?: string }).ballOn ?? 'red'}
        </p>
        <p>
          <strong>Reds remaining:</strong> {game.redsRemaining}
        </p>
        <p>
          <strong>Current break:</strong> {game.currentBreak}
        </p>
      </div>

      {lastEvent && (
        <div className="last-event">
          <h3>Last scoring event</h3>
          <p className={lastEvent.type === 'foul' ? 'foul-description' : ''}>
            {lastEvent.type === 'foul' && lastEvent.ballOn && lastEvent.ballInvolved ? (
              <>
                {lastEvent.description?.split('|')[0]?.trim()}
                <br />
                <small>Ball on: {String(lastEvent.ballOn).toUpperCase()} | Ball involved: {lastEvent.ballInvolved === 'cue_ball' ? 'CUE BALL' : String(lastEvent.ballInvolved).toUpperCase()} | +{lastEvent.points} pts</small>
              </>
            ) : (
              lastEvent.description
            )}
          </p>
        </div>
      )}

      {actionError && (
        <div className="error-banner" role="alert">
          {actionError}
        </div>
      )}

      <div className="ball-buttons">
        <h3>Ball potted</h3>
        <div className="ball-grid">
          {BALLS.map((ball) => (
            <button
              key={ball}
              type="button"
              className={`ball-btn ball-${ball}`}
              onClick={() => handlePot(ball)}
              title={`${ball} (${BALL_VALUES[ball]} pts)`}
              disabled={loading}
            >
              <span className="ball-label">{ball}</span>
              <span className="ball-value">{BALL_VALUES[ball]}</span>
            </button>
          ))}
        </div>
      </div>

      {showFoulModal && (
        <div className="modal-overlay" onClick={() => setShowFoulModal(false)}>
          <div className="modal foul-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Select ball involved in foul</h3>
            <div className="ball-grid">
              {BALLS.map((ball) => (
                <button
                  key={ball}
                  type="button"
                  className={`ball-btn ball-${ball}`}
                  onClick={() => handleFoulSelect(ball)}
                  disabled={loading}
                >
                  <span className="ball-label">{ball}</span>
                  <span className="ball-value">{BALL_VALUES[ball]}</span>
                </button>
              ))}
              <button
                type="button"
                className="ball-btn ball-cue"
                onClick={() => handleFoulSelect('cue_ball')}
                disabled={loading}
              >
                <span className="ball-label">Cue ball</span>
                <span className="ball-value">—</span>
              </button>
            </div>
            <button type="button" className="modal-cancel" onClick={() => setShowFoulModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="controls">
        <button
          type="button"
          className="control-btn foul-btn"
          onClick={() => setShowFoulModal(true)}
          disabled={loading}
        >
          Foul
        </button>
        <button
          type="button"
          className="control-btn turn-btn"
          onClick={() => handleControlClick(onChangeTurn)}
          disabled={loading}
        >
          Change Turn
        </button>
        <button
          type="button"
          className="control-btn undo-btn"
          onClick={handleUndo}
          disabled={!canUndo || loading}
        >
          Undo
        </button>
      </div>

      <div className="event-history">
        <h3>Event history</h3>
        {game.events.length === 0 ? (
          <p className="empty">No events yet</p>
        ) : (
          <ul>
            {[...game.events].reverse().slice(0, 10).map((e) => (
              <li key={e.id} className={e.type === 'foul' ? 'foul-event' : ''}>
                {e.type === 'foul' && e.ballOn && e.ballInvolved ? (
                  <>
                    <strong>{(e as { description?: string }).description?.split('|')[0]?.trim()}</strong>
                    <br />
                    Ball on: {String(e.ballOn).toUpperCase()} | Ball involved: {e.ballInvolved === 'cue_ball' ? 'CUE BALL' : String(e.ballInvolved).toUpperCase()}
                    <br />
                    <span className="foul-points">+{e.points} points</span>
                  </>
                ) : (
                  (e as { description?: string }).description
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        className="reset-btn"
        onClick={onReset}
        disabled={loading}
      >
        Reset Game
      </button>
    </div>
  )
}
