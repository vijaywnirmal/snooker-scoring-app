/**
 * Scoreboard Screen
 * User Stories 2.1, 2.2, 2.3, 4.1, 4.3, 6.1, 6.2 | CR-001
 */

import { useState } from 'react'
import type { GameState, BallType, FoulBallType, GameEvent, Player } from '../types/game'
import { BALL_VALUES } from '../types/game'
import { getVariant } from '../variants'
import { activePlayers, canQuit, canSitOut, frameLeaders, rdBarrierMet } from '../utils/gameActions'

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
  /** After a foul: the next player makes the fouler play again */
  onReplayFoul?: () => void
  /** RD: the red was attempted and missed */
  onMissRed?: () => void
  /** Trace: start a new frame with scores carried over */
  onNewFrame?: () => void
  /** Trace: the highest scorer sits out; sitterId settles a tie */
  onSitOut?: (sitterId?: string) => void
  /** Trace: one of the last two quits and loses */
  onQuit?: (quitterId: string) => void
}

function ordinal(n: number): string {
  const suffix = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'
  return `${n}${suffix}`
}

function foulPointsLabel(event: GameEvent): string {
  return `${event.deducted ? '-' : '+'}${event.points}`
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
  onReplayFoul,
  onMissRed,
  onNewFrame,
  onSitOut,
  onQuit,
}: ScoreboardProps) {
  const [showFoulModal, setShowFoulModal] = useState(false)
  const [showSitOutModal, setShowSitOutModal] = useState(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const currentPlayer = game.players[game.currentPlayerIndex]
  const lastEvent = game.events[game.events.length - 1]
  const variant = getVariant(game.variant)
  const isRd = game.variant === 'rd' && !!game.rd
  const isTrace = game.variant === 'trace'
  const finished = game.status === 'finished'
  const locked = loading || finished
  const cleared = !!game.tableCleared && !finished
  // Nothing left to pot until a new frame starts
  const scoringLocked = locked || cleared
  const fouler = game.pendingReplay ? game.players[game.pendingReplay.playerIndex] : undefined
  const winner = game.players.find((p) => p.id === game.winnerId)

  const ballPoints = (ball: BallType) => (isRd && ball === 'red' ? game.rd!.redValue : BALL_VALUES[ball])

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

  const handleControlClick = (fn?: () => void) => {
    onClearError?.()
    fn?.()
  }

  const handleFoulSelect = (ball: FoulBallType) => {
    setShowFoulModal(false)
    onClearError?.()
    onFoul(ball)
  }

  const handleQuit = (quitterId: string) => {
    setShowQuitModal(false)
    onClearError?.()
    onQuit?.(quitterId)
  }

  const handleSitOut = (sitterId?: string) => {
    setShowSitOutModal(false)
    onClearError?.()
    onSitOut?.(sitterId)
  }

  const playerStatus = (p: Player) => {
    if (isRd) {
      return `Reds ${p.redPots ?? 0}/${game.rd!.minPots} · Tries ${p.redAttempts ?? 0}/${game.rd!.minAttempts}${rdBarrierMet(game, p) ? ' ✓' : ''}`
    }
    if (isTrace && p.finishPosition) {
      return p.finishPosition === game.players.length ? 'Lost' : `Safe · ${ordinal(p.finishPosition)}`
    }
    return null
  }

  const leaders = isTrace && !finished ? frameLeaders(game) : []
  const lastTwo = isTrace && activePlayers(game).length === 2

  return (
    <div className="scoreboard">
      <h1>Scoreboard</h1>
      <p className="variant-line">
        {variant.name}
        {isTrace && !finished && ` · Frame ${game.frame ?? 1}${lastTwo ? ' · last two' : ''}`}
        {isRd && ` · First to ${game.rd!.target}`}
      </p>

      {loading && (
        <div className="loading-overlay">
          <span>Updating...</span>
        </div>
      )}

      {finished && (
        <div className="result-banner" role="status">
          {isTrace ? (
            <>
              <strong>Game over</strong>
              <ol>
                {[...game.players]
                  .sort((a, b) => (a.finishPosition ?? 0) - (b.finishPosition ?? 0))
                  .map((p) => (
                    <li key={p.id}>
                      {p.name} – {p.score}
                      {p.finishPosition === game.players.length && ' (lost)'}
                    </li>
                  ))}
              </ol>
            </>
          ) : (
            <strong>{winner?.name} wins with {winner?.score}</strong>
          )}
        </div>
      )}

      <div className="scores">
        {game.players.map((p, i) => {
          const status = playerStatus(p)
          return (
            <div
              key={p.id}
              className={`player-score ${i === game.currentPlayerIndex && !finished ? 'active' : ''} ${p.sitting ? 'sitting' : ''}`}
            >
              <span className="player-id">
                <span className="name">{p.name}</span>
                {status && <span className="player-status">{status}</span>}
              </span>
              <span className="score">{p.score}</span>
            </div>
          )
        })}
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
        {isRd ? (
          <p>
            <strong>Red:</strong> {game.rd!.redValue} points, {game.rd!.redValue} off for a miss
          </p>
        ) : (
          <>
            <p>
              <strong>Ball on:</strong> {cleared ? '—' : (game.ballOn ?? 'red')}
            </p>
            <p>
              <strong>Reds remaining:</strong> {game.redsRemaining}
            </p>
          </>
        )}
        <p>
          <strong>Current break:</strong> {game.currentBreak}
        </p>
      </div>

      {cleared && (
        <div className="replay-banner" role="status">
          <span>
            Table cleared.{' '}
            {isTrace ? 'Start a new frame to carry on; scores are kept.' : 'The frame is over. Reset to start another.'}
          </span>
        </div>
      )}

      {fouler && !finished && !cleared && (
        <div className="replay-banner">
          <span>
            {fouler.name} fouled. {currentPlayer?.name} can play, or put {fouler.name} back in.
          </span>
          <button type="button" onClick={() => handleControlClick(onReplayFoul)} disabled={scoringLocked}>
            Make {fouler.name} play again
          </button>
        </div>
      )}

      {lastEvent && (
        <div className="last-event">
          <h3>Last scoring event</h3>
          <p className={lastEvent.type === 'foul' ? 'foul-description' : ''}>
            {lastEvent.type === 'foul' && lastEvent.ballOn && lastEvent.ballInvolved ? (
              <>
                {lastEvent.description?.split('|')[0]?.trim()}
                <br />
                <small>Ball on: {String(lastEvent.ballOn).toUpperCase()} | Ball involved: {lastEvent.ballInvolved === 'cue_ball' ? 'CUE BALL' : String(lastEvent.ballInvolved).toUpperCase()} | {foulPointsLabel(lastEvent)} pts</small>
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
              title={`${ball} (${ballPoints(ball)} pts)`}
              disabled={scoringLocked}
            >
              <span className="ball-label">{ball}</span>
              <span className="ball-value">{ballPoints(ball)}</span>
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
                  disabled={locked}
                >
                  <span className="ball-label">{ball}</span>
                  <span className="ball-value">{ballPoints(ball)}</span>
                </button>
              ))}
              <button
                type="button"
                className="ball-btn ball-cue"
                onClick={() => handleFoulSelect('cue_ball')}
                disabled={locked}
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

      {showSitOutModal && (
        <div className="modal-overlay" onClick={() => setShowSitOutModal(false)}>
          <div className="modal frame-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Sit out the leader</h3>
            {leaders.length === 1 ? (
              <>
                <p>
                  {leaders[0].name} has the highest score ({leaders[0].score}) and sits out as safe. The others play
                  on.
                </p>
                <button type="button" className="modal-confirm" onClick={() => handleSitOut(leaders[0].id)}>
                  {leaders[0].name} sits out
                </button>
              </>
            ) : (
              <>
                <p>Tied on {leaders[0]?.score}. Choose who sits out.</p>
                <div className="modal-choices">
                  {leaders.map((p) => (
                    <button key={p.id} type="button" className="modal-confirm" onClick={() => handleSitOut(p.id)}>
                      {p.name} sits out
                    </button>
                  ))}
                </div>
              </>
            )}
            <button type="button" className="modal-cancel" onClick={() => setShowSitOutModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {showQuitModal && (
        <div className="modal-overlay" onClick={() => setShowQuitModal(false)}>
          <div className="modal frame-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Who quits?</h3>
            <p>The player who quits loses and the other is safe. This ends the game.</p>
            <div className="modal-choices">
              {activePlayers(game).map((p) => (
                <button key={p.id} type="button" className="modal-confirm" onClick={() => handleQuit(p.id)}>
                  {p.name} quits
                </button>
              ))}
            </div>
            <button type="button" className="modal-cancel" onClick={() => setShowQuitModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="controls">
        {isRd && (
          <button
            type="button"
            className="control-btn foul-btn"
            onClick={() => handleControlClick(onMissRed)}
            disabled={locked}
          >
            Red missed
          </button>
        )}
        <button
          type="button"
          className="control-btn foul-btn"
          onClick={() => setShowFoulModal(true)}
          disabled={scoringLocked}
        >
          Foul
        </button>
        <button
          type="button"
          className="control-btn turn-btn"
          onClick={() => handleControlClick(onChangeTurn)}
          disabled={scoringLocked}
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

      {isTrace && !finished && (
        <div className="trace-actions">
          <div className="trace-buttons">
            {lastTwo ? (
              <button
                type="button"
                className="end-frame-btn"
                onClick={() => setShowQuitModal(true)}
                disabled={locked || !canQuit(game)}
              >
                Player Quits
              </button>
            ) : (
              <button
                type="button"
                className="end-frame-btn"
                onClick={() => setShowSitOutModal(true)}
                disabled={locked || !canSitOut(game)}
              >
                Sit Out Leader
              </button>
            )}
            <button
              type="button"
              className="end-frame-btn"
              onClick={() => handleControlClick(onNewFrame)}
              disabled={locked || !cleared}
            >
              New Frame
            </button>
          </div>
          <p className="trace-hint">
            {lastTwo
              ? 'The last two play on until one of them quits.'
              : canSitOut(game)
                ? 'The highest scorer can be sat out at any point.'
                : 'A player can be sat out from frame 2.'}
            {!cleared && ' A new frame can start once the table is cleared.'}
          </p>
        </div>
      )}

      <div className="event-history">
        <h3>Event history ({game.events.length})</h3>
        {game.events.length === 0 ? (
          <p className="empty">No events yet</p>
        ) : (
          <ul>
            {[...game.events].reverse().map((e) => (
              <li key={e.id} className={e.type === 'foul' ? 'foul-event' : ''}>
                {e.type === 'foul' && e.ballOn && e.ballInvolved ? (
                  <>
                    <strong>{e.description?.split('|')[0]?.trim()}</strong>
                    <br />
                    Ball on: {String(e.ballOn).toUpperCase()} | Ball involved: {e.ballInvolved === 'cue_ball' ? 'CUE BALL' : String(e.ballInvolved).toUpperCase()}
                    <br />
                    <span className="foul-points">{foulPointsLabel(e)} points</span>
                  </>
                ) : (
                  e.description
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
        {finished ? 'New Game' : 'Reset Game'}
      </button>
    </div>
  )
}
