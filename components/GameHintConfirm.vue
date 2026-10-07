<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @click.self="emit('cancel')"
    >
      <div
        class="w-full max-w-sm rounded-2xl border border-[hsl(var(--golden-200))] bg-[hsl(var(--card))] p-6 text-center shadow-xl outline-none"
        tabindex="-1"
        @keydown.esc.prevent="emit('cancel')"
      >
        <div class="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-800">
          <IconEye v-if="kind === 'letter'" class="h-5 w-5" aria-hidden="true" />
          <IconHelp v-else class="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 :id="titleId" class="font-display text-xl font-semibold text-[hsl(var(--primary))]">
          {{ kind === 'letter' ? 'Reveal a letter?' : 'Reveal this word?' }}
        </h2>
        <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          {{
            kind === 'letter'
              ? 'This will reveal one letter and add +5 seconds to your total time.'
              : 'This will fill the selected word and add +20 seconds to your total time.'
          }}
        </p>
        <div class="mt-5 flex gap-2">
          <button
            type="button"
            class="flex-1 rounded-xl bg-[hsl(var(--muted))] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))]"
            @click="emit('cancel')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex-1 rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-800"
            @click="emit('confirm')"
          >
            {{ kind === 'letter' ? 'Reveal (+5s)' : 'Reveal (+20s)' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { IconEye, IconHelp } from '@tabler/icons-vue'

defineProps<{
  open: boolean
  kind: 'letter' | 'word' | null
}>()

const emit = defineEmits<{ confirm: []; cancel: [] }>()
const titleId = useId()
</script>
