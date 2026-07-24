import { isGameModeId } from './modes';
import type { GameModeId } from './modes';

const LAST_MODE_KEY = 'wordzielplus:lastMode';
const RECENT_ANSWERS_KEY_PREFIX = 'wordzielplus:recentAnswers:';
const GAME_NUMBER_KEY_PREFIX = 'wordzielplus:gameNumber:';

export function loadLastMode(): GameModeId | null {
  const stored = localStorage.getItem(LAST_MODE_KEY);
  return stored && isGameModeId(stored) ? stored : null;
}

export function saveLastMode(modeId: GameModeId): void {
  localStorage.setItem(LAST_MODE_KEY, modeId);
}

export function loadRecentAnswers(modeId: GameModeId): string[] {
  try {
    const raw = localStorage.getItem(RECENT_ANSWERS_KEY_PREFIX + modeId);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function pushRecentAnswer(word: string, historySize: number, modeId: GameModeId): string[] {
  const current = loadRecentAnswers(modeId);
  const next = [word, ...current].slice(0, historySize);
  localStorage.setItem(RECENT_ANSWERS_KEY_PREFIX + modeId, JSON.stringify(next));
  return next;
}

// Cosmetic per-browser game counter shown in the header subtitle. Not a
// stats system: it tracks nothing about outcomes, only how many games have
// been started on this device. Tracked separately per mode since each is
// effectively a separate game.
export function nextGameNumber(modeId: GameModeId): number {
  const key = GAME_NUMBER_KEY_PREFIX + modeId;
  const current = Number(localStorage.getItem(key) ?? '0');
  const next = current + 1;
  localStorage.setItem(key, String(next));
  return next;
}

export function currentGameNumber(modeId: GameModeId): number {
  return Number(localStorage.getItem(GAME_NUMBER_KEY_PREFIX + modeId) ?? '0');
}
