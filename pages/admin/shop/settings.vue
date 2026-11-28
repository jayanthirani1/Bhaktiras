<template>
  <form class="max-w-3xl space-y-4" @submit.prevent="save">
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <section class="admin-panel space-y-4">
      <div>
        <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">Bank details</h2>
        <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Shown to a devotee with their payment reference after they order, and on their order page until it is paid.
          Leave blank until the Treasury team confirms them — the shop then says the details will be shared separately.
        </p>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div v-for="field in bankFields" :key="field.key">
          <label class="admin-label" :for="`s-${field.key}`">{{ field.label }}</label>
          <input :id="`s-${field.key}`" v-model="form[field.key]" :maxlength="field.maxLength" class="admin-input">
        </div>
      </div>
    </section>

    <section class="admin-panel space-y-3">
      <div>
        <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">Size guide</h2>
        <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          One size chart (adult and child) as an image. A "Size guide" link appears on every product that has sizes.
          Leave empty to hide the link.
        </p>
      </div>
      <AdminImageUpload v-model="form.sizeGuideUrl" folder="shop" />
    </section>

    <section class="admin-panel space-y-4">
      <div>
        <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">Wording</h2>
        <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Clear a box to go back to the standard wording.</p>
      </div>
      <div v-for="field in copyFields" :key="field.key">
        <div class="flex items-center justify-between gap-2">
          <label class="admin-label" :for="`s-${field.key}`">{{ field.label }}</label>
          <button v-if="form[field.key] !== DEFAULT_SHOP_SETTINGS[field.key]" type="button" class="text-xs font-semibold text-[hsl(var(--primary))] underline" @click="form[field.key] = DEFAULT_SHOP_SETTINGS[field.key]">
            Use standard wording
          </button>
        </div>
        <textarea :id="`s-${field.key}`" v-model="form[field.key]" :maxlength="field.maxLength" :rows="field.key === 'terms' ? 9 : 3" class="admin-input" />
      </div>
      <p class="text-xs text-[hsl(var(--muted-foreground))]">
        Each order records which wording of the terms was agreed (currently <span class="font-mono">{{ shopTermsVersion(form) }}</span>).
      </p>
    </section>

    <div class="flex items-center gap-3">
      <button type="submit" class="admin-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save settings' }}</button>
      <span v-if="saved" class="text-sm font-semibold text-emerald-700">Saved.</span>
    </div>

    <!-- Push notifications are a full-admin tool, so the shop team does not see this. -->
    <section v-if="isAdminUser" class="admin-panel space-y-3">
      <div>
        <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">Announce pre-orders</h2>
        <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Opens Push notifications with a draft filled in. Nothing is sent until you review it and press Send there.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink :to="announceOpen" class="admin-btn-secondary">Draft "pre-orders are open"</NuxtLink>
        <NuxtLink v-if="announceClosing" :to="announceClosing" class="admin-btn-secondary">Draft "closing soon"</NuxtLink>
      </div>
    </section>
  </form>
</template>

<script setup lang="ts">
import type { ShopSettings } from '~/types'
import { DEFAULT_SHOP_SETTINGS, formatShopDate, SHOP_SETTINGS_FIELDS, shopTermsVersion, windowState } from '~/data/shop'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { settings, load } = useShopSettings()
const { isAdminUser } = useAdminAccess()
const { products, fetchAll: fetchProducts } = useShopAdminProducts()

/** The soonest a live product stops taking pre-orders, for the reminder draft. */
const soonestClose = computed(() => {
  const now = new Date()
  const dates = products.value
    .filter(product => product.active && windowState(product, now) === 'open' && product.closesAt)
    .map(product => product.closesAt as Date)
  return dates.length ? new Date(Math.min(...dates.map(date => date.getTime()))) : null
})

function draftLink(title: string, body: string) {
  return { path: '/admin/notifications', query: { title, body, url: '/shop', topic: 'announcements' } }
}

const announceOpen = computed(() => draftLink(
  'Souvenir pre-orders are open',
  'Pre-order Patotsav souvenirs in the Bhaktiras app and collect them at the mandir.'
))
const announceClosing = computed(() => soonestClose.value
  ? draftLink(
      'Souvenir pre-orders close soon',
      `Pre-orders close on ${formatShopDate(soonestClose.value)}. Order and pay in time to get yours.`
    )
  : null)
const { saving, error, save: saveSettings } = useShopAdminSettings()
const form = reactive<ShopSettings>({ ...DEFAULT_SHOP_SETTINGS })
const saved = ref(false)

const bankFields = SHOP_SETTINGS_FIELDS.filter(field => !field.copy)
const copyFields = SHOP_SETTINGS_FIELDS.filter(field => field.copy)

async function save() {
  saved.value = false
  // Wording that matches the code default is stored blank, so a later change
  // to the default still reaches the shop instead of being pinned here.
  const payload = { ...form }
  for (const field of copyFields) {
    if (payload[field.key].trim() === DEFAULT_SHOP_SETTINGS[field.key]) payload[field.key] = ''
  }
  try {
    await saveSettings(payload)
    await load(true)
    saved.value = true
  } catch {
    // Shown via `error`.
  }
}

onMounted(async () => {
  void fetchProducts()
  await load(true)
  Object.assign(form, settings.value)
})

useHead({ title: 'Shop settings · Admin' })
</script>
