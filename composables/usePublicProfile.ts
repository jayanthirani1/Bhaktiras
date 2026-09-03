import {
  collection,
  doc,
  getDoc,
  getDocs,
  type Firestore
} from 'firebase/firestore'
import type {
  AchievementCrownRecord,
  PlayStreakRecord,
  UserAchievementsRecord
} from '~/types'
import {
  ACHIEVEMENT_DEFINITIONS,
  CROWN_DEFINITIONS,
  crownTitle,
  crownValue,
  type AchievementDefinition,
  type AchievementMedal
} from '~/composables/useAchievements'
import { ukMonthId } from '~/utils/gameDay'

export type PublicProfileAchievement = {
  id: string
  title: string
  description: string
  medal: AchievementMedal
  group: string
}

export type PublicProfileCrown = {
  id: string
  title: string
  valueLabel: string
  holderName: string
}

export type PublicProfile = {
  uid: string
  displayName: string
  crowns: PublicProfileCrown[]
  achievements: PublicProfileAchievement[]
  streak: {
    currentStreak: number
    longestStreak: number
  } | null
}

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

/** Public devotee card: crowns, unlocked achievements, and play streak. */
export function usePublicProfile() {
  const profile = ref<PublicProfile | null>(null)
  const loading = ref(false)
  const error = ref('')
  const notFound = ref(false)

  async function fetchProfile(uid: string) {
    const cleaned = uid.trim()
    if (!cleaned) {
      profile.value = null
      notFound.value = true
      return
    }

    const db = getDb()
    if (!db) {
      error.value = 'Firebase is not configured'
      return
    }

    loading.value = true
    error.value = ''
    notFound.value = false
    profile.value = null

    try {
      const [publicSnap, streakSnap, achSnap, crownSnap] = await Promise.all([
        getDoc(doc(db, 'publicProfiles', cleaned)),
        getDoc(doc(db, 'playStreaks', cleaned)),
        getDoc(doc(db, 'userAchievements', cleaned)),
        getDocs(collection(db, 'achievementCrowns'))
      ])

      const knownCrowns = new Set<string>(CROWN_DEFINITIONS.map(item => item.id))
      const monthId = ukMonthId()
      const heldCrowns = crownSnap.docs
        .filter(item => knownCrowns.has(item.id))
        .map(item => ({
          id: item.id,
          ...(item.data() as Omit<AchievementCrownRecord, 'id'>)
        }))
        .filter(crown => crown.monthId === monthId && crown.holderUserId === cleaned)
        .map(crown => ({
          id: crown.id,
          title: crownTitle(crown.id),
          valueLabel: crownValue(crown),
          holderName: crown.holderName
        }))

      const achievementsDoc = achSnap.exists()
        ? { id: achSnap.id, ...(achSnap.data() as Omit<UserAchievementsRecord, 'id'>) }
        : null
      const unlockedIds = new Set(Object.keys(achievementsDoc?.achievements || {}))
      const unlocked: PublicProfileAchievement[] = ACHIEVEMENT_DEFINITIONS
        .filter(def => unlockedIds.has(def.id))
        .map((def: AchievementDefinition) => ({
          id: def.id,
          title: def.title,
          description: def.description,
          medal: def.medal,
          group: def.group
        }))

      const streak = streakSnap.exists()
        ? (() => {
            const data = streakSnap.data() as Omit<PlayStreakRecord, 'id'>
            return {
              currentStreak: Math.max(0, Number(data.currentStreak) || 0),
              longestStreak: Math.max(0, Number(data.longestStreak) || 0)
            }
          })()
        : null

      const publicName = publicSnap.exists()
        ? String((publicSnap.data() as { displayName?: string }).displayName || '').trim()
        : ''
      const streakName = streakSnap.exists()
        ? String((streakSnap.data() as { userName?: string }).userName || '').trim()
        : ''
      const crownName = heldCrowns[0]?.holderName?.trim() || ''

      const displayName = publicName || streakName || crownName || 'Devotee'
      const hasAnything = heldCrowns.length
        || unlocked.length
        || (streak && (streak.currentStreak > 0 || streak.longestStreak > 0))
        || !!publicName
        || !!streakName

      if (!hasAnything) {
        notFound.value = true
        profile.value = null
        return
      }

      profile.value = {
        uid: cleaned,
        displayName,
        crowns: heldCrowns,
        achievements: unlocked,
        streak: streak && (streak.currentStreak > 0 || streak.longestStreak > 0) ? streak : null
      }
    } catch (e) {
      error.value = (e as Error).message || 'Could not load this profile.'
      profile.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    profile,
    loading,
    error,
    notFound,
    fetchProfile
  }
}

export function devoteeProfilePath(uid: string | null | undefined): string | null {
  const cleaned = (uid || '').trim()
  return cleaned ? `/devotee/${encodeURIComponent(cleaned)}` : null
}
