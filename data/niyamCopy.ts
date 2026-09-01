import type { NiyamCopyContent } from '~/types'

/**
 * The words the niyams area says, apart from the niyams themselves.
 *
 * A niyam's own wording — its title, detail, hint, unit and one-tap amounts —
 * already lives on its `niyamChallenges/{id}` document and is edited per niyam.
 * What was left hardcoded was everything *around* it: the page header, the
 * empty and loading states, the sentences on the log and detail sheets, the
 * leaderboard headings. This file is the default for all of that, and
 * `siteContent.niyamCopy` overrides it, so the whole section can be reworded
 * from Admin → Niyams without a deploy.
 *
 * Same two-layer contract as the rest of `data/`: these defaults render when
 * Firestore has nothing, and a blank stored value falls back to them rather
 * than putting an empty string on the page.
 */

/** One editable string. `multiline` only decides which control the admin gets. */
export interface NiyamCopyField {
  key: string
  label: string
  help: string
  multiline?: boolean
  /** Grouping heading in the admin editor. */
  group: 'page' | 'sheet' | 'leaderboard'
}

export const DEFAULT_NIYAM_COPY = {
  pageTitle: 'Our Niyams',
  pageSubtitle: 'Sadhana we are keeping together, between now and the Patotsav in August 2027.',
  boardHint: 'Tap a niyam to see progress and the top-five leaderboard.',
  loadingLabel: 'Loading the niyams…',
  emptyTitle: 'No niyam running right now',
  emptyBody: 'When the mandir opens one it will appear here, and everyone\'s count will add up towards it.',
  signedOutNote: 'Your entries are private to you and the mandir\'s admins, so you need to be signed in to add them.',
  notPublishedNote: 'The mandir has not opened this niyam for entries yet. It will start counting as soon as they do.',
  checkinFooterNote: 'Log from home if you forgot to check in at mandir.',
  resourceLinkLabel: 'Read the words',
  myEntriesTitle: 'Your recent entries',
  myEntriesNote: 'Your last five entries, private to you. Removing one takes it back out of the total.',
  myEntriesEmpty: 'Nothing yet. Whatever you add appears here, and you can remove any of it.',
  removeConfirm: 'Remove this entry?',
  leaderboardTitle: 'Top contributors',
  leaderboardEmpty: 'No entries yet — be the first on the board.'
} satisfies NiyamCopyContent

export type NiyamCopyKey = keyof typeof DEFAULT_NIYAM_COPY

/**
 * The editor's field list, in the order an admin reads the page: the board
 * first, then what opens on top of it, then the leaderboard inside that.
 */
export const NIYAM_COPY_FIELDS: NiyamCopyField[] = [
  {
    key: 'pageTitle',
    group: 'page',
    label: 'Page title',
    help: 'The heading at the top of /niyams.'
  },
  {
    key: 'pageSubtitle',
    group: 'page',
    label: 'Page subtitle',
    help: 'The line under the heading.',
    multiline: true
  },
  {
    key: 'boardHint',
    group: 'page',
    label: 'Hint under the board',
    help: 'Tells a first-time visitor that a row opens.'
  },
  {
    key: 'loadingLabel',
    group: 'page',
    label: 'While the niyams load',
    help: 'Shown for the moment before Firestore answers.'
  },
  {
    key: 'emptyTitle',
    group: 'page',
    label: 'Nothing running — heading',
    help: 'Only seen if every niyam is removed or switched off.'
  },
  {
    key: 'emptyBody',
    group: 'page',
    label: 'Nothing running — body',
    help: 'The sentence under that heading.',
    multiline: true
  },
  {
    key: 'signedOutNote',
    group: 'sheet',
    label: 'Signed out',
    help: 'Shown on the log sheet to someone who has not signed in.',
    multiline: true
  },
  {
    key: 'notPublishedNote',
    group: 'sheet',
    label: 'Niyam not opened yet',
    help: 'Shown when a niyam is still a default and cannot take entries.',
    multiline: true
  },
  {
    key: 'checkinFooterNote',
    group: 'sheet',
    label: 'Under the check-in button',
    help: 'Only shown on check-in niyams such as Daily Darshan.'
  },
  {
    key: 'resourceLinkLabel',
    group: 'sheet',
    label: 'Default "where the words are" link text',
    help: 'Used when a niyam has a link but no link text of its own.'
  },
  {
    key: 'myEntriesTitle',
    group: 'sheet',
    label: 'Your entries — heading',
    help: 'Above the list of the devotee\'s own recent entries.'
  },
  {
    key: 'myEntriesNote',
    group: 'sheet',
    label: 'Your entries — note',
    help: 'Explains that the list is private and can be removed from.',
    multiline: true
  },
  {
    key: 'myEntriesEmpty',
    group: 'sheet',
    label: 'Your entries — none yet',
    help: 'Shown before the devotee has logged anything.',
    multiline: true
  },
  {
    key: 'removeConfirm',
    group: 'sheet',
    label: 'Remove — confirmation question',
    help: 'The question asked before an entry is actually removed.'
  },
  {
    key: 'leaderboardTitle',
    group: 'leaderboard',
    label: 'Leaderboard heading',
    help: 'Above the top five on a niyam\'s detail sheet.'
  },
  {
    key: 'leaderboardEmpty',
    group: 'leaderboard',
    label: 'Leaderboard — nobody yet',
    help: 'Shown while no one has a counted entry.',
    multiline: true
  }
]

export const NIYAM_COPY_GROUPS: { id: NiyamCopyField['group']; label: string; help: string }[] = [
  { id: 'page', label: 'The niyams page', help: 'Heading, hint and the states before any niyam is open.' },
  { id: 'sheet', label: 'The sheets that open over it', help: 'Logging an entry, and the detail view behind it.' },
  { id: 'leaderboard', label: 'Top contributors', help: 'The public five on each niyam\'s detail sheet.' }
]

/** Longest a single line of section copy can be, in the editor and on write. */
export const NIYAM_COPY_MAX = 400

/** A stored value only wins when it actually says something. */
export function parseNiyamCopy(raw: unknown): NiyamCopyContent {
  const source = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {}
  const out: NiyamCopyContent = {}
  for (const field of NIYAM_COPY_FIELDS) {
    const value = String(source[field.key] ?? '').trim().slice(0, NIYAM_COPY_MAX)
    if (value) out[field.key] = value
  }
  return out
}

/** The overrides folded onto the defaults — what the page actually renders. */
export function niyamCopyFromSource(raw: unknown): NiyamCopyContent {
  return { ...DEFAULT_NIYAM_COPY, ...parseNiyamCopy(raw) }
}

/** One string, defaulted. Components read copy through this, never the map. */
export function niyamCopyText(copy: NiyamCopyContent | undefined, key: NiyamCopyKey): string {
  return (copy?.[key] || '').trim() || DEFAULT_NIYAM_COPY[key]
}
