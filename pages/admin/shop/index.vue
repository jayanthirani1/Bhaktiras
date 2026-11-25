<template>
  <div class="space-y-4">
    <p v-if="error || productError" class="text-sm text-red-600">{{ error || productError }}</p>

    <div class="grid gap-3 sm:grid-cols-3">
      <div class="admin-panel">
        <p class="text-xs font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Orders</p>
        <p class="mt-1 text-2xl font-semibold tabular-nums text-[hsl(var(--primary))]">{{ live.length }}</p>
        <p class="text-xs text-[hsl(var(--muted-foreground))]">{{ cancelledCount }} cancelled, not counted</p>
      </div>
      <div class="admin-panel">
        <p class="text-xs font-bold uppercase tracking-[0.12em] text-amber-800">Awaiting payment</p>
        <p class="mt-1 text-2xl font-semibold tabular-nums text-[hsl(var(--primary))]">{{ awaiting.length }}</p>
        <p class="text-xs text-[hsl(var(--muted-foreground))]">{{ formatPence(sum(awaiting)) }} to collect</p>
      </div>
      <div class="admin-panel">
        <p class="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">Paid</p>
        <p class="mt-1 text-2xl font-semibold tabular-nums text-[hsl(var(--primary))]">{{ paid.length }}</p>
        <p class="text-xs text-[hsl(var(--muted-foreground))]">{{ formatPence(sum(paid)) }} received</p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <div class="flex flex-wrap gap-1 rounded-lg bg-white p-1 ring-1 ring-[hsl(var(--border))]">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="rounded-md px-3 py-1.5 text-sm font-semibold"
          :class="statusFilter === tab.id ? 'bg-[hsl(var(--primary))] text-white' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]'"
          @click="statusFilter = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
      <input v-model="search" type="search" class="admin-input max-w-xs flex-1" placeholder="Search reference, name, phone, email">
      <button type="button" class="admin-btn-secondary" :disabled="loading" @click="fetchAll">Refresh</button>
      <button type="button" class="admin-btn" :disabled="!filtered.length" @click="exportCsv">Export CSV ({{ filtered.length }})</button>
    </div>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:items-start">
      <div class="space-y-2">
        <p v-if="loading && !orders.length" class="text-sm text-[hsl(var(--muted-foreground))]">Loading orders…</p>
        <p v-else-if="!filtered.length" class="rounded-xl border border-dashed border-[hsl(var(--border))] bg-white px-3 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
          {{ orders.length ? 'No orders match.' : 'No orders yet.' }}
        </p>
        <button
          v-for="order in filtered"
          :key="order.id"
          type="button"
          class="admin-row"
          :class="selectedId === order.id ? 'admin-row-active' : ''"
          @click="select(order)"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-mono text-sm font-bold text-[hsl(var(--primary))]">{{ order.reference }}</p>
              <p class="truncate text-sm font-semibold">{{ order.customer.name }}</p>
              <p class="truncate text-xs text-[hsl(var(--muted-foreground))]">{{ order.customer.phone }} · {{ formatShopDate(order.createdAt) }}</p>
            </div>
            <div class="flex shrink-0 flex-col items-end gap-1">
              <ShopStatusBadge :status="order.status" />
              <span class="text-sm font-semibold tabular-nums">{{ formatPence(order.total) }}</span>
            </div>
          </div>
        </button>
      </div>

      <div class="admin-panel xl:sticky xl:top-20">
        <div v-if="!selected" class="text-sm text-[hsl(var(--muted-foreground))]">Select an order to see it, mark it paid or edit it.</div>

        <div v-else class="space-y-5">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="font-mono text-xl font-bold text-[hsl(var(--primary))]">{{ selected.reference }}</p>
              <p class="text-xs text-[hsl(var(--muted-foreground))]">Placed {{ formatShopDateTime(selected.createdAt) }}</p>
            </div>
            <ShopStatusBadge :status="selected.status" />
          </div>

          <!-- Status actions -->
          <div v-if="!editing" class="flex flex-wrap gap-2">
            <button v-if="selected.status === 'awaiting_payment'" type="button" class="admin-btn bg-emerald-700 hover:bg-emerald-800" :disabled="saving" @click="changeStatus('paid')">
              Mark paid
            </button>
            <button v-if="selected.status === 'paid'" type="button" class="admin-btn-secondary" :disabled="saving" @click="changeStatus('awaiting_payment', 'Mark this order as not paid?')">
              Mark unpaid
            </button>
            <button v-if="selected.status !== 'cancelled'" type="button" class="admin-btn-secondary" :disabled="saving" @click="startEdit">Edit order</button>
            <button v-if="selected.status !== 'cancelled'" type="button" class="admin-btn-danger" :disabled="saving" @click="changeStatus('cancelled', `Cancel ${selected.reference}? It stays on record and can be reinstated.`)">
              Cancel order
            </button>
            <button v-if="selected.status === 'cancelled'" type="button" class="admin-btn-secondary" :disabled="saving" @click="changeStatus('awaiting_payment')">
              Reinstate
            </button>
          </div>
          <p v-if="selected.status === 'paid'" class="-mt-2 text-xs text-[hsl(var(--muted-foreground))]">
            Paid {{ formatShopDateTime(selected.paidAt) }}<span v-if="selected.paidBy">, marked by {{ selected.paidBy }}</span>
          </p>

          <!-- View -->
          <template v-if="!editing">
            <dl class="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
              <dt class="text-[hsl(var(--muted-foreground))]">Name</dt>
              <dd class="font-semibold">{{ selected.customer.name }}</dd>
              <dt class="text-[hsl(var(--muted-foreground))]">Phone</dt>
              <dd><a :href="`tel:${selected.customer.phone}`" class="font-semibold underline">{{ selected.customer.phone }}</a></dd>
              <dt class="text-[hsl(var(--muted-foreground))]">Email</dt>
              <dd class="break-all"><a :href="`mailto:${selected.customer.email}`" class="font-semibold underline">{{ selected.customer.email }}</a></dd>
              <template v-if="selected.note">
                <dt class="text-[hsl(var(--muted-foreground))]">Note</dt>
                <dd class="whitespace-pre-line">{{ selected.note }}</dd>
              </template>
            </dl>
            <ShopOrderItems :items="selected.items" :total="selected.total" />
          </template>

          <!-- Edit -->
          <form v-else class="space-y-4" @submit.prevent="saveEdit">
            <div class="grid gap-3 sm:grid-cols-3">
              <div>
                <label class="admin-label" for="o-name">Name</label>
                <input id="o-name" v-model="draft.customer.name" required maxlength="80" class="admin-input">
              </div>
              <div>
                <label class="admin-label" for="o-phone">Phone</label>
                <input id="o-phone" v-model="draft.customer.phone" required maxlength="30" class="admin-input">
              </div>
              <div>
                <label class="admin-label" for="o-email">Email</label>
                <input id="o-email" v-model="draft.customer.email" required maxlength="200" type="email" class="admin-input">
              </div>
            </div>
            <div>
              <label class="admin-label" for="o-note">Note</label>
              <textarea id="o-note" v-model="draft.note" maxlength="500" rows="2" class="admin-input" />
            </div>

            <div class="space-y-2">
              <p class="admin-label">Items</p>
              <div v-for="(item, index) in draft.items" :key="index" class="flex flex-wrap items-center gap-2 rounded-lg border border-[hsl(var(--border))] p-2">
                <span class="min-w-0 flex-1 text-sm font-semibold">{{ item.name }}</span>
                <select
                  v-if="sizesFor(item.productId).length"
                  :value="item.size ?? ''"
                  class="admin-input w-32"
                  aria-label="Size"
                  @change="changeSize(item, ($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="size in sizesFor(item.productId)" :key="size.label" :value="size.label">
                    {{ size.label }}{{ size.group === 'child' ? ' (child)' : '' }}
                  </option>
                </select>
                <span v-else-if="item.size" class="text-sm">{{ item.size }}</span>
                <input v-model.number="item.quantity" type="number" min="0" :max="SHOP_MAX_QUANTITY" class="admin-input w-20" aria-label="Quantity">
                <span class="w-20 text-right text-sm tabular-nums">{{ formatPence(item.unitPrice * (item.quantity || 0)) }}</span>
                <button type="button" class="admin-btn-danger px-2" aria-label="Remove item" @click="draft.items.splice(index, 1)">✕</button>
              </div>

              <div class="flex flex-wrap items-end gap-2 rounded-lg bg-[hsl(var(--muted))] p-2">
                <div class="min-w-[10rem] flex-1">
                  <label class="admin-label" for="o-add-product">Add an item</label>
                  <select id="o-add-product" v-model="addProductId" class="admin-input">
                    <option value="">Choose a product…</option>
                    <option v-for="product in products" :key="product.id" :value="product.id">{{ product.name }}</option>
                  </select>
                </div>
                <div v-if="sizesFor(addProductId).length">
                  <label class="admin-label" for="o-add-size">Size</label>
                  <select id="o-add-size" v-model="addSize" class="admin-input w-32">
                    <option v-for="size in sizesFor(addProductId)" :key="size.label" :value="size.label">{{ size.label }}{{ size.group === 'child' ? ' (child)' : '' }}</option>
                  </select>
                </div>
                <button type="button" class="admin-btn-secondary" :disabled="!canAddLine" @click="addLine">Add</button>
              </div>
              <p class="text-xs text-[hsl(var(--muted-foreground))]">Existing lines keep the price they were ordered at. A new line, or a change of size, uses today’s price.</p>
            </div>

            <div class="flex items-center justify-between border-t border-[hsl(var(--border))] pt-3 font-semibold">
              <span>New total</span>
              <span class="tabular-nums">{{ formatPence(draftTotal) }}</span>
            </div>
            <p v-if="selected.status === 'paid' && draftTotal !== selected.total" class="rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-900">
              This order is already paid and its total will change. Let the Treasury team know.
            </p>
            <div class="flex gap-2">
              <button type="submit" class="admin-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save changes' }}</button>
              <button type="button" class="admin-btn-secondary" @click="editing = false">Cancel</button>
            </div>
          </form>

          <details class="rounded-lg border border-[hsl(var(--border))] p-3 text-sm">
            <summary class="cursor-pointer font-semibold text-[hsl(var(--primary))]">History ({{ selected.history.length }})</summary>
            <ol class="mt-2 space-y-1.5">
              <li v-for="(entry, index) in [...selected.history].reverse()" :key="index" class="text-xs">
                <span class="font-semibold">{{ entry.action }}</span>
                <span class="text-[hsl(var(--muted-foreground))]"> · {{ entry.byName }} · {{ formatShopDateTime(entry.at) }}</span>
                <span v-if="entry.detail" class="block text-[hsl(var(--muted-foreground))]">{{ entry.detail }}</span>
              </li>
            </ol>
          </details>
          <p class="text-xs text-[hsl(var(--muted-foreground))]">Terms agreed: {{ selected.termsVersion || '—' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ShopOrder, ShopOrderItem, ShopOrderStatus } from '~/types'
import {
  downloadCsv,
  formatPence,
  formatShopDate,
  formatShopDateTime,
  ordersToCsv,
  SHOP_MAX_QUANTITY,
  sizeGroupFor,
  unitPriceFor
} from '~/data/shop'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { orders, loading, saving, error, fetchAll, setStatus, saveEdits } = useShopAdminOrders()
const { products, error: productError, fetchAll: fetchProducts } = useShopAdminProducts()

type Filter = 'all' | ShopOrderStatus
const tabs: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'awaiting_payment', label: 'Awaiting payment' },
  { id: 'paid', label: 'Paid' },
  { id: 'cancelled', label: 'Cancelled' }
]
const statusFilter = ref<Filter>('all')
const search = ref('')
const selectedId = ref<string | null>(null)
const editing = ref(false)

const live = computed(() => orders.value.filter(order => order.status !== 'cancelled'))
const awaiting = computed(() => orders.value.filter(order => order.status === 'awaiting_payment'))
const paid = computed(() => orders.value.filter(order => order.status === 'paid'))
const cancelledCount = computed(() => orders.value.length - live.value.length)
const sum = (list: ShopOrder[]) => list.reduce((total, order) => total + order.total, 0)

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  const digits = term.replace(/\D/g, '')
  return orders.value.filter((order) => {
    if (statusFilter.value !== 'all' && order.status !== statusFilter.value) return false
    if (!term) return true
    return order.reference.toLowerCase().includes(term)
      || order.customer.name.toLowerCase().includes(term)
      || order.customer.email.toLowerCase().includes(term)
      || (digits.length >= 3 && order.customer.phone.replace(/\D/g, '').includes(digits))
  })
})

const selected = computed(() => orders.value.find(order => order.id === selectedId.value) ?? null)

function select(order: ShopOrder) {
  selectedId.value = order.id
  editing.value = false
}

async function changeStatus(status: ShopOrderStatus, question?: string) {
  if (!selected.value) return
  if (question && !confirm(question)) return
  try {
    await setStatus(selected.value, status)
  } catch {
    // Shown via `error`.
  }
}

// --- Editing ---------------------------------------------------------------

const draft = reactive<{ customer: ShopOrder['customer']; note: string; items: ShopOrderItem[] }>({
  customer: { name: '', email: '', phone: '' },
  note: '',
  items: []
})
const addProductId = ref('')
const addSize = ref('')

function startEdit() {
  if (!selected.value) return
  draft.customer = { ...selected.value.customer }
  draft.note = selected.value.note
  draft.items = selected.value.items.map(item => ({ ...item }))
  addProductId.value = ''
  editing.value = true
}

function productFor(id: string) {
  return products.value.find(product => product.id === id) ?? null
}

function sizesFor(productId: string) {
  return productFor(productId)?.sizes ?? []
}

watch(addProductId, (id) => {
  addSize.value = sizesFor(id)[0]?.label ?? ''
})

const canAddLine = computed(() => !!addProductId.value && (!sizesFor(addProductId.value).length || !!addSize.value))

function changeSize(item: ShopOrderItem, size: string) {
  const product = productFor(item.productId)
  if (!product) return
  item.size = size
  item.group = sizeGroupFor(product, size)
  item.unitPrice = unitPriceFor(product, size)
}

function addLine() {
  const product = productFor(addProductId.value)
  if (!product) return
  const size = product.sizes.length ? addSize.value : null
  const existing = draft.items.find(item => item.productId === product.id && item.size === size)
  if (existing) {
    existing.quantity += 1
  } else {
    const unitPrice = unitPriceFor(product, size)
    draft.items.push({
      productId: product.id,
      name: product.name,
      category: product.category,
      size,
      group: sizeGroupFor(product, size),
      unitPrice,
      quantity: 1,
      lineTotal: unitPrice
    })
  }
  addProductId.value = ''
}

const draftTotal = computed(() => draft.items.reduce((total, item) => total + item.unitPrice * Math.max(0, Math.round(item.quantity || 0)), 0))

async function saveEdit() {
  if (!selected.value) return
  const items = draft.items.map(item => ({ ...item, quantity: Math.min(SHOP_MAX_QUANTITY, Math.max(0, Math.round(item.quantity || 0))) }))
  if (!items.some(item => item.quantity > 0)) {
    if (!confirm('This removes every item. Cancel the order instead?')) return
    await changeStatus('cancelled')
    editing.value = false
    return
  }
  try {
    await saveEdits(selected.value, {
      customer: { name: draft.customer.name.trim(), email: draft.customer.email.trim(), phone: draft.customer.phone.trim() },
      note: draft.note.trim(),
      items
    })
    editing.value = false
  } catch {
    // Shown via `error`.
  }
}

function exportCsv() {
  const stamp = new Date().toISOString().slice(0, 10)
  const suffix = statusFilter.value === 'all' ? '' : `-${statusFilter.value.replace('_', '-')}`
  downloadCsv(`bhaktiras-shop-orders${suffix}-${stamp}.csv`, ordersToCsv([...filtered.value].reverse()))
}

onMounted(() => {
  void fetchAll()
  void fetchProducts()
})

useHead({ title: 'Shop orders · Admin' })
</script>
