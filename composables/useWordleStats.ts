import type { WordleStats } from '~/types/wordle'

const STORAGE_KEY = 'wordle-stats'

const defaultStats: WordleStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
}

function loadStats(): WordleStats {
  if (import.meta.server) return { ...defaultStats, guessDistribution: { ...defaultStats.guessDistribution } }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<WordleStats>
      return {
        ...defaultStats,
        ...parsed,
        guessDistribution: {
          ...defaultStats.guessDistribution,
          ...(parsed.guessDistribution && typeof parsed.guessDistribution === 'object'
            ? parsed.guessDistribution
            : {})
        }
      }
    }
  } catch (_) {}
  return { ...defaultStats, guessDistribution: { ...defaultStats.guessDistribution } }
}

function persistStats(s: WordleStats) {
  if (import.meta.server) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch (_) {}
}

export function useWordleStats() {
  const stats = ref<WordleStats>(loadStats())

  function recordWin(guessCount: number) {
    const today = new Date().toDateString()
    const lastPlayed = stats.value.lastPlayedDate
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    let newStreak = stats.value.currentStreak
    if (!lastPlayed || lastPlayed === yesterday || lastPlayed === today) {
      newStreak = lastPlayed === today ? stats.value.currentStreak : stats.value.currentStreak + 1
    } else {
      newStreak = 1
    }
    stats.value = {
      ...stats.value,
      gamesPlayed: stats.value.gamesPlayed + 1,
      gamesWon: stats.value.gamesWon + 1,
      currentStreak: newStreak,
      maxStreak: Math.max(stats.value.maxStreak, newStreak),
      guessDistribution: {
        ...defaultStats.guessDistribution,
        ...(stats.value.guessDistribution || {}),
        [guessCount]: ((stats.value.guessDistribution || {})[guessCount] ?? 0) + 1
      },
      lastPlayedDate: today
    }
    persistStats(stats.value)
  }

  function recordLoss() {
    stats.value = {
      ...stats.value,
      gamesPlayed: stats.value.gamesPlayed + 1,
      currentStreak: 0,
      lastPlayedDate: new Date().toDateString()
    }
    persistStats(stats.value)
  }

  const winRate = computed(() =>
    stats.value.gamesPlayed > 0 ? Math.round((stats.value.gamesWon / stats.value.gamesPlayed) * 100) : 0
  )

  return { stats, winRate, recordWin, recordLoss }
}
