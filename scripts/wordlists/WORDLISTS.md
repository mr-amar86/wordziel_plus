# How the word lists were built

Two files ship in `src/data/`:

- **`validGuesses.json`** (29,807 words) — every legitimate 5-letter Polish
  word found. Used only to check "is this a real word" when a guess is
  submitted.
- **`answers.json`** (3,000 words) — a curated, common-word subset of the
  above. This is the pool the random target word is drawn from.

Regenerate both with:

```bash
pip install -r scripts/wordlists/requirements.txt
python scripts/wordlists/generate.py
```

See `scripts/wordlists/generate.py` for the full pipeline; summary below.

## Sources and licensing

### 1. Polish Hunspell dictionary → `validGuesses.json`

- **Source**: `pl_PL.dic` / `pl_PL.aff`, redistributed by the LibreOffice
  project at
  [LibreOffice/dictionaries](https://github.com/LibreOffice/dictionaries/tree/master/pl_PL),
  originally sourced from [sjp.pl](https://sjp.pl) and maintained by Marek
  Futrega.
- **License**: the dictionary's own `README_en.txt` states it is
  "licensed under GPL, LGPL, MPL (Mozilla Public License), Apache 2.0 and
  Creative Commons ShareAlike licenses" — a multi-license offering where
  you may choose whichever term suits you. This project treats it under
  **MPL 2.0 / CC-BY-SA 4.0** terms: attribution given here, and the
  generation script (this file's sibling `generate.py`) is included so
  the transformation is reproducible, satisfying the copyleft licenses'
  intent even though they weren't strictly required.
- **Transform applied**: the raw dictionary lists ~349,000 stems with
  Hunspell affix flags (e.g. `kot/N,s,T`). The build script expands each
  stem into its inflected surface forms ("unmunching") by applying the
  `.aff` file's prefix/suffix rules directly (spylls, a pure-Python
  Hunspell reimplementation, parses the `.aff`/`.dic` files but doesn't
  expose a bulk-dump API, so the expansion logic lives in
  `generate.py`). Results are filtered to 5-letter words, and entries
  whose original stem was capitalized (proper nouns, acronyms like
  `ASCII`/`ANOVA` that spellcheckers whitelist) are dropped by keeping
  only lowercase-original entries before uppercasing everything for the
  game.
- **Known limitation**: only one level of suffix/prefix application is
  performed (plus one prefix+suffix crossproduct combination), not full
  recursive affix chaining. This misses a small number of valid inflected
  forms; it does not produce invalid ones.

### 2. `hermitdave/FrequencyWords` → answer curation

- **Source**: [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords),
  `content/2018/pl/pl_full.txt` — word frequency counts from the
  OpenSubtitles Polish corpus.
- **License**: MIT for the generation code, **CC-BY-SA 4.0** for the
  generated content (per the repo's own README). This project's
  `answers.json` is a filtered/intersected derivative of that content, so
  it is likewise offered under CC-BY-SA 4.0 — attribution above, and any
  redistribution of `answers.json` on its own should carry the same
  notice.
- **How it's used**: 5-letter tokens are ranked by frequency, intersected
  with `validGuesses.json` (so only dictionary-real words qualify —
  filters out typos/foreign words/OCR noise common in subtitle corpora),
  run through a small profanity-root blocklist (applied to the answers
  pool only — real words matching those roots remain valid guesses, they
  just never become the target), and the top 3,000 are kept.

## Regenerating with different parameters

`ANSWERS_SIZE` at the top of `generate.py` controls how many common words
land in the answer pool — raise it for more variety, lower it to keep the
answer set skewed toward only the most everyday words. The
`PROFANITY_ROOTS` list there is a pragmatic blocklist, not a linguistic
one — it intentionally over-blocks near-miss legitimate words (e.g.
"dupla") in favor of never surfacing something offensive as an answer.
