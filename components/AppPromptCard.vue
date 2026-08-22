<template>
  <Teleport to="body">
    <div
      class="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[70] mx-auto max-w-md rounded-2xl border border-[hsl(var(--golden-200))] bg-white p-4 shadow-[0_22px_60px_-20px_rgba(56,32,97,0.45)] md:bottom-6"
      role="dialog"
      :aria-labelledby="`${id}-title`"
      :aria-describedby="`${id}-description`"
    >
      <div class="flex items-start gap-3">
        <div class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[hsl(var(--golden-100))] text-[hsl(var(--primary))]">
          <slot name="icon" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 :id="`${id}-title`" class="font-display text-base font-semibold text-[hsl(var(--primary))]">
            {{ title }}
          </h2>
          <p :id="`${id}-description`" class="mt-1 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
            {{ body }}
          </p>
          <slot name="detail" />
        </div>
        <button
          type="button"
          class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
          :aria-label="dismissLabel"
          @click="emit('close')"
        >
          <IconX class="h-4 w-4" />
        </button>
      </div>

      <div class="mt-4 flex gap-2">
        <slot name="actions" />
      </div>
      <p v-if="error" role="alert" class="mt-2 text-xs text-red-600">{{ error }}</p>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { IconX } from '@tabler/icons-vue'

/**
 * The shell every soft prompt shares — push, install and sign-in.
 *
 * They sit in the same corner and are answered the same way, so they are the
 * same card. Only one is ever mounted at a time; `useAppPrompts` decides which.
 */
withDefaults(defineProps<{
  id: string
  title: string
  body: string
  error?: string
  dismissLabel?: string
}>(), { error: '', dismissLabel: 'Not now' })

const emit = defineEmits<{ close: [] }>()
</script>
