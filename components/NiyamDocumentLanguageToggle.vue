<template>
  <div
    v-if="languages.length > 1"
    class="inline-flex rounded-full border border-[hsl(var(--golden-200))] bg-[hsl(var(--golden-50))] p-0.5"
    role="group"
    aria-label="Document language"
  >
    <button
      v-for="lang in languages"
      :key="lang"
      type="button"
      class="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
      :class="modelValue === lang
        ? 'bg-[hsl(var(--primary))] text-white'
        : 'text-[hsl(var(--primary))] hover:bg-white/70'"
      :aria-pressed="modelValue === lang"
      @click="emit('update:modelValue', lang)"
    >
      {{ lang === 'gu' ? 'Gujarati' : 'English' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { NiyamDocumentLanguage } from '~/utils/niyamDocument'

defineProps<{
  modelValue: NiyamDocumentLanguage
  languages: NiyamDocumentLanguage[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: NiyamDocumentLanguage]
}>()
</script>
