/**
 * Scoreboard Screen
 * User Stories 2.1, 2.2, 2.3, 4.1, 4.3, 6.1, 6.2 | CR-001
 */

import { useState } from 'react'
import type { GameState, BallType, FoulBallType, GameEvent, Player } from '../types/game'
import { BALL_VALUES } from '../types/game'
import { getVariant } from '../variants'
import { activePlayers, canQuit, canSitOut, colourPotsNeeded, frameLeaders, hasToken, rdBarrierMet } from '../utils/gameActions'

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
  /** Trace and Shuffle: start a new frame with scores carried over; Shuffle can reshuffle the order */
  onNewFrame?: (reshuffle?: boolean) => void
  /** Shuffle: a token holder potted their own colour in a corner pocket */
  onColourPot?: (playerId: string) => void
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
  onColourPot,
}: ScoreboardProps) {
  const [showFoulModal, setShowFoulModal] = useState(false)
  const [showSitOutModal, setShowSitOutModal] = useState(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [showColourModal, setShowColourModal] = useState(false)
  const currentPlayer = game.players[game.currentPlayerIndex]
  const lastEvent = game.events[game.events.length - 1]
  const variant = getVariant(game.variant)
  const isRd = game.variant === 'rd' && !!game.rd
  const isTrace = game.variant === 'trace'
  const isShuffle = game.variant === 'shuffle' && !!game.shuffle
  const frameWinner = game.players.find((p) => p.id === game.frameWinnerId)
  const tokenHolders = isShuffle ? game.players.filter((p) => hasToken(game, p)) : []
  const finished = game.status === 'finished'
  const locked = loading || finished
  const cleared = !!game.tableCleared && !finished
  // Nothing left to pot until a new frame starts
  const scoringLocked = locked || cleared || !!frameWinner
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

  const handleColourPot = (playerId: string) => {
    setShowColourModal(false)
    onClearError?.()
    onColourPot?.(playerId)
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
    if (isShuffle) {
      const target = game.shuffle!.redsPerPlayer
      if (p.id === game.frameWinnerId) return `Won frame ${game.frame ?? 1}`
      const parts = [`Reds ${Math.min(p.redPots ?? 0, target)}/${target}`]
      if (hasToken(game, p)) parts.push('token drawn')
      const needed = colourPotsNeeded(p)
      if (needed > 1) parts.push(`colour ${p.colourPots ?? 0}/${needed}`)
      return parts.join(' · ')
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
      <header className="sb-header">
        <h1 className="sb-title">{variant.name}</h1>
        <p className="variant-line">
          {(isTrace || isShuffle) && !finished && <span>Frame {game.frame ?? 1}</span>}
          {isTrace && lastTwo && !finished && <span>Last two</span>}
          {isRd && <span>First to {game.rd!.target}</span>}
          {isShuffle && <span>{game.shuffle!.redsPerPlayer} reds each</span>}
          {isShuffle && <span>Scores are frames won</span>}
        </p>
      </header>

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

      <div className={`scores ${game.players.length === 2 && !game.teams?.length ? 'scores--duel' : ''}`}>
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

      <dl className="game-info">
        <div className="stat stat--wide">
          <dt>At the table</dt>
          <dd>{finished ? '—' : currentPlayer?.name}</dd>
        </div>
        {isRd ? (
          <div className="stat stat--wide">
            <dt>Red</dt>
            <dd>
              {game.rd!.redValue} pts · −{game.rd!.redValue} for a miss
            </dd>
          </div>
        ) : (
          <>
            {!isShuffle && (
              <div className="stat">
                <dt>Ball on</dt>
                <dd>
                  {cleared ? (
                    '—'
                  ) : (
                    <>
                      <span className={`ball-dot ball-dot--${game.ballOn ?? 'red'}`} aria-hidden="true" />
                      {game.ballOn ?? 'red'}
                    </>
                  )}
                </dd>
              </div>
            )}
            <div className="stat">
              <dt>Reds left</dt>
              <dd>{game.redsRemaining}</dd>
            </div>
          </>
        )}
        <div className="stat">
          <dt>{isShuffle ? 'This visit' : 'Break'}</dt>
          <dd>{game.currentBreak}</dd>
        </div>
      </dl>

      {frameWinner && !finished && (
        <div className="replay-banner" role="status">
          <span>
            {frameWinner.name} wins frame {game.frame ?? 1}. They show their token to the table; start a new frame to
            carry on.
          </span>
        </div>
      )}

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
              title={isShuffle ? (ball === 'red' ? 'Red potted' : `${ball} potted (any pocket)`) : `${ball} (${ballPoints(ball)} pts)`}
              disabled={scoringLocked || (isShuffle && ball === 'red' && game.redsRemaining <= 0)}
            >
              <span className="ball-label">{ball}</span>
              <span className="ball-value">{isShuffle ? (ball === 'red' ? '+1' : '') : ballPoints(ball)}</span>
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

      {showColourModal && (
        <div className="modal-overlay" onClick={() => setShowColourModal(false)}>
          <div className="modal frame-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Who potted their colour?</h3>
            <p>
              The colour on their token went in a corner pocket; a centre pocket doesn't count. The last pot they owe
              wins the frame and they show the token. An earlier one is respotted.
            </p>
            <div className="modal-choices">
              {tokenHolders.map((p) => {
                const left = colourPotsNeeded(p) - (p.colourPots ?? 0)
                return (
                  <button key={p.id} type="button" className="modal-confirm" onClick={() => handleColourPot(p.id)}>
                    {left <= 1 ? `${p.name} wins the frame` : `${p.name} (${left} still to pot)`}
                  </button>
                )
              })}
            </div>
            <button type="button" className="modal-cancel" onClick={() => setShowColourModal(false)}>
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
          // Shuffle fouls carry no points, so there is no ball to choose
          onClick={() => (isShuffle ? handleFoulSelect('cue_ball') : setShowFoulModal(true))}
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

      {isShuffle && !finished && (
        <div className="trace-actions">
          <div className="trace-buttons">
            <button
              type="button"
              className="end-frame-btn shuffle-win-btn"
              onClick={() => setShowColourModal(true)}
              disabled={locked || !!frameWinner || tokenHolders.length === 0}
            >
              Own Colour Potted (Corner)
            </button>
            <button
              type="button"
              className="end-frame-btn"
              onClick={() => handleControlClick(() => onNewFrame?.(false))}
              disabled={locked}
            >
              New Frame
            </button>
            <button
              type="button"
              className="end-frame-btn"
              onClick={() => handleControlClick(() => onNewFrame?.(true))}
              disabled={locked}
            >
              New Frame, Shuffle Order
            </button>
          </div>
          <p className="trace-hint">
            After potting {game.shuffle!.redsPerPlayer} red{game.shuffle!.redsPerPlayer === 1 ? '' : 's'} a player draws
            a secret colour token. They win the frame by potting that colour in a corner pocket, never a centre pocket.
            Each foul adds one more corner pot of their colour. Any other colour can be potted in any pocket; it is
            respotted and scores nothing.
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
