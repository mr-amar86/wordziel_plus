import type { WordLength } from './types';

export type GameModeId = 'classic' | 'archaic' | 'extended' | 'hard';

export interface GameModeConfig {
  id: GameModeId;
  wordLength: WordLength;
  maxGuesses: number;
  hardMode: boolean;
  title: string;
  description: string;
  hidden?: boolean;
}

// Klasyczny, Archaizmy, and Trudny currently draw from the same 5-letter
// answers pool (src/data/answers.json) -- Archaizmy is a placeholder mode
// until a genuinely rare/archaic word list is curated, and Trudny is
// Klasyczny's word pool with hard-mode constraints layered on top. They're
// still tracked as distinct modes (separate recent-answers history and game
// counter, see storage.ts) so word-pool sharing can change independently of
// UI code.
//
// maxGuesses is per-mode rather than a fixed constant: Rozszerzony's
// 6-letter word gets a 7th guess to offset the larger search space, while
// the rest keep the standard 6.
//
// hardMode gates the constraint enforced in useGame.submitGuess (via
// findHardModeViolation, src/game/hardMode.ts): once a letter is revealed
// `correct` or `present`, every later guess in that game must reuse it
// (green stays pinned to its position, yellow must reappear somewhere) --
// the standard Wordle "Hard Mode" rule. Only Trudny opts in.
export const GAME_MODES: GameModeConfig[] = [
  { id: 'classic', wordLength: 5, maxGuesses: 6, hardMode: false, title: 'Klasyczny', description: 'Popularne polskie słowa. 6 prób.' },
  { id: 'hard', wordLength: 5, maxGuesses: 6, hardMode: true, title: 'Trudny', description: 'Odkryte litery musisz wykorzystać w kolejnych próbach.' },
  { id: 'extended', wordLength: 6, maxGuesses: 7, hardMode: false, title: 'Rozszerzony', description: 'Dłuższe słowo, większe wyzwanie. 7 prób.' },
  { id: 'archaic', wordLength: 5, maxGuesses: 6, hardMode: false, title: 'Archaizmy', description: 'Rzadkie, staropolskie słowa.', hidden: true },
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
