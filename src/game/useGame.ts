import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { evaluateGuess, mergeKeyboardState } from './evaluate';
import { isValidWord, pickRandomAnswer, RECENT_HISTORY_SIZE } from './words';
import { loadRecentAnswers, nextGameNumber, pushRecentAnswer } from './storage';
import { getGameMode } from './modes';
import type { GameModeId } from './modes';
import { findHardModeViolation } from './hardMode';
import type { GameStatus, GuessRow, LetterState } from './types';

const REVEAL_STEP_MS = 300;
const MESSAGE_TIMEOUT_MS = 1500;

export type HintVariant = 'offer' | 'revealed' | 'unavailable';

function normalize(letter: string): string {
  return letter.toUpperCase();
}

export function useGame(modeId: GameModeId) {
  const { wordLength, maxGuesses, hardMode } = getGameMode(modeId);

  // nextGameNumber() mutates localStorage, so it can't live in a useState
  // initializer: React StrictMode's dev-only double-render would invoke it
  // twice and burn a game number. A ref guard makes the increment run
  // exactly once per mount even under that double-render.
  const initial = useRef<{ answer: string; definition: string | null; gameNumber: number } | null>(null);
  if (initial.current === null) {
    const entry = pickRandomAnswer(loadRecentAnswers(modeId), modeId);
    initial.current = {
      answer: entry.word,
      definition: entry.definition,
      gameNumber: nextGameNumber(modeId),
    };
  }
  const [answer, setAnswer] = useState<string>(initial.current.answer);
  const [definition, setDefinition] = useState<string | null>(initial.current.definition);
  const [gameNumber, setGameNumber] = useState<number>(initial.current.gameNumber);
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [status, setStatus] = useState<GameStatus>('playing');
  const [message, setMessage] = useState<string | null>(null);
  const [revealingRow, setRevealingRow] = useState<number | null>(null);
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [hintChoice, setHintChoice] = useState<'pending' | 'accepted' | 'declined'>('pending');
  const [hintLetter, setHintLetter] = useState<string | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const keyboardState = useMemo(() => {
    let state: Record<string, LetterState> = {};
    for (const row of guesses) {
      state = mergeKeyboardState(state, row);
    }
    return state;
  }, [guesses]);

  // Letters of the answer the player hasn't identified yet -- never
  // guessed `correct` or `present` for that letter. A letter that's part
  // of the answer always ends up `correct` or `present` in keyboardState
  // the moment it's guessed at all (evaluateGuess never leaves a
  // same-guess duplicate as the *only* record for a letter that's really
  // in the answer), so "missing from keyboardState" is exactly "unknown".
  const unknownLetters = useMemo(() => {
    const distinct = Array.from(new Set(answer.split('')));
    return distinct.filter((letter) => keyboardState[letter] !== 'correct' && keyboardState[letter] !== 'present');
  }, [answer, keyboardState]);

  // The hint only makes sense on the guess the player is about to submit
  // as their last one, and only while the game is still undecided.
  const isLastAttempt = status === 'playing' && revealingRow === null && guesses.length === maxGuesses - 1;

  // How many board positions are already pinned down by a `correct`
  // guess -- counted per *position*, not per distinct letter, so a
  // repeated letter (e.g. the two O's in ŁOMOT) contributes one slot for
  // each occurrence it's been placed at, not just one for the letter.
  const correctPositionsCount = useMemo(() => {
    const positions = new Set<number>();
    for (const row of guesses) {
      row.forEach(({ state }, index) => {
        if (state === 'correct') positions.add(index);
      });
    }
    return positions.size;
  }, [guesses]);

  // Distinct letters known to be in the word but not yet placed.
  const presentLettersCount = useMemo(
    () => Object.values(keyboardState).filter((state) => state === 'present').length,
    [keyboardState],
  );

  // Revealing a hint should only be blocked when it would leave the
  // player with no real ambiguity left. Comparing unknownLetters.length
  // to a flat threshold overcounts how "solved" a word is once it has a
  // repeated letter: e.g. for ŁOMOT (distinct letters Ł, O, M, T) with O
  // placed and T/M known-but-unplaced, only Ł is a genuinely new distinct
  // letter -- but the player still doesn't know that O repeats, so
  // learning Ł wouldn't hand them the arrangement. What actually matters
  // is how many board slots aren't yet accounted for by *any* identified
  // letter (correct-placed or present-but-unplaced): if 2+ remain
  // unaccounted for, there's still real uncertainty even after the hint.
  const remainingUnknownSlots = wordLength - correctPositionsCount - presentLettersCount;

  const hintVariant = useMemo<HintVariant | null>(() => {
    if (!isLastAttempt) return null;
    if (unknownLetters.length === 0 || remainingUnknownSlots <= 1) return 'unavailable';
    if (hintChoice === 'declined') return null;
    if (hintChoice === 'accepted') return 'revealed';
    return 'offer';
  }, [isLastAttempt, unknownLetters.length, remainingUnknownSlots, hintChoice]);

  const acceptHint = useCallback(() => {
    if (hintChoice !== 'pending' || unknownLetters.length === 0) return;
    const letter = unknownLetters[Math.floor(Math.random() * unknownLetters.length)];
    setHintLetter(letter);
    setHintChoice('accepted');
  }, [hintChoice, unknownLetters]);

  const declineHint = useCallback(() => {
    setHintChoice('declined');
  }, []);

  const showMessage = useCallback((text: string, timeout = MESSAGE_TIMEOUT_MS) => {
    if (messageTimer.current) clearTimeout(messageTimer.current);
    setMessage(text);
    if (timeout > 0) {
      messageTimer.current = setTimeout(() => setMessage(null), timeout);
    }
  }, []);

  const startNewGame = useCallback(() => {
    const recent = pushRecentAnswer(answer, RECENT_HISTORY_SIZE, modeId);
    const entry = pickRandomAnswer(recent, modeId);
    setAnswer(entry.word);
    setDefinition(entry.definition);
    setGameNumber(nextGameNumber(modeId));
    setGuesses([]);
    setCurrentGuess('');
    setStatus('playing');
    setMessage(null);
    setRevealingRow(null);
    setShakeRow(null);
    setHintChoice('pending');
    setHintLetter(null);
    // startNewGame intentionally omits `answer` from deps below; it reads
    // the current answer once per call to record it as "just played".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer, modeId, wordLength]);

  // Same word, fresh guesses: used when the player wants another attempt
  // at the word they just failed, from the lose overlay.
  const retrySameWord = useCallback(() => {
    setGuesses([]);
    setCurrentGuess('');
    setStatus('playing');
    setMessage(null);
    setRevealingRow(null);
    setShakeRow(null);
    setHintChoice('pending');
    setHintLetter(null);
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
    if (!isValidWord(currentGuess, modeId)) {
      showMessage('Słowo nie znajduje się na liście');
      setShakeRow(guesses.length);
      setTimeout(() => setShakeRow(null), 600);
      return;
    }

    if (hardMode) {
      const violation = findHardModeViolation(currentGuess, guesses, wordLength);
      if (violation) {
        showMessage(violation);
        setShakeRow(guesses.length);
        setTimeout(() => setShakeRow(null), 600);
        return;
      }
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
      } else if (rowIndex + 1 >= maxGuesses) {
        setStatus('lost');
      }
    }, revealDuration);
  }, [status, revealingRow, currentGuess, answer, guesses, showMessage, wordLength, modeId, maxGuesses, hardMode]);

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
    definition,
    gameNumber,
    guesses,
    currentGuess,
    status,
    message,
    revealingRow,
    shakeRow,
    keyboardState,
    hintVariant,
    hintLetter,
    acceptHint,
    declineHint,
    addLetter,
    removeLetter,
    submitGuess,
    startNewGame,
    retrySameWord,
  };
}
