import { ensureGameStorageMatchesWordBank } from '~/utils/gameStorageReset'

/**
 * Drop stale Wordle / Crossword / 1% Club local progress whenever the
 * shared word bank version is bumped (see utils/gameStorageReset.ts).
 */
export default defineNuxtPlugin(() => {
  ensureGameStorageMatchesWordBank()
})
