import answers5Data from '../data/answers.json';
import validGuesses5Data from '../data/validGuesses.json';
import answers6Data from '../data/answers6.json';
import validGuesses6Data from '../data/validGuesses6.json';
import type { WordLength } from './types';

// Answers: curated common-word pool the random target is drawn from, per
// word length. Valid guesses: much larger superset used only to check "is
// this a real word".
const ANSWERS: Record<WordLength, readonly string[]> = {
  5: answers5Data,
  6: answers6Data,
};
const VALID_GUESSES: Record<WordLength, ReadonlySet<string>> = {
  5: new Set(validGuesses5Data as string[]),
  6: new Set(validGuesses6Data as string[]),
};

// How many previous answers to avoid repeating immediately. Kept isolated
// here (rather than inline in a component) so word selection can move
// server-side later without touching UI code, e.g. to stop answer-peeking
// via devtools once this becomes a public/shared-word mode.
export const RECENT_HISTORY_SIZE = 20;

export function isValidWord(guess: string, wordLength: WordLength): boolean {
  return VALID_GUESSES[wordLength].has(guess.toUpperCase());
}

export function pickRandomAnswer(recentAnswers: readonly string[], wordLength: WordLength): string {
  const excluded = new Set(recentAnswers);
  const pool = ANSWERS[wordLength].filter((word) => !excluded.has(word));
  const candidates = pool.length > 0 ? pool : ANSWERS[wordLength];
  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}
