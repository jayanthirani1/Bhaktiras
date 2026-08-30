/**
 * The CMS document, read on the server so the first paint already carries the
 * navigation an admin configured.
 *
 * Without it SSR renders `DEFAULT_NAV_ITEMS` — the server has no Firebase
 * client of its own — and the browser corrects the bar a moment later, which
 * showed as the third tab reading "Events" and turning into "Seva" on load.
 * The HTML paints long before any JS runs, so no amount of client-side caching
 * can fix that; the server has to know.
 *
 * `siteContent/{id}` is world-readable (`firestore.rules`), so this is a plain
 * unauthenticated REST GET with no credentials and no Admin SDK.
 */

/** Long enough that renders share one read, short enough that an admin's save lands quickly. */
const CACHE_TTL_MS = 60_000

/** A slow Firestore must not hold up the page; the defaults render instead. */
const REQUEST_TIMEOUT_MS = 2_000

type FirestoreValue = Record<string, any>

/** Firestore REST wraps every scalar in a type tag; unwrap it back to plain JSON. */
function decodeValue(value: FirestoreValue): unknown {
  if (!value || typeof value !== 'object') return undefined
  if ('nullValue' in value) return null
  if ('stringValue' in value) return value.stringValue
  if ('booleanValue' in value) return value.booleanValue
  // Integers come back as strings, so that a 64-bit one survives the JSON.
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return Number(value.doubleValue)
  if ('timestampValue' in value) return new Date(value.timestampValue)
  if ('arrayValue' in value) return (value.arrayValue?.values ?? []).map(decodeValue)
  if ('mapValue' in value) return decodeFields(value.mapValue?.fields)
  return undefined
}

function decodeFields(fields: Record<string, FirestoreValue> | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fields ?? {})) out[key] = decodeValue(value)
  return out
}

let cache: { at: number, data: Record<string, unknown> | null } | null = null
let inFlight: Promise<Record<string, unknown> | null> | null = null

/**
 * The document as plain data, or null to render the code defaults.
 *
 * A failure is cached as well as a success: when Firestore is unreachable, the
 * point is to stop paying a two-second timeout on every single render.
 */
export async function readSiteContentDoc(projectId: string, docId: string) {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data
  if (inFlight) return inFlight

  inFlight = (async () => {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${
        encodeURIComponent(projectId)}/databases/(default)/documents/siteContent/${encodeURIComponent(docId)}`
      const response = await $fetch<{ fields?: Record<string, FirestoreValue> }>(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      })
      const data = response?.fields ? decodeFields(response.fields) : null
      cache = { at: Date.now(), data }
      return data
    } catch {
      // A missing document, a refused read and a slow answer all mean the same
      // thing here: render the defaults, exactly as the site did before this.
      cache = { at: Date.now(), data: null }
      return null
    } finally {
      inFlight = null
    }
  })()

  return inFlight
}
