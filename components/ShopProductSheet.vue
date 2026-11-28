<template>
  <NiyamSheet :open="!!product" :title="product?.name || ''" :subtitle="product ? priceLabel(product) : ''" @close="emit('close')">
    <div v-if="product" class="space-y-5">
      <!-- 4:3 rather than square, so on a phone the sizes start near the
           first screen instead of under a full-width photo. Swipe or tap the
           thumbnails for the rest. -->
      <div v-if="product.images.length" class="space-y-2">
        <div
          ref="carousel"
          class="flex snap-x snap-mandatory overflow-x-auto rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] [scrollbar-width:none]"
          @scroll.passive="onCarouselScroll"
        >
          <img
            v-for="(url, index) in product.images"
            :key="url"
            :src="url"
            :alt="`${product.name}, photo ${index + 1} of ${product.images.length}`"
            class="aspect-[4/3] w-full shrink-0 snap-center object-contain"
          >
        </div>
        <div v-if="product.images.length > 1" class="flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="(url, index) in product.images"
            :key="url"
            type="button"
            class="h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 bg-[hsl(var(--muted))]"
            :class="index === imageIndex ? 'border-[hsl(var(--primary))]' : 'border-transparent'"
            :aria-label="`Show photo ${index + 1}`"
            :aria-current="index === imageIndex"
            @click="showImage(index)"
          >
            <img :src="url" alt="" class="h-full w-full object-cover">
          </button>
        </div>
      </div>

      <p class="text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--golden-900))]">{{ windowLabel(product) }}</p>
      <p v-if="product.description" class="whitespace-pre-line text-sm leading-relaxed text-[hsl(var(--foreground))]">{{ product.description }}</p>

      <div v-if="product.sizes.length" ref="sizesBlock" class="space-y-3 rounded-2xl transition-shadow" :class="flashSizes ? 'ring-2 ring-[#FDC500] ring-offset-4' : ''">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-semibold text-[hsl(var(--primary))]">Size</p>
          <a
            v-if="settings.sizeGuideUrl"
            :href="settings.sizeGuideUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--primary))] underline"
          >
            <IconRuler class="h-4 w-4" /> Size guide
          </a>
        </div>

        <!-- Adult / Child switch: twelve buttons at once are hard to scan, and
             a child S and an adult S are different sizes. -->
        <div v-if="hasBothGroups" class="grid grid-cols-2 gap-1 rounded-full bg-[hsl(var(--muted))] p-1" role="group" aria-label="Adult or child sizes">
          <button
            v-for="group in groupOptions"
            :key="group.id"
            type="button"
            class="rounded-full px-3 py-2 text-sm font-semibold transition-colors"
            :class="activeGroup === group.id ? 'bg-white text-[hsl(var(--primary))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'"
            :aria-pressed="activeGroup === group.id"
            @click="activeGroup = group.id"
          >
            {{ group.label }} · {{ formatPence(group.price) }}
          </button>
        </div>
        <p v-else class="text-xs text-[hsl(var(--muted-foreground))]">
          {{ onlyGroup === 'child' ? 'Child sizes' : 'Adult sizes' }} · {{ formatPence(onlyGroup === 'child' ? (product.childPrice ?? product.price) : product.price) }}
        </p>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="size in visibleSizes"
            :key="sizeKey(size)"
            type="button"
            class="min-w-[3rem] rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors"
            :class="selectedKey === sizeKey(size)
              ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white'
              : 'border-[hsl(var(--border))] bg-white text-[hsl(var(--primary))] hover:border-[hsl(var(--primary))]'"
            :aria-pressed="selectedKey === sizeKey(size)"
            :aria-label="`${size.label}${hasBothGroups ? (size.group === 'child' ? ', child' : ', adult') : ''}`"
            @click="selectSize(size)"
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
        <!-- After adding, the sheet stays open: a family often wants a second
             size of the same item, and closing it would mean finding it again. -->
        <div v-if="added" role="status" class="mb-3 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-3 py-2">
          <span class="text-sm font-semibold text-emerald-800">✓ Added {{ added }}</span>
          <NuxtLink to="/shop/basket" class="shrink-0 text-sm font-semibold text-emerald-900 underline">View basket</NuxtLink>
        </div>
        <button
          v-if="state !== 'open'"
          type="button"
          class="btn-primary w-full opacity-50"
          disabled
        >
          {{ windowLabel(product) }}
        </button>
        <div v-else class="flex gap-2">
          <button v-if="added" type="button" class="admin-btn-secondary rounded-full px-4" @click="emit('close')">Keep shopping</button>
          <button v-if="needsSize" type="button" class="btn-primary flex-1" @click="revealSizes">
            {{ added ? 'Add another size' : 'Choose a size' }}
          </button>
          <button v-else type="button" class="btn-primary flex-1" @click="addToBasket">
            Add to basket · {{ formatPence(unitPrice * quantity) }}
          </button>
        </div>
      </div>
    </template>
  </NiyamSheet>
</template>

<script setup lang="ts">
import { IconRuler } from '@tabler/icons-vue'
import type { ShopProduct, ShopSize, ShopSizeGroup } from '~/types'
import { formatPence, priceLabel, sizeKey, unitPriceFor, windowLabel, windowState } from '~/data/shop'

const props = defineProps<{ product: ShopProduct | null }>()
const emit = defineEmits<{ close: [] }>()

const basket = useShopBasket()
const { settings, load: loadSettings } = useShopSettings()
const imageIndex = ref(0)
const carousel = ref<HTMLElement | null>(null)
const sizesBlock = ref<HTMLElement | null>(null)
/** The chosen size, name *and* group: S can be both a child and an adult size. */
const selectedSize = ref<ShopSize | null>(null)
const activeGroup = ref<ShopSizeGroup>('adult')
const quantity = ref(1)
const added = ref('')
const flashSizes = ref(false)

const selectedKey = computed(() => selectedSize.value ? sizeKey(selectedSize.value) : '')
const hasBothGroups = computed(() => new Set(props.product?.sizes.map(size => size.group)).size > 1)
const onlyGroup = computed<ShopSizeGroup>(() => props.product?.sizes[0]?.group ?? 'adult')
const groupOptions = computed(() => {
  const product = props.product
  if (!product) return []
  return [
    { id: 'adult' as const, label: 'Adult', price: product.price },
    { id: 'child' as const, label: 'Child', price: product.childPrice ?? product.price }
  ]
})
const visibleSizes = computed(() => {
  const sizes = props.product?.sizes ?? []
  return hasBothGroups.value ? sizes.filter(size => size.group === activeGroup.value) : sizes
})

watch(() => props.product?.id, () => {
  imageIndex.value = 0
  carousel.value?.scrollTo({ left: 0 })
  quantity.value = 1
  added.value = ''
  flashSizes.value = false
  const sizes = props.product?.sizes ?? []
  // A product with a single size needs no choosing.
  selectedSize.value = sizes.length === 1 ? sizes[0] : null
  activeGroup.value = sizes.some(size => size.group === 'adult') ? 'adult' : 'child'
  if (props.product) void loadSettings()
})

// Switching Adult/Child clears a size from the other group.
watch(activeGroup, (group) => {
  if (hasBothGroups.value && selectedSize.value && selectedSize.value.group !== group) selectedSize.value = null
})

const state = computed(() => props.product ? windowState(props.product) : 'closed')
const needsSize = computed(() => !!props.product?.sizes.length && !selectedSize.value)
const unitPrice = computed(() => props.product
  ? unitPriceFor(props.product, selectedSize.value?.label ?? null, selectedSize.value?.group ?? null)
  : 0)

function selectSize(size: ShopSize) {
  selectedSize.value = size
  added.value = ''
}

function showImage(index: number) {
  imageIndex.value = index
  const el = carousel.value
  if (el) el.scrollTo({ left: el.clientWidth * index, behavior: 'smooth' })
}

function onCarouselScroll() {
  const el = carousel.value
  if (el && el.clientWidth) imageIndex.value = Math.round(el.scrollLeft / el.clientWidth)
}

/** "Choose a size" takes you to the sizes rather than doing nothing. */
function revealSizes() {
  sizesBlock.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  flashSizes.value = true
  setTimeout(() => { flashSizes.value = false }, 1200)
}

function addToBasket() {
  const product = props.product
  if (!product || state.value !== 'open' || needsSize.value) return
  const size = product.sizes.length ? selectedSize.value : null
  basket.add(product.id, size?.label ?? null, size?.group ?? null, quantity.value)
  const sizeText = size ? ` ${size.label}${hasBothGroups.value ? ` (${size.group})` : ''}` : ''
  added.value = `${quantity.value} ×${sizeText}`.trim()
  // Ready for another size: keep the group, clear the size and quantity.
  quantity.value = 1
  if (product.sizes.length > 1) selectedSize.value = null
}
</script>
