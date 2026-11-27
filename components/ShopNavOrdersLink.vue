<template>
  <NuxtLink
    v-if="shopVisible && orders.length"
    to="/shop/orders"
    class="flex items-center gap-3 rounded-2xl border border-[hsl(var(--golden-200))] bg-white px-4 py-3 text-[hsl(var(--primary))] transition-colors hover:border-[#FDC500] hover:bg-[hsl(var(--golden-50))]"
    @click="emit('navigate')"
  >
    <IconReceipt class="h-5 w-5 shrink-0" />
    <span class="min-w-0 flex-1 text-sm font-medium">My orders</span>
    <span v-if="awaitingPayment.length" class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
      {{ awaitingPayment.length }} to pay
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
import { IconReceipt } from '@tabler/icons-vue'

/** "My orders" in the More drawer, for someone who has placed one. */
const emit = defineEmits<{ navigate: [] }>()
const shopVisible = useShopVisible()
const { user } = useAuth()
const { orders, awaitingPayment, load } = useMyShopOrders()

onMounted(() => {
  if (shopVisible.value && user.value) void load()
})
</script>
