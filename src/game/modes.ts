import type { WordLength } from './types';

export type GameModeId = 'classic' | 'archaic' | 'extended';

export interface GameModeConfig {
  id: GameModeId;
  wordLength: WordLength;
  title: string;
  description: string;
}

// Klasyczny and Archaizmy currently draw from the same 5-letter answers
// pool (src/data/answers.json) -- Archaizmy is a placeholder mode until a
// genuinely rare/archaic word list is curated. They're still tracked as
// distinct modes (separate recent-answers history and game counter, see
// storage.ts) so that curation can happen later without touching UI code.
export const GAME_MODES: GameModeConfig[] = [
  { id: 'classic', wordLength: 5, title: 'Klasyczny', description: 'Popularne polskie słowa. 6 prób.' },
  { id: 'archaic', wordLength: 5, title: 'Archaizmy', description: 'Rzadkie, staropolskie słowa.' },
  { id: 'extended', wordLength: 6, title: 'Rozszerzony', description: 'Dłuższe słowo, większe wyzwanie.' },
];

const GAME_MODES_BY_ID: Record<GameModeId, GameModeConfig> = Object.fromEntries(
  GAME_MODES.map((mode) => [mode.id, mode]),
) as Record<GameModeId, GameModeConfig>;

export function getGameMode(id: GameModeId): GameModeConfig {
  return GAME_MODES_BY_ID[id];
}

export function isGameModeId(value: string): value is GameModeId {
  return value in GAME_MODES_BY_ID;
}
