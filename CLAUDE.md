# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Wordzielplus: a single-player, Polish-language Wordle clone. Static Vite +
React + TypeScript SPA, no backend, no accounts, no multiplayer, no
stats/streak tracking. Word lists are bundled as JSON and read entirely
client-side. Deploys as static files (Firebase Hosting on GCP).

Differences from the original Wordle: no daily-word limit (every "new
game" click picks a fresh random word, avoiding immediate repeats via a
recent-answers history), a choice of four game modes picked on landing
(5-letter "Klasyczny", 5-letter "Archaizmy", 6-letter "Rozszerzony",
5-letter hard-mode "Trudny"), a single dark theme (no light mode), and
"present" letters are light blue instead of yellow. The exact Wordle
duplicate-letter coloring rule is otherwise preserved; guess count is
6 except Rozszerzony's 7 (see `maxGuesses` below).

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

### Two word lists per mode, deliberately separate (`src/game/words.ts`)

Each `GameModeId` (`src/game/modes.ts`) has its own pair of lists, indexed
by mode (not just word length) in `words.ts`'s `ANSWER_ENTRIES` /
`VALID_GUESSES` records — this is what lets Archaizmy have a wholly
different word pool from Klasyczny even though both are `wordLength: 5`:

- `src/data/answers.json` / `answersArchaic.json` / `answers6.json` —
  curated pools; the *only* source `pickRandomAnswer(recent, modeId)`
  draws the target from. Klasyczny/Rozszerzony have ~3,000 common words
  each with no definitions; Archaizmy is a small, hand-curated list of
  rare/archaic words, each carrying an inline definition (see below).
- `src/data/validGuesses.json` / `validGuessesArchaic.json` /
  `validGuesses6.json` — much larger superset used only to check "is
  this a real word"; `isValidWord(guess, modeId)` checks against the
  matching one. A guess can be a real word here without ever being a
  possible answer. `words.ts` unions each mode's own answer words into
  its valid-guess `Set` at load time, so an answer is always guessable
  even if the corresponding valid-guesses file doesn't otherwise contain
  it (relevant for Archaizmy, whose words may predate/be missing from
  the modern Hunspell-derived dictionary).

The Klasyczny/Rozszerzony four files are generated from the same Polish
Hunspell dictionary via `scripts/wordlists/generate.py`; the
`answers*.json` files it produces are additionally filtered by word
frequency and a profanity blocklist (applied only to the answer pool —
profanity remains a *valid guess*, exactly like real Wordle). The
Archaizmy files (`answersArchaic.json` / `validGuessesArchaic.json`) are
hand-curated instead — `generate.py` does not touch them.

#### Inline definitions for Archaizmy (`AnswerEntry`, `words.ts`)

Because Archaizmy's words are genuinely obscure, `useGame` surfaces a
definition on loss so the player learns what the word meant.
Definitions are authored *inline* in `answersArchaic.json` as plain
strings — `"SŁOWO (definicja)"` — rather than as a separate JSON
structure or lookup table, so the word list stays a flat, easy-to-edit
array a human can add to without touching code. `words.ts` parses every
answers-file entry once at load time via `parseAnswerEntry()` into an
`AnswerEntry { word, definition }`; entries with no parenthesised suffix
(all of Klasyczny/Rozszerzony's) parse to `definition: null`.
`pickRandomAnswer()` now returns the whole `AnswerEntry`, not just the
word — `useGame.ts` keeps `definition` alongside `answer` in state and
`App.tsx` passes it to `GameEndOverlay`, which renders it in a small box
under the meta line only when `status === 'lost'` and a definition is
present (`GameEndOverlay.tsx`, `.game-end-overlay__definition` in
`App.css`). If you add more archaic words, follow the same
`"SŁOWO (definicja)"` format; parentheses inside the definition text
itself are fine, only the outermost pair is treated as the delimiter.

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
- `useGame.ts` — `useGame(modeId)`, the single hook holding all game
  state (answer, guesses, current guess, status, keyboard state,
  reveal/shake animation timing, toast message) and the physical-keyboard
  `keydown` listener. It resolves `wordLength` from `modeId` via
  `getGameMode()` once at the top; `modeId` is fixed for the hook's
  lifetime, a mode switch remounts it (see below) rather than mutating it
  in place. `App.tsx`'s `GameScreen` is mostly just wiring this hook's
  return value to components.
- `modes.ts` — the `GameModeId`
  (`'classic' | 'archaic' | 'extended' | 'hard'`) registry: `GAME_MODES` is
  the ordered list `ModeSelect` renders as cards, `getGameMode(id)`
  resolves a mode's `wordLength`/`maxGuesses`/`hardMode`/title/
  description. This is the single source of truth for what modes exist —
  adding a fifth mode is adding an entry here, not touching `ModeSelect.tsx`.
- `storage.ts` — the only `localStorage` access: the last-played
  `GameModeId` (`loadLastMode`/`saveLastMode`), and, keyed per mode,
  recent-answers history (repeat avoidance) and a cosmetic per-browser
  game counter (`Gra nr N` in the header) — each mode gets its own
  counter and history since they're effectively separate games (this is
  also why Klasyczny/Archaizmy stay distinct even while sharing a word
  pool). Deliberately has no stats/outcome data model — don't add one
  without being asked; it's out of scope for this version by design.

### Game end is a full-screen overlay, answer always shown immediately on loss

`GameEndOverlay` (`src/components/GameEndOverlay.tsx`) renders whenever
`GameScreen`'s `settled` is true (`status !== 'playing' && revealingRow
=== null`), for both `'won'` and `'lost'`. There is no intermediate
"reveal or not" choice anymore — on loss the answer is shown in the
overlay's meta line unconditionally, via `game.answer`. (An earlier
version hid the answer behind a `LossChoice` retry-vs-reveal prompt with
an `answerRevealed` gate; that's gone — don't reintroduce it without
being asked.)

- `onPlayAgain` is `startNewGame` when `status === 'won'` (new random
  word, same mode) and `retrySameWord` when `'lost'` (same word, fresh
  guesses — this is why `retrySameWord` is still worth keeping distinct
  from `startNewGame` even though the reveal gate is gone: "Spróbuj
  ponownie" on a loss re-attempts the word you just saw, it doesn't
  reroll).
- `onChangeMode` is the same callback the header's "Zmień" link uses —
  both abandon the current game state and return to `ModeSelect`.
- The win/lose tile row in the overlay is a standalone rendering of
  `word`, not `Board`/`Tile` reused — it doesn't need the flip-reveal
  choreography those components carry, just a static styled row. Sizing
  mirrors `Board.tsx`'s `--word-length` CSS-custom-property trick
  (`grid-template-columns: repeat(var(--word-length), minmax(0, 46px))`)
  so it degrades gracefully for 6-letter mode instead of overflowing the
  340px card.
- The win toast flavor messages (`'Rewelacja!'`, etc.) that used to fire
  from `submitGuess` on a win are gone — the overlay's title is now the
  only win messaging. `Toast`/`message` state still exists for the
  in-progress-guess validation messages ("Za mało liter", etc.), which
  are unrelated and unaffected.

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

### Design tokens live in `index.css`, dark-only

`:root` in `src/index.css` defines the token set (`--color-bg`,
`--color-surface`, `--color-text`, `--color-accent` + its `100`–`800`
scale, `--color-neutral-100/800/900`, `--color-divider`, `--radius-sm/md/lg`,
`--shadow-sm/md/lg`) plus a block of legacy names (`--bg`, `--fg`,
`--fg-muted`, `--tile-empty-border`, `--tile-filled-border`, `--key-bg`,
`--key-fg`, `--overlay`) that are just aliases onto the tokens above —
`App.css` still reads the legacy names throughout, so re-theming happens
by editing the token values in one place, not by touching `App.css`.
There is no light theme and no toggle; a previous version had both
(`data-theme` attribute, `useEffect`-driven persistence) — don't
reintroduce that pattern without being asked.

Two exceptions deliberately aren't remapped onto the token palette:

- `--correct` / `--present` / `--absent` (tile and keyboard feedback
  colors) are semantic gameplay signal, not decoration. Restyling passes
  should leave them alone.
- Buttons are outlined, never solid-filled: transparent background, 1px
  `var(--color-accent)` border, `var(--color-accent)` text, and
  `color-mix(in srgb, var(--color-accent) 12%, transparent)` on hover
  (`.game-end-overlay__button--primary`, `.icon-button`). The
  in-game keyboard (`.key`) and tile coloring are exempt from this rule —
  they're game pieces signaling state, not general UI buttons.

Inter is loaded from Google Fonts in `index.html` at weights 400/500/700:
400 body text, 500 headings and button/link labels (`h1`, `h2` are 500
globally via `index.css`), 700 reserved for tile letters and keyboard
keys where true bold legibility matters — don't add 500-weight-only text
that ends up relying on 700 without also widening that font request.

### Game mode is selectable, threaded as a prop — not global state

`GameModeId` (`src/game/modes.ts`) is
`'classic' | 'archaic' | 'extended' | 'hard'`; each resolves to a
`WordLength`, a `maxGuesses`, and a `hardMode` flag via `getGameMode()`.
`maxGuesses` is per-mode, not a fixed constant: Klasyczny/Archaizmy/Trudny
get 6, Rozszerzony gets 7 (its 6-letter word is a bigger search space, so
it earns an extra guess) — `Board`'s row count and `useGame`'s
win/loss-on-exhaustion check both read it from `getGameMode(modeId)`
rather than a shared constant. There is deliberately no
global "current mode" — it's a plain prop threaded from `App.tsx` down,
because `useGame(modeId)` calls `useState`/`useRef` internally and can't
be called conditionally, so mode can't just be a piece of state read
inside one always-mounted hook.

- `App.tsx` holds `mode: GameModeId | null` (`null` = show the picker).
  It reads `loadLastMode()` on mount, so a returning player skips straight
  to their last mode; `null` only happens on a genuinely first visit or
  after explicitly switching modes.
- When `mode` is `null`, `App` renders `ModeSelect` full-page, standalone
  (no shared `Header` — the picker screen owns its own title/subtitle
  per the design). Otherwise it renders `<GameScreen key={mode} modeId={mode} .../>`
  — the `key` guarantees a full remount (fresh `useGame` call, fresh
  `initial` ref-guard) on every mode change, which is what makes the
  React-StrictMode-safe pattern above still correct here.
- `GameScreen` (defined in `App.tsx`, not split into its own file) is what
  the old flat `App.tsx` used to be: it calls `useGame(modeId)` and wires
  the result to `Board`/`Keyboard`/etc., resolving `wordLength`/`maxGuesses`/
  `title` from `getGameMode(modeId)` for `Board` (grid sizing and row
  count), `Header` (subtitle), and `HowToPlayModal` (intro text, including
  the try count — the three example tile rows stay fixed at 5 tiles
  regardless of mode; they're just an illustration of the coloring rule,
  not a live board). `hardMode` itself is read inside `useGame`, not
  threaded through `GameScreen` — no component needs to know about it.
- The header's "Zmień" link next to `Gra nr N · {modeTitle}` calls
  `onChangeMode`, which sets `mode` back to `null` — this abandons the
  in-progress game with no confirmation prompt, by design.
- `Board.tsx` sets `--word-length` as an inline CSS custom property; `App.css`'s
  `.board__row` reads it via `grid-template-columns: repeat(var(--word-length), ...)`
  in both the base and the `max-width: 380px` rule. Don't reintroduce a
  hardcoded `repeat(5, ...)` there.

### Trudny is Klasyczny's word pool plus a hard-mode guess constraint

`words.ts`'s `ANSWER_ENTRIES`/`VALID_GUESSES` point `hard` at the same
`CLASSIC_ANSWER_ENTRIES`/`CLASSIC_VALID_GUESSES` arrays `classic` uses
(not a copy) — Trudny isn't a different word list, its difficulty comes
entirely from `src/game/hardMode.ts`'s `findHardModeViolation()`, the
standard Wordle "Hard Mode" rule: once a letter is revealed `correct` in a
position, every later guess must repeat that letter in that exact
position; once a letter is revealed `correct` or `present` at all, every
later guess must contain it at least as many times as it was last
confirmed (so a double letter revealed twice can't be dropped to one).
`useGame.submitGuess` calls it only when `getGameMode(modeId).hardMode` is
true, after the existing length/dictionary checks and before scoring the
guess, surfacing a violation through the same `showMessage`/`shakeRow`
path as "Za mało liter" / "Słowo nie znajduje się na liście" — it's not a
new UI affordance, just a third rejection reason. If another mode ever
wants this rule, flip its `hardMode` flag in `modes.ts`; the check itself
doesn't hardcode `'hard'` anywhere.
