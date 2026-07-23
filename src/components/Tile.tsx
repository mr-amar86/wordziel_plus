import type { LetterState } from '../game/types';

interface TileProps {
  letter: string;
  state?: LetterState;
  revealing?: boolean;
  revealDelayMs?: number;
  filled?: boolean;
}

export function Tile({ letter, state, revealing, revealDelayMs = 0, filled }: TileProps) {
  const classes = ['tile'];
  if (filled && !state) classes.push('tile--filled');
  if (revealing) classes.push('tile--revealing');
  if (state) classes.push(`tile--${state}`);

  return (
    <div
      className={classes.join(' ')}
      style={revealing ? { animationDelay: `${revealDelayMs}ms` } : undefined}
    >
      <span className="tile__inner" style={revealing ? { animationDelay: `${revealDelayMs}ms` } : undefined}>
        {letter}
      </span>
    </div>
  );
}
