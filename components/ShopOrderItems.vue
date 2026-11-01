<template>
  <div>
    <ul class="divide-y divide-[hsl(var(--border))]">
      <li v-for="(item, index) in items" :key="index" class="flex items-start justify-between gap-3 py-2.5 text-sm">
        <div class="min-w-0">
          <p class="font-semibold text-[hsl(var(--foreground))]">{{ item.name }}</p>
          <p class="text-xs text-[hsl(var(--muted-foreground))]">
            <span v-if="item.size">{{ item.size }}<span v-if="item.group === 'child'"> (child)</span> · </span>{{ item.quantity }} × {{ formatPence(item.unitPrice) }}
          </p>
        </div>
        <span class="shrink-0 font-semibold tabular-nums">{{ formatPence(item.lineTotal) }}</span>
      </li>
    </ul>
    <div class="mt-2 flex items-center justify-between border-t border-[hsl(var(--border))] pt-3 font-semibold">
      <span>Total</span>
      <span class="tabular-nums text-[hsl(var(--primary))]">{{ formatPence(total) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ShopOrderItem } from '~/types'
import { formatPence } from '~/data/shop'

defineProps<{ items: ShopOrderItem[]; total: number }>()
</script>
