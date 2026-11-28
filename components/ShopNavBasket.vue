<template>
  <NuxtLink
    v-if="shopVisible && count > 0"
    to="/shop/basket"
    class="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))]"
    :aria-label="`Basket, ${count} item${count === 1 ? '' : 's'}`"
  >
    <IconShoppingBag class="h-5 w-5" />
    <span class="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#FDC500] px-1 text-[10px] font-bold tabular-nums text-[hsl(var(--primary))]">
      {{ count > 99 ? '99+' : count }}
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
import { IconShoppingBag } from '@tabler/icons-vue'

/** The basket, reachable from every page once something is in it. */
const shopVisible = useShopVisible()
const { count } = useShopBasket()
</script>
