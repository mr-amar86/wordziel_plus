# Wordzielplus

A single-player, Polish-language Wordle clone. No accounts, no
multiplayer, no leaderboard — pick a random 5-letter Polish word, guess
it in 6 tries, play again as many times as you like.

Differences from the original Wordle: no daily-word limit (every "new
game" picks a fresh random word, avoiding the last 20 answers), and
"present" letters are colored light blue instead of yellow. Everything
else — 6 guesses, real-word guess validation, the exact duplicate-letter
coloring rule, keyboard best-known-state tracking — matches Wordle.

## Running locally

Requires [Node.js](https://nodejs.org/) 20+.

```bash
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`).

Other scripts:

```bash
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build locally
npm run lint     # oxlint
```

## How it's built

- **Vite + React + TypeScript**, no backend — the word lists are static
  JSON bundled into the client. There's nothing to run server-side, so
  hosting is just "serve these static files."
- **`src/game/`** holds all game logic, isolated from the UI:
  - `evaluate.ts` — the guess-coloring algorithm (two-pass, handles
    duplicate letters exactly like Wordle) and keyboard best-state
    merging.
  - `words.ts` — word selection and guess validation. Kept separate from
    the UI on purpose: if this ever becomes a public shared-word mode,
    word selection can move to a small server/Cloud Function without
    touching any component, which is what stops answer-peeking via
    devtools (today, in single-player mode with no shared word, there's
    nothing to peek at — the whole word list is meant to be visible
    client-side).
  - `useGame.ts` — the React hook wiring state, timing (reveal
    animation, message timeouts), and physical-keyboard input together.
  - `storage.ts` — the only `localStorage` usage: theme preference,
    recent-answers history (for repeat avoidance), and a cosmetic
    per-browser game counter shown in the header subtitle. No stats or
    outcome tracking.
- **`src/data/answers.json` / `src/data/validGuesses.json`** — see
  [`scripts/wordlists/WORDLISTS.md`](scripts/wordlists/WORDLISTS.md) for
  exactly how these were generated from source dictionaries, and the
  licensing that applies to each.
- **`src/components/`** — Board, Tile, Keyboard, Header, HowToPlayModal,
  Toast. Reveal animation is a CSS 3D-flip keyframe per tile, staggered
  left to right; invalid guesses shake the current row.

## Deploying to Google Cloud (Firebase Hosting)

This is a static SPA with no server logic, so it deploys as static files
via [Firebase Hosting](https://firebase.google.com/docs/hosting) — a
GCP-backed CDN, single-command deploy, generous free tier, and no
container/server to maintain. (If you later add a server-side word
picker for a public/shared-word mode, Cloud Functions or Cloud Run can
sit behind the same Firebase project without re-platforming.)

1. **Create a GCP/Firebase project** (skip if you already have one):
   at [console.firebase.google.com](https://console.firebase.google.com),
   "Add project" — this creates (or attaches to) a GCP project of the
   same name, billable through the same GCP billing account.

2. **Install the Firebase CLI and log in**:

   ```bash
   npm install -g firebase-tools   # or use `npx firebase-tools ...` below without installing globally
   firebase login
   ```

3. **Point this repo at your project**: edit `.firebaserc` and replace
   `REPLACE-WITH-YOUR-GCP-PROJECT-ID` with your actual project ID (or run
   `firebase use --add` and pick it interactively — this rewrites
   `.firebaserc` for you).

4. **Build and deploy**:

   ```bash
   npm run build
   firebase deploy --only hosting
   ```

   The CLI prints the live URL (`https://<project-id>.web.app` by
   default). Firebase Hosting auto-provisions a free SSL cert; to use a
   custom domain, see Firebase console → Hosting → "Add custom domain."

`firebase.json` is already configured: it serves `dist/`, rewrites all
routes to `index.html` (SPA-friendly, though this app has no client-side
routing today), and long-caches the hashed `assets/` bundle.

## Word lists

See [`scripts/wordlists/WORDLISTS.md`](scripts/wordlists/WORDLISTS.md)
for sources, exact licensing terms, and how to regenerate
`answers.json` / `validGuesses.json` from scratch.

## Not included (by design, for now)

No win/streak statistics, no stats modal, no shared/daily word, no
accounts. The architecture (isolated `game/words.ts` word-selection
logic, no stats data model wired into `storage.ts`) is meant to make
adding these later straightforward without a rewrite, not to have them
half-built today.
