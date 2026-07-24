interface HeaderProps {
  gameNumber: number;
  modeTitle: string;
  onChangeMode: () => void;
  onShowHelp: () => void;
}

export function Header({ gameNumber, modeTitle, onChangeMode, onShowHelp }: HeaderProps) {
  return (
    <header className="header">
      <div className="header__side header__side--left">
        <button type="button" className="icon-button" aria-label="Jak grać" onClick={onShowHelp}>
          <HelpIcon />
        </button>
      </div>
      <div className="header__title">
        <h1>Wordziel Plus</h1>
        <p className="header__subtitle">
          Gra nr {gameNumber} · {modeTitle}{' '}
          <button type="button" className="header__mode-switch" onClick={onChangeMode}>
            Zmień
          </button>
        </p>
      </div>
      <div className="header__side header__side--right" />
    </header>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}
