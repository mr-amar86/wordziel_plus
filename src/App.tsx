import { useState } from 'react';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { Keyboard } from './components/Keyboard';
import { Toast } from './components/Toast';
import { GameEndOverlay } from './components/GameEndOverlay';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ModeSelect } from './components/ModeSelect';
import { useGame } from './game/useGame';
import { loadLastMode, saveLastMode } from './game/storage';
import { getGameMode } from './game/modes';
import type { GameModeId } from './game/modes';
import './App.css';

interface GameScreenProps {
  modeId: GameModeId;
  onChangeMode: () => void;
}

function GameScreen({ modeId, onChangeMode }: GameScreenProps) {
  const [showHelp, setShowHelp] = useState(false);
  const game = useGame(modeId);
  const { wordLength, title } = getGameMode(modeId);

  const inputDisabled = game.status !== 'playing' || game.revealingRow !== null;
  const settled = game.status !== 'playing' && game.revealingRow === null;

  return (
    <div className="app">
      <Header
        gameNumber={game.gameNumber}
        modeTitle={title}
        onChangeMode={onChangeMode}
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
        <Keyboard
          keyboardState={game.keyboardState}
          onKey={game.addLetter}
          onEnter={game.submitGuess}
          onBackspace={game.removeLetter}
          disabled={inputDisabled}
        />
      </main>

      {showHelp ? <HowToPlayModal wordLength={wordLength} onClose={() => setShowHelp(false)} /> : null}

      {settled ? (
        <GameEndOverlay
          status={game.status === 'won' ? 'won' : 'lost'}
          word={game.answer}
          guessCount={game.guesses.length}
          onPlayAgain={game.status === 'won' ? game.startNewGame : game.retrySameWord}
          onChangeMode={onChangeMode}
        />
      ) : null}
    </div>
  );
}

function App() {
  const [mode, setMode] = useState<GameModeId | null>(() => loadLastMode());

  if (mode === null) {
    return (
      <ModeSelect
        onSelect={(modeId) => {
          saveLastMode(modeId);
          setMode(modeId);
        }}
      />
    );
  }

  return <GameScreen key={mode} modeId={mode} onChangeMode={() => setMode(null)} />;
}

export default App;
