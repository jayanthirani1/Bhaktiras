import { getApp } from 'firebase/app'
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type Firestore
} from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import type { ShopOrder, ShopOrderItem, ShopOrderStatus, ShopProduct, ShopSettings, ShopStaffRecord } from '~/types'
import { mapShopOrder, mapShopProduct, SHOP_SETTINGS_DOC_ID, SHOP_SETTINGS_FIELDS, SHOP_STATUS_LABELS } from '~/data/shop'
import { sortProducts } from '~/composables/useShop'

function requireDb(): Firestore {
  const db = import.meta.server ? null : (useNuxtApp().$firebaseDb as Firestore | null)
  if (!db) throw new Error('Firebase not configured')
  return db
}

function messageOf(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code) : ''
  if (code.endsWith('permission-denied')) return 'You do not have permission to do that. Deploy firestore.rules if this is new.'
  return error instanceof Error ? error.message : String(error)
}

/** Who is acting, for the order's change log. */
function useActorName() {
  const { adminRecord, shopRecord } = useAdminAccess()
  const { user, userName } = useAuth()
  return () => adminRecord.value?.name || shopRecord.value?.name || userName.value || user.value?.email || 'Shop team'
}

export type ShopProductInput = Omit<ShopProduct, 'id'>

export function useShopAdminProducts() {
  const products = ref<ShopProduct[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')

  async function fetchAll() {
    loading.value = true
    error.value = ''
    try {
      const snap = await getDocs(collection(requireDb(), 'shopProducts'))
      products.value = sortProducts(snap.docs.map(d => mapShopProduct(d.id, d.data())))
    } catch (e) {
      error.value = messageOf(e)
    } finally {
      loading.value = false
    }
  }

  function payload(input: ShopProductInput) {
    return {
      name: input.name.trim(),
      description: input.description.trim(),
      category: input.category.trim() || 'Other',
      images: input.images.slice(0, 8),
      sizes: input.sizes.map(size => ({ label: size.label.trim(), group: size.group })).filter(size => size.label),
      price: Math.max(0, Math.round(input.price)),
      childPrice: input.childPrice == null ? null : Math.max(0, Math.round(input.childPrice)),
      opensAt: input.opensAt ? Timestamp.fromDate(input.opensAt) : null,
      closesAt: input.closesAt ? Timestamp.fromDate(input.closesAt) : null,
      active: input.active,
      order: Math.round(input.order) || 0,
      updatedAt: serverTimestamp()
    }
  }

  async function save(id: string | null, input: ShopProductInput): Promise<string> {
    saving.value = true
    error.value = ''
    try {
      const db = requireDb()
      let savedId = id
      if (id) await updateDoc(doc(db, 'shopProducts', id), payload(input))
      else savedId = (await addDoc(collection(db, 'shopProducts'), { ...payload(input), createdAt: serverTimestamp() })).id
      await fetchAll()
      return savedId as string
    } catch (e) {
      error.value = messageOf(e)
      throw e
    } finally {
      saving.value = false
    }
  }

  async function remove(id: string) {
    saving.value = true
    error.value = ''
    try {
      await deleteDoc(doc(requireDb(), 'shopProducts', id))
      await fetchAll()
    } catch (e) {
      error.value = messageOf(e)
    } finally {
      saving.value = false
    }
  }

  return { products, loading, saving, error, fetchAll, save, remove }
}

export function useShopAdminOrders() {
  const orders = ref<ShopOrder[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const actorName = useActorName()

  async function fetchAll() {
    loading.value = true
    error.value = ''
    try {
      const snap = await getDocs(collection(requireDb(), 'shopOrders'))
      orders.value = snap.docs.map(d => mapShopOrder(d.id, d.data())).sort((a, b) => b.number - a.number)
    } catch (e) {
      error.value = messageOf(e)
    } finally {
      loading.value = false
    }
  }

  function historyEntry(action: string, detail?: string) {
    return { at: Timestamp.now(), byName: actorName(), action, ...(detail ? { detail } : {}) }
  }

  async function write(order: ShopOrder, changes: Record<string, unknown>, action: string, detail?: string) {
    saving.value = true
    error.value = ''
    try {
      await updateDoc(doc(requireDb(), 'shopOrders', order.id), {
        ...changes,
        updatedAt: serverTimestamp(),
        history: arrayUnion(historyEntry(action, detail))
      })
      await fetchAll()
    } catch (e) {
      error.value = messageOf(e)
      throw e
    } finally {
      saving.value = false
    }
  }

  async function setStatus(order: ShopOrder, status: ShopOrderStatus) {
    if (order.status === status) return
    const changes: Record<string, unknown> = { status }
    if (status === 'paid') {
      changes.paidAt = serverTimestamp()
      changes.paidBy = actorName()
    } else {
      changes.paidAt = null
      changes.paidBy = null
    }
    const action = status === 'paid'
      ? 'Marked paid'
      : status === 'cancelled'
        ? 'Cancelled'
        : order.status === 'cancelled' ? 'Reinstated' : 'Marked unpaid'
    await write(order, changes, action, `${SHOP_STATUS_LABELS[order.status]} → ${SHOP_STATUS_LABELS[status]}`)
  }

  async function saveEdits(order: ShopOrder, edits: { customer: ShopOrder['customer']; note: string; items: ShopOrderItem[] }) {
    const items = edits.items
      .filter(item => item.quantity > 0)
      .map(item => ({ ...item, quantity: Math.round(item.quantity), lineTotal: item.unitPrice * Math.round(item.quantity) }))
    const total = items.reduce((sum, item) => sum + item.lineTotal, 0)
    const changed: string[] = []
    if (JSON.stringify(edits.customer) !== JSON.stringify(order.customer)) changed.push('customer details')
    if (edits.note !== order.note) changed.push('note')
    if (JSON.stringify(items) !== JSON.stringify(order.items)) changed.push('items')
    if (!changed.length) return
    await write(
      order,
      { customer: edits.customer, note: edits.note, items, total },
      'Edited',
      `Changed ${changed.join(', ')}${total !== order.total ? ` · total £${(order.total / 100).toFixed(2)} → £${(total / 100).toFixed(2)}` : ''}`
    )
  }

  return { orders, loading, saving, error, fetchAll, setStatus, saveEdits }
}

export function useShopAdminSettings() {
  const saving = ref(false)
  const error = ref('')

  async function save(settings: ShopSettings) {
    saving.value = true
    error.value = ''
    try {
      const payload: Record<string, unknown> = { updatedAt: serverTimestamp() }
      for (const field of SHOP_SETTINGS_FIELDS) payload[field.key] = (settings[field.key] || '').trim().slice(0, field.maxLength)
      await setDoc(doc(requireDb(), 'shopSettings', SHOP_SETTINGS_DOC_ID), payload, { merge: true })
    } catch (e) {
      error.value = messageOf(e)
      throw e
    } finally {
      saving.value = false
    }
  }

  return { saving, error, save }
}

/** Admins only: who is on the shop team. */
export function useShopStaff() {
  const staff = ref<ShopStaffRecord[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')

  async function fetchAll() {
    loading.value = true
    error.value = ''
    try {
      const snap = await getDocs(collection(requireDb(), 'shopStaff'))
      staff.value = snap.docs
        .map(d => ({ id: d.id, name: String(d.data().name || ''), email: String(d.data().email || ''), active: d.data().active !== false }))
        .sort((a, b) => a.name.localeCompare(b.name))
    } catch (e) {
      error.value = messageOf(e)
    } finally {
      loading.value = false
    }
  }

  async function grant(email: string, name: string) {
    saving.value = true
    error.value = ''
    try {
      const call = httpsCallable<{ email: string; name: string }, { uid: string }>(
        getFunctions(getApp(), 'europe-west2'),
        'grantShopAccess'
      )
      await call({ email, name })
      await fetchAll()
    } catch (e) {
      error.value = messageOf(e)
      throw e
    } finally {
      saving.value = false
    }
  }

  async function setActive(member: ShopStaffRecord, active: boolean) {
    saving.value = true
    error.value = ''
    try {
      await updateDoc(doc(requireDb(), 'shopStaff', member.id), { active })
      await fetchAll()
    } catch (e) {
      error.value = messageOf(e)
    } finally {
      saving.value = false
    }
  }

  async function remove(member: ShopStaffRecord) {
    saving.value = true
    error.value = ''
    try {
      await deleteDoc(doc(requireDb(), 'shopStaff', member.id))
      await fetchAll()
    } catch (e) {
      error.value = messageOf(e)
    } finally {
      saving.value = false
    }
  }

  return { staff, loading, saving, error, fetchAll, grant, setActive, remove }
}
