<template>
  <span class="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-bold" :class="tone">
    {{ SHOP_STATUS_LABELS[status] }}
  </span>
</template>

<script setup lang="ts">
import type { ShopOrderStatus } from '~/types'
import { SHOP_STATUS_LABELS } from '~/data/shop'

const props = defineProps<{ status: ShopOrderStatus }>()

const tone = computed(() => ({
  awaiting_payment: 'bg-amber-100 text-amber-900',
  paid: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-100 text-slate-600'
})[props.status])
</script>
