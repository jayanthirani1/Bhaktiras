import { getApp } from 'firebase/app'
import { collection, doc, getDoc, getDocs, query, where, type Firestore } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import type { ShopBasketLine, ShopOrder, ShopProduct, ShopSettings } from '~/types'
import {
  basketKey,
  DEFAULT_SHOP_SETTINGS,
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

  function add(productId: string, size: string | null, quantity = 1) {
    const key = basketKey({ productId, size })
    const existing = lines.value.find(line => basketKey(line) === key)
    if (existing) {
      save(lines.value.map(line => basketKey(line) === key
        ? { ...line, quantity: Math.min(SHOP_MAX_QUANTITY, line.quantity + quantity) }
        : line))
      return
    }
    if (lines.value.length >= SHOP_MAX_LINES) return
    save([...lines.value, { productId, size, quantity: Math.min(SHOP_MAX_QUANTITY, quantity) }])
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
    const unitPrice = product ? unitPriceFor(product, line.size) : 0
    const available = !!product && windowState(product) === 'open'
      && (product.sizes.length ? product.sizes.some(size => size.label === line.size) : !line.size)
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
}

export async function placeShopOrder(input: PlaceShopOrderInput): Promise<string> {
  const call = httpsCallable<PlaceShopOrderInput, { reference: string }>(
    getFunctions(getApp(), 'europe-west2'),
    'placeShopOrder'
  )
  const result = await call(input)
  return result.data.reference
}

/** A callable's error, in words a devotee can act on. */
export function explainShopError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code) : ''
  const message = error instanceof Error ? error.message : ''
  if (code.endsWith('unauthenticated')) return 'Please sign in again, then place your order.'
  if (code.endsWith('invalid-argument') || code.endsWith('failed-precondition') || code.endsWith('not-found')) {
    return message || 'Please check your order and try again.'
  }
  if (code.endsWith('unavailable') || code.endsWith('internal') || code.endsWith('deadline-exceeded')) {
    return 'We could not reach the shop just now. Please check your connection and try again.'
  }
  return message || 'Your order could not be placed. Please try again.'
}

/** The signed-in devotee's own orders, newest first. */
export function useMyShopOrders() {
  const { user } = useAuth()
  const orders = ref<ShopOrder[]>([])
  const loading = ref(false)
  const error = ref('')

  async function load() {
    const uid = user.value?.uid
    const db = getDb()
    if (!uid || !db) {
      orders.value = []
      return
    }
    loading.value = true
    error.value = ''
    try {
      // One equality filter, sorted here — no composite index needed.
      const snap = await getDocs(query(collection(db, 'shopOrders'), where('userId', '==', uid)))
      orders.value = snap.docs
        .map(d => mapShopOrder(d.id, d.data()))
        .sort((a, b) => b.number - a.number)
    } catch (e) {
      error.value = 'Your orders could not be loaded.'
      console.warn('[shop] could not load orders', e)
    } finally {
      loading.value = false
    }
  }

  return { orders, loading, error, load }
}

export async function fetchShopOrder(reference: string): Promise<ShopOrder | null> {
  const db = getDb()
  if (!db) return null
  const snap = await getDoc(doc(db, 'shopOrders', reference))
  return snap.exists() ? mapShopOrder(snap.id, snap.data()) : null
}
