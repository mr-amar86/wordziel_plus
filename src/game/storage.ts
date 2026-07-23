import type { WordLength } from './types';

const THEME_KEY = 'wordzielplus:theme';
const LAST_MODE_KEY = 'wordzielplus:lastMode';
const RECENT_ANSWERS_KEY_PREFIX = 'wordzielplus:recentAnswers:';
const GAME_NUMBER_KEY_PREFIX = 'wordzielplus:gameNumber:';

export type Theme = 'dark' | 'light';

export function loadTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'light' ? 'light' : 'dark';
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function loadLastMode(): WordLength | null {
  const stored = localStorage.getItem(LAST_MODE_KEY);
  return stored === '5' || stored === '6' ? Number(stored) as WordLength : null;
}

export function saveLastMode(wordLength: WordLength): void {
  localStorage.setItem(LAST_MODE_KEY, String(wordLength));
}

export function loadRecentAnswers(wordLength: WordLength): string[] {
  try {
    const raw = localStorage.getItem(RECENT_ANSWERS_KEY_PREFIX + wordLength);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function pushRecentAnswer(word: string, historySize: number, wordLength: WordLength): string[] {
  const current = loadRecentAnswers(wordLength);
  const next = [word, ...current].slice(0, historySize);
  localStorage.setItem(RECENT_ANSWERS_KEY_PREFIX + wordLength, JSON.stringify(next));
  return next;
}

// Cosmetic per-browser game counter shown in the header subtitle. Not a
// stats system: it tracks nothing about outcomes, only how many games have
// been started on this device. Tracked separately per word length since
// 5-letter and 6-letter are really two separate games.
export function nextGameNumber(wordLength: WordLength): number {
  const key = GAME_NUMBER_KEY_PREFIX + wordLength;
  const current = Number(localStorage.getItem(key) ?? '0');
  const next = current + 1;
  localStorage.setItem(key, String(next));
  return next;
}

export function currentGameNumber(wordLength: WordLength): number {
  return Number(localStorage.getItem(GAME_NUMBER_KEY_PREFIX + wordLength) ?? '0');
}
