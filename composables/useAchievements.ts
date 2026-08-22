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
  | 'bracket-city'
  | 'bhakti-marg'
  | 'ras-rani'
  | 'streak'

export type AchievementMedal = 'bronze' | 'silver' | 'gold' | 'platinum'

export type AchievementDefinition = {
  id: string
  title: string
  description: string
  group: AchievementGroup
  medal: AchievementMedal
  progress?: {
    stat: string
    goal: number
    unit?: string
  }
}

export type GameAchievementGame = AchievementGroup

export type GameAchievementPayload = {
  userName: string
  guesses?: number
  timeMs?: number
  score?: number
  won?: boolean
  mistakes?: number
  clubStreak?: number
  /** 1% Club: cleared every question. Drives the club streak in the callable. */
  clearedAll?: boolean
  moves?: number
  hintsUsed?: number
  pathsFound?: number
  perfect?: boolean
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  { id: 'wordle-first-win', title: 'First Wordle Win', description: 'Complete a Wordle successfully for the first time.', group: 'wordle', medal: 'bronze' },
  { id: 'wordle-wins-7', title: 'Week of Words', description: 'Win 7 daily Wordles.', group: 'wordle', medal: 'silver', progress: { stat: 'wordleWins', goal: 7, unit: 'wins' } },
  { id: 'wordle-wins-30', title: 'Wordle Sadhak', description: 'Win 30 daily Wordles.', group: 'wordle', medal: 'gold', progress: { stat: 'wordleWins', goal: 30, unit: 'wins' } },
  { id: 'wordle-wins-100', title: '100-Day Wordle', description: 'Win 100 daily Wordles.', group: 'wordle', medal: 'gold', progress: { stat: 'wordleWins', goal: 100, unit: 'wins' } },
  { id: 'wordle-wins-200', title: '200-Day Wordle', description: 'Win 200 daily Wordles.', group: 'wordle', medal: 'gold', progress: { stat: 'wordleWins', goal: 200, unit: 'wins' } },
  { id: 'wordle-wins-300', title: '300-Day Wordle', description: 'Win 300 daily Wordles.', group: 'wordle', medal: 'platinum', progress: { stat: 'wordleWins', goal: 300, unit: 'wins' } },
  { id: 'wordle-three-guesses-10', title: 'Sharp Mind', description: 'Solve 10 Wordles in 3 guesses or fewer.', group: 'wordle', medal: 'gold', progress: { stat: 'wordleThreeGuesses', goal: 10, unit: 'solves' } },
  { id: 'wordle-one-guess', title: 'One Shot', description: 'Solve a Wordle in a single guess.', group: 'wordle', medal: 'platinum' },
  { id: 'crossword-first-win', title: 'First Crossword', description: 'Complete the daily Crossword for the first time.', group: 'crossword', medal: 'bronze' },
  { id: 'crossword-wins-7', title: 'Grid Habit', description: 'Finish 7 daily Crosswords.', group: 'crossword', medal: 'silver', progress: { stat: 'crosswordWins', goal: 7, unit: 'grids' } },
  { id: 'crossword-wins-30', title: 'Crossword Sadhak', description: 'Finish 30 daily Crosswords.', group: 'crossword', medal: 'gold', progress: { stat: 'crosswordWins', goal: 30, unit: 'grids' } },
  { id: 'crossword-wins-100', title: '100-Day Crossword', description: 'Finish 100 daily Crosswords.', group: 'crossword', medal: 'gold', progress: { stat: 'crosswordWins', goal: 100, unit: 'grids' } },
  { id: 'crossword-wins-200', title: '200-Day Crossword', description: 'Finish 200 daily Crosswords.', group: 'crossword', medal: 'gold', progress: { stat: 'crosswordWins', goal: 200, unit: 'grids' } },
  { id: 'crossword-wins-300', title: '300-Day Crossword', description: 'Finish 300 daily Crosswords.', group: 'crossword', medal: 'platinum', progress: { stat: 'crosswordWins', goal: 300, unit: 'grids' } },
  { id: 'crossword-sub-30s', title: 'Crossword Sprinter', description: 'Finish a Crossword in under 30 seconds.', group: 'crossword', medal: 'gold' },
  { id: 'crossword-sub-15s', title: 'Crossword Flash', description: 'Finish a Crossword in under 15 seconds.', group: 'crossword', medal: 'platinum' },
  { id: 'connections-first-win', title: 'First Connections Win', description: 'Solve a Connections puzzle.', group: 'connections', medal: 'bronze' },
  { id: 'connections-wins-15', title: 'Group Seeker', description: 'Solve 15 Connections puzzles.', group: 'connections', medal: 'silver', progress: { stat: 'connectionsWins', goal: 15, unit: 'solves' } },
  { id: 'connections-wins-100', title: '100-Day Connections', description: 'Solve 100 Connections puzzles.', group: 'connections', medal: 'gold', progress: { stat: 'connectionsWins', goal: 100, unit: 'solves' } },
  { id: 'connections-wins-200', title: '200-Day Connections', description: 'Solve 200 Connections puzzles.', group: 'connections', medal: 'gold', progress: { stat: 'connectionsWins', goal: 200, unit: 'solves' } },
  { id: 'connections-wins-300', title: '300-Day Connections', description: 'Solve 300 Connections puzzles.', group: 'connections', medal: 'platinum', progress: { stat: 'connectionsWins', goal: 300, unit: 'solves' } },
  { id: 'connections-perfect', title: 'Perfect Connections', description: 'Solve Connections with no mistakes.', group: 'connections', medal: 'gold' },
  { id: 'connections-perfect-10', title: 'Faultless Ten', description: 'Solve 10 Connections puzzles with no mistakes.', group: 'connections', medal: 'platinum', progress: { stat: 'connectionsPerfect', goal: 10, unit: 'perfects' } },
  { id: 'bracket-city-first-win', title: 'First Nested Solve', description: 'Complete a Bracket City puzzle for the first time.', group: 'bracket-city', medal: 'bronze' },
  { id: 'bracket-city-wins-7', title: 'Week of Brackets', description: 'Complete 7 Bracket City puzzles.', group: 'bracket-city', medal: 'silver', progress: { stat: 'bracketCityWins', goal: 7, unit: 'solves' } },
  { id: 'bracket-city-wins-30', title: 'Bracket Sadhak', description: 'Complete 30 Bracket City puzzles.', group: 'bracket-city', medal: 'gold', progress: { stat: 'bracketCityWins', goal: 30, unit: 'solves' } },
  { id: 'bracket-city-wins-100', title: '100-Day Bracket City', description: 'Complete 100 Bracket City puzzles.', group: 'bracket-city', medal: 'gold', progress: { stat: 'bracketCityWins', goal: 100, unit: 'solves' } },
  { id: 'bracket-city-wins-200', title: '200-Day Bracket City', description: 'Complete 200 Bracket City puzzles.', group: 'bracket-city', medal: 'gold', progress: { stat: 'bracketCityWins', goal: 200, unit: 'solves' } },
  { id: 'bracket-city-wins-300', title: '300-Day Bracket City', description: 'Complete 300 Bracket City puzzles.', group: 'bracket-city', medal: 'platinum', progress: { stat: 'bracketCityWins', goal: 300, unit: 'solves' } },
  { id: 'bracket-city-no-hints', title: 'No Peeking', description: 'Complete Bracket City without revealing any answers.', group: 'bracket-city', medal: 'gold' },
  { id: 'bracket-city-no-hints-10', title: 'Inner Circle', description: 'Complete 10 Bracket City puzzles without peeks.', group: 'bracket-city', medal: 'platinum', progress: { stat: 'bracketCityNoHints', goal: 10, unit: 'perfects' } },
  { id: 'bracket-city-perfect', title: 'Clean Brackets', description: 'Complete Bracket City with no peeks and no wrong guesses.', group: 'bracket-city', medal: 'gold' },
  { id: 'bracket-city-sub-60s', title: 'Swift Nest', description: 'Complete Bracket City in under 60 seconds.', group: 'bracket-city', medal: 'gold' },
  { id: 'one-percent-first-play', title: 'Ladder Climber', description: 'Finish a Vachnamrut 1% Club run.', group: 'one-percent', medal: 'bronze' },
  { id: 'one-percent-club', title: '1% Club', description: 'Clear every Vachnamrut rung and join the 1% Club.', group: 'one-percent', medal: 'gold' },
  { id: 'one-percent-club-clears-10', title: 'Club Member', description: 'Join the 1% Club on 10 different days.', group: 'one-percent', medal: 'gold', progress: { stat: 'onePercentClubClears', goal: 10, unit: 'days' } },
  { id: 'one-percent-days-100', title: '100-Day 1% Club', description: 'Finish the 1% Club ladder on 100 days.', group: 'one-percent', medal: 'gold', progress: { stat: 'onePercentRuns', goal: 100, unit: 'days' } },
  { id: 'one-percent-days-200', title: '200-Day 1% Club', description: 'Finish the 1% Club ladder on 200 days.', group: 'one-percent', medal: 'gold', progress: { stat: 'onePercentRuns', goal: 200, unit: 'days' } },
  { id: 'one-percent-days-300', title: '300-Day 1% Club', description: 'Finish the 1% Club ladder on 300 days.', group: 'one-percent', medal: 'platinum', progress: { stat: 'onePercentRuns', goal: 300, unit: 'days' } },
  { id: 'one-percent-club-3-days', title: 'Club Regular', description: 'Join the 1% Club 3 days in a row.', group: 'one-percent', medal: 'silver', progress: { stat: 'onePercentClubCurrentStreak', goal: 3, unit: 'days' } },
  { id: 'one-percent-club-7-days', title: 'Week in the Club', description: 'Be part of the 1% Club 7 days in a row.', group: 'one-percent', medal: 'gold', progress: { stat: 'onePercentClubCurrentStreak', goal: 7, unit: 'days' } },
  { id: 'one-percent-club-14-days', title: 'Fortnight of Amrut', description: 'Join the 1% Club 14 days in a row.', group: 'one-percent', medal: 'gold', progress: { stat: 'onePercentClubCurrentStreak', goal: 14, unit: 'days' } },
  { id: 'one-percent-club-30-days', title: 'Club Devotee', description: 'Join the 1% Club 30 days in a row.', group: 'one-percent', medal: 'platinum', progress: { stat: 'onePercentClubCurrentStreak', goal: 30, unit: 'days' } },
  { id: 'bhakti-marg-first-win', title: 'First Sunrise', description: 'Complete a Surya Chandra puzzle for the first time.', group: 'bhakti-marg', medal: 'bronze' },
  { id: 'bhakti-marg-wins-7', title: 'Week of Light', description: 'Complete 7 Surya Chandra puzzles.', group: 'bhakti-marg', medal: 'silver', progress: { stat: 'bhaktiMargWins', goal: 7, unit: 'wins' } },
  { id: 'bhakti-marg-wins-30', title: 'Surya Chandra Sadhak', description: 'Complete 30 Surya Chandra puzzles.', group: 'bhakti-marg', medal: 'gold', progress: { stat: 'bhaktiMargWins', goal: 30, unit: 'wins' } },
  { id: 'bhakti-marg-wins-100', title: '100-Day Surya Chandra', description: 'Complete 100 Surya Chandra puzzles.', group: 'bhakti-marg', medal: 'gold', progress: { stat: 'bhaktiMargWins', goal: 100, unit: 'wins' } },
  { id: 'bhakti-marg-wins-200', title: '200-Day Surya Chandra', description: 'Complete 200 Surya Chandra puzzles.', group: 'bhakti-marg', medal: 'gold', progress: { stat: 'bhaktiMargWins', goal: 200, unit: 'wins' } },
  { id: 'bhakti-marg-wins-300', title: '300-Day Surya Chandra', description: 'Complete 300 Surya Chandra puzzles.', group: 'bhakti-marg', medal: 'platinum', progress: { stat: 'bhaktiMargWins', goal: 300, unit: 'wins' } },
  { id: 'bhakti-marg-no-hints', title: 'Pure Light', description: 'Complete Surya Chandra without using any hints.', group: 'bhakti-marg', medal: 'gold' },
  { id: 'bhakti-marg-no-hints-10', title: 'Clear Sky', description: 'Complete 10 Surya Chandra puzzles without hints.', group: 'bhakti-marg', medal: 'platinum', progress: { stat: 'bhaktiMargNoHints', goal: 10, unit: 'perfects' } },
  { id: 'bhakti-marg-sub-60s', title: 'Swift Dawn', description: 'Complete Surya Chandra in under 60 seconds.', group: 'bhakti-marg', medal: 'gold' },
  { id: 'ras-rani-first-win', title: 'First Nectar', description: 'Complete a Ras Rani puzzle for the first time.', group: 'ras-rani', medal: 'bronze' },
  { id: 'ras-rani-wins-7', title: 'Week of Nectar', description: 'Complete 7 Ras Rani puzzles.', group: 'ras-rani', medal: 'silver', progress: { stat: 'rasRaniWins', goal: 7, unit: 'wins' } },
  { id: 'ras-rani-wins-30', title: 'Ras Rani Sadhak', description: 'Complete 30 Ras Rani puzzles.', group: 'ras-rani', medal: 'gold', progress: { stat: 'rasRaniWins', goal: 30, unit: 'wins' } },
  { id: 'ras-rani-wins-100', title: '100-Day Ras Rani', description: 'Complete 100 Ras Rani puzzles.', group: 'ras-rani', medal: 'gold', progress: { stat: 'rasRaniWins', goal: 100, unit: 'wins' } },
  { id: 'ras-rani-wins-200', title: '200-Day Ras Rani', description: 'Complete 200 Ras Rani puzzles.', group: 'ras-rani', medal: 'gold', progress: { stat: 'rasRaniWins', goal: 200, unit: 'wins' } },
  { id: 'ras-rani-wins-300', title: '300-Day Ras Rani', description: 'Complete 300 Ras Rani puzzles.', group: 'ras-rani', medal: 'platinum', progress: { stat: 'rasRaniWins', goal: 300, unit: 'wins' } },
  { id: 'ras-rani-no-hints', title: 'Pure Nectar', description: 'Complete Ras Rani without using any hints.', group: 'ras-rani', medal: 'gold' },
  { id: 'ras-rani-no-hints-10', title: 'Nectar Master', description: 'Complete 10 Ras Rani puzzles without hints.', group: 'ras-rani', medal: 'platinum', progress: { stat: 'rasRaniNoHints', goal: 10, unit: 'perfects' } },
  { id: 'ras-rani-sub-60s', title: 'Swift Collector', description: 'Complete Ras Rani in under 60 seconds.', group: 'ras-rani', medal: 'gold' },
  { id: 'streak-7', title: '7-Day Streak', description: 'Keep your games streak going for 7 days.', group: 'streak', medal: 'silver', progress: { stat: 'gamesStreak', goal: 7, unit: 'days' } },
  { id: 'streak-30', title: '30-Day Streak', description: 'Keep your games streak going for 30 days.', group: 'streak', medal: 'gold', progress: { stat: 'gamesStreak', goal: 30, unit: 'days' } },
  { id: 'streak-100', title: '100-Day Streak', description: 'Keep your games streak going for 100 days.', group: 'streak', medal: 'gold', progress: { stat: 'gamesStreak', goal: 100, unit: 'days' } },
  { id: 'streak-200', title: '200-Day Streak', description: 'Keep your games streak going for 200 days.', group: 'streak', medal: 'gold', progress: { stat: 'gamesStreak', goal: 200, unit: 'days' } },
  { id: 'streak-300', title: '300-Day Streak', description: 'Keep your games streak going for 300 days.', group: 'streak', medal: 'platinum', progress: { stat: 'gamesStreak', goal: 300, unit: 'days' } }
]

export const ACHIEVEMENT_GROUP_TITLES: Record<AchievementGroup, string> = {
  wordle: 'Wordle',
  crossword: 'Crossword',
  connections: 'Connections',
  'bracket-city': 'Bracket City',
  'one-percent': '1% Club',
  'bhakti-marg': 'Surya Chandra',
  'ras-rani': 'Ras Rani',
  streak: 'Streaks'
}

export const CROWN_DEFINITIONS = [
  { id: 'wordle-fastest', title: 'Fastest Wordle', description: 'Current all-time fastest winning Wordle.', game: 'wordle' },
  { id: 'wordle-fewest-guesses', title: 'Fewest Guesses Wordle', description: 'Current all-time fewest-guesses winning Wordle.', game: 'wordle' },
  { id: 'crossword-fastest', title: 'Fastest Crossword', description: 'Current all-time fastest Crossword finish.', game: 'crossword' },
  { id: 'bracket-city-fastest', title: 'Fastest Bracket City', description: 'Current all-time fastest Bracket City finish.', game: 'bracket-city' },
  { id: 'bracket-city-fewest-peeks', title: 'Fewest Peeks Bracket City', description: 'Current all-time fewest-peek Bracket City finish.', game: 'bracket-city' },
  { id: 'one-percent-highest', title: '1% Club High Score', description: 'Current all-time most rungs cleared in 1% Club.', game: 'one-percent' },
  { id: 'one-percent-fastest', title: 'Fastest 1% Club', description: 'Current all-time fastest full 1% Club clear.', game: 'one-percent' },
  { id: 'bhakti-marg-fastest', title: 'Fastest Surya Chandra', description: 'Current all-time fastest Surya Chandra completion.', game: 'bhakti-marg' },
  { id: 'bhakti-marg-fewest-moves', title: 'Fewest Moves Surya Chandra', description: 'Current all-time fewest-move Surya Chandra completion.', game: 'bhakti-marg' },
  { id: 'ras-rani-fastest', title: 'Fastest Ras Rani', description: 'Current all-time fastest Ras Rani completion.', game: 'ras-rani' },
  { id: 'ras-rani-fewest-moves', title: 'Fewest Moves Ras Rani', description: 'Current all-time fewest moves Ras Rani completion.', game: 'ras-rani' },
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
    { unlockedIds: string[]; claimedCrownIds?: string[]; crowns: AchievementCrownRecord[] }
  >(functionsClient(), 'processGameAchievements')
  return (await fn({ game, ...payload })).data
}

function unlockFromStreak(streak: PlayStreakRecord | null) {
  const unlocked = new Set<string>()
  const days = Math.max(streak?.currentStreak ?? 0, streak?.longestStreak ?? 0)
  if (days >= 7) unlocked.add('streak-7')
  if (days >= 30) unlocked.add('streak-30')
  if (days >= 100) unlocked.add('streak-100')
  if (days >= 200) unlocked.add('streak-200')
  if (days >= 300) unlocked.add('streak-300')
  return unlocked
}

export function achievementProgress(
  def: AchievementDefinition,
  record: UserAchievementsRecord | null,
  streak: PlayStreakRecord | null,
  unlocked = false
) {
  if (!def.progress) return null
  const stats = (record?.stats || {}) as Record<string, unknown>
  let current = Number(stats[def.progress.stat]) || 0
  if (def.progress.stat === 'gamesStreak') {
    current = Math.max(streak?.currentStreak ?? 0, streak?.longestStreak ?? 0)
  } else if (def.progress.stat === 'onePercentClubCurrentStreak') {
    current = Number(stats.onePercentClubCurrentStreak ?? record?.onePercentClubCurrentStreak) || 0
  }
  const goal = def.progress.goal
  const shown = unlocked ? goal : Math.min(Math.max(0, current), goal)
  const unit = def.progress.unit ? ` ${def.progress.unit}` : ''
  return {
    current: Math.max(0, current),
    goal,
    percent: Math.round((shown / goal) * 100),
    label: `${shown} / ${goal}${unit}`
  }
}

export function crownTitle(id: string) {
  return CROWN_DEFINITIONS.find(item => item.id === id)?.title || id
}

export function crownValue(crown: AchievementCrownRecord) {
  if (crown.id === 'wordle-fastest' || crown.id === 'crossword-fastest' || crown.id === 'bracket-city-fastest') {
    return formatElapsed(crown.timeMs || crown.value)
  }
  if (crown.id === 'wordle-fewest-guesses') {
    return `${crown.guesses || crown.value}/6${crown.timeMs ? ` · ${formatElapsed(crown.timeMs)}` : ''}`
  }
  if (crown.id === 'bracket-city-fewest-peeks') {
    const peeks = crown.score ?? crown.value
    return `${peeks} peek${peeks === 1 ? '' : 's'}${crown.timeMs ? ` · ${formatElapsed(crown.timeMs)}` : ''}`
  }
  if (crown.id === 'one-percent-fastest') {
    return formatElapsed(crown.timeMs || crown.value)
  }
  if (crown.id === 'one-percent-highest') {
    const rungs = crown.score || crown.value
    return `${rungs} cleared${crown.timeMs ? ` · ${formatElapsed(crown.timeMs)}` : ''}`
  }
  if (crown.id === 'bhakti-marg-fastest' || crown.id === 'ras-rani-fastest') {
    return formatElapsed(crown.timeMs || crown.value)
  }
  if (crown.id === 'bhakti-marg-fewest-moves' || crown.id === 'ras-rani-fewest-moves') {
    const moves = (crown as { moves?: number }).moves || crown.value
    return `${moves} move${moves === 1 ? '' : 's'}${crown.timeMs ? ` · ${formatElapsed(crown.timeMs)}` : ''}`
  }
  if (crown.id === 'streak-longest') {
    const days = crown.longestStreak || crown.value
    return `${days} day${days === 1 ? '' : 's'}`
  }
  return String(crown.value)
}

export function achievementById(id: string) {
  return ACHIEVEMENT_DEFINITIONS.find(item => item.id === id) || null
}

export type UnlockCelebration = {
  achievements: AchievementDefinition[]
  crowns: { id: string; title: string }[]
}

export function useAchievements() {
  const auth = useAuth()
  const userAchievements = useState<UserAchievementsRecord | null>('user-achievements', () => null)
  const crowns = useState<AchievementCrownRecord[]>('achievement-crowns', () => [])
  const streak = useState<PlayStreakRecord | null>('achievement-streak', () => null)
  const loading = useState<boolean>('achievement-loading', () => false)
  const error = useState<string>('achievement-error', () => '')
  const celebration = useState<UnlockCelebration | null>('achievement-celebration', () => null)

  const unlockedIds = computed(() => {
    const ids = new Set<string>(Object.keys(userAchievements.value?.achievements || {}))
    for (const id of unlockFromStreak(streak.value)) ids.add(id)
    return ids
  })

  const achievements = computed(() => ACHIEVEMENT_DEFINITIONS.map(def => {
    const unlocked = unlockedIds.value.has(def.id)
    return {
      ...def,
      unlocked,
      unlock: userAchievements.value?.achievements?.[def.id],
      progressBar: achievementProgress(def, userAchievements.value, streak.value, unlocked)
    }
  }))

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
      const knownCrowns = new Set<string>(CROWN_DEFINITIONS.map(item => item.id))
      const crownSnap = await getDocs(collection(db, 'achievementCrowns'))
      crowns.value = crownSnap.docs
        .filter(item => knownCrowns.has(item.id))
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
    if (!auth.user.value) return { unlockedIds: [] as string[], claimedCrownIds: [] as string[] }
    const result = await callGameAchievements(game, payload)
    if (result) await fetchAll()
    const unlocked = (result?.unlockedIds || [])
      .map(id => achievementById(id))
      .filter((item): item is AchievementDefinition => !!item)
    const claimed = (result?.claimedCrownIds || []).map(id => ({
      id,
      title: crownTitle(id)
    }))
    if (unlocked.length || claimed.length) {
      celebration.value = { achievements: unlocked, crowns: claimed }
    }
    return result
  }

  function dismissCelebration() {
    celebration.value = null
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
    celebration,
    fetchAll,
    processResult,
    processWordleResult,
    dismissCelebration
  }
}
