<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-40 pt-5 md:pt-8">
    <div class="mx-auto max-w-5xl px-4">
      <!-- Compact header: products start near the top of the screen, and My
           orders is a button, not a link at the foot of the account page. -->
      <header class="flex items-center justify-between gap-3">
        <h1 class="text-3xl font-bold text-[hsl(var(--primary))] md:text-4xl">Shop</h1>
        <ClientOnly>
          <NuxtLink
            v-if="isLoggedIn"
            to="/shop/orders"
            class="relative inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[hsl(var(--golden-300))] bg-white px-3.5 py-2 text-sm font-semibold text-[hsl(var(--primary))] hover:border-[hsl(var(--primary))]"
          >
            <IconReceipt class="h-4 w-4" />
            My orders
            <span v-if="myOrders.length" class="rounded-full bg-[hsl(var(--golden-100))] px-1.5 text-xs tabular-nums">{{ myOrders.length }}</span>
          </NuxtLink>
        </ClientOnly>
      </header>
      <p class="mt-1 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{{ settings.intro }}</p>

      <details class="group mt-3 rounded-xl border border-[hsl(var(--border))] bg-white px-4 py-2.5 text-sm">
        <summary class="flex cursor-pointer list-none items-center justify-between font-semibold text-[hsl(var(--primary))]">
          How it works
          <IconChevronDown class="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <ol class="mt-3 space-y-2 pb-1 text-[hsl(var(--foreground))]">
          <li class="flex gap-3"><span class="step-dot">1</span><span><strong>Pre-order</strong> what you'd like. Each item has its own pre-order window.</span></li>
          <li class="flex gap-3"><span class="step-dot">2</span><span><strong>Pay</strong> by bank transfer using your order reference, or at the mandir. Items are ordered once paid.</span></li>
          <li class="flex gap-3"><span class="step-dot">3</span><span><strong>Collect</strong> at the mandir. {{ settings.collectionInfo }}</span></li>
        </ol>
      </details>

      <ClientOnly>
        <div v-if="isTestSite" class="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900">
          <strong>Test site.</strong> The Shop is shown here even while it is switched off on the live site.
          Orders placed here are test orders (BRTEST-…) and are not counted or ordered.
        </div>
        <ShopUnpaidBanner class="mt-3" />
      </ClientOnly>
    </div>

    <div class="mx-auto mt-5 max-w-5xl">
      <p v-if="loading && !products.length" class="px-4 text-center text-sm text-[hsl(var(--muted-foreground))]">Loading the shop…</p>
      <p v-else-if="error" role="alert" class="px-4 text-center text-sm text-red-600">{{ error }}</p>
      <div v-else-if="!products.length" class="card-surface mx-4 p-8 text-center">
        <IconShoppingBag class="mx-auto h-9 w-9 text-[hsl(var(--golden-900))]" />
        <h2 class="mt-3 font-display text-xl font-semibold text-[hsl(var(--primary))]">Pre-orders opening soon</h2>
        <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Souvenirs for the Patotsav will appear here. Please check back.</p>
      </div>

      <template v-else>
        <!-- Stays under the top bar while scrolling; scrolls sideways on a phone
             rather than wrapping into rows. -->
        <nav
          v-if="categories.length > 1"
          class="sticky top-14 z-30 -mt-1 bg-[hsl(var(--background))]/95 py-2 backdrop-blur md:top-16"
          aria-label="Categories"
        >
          <div class="flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
            <button
              v-for="category in ['All', ...categories]"
              :key="category"
              type="button"
              class="shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors"
              :class="activeCategory === category
                ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white'
                : 'border-[hsl(var(--border))] bg-white text-[hsl(var(--primary))] hover:border-[hsl(var(--primary))]'"
              :aria-pressed="activeCategory === category"
              @click="activeCategory = category"
            >
              {{ category }}
            </button>
          </div>
        </nav>

        <section v-for="group in visibleGroups" :key="group.category" class="mt-3 px-4 pb-6">
          <!-- With one category chosen, the button above already names it. -->
          <h2 v-if="activeCategory === 'All' && categories.length > 1" class="mb-3 font-display text-2xl font-semibold text-[hsl(var(--primary))]">
            {{ group.category }}
          </h2>
          <ul class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            <li v-for="product in group.products" :key="product.id">
              <button
                type="button"
                class="card-surface flex h-full w-full flex-col overflow-hidden text-left"
                :class="windowState(product) === 'open' ? '' : 'opacity-60'"
                @click="openProduct(product)"
              >
                <div class="aspect-square w-full bg-[hsl(var(--muted))]">
                  <img v-if="product.images[0]" :src="product.images[0]" :alt="product.name" class="h-full w-full object-cover" loading="lazy">
                  <div v-else class="flex h-full w-full items-center justify-center">
                    <IconShoppingBag class="h-10 w-10 text-[hsl(var(--golden-300))]" />
                  </div>
                </div>
                <div class="flex flex-1 flex-col p-3">
                  <p class="font-semibold leading-snug text-[hsl(var(--primary))]">{{ product.name }}</p>
                  <p class="mt-1 text-sm font-semibold text-[hsl(var(--foreground))]">{{ priceLabel(product) }}</p>
                  <p v-if="sizeHint(product)" class="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{{ sizeHint(product) }}</p>
                  <p
                    class="mt-auto pt-2 text-xs font-semibold"
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
import { IconChevronDown, IconReceipt, IconShoppingBag } from '@tabler/icons-vue'
import type { ShopProduct } from '~/types'
import { formatPence, priceLabel, windowLabel, windowState } from '~/data/shop'

const { isLoggedIn, user } = useAuth()
const isTestSite = useIsTestSite()
const { products, loading, error, load } = useShopProducts()
const { settings, load: loadSettings } = useShopSettings()
const { orders: myOrders, load: loadMyOrders } = useMyShopOrders()
const basket = useShopBasket()
const route = useRoute()

const activeCategory = ref('All')
const selected = ref<ShopProduct | null>(null)

/** What can be ordered now comes first; not-yet-open next; closed last. */
const WINDOW_RANK = { open: 0, upcoming: 1, closed: 2 } as const

const categories = computed(() => [...new Set(products.value.map(product => product.category))])
const visibleGroups = computed(() => categories.value
  .filter(category => activeCategory.value === 'All' || activeCategory.value === category)
  .map(category => ({
    category,
    products: products.value
      .filter(product => product.category === category)
      .map((product, index) => ({ product, index }))
      .sort((a, b) => WINDOW_RANK[windowState(a.product)] - WINDOW_RANK[windowState(b.product)] || a.index - b.index)
      .map(entry => entry.product)
  })))

/** Tells a parent at a glance whether there is anything in their child's size. */
function sizeHint(product: ShopProduct) {
  const adult = product.sizes.some(size => size.group === 'adult')
  const child = product.sizes.some(size => size.group === 'child')
  if (adult && child) return 'Adult & child sizes'
  if (child) return 'Child sizes'
  return ''
}

function openProduct(product: ShopProduct) {
  selected.value = product
}

// A category that disappears (its last product hidden) falls back to All.
watch(categories, (list) => {
  if (activeCategory.value !== 'All' && !list.includes(activeCategory.value)) activeCategory.value = 'All'
})

watch(() => user.value?.uid, () => { void loadMyOrders() })

onMounted(async () => {
  await Promise.all([load(true), loadSettings()])
  // A shared link straight to one item: /shop?item=<id>
  const item = typeof route.query.item === 'string' ? route.query.item : ''
  if (item) selected.value = products.value.find(product => product.id === item) ?? null
})

usePageSeo('Shop', 'Pre-order souvenirs for the Bhaktiras Patotsav and collect them at the mandir.')
</script>

<style scoped>
.step-dot {
  display: inline-flex;
  height: 1.375rem;
  width: 1.375rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: hsl(var(--primary));
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
}
</style>
