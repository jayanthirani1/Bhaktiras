import { addUkDays } from '~/utils/gameDay'
import { MANDIR_LOCATION } from '~/data/site'
import type { Event } from '~/types'

/**
 * Turning an event into something a devotee can forward or diarise.
 *
 * Events carry a date and nothing finer: the admin editor writes a plain
 * `<input type="date">` and has no time field at all, and `useEvents` only
 * still reads `time` to recover the date from documents written before the
 * field was renamed. So a calendar entry here is an all-day entry, which is
 * also the honest answer — "Sunday 14th" is genuinely all this page knows.
 * If a start time is ever added, `buildEventIcs` is where it belongs.
 */

/** The long date the events page shows, e.g. "Saturday 14 August 2027". */
export function formatEventDateLong(date: string): string {
  if (!date) return ''
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function isCalendarDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(new Date(`${date}T00:00:00Z`).getTime())
}

/** `2027-08-14` becomes `20270814`, the only date form iCalendar accepts. */
function toIcsDate(date: string): string {
  return date.replace(/-/g, '')
}

function icsTimestamp(now: Date): string {
  return `${now.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`
}

/**
 * RFC 5545 escaping. A comma or semicolon left raw ends the property value
 * early, which is how a description with a list in it silently truncates
 * everything after the first comma.
 */
function escapeIcsText(value: string): string {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

/**
 * Folds a content line to 75 octets, per RFC 5545.
 *
 * Counted in bytes rather than characters, and broken between code points:
 * event descriptions carry Gujarati transliteration and the odd curly quote,
 * and splitting one of those mid-sequence gives a file Apple Calendar refuses
 * to open at all.
 */
function foldIcsLine(line: string): string {
  const limit = 75
  const out: string[] = []
  let current = ''
  let bytes = 0

  for (const char of line) {
    const size = new TextEncoder().encode(char).length
    // Continuation lines open with a space, which counts toward the 75.
    const ceiling = out.length ? limit - 1 : limit
    if (bytes + size > ceiling) {
      out.push(current)
      current = ''
      bytes = 0
    }
    current += char
    bytes += size
  }
  out.push(current)

  return out.map((part, index) => (index ? ` ${part}` : part)).join('\r\n')
}

function eventUrl(origin: string): string {
  return `${String(origin || '').replace(/\/$/, '')}/events`
}

/** Where the event is held. Every event on this page is at the mandir. */
const VENUE = `${MANDIR_LOCATION.name}, ${MANDIR_LOCATION.address}`

/**
 * A single-event .ics file. Universally understood — Apple Calendar, Google
 * Calendar and Outlook all import it — which matters more here than any one
 * provider's "add to calendar" web link, because the community is split
 * across all three.
 */
export function buildEventIcs(event: Event, origin: string, now: Date = new Date()): string | null {
  if (!isCalendarDate(event.date)) return null

  const url = eventUrl(origin)
  const description = [event.description, url].filter(Boolean).join('\n\n')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bhaktiras//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(event.id)}@bhaktiras`,
    `DTSTAMP:${icsTimestamp(now)}`,
    // An all-day DTEND is exclusive, so a one-day event ends the next morning.
    `DTSTART;VALUE=DATE:${toIcsDate(event.date)}`,
    `DTEND;VALUE=DATE:${toIcsDate(addUkDays(event.date, 1))}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(VENUE)}`,
    `URL:${escapeIcsText(url)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ]

  // iCalendar is a CRLF format; Outlook is the one that still minds.
  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`
}

/** A filename that survives a WhatsApp round trip and a Windows download. */
export function eventIcsFilename(event: Event): string {
  const slug = String(event.title || 'event')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `${slug || 'event'}.ics`
}

/**
 * The event as a message someone can paste into WhatsApp.
 *
 * Laid out for a phone: the title and date first, because that is what a
 * reader scanning a busy group chat needs, then the venue, then the notes,
 * then the link. No emoji — the rest of the site's copy carries none, and a
 * mandir invitation reads better without them.
 */
export function buildEventMessage(event: Event, origin: string): string {
  return [
    event.title,
    formatEventDateLong(event.date),
    VENUE,
    '',
    event.description,
    '',
    `Event details: ${eventUrl(origin)}`
  ]
    .filter(part => part !== undefined && part !== null)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
