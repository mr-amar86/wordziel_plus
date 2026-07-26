import type { GameModeId } from './modes';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

const GAME_VERSION_BY_MODE: Record<GameModeId, string> = {
  classic: 'klasyczny',
  hard: 'klasyczny-trudny',
  extended: '6 liter',
  archaic: 'archaizmy',
};

export function trackNewGame(modeId: GameModeId): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'new_game',
    game_version: GAME_VERSION_BY_MODE[modeId],
  });
}
