import type { CSSProperties } from 'react';

interface GameEndOverlayProps {
  status: 'won' | 'lost';
  word: string;
  guessCount: number;
  onPlayAgain: () => void;
  onChangeMode: () => void;
}

function triesLabel(count: number): string {
  return count === 1 ? 'w 1 próbie' : `w ${count} próbach`;
}

export function GameEndOverlay({ status, word, guessCount, onPlayAgain, onChangeMode }: GameEndOverlayProps) {
  const won = status === 'won';

  return (
    <div className="game-end-overlay">
      <div className="game-end-overlay__card">
        <h2 className="game-end-overlay__title">
          {won ? 'Gratulacje! 🎉' : 'Tym razem się nie udało'}
        </h2>

        <div
          className={`game-end-overlay__word ${won ? 'game-end-overlay__word--won' : 'game-end-overlay__word--lost'}`}
          style={{ '--word-length': word.length } as CSSProperties}
        >
          {word.split('').map((letter, index) => (
            <span className="game-end-overlay__tile" key={index}>
              {letter}
            </span>
          ))}
        </div>

        <p className="game-end-overlay__meta">
          {won ? `Odgadnięte ${triesLabel(guessCount)}` : `Szukane słowo to: ${word}`}
        </p>

        <div className="game-end-overlay__actions">
          <button type="button" className="game-end-overlay__button game-end-overlay__button--primary" onClick={onPlayAgain}>
            {won ? 'Zagraj ponownie' : 'Spróbuj ponownie'}
          </button>
          <button type="button" className="game-end-overlay__button game-end-overlay__button--ghost" onClick={onChangeMode}>
            Wybierz inny tryb
          </button>
        </div>
      </div>
    </div>
  );
}
