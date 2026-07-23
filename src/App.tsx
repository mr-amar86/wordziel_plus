import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { Keyboard } from './components/Keyboard';
import { Toast } from './components/Toast';
import { LossChoice } from './components/LossChoice';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ModeSelect } from './components/ModeSelect';
import { useGame } from './game/useGame';
import { loadLastMode, loadTheme, saveLastMode, saveTheme, type Theme } from './game/storage';
import type { WordLength } from './game/types';
import './App.css';

interface GameScreenProps {
  wordLength: WordLength;
  theme: Theme;
  onToggleTheme: () => void;
  onChangeMode: () => void;
}

function GameScreen({ wordLength, theme, onToggleTheme, onChangeMode }: GameScreenProps) {
  const [showHelp, setShowHelp] = useState(false);
  const game = useGame(wordLength);

  const inputDisabled = game.status !== 'playing' || game.revealingRow !== null;
  const settled = game.status !== 'playing' && game.revealingRow === null;
  const awaitingLossChoice = settled && game.status === 'lost' && !game.answerRevealed;
  const showNewGameButton = settled && !awaitingLossChoice;

  return (
    <div className="app">
      <Header
        gameNumber={game.gameNumber}
        wordLength={wordLength}
        onChangeMode={onChangeMode}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onShowHelp={() => setShowHelp(true)}
      />

      <main className="main">
        <Toast message={game.message} />
        <Board
          wordLength={wordLength}
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

      {showHelp ? <HowToPlayModal wordLength={wordLength} onClose={() => setShowHelp(false)} /> : null}
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [mode, setMode] = useState<WordLength | null>(() => loadLastMode());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  if (mode === null) {
    return (
      <div className="app">
        <Header theme={theme} onToggleTheme={toggleTheme} />
        <main className="main">
          <ModeSelect
            onSelect={(wordLength) => {
              saveLastMode(wordLength);
              setMode(wordLength);
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <GameScreen
      key={mode}
      wordLength={mode}
      theme={theme}
      onToggleTheme={toggleTheme}
      onChangeMode={() => setMode(null)}
    />
  );
}

export default App;
