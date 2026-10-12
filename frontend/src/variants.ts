/**
 * Catalogue of score keepers offered at game setup
 */

import type { GameVariant } from './types/game'

export interface VariantInfo {
  id: GameVariant
  name: string
  summary: string
  minPlayers: number
  maxPlayers: number
}

export const VARIANTS: VariantInfo[] = [
  {
    id: 'snooker',
    name: 'Snooker',
    summary: 'Classic two-player frame. After a foul the next player can make the fouler play again.',
    minPlayers: 2,
    maxPlayers: 2,
  },
  {
    id: 'doubles',
    name: 'Doubles',
    summary: '2 to 6 players, individually or in teams, with the same foul rule.',
    minPlayers: 2,
    maxPlayers: 6,
  },
  {
    id: 'trace',
    name: 'Trace',
    summary: 'Scores carry across frames. From frame 2 the highest scorer can sit out as safe. The last two play until one quits.',
    minPlayers: 3,
    maxPlayers: 6,
  },
  {
    id: 'rd',
    name: 'RD',
    summary: 'One high-value red, a race to a points target, and a minimum number of red attempts and pots.',
    minPlayers: 2,
    maxPlayers: 6,
  },
]

export function getVariant(id: GameVariant): VariantInfo {
  return VARIANTS.find((v) => v.id === id) ?? VARIANTS[0]
}
