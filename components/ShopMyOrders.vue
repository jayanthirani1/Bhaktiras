<template>
  <section v-if="shown" id="my-orders" class="card-surface scroll-mt-24 p-5 sm:p-6">
    <div class="flex items-start gap-3">
      <IconShoppingBag class="mt-0.5 h-6 w-6 shrink-0 text-[hsl(var(--golden-900))]" />
      <div class="min-w-0 flex-1">
        <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">My orders</h2>
        <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Your souvenir pre-orders. To change an order, contact the Souvenir team with its reference.</p>
      </div>
    </div>

    <p v-if="loading" class="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Loading your orders…</p>
    <p v-else-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="!orders.length" class="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
      You have not placed any orders yet. <NuxtLink to="/shop" class="font-semibold underline">Visit the shop</NuxtLink>
    </p>
    <ul v-else class="mt-4 space-y-2">
      <li v-for="order in orders" :key="order.id">
        <NuxtLink :to="`/shop/orders/${order.reference}`" class="admin-row flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="font-mono text-sm font-bold text-[hsl(var(--primary))]">{{ order.reference }}</p>
            <p class="truncate text-xs text-[hsl(var(--muted-foreground))]">
              {{ formatShopDate(order.createdAt) }} · {{ itemCount(order) }} item{{ itemCount(order) === 1 ? '' : 's' }} · {{ formatPence(order.total) }}
            </p>
          </div>
          <ShopStatusBadge :status="order.status" />
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { IconShoppingBag } from '@tabler/icons-vue'
import type { ShopOrder } from '~/types'
import { formatPence, formatShopDate } from '~/data/shop'

const { user } = useAuth()
const { sections } = useSiteContent()
const { orders, loading, error, load } = useMyShopOrders()

/** With the shop switched off, only someone who already has orders sees this. */
const shopOpen = computed(() => sections.value.find(section => section.id === 'shop')?.visible === true)
const shown = computed(() => shopOpen.value || orders.value.length > 0)

function itemCount(order: ShopOrder) {
  return order.items.reduce((sum, item) => sum + item.quantity, 0)
}

watch(() => user.value?.uid, () => { void load() }, { immediate: true })
</script>
