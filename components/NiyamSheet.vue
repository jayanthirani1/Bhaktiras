<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4"
    >
      <div class="absolute inset-0 bg-[hsl(var(--primary))]/40" @click="emit('close')" />

      <div
        ref="panel"
        class="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-[hsl(var(--golden-200))] bg-white shadow-[0_-16px_50px_-20px_rgba(56,32,97,0.4)] sm:max-h-[85vh] sm:max-w-md sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        @keydown="onKeydown"
      >
        <div class="relative shrink-0 border-b border-[hsl(var(--border))] bg-[hsl(var(--golden-50))] px-5 pb-4 pt-5">
          <span
            class="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-[hsl(var(--golden-300))] sm:hidden"
            aria-hidden="true"
          />
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 :id="titleId" class="font-display text-xl text-[hsl(var(--primary))]">{{ title }}</h2>
              <p v-if="subtitle" class="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">{{ subtitle }}</p>
            </div>
            <button
              type="button"
              class="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[hsl(var(--muted-foreground))] hover:bg-white hover:text-[hsl(var(--primary))]"
              @click="emit('close')"
            >
              <IconX class="h-5 w-5" aria-hidden="true" />
              <span class="sr-only">Close</span>
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          <slot />
        </div>

        <div
          v-if="$slots.footer"
          class="shrink-0 border-t border-[hsl(var(--border))] bg-white px-5 pt-3"
          :style="{ paddingBottom: 'calc(0.875rem + env(safe-area-inset-bottom, 0px))' }"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { IconX } from '@tabler/icons-vue'

const props = defineProps<{
  open: boolean
  title: string
  subtitle?: string
}>()

const emit = defineEmits<{ close: [] }>()

const titleId = useId()
const panel = ref<HTMLElement | null>(null)
let openerElement: HTMLElement | null = null

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

function focusable(): HTMLElement[] {
  if (!panel.value) return []
  return Array.from(panel.value.querySelectorAll<HTMLElement>(FOCUSABLE))
    .filter(el => el.offsetParent !== null || el === panel.value)
}

/** Tab must not walk out of the sheet while the page behind it is inert to the eye. */
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }
  if (event.key !== 'Tab') return
  const items = focusable()
  if (!items.length) {
    event.preventDefault()
    panel.value?.focus()
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement as HTMLElement | null
  if (event.shiftKey && (active === first || active === panel.value)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

/**
 * Our own lock rather than the navigation drawer's: that one sets
 * `touch-action: none` on the body, which an ancestor rule would also apply to
 * the sheet's own scrolling region.
 */
let lockedScrollY = 0

function lockScroll() {
  if (import.meta.server) return
  lockedScrollY = window.scrollY
  const body = document.body
  body.style.position = 'fixed'
  body.style.top = `-${lockedScrollY}px`
  body.style.left = '0'
  body.style.right = '0'
  body.style.width = '100%'
}

function unlockScroll() {
  if (import.meta.server) return
  const body = document.body
  body.style.position = ''
  body.style.top = ''
  body.style.left = ''
  body.style.right = ''
  body.style.width = ''
  window.scrollTo(0, lockedScrollY)
}

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    openerElement = (document.activeElement as HTMLElement | null) ?? null
    lockScroll()
    await nextTick()
    panel.value?.focus()
  } else {
    unlockScroll()
    openerElement?.focus?.()
    openerElement = null
  }
})

onBeforeUnmount(() => {
  if (props.open) unlockScroll()
})
</script>
