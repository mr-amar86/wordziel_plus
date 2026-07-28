import { HelpIcon, InfoIcon } from './icons';

interface HeaderProps {
  gameNumber: number;
  modeTitle: string;
  onChangeMode: () => void;
  onShowHelp: () => void;
  onShowInfo: () => void;
}

export function Header({ gameNumber, modeTitle, onChangeMode, onShowHelp, onShowInfo }: HeaderProps) {
  return (
    <header className="header">
      <div className="header__side header__side--left">
        <button type="button" className="icon-button" aria-label="Jak grać" onClick={onShowHelp}>
          <HelpIcon />
        </button>
        <button type="button" className="icon-button" aria-label="Informacje" onClick={onShowInfo}>
          <InfoIcon />
        </button>
      </div>
      <div className="header__title">
        <h1>zgadu-zgadu</h1>
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
