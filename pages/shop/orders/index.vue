<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-4 pb-24 pt-8 md:pt-12">
    <div class="mx-auto max-w-2xl">
      <NuxtLink to="/shop" class="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--primary))]">
        <IconArrowLeft class="h-4 w-4" /> Back to the shop
      </NuxtLink>
      <PageHeader title="My orders" subtitle="Your souvenir pre-orders, how to pay, and what happens next." />

      <ClientOnly>
        <p v-if="auth.loading.value || (loading && !orders.length)" class="text-center text-sm text-[hsl(var(--muted-foreground))]">Loading your orders…</p>

        <div v-else-if="!auth.user.value" class="card-surface p-8 text-center">
          <IconLock class="mx-auto h-8 w-8 text-[hsl(var(--golden-900))]" />
          <h2 class="mt-3 font-display text-xl font-semibold text-[hsl(var(--primary))]">Sign in to see your orders</h2>
          <NuxtLink to="/login?redirect=/shop/orders" class="btn-primary mt-5 inline-flex">Sign in</NuxtLink>
        </div>

        <p v-else-if="error" role="alert" class="text-center text-sm text-red-600">{{ error }}</p>

        <div v-else-if="!orders.length" class="card-surface p-8 text-center">
          <IconShoppingBag class="mx-auto h-9 w-9 text-[hsl(var(--golden-900))]" />
          <h2 class="mt-3 font-display text-xl font-semibold text-[hsl(var(--primary))]">No orders yet</h2>
          <NuxtLink to="/shop" class="btn-primary mt-5 inline-flex">Visit the shop</NuxtLink>
        </div>

        <div v-else class="space-y-6">
          <section v-if="awaitingPayment.length" aria-labelledby="to-pay">
            <h2 id="to-pay" class="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-amber-800">Waiting for payment</h2>
            <div class="space-y-3">
              <ShopOrderCard v-for="order in awaitingPayment" :key="order.id" :order="order" />
            </div>
          </section>
          <section v-if="others.length" aria-labelledby="other-orders">
            <h2 id="other-orders" class="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--golden-900))]">
              {{ awaitingPayment.length ? 'Other orders' : 'Your orders' }}
            </h2>
            <div class="space-y-3">
              <ShopOrderCard v-for="order in others" :key="order.id" :order="order" />
            </div>
          </section>
          <p class="text-center text-xs text-[hsl(var(--muted-foreground))]">
            Need to change an order? Contact the Souvenir team with its reference.
          </p>
        </div>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconArrowLeft, IconLock, IconShoppingBag } from '@tabler/icons-vue'

const auth = useAuth()
const { orders, awaitingPayment, loading, error, load } = useMyShopOrders()
const others = computed(() => orders.value.filter(order => order.status !== 'awaiting_payment'))

watch(() => auth.user.value?.uid, () => { void load(true) }, { immediate: true })

usePageSeo('My orders')
useNoIndex()
</script>
