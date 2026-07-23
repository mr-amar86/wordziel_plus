import { Tile } from './Tile';
import { MAX_GUESSES, WORD_LENGTH } from '../game/types';
import type { GuessRow } from '../game/types';

interface BoardProps {
  guesses: GuessRow[];
  currentGuess: string;
  revealingRow: number | null;
  shakeRow: number | null;
  won: boolean;
}

const REVEAL_STEP_MS = 300;

export function Board({ guesses, currentGuess, revealingRow, shakeRow, won }: BoardProps) {
  const rows = Array.from({ length: MAX_GUESSES }, (_, rowIndex) => {
    const completed = guesses[rowIndex];
    const isCurrent = rowIndex === guesses.length;
    const isRevealing = rowIndex === revealingRow;
    const isShaking = rowIndex === shakeRow;
    const isWinningRow = won && rowIndex === guesses.length - 1 && revealingRow === null;

    const letters = completed
      ? completed.map((l) => l.letter)
      : isCurrent
        ? currentGuess.padEnd(WORD_LENGTH, ' ').split('')
        : new Array(WORD_LENGTH).fill(' ');

    const rowClasses = ['board__row'];
    if (isShaking) rowClasses.push('board__row--shake');
    if (isWinningRow) rowClasses.push('board__row--bounce');

    return (
      <div className={rowClasses.join(' ')} key={rowIndex}>
        {letters.map((letter, colIndex) => (
          <Tile
            key={colIndex}
            letter={letter.trim()}
            state={completed?.[colIndex]?.state}
            revealing={isRevealing}
            revealDelayMs={colIndex * REVEAL_STEP_MS}
            filled={letter.trim().length > 0}
          />
        ))}
      </div>
    );
  });

  return <div className="board">{rows}</div>;
}
