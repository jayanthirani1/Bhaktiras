/**
 * Player-facing copy should not mention the Bhuj edition. Admin data can keep
 * the source; this only rewrites what devotees read in the games.
 */
export function stripBhujFromPlayerText(text: string): string {
  return text
    .replace(/\s+in the Bhuj edition/gi, '')
    .replace(/^In the Bhuj edition,\s*/i, '')
    .replace(/^The Bhuj edition says\s+/i, '')
    .replace(/The Bhuj edition contents include an\s+/i, '')
    .replace(/\s+appears in the Bhuj edition with/gi, ' has')
    .replace(/\s+in the Bhuj edition contents/gi, '')
    .replace(/Together, the Bhuj edition arranges/gi, 'The Vachnamrut arranges')
    .replace(/\bthe Bhuj edition\b/gi, '')
    .replace(/\bBhuj edition\b/gi, '')
    .replace(/\bthe Bhuj Vachnamrut\b/gi, 'the Vachnamrut')
    .replace(/\bBhuj Vachnamrut\b/gi, 'Vachnamrut')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\?/g, '?')
    .replace(/\s+,/g, ',')
    .trim()
}
