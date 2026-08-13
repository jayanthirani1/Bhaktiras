<template>
  <input
    ref="inputEl"
    class="crossword-capture-input w-full rounded-xl border-2 border-[hsl(var(--golden-200))] bg-white px-3 py-3 text-center text-base font-semibold uppercase tracking-[0.25em] text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20 disabled:opacity-50"
    type="text"
    inputmode="text"
    enterkeyhint="done"
    autocomplete="off"
    autocapitalize="characters"
    autocorrect="off"
    spellcheck="false"
    :disabled="disabled"
    :placeholder="placeholder"
    aria-label="Type letters for the crossword"
    @keydown="onKeydown"
    @input="onInput"
  >
</template>

<script setup lang="ts">
/**
 * Focusable text field so mobile soft keyboards work for crossword grids.
 * Letters are consumed immediately (field stays empty) and emitted to the parent.
 */
const props = withDefaults(defineProps<{
  disabled?: boolean
  placeholder?: string
}>(), {
  placeholder: 'Tap a square, then type here'
})

const emit = defineEmits<{
  letter: [letter: string]
  backspace: []
  arrow: [dir: 'left' | 'right' | 'up' | 'down']
}>()

const inputEl = ref<HTMLInputElement | null>(null)

function focus() {
  if (props.disabled) return
  const el = inputEl.value
  if (!el) return
  try {
    el.focus({ preventScroll: true })
  } catch {
    el.focus()
  }
}

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  const raw = el.value || ''
  el.value = ''
  const letters = raw.toUpperCase().replace(/[^A-Z]/g, '')
  for (const ch of letters) emit('letter', ch)
}

function onKeydown(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey || e.altKey) return
  if (e.key === 'Backspace') {
    e.preventDefault()
    emit('backspace')
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    emit('arrow', 'left')
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    emit('arrow', 'right')
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    emit('arrow', 'up')
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    emit('arrow', 'down')
  } else if (e.key === 'Enter') {
    e.preventDefault()
  } else if (/^[A-Za-z]$/.test(e.key)) {
    // Desktop: handle here; mobile usually uses @input instead.
    // Prevent duplicate if browser also inserts into the field (cleared in onInput).
    e.preventDefault()
    emit('letter', e.key.toUpperCase())
  }
}

defineExpose({ focus })
</script>
