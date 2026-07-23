import { KEYBOARD_ROWS } from '../game/keyboard';
import type { LetterState } from '../game/types';

interface KeyboardProps {
  keyboardState: Record<string, LetterState>;
  onKey: (key: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  disabled: boolean;
}

export function Keyboard({ keyboardState, onKey, onEnter, onBackspace, disabled }: KeyboardProps) {
  function handleClick(key: string) {
    if (disabled) return;
    if (key === 'ENTER') onEnter();
    else if (key === 'BACKSPACE') onBackspace();
    else onKey(key);
  }

  return (
    <div className="keyboard" aria-disabled={disabled}>
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div className="keyboard__row" key={rowIndex}>
          {row.map((key) => {
            const isWide = key === 'ENTER' || key === 'BACKSPACE';
            const state = keyboardState[key];
            const classes = ['key'];
            if (isWide) classes.push('key--wide');
            if (state) classes.push(`key--${state}`);
            return (
              <button
                key={key}
                type="button"
                className={classes.join(' ')}
                onClick={() => handleClick(key)}
                aria-label={key === 'BACKSPACE' ? 'Usuń literę' : key === 'ENTER' ? 'Zatwierdź' : key}
              >
                {key === 'BACKSPACE' ? '⌫' : key === 'ENTER' ? 'ENTER' : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
