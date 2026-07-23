import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { Keyboard } from './components/Keyboard';
import { Toast } from './components/Toast';
import { LossChoice } from './components/LossChoice';
import { HowToPlayModal } from './components/HowToPlayModal';
import { useGame } from './game/useGame';
import { loadTheme, saveTheme, type Theme } from './game/storage';
import './App.css';

function App() {
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [showHelp, setShowHelp] = useState(false);
  const game = useGame();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  const inputDisabled = game.status !== 'playing' || game.revealingRow !== null;
  const settled = game.status !== 'playing' && game.revealingRow === null;
  const awaitingLossChoice = settled && game.status === 'lost' && !game.answerRevealed;
  const showNewGameButton = settled && !awaitingLossChoice;

  return (
    <div className="app">
      <Header
        gameNumber={game.gameNumber}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onShowHelp={() => setShowHelp(true)}
      />

      <main className="main">
        <Toast message={game.message} />
        <Board
          guesses={game.guesses}
          currentGuess={game.currentGuess}
          revealingRow={game.revealingRow}
          shakeRow={game.shakeRow}
          won={game.status === 'won'}
        />
        {awaitingLossChoice ? (
          <LossChoice onRetry={game.retrySameWord} onReveal={game.revealAnswer} />
        ) : null}
        {showNewGameButton ? (
          <button type="button" className="new-game-button" onClick={game.startNewGame}>
            Nowa gra
          </button>
        ) : null}
        <Keyboard
          keyboardState={game.keyboardState}
          onKey={game.addLetter}
          onEnter={game.submitGuess}
          onBackspace={game.removeLetter}
          disabled={inputDisabled}
        />
      </main>

      {showHelp ? <HowToPlayModal onClose={() => setShowHelp(false)} /> : null}
    </div>
  );
}

export default App;
