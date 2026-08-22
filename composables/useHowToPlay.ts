const seenKey = (gameId: string) => `bhaktiras-howto-seen:${gameId}`

function storageHasPrefix(prefixes: string[]): boolean {
  if (import.meta.server || typeof localStorage === 'undefined') return false
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && prefixes.some(prefix => key.startsWith(prefix) || key === prefix)) return true
    }
  } catch {}
  return false
}

/**
 * First time a player opens a game, walk them through How to play before
 * the board (and timer) start. After that, How to play stays a collapsed dropdown.
 * Anyone who already has local progress for the game skips the intro.
 */
export function useHowToPlay(gameId: string, storagePrefixes: string[] = []) {
  const ready = ref(false)
  const seen = ref(true)

  const showIntro = computed(() => ready.value && !seen.value)

  function markSeen() {
    seen.value = true
    if (import.meta.server) return
    try {
      localStorage.setItem(seenKey(gameId), '1')
    } catch {}
  }

  onMounted(() => {
    try {
      if (localStorage.getItem(seenKey(gameId)) === '1') {
        seen.value = true
      } else if (storageHasPrefix(storagePrefixes)) {
        markSeen()
      } else {
        seen.value = false
      }
    } catch {
      seen.value = true
    }
    ready.value = true
  })

  return { ready, seen, showIntro, markSeen }
}
