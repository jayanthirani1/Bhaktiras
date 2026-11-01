import type {
  ShopBasketLine,
  ShopOrder,
  ShopOrderHistoryEntry,
  ShopOrderItem,
  ShopOrderStatus,
  ShopProduct,
  ShopSettings,
  ShopSize,
  ShopSizeGroup
} from '~/types'

/**
 * The souvenir shop: pre-orders for the Patotsav, paid outside the app.
 *
 * Nothing here takes money. A devotee places an order, is shown a payment
 * reference and the mandir's bank details, and the Treasury team marks the
 * order paid once the transfer (or cash at the mandir) arrives. Only paid
 * orders count towards the quantities ordered from suppliers.
 *
 * Orders are created by the `placeShopOrder` Cloud Function, never by the
 * browser, so the price on an order is always the price on the product.
 * `functions/index.js` repeats `shopReference` and `unitPriceFor` below; keep
 * the two in step.
 */

export const SHOP_SETTINGS_DOC_ID = 'main'
export const SHOP_REFERENCE_PREFIX = 'BRSHOP-'
export const SHOP_BASKET_KEY = 'bhaktiras:shop-basket'
export const SHOP_MAX_QUANTITY = 99
export const SHOP_MAX_LINES = 40
export const SHOP_MAX_IMAGES = 8

/**
 * Bump when the default terms below change in a way a devotee should see
 * again. Each order records the version that was on screen when it was
 * placed. Terms reworded in Admin → Shop → Settings are stamped `custom-` plus
 * a short hash of their text, so the order still says which wording applied.
 */
export const SHOP_TERMS_VERSION = '2026-11-draft'

/** BRSHOP-0001 … BRSHOP-9999, then BRSHOP-10000 onwards. */
export function shopReference(number: number): string {
  return `${SHOP_REFERENCE_PREFIX}${String(Math.max(0, Math.floor(number))).padStart(4, '0')}`
}

// --- Copy -----------------------------------------------------------------

/**
 * Draft terms, written for the Souvenir lead and Treasury team to approve.
 * One clause per line; the shop renders each line as its own list item.
 */
export const DEFAULT_SHOP_TERMS = [
  'This is a pre-order. Items are ordered from our suppliers after the pre-order window closes, in the quantities that have been paid for.',
  'Your order is confirmed once payment has been received. Please pay by bank transfer using your order reference, or pay at the mandir. Orders that have not been paid for will not be ordered.',
  'The Treasury team will confirm your payment and issue a receipt outside the app.',
  'Items are collected from Shree KS Swaminarayan Temple Woolwich during evening sabha (usually weekends, 6–9pm). We will let you know on WhatsApp when your items are ready. We do not post items.',
  'To change or cancel your order, please contact the Souvenir team. Once items have been ordered from our suppliers we may not be able to change a size or offer a refund.',
  'Photos are for illustration. Colours and details may vary slightly from the finished item.',
  'We keep your name, phone number, email address and order for the mandir’s records, including after you delete your Bhaktiras account.'
].join('\n')

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  bankAccountName: '',
  bankName: '',
  sortCode: '',
  accountNumber: '',
  intro: 'Celebrate 10 years with Ghanshyam Maharaj. Pre-order souvenirs for the Patotsav and collect them at the mandir.',
  paymentInstructions: 'Please pay by bank transfer using your order reference, or pay at the mandir. Your order is confirmed once the Treasury team has received payment.',
  collectionInfo: 'Collect from the mandir during evening sabha, usually weekends 6–9pm. We will message you on WhatsApp when your items are ready.',
  terms: DEFAULT_SHOP_TERMS
}

export const SHOP_SETTINGS_FIELDS: Array<{ key: keyof ShopSettings; label: string; multiline?: boolean; maxLength: number; copy?: boolean }> = [
  { key: 'bankAccountName', label: 'Account name', maxLength: 100 },
  { key: 'bankName', label: 'Bank', maxLength: 100 },
  { key: 'sortCode', label: 'Sort code', maxLength: 20 },
  { key: 'accountNumber', label: 'Account number', maxLength: 30 },
  { key: 'intro', label: 'Shop introduction', multiline: true, maxLength: 600, copy: true },
  { key: 'paymentInstructions', label: 'Payment instructions', multiline: true, maxLength: 1000, copy: true },
  { key: 'collectionInfo', label: 'Collection details', multiline: true, maxLength: 1000, copy: true },
  { key: 'terms', label: 'Terms (one per line)', multiline: true, maxLength: 4000, copy: true }
]

/**
 * Stored settings over the defaults. Bank details have no default — a blank
 * one stays blank, and the shop says the details will follow. Copy fields
 * fall back to the code wording when left blank, so only overrides are kept.
 */
export function shopSettingsFromSource(raw: unknown): ShopSettings {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const out = { ...DEFAULT_SHOP_SETTINGS }
  for (const field of SHOP_SETTINGS_FIELDS) {
    const value = typeof data[field.key] === 'string' ? (data[field.key] as string).trim() : ''
    if (value) out[field.key] = value
    else if (!field.copy) out[field.key] = ''
  }
  return out
}

export function shopTermsList(settings: ShopSettings): string[] {
  return settings.terms.split('\n').map(line => line.trim()).filter(Boolean)
}

/** Which wording of the terms a devotee agreed to. */
export function shopTermsVersion(settings: ShopSettings): string {
  if (settings.terms === DEFAULT_SHOP_TERMS) return SHOP_TERMS_VERSION
  let hash = 0
  for (let i = 0; i < settings.terms.length; i++) hash = (hash * 31 + settings.terms.charCodeAt(i)) >>> 0
  return `custom-${hash.toString(36)}`
}

export function hasBankDetails(settings: ShopSettings): boolean {
  return !!(settings.sortCode && settings.accountNumber)
}

// --- Sizes and prices -----------------------------------------------------

export const SHOP_SIZE_PRESETS: Array<{ label: string; sizes: ShopSize[] }> = [
  { label: 'Adult S–XXL', sizes: ['S', 'M', 'L', 'XL', 'XXL'].map(label => ({ label, group: 'adult' as const })) },
  { label: 'Child ages', sizes: ['3–4', '5–6', '7–8', '9–10', '11–12', '13–14'].map(label => ({ label: `Age ${label}`, group: 'child' as const })) }
]

export function hasChildSizes(product: Pick<ShopProduct, 'sizes'>): boolean {
  return product.sizes.some(size => size.group === 'child')
}

export function sizeGroupFor(product: Pick<ShopProduct, 'sizes'>, size: string | null): ShopSizeGroup | null {
  if (!size) return null
  return product.sizes.find(item => item.label === size)?.group ?? null
}

/** Pence. A child size uses the child price when there is one. */
export function unitPriceFor(product: Pick<ShopProduct, 'sizes' | 'price' | 'childPrice'>, size: string | null): number {
  const group = sizeGroupFor(product, size)
  if (group === 'child' && product.childPrice != null) return product.childPrice
  return product.price
}

export function formatPence(pence: number): string {
  const pounds = (pence || 0) / 100
  return `£${pounds.toLocaleString('en-GB', {
    minimumFractionDigits: Number.isInteger(pounds) ? 0 : 2,
    maximumFractionDigits: 2
  })}`
}

/** CSV wants a plain number a spreadsheet can sum. */
export function poundsPlain(pence: number): string {
  return ((pence || 0) / 100).toFixed(2)
}

/** "£15" or "£15 adult · £10 child". */
export function priceLabel(product: Pick<ShopProduct, 'sizes' | 'price' | 'childPrice'>): string {
  if (hasChildSizes(product) && product.childPrice != null && product.childPrice !== product.price) {
    const adult = product.sizes.some(size => size.group === 'adult')
    return adult
      ? `${formatPence(product.price)} adult · ${formatPence(product.childPrice)} child`
      : formatPence(product.childPrice)
  }
  return formatPence(product.price)
}

// --- Pre-order window -----------------------------------------------------

export type ShopWindowState = 'upcoming' | 'open' | 'closed'

export function windowState(product: Pick<ShopProduct, 'opensAt' | 'closesAt'>, now = new Date()): ShopWindowState {
  if (product.opensAt && now < product.opensAt) return 'upcoming'
  if (product.closesAt && now > product.closesAt) return 'closed'
  return 'open'
}

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export function formatShopDate(date: Date | null): string {
  return date ? dateFormat.format(date) : ''
}

export function formatShopDateTime(date: Date | null): string {
  return date ? dateTimeFormat.format(date) : ''
}

export function windowLabel(product: Pick<ShopProduct, 'opensAt' | 'closesAt'>, now = new Date()): string {
  const state = windowState(product, now)
  if (state === 'upcoming') return `Pre-orders open ${formatShopDate(product.opensAt)}`
  if (state === 'closed') return 'Pre-orders closed'
  return product.closesAt ? `Pre-order by ${formatShopDate(product.closesAt)}` : 'Pre-orders open'
}

// --- Mapping Firestore documents -----------------------------------------

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  if (typeof value === 'object' && value && 'seconds' in value) {
    return new Date(Number((value as { seconds: number }).seconds) * 1000)
  }
  return null
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function int(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n) : fallback
}

export function mapShopProduct(id: string, data: Record<string, unknown>): ShopProduct {
  const sizes = Array.isArray(data.sizes)
    ? (data.sizes as unknown[])
        .map((item) => {
          const value = (item ?? {}) as Record<string, unknown>
          return { label: str(value.label).trim(), group: value.group === 'child' ? 'child' : 'adult' } as ShopSize
        })
        .filter(size => size.label)
    : []
  return {
    id,
    name: str(data.name),
    description: str(data.description),
    category: str(data.category) || 'Other',
    images: Array.isArray(data.images) ? (data.images as unknown[]).filter((url): url is string => typeof url === 'string' && /^https:\/\//.test(url)) : [],
    sizes,
    price: int(data.price),
    childPrice: data.childPrice == null ? null : int(data.childPrice),
    opensAt: toDate(data.opensAt),
    closesAt: toDate(data.closesAt),
    active: data.active !== false,
    order: int(data.order)
  }
}

const STATUSES: ShopOrderStatus[] = ['awaiting_payment', 'paid', 'cancelled']

export function mapShopOrder(id: string, data: Record<string, unknown>): ShopOrder {
  const customer = (data.customer ?? {}) as Record<string, unknown>
  const items: ShopOrderItem[] = Array.isArray(data.items)
    ? (data.items as unknown[]).map((raw) => {
        const item = (raw ?? {}) as Record<string, unknown>
        const quantity = int(item.quantity, 1)
        const unitPrice = int(item.unitPrice)
        return {
          productId: str(item.productId),
          name: str(item.name),
          category: str(item.category),
          size: typeof item.size === 'string' && item.size ? item.size : null,
          group: item.group === 'child' ? 'child' : item.group === 'adult' ? 'adult' : null,
          unitPrice,
          quantity,
          lineTotal: int(item.lineTotal, unitPrice * quantity)
        }
      })
    : []
  const history: ShopOrderHistoryEntry[] = Array.isArray(data.history)
    ? (data.history as unknown[]).map((raw) => {
        const entry = (raw ?? {}) as Record<string, unknown>
        return { at: toDate(entry.at), byName: str(entry.byName), action: str(entry.action), detail: str(entry.detail) || undefined }
      })
    : []
  const status = STATUSES.includes(data.status as ShopOrderStatus) ? data.status as ShopOrderStatus : 'awaiting_payment'
  return {
    id,
    reference: str(data.reference, id),
    number: int(data.number),
    userId: str(data.userId),
    customer: { name: str(customer.name), email: str(customer.email), phone: str(customer.phone) },
    note: str(data.note),
    items,
    total: int(data.total, items.reduce((sum, item) => sum + item.lineTotal, 0)),
    status,
    paidAt: toDate(data.paidAt),
    paidBy: typeof data.paidBy === 'string' ? data.paidBy : null,
    termsVersion: str(data.termsVersion),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    history
  }
}

export const SHOP_STATUS_LABELS: Record<ShopOrderStatus, string> = {
  awaiting_payment: 'Awaiting payment',
  paid: 'Paid',
  cancelled: 'Cancelled'
}

export function itemLabel(item: Pick<ShopOrderItem, 'name' | 'size' | 'group'>): string {
  if (!item.size) return item.name
  return `${item.name} — ${item.size}${item.group === 'child' ? ' (child)' : ''}`
}

// --- Basket ---------------------------------------------------------------

export function basketKey(line: Pick<ShopBasketLine, 'productId' | 'size'>): string {
  return `${line.productId}::${line.size ?? ''}`
}

// --- CSV ------------------------------------------------------------------

function csvCell(value: unknown): string {
  const text = value == null ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(rows: unknown[][]): string {
  // The BOM makes Excel read £ and accented names as UTF-8.
  return `﻿${rows.map(row => row.map(csvCell).join(',')).join('\r\n')}\r\n`
}

/**
 * Excel drops the leading zero from 07700900123. A UK mobile split the usual
 * way stays text, so the number survives the round trip.
 */
function phoneForCsv(phone: string): string {
  const digits = phone.replace(/\s+/g, '')
  if (/^0\d{10}$/.test(digits)) return `${digits.slice(0, 5)} ${digits.slice(5)}`
  return phone
}

function isoDate(date: Date | null): string {
  if (!date) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** One row per item ordered, so the sheet can be filtered and pivoted freely. */
export function ordersToCsv(orders: ShopOrder[]): string {
  const header = [
    'Reference', 'Order date', 'Status', 'Customer name', 'Phone', 'Email', 'Customer note',
    'Product', 'Category', 'Size', 'Adult/Child', 'Quantity', 'Unit price (£)', 'Line total (£)',
    'Order total (£)', 'Paid on', 'Marked paid by'
  ]
  const rows: unknown[][] = [header]
  for (const order of orders) {
    const base = [order.reference, isoDate(order.createdAt), SHOP_STATUS_LABELS[order.status], order.customer.name, phoneForCsv(order.customer.phone), order.customer.email, order.note]
    const tail = [poundsPlain(order.total), isoDate(order.paidAt), order.paidBy ?? '']
    if (!order.items.length) rows.push([...base, '', '', '', '', 0, '', '', ...tail])
    for (const item of order.items) {
      rows.push([
        ...base,
        item.name,
        item.category,
        item.size ?? '',
        item.group === 'child' ? 'Child' : item.group === 'adult' ? 'Adult' : '',
        item.quantity,
        poundsPlain(item.unitPrice),
        poundsPlain(item.lineTotal),
        ...tail
      ])
    }
  }
  return toCsv(rows)
}

export interface ShopTotalRow {
  key: string
  productId: string
  name: string
  category: string
  size: string | null
  group: ShopSizeGroup | null
  paid: number
  awaiting: number
}

/** Quantities per product and size. `paid` is what gets ordered from suppliers. */
export function supplierTotals(orders: ShopOrder[], products: ShopProduct[] = []): ShopTotalRow[] {
  const rows = new Map<string, ShopTotalRow>()
  for (const order of orders) {
    if (order.status === 'cancelled') continue
    for (const item of order.items) {
      const key = `${item.productId}::${item.size ?? ''}`
      const row = rows.get(key) ?? { key, productId: item.productId, name: item.name, category: item.category, size: item.size, group: item.group, paid: 0, awaiting: 0 }
      if (order.status === 'paid') row.paid += item.quantity
      else row.awaiting += item.quantity
      rows.set(key, row)
    }
  }
  // Sizes in the order the product lists them (S, M, L — not L, M, S).
  const sizeIndex = (row: ShopTotalRow) => {
    const product = products.find(item => item.id === row.productId)
    const index = product?.sizes.findIndex(size => size.label === row.size) ?? -1
    return index < 0 ? Number.MAX_SAFE_INTEGER : index
  }
  return [...rows.values()].sort((a, b) =>
    a.category.localeCompare(b.category)
    || a.name.localeCompare(b.name)
    || sizeIndex(a) - sizeIndex(b)
    || (a.size ?? '').localeCompare(b.size ?? '', undefined, { numeric: true }))
}

export function totalsToCsv(rows: ShopTotalRow[]): string {
  return toCsv([
    ['Product', 'Category', 'Size', 'Adult/Child', 'Paid quantity (to order)', 'Awaiting payment'],
    ...rows.map(row => [row.name, row.category, row.size ?? '', row.group === 'child' ? 'Child' : row.group === 'adult' ? 'Adult' : '', row.paid, row.awaiting])
  ])
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
