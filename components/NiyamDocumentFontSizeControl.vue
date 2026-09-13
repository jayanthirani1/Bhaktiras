<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="inline-flex shrink-0 items-center gap-1 rounded-full border border-[hsl(var(--golden-200))] bg-[hsl(var(--golden-50))] px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--golden-100))]"
      :aria-expanded="open"
      aria-haspopup="dialog"
      aria-controls="doc-font-size-panel"
      aria-label="Text size"
      @click="toggle"
    >
      <IconTypography class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      SIZE
    </button>

    <div
      v-if="open"
      id="doc-font-size-panel"
      role="dialog"
      aria-label="Adjust text size"
      class="absolute right-0 top-full z-40 mt-2 w-56 rounded-2xl border border-[hsl(var(--border))] bg-white p-3 shadow-[0_18px_40px_-28px_rgba(61,0,102,0.55)]"
    >
      <div class="flex items-center gap-3">
        <span class="select-none font-semibold text-[hsl(var(--muted-foreground))]" style="font-size: 0.7rem" aria-hidden="true">
          A
        </span>
        <input
          ref="sliderEl"
          v-model.number="slider"
          type="range"
          class="doc-font-slider min-w-0 flex-1"
          :min="DOC_FONT_SLIDER_MIN"
          :max="DOC_FONT_SLIDER_MAX"
          step="1"
          aria-label="Text size"
          :aria-valuemin="DOC_FONT_SLIDER_MIN"
          :aria-valuemax="DOC_FONT_SLIDER_MAX"
          :aria-valuenow="slider"
          @pointerdown.stop
        >
        <span class="select-none font-semibold text-[hsl(var(--foreground))]" style="font-size: 1.15rem" aria-hidden="true">
          A
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconTypography } from '@tabler/icons-vue'
import {
  DOC_FONT_SLIDER_MAX,
  DOC_FONT_SLIDER_MIN,
  remFromSlider,
  sliderFromRem
} from '~/utils/niyamDocumentFont'

const model = defineModel<number>({ required: true })

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const sliderEl = ref<HTMLInputElement | null>(null)

const slider = computed({
  get: () => sliderFromRem(model.value),
  set: (value: number) => {
    model.value = remFromSlider(value)
  }
})

function toggle() {
  open.value = !open.value
}

function onPointerDown(event: PointerEvent) {
  if (!open.value || !root.value) return
  if (root.value.contains(event.target as Node)) return
  open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) open.value = false
}

watch(open, async (isOpen) => {
  if (!isOpen) return
  await nextTick()
  sliderEl.value?.focus()
})

onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.doc-font-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 0.35rem;
  border-radius: 999px;
  background: hsl(var(--muted));
  outline: none;
}

.doc-font-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  background: hsl(var(--primary));
  border: 2px solid white;
  box-shadow: 0 1px 4px rgb(61 0 102 / 0.25);
  cursor: pointer;
}

.doc-font-slider::-moz-range-thumb {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  background: hsl(var(--primary));
  border: 2px solid white;
  box-shadow: 0 1px 4px rgb(61 0 102 / 0.25);
  cursor: pointer;
}

.doc-font-slider:focus-visible {
  outline: 2px solid hsl(var(--golden-900));
  outline-offset: 3px;
}
</style>
