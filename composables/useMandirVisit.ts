/**
 * Mandir geolocation for the shared Aarti / Chesta / Katha check-in.
 *
 * Location is only used client-side; no GPS coordinates are stored. Auto
 * check-in is opt-in and only records towards the sangat's mandir-darshan goal.
 */

import type { LocationPreferences } from '~/types'
import { MANDIR_LOCATION } from '~/data/site'
import { haversineDistance, useGeolocation } from '~/composables/useGeolocation'

const PREFS_KEY = 'bhaktiras-mandir-location-prefs'
const CHECK_INTERVAL_MS = 30_000

function loadPrefs(): LocationPreferences {
  if (import.meta.server || typeof localStorage === 'undefined') {
    return { alwaysAllowLocation: false }
  }
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return JSON.parse(raw) as LocationPreferences
  } catch { /* ignore */ }
  return { alwaysAllowLocation: false }
}

function savePrefs(prefs: LocationPreferences) {
  if (import.meta.server || typeof localStorage === 'undefined') return
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

function distanceFromMandir(lat: number, lng: number): number {
  return haversineDistance(lat, lng, MANDIR_LOCATION.lat, MANDIR_LOCATION.lng)
}

function isWithinMandir(lat: number, lng: number): boolean {
  return distanceFromMandir(lat, lng) <= MANDIR_LOCATION.radiusMeters
}

/**
 * Shared location poll: the niyams page and the check-in sheet both ask whether
 * you are at the mandir, and two independent instances would mean two polls.
 */
let checkIntervalId: ReturnType<typeof setInterval> | null = null
let consumers = 0

export function useMandirVisit() {
  const geo = useGeolocation()

  const prefs = useState<LocationPreferences>('mandir-visit-prefs', () => loadPrefs())
  const checking = useState<boolean>('mandir-visit-checking', () => false)
  const error = useState<string | null>('mandir-visit-error', () => null)

  const alwaysAllowLocation = computed({
    get: () => prefs.value.alwaysAllowLocation,
    set: (value: boolean) => {
      prefs.value = { ...prefs.value, alwaysAllowLocation: value }
      savePrefs(prefs.value)
    }
  })

  const isAtMandir = computed(() => {
    if (!geo.position.value) return false
    return isWithinMandir(geo.position.value.lat, geo.position.value.lng)
  })

  const distanceToMandir = computed(() => {
    if (!geo.position.value) return null
    return distanceFromMandir(geo.position.value.lat, geo.position.value.lng)
  })

  async function refreshPosition(fresh = false): Promise<boolean> {
    checking.value = true
    error.value = null
    try {
      await geo.getCurrentPosition(fresh ? { maximumAge: 0 } : undefined)
      return isAtMandir.value
    } catch (e) {
      const err = e as GeolocationPositionError
      if (err.code === err.PERMISSION_DENIED) {
        error.value = 'Location permission denied'
      } else {
        error.value = 'Could not get your location'
      }
      return false
    } finally {
      checking.value = false
    }
  }

  /** Fresh GPS read before a manual check-in — honour system is not enough here. */
  async function confirmAtMandir(): Promise<boolean> {
    const ok = await refreshPosition(true)
    if (!ok && !error.value) {
      error.value = 'You\'re not at the Mandir. Try again when you arrive.'
    }
    return ok
  }

  async function enableLocationTracking() {
    error.value = null
    try {
      await geo.getCurrentPosition()
      alwaysAllowLocation.value = true
      startPeriodicChecks()
      return true
    } catch (e) {
      const err = e as GeolocationPositionError
      if (err.code === err.PERMISSION_DENIED) {
        error.value = 'Location permission denied'
        alwaysAllowLocation.value = false
      } else {
        error.value = 'Could not get your location'
      }
      return false
    }
  }

  function disableLocationTracking() {
    alwaysAllowLocation.value = false
    stopPeriodicChecks()
    geo.stopWatching()
  }

  async function pollLocation() {
    if (!alwaysAllowLocation.value) return
    await refreshPosition()
  }

  function startPeriodicChecks() {
    if (checkIntervalId) return
    checkIntervalId = setInterval(pollLocation, CHECK_INTERVAL_MS)
  }

  function stopPeriodicChecks() {
    if (checkIntervalId) {
      clearInterval(checkIntervalId)
      checkIntervalId = null
    }
  }

  function init() {
    prefs.value = loadPrefs()
    void geo.checkPermission()
    if (alwaysAllowLocation.value) {
      startPeriodicChecks()
      void pollLocation()
    }
  }

  onMounted(() => {
    consumers += 1
    init()
  })

  onUnmounted(() => {
    consumers = Math.max(0, consumers - 1)
    if (!consumers) stopPeriodicChecks()
  })

  return {
    checking,
    error,
    isAtMandir,
    distanceToMandir,
    alwaysAllowLocation,
    permissionState: geo.permissionState,
    isGeolocationSupported: geo.isSupported,
    confirmAtMandir,
    enableLocationTracking,
    disableLocationTracking,
    refreshPosition
  }
}
