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

export function trackGameWon(modeId: GameModeId): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'game_won',
    game_version: GAME_VERSION_BY_MODE[modeId],
  });
}

export function trackGameLost(modeId: GameModeId): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'game_lost',
    game_version: GAME_VERSION_BY_MODE[modeId],
  });
}

export function trackHelpOpened(): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'help_opened',
  });
}

export function trackInfoOpened(): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'info_opened',
  });
}
