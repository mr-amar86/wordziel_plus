import type { GuessRow } from './types';

interface HardModeConstraints {
  positionLetters: (string | null)[];
  minLetterCounts: Record<string, number>;
}

function computeHardModeConstraints(guesses: GuessRow[], wordLength: number): HardModeConstraints {
  const positionLetters: (string | null)[] = new Array(wordLength).fill(null);
  const minLetterCounts: Record<string, number> = {};

  for (const row of guesses) {
    const countsInRow: Record<string, number> = {};
    row.forEach(({ letter, state }, index) => {
      if (state === 'correct') {
        positionLetters[index] = letter;
      }
      if (state === 'correct' || state === 'present') {
        countsInRow[letter] = (countsInRow[letter] ?? 0) + 1;
      }
    });
    for (const letter of Object.keys(countsInRow)) {
      minLetterCounts[letter] = Math.max(minLetterCounts[letter] ?? 0, countsInRow[letter]);
    }
  }

  return { positionLetters, minLetterCounts };
}

// Standard Wordle hard-mode rules: a letter confirmed `correct` must stay in
// that position in every later guess, and a letter confirmed `correct` or
// `present` must reappear at least as many times as it was last confirmed
// (so a double letter revealed twice can't be dropped to one). Returns a
// Polish, user-facing message for the first violation found, or null if the
// guess satisfies every constraint accumulated from prior guesses.
export function findHardModeViolation(guess: string, guesses: GuessRow[], wordLength: number): string | null {
  const { positionLetters, minLetterCounts } = computeHardModeConstraints(guesses, wordLength);

  for (let i = 0; i < wordLength; i++) {
    const required = positionLetters[i];
    if (required && guess[i] !== required) {
      return `Na miejscu ${i + 1} musi być litera ${required}`;
    }
  }

  const guessCounts: Record<string, number> = {};
  for (const letter of guess) {
    guessCounts[letter] = (guessCounts[letter] ?? 0) + 1;
  }
  for (const [letter, min] of Object.entries(minLetterCounts)) {
    if ((guessCounts[letter] ?? 0) < min) {
      return `Słowo musi zawierać literę ${letter}`;
    }
  }

  return null;
}
