import type { EvaluatedLetter, LetterState } from './types';

// Standard Wordle two-pass algorithm: green letters consume their pool slot
// first, then remaining letters are matched left-to-right against what's left,
// so a letter is never marked more times than it appears in the answer.
export function evaluateGuess(guess: string, answer: string): EvaluatedLetter[] {
  const guessLetters = guess.split('');
  const answerLetters = answer.split('');
  const states: LetterState[] = new Array(guessLetters.length).fill('absent');
  const pool = new Map<string, number>();

  for (const letter of answerLetters) {
    pool.set(letter, (pool.get(letter) ?? 0) + 1);
  }

  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] === answerLetters[i]) {
      states[i] = 'correct';
      pool.set(guessLetters[i], (pool.get(guessLetters[i]) ?? 0) - 1);
    }
  }

  for (let i = 0; i < guessLetters.length; i++) {
    if (states[i] === 'correct') continue;
    const letter = guessLetters[i];
    const remaining = pool.get(letter) ?? 0;
    if (remaining > 0) {
      states[i] = 'present';
      pool.set(letter, remaining - 1);
    } else {
      states[i] = 'absent';
    }
  }

  return guessLetters.map((letter, i) => ({ letter, state: states[i] }));
}

const STATE_PRIORITY: Record<LetterState, number> = {
  absent: 0,
  present: 1,
  correct: 2,
};

// Merges a guess's evaluated letters into the running best-known keyboard
// state. Never downgrades a letter (e.g. a confirmed 'correct' stays
// 'correct' even if a later guess would otherwise mark it 'absent').
export function mergeKeyboardState(
  current: Record<string, LetterState>,
  evaluated: EvaluatedLetter[],
): Record<string, LetterState> {
  const next = { ...current };
  for (const { letter, state } of evaluated) {
    const existing = next[letter];
    if (!existing || STATE_PRIORITY[state] > STATE_PRIORITY[existing]) {
      next[letter] = state;
    }
  }
  return next;
}
