# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Wordzielplus: a single-player, Polish-language Wordle clone. Static Vite +
React + TypeScript SPA, no backend, no accounts, no multiplayer, no
stats/streak tracking. Word lists are bundled as JSON and read entirely
client-side. Deploys as static files (Firebase Hosting on GCP).

Differences from the original Wordle: no daily-word limit (every "new
game" click picks a fresh random word, avoiding immediate repeats via a
recent-answers history), a choice of three game modes picked on landing
(5-letter "Klasyczny", 5-letter "Archaizmy", 6-letter "Rozszerzony"), a
single dark theme (no light mode), and "present" letters are light blue
instead of yellow. 6 guesses and the exact Wordle duplicate-letter
coloring rule are otherwise preserved.

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

Word *length* (`WordLength`) and game *mode* (`GameModeId`) are separate
axes — see `src/game/modes.ts`. The "Archaizmy" mode currently points at
the same `wordLength: 5` as "Klasyczny", so it draws from the same
`answers.json`/`validGuesses.json` pair; it's a placeholder until a
genuinely rare/archaic word list is curated, kept as a distinct mode
(own recent-answers history, own game counter) so that curation can
happen later without touching UI code.

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
- `modes.ts` — the `GameModeId` (`'classic' | 'archaic' | 'extended'`)
  registry: `GAME_MODES` is the ordered list `ModeSelect` renders as
  cards, `getGameMode(id)` resolves a mode's `wordLength`/title/
  description. This is the single source of truth for what modes exist —
  adding a fourth mode is adding an entry here, not touching `ModeSelect.tsx`.
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

`GameModeId` (`src/game/modes.ts`) is `'classic' | 'archaic' | 'extended'`;
each resolves to a `WordLength` via `getGameMode()`. `MAX_GUESSES` stays a
fixed constant (6 guesses regardless of mode). There is deliberately no
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
  the result to `Board`/`Keyboard`/etc., resolving `wordLength`/`title`
  from `getGameMode(modeId)` for `Board` (grid sizing), `Header` (subtitle)
  and `HowToPlayModal` (intro text — the three example tile rows stay
  fixed at 5 tiles regardless of mode; they're just an illustration of
  the coloring rule, not a live board).
- The header's "Zmień" link next to `Gra nr N · {modeTitle}` calls
  `onChangeMode`, which sets `mode` back to `null` — this abandons the
  in-progress game with no confirmation prompt, by design.
- `Board.tsx` sets `--word-length` as an inline CSS custom property; `App.css`'s
  `.board__row` reads it via `grid-template-columns: repeat(var(--word-length), ...)`
  in both the base and the `max-width: 380px` rule. Don't reintroduce a
  hardcoded `repeat(5, ...)` there.
