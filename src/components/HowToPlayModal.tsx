import type { WordLength } from '../game/types';

interface HowToPlayModalProps {
  wordLength: WordLength;
  onClose: () => void;
}

const LENGTH_ADJECTIVE: Record<WordLength, string> = {
  5: 'pięcioliterowym',
  6: 'sześcioliterowym',
};

export function HowToPlayModal({ wordLength, onClose }: HowToPlayModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Jak grać</h2>
          <button type="button" className="icon-button" aria-label="Zamknij" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal__body">
          <p>Odgadnij słowo w 6 próbach. Każda próba musi być prawdziwym, {LENGTH_ADJECTIVE[wordLength]} słowem.</p>
          <p>Po każdej próbie kolor płytek pokaże, jak blisko byłeś odpowiedzi.</p>

          <div className="modal__example">
            <div className="board__row">
              <div className="tile tile--correct"><span className="tile__inner">R</span></div>
              <div className="tile"><span className="tile__inner">Y</span></div>
              <div className="tile"><span className="tile__inner">B</span></div>
              <div className="tile"><span className="tile__inner">A</span></div>
              <div className="tile"><span className="tile__inner">K</span></div>
            </div>
          </div>
          <p>Litera <strong>R</strong> jest w słowie i na właściwym miejscu.</p>

          <div className="modal__example">
            <div className="board__row">
              <div className="tile"><span className="tile__inner">P</span></div>
              <div className="tile tile--present"><span className="tile__inner">L</span></div>
              <div className="tile"><span className="tile__inner">O</span></div>
              <div className="tile"><span className="tile__inner">T</span></div>
              <div className="tile"><span className="tile__inner">R</span></div>
            </div>
          </div>
          <p>Litera <strong>L</strong> jest w słowie, ale na innym miejscu.</p>

          <div className="modal__example">
            <div className="board__row">
              <div className="tile"><span className="tile__inner">C</span></div>
              <div className="tile"><span className="tile__inner">Z</span></div>
              <div className="tile"><span className="tile__inner">A</span></div>
              <div className="tile tile--absent"><span className="tile__inner">S</span></div>
              <div className="tile"><span className="tile__inner">Y</span></div>
            </div>
          </div>
          <p>Litera <strong>S</strong> nie występuje w słowie.</p>

          <p className="modal__note">
            Nowa gra losuje nowe słowo za każdym razem — bez limitu dziennego i bez statystyk.
          </p>
        </div>
      </div>
    </div>
  );
}
