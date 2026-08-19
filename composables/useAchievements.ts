import { getApp } from 'firebase/app'
import { collection, doc, getDoc, getDocs, type Firestore } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import type { AchievementCrownRecord, PlayStreakRecord, UserAchievementsRecord } from '~/types'
import { formatElapsed } from '~/composables/useGameTimer'

export type AchievementGroup =
  | 'wordle'
  | 'crossword'
  | 'connections'
  | 'one-percent'
  | 'streak'

export type AchievementDefinition = {
  id: string
  title: string
  description: string
  group: AchievementGroup
}

export type GameAchievementGame = AchievementGroup

export type GameAchievementPayload = {
  userName: string
  guesses?: number
  timeMs?: number
  score?: number
  words?: number
  pangram?: boolean
  won?: boolean
  mistakes?: number
  clearedAll?: boolean
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  { id: 'wordle-first-win', title: 'First Wordle Win', description: 'Complete a Wordle successfully for the first time.', group: 'wordle' },
  { id: 'wordle-sub-60s', title: 'Under 60 Seconds', description: 'Finish a Wordle in under one minute.', group: 'wordle' },
  { id: 'wordle-sub-30s', title: 'Under 30 Seconds', description: 'Finish a Wordle in under 30 seconds.', group: 'wordle' },
  { id: 'wordle-sub-10s', title: 'Under 10 Seconds', description: 'Finish a Wordle in under 10 seconds.', group: 'wordle' },
  { id: 'wordle-sub-5s', title: 'Under 5 Seconds', description: 'Finish a Wordle in under 5 seconds.', group: 'wordle' },
  { id: 'wordle-three-guesses', title: 'Sharp Mind', description: 'Solve a Wordle in 3 guesses or less.', group: 'wordle' },
  { id: 'wordle-two-guesses', title: 'Lightning Insight', description: 'Solve a Wordle in 2 guesses or less.', group: 'wordle' },
  { id: 'wordle-one-guess', title: 'One Shot', description: 'Solve a Wordle in a single guess.', group: 'wordle' },
  { id: 'crossword-first-win', title: 'First Crossword', description: 'Complete the daily Crossword for the first time.', group: 'crossword' },
  { id: 'crossword-sub-60s', title: 'Crossword Under a Minute', description: 'Finish the Crossword in under 60 seconds.', group: 'crossword' },
  { id: 'crossword-sub-30s', title: 'Crossword Sprinter', description: 'Finish the Crossword in under 30 seconds.', group: 'crossword' },
  { id: 'crossword-sub-15s', title: 'Crossword Flash', description: 'Finish the Crossword in under 15 seconds.', group: 'crossword' },
  { id: 'connections-first-win', title: 'First Connections Win', description: 'Solve a Connections puzzle.', group: 'connections' },
  { id: 'connections-perfect', title: 'Perfect Connections', description: 'Solve Connections with no mistakes.', group: 'connections' },
  { id: 'one-percent-first-play', title: 'Ladder Climber', description: 'Finish a 1% Club run.', group: 'one-percent' },
  { id: 'one-percent-five-cleared', title: 'Halfway There', description: 'Clear 5 rungs in a single 1% Club run.', group: 'one-percent' },
  { id: 'one-percent-club', title: '1% Club', description: 'Clear every rung and join the 1% Club.', group: 'one-percent' },
  { id: 'streak-3', title: '3-Day Streak', description: 'Keep your games streak going for 3 days.', group: 'streak' },
  { id: 'streak-7', title: '7-Day Streak', description: 'Keep your games streak going for 7 days.', group: 'streak' },
  { id: 'streak-30', title: '30-Day Streak', description: 'Keep your games streak going for 30 days.', group: 'streak' }
]

export const ACHIEVEMENT_GROUP_TITLES: Record<AchievementGroup, string> = {
  wordle: 'Wordle',
  crossword: 'Crossword',
  connections: 'Connections',
  'one-percent': '1% Club',
  streak: 'Streaks'
}

export const CROWN_DEFINITIONS = [
  { id: 'wordle-fastest', title: 'Fastest Wordle', description: 'Current all-time fastest winning Wordle.', game: 'wordle' },
  { id: 'wordle-fewest-guesses', title: 'Fewest Guesses Wordle', description: 'Current all-time fewest-guesses winning Wordle.', game: 'wordle' },
  { id: 'crossword-fastest', title: 'Fastest Crossword', description: 'Current all-time fastest Crossword finish.', game: 'crossword' },
  { id: 'streak-longest', title: 'Longest Streak', description: 'Current all-time longest games streak.', game: 'streak' }
] as const

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

function functionsClient() {
  return getFunctions(getApp(), 'europe-west2')
}

export async function callGameAchievements(game: GameAchievementGame, payload: GameAchievementPayload) {
  const fn = httpsCallable<
    { game: GameAchievementGame } & GameAchievementPayload,
    { unlockedIds: string[]; crowns: AchievementCrownRecord[] }
  >(functionsClient(), 'processGameAchievements')
  return (await fn({ game, ...payload })).data
}

function unlockFromStreak(streak: PlayStreakRecord | null) {
  const unlocked = new Set<string>()
  const days = Math.max(streak?.currentStreak ?? 0, streak?.longestStreak ?? 0)
  if (days >= 3) unlocked.add('streak-3')
  if (days >= 7) unlocked.add('streak-7')
  if (days >= 30) unlocked.add('streak-30')
  return unlocked
}

export function crownTitle(id: string) {
  return CROWN_DEFINITIONS.find(item => item.id === id)?.title || id
}

export function crownValue(crown: AchievementCrownRecord) {
  if (crown.id === 'wordle-fastest' || crown.id === 'crossword-fastest') {
    return formatElapsed(crown.timeMs || crown.value)
  }
  if (crown.id === 'wordle-fewest-guesses') {
    return `${crown.guesses || crown.value}/6${crown.timeMs ? ` · ${formatElapsed(crown.timeMs)}` : ''}`
  }
  if (crown.id === 'streak-longest') {
    const days = crown.longestStreak || crown.value
    return `${days} day${days === 1 ? '' : 's'}`
  }
  return String(crown.value)
}

export function useAchievements() {
  const auth = useAuth()
  const userAchievements = useState<UserAchievementsRecord | null>('user-achievements', () => null)
  const crowns = useState<AchievementCrownRecord[]>('achievement-crowns', () => [])
  const streak = useState<PlayStreakRecord | null>('achievement-streak', () => null)
  const loading = useState<boolean>('achievement-loading', () => false)
  const error = useState<string>('achievement-error', () => '')

  const unlockedIds = computed(() => {
    const ids = new Set<string>(Object.keys(userAchievements.value?.achievements || {}))
    for (const id of unlockFromStreak(streak.value)) ids.add(id)
    return ids
  })

  const achievements = computed(() => ACHIEVEMENT_DEFINITIONS.map(def => ({
    ...def,
    unlocked: unlockedIds.value.has(def.id),
    unlock: userAchievements.value?.achievements?.[def.id]
  })))

  const groupedAchievements = computed(() =>
    (Object.keys(ACHIEVEMENT_GROUP_TITLES) as AchievementGroup[]).map(group => ({
      id: group,
      title: ACHIEVEMENT_GROUP_TITLES[group],
      items: achievements.value.filter(item => item.group === group)
    })).filter(group => group.items.length)
  )

  async function fetchAll() {
    const db = getDb()
    if (!db) return
    const uid = auth.user.value?.uid
    loading.value = true
    error.value = ''
    try {
      const crownSnap = await getDocs(collection(db, 'achievementCrowns'))
      crowns.value = crownSnap.docs
        .map(item => ({
          id: item.id,
          ...(item.data() as Omit<AchievementCrownRecord, 'id'>)
        }))
        .sort((a, b) => {
          const order = CROWN_DEFINITIONS.map(item => item.id)
          return order.indexOf(a.id as typeof CROWN_DEFINITIONS[number]['id']) - order.indexOf(b.id as typeof CROWN_DEFINITIONS[number]['id'])
        })

      if (!uid) {
        userAchievements.value = null
        streak.value = null
        return
      }

      const [achSnap, streakSnap] = await Promise.all([
        getDoc(doc(db, 'userAchievements', uid)),
        getDoc(doc(db, 'playStreaks', uid))
      ])
      userAchievements.value = achSnap.exists()
        ? { id: achSnap.id, ...(achSnap.data() as Omit<UserAchievementsRecord, 'id'>) }
        : { id: uid, userId: uid, achievements: {} }
      streak.value = streakSnap.exists()
        ? { id: streakSnap.id, ...(streakSnap.data() as Omit<PlayStreakRecord, 'id'>) }
        : null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Could not load achievements.'
    } finally {
      loading.value = false
    }
  }

  async function processResult(game: GameAchievementGame, payload: GameAchievementPayload) {
    if (!auth.user.value) return { unlockedIds: [] as string[] }
    const result = await callGameAchievements(game, payload)
    if (result) await fetchAll()
    return result
  }

  async function processWordleResult(payload: { guesses: number; timeMs: number; userName: string }) {
    return processResult('wordle', payload)
  }

  onMounted(() => { void fetchAll() })
  watch(() => auth.user.value?.uid, () => { void fetchAll() })

  return {
    achievements,
    groupedAchievements,
    crowns,
    unlockedIds,
    loading,
    error,
    fetchAll,
    processResult,
    processWordleResult
  }
}
