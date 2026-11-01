<template>
  <div>
    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <AdminEditorLayout
      :count-label="`${products.length} product${products.length === 1 ? '' : 's'}`"
      create-label="Add product"
      empty-label="No products yet. Add the first one."
      :loading="loading"
      :empty="!products.length"
      @create="openNew"
    >
      <template #list>
        <button
          v-for="item in products"
          :key="item.id"
          type="button"
          class="admin-row flex gap-3"
          :class="editingId === item.id ? 'admin-row-active' : ''"
          @click="openEdit(item)"
        >
          <div class="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[hsl(var(--muted))]">
            <img v-if="item.images[0]" :src="item.images[0]" alt="" class="h-full w-full object-cover">
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold text-[hsl(var(--primary))]">{{ item.name }}</p>
            <p class="truncate text-xs text-[hsl(var(--muted-foreground))]">{{ item.category }} · {{ priceLabel(item) }}</p>
            <p class="mt-1 text-xs font-semibold" :class="item.active ? 'text-[hsl(var(--golden-900))]' : 'text-slate-500'">
              {{ item.active ? windowLabel(item) : 'Hidden from the shop' }}
            </p>
          </div>
        </button>
      </template>

      <template #form>
        <form v-if="showForm" class="space-y-5" @submit.prevent="save">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">{{ editingId ? 'Edit product' : 'New product' }}</h2>
            <button v-if="editingId" type="button" class="admin-btn-danger" :disabled="saving" @click="onDelete">Delete</button>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="admin-label" for="p-name">Name</label>
              <input id="p-name" v-model="form.name" required maxlength="100" class="admin-input" placeholder="Patotsav hoodie">
            </div>
            <div>
              <label class="admin-label" for="p-category">Category</label>
              <input id="p-category" v-model="form.category" required maxlength="50" list="shop-categories" class="admin-input" placeholder="Apparel">
              <datalist id="shop-categories">
                <option v-for="category in categories" :key="category" :value="category" />
              </datalist>
            </div>
          </div>

          <div>
            <label class="admin-label" for="p-description">Description</label>
            <textarea id="p-description" v-model="form.description" maxlength="2000" rows="4" class="admin-input" placeholder="Material, fit, what is printed on it…" />
          </div>

          <div>
            <p class="admin-label">Photos</p>
            <AdminShopImages v-model="form.images" />
          </div>

          <div class="space-y-3 rounded-xl border border-[hsl(var(--border))] p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-sm font-semibold text-[hsl(var(--primary))]">Sizes</p>
              <div class="flex flex-wrap gap-2">
                <button v-for="preset in SHOP_SIZE_PRESETS" :key="preset.label" type="button" class="admin-btn-secondary text-xs" @click="addPreset(preset.sizes)">
                  + {{ preset.label }}
                </button>
              </div>
            </div>
            <p v-if="!form.sizes.length" class="text-xs text-[hsl(var(--muted-foreground))]">
              No sizes — this is a one-size item, such as a water bottle or a Lego set.
            </p>
            <ul v-else class="space-y-2">
              <li v-for="(size, index) in form.sizes" :key="index" class="flex items-center gap-2">
                <input v-model="size.label" maxlength="30" class="admin-input flex-1" placeholder="e.g. M, 38, Age 5–6" aria-label="Size">
                <select v-model="size.group" class="admin-input w-28" aria-label="Adult or child">
                  <option value="adult">Adult</option>
                  <option value="child">Child</option>
                </select>
                <button type="button" class="admin-btn-secondary px-2 text-xs" :disabled="index === 0" aria-label="Move up" @click="moveSize(index, -1)">↑</button>
                <button type="button" class="admin-btn-danger px-2 text-xs" aria-label="Remove size" @click="form.sizes.splice(index, 1)">✕</button>
              </li>
            </ul>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="admin-btn-secondary text-xs" @click="form.sizes.push({ label: '', group: 'adult' })">+ Add a size</button>
              <button v-if="form.sizes.length" type="button" class="admin-btn-danger text-xs" @click="form.sizes = []">Clear sizes</button>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="admin-label" for="p-price">{{ hasChild && hasAdult ? 'Adult price (£)' : 'Price (£)' }}</label>
              <input id="p-price" v-model="form.price" required type="number" min="0" step="0.01" inputmode="decimal" class="admin-input">
            </div>
            <div v-if="hasChild">
              <label class="admin-label" for="p-child-price">Child price (£)</label>
              <input id="p-child-price" v-model="form.childPrice" type="number" min="0" step="0.01" inputmode="decimal" class="admin-input" :placeholder="hasAdult ? 'Same as adult' : ''">
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="admin-label" for="p-opens">Pre-orders open <span class="font-normal">(optional)</span></label>
              <input id="p-opens" v-model="form.opensAt" type="datetime-local" class="admin-input">
            </div>
            <div>
              <label class="admin-label" for="p-closes">Pre-orders close <span class="font-normal">(optional)</span></label>
              <input id="p-closes" v-model="form.closesAt" type="datetime-local" class="admin-input">
            </div>
          </div>
          <p class="-mt-2 text-xs text-[hsl(var(--muted-foreground))]">Leave blank to open straight away, or to keep taking orders until you close it.</p>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="admin-label" for="p-order">Position in its category</label>
              <input id="p-order" v-model.number="form.order" type="number" min="0" class="admin-input max-w-[8rem]">
            </div>
            <label class="flex items-center gap-2 self-end pb-2 text-sm font-semibold">
              <input v-model="form.active" type="checkbox" class="h-4 w-4 rounded">
              Show in the shop
            </label>
          </div>

          <p v-if="formError" class="text-sm font-semibold text-red-600">{{ formError }}</p>
          <p v-if="savedMessage" class="text-sm font-semibold text-emerald-700">{{ savedMessage }}</p>
          <div class="flex gap-2">
            <button type="submit" class="admin-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
            <button type="button" class="admin-btn-secondary" @click="showForm = false">Cancel</button>
          </div>
        </form>
        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">Select a product to edit, or add a new one.</p>
      </template>
    </AdminEditorLayout>
  </div>
</template>

<script setup lang="ts">
import type { ShopProduct, ShopSize } from '~/types'
import { priceLabel, SHOP_SIZE_PRESETS, windowLabel } from '~/data/shop'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { products, loading, saving, error, fetchAll, save: saveProduct, remove } = useShopAdminProducts()
const showForm = ref(false)
const editingId = ref<string | null>(null)
const formError = ref('')
const savedMessage = ref('')

interface ProductForm {
  name: string
  category: string
  description: string
  images: string[]
  sizes: ShopSize[]
  price: string | number
  childPrice: string | number
  opensAt: string
  closesAt: string
  order: number
  active: boolean
}

function blankForm(): ProductForm {
  return { name: '', category: '', description: '', images: [], sizes: [], price: '', childPrice: '', opensAt: '', closesAt: '', order: products.value.length + 1, active: true }
}

const form = reactive<ProductForm>(blankForm())
const categories = computed(() => [...new Set(products.value.map(item => item.category))])
const hasChild = computed(() => form.sizes.some(size => size.group === 'child'))
const hasAdult = computed(() => form.sizes.some(size => size.group === 'adult'))

/** datetime-local wants local time with no zone. */
function toLocalInput(date: Date | null) {
  if (!date) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromLocalInput(value: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function toPence(value: string | number) {
  if (value === '' || value == null) return null
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null
}

function openNew() {
  editingId.value = null
  Object.assign(form, blankForm())
  formError.value = ''
  savedMessage.value = ''
  showForm.value = true
}

function openEdit(item: ShopProduct) {
  editingId.value = item.id
  Object.assign(form, {
    name: item.name,
    category: item.category,
    description: item.description,
    images: [...item.images],
    sizes: item.sizes.map(size => ({ ...size })),
    price: (item.price / 100).toFixed(2),
    childPrice: item.childPrice == null ? '' : (item.childPrice / 100).toFixed(2),
    opensAt: toLocalInput(item.opensAt),
    closesAt: toLocalInput(item.closesAt),
    order: item.order,
    active: item.active
  })
  formError.value = ''
  savedMessage.value = ''
  showForm.value = true
}

function addPreset(sizes: ShopSize[]) {
  for (const size of sizes) {
    if (!form.sizes.some(existing => existing.label === size.label)) form.sizes.push({ ...size })
  }
}

function moveSize(index: number, by: number) {
  const [item] = form.sizes.splice(index, 1)
  form.sizes.splice(index + by, 0, item)
}

async function save() {
  formError.value = ''
  savedMessage.value = ''
  const price = toPence(form.price)
  if (price == null) {
    formError.value = 'Enter a price.'
    return
  }
  const labels = form.sizes.map(size => size.label.trim()).filter(Boolean)
  if (new Set(labels).size !== labels.length) {
    formError.value = 'Two sizes have the same name.'
    return
  }
  const opensAt = fromLocalInput(form.opensAt)
  const closesAt = fromLocalInput(form.closesAt)
  if (opensAt && closesAt && closesAt <= opensAt) {
    formError.value = 'The pre-order window has to close after it opens.'
    return
  }
  try {
    editingId.value = await saveProduct(editingId.value, {
      name: form.name,
      category: form.category,
      description: form.description,
      images: form.images,
      sizes: form.sizes,
      price,
      childPrice: hasChild.value ? toPence(form.childPrice) : null,
      opensAt,
      closesAt,
      order: Number(form.order) || 0,
      active: form.active
    })
    savedMessage.value = 'Saved.'
  } catch {
    // `error` from the composable is shown above the editor.
  }
}

async function onDelete() {
  if (!editingId.value) return
  if (!confirm('Delete this product? Existing orders keep their copy of it. To stop new orders but keep it on record, untick “Show in the shop” instead.')) return
  await remove(editingId.value)
  showForm.value = false
  editingId.value = null
}

onMounted(async () => {
  await fetchAll()
  if (!products.value.length) openNew()
})

useHead({ title: 'Shop products · Admin' })
</script>
