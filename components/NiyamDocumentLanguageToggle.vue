<template>
  <button
    v-if="canToggle"
    type="button"
    class="inline-flex shrink-0 items-center gap-1 rounded-full border border-[hsl(var(--golden-200))] bg-[hsl(var(--golden-50))] px-2.5 py-1 text-[10px] font-bold text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--golden-100))]"
    :aria-label="ariaLabel"
    @click="toggle"
  >
    <IconLanguage class="h-3 w-3 shrink-0" aria-hidden="true" />
    <span :class="modelValue === 'gu' && 'tracking-[0.14em]'">{{ buttonLabel }}</span>
  </button>
</template>

<script setup lang="ts">
import { IconLanguage } from '@tabler/icons-vue'
import type { NiyamDocumentLanguage } from '~/utils/niyamDocument'

const props = defineProps<{
  modelValue: NiyamDocumentLanguage
  languages: NiyamDocumentLanguage[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: NiyamDocumentLanguage]
}>()

const canToggle = computed(() => props.languages.length > 1)

const nextLanguage = computed((): NiyamDocumentLanguage | null => {
  if (!canToggle.value) return null
  const other: NiyamDocumentLanguage = props.modelValue === 'en' ? 'gu' : 'en'
  return props.languages.includes(other) ? other : null
})

/** Show the language you can switch to — Gujarati script while reading English, ENGLISH while reading Gujarati. */
const buttonLabel = computed(() => (props.modelValue === 'en' ? 'ગુજરાતી' : 'ENGLISH'))

const ariaLabel = computed(() =>
  props.modelValue === 'en' ? 'Switch to Gujarati' : 'Switch to English'
)

function toggle() {
  if (nextLanguage.value) emit('update:modelValue', nextLanguage.value)
}
</script>
