import type { HintVariant } from '../game/useGame';

interface HintBarProps {
  variant: HintVariant;
  hintLetter: string | null;
  onAccept: () => void;
  onDecline: () => void;
}

export function HintBar({ variant, hintLetter, onAccept, onDecline }: HintBarProps) {
  if (variant === 'unavailable') {
    return (
      <div className="hint-bar hint-bar--unavailable">
        <span className="hint-bar__unavailable-text">Podpowiedź niedostępna — zbyt blisko rozwiązania</span>
      </div>
    );
  }

  if (variant === 'revealed') {
    return (
      <div className="hint-bar hint-bar--revealed">
        <span className="hint-bar__label">Podpowiedź</span>
        <span className="hint-bar__text">
          Litera <strong className="hint-bar__letter">{hintLetter}</strong> występuje w słowie
        </span>
      </div>
    );
  }

  return (
    <div className="hint-bar hint-bar--offer">
      <span className="hint-bar__offer-text">Ostatnia próba — podświetlić literę na klawiaturze?</span>
      <div className="hint-bar__actions">
        <button type="button" className="hint-bar__button hint-bar__button--secondary" onClick={onDecline}>
          Nie
        </button>
        <button type="button" className="hint-bar__button hint-bar__button--primary" onClick={onAccept}>
          Tak
        </button>
      </div>
    </div>
  );
}
