interface HeaderProps {
  gameNumber: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onShowHelp: () => void;
}

export function Header({ gameNumber, theme, onToggleTheme, onShowHelp }: HeaderProps) {
  return (
    <header className="header">
      <div className="header__side header__side--left">
        <button type="button" className="icon-button" aria-label="Jak grać" onClick={onShowHelp}>
          <HelpIcon />
        </button>
      </div>
      <div className="header__title">
        <h1>Wordziel Plus</h1>
        <p className="header__subtitle">Gra nr {gameNumber}</p>
      </div>
      <div className="header__side header__side--right">
        <button
          type="button"
          className="icon-button"
          aria-label={theme === 'dark' ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'}
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
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

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4.5" />
      <path
        strokeLinecap="round"
        d="M12 2v2.5M12 19.5V22M22 12h-2.5M4.5 12H2M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8M18.7 18.7l-1.8-1.8M7.1 7.1 5.3 5.3"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
    </svg>
  );
}
