# Satsang game word bank

`satsangWordBank.json` is a curated, offline vocabulary used by Wordle,
Crossword and Spelling Bee.

Each entry contains:

- an ASCII `answer` for game matching;
- a human-readable `display` spelling;
- a clue, category and source;
- the games for which its length and letter pattern are compatible.

## Scope

Only familiar Swaminarayan, Gujarati and basic Hinduism terms are included.
Obscure Sanskrit deity-name lists (Sahasranama dumps and similar) are
intentionally excluded so players meet words they know from mandir and
satsang life.

## Source

Bhaktiras-curated vocabulary in `scripts/generate_word_bank.py`.

Admins can still add custom words from **Admin → Game Word Bank**; those
merge on top of this built-in list at runtime.

After regenerating this file, bump `WORD_BANK_VERSION` in
`utils/gameStorageReset.ts` so browsers clear cached daily game progress
(Wordle guesses, Crossword fills, 1% Club runs, and related timers).

The normalised ASCII answer is intentionally separate from the display name.
For example, spaces and diacritics can be retained for readers without
breaking the games' A–Z-only input.

To refresh the generated JSON:

```sh
python3 scripts/generate_word_bank.py
```

Review generated clues and spellings before committing a refresh.
