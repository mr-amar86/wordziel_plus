import { useCallback, useEffect, useRef, useState } from 'react';
import { KEYBOARD_ROWS } from '../game/keyboard';
import type { LetterState } from '../game/types';

const PRESS_ANIMATION_MS = 180;

interface KeyboardProps {
  keyboardState: Record<string, LetterState>;
  hintLetter?: string | null;
  onKey: (key: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  disabled: boolean;
}

export function Keyboard({ keyboardState, hintLetter, onKey, onEnter, onBackspace, disabled }: KeyboardProps) {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(() => new Set());
  const pressTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Purely visual: a fixed-duration press pulse, independent of how long a
  // key is actually held down (mouse/touch) or of useGame's own keydown
  // listener, which handles the real game logic.
  const flashKey = useCallback((key: string) => {
    setPressedKeys((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    const existingTimer = pressTimers.current.get(key);
    if (existingTimer) clearTimeout(existingTimer);
    const timer = setTimeout(() => {
      setPressedKeys((prev) => {
        if (!prev.has(key)) return prev;
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      pressTimers.current.delete(key);
    }, PRESS_ANIMATION_MS);
    pressTimers.current.set(key, timer);
  }, []);

  useEffect(() => {
    const validKeys = new Set(KEYBOARD_ROWS.flat());
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key === 'Enter' ? 'ENTER' : event.key === 'Backspace' ? 'BACKSPACE' : event.key.toUpperCase();
      if (validKeys.has(key)) flashKey(key);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flashKey]);

  useEffect(() => {
    const timers = pressTimers.current;
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

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
            if (hintLetter && key === hintLetter) classes.push('key--hint');
            if (pressedKeys.has(key)) classes.push('key--pressed');
            return (
              <button
                key={key}
                type="button"
                className={classes.join(' ')}
                onPointerDown={() => !disabled && flashKey(key)}
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
