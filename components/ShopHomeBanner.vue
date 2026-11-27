<template>
  <section v-if="shopVisible && openCount" class="mx-auto mb-8 max-w-2xl px-4">
    <NuxtLink
      to="/shop"
      class="flex items-center gap-4 rounded-2xl border border-[hsl(var(--golden-300))] bg-[hsl(var(--golden-50))] p-4 transition-colors hover:border-[hsl(var(--golden-500))]"
    >
      <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white">
        <IconShoppingBag class="h-6 w-6" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block font-display text-lg font-semibold leading-snug text-[hsl(var(--primary))]">Souvenir pre-orders are open</span>
        <span class="block text-sm text-[hsl(var(--muted-foreground))]">
          {{ openCount }} item{{ openCount === 1 ? '' : 's' }} to pre-order<template v-if="closesSoonest"> · first closes {{ formatShopDate(closesSoonest) }}</template>
        </span>
      </span>
      <IconChevronRight class="h-5 w-5 shrink-0 text-[hsl(var(--primary))]" />
    </NuxtLink>
  </section>
</template>

<script setup lang="ts">
import { IconChevronRight, IconShoppingBag } from '@tabler/icons-vue'
import { formatShopDate, windowState } from '~/data/shop'

/**
 * The homepage's pointer to the Shop while anything can be pre-ordered. It
 * reads nothing until the Shop is switched on, so a hidden shop costs the
 * homepage no Firestore read.
 */
const shopVisible = useShopVisible()
const { products, load } = useShopProducts()

const open = computed(() => products.value.filter(product => windowState(product) === 'open'))
const openCount = computed(() => open.value.length)
const closesSoonest = computed(() => {
  const dates = open.value.map(product => product.closesAt).filter((date): date is Date => !!date)
  return dates.length ? new Date(Math.min(...dates.map(date => date.getTime()))) : null
})

watch(shopVisible, (visible) => { if (visible) void load() }, { immediate: true })
</script>
