import { doc, getDoc, type DocumentData, type Firestore } from 'firebase/firestore'
import type { AdminRecord, ShopStaffRecord } from '~/types'

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

export function mapAdminDoc(id: string, data: DocumentData): AdminRecord {
  return {
    id,
    name: String(data.name || ''),
    active: data.active !== false
  }
}

/**
 * `admins` doc id = Auth UID. Fields: name, active.
 *
 * There is no privilege tier here. Documents carried a `role` of 'admin' or
 * 'guest', and the sidebar displayed it, but nothing anywhere enforced it:
 * `isAdmin()` in firestore.rules checks only that the document exists and is
 * active, and the Cloud Functions and admin middleware do the same. A "guest"
 * could edit every CMS collection, push a notification to the whole sangat and
 * create further admins — so the label described a restriction that did not
 * exist, which is worse than no label at all.
 *
 * Dropping it makes the code state the truth: an `admins` document is full
 * access. A real read-only tier means enforcing it in the rules first, on
 * every write path, not reintroducing the field here.
 *
 * Stored documents may still carry `role`; it is simply ignored.
 */
export function useAdminAccess() {
  const { user, isLoggedIn } = useAuth()
  const adminRecord = useState<AdminRecord | null>('admin-record', () => null)
  const adminChecked = useState<boolean>('admin-checked', () => false)
  /**
   * `shopStaff/{uid}`: the Souvenir lead and Treasury team. A narrower grant
   * than `admins` — the shop admin pages and nothing else, enforced by
   * `isShopStaff()` in firestore.rules. Full admins have the shop as well.
   */
  const shopRecord = useState<ShopStaffRecord | null>('shop-staff-record', () => null)

  async function refreshAdmin() {
    adminChecked.value = false
    adminRecord.value = null
    shopRecord.value = null
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
      const [snap, shopSnap] = await Promise.all([
        getDoc(doc(db, 'admins', uid)),
        getDoc(doc(db, 'shopStaff', uid)).catch(() => null)
      ])
      if (snap.exists()) {
        const rec = mapAdminDoc(snap.id, snap.data())
        if (rec.active) adminRecord.value = rec
      }
      if (shopSnap?.exists()) {
        const data = shopSnap.data()
        if (data.active !== false) {
          shopRecord.value = { id: shopSnap.id, name: String(data.name || ''), email: String(data.email || ''), active: true }
        }
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
  /** Can use the shop admin pages: shop staff, or any full admin. */
  const isShopUser = computed(() => isLoggedIn.value && (!!adminRecord.value || !!shopRecord.value))
  /** Shop staff without full admin — sees the shop pages and nothing else. */
  const isShopOnly = computed(() => isShopUser.value && !adminRecord.value)

  return { isAdminUser, isShopUser, isShopOnly, adminRecord, shopRecord, adminChecked, refreshAdmin }
}
