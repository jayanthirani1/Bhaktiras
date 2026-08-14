# Satsang game word bank

`satsangWordBank.json` is a generated, offline dataset of exactly 2,000
vocabulary entries used by Wordle, Crossword and Spelling Bee.

Each entry contains:

- an ASCII `answer` for game matching;
- a human-readable `display` spelling;
- a clue, category and source;
- the games for which its length and letter pattern are compatible.

## Sources

1. Bhaktiras-curated Swaminarayan, satsang and general Hindu vocabulary.
2. [Hindu Gods DB](https://huggingface.co/datasets/aryansai/Hindu-Gods-DB)
   by Aryan Sai, used under CC BY 4.0.
3. Shiva Sahasranama names, used as sacred-name vocabulary.
4. [Vishnu Sahasranama Atlas](https://github.com/sahasranama/sahasranama.github.io),
   an educational dataset of the 1,000 names of Vishnu.

The normalised ASCII answer is intentionally separate from the display name.
For example, spaces and diacritics can be retained for readers without
breaking the games' A–Z-only input.

To refresh the generated JSON:

```sh
python3 scripts/generate_word_bank.py
```

Review generated clues and spellings before committing a refresh.
