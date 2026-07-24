import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { evaluateGuess, mergeKeyboardState } from './evaluate';
import { isValidWord, pickRandomAnswer, RECENT_HISTORY_SIZE } from './words';
import { loadRecentAnswers, nextGameNumber, pushRecentAnswer } from './storage';
import { getGameMode } from './modes';
import type { GameModeId } from './modes';
import { MAX_GUESSES } from './types';
import type { GameStatus, GuessRow, LetterState } from './types';

const REVEAL_STEP_MS = 300;
const MESSAGE_TIMEOUT_MS = 1500;

function normalize(letter: string): string {
  return letter.toUpperCase();
}

export function useGame(modeId: GameModeId) {
  const { wordLength } = getGameMode(modeId);

  // nextGameNumber() mutates localStorage, so it can't live in a useState
  // initializer: React StrictMode's dev-only double-render would invoke it
  // twice and burn a game number. A ref guard makes the increment run
  // exactly once per mount even under that double-render.
  const initial = useRef<{ answer: string; gameNumber: number } | null>(null);
  if (initial.current === null) {
    initial.current = {
      answer: pickRandomAnswer(loadRecentAnswers(modeId), wordLength),
      gameNumber: nextGameNumber(modeId),
    };
  }
  const [answer, setAnswer] = useState<string>(initial.current.answer);
  const [gameNumber, setGameNumber] = useState<number>(initial.current.gameNumber);
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [status, setStatus] = useState<GameStatus>('playing');
  const [message, setMessage] = useState<string | null>(null);
  const [revealingRow, setRevealingRow] = useState<number | null>(null);
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const keyboardState = useMemo(() => {
    let state: Record<string, LetterState> = {};
    for (const row of guesses) {
      state = mergeKeyboardState(state, row);
    }
    return state;
  }, [guesses]);

  const showMessage = useCallback((text: string, timeout = MESSAGE_TIMEOUT_MS) => {
    if (messageTimer.current) clearTimeout(messageTimer.current);
    setMessage(text);
    if (timeout > 0) {
      messageTimer.current = setTimeout(() => setMessage(null), timeout);
    }
  }, []);

  const startNewGame = useCallback(() => {
    const recent = pushRecentAnswer(answer, RECENT_HISTORY_SIZE, modeId);
    setAnswer(pickRandomAnswer(recent, wordLength));
    setGameNumber(nextGameNumber(modeId));
    setGuesses([]);
    setCurrentGuess('');
    setStatus('playing');
    setMessage(null);
    setRevealingRow(null);
    setShakeRow(null);
    // startNewGame intentionally omits `answer` from deps below; it reads
    // the current answer once per call to record it as "just played".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer, modeId, wordLength]);

  // Same word, fresh 6 guesses: used when the player wants another attempt
  // at the word they just failed, from the lose overlay.
  const retrySameWord = useCallback(() => {
    setGuesses([]);
    setCurrentGuess('');
    setStatus('playing');
    setMessage(null);
    setRevealingRow(null);
    setShakeRow(null);
  }, []);

  const addLetter = useCallback(
    (letter: string) => {
      if (status !== 'playing' || revealingRow !== null) return;
      setCurrentGuess((word) => (word.length < wordLength ? word + normalize(letter) : word));
    },
    [status, revealingRow, wordLength],
  );

  const removeLetter = useCallback(() => {
    if (status !== 'playing' || revealingRow !== null) return;
    setCurrentGuess((word) => word.slice(0, -1));
  }, [status, revealingRow]);

  const submitGuess = useCallback(() => {
    if (status !== 'playing' || revealingRow !== null) return;
    if (currentGuess.length < wordLength) {
      showMessage('Za mało liter');
      setShakeRow(guesses.length);
      setTimeout(() => setShakeRow(null), 600);
      return;
    }
    if (!isValidWord(currentGuess, wordLength)) {
      showMessage('Słowo nie znajduje się na liście');
      setShakeRow(guesses.length);
      setTimeout(() => setShakeRow(null), 600);
      return;
    }

    const evaluated = evaluateGuess(currentGuess, answer);
    const rowIndex = guesses.length;
    setGuesses((rows) => [...rows, evaluated]);
    setRevealingRow(rowIndex);
    setCurrentGuess('');

    const revealDuration = wordLength * REVEAL_STEP_MS + 300;
    setTimeout(() => {
      setRevealingRow(null);
      if (currentGuess === answer) {
        setStatus('won');
      } else if (rowIndex + 1 >= MAX_GUESSES) {
        setStatus('lost');
      }
    }, revealDuration);
  }, [status, revealingRow, currentGuess, answer, guesses.length, showMessage, wordLength]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key;
      if (key === 'Enter') {
        submitGuess();
      } else if (key === 'Backspace') {
        removeLetter();
      } else if (/^[a-zA-Ząćęłńóśźż]$/i.test(key)) {
        addLetter(key);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [submitGuess, removeLetter, addLetter]);

  return {
    answer,
    gameNumber,
    guesses,
    currentGuess,
    status,
    message,
    revealingRow,
    shakeRow,
    keyboardState,
    addLetter,
    removeLetter,
    submitGuess,
    startNewGame,
    retrySameWord,
  };
}
