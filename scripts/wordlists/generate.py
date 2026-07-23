"""
Regenerates the per-word-length files in src/data/: answers.json /
validGuesses.json (5-letter) and answers6.json / validGuesses6.json
(6-letter).

Pipeline
--------
1. Download the Polish Hunspell spellchecking dictionary (pl_PL.dic/.aff),
   sourced from sjp.pl and maintained by Marek Futrega, redistributed via
   LibreOffice's dictionaries repo. Licensed under (your choice of) GPL,
   LGPL, MPL, Apache 2.0 or CC-BY-SA -- see WORDLISTS.md for the exact
   attribution this project uses.
2. Expand every dictionary entry into its full set of inflected surface
   forms ("unmunching") using spylls, a pure-Python Hunspell
   reimplementation (MIT licensed), by directly applying the .aff file's
   PFX/SFX rules -- spylls itself doesn't expose a bulk-dump API, so this
   script drives its parsed affix tables one level deep (plus one
   prefix+suffix crossproduct combination). Deep suffix-chaining is not
   attempted; this trades a small amount of completeness for simplicity
   and is fine for a "does this look like a word" guess check. This step
   is run once for the whole dictionary regardless of word length.
3. For each configured word length, filter step 2's forms to that length,
   keep only entries whose original dictionary casing starts lowercase
   (drops proper nouns and all-caps abbreviations, which the source
   dictionary includes for spellchecking purposes), and uppercase the
   result. This becomes validGuesses(6).json -- the large permissive "is
   this a real word" list.
4. Download the Polish word-frequency list from hermitdave/FrequencyWords
   (OpenSubtitles-derived, CC-BY-SA-4.0), intersect its most common
   tokens of that length with the dictionary-validated set from step 3,
   drop anything matching a small profanity-root blocklist, and take the
   top ANSWERS_SIZE words by frequency. This becomes answers(6).json --
   the curated pool the game's random target is drawn from.

Run from the repo root:
    pip install -r scripts/wordlists/requirements.txt
    python scripts/wordlists/generate.py

Takes a couple of minutes; the dictionary/frequency downloads are cached
in scripts/wordlists/.cache/ so re-runs after the first are fast.
"""

import json
import re
import sys
import urllib.request
from pathlib import Path

from spylls.hunspell import Dictionary

ROOT = Path(__file__).resolve().parent
CACHE = ROOT / '.cache'
DATA_DIR = ROOT.parent.parent / 'src' / 'data'

DIC_URL = 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/pl_PL/pl_PL.dic'
AFF_URL = 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/pl_PL/pl_PL.aff'
FREQ_URL = 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/pl/pl_full.txt'

WORD_LENGTHS = [5, 6]
ANSWERS_SIZE = 3000

PL_LOWER = 'aąbcćdeęfghijklłmnńoóprsśtuwyzźż'
LOWERCASE_ONLY = re.compile(f'^[{PL_LOWER}]+$')

# Word-fragment blocklist applied only to the curated ANSWERS pool (never
# to validGuesses -- real Wordle lets you *guess* profanity, it just never
# picks it as the answer). Deliberately broad; false positives (e.g. the
# legitimate word "dupla") are an acceptable trade for keeping answers clean.
PROFANITY_ROOTS = [
    'kurw', 'chuj', 'huj', 'cip', 'pizd', 'jeb', 'pierdol', 'dup', 'gówn',
    'skurw', 'zjeb', 'pojeb', 'wypierd', 'kutas', 'fiut', 'spierd', 'zasran',
    'zesr', 'pierdz', 'jebn', 'wyjeb', 'odjeb', 'dojeb', 'najeb', 'zajeb',
    'wkurw',
]


def download(url: str, dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        print(f'Downloading {url}', file=sys.stderr)
        urllib.request.urlretrieve(url, dest)
    return dest


def apply_suffix(stem: str, suf):
    if not suf.cond_regexp.search(stem):
        return None
    base = stem[: len(stem) - len(suf.strip)] if suf.strip else stem
    return base + suf.add


def apply_prefix(stem: str, pre):
    if not pre.cond_regexp.search(stem):
        return None
    base = stem[len(pre.strip):] if pre.strip else stem
    return pre.add + base


def forms_for_word(word, aff):
    stem = word.stem
    flags = word.flags
    results = {stem} if 'NEEDAFFIX' not in flags else set()

    suffixed, prefixed = [], []
    for f in flags:
        for suf in aff.SFX.get(f, []):
            w = apply_suffix(stem, suf)
            if w:
                results.add(w)
                suffixed.append((w, suf))
        for pre in aff.PFX.get(f, []):
            w = apply_prefix(stem, pre)
            if w:
                results.add(w)
                prefixed.append((w, pre))

    for pw, pre in prefixed:
        if not pre.crossproduct:
            continue
        for _sw, suf in suffixed:
            if suf.crossproduct and suf.cond_regexp.search(pw):
                results.add(apply_suffix(pw, suf))

    return results


def build_all_forms() -> set[str]:
    dic_path = download(DIC_URL, CACHE / 'pl_PL.dic')
    aff_path = download(AFF_URL, CACHE / 'pl_PL.aff')
    dictionary = Dictionary.from_files(str(CACHE / 'pl_PL'))
    del dic_path, aff_path  # loaded via the shared basename above

    all_forms: set[str] = set()
    words = dictionary.dic.words
    for i, word in enumerate(words):
        all_forms.update(forms_for_word(word, dictionary.aff))
        if i % 50000 == 0:
            print(f'unmunch {i}/{len(words)}', file=sys.stderr)
    return all_forms


def build_valid_guesses(all_forms: set[str], word_length: int) -> list[str]:
    common = {
        w.upper() for w in all_forms if len(w) == word_length and LOWERCASE_ONLY.match(w)
    }
    return sorted(common)


def build_answers(word_length: int, valid_guesses: list[str]) -> list[str]:
    freq_path = download(FREQ_URL, CACHE / 'pl_full.txt')
    valid_set = set(valid_guesses)

    ranked: list[str] = []
    seen: set[str] = set()
    with open(freq_path, encoding='utf-8') as f:
        for line in f:
            parts = line.rsplit(' ', 1)
            if len(parts) != 2:
                continue
            w = parts[0].strip()
            if len(w) != word_length or not LOWERCASE_ONLY.match(w):
                continue
            W = w.upper()
            if W in seen or W not in valid_set:
                continue
            seen.add(W)
            if any(root in w for root in PROFANITY_ROOTS):
                continue
            ranked.append(W)

    return sorted(ranked[:ANSWERS_SIZE])


def filenames(word_length: int) -> tuple[str, str]:
    suffix = '' if word_length == 5 else str(word_length)
    return f'answers{suffix}.json', f'validGuesses{suffix}.json'


def main():
    all_forms = build_all_forms()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    for word_length in WORD_LENGTHS:
        valid_guesses = build_valid_guesses(all_forms, word_length)
        print(f'[{word_length}] validGuesses: {len(valid_guesses)} words', file=sys.stderr)

        answers = build_answers(word_length, valid_guesses)
        print(f'[{word_length}] answers: {len(answers)} words', file=sys.stderr)

        answers_name, valid_guesses_name = filenames(word_length)
        (DATA_DIR / valid_guesses_name).write_text(
            json.dumps(valid_guesses, ensure_ascii=False), encoding='utf-8'
        )
        (DATA_DIR / answers_name).write_text(
            json.dumps(answers, ensure_ascii=False), encoding='utf-8'
        )


if __name__ == '__main__':
    main()
