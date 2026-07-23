export type LetterState = 'correct' | 'present' | 'absent';

export interface EvaluatedLetter {
  letter: string;
  state: LetterState;
}

export type GuessRow = EvaluatedLetter[];

export type GameStatus = 'playing' | 'won' | 'lost';

export type WordLength = 5 | 6;

export const MAX_GUESSES = 6;
