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
          <p>
            Strona korzysta z Google Analytics wyłącznie po to, by policzyć
            liczbę odwiedzin i rozegranych gier — to zanonimizowane,
            zbiorcze statystyki, nie pojedyncze profile użytkowników. Google
            Analytics może zapisywać w przeglądarce pliki cookie.
            Statystyki te nie są sprzedawane ani udostępniane serwisom
            reklamowym, a strona nie wyświetla żadnych reklam. Zbieranie
            statystyk można zablokować w ustawieniach przeglądarki lub za
            pomocą{' '}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noreferrer"
            >
              dodatku blokującego Google Analytics
            </a>
            .
          </p>

          <h3>O aplikacji</h3>
          <p>
            zgadu-zgadu to niezależna gra słowna inspirowana Wordle, tworzona
            jako projekt hobbystyczny.
          </p>
        </div>
      </div>
    </div>
  );
}
