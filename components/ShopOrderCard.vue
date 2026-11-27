<template>
  <NuxtLink :to="`/shop/orders/${order.reference}`" class="card-surface block p-4">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="font-mono text-sm font-bold text-[hsl(var(--primary))]">{{ order.reference }}</p>
        <p class="truncate text-xs text-[hsl(var(--muted-foreground))]">
          {{ formatShopDate(order.createdAt) }} · {{ itemCount }} item{{ itemCount === 1 ? '' : 's' }}
        </p>
      </div>
      <div class="flex shrink-0 flex-col items-end gap-1">
        <ShopStatusBadge :status="order.status" />
        <span class="text-sm font-semibold tabular-nums">{{ formatPence(order.total) }}</span>
      </div>
    </div>
    <p class="mt-2 line-clamp-1 text-xs text-[hsl(var(--muted-foreground))]">{{ summary }}</p>
    <ShopOrderProgress class="mt-3" :status="order.status" compact />
    <p v-if="order.status === 'awaiting_payment'" class="mt-3 text-sm font-semibold text-[hsl(var(--primary))]">
      See how to pay →
    </p>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { ShopOrder } from '~/types'
import { formatPence, formatShopDate, itemLabel } from '~/data/shop'

const props = defineProps<{ order: ShopOrder }>()

const itemCount = computed(() => props.order.items.reduce((sum, item) => sum + item.quantity, 0))
const summary = computed(() => props.order.items.map(item => `${item.quantity}× ${itemLabel(item)}`).join(', '))
</script>
