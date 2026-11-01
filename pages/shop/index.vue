<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-4 pb-40 pt-8 md:pt-12">
    <div class="mx-auto max-w-5xl">
      <PageHeader title="Shop" :subtitle="settings.intro" />

      <div class="mx-auto mb-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs text-[hsl(var(--muted-foreground))]">
        <span class="inline-flex items-center gap-1"><IconCalendarEvent class="h-4 w-4" /> Pre-order</span>
        <span class="inline-flex items-center gap-1"><IconBuildingBank class="h-4 w-4" /> Pay by bank transfer or at the mandir</span>
        <span class="inline-flex items-center gap-1"><IconMapPin class="h-4 w-4" /> Collect at the mandir</span>
      </div>

      <div v-if="isLoggedIn" class="mb-6 text-center">
        <NuxtLink to="/account#my-orders" class="text-sm font-semibold text-[hsl(var(--primary))] underline">My orders</NuxtLink>
      </div>

      <p v-if="loading && !products.length" class="text-center text-sm text-[hsl(var(--muted-foreground))]">Loading the shop…</p>
      <p v-else-if="error" role="alert" class="text-center text-sm text-red-600">{{ error }}</p>
      <div v-else-if="!products.length" class="card-surface mx-auto max-w-xl p-8 text-center">
        <IconShoppingBag class="mx-auto h-9 w-9 text-[hsl(var(--golden-900))]" />
        <h2 class="mt-3 font-display text-xl font-semibold text-[hsl(var(--primary))]">Pre-orders opening soon</h2>
        <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Souvenirs for the Patotsav will appear here. Please check back.</p>
      </div>

      <template v-else>
        <div v-if="categories.length > 1" class="mb-6 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Categories">
          <button
            v-for="category in ['All', ...categories]"
            :key="category"
            type="button"
            role="tab"
            class="rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors"
            :class="activeCategory === category
              ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white'
              : 'border-[hsl(var(--border))] bg-white text-[hsl(var(--primary))] hover:border-[hsl(var(--primary))]'"
            :aria-selected="activeCategory === category"
            @click="activeCategory = category"
          >
            {{ category }}
          </button>
        </div>

        <section v-for="group in visibleGroups" :key="group.category" class="mb-10">
          <h2 class="mb-4 font-display text-2xl font-semibold text-[hsl(var(--primary))]">{{ group.category }}</h2>
          <ul class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            <li v-for="product in group.products" :key="product.id">
              <button type="button" class="card-surface flex h-full w-full flex-col overflow-hidden text-left" @click="openProduct(product)">
                <div class="aspect-square w-full bg-[hsl(var(--muted))]">
                  <img v-if="product.images[0]" :src="product.images[0]" :alt="product.name" class="h-full w-full object-cover" loading="lazy">
                  <div v-else class="flex h-full w-full items-center justify-center">
                    <IconShoppingBag class="h-10 w-10 text-[hsl(var(--golden-300))]" />
                  </div>
                </div>
                <div class="flex flex-1 flex-col p-3">
                  <p class="font-semibold leading-snug text-[hsl(var(--primary))]">{{ product.name }}</p>
                  <p class="mt-1 text-sm font-semibold text-[hsl(var(--foreground))]">{{ priceLabel(product) }}</p>
                  <p
                    class="mt-auto pt-2 text-[11px] font-bold uppercase tracking-[0.08em]"
                    :class="windowState(product) === 'open' ? 'text-[hsl(var(--golden-900))]' : 'text-[hsl(var(--muted-foreground))]'"
                  >
                    {{ windowLabel(product) }}
                  </p>
                </div>
              </button>
            </li>
          </ul>
        </section>
      </template>
    </div>

    <!-- Basket bar: sits above the mobile tab bar. -->
    <ClientOnly>
      <div v-if="basket.count.value" class="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-40 px-4 pb-3 md:bottom-0 md:pb-6">
        <NuxtLink
          to="/shop/basket"
          class="mx-auto flex max-w-md items-center justify-between gap-3 rounded-full bg-[hsl(var(--primary))] px-5 py-3 text-white shadow-[0_16px_40px_-14px_hsl(var(--primary)/0.7)]"
        >
          <span class="inline-flex items-center gap-2 font-semibold">
            <IconShoppingBag class="h-5 w-5" />
            {{ basket.count.value }} item{{ basket.count.value === 1 ? '' : 's' }}
          </span>
          <span class="font-semibold tabular-nums">View basket · {{ formatPence(basket.total.value) }}</span>
        </NuxtLink>
      </div>
    </ClientOnly>

    <ShopProductSheet :product="selected" @close="selected = null" />
  </div>
</template>

<script setup lang="ts">
import { IconBuildingBank, IconCalendarEvent, IconMapPin, IconShoppingBag } from '@tabler/icons-vue'
import type { ShopProduct } from '~/types'
import { formatPence, priceLabel, windowLabel, windowState } from '~/data/shop'

const { isLoggedIn } = useAuth()
const { products, loading, error, load } = useShopProducts()
const { settings, load: loadSettings } = useShopSettings()
const basket = useShopBasket()
const route = useRoute()

const activeCategory = ref('All')
const selected = ref<ShopProduct | null>(null)

const categories = computed(() => [...new Set(products.value.map(product => product.category))])
const visibleGroups = computed(() => categories.value
  .filter(category => activeCategory.value === 'All' || activeCategory.value === category)
  .map(category => ({ category, products: products.value.filter(product => product.category === category) })))

function openProduct(product: ShopProduct) {
  selected.value = product
}

onMounted(async () => {
  await Promise.all([load(true), loadSettings()])
  // A shared link straight to one item: /shop?item=<id>
  const item = typeof route.query.item === 'string' ? route.query.item : ''
  if (item) selected.value = products.value.find(product => product.id === item) ?? null
})

usePageSeo('Shop', 'Pre-order souvenirs for the Bhaktiras Patotsav and collect them at the mandir.')
</script>
