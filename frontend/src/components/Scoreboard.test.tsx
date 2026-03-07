/**
 * Scoreboard component tests
 * User Stories 2.1, 3.1, 4.2, 5.1, 6.1, 7.1
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Scoreboard from './Scoreboard'
import type { GameState } from '../types/game'

const mockGame: GameState = {
  id: 'game-1',
  mode: 'singles',
  players: [
    { id: 'p1', name: 'Alice', score: 10 },
    { id: 'p2', name: 'Bob', score: 5 },
  ],
  teams: [],
  currentPlayerIndex: 0,
  redsRemaining: 14,
  currentBreak: 4,
  events: [
    {
      id: 'e1',
      type: 'pot',
      playerId: 'p1',
      ball: 'blue',
      points: 5,
      timestamp: '2025-01-01T00:00:00Z',
      description: 'Alice potted blue (+5)',
    },
  ],
  status: 'active',
  createdAt: '2025-01-01T00:00:00Z',
  ballOn: 'red',
}

const mockOnPot = vi.fn().mockResolvedValue({ success: true })
const mockOnFoul = vi.fn()
const mockOnChangeTurn = vi.fn()
const mockOnUndo = vi.fn()
const mockOnReset = vi.fn()

function renderScoreboard(overrides: Partial<GameState> = {}) {
  const game = { ...mockGame, ...overrides }
  return render(
    <Scoreboard
      game={game}
      canUndo={true}
      onPot={mockOnPot}
      onFoul={mockOnFoul}
      onChangeTurn={mockOnChangeTurn}
      onUndo={mockOnUndo}
      onReset={mockOnReset}
    />
  )
}

describe('Scoreboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders player names and scores', () => {
    renderScoreboard()
    expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Bob').length).toBeGreaterThanOrEqual(1)
    const scoresSection = document.querySelector('.scores')
    expect(scoresSection).toBeInTheDocument()
    expect(scoresSection?.textContent).toContain('10')
    expect(scoresSection?.textContent).toContain('5')
  })

  it('highlights current player', () => {
    renderScoreboard()
    const playerScores = screen.getAllByText('Alice')[0].closest('.player-score')
    expect(playerScores).toHaveClass('active')
  })

  it('displays ball on, reds remaining, and current break', () => {
    renderScoreboard()
    expect(screen.getByText(/Ball on:/i)).toBeInTheDocument()
    expect(screen.getByText(/Reds remaining:/i)).toBeInTheDocument()
    expect(screen.getByText(/Current break:/i)).toBeInTheDocument()
    expect(screen.getByText('14')).toBeInTheDocument()
    expect(screen.getAllByText('4').length).toBeGreaterThanOrEqual(1)
  })

  it('displays ball pot buttons for all colours', () => {
    renderScoreboard()
    const balls = ['red', 'yellow', 'green', 'brown', 'blue', 'pink', 'black']
    balls.forEach((ball) => {
      expect(screen.getByRole('button', { name: new RegExp(ball, 'i') })).toBeInTheDocument()
    })
  })

  it('calls onPot when a ball button is clicked', async () => {
    const user = userEvent.setup()
    renderScoreboard()
    const redButtons = screen.getAllByRole('button', { name: /red/i })
    await user.click(redButtons[0])
    expect(mockOnPot).toHaveBeenCalledWith('red')
  })

  it('opens foul modal when Foul button is clicked', async () => {
    const user = userEvent.setup()
    renderScoreboard()
    expect(screen.queryByText(/Select ball involved in foul/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Foul/i }))
    expect(screen.getByText(/Select ball involved in foul/i)).toBeInTheDocument()
  })

  it('calls onFoul when cue ball is selected in foul modal', async () => {
    const user = userEvent.setup()
    renderScoreboard()
    await user.click(screen.getByRole('button', { name: /Foul/i }))
    await user.click(screen.getByRole('button', { name: /Cue ball/i }))
    expect(mockOnFoul).toHaveBeenCalledWith('cue_ball')
  })

  it('calls onChangeTurn when Change Turn is clicked', async () => {
    const user = userEvent.setup()
    renderScoreboard()
    await user.click(screen.getByRole('button', { name: /Change Turn/i }))
    expect(mockOnChangeTurn).toHaveBeenCalled()
  })

  it('calls onUndo when Undo is clicked', async () => {
    const user = userEvent.setup()
    renderScoreboard()
    await user.click(screen.getByRole('button', { name: /Undo/i }))
    expect(mockOnUndo).toHaveBeenCalled()
  })

  it('disables Undo when canUndo is false', () => {
    render(
      <Scoreboard
        game={mockGame}
        canUndo={false}
        onPot={mockOnPot}
        onFoul={mockOnFoul}
        onChangeTurn={mockOnChangeTurn}
        onUndo={mockOnUndo}
        onReset={mockOnReset}
      />
    )
    expect(screen.getByRole('button', { name: /Undo/i })).toBeDisabled()
  })

  it('displays last scoring event', () => {
    renderScoreboard()
    expect(screen.getByText(/Last scoring event/i)).toBeInTheDocument()
    const alicePotted = screen.getAllByText(/Alice potted blue/i)
    expect(alicePotted.length).toBeGreaterThanOrEqual(1)
  })

  it('displays event history', () => {
    renderScoreboard()
    expect(screen.getByText(/Event history/i)).toBeInTheDocument()
    const alicePotted = screen.getAllByText(/Alice potted blue/i)
    expect(alicePotted.length).toBeGreaterThanOrEqual(1)
  })

  it('shows No events yet when events are empty', () => {
    renderScoreboard({ events: [] })
    expect(screen.getByText(/No events yet/i)).toBeInTheDocument()
  })

  it('calls onReset when Reset Game is clicked', async () => {
    const user = userEvent.setup()
    renderScoreboard()
    await user.click(screen.getByRole('button', { name: /Reset Game/i }))
    expect(mockOnReset).toHaveBeenCalled()
  })

  it('displays team scores in 4-player mode', () => {
    const gameWithTeams: GameState = {
      ...mockGame,
      mode: 'doubles',
      teams: [
        { id: 't1', name: 'Team 1', playerIds: ['p1', 'p2'], score: 15 },
        { id: 't2', name: 'Team 2', playerIds: ['p3', 'p4'], score: 8 },
      ],
      players: [
        { id: 'p1', name: 'Alice', score: 10, teamId: 't1' },
        { id: 'p2', name: 'Bob', score: 5, teamId: 't1' },
        { id: 'p3', name: 'Carol', score: 4, teamId: 't2' },
        { id: 'p4', name: 'Dave', score: 4, teamId: 't2' },
      ],
    }
    render(
      <Scoreboard
        game={gameWithTeams}
        canUndo={false}
        onPot={mockOnPot}
        onFoul={mockOnFoul}
        onChangeTurn={mockOnChangeTurn}
        onUndo={mockOnUndo}
        onReset={mockOnReset}
      />
    )
    expect(screen.getByText('Team 1')).toBeInTheDocument()
    expect(screen.getByText('Team 2')).toBeInTheDocument()
  })
})
