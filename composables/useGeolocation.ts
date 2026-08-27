/**
 * Browser Geolocation API wrapper with permission state tracking.
 *
 * Provides reactive position watching and distance calculation for the
 * mandir check-in feature. Only active when explicitly started.
 */

export type GeolocationPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported'

export interface GeolocationPosition {
  lat: number
  lng: number
  accuracy: number
  timestamp: number
}

const EARTH_RADIUS_METERS = 6_371_000

/** Haversine distance between two lat/lng points, in metres. */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a))
}

export function useGeolocation() {
  const position = ref<GeolocationPosition | null>(null)
  const permissionState = ref<GeolocationPermissionState>('prompt')
  const error = ref<string | null>(null)
  const watching = ref(false)

  let watchId: number | null = null

  const isSupported = computed(() => {
    if (import.meta.server) return false
    return 'geolocation' in navigator
  })

  async function checkPermission(): Promise<GeolocationPermissionState> {
    if (import.meta.server) return 'unsupported'
    if (!isSupported.value) {
      permissionState.value = 'unsupported'
      return 'unsupported'
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' })
      permissionState.value = result.state as GeolocationPermissionState
      result.addEventListener('change', () => {
        permissionState.value = result.state as GeolocationPermissionState
        if (result.state === 'denied') {
          stopWatching()
        }
      })
      return permissionState.value
    } catch {
      // Permissions API not supported, assume prompt
      permissionState.value = 'prompt'
      return 'prompt'
    }
  }

  function startWatching(options?: PositionOptions) {
    if (import.meta.server || !isSupported.value || watching.value) return

    error.value = null
    watching.value = true

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: 30_000,
      ...options
    }

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        position.value = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp
        }
        error.value = null
        if (permissionState.value !== 'granted') {
          permissionState.value = 'granted'
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          permissionState.value = 'denied'
          error.value = 'Location permission denied'
          stopWatching()
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          error.value = 'Location unavailable'
        } else if (err.code === err.TIMEOUT) {
          error.value = 'Location request timed out'
        } else {
          error.value = 'Could not get location'
        }
      },
      defaultOptions
    )
  }

  function stopWatching() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
    watching.value = false
  }

  /** Get a single position reading (prompts for permission if needed). */
  function getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (import.meta.server || !isSupported.value) {
        reject(new Error('Geolocation not supported'))
        return
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 60_000,
        ...options
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const result: GeolocationPosition = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp
          }
          position.value = result
          permissionState.value = 'granted'
          resolve(result)
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            permissionState.value = 'denied'
          }
          reject(err)
        },
        defaultOptions
      )
    })
  }

  /** Distance from current position to a target, in metres. Returns null if no position. */
  function distanceTo(targetLat: number, targetLng: number): number | null {
    if (!position.value) return null
    return haversineDistance(position.value.lat, position.value.lng, targetLat, targetLng)
  }

  onMounted(() => {
    checkPermission()
  })

  onUnmounted(() => {
    stopWatching()
  })

  return {
    position,
    permissionState,
    error,
    watching,
    isSupported,
    checkPermission,
    startWatching,
    stopWatching,
    getCurrentPosition,
    distanceTo
  }
}
