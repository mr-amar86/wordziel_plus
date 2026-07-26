import { useState } from 'react';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { HintBar } from './components/HintBar';
import { Keyboard } from './components/Keyboard';
import { Toast } from './components/Toast';
import { GameEndOverlay } from './components/GameEndOverlay';
import { HowToPlayModal } from './components/HowToPlayModal';
import { InfoModal } from './components/InfoModal';
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
  const { wordLength, maxGuesses, title } = getGameMode(modeId);

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
          maxGuesses={maxGuesses}
          guesses={game.guesses}
          currentGuess={game.currentGuess}
          revealingRow={game.revealingRow}
          shakeRow={game.shakeRow}
          won={game.status === 'won'}
        />
        {game.hintVariant ? (
          <HintBar
            variant={game.hintVariant}
            hintLetter={game.hintLetter}
            onAccept={game.acceptHint}
            onDecline={game.declineHint}
          />
        ) : null}
        <Keyboard
          keyboardState={game.keyboardState}
          hintLetter={game.hintVariant === 'revealed' ? game.hintLetter : null}
          onKey={game.addLetter}
          onEnter={game.submitGuess}
          onBackspace={game.removeLetter}
          disabled={inputDisabled}
        />
      </main>

      {showHelp ? (
        <HowToPlayModal wordLength={wordLength} maxGuesses={maxGuesses} onClose={() => setShowHelp(false)} />
      ) : null}

      {settled ? (
        <GameEndOverlay
          status={game.status === 'won' ? 'won' : 'lost'}
          word={game.answer}
          definition={game.definition}
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
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      {mode === null ? (
        <ModeSelect
          onSelect={(modeId) => {
            saveLastMode(modeId);
            setMode(modeId);
          }}
        />
      ) : (
        <GameScreen key={mode} modeId={mode} onChangeMode={() => setMode(null)} />
      )}

      <button
        type="button"
        className="icon-button info-button"
        aria-label="Informacje"
        onClick={() => setShowInfo(true)}
      >
        <InfoIcon />
      </button>

      {showInfo ? <InfoModal onClose={() => setShowInfo(false)} /> : null}
    </>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="11" x2="12" y2="16" strokeLinecap="round" />
      <circle cx="12" cy="7.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default App;
