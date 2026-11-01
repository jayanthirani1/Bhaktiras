<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-4 pb-24 pt-8 md:pt-12">
    <div class="mx-auto max-w-2xl">
      <NuxtLink to="/account#my-orders" class="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--primary))]">
        <IconArrowLeft class="h-4 w-4" /> My orders
      </NuxtLink>

      <ClientOnly>
        <p v-if="loading || auth.loading.value" class="text-center text-sm text-[hsl(var(--muted-foreground))]">Loading your order…</p>

        <div v-else-if="!auth.user.value" class="card-surface p-8 text-center">
          <IconLock class="mx-auto h-8 w-8 text-[hsl(var(--golden-900))]" />
          <h2 class="mt-3 font-display text-xl font-semibold text-[hsl(var(--primary))]">Sign in to see your order</h2>
          <NuxtLink :to="`/login?redirect=${encodeURIComponent(route.fullPath)}`" class="btn-primary mt-5 inline-flex">Sign in</NuxtLink>
        </div>

        <div v-else-if="!order" class="card-surface p-8 text-center">
          <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">Order not found</h2>
          <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">We could not find order {{ reference }} on this account.</p>
        </div>

        <div v-else class="space-y-5">
          <div v-if="justPlaced" class="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <IconCircleCheck class="mx-auto h-9 w-9 text-emerald-700" />
            <h1 class="mt-2 font-display text-2xl font-semibold text-emerald-900">Thank you, your pre-order is placed</h1>
            <p class="mt-1 text-sm text-emerald-900">Please pay using the reference below. The Treasury team will confirm once payment is received.</p>
          </div>
          <PageHeader v-else :title="`Order ${order.reference}`" />

          <section class="card-surface p-5 sm:p-6">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-mono text-lg font-bold text-[hsl(var(--primary))]">{{ order.reference }}</p>
                <p class="text-xs text-[hsl(var(--muted-foreground))]">Placed {{ formatShopDateTime(order.createdAt) }}</p>
              </div>
              <ShopStatusBadge :status="order.status" />
            </div>
            <div class="mt-4">
              <ShopOrderItems :items="order.items" :total="order.total" />
            </div>
            <p v-if="order.note" class="mt-4 rounded-lg bg-[hsl(var(--muted))] p-3 text-sm"><span class="font-semibold">Your note:</span> {{ order.note }}</p>
          </section>

          <ShopPaymentDetails v-if="order.status === 'awaiting_payment'" :reference="order.reference" :total="order.total" :settings="settings" />
          <div v-else-if="order.status === 'paid'" class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Payment received{{ order.paidAt ? ` on ${formatShopDate(order.paidAt)}` : '' }}. Thank you.
          </div>
          <div v-else class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            This order has been cancelled. Please contact the Souvenir team if you think this is a mistake.
          </div>

          <section class="card-surface p-5 sm:p-6">
            <p class="text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--golden-900))]">Collection</p>
            <p class="mt-2 text-sm leading-relaxed">{{ settings.collectionInfo }}</p>
            <p class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Need to change something? Please contact the Souvenir team with your reference.</p>
          </section>

          <div class="text-center">
            <NuxtLink to="/shop" class="text-sm font-semibold text-[hsl(var(--primary))] underline">Back to the shop</NuxtLink>
          </div>
        </div>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconArrowLeft, IconCircleCheck, IconLock } from '@tabler/icons-vue'
import type { ShopOrder } from '~/types'
import { formatShopDate, formatShopDateTime } from '~/data/shop'

const route = useRoute()
const auth = useAuth()
const { settings, load: loadSettings } = useShopSettings()

const reference = computed(() => String(route.params.reference || '').toUpperCase())
const justPlaced = computed(() => route.query.placed === '1')
const order = ref<ShopOrder | null>(null)
const loading = ref(true)

async function load() {
  if (!auth.user.value) {
    loading.value = auth.loading.value
    return
  }
  loading.value = true
  try {
    await loadSettings()
    order.value = await fetchShopOrder(reference.value)
  } catch {
    // Someone else's reference, or one that does not exist: the rules refuse both alike.
    order.value = null
  } finally {
    loading.value = false
  }
}

watch(() => [auth.user.value?.uid, auth.loading.value], () => { void load() }, { immediate: true })

usePageSeo('Your order')
useNoIndex()
</script>
