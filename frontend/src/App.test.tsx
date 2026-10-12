/**
 * App tests - full scoring flow in the browser, undo, reset and persistence
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

async function startGame(user: ReturnType<typeof userEvent.setup>) {
  const inputs = screen.getAllByRole('textbox')
  await user.type(inputs[0], 'Alice')
  await user.type(inputs[1], 'Bob')
  await user.click(screen.getByRole('button', { name: /Start Game/i }))
}

function scoreOf(name: string): string | null | undefined {
  return Array.from(document.querySelectorAll('.player-score'))
    .find((el) => el.querySelector('.name')?.textContent === name)
    ?.querySelector('.score')?.textContent
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts a game and scores a pot', async () => {
    const user = userEvent.setup()
    render(<App />)
    await startGame(user)

    await user.click(screen.getByTitle('red (1 pts)'))
    expect(scoreOf('Alice')).toBe('1')
    expect(screen.getByText(/Alice potted red/, { selector: 'p' })).toBeInTheDocument()
  })

  it('counts a wrong pot as a foul for the opponent', async () => {
    const user = userEvent.setup()
    render(<App />)
    await startGame(user)

    await user.click(screen.getByTitle('black (7 pts)'))
    expect(scoreOf('Alice')).toBe('0')
    expect(scoreOf('Bob')).toBe('7')
  })

  it('undoes the last action and disables undo when nothing is left', async () => {
    const user = userEvent.setup()
    render(<App />)
    await startGame(user)

    const undo = screen.getByRole('button', { name: 'Undo' })
    expect(undo).toBeDisabled()

    await user.click(screen.getByTitle('red (1 pts)'))
    expect(undo).toBeEnabled()

    await user.click(undo)
    expect(scoreOf('Alice')).toBe('0')
    expect(undo).toBeDisabled()
  })

  it('restores the game after a reload', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await startGame(user)
    await user.click(screen.getByTitle('red (1 pts)'))
    first.unmount()

    render(<App />)
    expect(scoreOf('Alice')).toBe('1')
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled()
  })

  it('reset returns to setup and clears the saved game', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await startGame(user)
    await user.click(screen.getByRole('button', { name: /Reset Game/i }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('New Game')
    first.unmount()

    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('New Game')
  })
})
