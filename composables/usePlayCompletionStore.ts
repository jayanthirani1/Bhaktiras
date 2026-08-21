import { deleteField, doc, getDoc, setDoc, updateDoc, serverTimestamp, type Firestore } from 'firebase/firestore'
import { ukDateId } from '~/utils/gameDay'
import { resetGameDayLocally } from '~/utils/gameStorageReset'
import {
  isPlayDoneLocally,
  markPlayDoneLocally,
  readLocalPlayCompletion,
  type PlayCompletionEntry,
  type PlayGameSlug
} from '~/utils/playCompletion'

type CompletionMap = Partial<Record<PlayGameSlug, PlayCompletionEntry>>

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

function sanitise(meta: PlayCompletionEntry): PlayCompletionEntry {
  const out: PlayCompletionEntry = {}
  if (Number.isFinite(meta.score)) out.score = Math.trunc(Number(meta.score))
  if (Number.isFinite(meta.timeMs)) out.timeMs = Math.max(0, Math.trunc(Number(meta.timeMs)))
  if (meta.detail) out.detail = String(meta.detail).slice(0, 64)
  return out
}

/**
 * Today's completed games for the signed-in user, stored per day so a result
 * recorded on one device is visible on the next.
 */
export function usePlayCompletionStore() {
  const auth = useAuth()
  const remote = useState<CompletionMap>('play-completions', () => ({}))
  const loaded = useState<boolean>('play-completions-loaded', () => false)
  const loadedFor = useState<string>('play-completions-loaded-for', () => '')

  function dayRef(db: Firestore, uid: string) {
    return doc(db, 'playCompletions', uid, 'days', ukDateId())
  }

  async function load(force = false) {
    if (import.meta.server) return
    const uid = auth.user.value?.uid || ''
    const key = `${uid}:${ukDateId()}`
    if (!force && loadedFor.value === key) return

    if (!uid) {
      remote.value = {}
      loaded.value = true
      loadedFor.value = key
      return
    }

    const db = getDb()
    if (!db) return
    try {
      const snap = await getDoc(dayRef(db, uid))
      remote.value = snap.exists() ? ((snap.data().games || {}) as CompletionMap) : {}
    } catch {
      remote.value = {}
    }
    loaded.value = true
    loadedFor.value = key
  }

  async function markDone(slug: PlayGameSlug, meta: PlayCompletionEntry = {}) {
    const entry = sanitise(meta)
    markPlayDoneLocally(slug, entry)
    remote.value = { ...remote.value, [slug]: entry }

    const uid = auth.user.value?.uid
    const db = getDb()
    if (!uid || !db) return
    try {
      await setDoc(dayRef(db, uid), {
        userId: uid,
        dateId: ukDateId(),
        games: { [slug]: entry },
        updatedAt: serverTimestamp()
      }, { merge: true })
    } catch {
      // Offline or rules not deployed — the local marker still holds for today.
    }
  }

  /**
   * Undoes today's completion for one game, on this device and in the synced
   * record. Without the remote half the player is locked out entirely: a
   * completion that exists remotely but not locally reads as "played on
   * another device".
   */
  async function clearGame(slug: PlayGameSlug, dateId = ukDateId()) {
    resetGameDayLocally(slug, dateId)
    const next = { ...remote.value }
    delete next[slug]
    remote.value = next

    const uid = auth.user.value?.uid
    const db = getDb()
    if (!uid || !db) return
    try {
      await updateDoc(doc(db, 'playCompletions', uid, 'days', dateId), {
        [`games.${slug}`]: deleteField(),
        updatedAt: serverTimestamp()
      })
    } catch {
      // No document for the day yet, or offline — the local clear still stands.
    }
  }

  onMounted(() => {
    void load()
    watch(() => auth.user.value?.uid, () => { void load(true) })
  })

  return { remote, loaded, load, markDone, clearGame }
}

/** Per-game guard so a game finished on another device cannot be replayed. */
export function useDailyGameCompletion(slug: PlayGameSlug) {
  const auth = useAuth()
  const { request: requestPushPrompt } = usePushPrompt()
  const { remote, loaded, markDone: store } = usePlayCompletionStore()
  const localDone = ref(false)

  onMounted(() => { localDone.value = isPlayDoneLocally(slug) })

  const result = computed<PlayCompletionEntry | null>(() =>
    remote.value[slug] || readLocalPlayCompletion(slug) || null
  )

  const playedElsewhere = computed(() => !localDone.value && !!remote.value[slug])

  async function markDone(meta: PlayCompletionEntry = {}) {
    const firstCompletion = !localDone.value
    localDone.value = true
    await store(slug, meta)
    if (firstCompletion && auth.user.value?.uid) requestPushPrompt('game-complete')
  }

  /**
   * Pushes a result that was finished on this device before it could be saved
   * remotely (signed out at the time, offline, or pre-sync progress).
   */
  function backfill(getMeta: () => PlayCompletionEntry) {
    watch(
      [loaded, localDone, () => auth.user.value?.uid],
      () => {
        if (!loaded.value || !localDone.value) return
        if (!auth.user.value?.uid || remote.value[slug]) return
        void store(slug, getMeta())
      },
      { immediate: true }
    )
  }

  return { playedElsewhere, result, ready: loaded, markDone, backfill }
}
