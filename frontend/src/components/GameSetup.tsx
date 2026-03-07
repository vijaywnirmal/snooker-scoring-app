/**
 * Game Setup Screen
 * User Stories 1.1, 1.2, 1.3 - Create New Game, Add Players, Configure Teams
 */

import { useState } from 'react'
import type { GameState } from '../types/game'
import { startGame } from '../services/api'

const MIN_NAME_LENGTH = 1
const MAX_NAME_LENGTH = 30

interface GameSetupProps {
  onGameStart: (game: GameState) => void
}

export default function GameSetup({ onGameStart }: GameSetupProps) {
  const [numPlayers, setNumPlayers] = useState<2 | 4>(2)
  const [playerNames, setPlayerNames] = useState<string[]>(['', ''])
  const [firstPlayerIndex, setFirstPlayerIndex] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const updatePlayerName = (index: number, value: string) => {
    const next = [...playerNames]
    next[index] = value
    setPlayerNames(next)
  }

  const handleNumPlayersChange = (n: 2 | 4) => {
    setNumPlayers(n)
    const next = n === 2 ? ['', ''] : ['', '', '', '']
    setPlayerNames(next)
    setFirstPlayerIndex(0)
    setErrors([])
    setApiError(null)
  }

  const validate = (): boolean => {
    const errs: string[] = []

    for (let i = 0; i < numPlayers; i++) {
      const name = playerNames[i]?.trim() ?? ''
      if (name.length < MIN_NAME_LENGTH) {
        errs.push(`Player ${i + 1} name is required`)
      } else if (name.length > MAX_NAME_LENGTH) {
        errs.push(`Player ${i + 1} name must be ${MAX_NAME_LENGTH} characters or less`)
      }
    }

    const unique = new Set(playerNames.map((n) => n.trim().toLowerCase()).filter(Boolean))
    if (unique.size < numPlayers && playerNames.some((n) => n.trim())) {
      errs.push('Player names must be unique')
    }

    setErrors(errs)
    return errs.length === 0
  }

  const handleStartGame = async () => {
    if (!validate()) return

    setLoading(true)
    setApiError(null)

    try {
      const names = playerNames.slice(0, numPlayers).map((n) => n.trim())
      const response = await startGame({
        num_players: numPlayers,
        player_names: names,
        first_player_index: firstPlayerIndex,
      })

      const state = response.state
      if (!state) {
        setApiError('Failed to get game state')
        return
      }

      onGameStart(state as GameState)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to start game')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="game-setup">
      <h1>New Game</h1>
      <p className="subtitle">Configure players and start the match</p>

      <section className="setup-section">
        <h2>Number of Players</h2>
        <div className="player-count">
          <button
            type="button"
            className={numPlayers === 2 ? 'active' : ''}
            onClick={() => handleNumPlayersChange(2)}
            disabled={loading}
          >
            2 Players
          </button>
          <button
            type="button"
            className={numPlayers === 4 ? 'active' : ''}
            onClick={() => handleNumPlayersChange(4)}
            disabled={loading}
          >
            4 Players (Teams)
          </button>
        </div>
      </section>

      <section className="setup-section">
        <h2>Player Names</h2>
        <div className="player-inputs">
          {Array.from({ length: numPlayers }).map((_, i) => (
            <div key={i} className="input-group">
              <label htmlFor={`player-${i}`}>
                {numPlayers === 4 && (i < 2 ? 'Team 1 - ' : 'Team 2 - ')}
                Player {i + 1}
              </label>
              <input
                id={`player-${i}`}
                type="text"
                value={playerNames[i] ?? ''}
                onChange={(e) => updatePlayerName(i, e.target.value)}
                placeholder={`Player ${i + 1} name`}
                maxLength={MAX_NAME_LENGTH}
                autoComplete="off"
                disabled={loading}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="setup-section">
        <h2>First to Break</h2>
        <div className="first-player">
          {Array.from({ length: numPlayers }).map((_, i) => (
            <label key={i} className="radio-option">
              <input
                type="radio"
                name="firstPlayer"
                checked={firstPlayerIndex === i}
                onChange={() => setFirstPlayerIndex(i)}
                disabled={loading}
              />
              <span>{playerNames[i]?.trim() || `Player ${i + 1}`}</span>
            </label>
          ))}
        </div>
      </section>

      {errors.length > 0 && (
        <div className="errors" role="alert">
          {errors.map((e, i) => (
            <p key={i}>{e}</p>
          ))}
        </div>
      )}

      {apiError && (
        <div className="errors" role="alert">
          <p>{apiError}</p>
        </div>
      )}

      <button
        type="button"
        className="start-btn"
        onClick={handleStartGame}
        disabled={loading}
      >
        {loading ? 'Starting...' : 'Start Game'}
      </button>
    </div>
  )
}
