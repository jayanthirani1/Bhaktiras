<template>
  <section v-if="orders.length" id="my-orders" class="card-surface scroll-mt-24 p-5 sm:p-6">
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-start gap-3">
        <IconShoppingBag class="mt-0.5 h-6 w-6 shrink-0 text-[hsl(var(--golden-900))]" />
        <div>
          <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">My orders</h2>
          <p v-if="awaitingPayment.length" class="mt-1 text-sm font-semibold text-amber-800">
            {{ awaitingPayment.length }} waiting for payment
          </p>
        </div>
      </div>
      <NuxtLink to="/shop/orders" class="shrink-0 text-sm font-semibold text-[hsl(var(--primary))] underline">See all</NuxtLink>
    </div>
    <ul class="mt-4 space-y-2">
      <li v-for="order in orders.slice(0, 3)" :key="order.id">
        <NuxtLink :to="`/shop/orders/${order.reference}`" class="admin-row flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="font-mono text-sm font-bold text-[hsl(var(--primary))]">{{ order.reference }}</p>
            <p class="truncate text-xs text-[hsl(var(--muted-foreground))]">{{ formatShopDate(order.createdAt) }} · {{ formatPence(order.total) }}</p>
          </div>
          <ShopStatusBadge :status="order.status" />
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { IconShoppingBag } from '@tabler/icons-vue'
import { formatPence, formatShopDate } from '~/data/shop'

/**
 * The account page's view of the shop: shown only to someone who has orders,
 * and placed first on the page, so a devotee coming back to pay finds the
 * reference without scrolling past settings. The full list is /shop/orders.
 */
const { user } = useAuth()
const { orders, awaitingPayment, load } = useMyShopOrders()

watch(() => user.value?.uid, () => { void load() }, { immediate: true })
</script>
