interface InfoModalProps {
  onClose: () => void;
}

export function InfoModal({ onClose }: InfoModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Informacje</h2>
          <button type="button" className="icon-button" aria-label="Zamknij" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal__body">
          <h3>Polityka prywatności</h3>
          <p>
            zgadu-zgadu nie zbiera żadnych danych osobowych i nie korzysta z
            kont użytkowników. Postęp gry (numer gry oraz historia ostatnio
            wylosowanych słów) jest zapisywany wyłącznie lokalnie, w pamięci
            Twojej przeglądarki, i nigdy nie opuszcza Twojego urządzenia.
          </p>

          <h3>Kontakt</h3>
          <p>
            Masz pytanie, uwagę albo znalazłeś błąd? Napisz na adres:{' '}
            <strong>kontakt@zgadu-zgadu.example</strong>.
          </p>

          <h3>O aplikacji</h3>
          <p>
            zgadu-zgadu to niezależna gra słowna inspirowana Wordle, tworzona
            jako projekt hobbystyczny.
          </p>

          <p className="modal__note">To są przykładowe treści — zostaną zaktualizowane wkrótce.</p>
        </div>
      </div>
    </div>
  );
}
