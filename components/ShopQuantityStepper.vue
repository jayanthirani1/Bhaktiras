<template>
  <div class="inline-flex items-center rounded-full border border-[hsl(var(--border))] bg-white">
    <button
      type="button"
      class="flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold text-[hsl(var(--primary))] disabled:opacity-30"
      :disabled="modelValue <= min"
      :aria-label="modelValue <= 1 && min === 0 ? 'Remove' : 'One fewer'"
      @click="emit('update:modelValue', modelValue - 1)"
    >
      −
    </button>
    <span class="min-w-[2rem] text-center text-sm font-semibold tabular-nums" aria-live="polite">{{ modelValue }}</span>
    <button
      type="button"
      class="flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold text-[hsl(var(--primary))] disabled:opacity-30"
      :disabled="modelValue >= SHOP_MAX_QUANTITY"
      aria-label="One more"
      @click="emit('update:modelValue', modelValue + 1)"
    >
      +
    </button>
  </div>
</template>

<script setup lang="ts">
import { SHOP_MAX_QUANTITY } from '~/data/shop'

withDefaults(defineProps<{ modelValue: number; min?: number }>(), { min: 1 })
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
</script>
