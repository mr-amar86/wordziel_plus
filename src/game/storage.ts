const THEME_KEY = 'wordzielplus:theme';
const RECENT_ANSWERS_KEY = 'wordzielplus:recentAnswers';
const GAME_NUMBER_KEY = 'wordzielplus:gameNumber';

export type Theme = 'dark' | 'light';

export function loadTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'light' ? 'light' : 'dark';
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function loadRecentAnswers(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_ANSWERS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function pushRecentAnswer(word: string, historySize: number): string[] {
  const current = loadRecentAnswers();
  const next = [word, ...current].slice(0, historySize);
  localStorage.setItem(RECENT_ANSWERS_KEY, JSON.stringify(next));
  return next;
}

// Cosmetic per-browser game counter shown in the header subtitle. Not a
// stats system: it tracks nothing about outcomes, only how many games have
// been started on this device.
export function nextGameNumber(): number {
  const current = Number(localStorage.getItem(GAME_NUMBER_KEY) ?? '0');
  const next = current + 1;
  localStorage.setItem(GAME_NUMBER_KEY, String(next));
  return next;
}

export function currentGameNumber(): number {
  return Number(localStorage.getItem(GAME_NUMBER_KEY) ?? '0');
}
