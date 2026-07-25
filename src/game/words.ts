import answers5Data from '../data/answers.json';
import validGuesses5Data from '../data/validGuesses.json';
import answers6Data from '../data/answers6.json';
import validGuesses6Data from '../data/validGuesses6.json';
import answersArchaicData from '../data/answersArchaic.json';
import validGuessesArchaicData from '../data/validGuessesArchaic.json';
import type { GameModeId } from './modes';

// An answer entry pairs the word with an optional definition. Definitions
// are authored inline in the answers*.json source files as
// "SŁOWO (definicja)" -- parsed once at load time -- rather than as a
// separate JSON structure, so word lists stay a flat, easy-to-hand-edit
// list of strings. Only modes with genuinely obscure words (Archaizmy)
// need definitions; classic/extended entries have none and parse to
// `definition: null`.
export interface AnswerEntry {
  word: string;
  definition: string | null;
}

function parseAnswerEntry(raw: string): AnswerEntry {
  const match = raw.match(/^(.*?)\s*\((.*)\)\s*$/);
  if (match) {
    return { word: match[1].trim(), definition: match[2].trim() };
  }
  return { word: raw.trim(), definition: null };
}

// Answers: curated pool the random target is drawn from, per game mode.
// Valid guesses: much larger superset used only to check "is this a real
// word". Each mode has its own pair of lists -- Klasyczny and Rozszerzony
// differ only by word length, but Archaizmy draws from a wholly separate,
// hand-curated rare/archaic word list even though it shares Klasyczny's
// 5-letter length.
const ANSWER_ENTRIES: Record<GameModeId, readonly AnswerEntry[]> = {
  classic: (answers5Data as string[]).map(parseAnswerEntry),
  archaic: (answersArchaicData as string[]).map(parseAnswerEntry),
  extended: (answers6Data as string[]).map(parseAnswerEntry),
};

// The answer pool's own words are folded into the valid-guess set so a
// player can always submit the actual answer, even for Archaizmy words
// that predate/are missing from the modern Hunspell-derived dictionary
// validGuessesArchaic.json is built from.
const VALID_GUESSES: Record<GameModeId, ReadonlySet<string>> = {
  classic: new Set(validGuesses5Data as string[]),
  archaic: new Set([
    ...(validGuessesArchaicData as string[]),
    ...ANSWER_ENTRIES.archaic.map((entry) => entry.word),
  ]),
  extended: new Set(validGuesses6Data as string[]),
};

// How many previous answers to avoid repeating immediately. Kept isolated
// here (rather than inline in a component) so word selection can move
// server-side later without touching UI code, e.g. to stop answer-peeking
// via devtools once this becomes a public/shared-word mode.
export const RECENT_HISTORY_SIZE = 20;

export function isValidWord(guess: string, modeId: GameModeId): boolean {
  return VALID_GUESSES[modeId].has(guess.toUpperCase());
}

export function pickRandomAnswer(recentAnswers: readonly string[], modeId: GameModeId): AnswerEntry {
  const excluded = new Set(recentAnswers);
  const pool = ANSWER_ENTRIES[modeId].filter((entry) => !excluded.has(entry.word));
  const candidates = pool.length > 0 ? pool : ANSWER_ENTRIES[modeId];
  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}
