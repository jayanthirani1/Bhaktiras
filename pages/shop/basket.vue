<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-4 pb-24 pt-8 md:pt-12">
    <div class="mx-auto max-w-2xl">
      <NuxtLink to="/shop" class="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--primary))]">
        <IconArrowLeft class="h-4 w-4" /> Back to the shop
      </NuxtLink>
      <PageHeader title="Your basket" subtitle="Check your items, add your details and place your pre-order." />

      <ClientOnly>
        <p v-if="productsLoading && !products.length" class="text-center text-sm text-[hsl(var(--muted-foreground))]">Loading your basket…</p>

        <div v-else-if="!basket.lines.value.length" class="card-surface p-8 text-center">
          <IconShoppingBag class="mx-auto h-9 w-9 text-[hsl(var(--golden-900))]" />
          <h2 class="mt-3 font-display text-xl font-semibold text-[hsl(var(--primary))]">Your basket is empty</h2>
          <NuxtLink to="/shop" class="btn-primary mt-5 inline-flex">Browse the shop</NuxtLink>
        </div>

        <form v-else class="space-y-5" @submit.prevent="submit">
          <section class="card-surface p-5 sm:p-6">
            <p class="text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--golden-900))]">Items</p>
            <ul class="mt-3 divide-y divide-[hsl(var(--border))]">
              <li v-for="entry in basket.detailed.value" :key="basketKey(entry.line)" class="flex gap-3 py-3">
                <div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[hsl(var(--muted))]">
                  <img v-if="entry.product?.images[0]" :src="entry.product.images[0]" alt="" class="h-full w-full object-cover">
                </div>
                <div class="min-w-0 flex-1">
                  <p class="font-semibold text-[hsl(var(--primary))]">{{ entry.product?.name || 'Item no longer available' }}</p>
                  <p class="text-xs text-[hsl(var(--muted-foreground))]">
                    <span v-if="entry.line.size">{{ entry.line.size }} · </span>{{ formatPence(entry.unitPrice) }} each
                  </p>
                  <p v-if="!entry.available" class="mt-1 text-xs font-semibold text-red-600">
                    {{ entry.product ? windowLabel(entry.product) : 'This item has been removed from the shop.' }} — please remove it.
                  </p>
                  <div class="mt-2 flex items-center gap-3">
                    <ShopQuantityStepper :model-value="entry.line.quantity" :min="0" @update:model-value="basket.setQuantity(entry.line, $event)" />
                    <button type="button" class="text-xs font-semibold text-red-600" @click="basket.remove(entry.line)">Remove</button>
                  </div>
                </div>
                <span class="shrink-0 text-sm font-semibold tabular-nums">{{ formatPence(entry.lineTotal) }}</span>
              </li>
            </ul>
            <div class="mt-2 flex items-center justify-between border-t border-[hsl(var(--border))] pt-3 font-semibold">
              <span>Total</span>
              <span class="tabular-nums text-[hsl(var(--primary))]">{{ formatPence(basket.total.value) }}</span>
            </div>
          </section>

          <section v-if="!isLoggedIn" class="card-surface p-6 text-center">
            <IconLock class="mx-auto h-8 w-8 text-[hsl(var(--golden-900))]" />
            <h2 class="mt-3 font-display text-xl font-semibold text-[hsl(var(--primary))]">Sign in to order</h2>
            <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Your basket will be here when you get back.</p>
            <NuxtLink to="/login?redirect=/shop/basket" class="btn-primary mt-5 inline-flex">Sign in</NuxtLink>
          </section>

          <template v-else>
            <section class="card-surface space-y-4 p-5 sm:p-6">
              <p class="text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--golden-900))]">Your details</p>
              <div>
                <label for="shop-name" class="mb-1 block text-sm font-semibold text-[hsl(var(--primary))]">Name</label>
                <input id="shop-name" v-model="form.name" required maxlength="80" autocomplete="name" class="admin-input">
              </div>
              <div>
                <label for="shop-phone" class="mb-1 block text-sm font-semibold text-[hsl(var(--primary))]">Phone number</label>
                <input id="shop-phone" v-model="form.phone" required maxlength="30" type="tel" inputmode="tel" autocomplete="tel" class="admin-input" placeholder="07700 900123">
                <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">The Treasury team will use this if they need to reach you about payment.</p>
              </div>
              <div>
                <label for="shop-email" class="mb-1 block text-sm font-semibold text-[hsl(var(--primary))]">Email</label>
                <input id="shop-email" v-model="form.email" required maxlength="200" type="email" autocomplete="email" class="admin-input">
              </div>
              <div>
                <label for="shop-note" class="mb-1 block text-sm font-semibold text-[hsl(var(--primary))]">Note <span class="font-normal text-[hsl(var(--muted-foreground))]">(optional)</span></label>
                <textarea id="shop-note" v-model="form.note" maxlength="500" rows="3" class="admin-input" placeholder="For example, collecting for my parents" />
              </div>
            </section>

            <section class="card-surface p-5 sm:p-6">
              <p class="text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--golden-900))]">Pre-order terms</p>
              <ol class="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[hsl(var(--foreground))]">
                <li v-for="(term, index) in terms" :key="index">{{ term }}</li>
              </ol>
              <label class="mt-4 flex items-start gap-3 text-sm font-semibold text-[hsl(var(--primary))]">
                <input v-model="form.acceptTerms" type="checkbox" required class="mt-0.5 h-5 w-5 shrink-0 rounded">
                I agree to the pre-order terms
              </label>
            </section>

            <p v-if="submitError" role="alert" class="text-sm font-semibold text-red-600">{{ submitError }}</p>
            <button type="submit" class="btn-primary w-full" :disabled="!canSubmit" :class="!canSubmit ? 'opacity-50' : ''">
              {{ placing ? 'Placing your order…' : `Place pre-order · ${formatPence(basket.total.value)}` }}
            </button>
            <p class="text-center text-xs text-[hsl(var(--muted-foreground))]">
              No payment is taken here. You will see your payment reference and bank details next.
            </p>
          </template>
        </form>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconArrowLeft, IconLock, IconShoppingBag } from '@tabler/icons-vue'
import { basketKey, formatPence, shopTermsList, shopTermsVersion, windowLabel } from '~/data/shop'

const { user, userName, isLoggedIn } = useAuth()
const { products, loading: productsLoading, load } = useShopProducts()
const { settings, load: loadSettings } = useShopSettings()
const basket = useShopBasket()
const myOrders = useMyShopOrders()

const form = reactive({ name: '', email: '', phone: '', note: '', acceptTerms: false })
const placing = ref(false)
const submitError = ref('')

const terms = computed(() => shopTermsList(settings.value))
const allAvailable = computed(() => basket.detailed.value.every(entry => entry.available))
const canSubmit = computed(() => !placing.value && basket.lines.value.length > 0 && allAvailable.value && form.acceptTerms)

/** Fill in what we already know: the account, then the last order's phone number. */
async function prefill() {
  if (!user.value) return
  if (!form.name) form.name = userName.value || ''
  if (!form.email) form.email = user.value.email || ''
  await myOrders.load()
  const last = myOrders.orders.value[0]
  if (last) {
    if (!form.phone) form.phone = last.customer.phone
    if (!form.name) form.name = last.customer.name
  }
}

watch(() => user.value?.uid, () => { void prefill() })

async function submit() {
  if (!canSubmit.value) return
  submitError.value = ''
  placing.value = true
  try {
    const reference = await placeShopOrder({
      items: basket.lines.value,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      note: form.note.trim(),
      acceptTerms: form.acceptTerms,
      termsVersion: shopTermsVersion(settings.value)
    })
    basket.clear()
    await navigateTo({ path: `/shop/orders/${reference}`, query: { placed: '1' } })
  } catch (error) {
    submitError.value = explainShopError(error)
  } finally {
    placing.value = false
  }
}

onMounted(async () => {
  await Promise.all([load(true), loadSettings()])
  await prefill()
})

usePageSeo('Your basket')
useNoIndex()
</script>
