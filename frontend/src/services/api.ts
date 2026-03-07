/**
 * API client for Smart Snooker Scoring backend
 * Uses /api prefix - Vite proxy forwards to backend
 */

const API_BASE = '/api'

export interface GameStartRequest {
  num_players: number
  player_names: string[]
  team_assignments?: (string | null)[]
  first_player_index?: number
}

export interface GameStartResponse {
  game_id: string
  message: string
  state?: GameState
}

export interface GameState {
  id: string
  mode: string
  players: { id: string; name: string; score: number; teamId?: string }[]
  teams: { id: string; name: string; playerIds: string[]; score: number }[]
  currentPlayerIndex: number
  redsRemaining: number
  currentBreak: number
  lastPottedColor?: string
  ballOn?: string
  events: { id: string; type: string; playerId: string; ball?: string; points: number; timestamp: string; description?: string; ballOn?: string; ballInvolved?: string }[]
  status: string
  createdAt: string
  canUndo?: boolean
}

export async function startGame(request: GameStartRequest): Promise<GameStartResponse> {
  const res = await fetch(`${API_BASE}/game/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Failed to start game')
  }
  return res.json()
}

export async function getGameState(gameId: string): Promise<GameState> {
  const res = await fetch(`${API_BASE}/game/state/${gameId}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

function extractErrorDetail(err: { detail?: string | string[] }): string {
  const d = err.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d) && d.length > 0) return String(d[0])
  return 'Invalid pot'
}

export async function registerPot(gameId: string, ball: string): Promise<GameState> {
  const res = await fetch(`${API_BASE}/game/${gameId}/pot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ball }),
  })
  if (!res.ok) {
    const text = await res.text()
    let err: { detail?: string | string[] }
    try {
      err = JSON.parse(text)
    } catch {
      err = { detail: text }
    }
    throw new Error(extractErrorDetail(err))
  }
  return res.json()
}

export async function recordFoul(gameId: string, ballInvolved: string): Promise<GameState> {
  const res = await fetch(`${API_BASE}/game/${gameId}/foul`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ball_involved: ballInvolved }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function changeTurn(gameId: string): Promise<GameState> {
  const res = await fetch(`${API_BASE}/game/${gameId}/turn`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function undoLastAction(gameId: string): Promise<GameState> {
  const res = await fetch(`${API_BASE}/game/${gameId}/undo`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function resetGame(gameId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/game/${gameId}/reset`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(await res.text())
}
