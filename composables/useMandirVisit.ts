/**
 * Personal "Visit Mandir" niyam tracker with geolocation-based auto check-in.
 *
 * Records visits to the mandir in Firestore for persistence across devices.
 * Location is only used client-side; no GPS coordinates are stored.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  limit,
  type Firestore
} from 'firebase/firestore'
import type { MandirVisit, LocationPreferences } from '~/types'
import { MANDIR_LOCATION } from '~/data/site'
import { ukDateId } from '~/utils/gameDay'
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

export function useMandirVisit() {
  const { $firebaseDb } = useNuxtApp()
  const { user, isLoggedIn } = useAuth()

  const geo = useGeolocation()

  const prefs = ref<LocationPreferences>(loadPrefs())
  const todayVisit = ref<MandirVisit | null>(null)
  const recentVisits = ref<MandirVisit[]>([])
  const loading = ref(true)
  const checking = ref(false)
  const error = ref<string | null>(null)

  let checkIntervalId: ReturnType<typeof setInterval> | null = null

  function getDb(): Firestore | null {
    if (import.meta.server) return null
    return ($firebaseDb as Firestore | null) ?? null
  }

  const alwaysAllowLocation = computed({
    get: () => prefs.value.alwaysAllowLocation,
    set: (value: boolean) => {
      prefs.value = { ...prefs.value, alwaysAllowLocation: value }
      savePrefs(prefs.value)
    }
  })

  const visitedToday = computed(() => !!todayVisit.value)

  const isAtMandir = computed(() => {
    if (!geo.position.value) return false
    const distance = haversineDistance(
      geo.position.value.lat,
      geo.position.value.lng,
      MANDIR_LOCATION.lat,
      MANDIR_LOCATION.lng
    )
    return distance <= MANDIR_LOCATION.radiusMeters
  })

  const distanceToMandir = computed(() => {
    if (!geo.position.value) return null
    return haversineDistance(
      geo.position.value.lat,
      geo.position.value.lng,
      MANDIR_LOCATION.lat,
      MANDIR_LOCATION.lng
    )
  })

  const currentStreak = computed(() => {
    if (!recentVisits.value.length) return 0
    let streak = 0
    const today = ukDateId()
    let expectedDate = today

    for (const visit of recentVisits.value) {
      if (visit.dateKey === expectedDate) {
        streak++
        expectedDate = addDays(expectedDate, -1)
      } else if (visit.dateKey < expectedDate) {
        break
      }
    }
    return streak
  })

  function addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr + 'T12:00:00Z')
    date.setUTCDate(date.getUTCDate() + days)
    return date.toISOString().split('T')[0]
  }

  async function fetchTodayVisit() {
    const db = getDb()
    const uid = user.value?.uid
    if (!db || !uid) {
      todayVisit.value = null
      return
    }

    const today = ukDateId()
    try {
      const snap = await getDoc(doc(db, 'mandirVisits', uid, 'visits', today))
      if (snap.exists()) {
        todayVisit.value = { id: snap.id, ...snap.data() } as MandirVisit
      } else {
        todayVisit.value = null
      }
    } catch (e) {
      console.error('Failed to fetch today visit:', e)
      todayVisit.value = null
    }
  }

  async function fetchRecentVisits() {
    const db = getDb()
    const uid = user.value?.uid
    if (!db || !uid) {
      recentVisits.value = []
      return
    }

    try {
      const snap = await getDocs(
        query(
          collection(db, 'mandirVisits', uid, 'visits'),
          orderBy('dateKey', 'desc'),
          limit(30)
        )
      )
      recentVisits.value = snap.docs.map(d => ({ id: d.id, ...d.data() } as MandirVisit))
    } catch (e) {
      console.error('Failed to fetch recent visits:', e)
      recentVisits.value = []
    }
  }

  async function recordVisit(source: 'auto' | 'manual') {
    const db = getDb()
    const uid = user.value?.uid
    if (!db || !uid) {
      error.value = 'Sign in to record your visit'
      return false
    }

    if (visitedToday.value) {
      return true
    }

    const today = ukDateId()
    error.value = null

    try {
      await setDoc(doc(db, 'mandirVisits', uid, 'visits', today), {
        userId: uid,
        dateKey: today,
        source,
        createdAt: serverTimestamp()
      })

      todayVisit.value = {
        id: today,
        userId: uid,
        dateKey: today,
        source
      }

      await fetchRecentVisits()
      return true
    } catch (e) {
      console.error('Failed to record visit:', e)
      error.value = 'Could not record your visit'
      return false
    }
  }

  async function checkInManually() {
    return recordVisit('manual')
  }

  async function checkLocationAndRecord() {
    if (!alwaysAllowLocation.value || !isLoggedIn.value || visitedToday.value) {
      return
    }

    checking.value = true
    error.value = null

    try {
      await geo.getCurrentPosition()
      if (isAtMandir.value) {
        await recordVisit('auto')
      }
    } catch (e) {
      const err = e as GeolocationPositionError
      if (err.code === err.PERMISSION_DENIED) {
        alwaysAllowLocation.value = false
        error.value = 'Location permission denied'
      }
    } finally {
      checking.value = false
    }
  }

  async function enableLocationTracking() {
    error.value = null

    try {
      await geo.getCurrentPosition()
      alwaysAllowLocation.value = true
      if (isAtMandir.value && !visitedToday.value) {
        await recordVisit('auto')
      }
      startPeriodicChecks()
      return true
    } catch (e) {
      const err = e as GeolocationPositionError
      if (err.code === err.PERMISSION_DENIED) {
        error.value = 'Please allow location access to use auto check-in'
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

  function startPeriodicChecks() {
    if (checkIntervalId) return
    checkIntervalId = setInterval(checkLocationAndRecord, CHECK_INTERVAL_MS)
  }

  function stopPeriodicChecks() {
    if (checkIntervalId) {
      clearInterval(checkIntervalId)
      checkIntervalId = null
    }
  }

  async function refresh() {
    loading.value = true
    error.value = null
    prefs.value = loadPrefs()

    try {
      await Promise.all([fetchTodayVisit(), fetchRecentVisits()])

      if (alwaysAllowLocation.value && isLoggedIn.value && !visitedToday.value) {
        startPeriodicChecks()
        checkLocationAndRecord()
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  onMounted(refresh)

  onUnmounted(() => {
    stopPeriodicChecks()
  })

  watch(() => user.value?.uid, async (uid, prev) => {
    if (uid === prev) return
    await refresh()
  })

  return {
    // State
    todayVisit,
    recentVisits,
    loading,
    checking,
    error,

    // Computed
    visitedToday,
    isAtMandir,
    distanceToMandir,
    currentStreak,
    alwaysAllowLocation,

    // Geolocation state (pass-through)
    permissionState: geo.permissionState,
    isGeolocationSupported: geo.isSupported,

    // Actions
    checkInManually,
    enableLocationTracking,
    disableLocationTracking,
    refresh
  }
}
