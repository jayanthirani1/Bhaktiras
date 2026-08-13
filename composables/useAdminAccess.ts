import { doc, getDoc, type DocumentData, type Firestore } from 'firebase/firestore'
import type { AdminRecord } from '~/types'

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

export function mapAdminDoc(id: string, data: DocumentData): AdminRecord {
  return {
    id,
    name: String(data.name || ''),
    role: data.role === 'guest' ? 'guest' : 'admin',
    active: data.active !== false
  }
}

/** `admins` doc id = Auth UID. Fields: name, role (admin|guest), active. */
export function useAdminAccess() {
  const { user, isLoggedIn } = useAuth()
  const adminRecord = useState<AdminRecord | null>('admin-record', () => null)
  const adminChecked = useState<boolean>('admin-checked', () => false)

  async function refreshAdmin() {
    adminChecked.value = false
    adminRecord.value = null
    const uid = user.value?.uid
    if (!uid) {
      adminChecked.value = true
      return
    }
    try {
      const db = getDb()
      if (!db) {
        adminChecked.value = true
        return
      }
      const snap = await getDoc(doc(db, 'admins', uid))
      if (snap.exists()) {
        const rec = mapAdminDoc(snap.id, snap.data())
        if (rec.active) adminRecord.value = rec
      }
    } catch (e) {
      console.warn('[admin] could not read admins collection', e)
    } finally {
      adminChecked.value = true
    }
  }

  watch(
    () => user.value?.uid,
    () => { refreshAdmin() },
    { immediate: true }
  )

  const isAdminUser = computed(() => isLoggedIn.value && !!adminRecord.value)

  return { isAdminUser, adminRecord, adminChecked, refreshAdmin }
}
