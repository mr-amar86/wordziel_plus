export type LetterState = 'correct' | 'present' | 'absent';

export interface EvaluatedLetter {
  letter: string;
  state: LetterState;
}

export type GuessRow = EvaluatedLetter[];

export type GameStatus = 'playing' | 'won' | 'lost';

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;
