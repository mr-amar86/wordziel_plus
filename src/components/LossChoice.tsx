interface LossChoiceProps {
  onRetry: () => void;
  onReveal: () => void;
}

export function LossChoice({ onRetry, onReveal }: LossChoiceProps) {
  return (
    <div className="loss-choice">
      <p className="loss-choice__prompt">Nie udało się. Co dalej?</p>
      <div className="loss-choice__buttons">
        <button type="button" className="loss-choice__button loss-choice__button--retry" onClick={onRetry}>
          Spróbuj ponownie
        </button>
        <button type="button" className="loss-choice__button loss-choice__button--reveal" onClick={onReveal}>
          Pokaż słowo
        </button>
      </div>
    </div>
  );
}
