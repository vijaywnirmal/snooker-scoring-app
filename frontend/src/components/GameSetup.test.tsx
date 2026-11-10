/**
 * GameSetup component tests
 * User Stories 1.1, 1.2, 1.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GameSetup from './GameSetup'
const mockOnGameStart = vi.fn()

function renderGameSetup() {
  return render(<GameSetup onGameStart={mockOnGameStart} />)
}

describe('GameSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders setup form with the game catalogue', () => {
    renderGameSetup()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('New Game')
    for (const name of ['Snooker', 'Doubles', 'Trace', 'RD']) {
      expect(screen.getByRole('button', { name: new RegExp('^' + name) })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: /^Shuffle\s*Pot/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start Game/i })).toBeInTheDocument()
  })

  it('shows 2 player name inputs by default', () => {
    renderGameSetup()
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(2)
  })

  it('shows 4 player inputs when 4 players is selected in Doubles', async () => {
    const user = userEvent.setup()
    renderGameSetup()
    await user.click(screen.getByRole('button', { name: /^Doubles/ }))
    await user.click(screen.getByRole('button', { name: '4 players' }))
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(4)
  })

  it('starts a Doubles game with three teams of two', async () => {
    const user = userEvent.setup()
    renderGameSetup()
    await user.click(screen.getByRole('button', { name: /^Doubles/ }))
    await user.click(screen.getByRole('button', { name: '6 players' }))
    await user.click(screen.getByRole('button', { name: 'Teams' }))
    await user.selectOptions(screen.getByLabelText('Number of teams'), '3')
    const inputs = screen.getAllByRole('textbox')
    for (const [i, name] of ['A', 'B', 'C', 'D', 'E', 'F'].entries()) {
      await user.type(inputs[i], name)
    }
    await user.click(screen.getByRole('button', { name: /Start Game/i }))

    const state = mockOnGameStart.mock.calls[0][0]
    expect(state.variant).toBe('doubles')
    expect(state.teams).toHaveLength(3)
    expect(state.teams.map((t: { playerIds: string[] }) => t.playerIds.length)).toEqual([2, 2, 2])
  })

  it('needs at least 3 players for Trace', async () => {
    const user = userEvent.setup()
    renderGameSetup()
    await user.click(screen.getByRole('button', { name: /^Trace/ }))
    expect(screen.getAllByRole('textbox')).toHaveLength(3)
    expect(screen.queryByRole('button', { name: '2 players' })).not.toBeInTheDocument()
  })

  it('starts an RD game with the agreed settings', async () => {
    const user = userEvent.setup()
    renderGameSetup()
    await user.click(screen.getByRole('button', { name: /^RD/ }))
    await user.clear(screen.getByLabelText('Target points'))
    await user.type(screen.getByLabelText('Target points'), '200')
    await user.clear(screen.getByLabelText('Red ball value'))
    await user.type(screen.getByLabelText('Red ball value'), '25')
    const inputs = screen.getAllByRole('textbox')
    await user.type(inputs[0], 'Alice')
    await user.type(inputs[1], 'Bob')
    await user.click(screen.getByRole('button', { name: /Start Game/i }))

    const state = mockOnGameStart.mock.calls[0][0]
    expect(state.variant).toBe('rd')
    expect(state.rd).toEqual({ target: 200, redValue: 25, minAttempts: 5, minPots: 3 })
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

  it('calls onGameStart with players in the chosen playing order', async () => {
    const user = userEvent.setup()

    renderGameSetup()
    const inputs = screen.getAllByRole('textbox')
    await user.type(inputs[0], 'Alice')
    await user.type(inputs[1], 'Bob')
    await user.click(screen.getByRole('button', { name: 'Move Bob up' }))
    await user.click(screen.getByRole('button', { name: /Start Game/i }))

    expect(mockOnGameStart).toHaveBeenCalledTimes(1)
    const state = mockOnGameStart.mock.calls[0][0]
    expect(state.variant).toBe('snooker')
    expect(state.mode).toBe('singles')
    expect(state.players.map((p: { name: string }) => p.name)).toEqual(['Bob', 'Alice'])
    expect(state.currentPlayerIndex).toBe(0)
    expect(state.redsRemaining).toBe(15)
    expect(state.status).toBe('active')
  })

  it('shuffles the whole playing order and still allows manual moves', async () => {
    const user = userEvent.setup()
    // Fisher–Yates with random() = 0 turns A, B, C, D into B, C, D, A
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    renderGameSetup()
    await user.click(screen.getByRole('button', { name: /^Doubles/ }))
    await user.click(screen.getByRole('button', { name: '4 players' }))
    const inputs = screen.getAllByRole('textbox')
    for (const [i, name] of ['A', 'B', 'C', 'D'].entries()) {
      await user.type(inputs[i], name)
    }

    await user.click(screen.getByRole('button', { name: 'Shuffle order' }))
    expect(screen.getByRole('status')).toHaveTextContent('B → C → D → A')

    await user.click(screen.getByRole('button', { name: 'Move A up' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Start Game/i }))

    const state = mockOnGameStart.mock.calls[0][0]
    expect(state.players.map((p: { name: string }) => p.name)).toEqual(['B', 'C', 'A', 'D'])
    random.mockRestore()
  })

  it('shuffles the order and starts the game in one step', async () => {
    const user = userEvent.setup()
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    renderGameSetup()
    const inputs = screen.getAllByRole('textbox')
    await user.type(inputs[0], 'Alice')
    await user.type(inputs[1], 'Bob')
    await user.click(screen.getByRole('button', { name: 'Shuffle & Start' }))

    expect(mockOnGameStart).toHaveBeenCalledTimes(1)
    const state = mockOnGameStart.mock.calls[0][0]
    expect(state.players.map((p: { name: string }) => p.name)).toEqual(['Bob', 'Alice'])
    expect(state.currentPlayerIndex).toBe(0)
    random.mockRestore()
  })

  it('does not shuffle and start when names are missing', async () => {
    const user = userEvent.setup()
    renderGameSetup()
    await user.click(screen.getByRole('button', { name: 'Shuffle & Start' }))
    expect(mockOnGameStart).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Player 1 name is required')
  })

  it('keeps team members together when the order is shuffled', async () => {
    const user = userEvent.setup()
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    renderGameSetup()
    await user.click(screen.getByRole('button', { name: /^Doubles/ }))
    await user.click(screen.getByRole('button', { name: '4 players' }))
    await user.click(screen.getByRole('button', { name: 'Teams' }))
    const inputs = screen.getAllByRole('textbox')
    for (const [i, name] of ['A', 'B', 'C', 'D'].entries()) {
      await user.type(inputs[i], name)
    }
    await user.click(screen.getByRole('button', { name: 'Shuffle & Start' }))

    const state = mockOnGameStart.mock.calls[0][0]
    const teamOf = (name: string) => state.players.find((p: { name: string }) => p.name === name).teamId
    expect(teamOf('A')).toBe(teamOf('B'))
    expect(teamOf('C')).toBe(teamOf('D'))
    expect(teamOf('A')).not.toBe(teamOf('C'))
    random.mockRestore()
  })

  it('starts a Shuffle game with reds shared between the players', async () => {
    const user = userEvent.setup()
    renderGameSetup()
    await user.click(screen.getByRole('button', { name: /^Shuffle\s*Pot/ }))
    await user.click(screen.getByRole('button', { name: '3 players' }))
    expect(screen.getByLabelText('Reds per player')).toHaveValue(4)
    await user.click(screen.getByRole('button', { name: '4 players' }))
    expect(screen.getByLabelText('Reds per player')).toHaveValue(3)
    const inputs = screen.getAllByRole('textbox')
    for (const [i, name] of ['A', 'B', 'C', 'D'].entries()) {
      await user.type(inputs[i], name)
    }
    await user.click(screen.getByRole('button', { name: /Start Game/i }))

    const state = mockOnGameStart.mock.calls[0][0]
    expect(state.variant).toBe('shuffle')
    expect(state.shuffle).toEqual({ redsPerPlayer: 3 })
    expect(state.frame).toBe(1)
  })

  it('rejects more reds per player than the rack holds', async () => {
    const user = userEvent.setup()
    renderGameSetup()
    await user.click(screen.getByRole('button', { name: /^Shuffle\s*Pot/ }))
    const inputs = screen.getAllByRole('textbox')
    await user.type(inputs[0], 'A')
    await user.type(inputs[1], 'B')
    await user.clear(screen.getByLabelText('Reds per player'))
    await user.type(screen.getByLabelText('Reds per player'), '8')
    await user.click(screen.getByRole('button', { name: /Start Game/i }))
    expect(mockOnGameStart).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Reds per player must be a whole number from 1 to 7')
  })
})
