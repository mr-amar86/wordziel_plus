import answersData from '../data/answers.json';
import validGuessesData from '../data/validGuesses.json';

// Answers: curated common-word pool the random target is drawn from.
// Valid guesses: much larger superset used only to check "is this a real word".
export const ANSWERS: readonly string[] = answersData;
const VALID_GUESSES: ReadonlySet<string> = new Set(validGuessesData as string[]);

// How many previous answers to avoid repeating immediately. Kept isolated
// here (rather than inline in a component) so word selection can move
// server-side later without touching UI code, e.g. to stop answer-peeking
// via devtools once this becomes a public/shared-word mode.
export const RECENT_HISTORY_SIZE = 20;

export function isValidWord(guess: string): boolean {
  return VALID_GUESSES.has(guess.toUpperCase());
}

export function pickRandomAnswer(recentAnswers: readonly string[]): string {
  const excluded = new Set(recentAnswers);
  const pool = ANSWERS.filter((word) => !excluded.has(word));
  const candidates = pool.length > 0 ? pool : ANSWERS;
  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}
