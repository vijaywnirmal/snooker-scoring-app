/**
 * Game Setup Screen
 * User Stories 1.1, 1.2, 1.3 - Create New Game, Add Players, Configure Teams
 */

import { useState } from 'react'
import type { GameState, GameVariant, RdSettings } from '../types/game'
import { createInitialGameState, DEFAULT_RD_SETTINGS } from '../utils/gameState'
import { VARIANTS, getVariant } from '../variants'

const MIN_NAME_LENGTH = 1
const MAX_NAME_LENGTH = 30

interface GameSetupProps {
  onGameStart: (game: GameState) => void
}

/** Consecutive blocks: with 2 teams of 4 players, the first two are Team 1 */
function defaultTeams(numPlayers: number, numTeams: number): number[] {
  const perTeam = Math.ceil(numPlayers / numTeams)
  return Array.from({ length: numPlayers }, (_, i) => Math.floor(i / perTeam))
}

function maxTeams(numPlayers: number): number {
  return Math.max(2, Math.floor(numPlayers / 2))
}

export default function GameSetup({ onGameStart }: GameSetupProps) {
  const [variantId, setVariantId] = useState<GameVariant>('snooker')
  const [numPlayers, setNumPlayers] = useState(2)
  const [playerNames, setPlayerNames] = useState<string[]>(['', ''])
  const [useTeams, setUseTeams] = useState(false)
  const [numTeams, setNumTeams] = useState(2)
  const [teamOf, setTeamOf] = useState<number[]>(defaultTeams(2, 2))
  const [rd, setRd] = useState<RdSettings>(DEFAULT_RD_SETTINGS)
  const [firstPlayerIndex, setFirstPlayerIndex] = useState(0)
  const [shuffled, setShuffled] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const variant = getVariant(variantId)
  const playerCounts = Array.from(
    { length: variant.maxPlayers - variant.minPlayers + 1 },
    (_, i) => variant.minPlayers + i
  )
  const teamsAllowed = variantId === 'doubles' && numPlayers >= 3
  const teamsOn = teamsAllowed && useTeams

  const applyPlayerCount = (n: number, teams = numTeams) => {
    const nextTeams = Math.min(teams, maxTeams(n))
    setNumPlayers(n)
    setPlayerNames((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? ''))
    setNumTeams(nextTeams)
    setTeamOf(defaultTeams(n, nextTeams))
    setFirstPlayerIndex((prev) => (prev < n ? prev : 0))
    setShuffled(false)
    setErrors([])
  }

  const handleVariantChange = (id: GameVariant) => {
    const next = getVariant(id)
    setVariantId(id)
    applyPlayerCount(Math.min(Math.max(numPlayers, next.minPlayers), next.maxPlayers))
  }

  const updatePlayerName = (index: number, value: string) => {
    const next = [...playerNames]
    next[index] = value
    setPlayerNames(next)
  }

  const chooseFirstPlayer = (index: number) => {
    setFirstPlayerIndex(index)
    setShuffled(false)
  }

  /** Pick who breaks at random; every player has the same chance */
  const shuffleFirstPlayer = (): number => {
    const index = Math.floor(Math.random() * numPlayers)
    setFirstPlayerIndex(index)
    setShuffled(true)
    return index
  }

  const handleShuffleAndStart = () => {
    if (!validate()) return
    handleStartGame(shuffleFirstPlayer())
  }

  const updateTeam = (index: number, team: number) => {
    const next = [...teamOf]
    next[index] = team
    setTeamOf(next)
  }

  const updateRd = (field: keyof RdSettings, value: number) => {
    setRd((prev) => ({ ...prev, [field]: value }))
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

    if (teamsOn) {
      for (let t = 0; t < numTeams; t++) {
        if (!teamOf.includes(t)) errs.push(`Team ${t + 1} needs at least one player`)
      }
    }

    if (variantId === 'rd') {
      const whole = (n: number) => Number.isInteger(n)
      if (!whole(rd.target) || rd.target < 1) errs.push('Target must be a whole number above 0')
      if (!whole(rd.redValue) || rd.redValue < 1) errs.push('Red ball value must be a whole number above 0')
      if (!whole(rd.minAttempts) || rd.minAttempts < 0) errs.push('Minimum red attempts must be 0 or more')
      if (!whole(rd.minPots) || rd.minPots < 0) errs.push('Minimum red pots must be 0 or more')
      if (rd.minPots > rd.minAttempts) errs.push('Minimum red pots cannot be more than minimum attempts')
    }

    setErrors(errs)
    return errs.length === 0
  }

  const handleStartGame = (breaker = firstPlayerIndex) => {
    if (!validate()) return

    const names = playerNames.slice(0, numPlayers).map((n) => n.trim())
    onGameStart(
      createInitialGameState(names, teamsOn ? teamOf : undefined, breaker, {
        variant: variantId,
        rd: variantId === 'rd' ? rd : undefined,
      })
    )
  }

  return (
    <div className="game-setup">
      <h1>New Game</h1>
      <p className="subtitle">Choose a game, add players and start the match</p>

      <section className="setup-section">
        <h2>Game</h2>
        <div className="variant-grid">
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`variant-card ${variantId === v.id ? 'active' : ''}`}
              aria-pressed={variantId === v.id}
              onClick={() => handleVariantChange(v.id)}
            >
              <span className="variant-name">{v.name}</span>
              <span className="variant-summary">{v.summary}</span>
            </button>
          ))}
        </div>
      </section>

      {playerCounts.length > 1 && (
        <section className="setup-section">
          <h2>Number of Players</h2>
          <div className="player-count">
            {playerCounts.map((n) => (
              <button
                key={n}
                type="button"
                className={numPlayers === n ? 'active' : ''}
                aria-label={`${n} players`}
                aria-pressed={numPlayers === n}
                onClick={() => applyPlayerCount(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </section>
      )}

      {teamsAllowed && (
        <section className="setup-section">
          <h2>Play As</h2>
          <div className="player-count">
            <button type="button" className={!useTeams ? 'active' : ''} aria-pressed={!useTeams} onClick={() => setUseTeams(false)}>
              Individuals
            </button>
            <button type="button" className={useTeams ? 'active' : ''} aria-pressed={useTeams} onClick={() => setUseTeams(true)}>
              Teams
            </button>
          </div>
          {useTeams && maxTeams(numPlayers) > 2 && (
            <div className="input-group setup-hint">
              <label htmlFor="num-teams">Number of teams</label>
              <select
                id="num-teams"
                value={numTeams}
                onChange={(e) => applyPlayerCount(numPlayers, Number(e.target.value))}
              >
                {Array.from({ length: maxTeams(numPlayers) - 1 }, (_, i) => i + 2).map((n) => (
                  <option key={n} value={n}>
                    {n} teams
                  </option>
                ))}
              </select>
            </div>
          )}
          {useTeams && <p className="setup-hint">Teams take turns at the table; players rotate within their team.</p>}
        </section>
      )}

      {variantId === 'rd' && (
        <section className="setup-section">
          <h2>RD Settings</h2>
          <div className="settings-grid">
            <div className="input-group">
              <label htmlFor="rd-target">Target points</label>
              <input
                id="rd-target"
                type="number"
                min={1}
                list="rd-targets"
                value={rd.target}
                onChange={(e) => updateRd('target', Number(e.target.value))}
              />
              <datalist id="rd-targets">
                <option value={100} />
                <option value={200} />
                <option value={500} />
              </datalist>
            </div>
            <div className="input-group">
              <label htmlFor="rd-red">Red ball value</label>
              <input
                id="rd-red"
                type="number"
                min={1}
                list="rd-red-values"
                value={rd.redValue}
                onChange={(e) => updateRd('redValue', Number(e.target.value))}
              />
              <datalist id="rd-red-values">
                <option value={10} />
                <option value={15} />
              </datalist>
            </div>
            <div className="input-group">
              <label htmlFor="rd-attempts">Minimum red attempts</label>
              <input
                id="rd-attempts"
                type="number"
                min={0}
                value={rd.minAttempts}
                onChange={(e) => updateRd('minAttempts', Number(e.target.value))}
              />
            </div>
            <div className="input-group">
              <label htmlFor="rd-pots">Minimum red pots</label>
              <input
                id="rd-pots"
                type="number"
                min={0}
                value={rd.minPots}
                onChange={(e) => updateRd('minPots', Number(e.target.value))}
              />
            </div>
          </div>
          <p className="setup-hint">
            A player wins on reaching the target once they have made the minimum attempts and pots. Missing the red costs
            its value.
          </p>
        </section>
      )}

      <section className="setup-section">
        <h2>Player Names</h2>
        <div className="player-inputs">
          {Array.from({ length: numPlayers }).map((_, i) => (
            <div key={i} className="player-row">
              <div className="input-group">
                <label htmlFor={`player-${i}`}>Player {i + 1}</label>
                <input
                  id={`player-${i}`}
                  type="text"
                  value={playerNames[i] ?? ''}
                  onChange={(e) => updatePlayerName(i, e.target.value)}
                  placeholder={`Player ${i + 1} name`}
                  maxLength={MAX_NAME_LENGTH}
                  autoComplete="off"
                />
              </div>
              {teamsOn && (
                <div className="input-group team-select">
                  <label htmlFor={`team-${i}`}>Team</label>
                  <select id={`team-${i}`} value={teamOf[i] ?? 0} onChange={(e) => updateTeam(i, Number(e.target.value))}>
                    {Array.from({ length: numTeams }, (_, t) => (
                      <option key={t} value={t}>
                        Team {t + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
                onChange={() => chooseFirstPlayer(i)}
              />
              <span>{playerNames[i]?.trim() || `Player ${i + 1}`}</span>
            </label>
          ))}
          <button type="button" className="shuffle-btn" onClick={() => shuffleFirstPlayer()}>
            Shuffle
          </button>
        </div>
        {shuffled && (
          <p className="setup-hint" role="status">
            Shuffled: {playerNames[firstPlayerIndex]?.trim() || `Player ${firstPlayerIndex + 1}`} breaks.
          </p>
        )}
      </section>

      {errors.length > 0 && (
        <div className="errors" role="alert">
          {errors.map((e, i) => (
            <p key={i}>{e}</p>
          ))}
        </div>
      )}

      <div className="start-actions">
        <button type="button" className="start-btn" onClick={() => handleStartGame()}>
          Start Game
        </button>
        <button type="button" className="start-btn shuffle-start-btn" onClick={handleShuffleAndStart}>
          Shuffle &amp; Start
        </button>
      </div>
    </div>
  )
}
