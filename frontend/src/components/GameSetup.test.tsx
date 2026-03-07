/**
 * GameSetup component tests
 * User Stories 1.1, 1.2, 1.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GameSetup from './GameSetup'
import * as api from '../services/api'

vi.mock('../services/api', () => ({
  startGame: vi.fn(),
}))

const mockOnGameStart = vi.fn()

function renderGameSetup() {
  return render(<GameSetup onGameStart={mockOnGameStart} />)
}

describe('GameSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders setup form with player count options', () => {
    renderGameSetup()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('New Game')
    expect(screen.getByText('2 Players')).toBeInTheDocument()
    expect(screen.getByText('4 Players (Teams)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start Game/i })).toBeInTheDocument()
  })

  it('shows 2 player name inputs by default', () => {
    renderGameSetup()
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(2)
  })

  it('shows 4 player inputs when 4 Players is selected', async () => {
    const user = userEvent.setup()
    renderGameSetup()
    await user.click(screen.getByText('4 Players (Teams)'))
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(4)
  })

  it('shows validation error when player name is empty', async () => {
    const user = userEvent.setup()
    renderGameSetup()
    await user.click(screen.getByRole('button', { name: /Start Game/i }))
    const alerts = screen.getAllByRole('alert')
    expect(alerts.some((a) => a.textContent?.includes('Player 1 name is required'))).toBe(true)
  })

  it('shows validation error for duplicate names', async () => {
    const user = userEvent.setup()
    renderGameSetup()
    const inputs = screen.getAllByRole('textbox')
    await user.type(inputs[0], 'Alice')
    await user.type(inputs[1], 'Alice')
    await user.click(screen.getByRole('button', { name: /Start Game/i }))
    const alerts = screen.getAllByRole('alert')
    expect(alerts.some((a) => a.textContent?.includes('Player names must be unique'))).toBe(true)
  })

  it('calls onGameStart with game state when start succeeds', async () => {
    const user = userEvent.setup()
    const mockState = {
      id: 'game-1',
      mode: 'singles',
      players: [{ id: 'p1', name: 'Alice', score: 0 }, { id: 'p2', name: 'Bob', score: 0 }],
      teams: [],
      currentPlayerIndex: 0,
      redsRemaining: 15,
      currentBreak: 0,
      events: [],
      status: 'active',
      createdAt: '2025-01-01T00:00:00Z',
    }
    vi.mocked(api.startGame).mockResolvedValue({ game_id: 'game-1', message: 'ok', state: mockState })

    renderGameSetup()
    const inputs = screen.getAllByRole('textbox')
    await user.type(inputs[0], 'Alice')
    await user.type(inputs[1], 'Bob')
    await user.click(screen.getByRole('button', { name: /Start Game/i }))

    await vi.waitFor(() => {
      expect(api.startGame).toHaveBeenCalledWith({
        num_players: 2,
        player_names: ['Alice', 'Bob'],
        first_player_index: 0,
      })
    })
    expect(mockOnGameStart).toHaveBeenCalledWith(mockState)
  })

  it('shows first to break radio options', () => {
    renderGameSetup()
    expect(screen.getByText('First to Break')).toBeInTheDocument()
    const radios = screen.getAllByRole('radio')
    expect(radios.length).toBeGreaterThanOrEqual(2)
  })
})
