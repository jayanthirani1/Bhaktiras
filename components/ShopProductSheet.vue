<template>
  <NiyamSheet :open="!!product" :title="product?.name || ''" :subtitle="product ? priceLabel(product) : ''" @close="emit('close')">
    <div v-if="product" class="space-y-5">
      <div v-if="product.images.length" class="space-y-2">
        <div class="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
          <img :src="product.images[imageIndex]" :alt="`${product.name}, photo ${imageIndex + 1}`" class="aspect-square w-full object-contain">
        </div>
        <div v-if="product.images.length > 1" class="flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="(url, index) in product.images"
            :key="url"
            type="button"
            class="h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-[hsl(var(--muted))]"
            :class="index === imageIndex ? 'border-[hsl(var(--primary))]' : 'border-transparent'"
            :aria-label="`Show photo ${index + 1}`"
            @click="imageIndex = index"
          >
            <img :src="url" alt="" class="h-full w-full object-cover">
          </button>
        </div>
      </div>

      <p class="text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--golden-900))]">{{ windowLabel(product) }}</p>
      <p v-if="product.description" class="whitespace-pre-line text-sm leading-relaxed text-[hsl(var(--foreground))]">{{ product.description }}</p>

      <div v-for="group in sizeGroups" :key="group.id">
        <p class="mb-2 text-sm font-semibold text-[hsl(var(--primary))]">
          {{ group.label }}
          <span class="font-normal text-[hsl(var(--muted-foreground))]">· {{ formatPence(group.price) }}</span>
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="size in group.sizes"
            :key="size.label"
            type="button"
            class="min-w-[3rem] rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors"
            :class="selectedSize === size.label
              ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white'
              : 'border-[hsl(var(--border))] bg-white text-[hsl(var(--primary))] hover:border-[hsl(var(--primary))]'"
            :aria-pressed="selectedSize === size.label"
            @click="selectedSize = size.label"
          >
            {{ size.label }}
          </button>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-sm font-semibold text-[hsl(var(--primary))]">Quantity</span>
        <ShopQuantityStepper v-model="quantity" />
      </div>
    </div>

    <template #footer>
      <div v-if="product">
        <p v-if="added" role="status" class="mb-2 text-center text-sm font-semibold text-emerald-700">Added to your basket</p>
        <button
          type="button"
          class="btn-primary w-full"
          :disabled="!canAdd"
          :class="!canAdd ? 'opacity-50' : ''"
          @click="addToBasket"
        >
          <template v-if="state !== 'open'">{{ windowLabel(product) }}</template>
          <template v-else-if="needsSize">Choose a size</template>
          <template v-else>Add to basket · {{ formatPence(unitPrice * quantity) }}</template>
        </button>
      </div>
    </template>
  </NiyamSheet>
</template>

<script setup lang="ts">
import type { ShopProduct } from '~/types'
import { formatPence, priceLabel, unitPriceFor, windowLabel, windowState } from '~/data/shop'

const props = defineProps<{ product: ShopProduct | null }>()
const emit = defineEmits<{ close: [] }>()

const basket = useShopBasket()
const imageIndex = ref(0)
const selectedSize = ref<string | null>(null)
const quantity = ref(1)
const added = ref(false)

watch(() => props.product?.id, () => {
  imageIndex.value = 0
  quantity.value = 1
  added.value = false
  // A product with a single size needs no choosing.
  selectedSize.value = props.product?.sizes.length === 1 ? props.product.sizes[0].label : null
})

const sizeGroups = computed(() => {
  const product = props.product
  if (!product?.sizes.length) return []
  const adult = product.sizes.filter(size => size.group === 'adult')
  const child = product.sizes.filter(size => size.group === 'child')
  const groups = []
  if (adult.length) groups.push({ id: 'adult', label: child.length ? 'Adult sizes' : 'Size', sizes: adult, price: product.price })
  if (child.length) groups.push({ id: 'child', label: adult.length ? 'Child sizes' : 'Size', sizes: child, price: product.childPrice ?? product.price })
  return groups
})

const state = computed(() => props.product ? windowState(props.product) : 'closed')
const needsSize = computed(() => !!props.product?.sizes.length && !selectedSize.value)
const canAdd = computed(() => state.value === 'open' && !needsSize.value)
const unitPrice = computed(() => props.product ? unitPriceFor(props.product, selectedSize.value) : 0)

function addToBasket() {
  if (!props.product || !canAdd.value) return
  basket.add(props.product.id, props.product.sizes.length ? selectedSize.value : null, quantity.value)
  added.value = true
  setTimeout(() => emit('close'), 700)
}
</script>
