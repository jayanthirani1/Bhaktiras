# Shree Ghanshyam Bal Charitra

The ten-part illustrated English retelling of Bhagwan Swaminarayan's childhood, transcribed in
full: **79 stories** across ten volumes of 32 printed pages each. The stories feed the
Bracket City daily puzzle — see [Using these stories](#using-these-stories).

## Where this came from

The books are published as free ebooks by the Swaminarayan Sampraday at
<https://www.swaminarayan.faith/scriptures/ebooks>. The PDFs there are scans with no text
layer — every page is an image — so the pages were rendered and read one by one, and the text
typed out. The PDFs themselves are not in the repo; they are roughly 40 MB each.

## How to read these files

One markdown file per volume. Inside each one:

- `##` headings are the story titles.
- An HTML comment under each heading gives the printed page range, so any passage can be
  checked against the original book.
- Body text is **verbatim**, down to the books' own printing errors. Each story ends with the
  `STUDY:` questions printed in the book, also verbatim.
- Every file closes with a `## Story Summaries` section, one short summary per story. All
  79 are collected together in [`SUMMARIES.md`](SUMMARIES.md).

### Spellings

The books are inconsistent with their own transliterations — "Ghanashyam" and "Ghanshyam"
alternate inside a single paragraph, as do "Bhaktimata" and "Bhaktidevi", "Chhapaiya" and
"Chappaiya". The split here is deliberate:

- **Story titles and summaries** use the spellings the rest of the app uses — Ghanshyam,
  Bhaktimata, Dharmadev, Rampratap, Chhapaiya, Ayodhya, Akshardham — because these are what
  players see in the games.
- **Body text and STUDY questions** keep whatever the page printed, so the transcription stays
  checkable against the original.

So a story headed "Birth of Ghanshyam" can open with the words "Ghanashyam was born" — that is
the intended split, not a slip.

Two places where the printed books are defective are left as found and marked in the text:
Part 1 jumps mid-story in "Kalidutt the Evil One" (page 13 to 14), and Part 2 breaks off
mid-sentence at the end of page 1. One printed title carries a typo, "THE WORDLY SADHU", which
the heading and summary give as "The Worldly Sadhu".

## Using these stories

`data/bracketCityCharitra.ts` turns each summary into a Bracket City puzzle, so the sentence a
player is left with once every bracket is solved is that story's summary. The play page shows
the story title, so a puzzle must never use a word from its own title as an answer.
`node scripts/validateBracketCity.mjs` checks that, and everything else the format requires,
against the app's own parser.

## The volumes

### Part 1 — [`part-01.md`](part-01.md)

<https://www.swaminarayan.faith/media/3552/ghanshyam-charitra.pdf>

| Story | Pages |
|---|---|
| The Curse of Durvasa Becomes a Boon | 1-4 |
| Surbhi the Heavenly Cow | 5-6 |
| Birth of Ghanshyam | 7-10 |
| Kalidutt the Evil One | 11-21 |
| The Naming of Ghanshyam | 22-25 |
| Ghanshyam’s First Test | 26-27 |
| Ghanshyam and Moon Uncle | 28-32 |

### Part 2 — [`part-02.md`](part-02.md)

<https://www.swaminarayan.faith/media/3544/ghanshyam-charitra-2.pdf>

| Story | Pages |
|---|---|
| The Dance of Narad | 1-4 |
| Sheshnag and the Well | 5-8 |
| The Universe in Ghanshyam | 9-11 |
| The Visit of Vairajpurus | 12-14 |
| Ghanshyam Gets His Ears Pierced | 15-18 |
| Ghanshyam and the Asura | 19-24 |
| Ghanshyam and the Rattles | 25-28 |
| The Two Goddesses | 29-32 |

### Part 3 — [`part-03.md`](part-03.md)

<https://www.swaminarayan.faith/media/3545/ghanshyam-charitra-3.pdf>

| Story | Pages |
|---|---|
| Ghanshyam Reveals Himself | 1-3 |
| Has Ghanshyam Drowned? | 4-7 |
| Lord Of Light | 8-11 |
| The Twelve Mothers Of Ghanshyam | 12-16 |
| The Signs In The Palm | 17-20 |
| Open Your Mouth! | 21-23 |
| The Bath Of The Gods | 24-27 |
| The First Haircut | 28-32 |

### Part 4 — [`part-04.md`](part-04.md)

<https://www.swaminarayan.faith/media/3546/ghanshyam-charitra-4.pdf>

| Story | Pages |
|---|---|
| The Demon Storm | 1-5 |
| Never A Dull Moment | 6-8 |
| The Monkeys Meet Their Match | 9-12 |
| The Mango Fight | 13-17 |
| The Ghosts In The Well | 18-21 |
| Ghanshyam Runs Away | 22-25 |
| Ghanshyam And The Fish | 26-29 |
| The Ghosts And The Jack Fruit | 30-32 |

### Part 5 — [`part-05.md`](part-05.md)

<https://www.swaminarayan.faith/media/3547/ghanshyam-charitra-5.pdf>

| Story | Pages |
|---|---|
| At The Mela | 1-4 |
| Ghanshyam And The Divine Horse | 5-7 |
| The Rainy Day | 8-10 |
| The Feet Of The Lord | 11-15 |
| Ghanshyam Is Hungry | 16-19 |
| The Lord Of All Things | 20-23 |
| Surbhi And Her Calf | 24-27 |
| Ghanshyam Gets Plastered | 28-32 |

### Part 6 — [`part-06.md`](part-06.md)

<https://www.swaminarayan.faith/media/3548/ghanshyam-charitra-6.pdf>

| Story | Pages |
|---|---|
| The Demon Camp | 1-5 |
| Escaping from the Nawab’s Soldiers | 6-9 |
| Guarding Ghanshyam | 10-12 |
| The Crocodile Asura | 13-16 |
| The Wrestling Match | 17-22 |
| The Khampa Talavadi | 23-27 |
| The Jamun Tree | 28-30 |
| Don’t Kill Animals! | 31-32 |

### Part 7 — [`part-07.md`](part-07.md)

<https://www.swaminarayan.faith/media/3549/ghanshyam-charitra-7.pdf>

| Story | Pages |
|---|---|
| Be Generous | 1-4 |
| All Are Equal | 5-7 |
| Ghanshyam And The Giant Pumpkin | 8-10 |
| Ghanshyam The Scholar | 11-14 |
| Ghanshyam And The Sweets Shop | 15-21 |
| On The Road To Targam | 22-25 |
| The King’s Soldiers | 26-29 |
| At The Temple Of Krishna | 30-32 |

### Part 8 — [`part-08.md`](part-08.md)

<https://www.swaminarayan.faith/media/3550/ghanshyam-charitra-8.pdf>

| Story | Pages |
|---|---|
| In The Soldiers’ Camp | 1-5 |
| The Bad Tempered Elephant | 6-9 |
| Ghanshyam And The Birds | 10-13 |
| Ghanshyam Has A Toothache | 14-17 |
| Prasad Of Ghanshyam | 18-20 |
| The Gods Want Prasad! | 21-24 |
| A Wedding And A Funeral | 25-28 |
| The Mischievous Friends | 29-32 |

### Part 9 — [`part-09.md`](part-09.md)

<https://www.swaminarayan.faith/media/3551/ghanshyam-charitra-9.pdf>

| Story | Pages |
|---|---|
| The Sun At Night | 1-4 |
| The Ghosts And The Mangoes | 5-8 |
| Feeding The 1,000 Pilgrims | 9-13 |
| The Monk And The Tiger | 14-17 |
| Ghanshyam Becomes A Brahmin | 18-21 |
| Ghanshyam And The Mad Boy | 22-24 |
| The Worldly Sadhu | 25-27 |
| The Lucknow Wrestlers | 28-32 |

### Part 10 — [`part-10.md`](part-10.md)

<https://www.swaminarayan.faith/media/3543/ghanshyam-charitra-10.pdf>

| Story | Pages |
|---|---|
| Crossing The River | 1-4 |
| The Flooded Field | 5-8 |
| The Blind Men At The Lake | 9-12 |
| The Wishing Tree | 13-16 |
| The Tears Of Mother Earth | 17-20 |
| The Death Of Bhaktimata | 21-24 |
| The Death Of Dharmadev | 25-28 |
| Ghanshyam Leaves Home | 29-32 |
