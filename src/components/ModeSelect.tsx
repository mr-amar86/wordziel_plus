import { GAME_MODES } from '../game/modes';
import type { GameModeId } from '../game/modes';

interface ModeSelectProps {
  onSelect: (modeId: GameModeId) => void;
}

export function ModeSelect({ onSelect }: ModeSelectProps) {
  return (
    <div className="mode-select">
      <h1 className="mode-select__title">Wordziel Plus</h1>
      <p className="mode-select__subtitle">Wybierz tryb gry</p>
      <div className="mode-select__list">
        {GAME_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className="mode-select__card"
            onClick={() => onSelect(mode.id)}
          >
            <span className="mode-select__badge">{mode.wordLength}</span>
            <span className="mode-select__text">
              <span className="mode-select__card-title">{mode.title}</span>
              <span className="mode-select__card-desc">{mode.description}</span>
            </span>
            <ChevronIcon />
          </button>
        ))}
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="mode-select__chevron"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
