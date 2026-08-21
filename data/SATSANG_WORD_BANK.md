# Satsang game word bank

`satsangWordBank.json` is a curated, offline vocabulary used by Wordle and
Crossword.

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

Two blocks in `scripts/generate_word_bank.py`:

- `CURATED` — Bhaktiras-curated vocabulary (`source: "Bhaktiras curated"`).
- `VACHNAMRUT` — terms and proper nouns taken from the English Vachnamrut
  published by Shree Swaminarayan Mandir Bhuj
  (<https://www.swaminarayan.faith/scriptures/en/vachnamrut>) and its chapter
  pages (`source: "Vachnamrut (Bhuj edition)"`).
- `SATSANGI_JEEVAN` — names, places and observances from Shreemad Satsangi
  Jeevan on the same site
  (<https://www.swaminarayan.faith/scriptures/en/satsangi-jeevan>)
  (`source: "Satsangi Jeevan (Bhuj edition)"`).

Both scriptures are scraped the same way: the chapter index is an AngularJS
app that serves only templates, but each verse page is server-rendered at
`/scriptures/en/<scripture>/<chapter-slug>/<n>`.

## Spelling house style

Spellings follow that Bhuj translation, with its long-vowel diacritics dropped
so display forms stay keyboard-friendly. In practice that means the Gujarati
transliteration rather than the Sanskrit one:

| Use | Not |
| --- | --- |
| Bhagvan | Bhagwan |
| Svarup, Svabhav, Svadharma | Swarup, Swabhav, Swadharma |
| Jeev, Gnan, Moksh, Yog | Jiva, Jnan, Moksha, Yoga |
| Veds, Geeta, Ramayan, Mahabharat | Vedas, Gita, Ramayana, Mahabharata |
| Shiv, Rushi, Golok, Garud | Shiva, Rishi, Goloka, Garuda |
| Parbrahm, Paramhans, Grahastha | Parabrahman, Paramhansa, Grihastha |
| Nishchay, Vrutti, Vrundavan | Nischay, Vruti, Vrindavan |
| Nar-Narayan, Kali-Yug, Brahm-charya | Narnarayan, Kaliyug, Brahmacharya |

**Where the two scriptures disagree, the Vachnamrut wins.** The Satsangi
Jeevan translation is by a different hand and leans Sanskrit (Vedas, Yoga,
Shiva, Dwarika, Shri Hari, Annakuta); its entries are normalised to the table
above, and it is used only for what the Vachnamrut does not carry.

Three notes where a source varies internally:

- The scripture is titled **Vachnamrut** on its index, breadcrumb and URL; the
  translated verse text writes **Vachanamrut** in running prose. The app uses
  **Vachnamrut** throughout.
- Chapter names follow the chapter index (**Ahmedabad**, **Gadhada Pratham**,
  **Gadhada Madhyam**, **Antya**, **Bhugol Khugol**), even where the verse body
  uses another form (e.g. *Amdavad*, *Bhugol Khagol*). *Amdavad* is carried as
  its own entry.
- The site'''s marketing nav also uses Sanskrit-style forms ("Bhagwan",
  "Vachanamrut eBook", "Pooja", "Yoga"). The scripture text and its chapter
  index are the authority, not the nav.

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
