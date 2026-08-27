<template>
  <!-- In-page replacement for window.confirm / window.prompt: labelled,
       focusable, dismissible with Escape, and it does not freeze the tab. -->
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @click.self="emit('cancel')"
    >
      <div
        ref="panel"
        class="admin-panel w-full max-w-md shadow-xl outline-none"
        tabindex="-1"
        @keydown.esc.prevent="emit('cancel')"
      >
        <h2 :id="titleId" class="font-display text-lg font-semibold text-[hsl(var(--primary))]">
          {{ title }}
        </h2>
        <p v-if="body" class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{{ body }}</p>

        <div v-if="withReason" class="mt-4">
          <label :for="reasonId" class="admin-label">{{ reasonLabel }}</label>
          <textarea
            :id="reasonId"
            ref="reasonField"
            v-model="reason"
            rows="3"
            :maxlength="240"
            class="admin-input"
            :placeholder="reasonPlaceholder"
          />
          <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            The devotee sees this on their entry. Leaving it blank is fine.
          </p>
        </div>

        <div class="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            :class="danger ? 'admin-btn-danger min-h-[44px] px-4' : 'admin-btn min-h-[44px] px-4'"
            @click="emit('confirm', reason)"
          >
            {{ confirmLabel }}
          </button>
          <button type="button" class="admin-btn-secondary min-h-[44px] px-4" @click="emit('cancel')">
            {{ cancelLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  withReason?: boolean
  reasonLabel?: string
  reasonPlaceholder?: string
}>(), {
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  reasonLabel: 'Reason (optional)'
})

const emit = defineEmits<{ confirm: [reason: string]; cancel: [] }>()

const titleId = useId()
const reasonId = useId()
const reason = ref('')
const panel = ref<HTMLElement | null>(null)
const reasonField = ref<HTMLTextAreaElement | null>(null)

watch(() => props.open, async (isOpen) => {
  if (!isOpen) return
  reason.value = ''
  await nextTick()
  ;(reasonField.value || panel.value)?.focus()
})
</script>
