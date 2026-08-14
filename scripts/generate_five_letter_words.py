#!/usr/bin/env python3
"""Regenerate the bundled Wordle guess dictionary.

Source: the `word-list` npm package (public domain word list).

    npm pack word-list --pack-destination /tmp
    tar -xzf /tmp/word-list-*.tgz -C /tmp
    python3 scripts/generate_five_letter_words.py /tmp/package/words.txt
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "fiveLetterWords.ts"
CHUNK = 100

HEADER = """/**
 * Allowed Wordle guesses: every 5-letter English word, stored as one packed
 * string (5 characters per word) to keep the bundle small.
 * Generated from the `word-list` npm package via scripts/generate_five_letter_words.py
 */
const PACKED_FIVE_LETTER_WORDS =
"""

FOOTER = """

export const FIVE_LETTER_WORDS: string[] = Array.from(
  { length: PACKED_FIVE_LETTER_WORDS.length / 5 },
  (_, index) => PACKED_FIVE_LETTER_WORDS.slice(index * 5, index * 5 + 5)
)
"""


def main() -> None:
    source = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/package/words.txt")
    words = (line.strip().upper() for line in source.read_text(encoding="utf-8").splitlines())
    five = sorted({w for w in words if len(w) == 5 and w.isalpha() and w.isascii()})
    packed = "".join(five)
    body = "\n".join(f"  '{packed[i:i + CHUNK]}' +" for i in range(0, len(packed), CHUNK))
    OUTPUT.write_text(HEADER + body.rstrip(" +") + FOOTER, encoding="utf-8")
    print(f"Wrote {len(five)} words to {OUTPUT}")


if __name__ == "__main__":
    main()
