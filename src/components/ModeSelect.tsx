import type { WordLength } from '../game/types';

interface ModeSelectProps {
  onSelect: (wordLength: WordLength) => void;
}

export function ModeSelect({ onSelect }: ModeSelectProps) {
  return (
    <div className="mode-select">
      <p className="mode-select__prompt">Wybierz długość słowa</p>
      <div className="mode-select__buttons">
        <button type="button" className="mode-select__button" onClick={() => onSelect(5)}>
          5 liter
        </button>
        <button type="button" className="mode-select__button" onClick={() => onSelect(6)}>
          6 liter
        </button>
      </div>
    </div>
  );
}
