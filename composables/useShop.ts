import { getApp } from 'firebase/app'
import { collection, doc, getDoc, getDocs, query, where, type Firestore } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import type { ShopBasketLine, ShopOrder, ShopProduct, ShopSettings, ShopSizeGroup } from '~/types'
import {
  basketKey,
  DEFAULT_SHOP_SETTINGS,
  findSize,
  mapShopOrder,
  mapShopProduct,
  SHOP_BASKET_KEY,
  SHOP_MAX_LINES,
  SHOP_MAX_QUANTITY,
  SHOP_SETTINGS_DOC_ID,
  shopSettingsFromSource,
  unitPriceFor,
  windowState
} from '~/data/shop'

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

export function sortProducts(products: ShopProduct[]): ShopProduct[] {
  return [...products].sort((a, b) =>
    a.category.localeCompare(b.category) || (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
}

/** Bank details and shop wording. Public, cached for the session. */
export function useShopSettings() {
  const settings = useState<ShopSettings>('shop-settings', () => ({ ...DEFAULT_SHOP_SETTINGS }))
  const loaded = useState<boolean>('shop-settings-loaded', () => false)

  async function load(force = false) {
    if (loaded.value && !force) return
    const db = getDb()
    if (!db) return
    try {
      const snap = await getDoc(doc(db, 'shopSettings', SHOP_SETTINGS_DOC_ID))
      settings.value = shopSettingsFromSource(snap.exists() ? snap.data() : null)
      loaded.value = true
    } catch (error) {
      console.warn('[shop] could not load settings', error)
    }
  }

  return { settings, loaded, load }
}

/** The active catalogue, as a devotee sees it. */
export function useShopProducts() {
  const products = useState<ShopProduct[]>('shop-products', () => [])
  const loading = useState<boolean>('shop-products-loading', () => false)
  const loaded = useState<boolean>('shop-products-loaded', () => false)
  const error = ref('')

  async function load(force = false) {
    if (loaded.value && !force) return
    const db = getDb()
    if (!db) {
      loaded.value = true
      return
    }
    loading.value = true
    error.value = ''
    try {
      // The rules only let a devotee read active products, so the query has
      // to say so too — Firestore refuses a query the rules might not allow.
      const snap = await getDocs(query(collection(db, 'shopProducts'), where('active', '==', true)))
      products.value = sortProducts(snap.docs.map(d => mapShopProduct(d.id, d.data())))
      loaded.value = true
    } catch (e) {
      error.value = 'The shop could not be loaded. Please try again.'
      console.warn('[shop] could not load products', e)
    } finally {
      loading.value = false
    }
  }

  function byId(id: string) {
    return products.value.find(product => product.id === id) ?? null
  }

  return { products, loading, loaded, error, load, byId }
}

function readBasket(): ShopBasketLine[] {
  if (import.meta.server || typeof localStorage === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(SHOP_BASKET_KEY) || '[]')
    if (!Array.isArray(raw)) return []
    return raw
      .map(line => ({
        productId: String(line?.productId || ''),
        size: typeof line?.size === 'string' && line.size ? line.size : null,
        group: line?.group === 'child' || line?.group === 'adult' ? line.group as ShopSizeGroup : null,
        quantity: Math.min(SHOP_MAX_QUANTITY, Math.max(1, Math.floor(Number(line?.quantity) || 1)))
      }))
      .filter(line => line.productId)
      .slice(0, SHOP_MAX_LINES)
  } catch {
    return []
  }
}

function writeBasket(lines: ShopBasketLine[]) {
  if (import.meta.server || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SHOP_BASKET_KEY, JSON.stringify(lines))
  } catch {
    // A blocked store just means the basket lasts for this visit only.
  }
}

/**
 * The basket lives on this device until the order is placed. It holds only
 * product, size and quantity — prices are always read from the product, and
 * the order function prices it again, so a stale basket can never charge a
 * stale price.
 */
export function useShopBasket() {
  const lines = useState<ShopBasketLine[]>('shop-basket', () => [])
  const hydrated = useState<boolean>('shop-basket-hydrated', () => false)
  const { byId } = useShopProducts()

  if (import.meta.client && !hydrated.value) {
    lines.value = readBasket()
    hydrated.value = true
  }

  function save(next: ShopBasketLine[]) {
    lines.value = next
    writeBasket(next)
  }

  function add(productId: string, size: string | null, group: ShopSizeGroup | null, quantity = 1) {
    const key = basketKey({ productId, size, group })
    const existing = lines.value.find(line => basketKey(line) === key)
    if (existing) {
      save(lines.value.map(line => basketKey(line) === key
        ? { ...line, quantity: Math.min(SHOP_MAX_QUANTITY, line.quantity + quantity) }
        : line))
      return
    }
    if (lines.value.length >= SHOP_MAX_LINES) return
    save([...lines.value, { productId, size, group, quantity: Math.min(SHOP_MAX_QUANTITY, quantity) }])
  }

  function setQuantity(line: ShopBasketLine, quantity: number) {
    const key = basketKey(line)
    if (quantity < 1) {
      save(lines.value.filter(item => basketKey(item) !== key))
      return
    }
    save(lines.value.map(item => basketKey(item) === key ? { ...item, quantity: Math.min(SHOP_MAX_QUANTITY, quantity) } : item))
  }

  function remove(line: ShopBasketLine) {
    setQuantity(line, 0)
  }

  function clear() {
    save([])
  }

  /** Lines joined to their product. A line whose product is gone or closed is flagged, not dropped. */
  const detailed = computed(() => lines.value.map((line) => {
    const product = byId(line.productId)
    const unitPrice = product ? unitPriceFor(product, line.size, line.group) : 0
    // A line from a basket saved before sizes carried a group resolves by name
    // when that is unambiguous; otherwise it is flagged for removal.
    const available = !!product && windowState(product) === 'open'
      && (product.sizes.length ? !!findSize(product, line.size, line.group) : !line.size)
    return { line, product, unitPrice, lineTotal: unitPrice * line.quantity, available }
  }))

  const count = computed(() => lines.value.reduce((sum, line) => sum + line.quantity, 0))
  const total = computed(() => detailed.value.filter(item => item.available).reduce((sum, item) => sum + item.lineTotal, 0))

  return { lines, detailed, count, total, add, setQuantity, remove, clear }
}

export interface PlaceShopOrderInput {
  items: ShopBasketLine[]
  name: string
  email: string
  phone: string
  note: string
  acceptTerms: boolean
  termsVersion: string
  /** Same id on a retry of the same checkout, so it cannot order twice. */
  requestId: string
}

/** A fresh id for one checkout attempt. */
export function newShopRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

/**
 * The test site orders through its own function, which gives a BRTEST-
 * reference and keeps the order out of the Treasury's totals. Live orders
 * never go near it.
 */
export async function placeShopOrder(input: PlaceShopOrderInput, isTestSite: boolean): Promise<string> {
  const call = httpsCallable<PlaceShopOrderInput, { reference: string }>(
    getFunctions(getApp(), 'europe-west2'),
    isTestSite ? 'placeTestShopOrder' : 'placeShopOrder'
  )
  const result = await call(input)
  return result.data.reference
}

/** A callable's error, in words a devotee can act on. */
export function explainShopError(error: unknown, isTestSite = false): string {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code) : ''
  const message = error instanceof Error ? error.message : ''
  // Until the backend that carries placeTestShopOrder is deployed, the test
  // site's checkout has nothing to call. Nothing was ordered, so say so.
  if (isTestSite && (code.endsWith('not-found') || code.endsWith('internal'))) {
    return 'Test checkout is not switched on yet: it needs the latest update deployed to the live backend. Nothing was ordered.'
  }
  if (code.endsWith('unauthenticated')) return 'Please sign in again, then place your order.'
  if (code.endsWith('invalid-argument') || code.endsWith('failed-precondition') || code.endsWith('not-found')) {
    return message || 'Please check your order and try again.'
  }
  if (code.endsWith('unavailable') || code.endsWith('internal') || code.endsWith('deadline-exceeded')) {
    return 'We could not reach the shop just now. Please check your connection and try again.'
  }
  return message || 'Your order could not be placed. Please try again.'
}

/** Whether the Shop is switched on — or previewed, on the test site. */
export function useShopVisible() {
  const { isSectionVisible } = useSiteContent()
  return computed(() => isSectionVisible('shop'))
}

let myOrdersInFlight: { uid: string; promise: Promise<void> } | null = null

/**
 * The signed-in devotee's own orders, newest first.
 *
 * Shared: the nav, the Shop's "awaiting payment" banner, My orders and the
 * account page all read one list, fetched once per account and refreshed
 * after an order is placed — not one query per component.
 */
export function useMyShopOrders() {
  const { user } = useAuth()
  const orders = useState<ShopOrder[]>('shop-my-orders', () => [])
  const loadedFor = useState<string | null>('shop-my-orders-uid', () => null)
  const loading = useState<boolean>('shop-my-orders-loading', () => false)
  const error = useState<string>('shop-my-orders-error', () => '')

  async function fetchOrders(uid: string) {
    const db = getDb()
    if (!db) return
    loading.value = true
    error.value = ''
    try {
      // One equality filter, sorted here — no composite index needed.
      const snap = await getDocs(query(collection(db, 'shopOrders'), where('userId', '==', uid)))
      // The account may have changed while this was in flight.
      if (user.value?.uid !== uid) return
      orders.value = snap.docs
        .map(d => mapShopOrder(d.id, d.data()))
        .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0) || b.number - a.number)
      loadedFor.value = uid
    } catch (e) {
      error.value = 'Your orders could not be loaded.'
      console.warn('[shop] could not load orders', e)
    } finally {
      loading.value = false
    }
  }

  /** Loads once per account; `force` refreshes (after placing an order). */
  async function load(force = false) {
    const uid = user.value?.uid
    if (!uid) {
      orders.value = []
      loadedFor.value = null
      return
    }
    if (!force && loadedFor.value === uid) return
    // Join a fetch already running for this same account; a different
    // account (a quick sign-out and in) starts its own.
    if (myOrdersInFlight && myOrdersInFlight.uid === uid && !force) return myOrdersInFlight.promise
    if (loadedFor.value !== uid) orders.value = []
    const entry = { uid, promise: fetchOrders(uid) }
    entry.promise = entry.promise.finally(() => { if (myOrdersInFlight === entry) myOrdersInFlight = null })
    myOrdersInFlight = entry
    return entry.promise
  }

  const awaitingPayment = computed(() => orders.value.filter(order => order.status === 'awaiting_payment'))

  return { orders, awaitingPayment, loading, error, load }
}

export async function fetchShopOrder(reference: string): Promise<ShopOrder | null> {
  const db = getDb()
  if (!db) return null
  const snap = await getDoc(doc(db, 'shopOrders', reference))
  return snap.exists() ? mapShopOrder(snap.id, snap.data()) : null
}
