<template>
  <div v-if="first" class="rounded-2xl border border-amber-300 bg-amber-50 p-4" role="status">
    <div class="flex items-start gap-3">
      <IconAlertCircle class="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
      <div class="min-w-0 flex-1">
        <p class="font-semibold text-amber-950">
          <template v-if="awaitingPayment.length === 1">Your order is waiting for payment</template>
          <template v-else>{{ awaitingPayment.length }} orders are waiting for payment</template>
        </p>
        <p class="mt-0.5 text-sm text-amber-900">
          <span class="font-mono font-semibold">{{ first.reference }}</span> · {{ formatPence(first.total) }}<template v-if="awaitingPayment.length > 1"> and {{ awaitingPayment.length - 1 }} more</template>.
          It is only ordered from our suppliers once paid.
        </p>
        <NuxtLink
          :to="awaitingPayment.length === 1 ? `/shop/orders/${first.reference}` : '/shop/orders'"
          class="mt-3 inline-flex items-center rounded-full bg-amber-900 px-4 py-2 text-sm font-semibold text-white"
        >
          {{ awaitingPayment.length === 1 ? 'Pay now' : 'See how to pay' }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconAlertCircle } from '@tabler/icons-vue'
import { formatPence } from '~/data/shop'

const { user } = useAuth()
const { awaitingPayment, load } = useMyShopOrders()
const first = computed(() => awaitingPayment.value[0] ?? null)

watch(() => user.value?.uid, () => { void load() }, { immediate: true })
</script>
