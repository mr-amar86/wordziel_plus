# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Wordzielplus: a single-player, Polish-language Wordle clone. Static Vite +
React + TypeScript SPA, no backend, no accounts, no multiplayer, no
stats/streak tracking. Word lists are bundled as JSON and read entirely
client-side. Deploys as static files (Firebase Hosting on GCP).

Differences from the original Wordle: no daily-word limit (every "new
game" click picks a fresh random word, avoiding immediate repeats via a
recent-answers history), a choice of 5-letter or 6-letter word length
picked on landing, and "present" letters are light blue instead of
yellow. 6 guesses and the exact Wordle duplicate-letter coloring rule are
otherwise preserved.

## Commands

```bash
npm install
npm run dev       # Vite dev server, http://localhost:5173
npm run build      # tsc -b type-check, then vite build -> dist/
npm run preview    # serve the production build locally
npm run lint       # oxlint (see .oxlintrc.json)
```

There is no test suite/test runner configured.

### Regenerating the word lists

```bash
pip install -r scripts/wordlists/requirements.txt
python scripts/wordlists/generate.py
```

Rewrites all four files in `src/data/`: `answers.json` / `validGuesses.json`
(5-letter) and `answers6.json` / `validGuesses6.json` (6-letter), from
source dictionaries (downloads are cached under
`scripts/wordlists/.cache/`, gitignored). The expensive Hunspell-unmunch
step (`build_all_forms()`) runs once and is filtered per length in
`WORD_LENGTHS`, so adding a third length is a one-line change to that
list, not a new pipeline. Full pipeline explanation and licensing for
each source is in `scripts/wordlists/WORDLISTS.md` — read that before
changing `ANSWERS_SIZE` or the profanity blocklist, both defined near the
top of `generate.py`.

### Deploying

`firebase.json` + `.firebaserc` are set up for Firebase Hosting.
`.firebaserc`'s project ID is a placeholder (`REPLACE-WITH-YOUR-GCP-PROJECT-ID`)
until pointed at a real project via `firebase use --add`. Deploy with
`npm run build && firebase deploy --only hosting`. Full walkthrough in
`README.md`.

## Architecture

### Two word lists per length, deliberately separate (`src/game/words.ts`)

Each supported `WordLength` (`src/game/types.ts`, currently `5 | 6`) has
its own pair of lists, indexed by length in `words.ts`'s `ANSWERS` /
`VALID_GUESSES` records:

- `src/data/answers.json` / `answers6.json` (~3,000 words each) —
  curated common words; the *only* pool `pickRandomAnswer(recent,
  wordLength)` draws the target from.
- `src/data/validGuesses.json` / `validGuesses6.json` (~29,800 /
  ~67,400 words) — much larger superset, including obscure words;
  `isValidWord(guess, wordLength)` checks submitted guesses against the
  matching one. A guess can be a real word here without ever being a
  possible answer.

All four are generated from the same Polish Hunspell dictionary via
`scripts/wordlists/generate.py`; the `answers*.json` files are
additionally filtered by word frequency and a profanity blocklist
(applied only to the answer pool — profanity remains a *valid guess*,
exactly like real Wordle).

### Game logic lives in `src/game/`, isolated from UI on purpose

- `evaluate.ts` — `evaluateGuess()` is the two-pass Wordle coloring
  algorithm (green pass consumes the answer's letter pool first, then a
  left-to-right pass marks remaining letters `present`/`absent` against
  what's left — this is what makes duplicate-letter handling exact).
  `mergeKeyboardState()` folds evaluated guesses into the on-screen
  keyboard's per-letter state, never downgrading a letter once it hits
  `correct`.
- `words.ts` — word selection + guess validation, both parametrized by
  `WordLength`. Kept separate from components deliberately: if this ever
  becomes a public shared-word mode, word selection can move server-side
  (Cloud Function) without touching any component — that's the seam
  where answer-peeking prevention would be added later.
- `useGame.ts` — `useGame(wordLength)`, the single hook holding all game
  state (answer, guesses, current guess, status, keyboard state,
  reveal/shake animation timing, toast message) and the physical-keyboard
  `keydown` listener. `wordLength` is fixed for the hook's lifetime; a
  mode switch remounts it (see below) rather than mutating it in place.
  `App.tsx`'s `GameScreen` is mostly just wiring this hook's return value
  to components.
- `storage.ts` — the only `localStorage` access: theme, the last-played
  `WordLength` (`loadLastMode`/`saveLastMode`), and, keyed per word
  length, recent-answers history (repeat avoidance) and a cosmetic
  per-browser game counter (`Gra nr N` in the header) — 5-letter and
  6-letter each get their own counter and history since they're
  effectively two separate games. Deliberately has no stats/outcome data
  model — don't add one without being asked; it's out of scope for this
  version by design.

### Post-loss flow is a three-state branch, not just win/lose

On a loss, `useGame` does **not** auto-reveal the answer. `status`
becomes `'lost'` but `answerRevealed` stays `false`, and `App.tsx` renders
`LossChoice` (retry vs. reveal) instead of the `Nowa gra` button:

- **Retry** (`retrySameWord()`) resets guesses/keyboard but keeps the same
  `answer` and does not touch `gameNumber` or the recent-answers history
  — it's a re-attempt of the same puzzle, not a new game.
- **Reveal** (`revealAnswer()`) sets `answerRevealed = true` and shows the
  answer via the toast; only then does the `Nowa gra` button appear.

`App.tsx`'s `awaitingLossChoice` / `showNewGameButton` booleans encode
exactly this branch — check both before assuming "game over" means one
thing.

### React StrictMode gotcha in `useGame.ts`

`nextGameNumber()` mutates `localStorage`, so it cannot live in a
`useState` lazy initializer directly — dev-mode StrictMode double-invokes
those and would burn a game number every mount. The `initial` ref-guard
pattern at the top of `useGame()` (compute once into a ref, seed
`useState` from the ref) exists specifically to survive that double-render.
Keep this pattern if adding more one-time side-effecting init logic.

### Animation timing is duration-matched between CSS and JS

Reveal is a per-tile CSS 3D-flip (`@keyframes flip-correct/present/absent`
in `App.css`), staggered left-to-right via inline `animation-delay`
(`Tile.tsx`'s `revealDelayMs`, computed in `Board.tsx` as
`colIndex * REVEAL_STEP_MS`). `useGame.ts`'s `submitGuess()` computes a
matching `revealDuration` (`wordLength * REVEAL_STEP_MS + 300`) and uses
it as the `setTimeout` before flipping `status` to won/lost — the two
constants must stay in sync if either changes. Because the multiplier is
now the per-game `wordLength` instead of a fixed constant, 6-letter games
have a proportionally longer reveal before the win/loss state lands.

### Theme handling is duplicated by necessity

Theme (`dark`/`light`) is persisted to `localStorage` under
`wordzielplus:theme`. It's read and applied to `<html data-theme>` twice:
once synchronously in an inline `<script>` in `index.html` (to avoid a
flash of the wrong theme before React mounts), and again in `App.tsx`'s
`useEffect` (to react to the in-app toggle and persist changes). CSS
variables are keyed off `[data-theme='dark' | 'light']` in `index.css`,
not `prefers-color-scheme` — the app always defaults to dark regardless
of OS theme, per product decision.

### Word length is selectable (5 or 6), threaded as a prop — not global state

`WordLength` (`src/game/types.ts`) is `5 | 6`; `MAX_GUESSES` stays a fixed
constant (6 guesses regardless of mode). There is deliberately no global
"current word length" — it's a plain prop threaded from `App.tsx` down,
because `useGame(wordLength)` calls `useState`/`useRef` internally and
can't be called conditionally, so word length can't just be a piece of
state read inside one always-mounted hook.

- `App.tsx` holds `mode: WordLength | null` (`null` = show the picker).
  It reads `loadLastMode()` on mount, so a returning player skips straight
  to their last mode; `null` only happens on a genuinely first visit or
  after explicitly switching modes.
- When `mode` is `null`, `App` renders `Header` (no game number, no help
  icon) + `ModeSelect` (the "5 liter" / "6 liter" landing buttons).
  Otherwise it renders `<GameScreen key={mode} wordLength={mode} .../>` —
  the `key` guarantees a full remount (fresh `useGame` call, fresh
  `initial` ref-guard) on every mode change, which is what makes the
  React-StrictMode-safe pattern above still correct here.
- `GameScreen` (defined in `App.tsx`, not split into its own file) is what
  the old flat `App.tsx` used to be: it calls `useGame(wordLength)` and
  wires the result to `Board`/`Keyboard`/etc. `wordLength` also passes
  straight through to `Board` (grid sizing) and `HowToPlayModal` (intro
  text — the three example tile rows stay fixed at 5 tiles regardless of
  mode; they're just an illustration of the coloring rule, not a live
  board).
- The header's "Zmień" link next to `Gra nr N · {wordLength} liter` calls
  `onChangeMode`, which sets `mode` back to `null` — this abandons the
  in-progress game with no confirmation prompt, by design.
- `Board.tsx` sets `--word-length` as an inline CSS custom property; `App.css`'s
  `.board__row` reads it via `grid-template-columns: repeat(var(--word-length), ...)`
  in both the base and the `max-width: 380px` rule. Don't reintroduce a
  hardcoded `repeat(5, ...)` there.
