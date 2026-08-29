<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4"
    >
      <div class="absolute inset-0 bg-[hsl(var(--primary))]/40" @click="safeClose" />

      <div
        ref="panel"
        class="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-[hsl(var(--golden-200))] bg-white shadow-[0_-16px_50px_-20px_rgba(56,32,97,0.4)] focus-visible:outline-none sm:max-h-[85vh] sm:max-w-md sm:rounded-3xl sm:transition-none"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        :style="sheetStyle"
      >
        <!-- Drag handle: tap or swipe down to close (mobile). -->
        <button
          type="button"
          class="flex w-full shrink-0 touch-none flex-col items-center pb-1 pt-3 sm:hidden"
          aria-label="Swipe down or tap to close"
          @pointerdown="onHandleDown"
          @click="onHandleClick"
        >
          <span class="h-1.5 w-12 rounded-full bg-[#D9AE30]" aria-hidden="true" />
        </button>

        <div class="relative shrink-0 border-b border-[hsl(var(--border))] bg-[hsl(var(--golden-50))] px-5 pb-4 pt-2 sm:pt-5">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 :id="titleId" class="font-display text-xl text-[hsl(var(--primary))]">{{ title }}</h2>
              <p v-if="subtitle" class="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">{{ subtitle }}</p>
            </div>
            <button
              type="button"
              class="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#D9AE30] hover:bg-white"
              aria-label="Close"
              @pointerdown.stop
              @click.stop="safeClose"
            >
              <IconX class="h-5 w-5" aria-hidden="true" />
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

const sheetOffset = ref(0)
const sheetStyle = computed(() => {
  if (!sheetOffset.value) return undefined
  return {
    transform: `translateY(${sheetOffset.value}px)`,
    transition: draggingHandle ? 'none' : 'transform 0.2s ease-out'
  }
})

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

/**
 * Bound to the document, not the panel: a control that unmounts under the
 * cursor — the Undo button when its 30 seconds run out — drops focus back to
 * the body, and a panel-bound handler would stop answering Escape from there.
 */
function onKeydown(event: KeyboardEvent) {
  if (!props.open) return
  if (event.key === 'Escape') {
    event.preventDefault()
    safeClose()
    return
  }
  if (event.key !== 'Tab') return
  const items = focusable()
  const active = document.activeElement as HTMLElement | null
  const inside = !!panel.value && !!active && panel.value.contains(active)
  if (!items.length) {
    event.preventDefault()
    panel.value?.focus()
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  if (!inside) {
    event.preventDefault()
    ;(event.shiftKey ? last : first).focus()
  } else if (event.shiftKey && (active === first || active === panel.value)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

/** Lets a sheet's contents pull focus back after a section of it is replaced. */
function focusPanel() {
  panel.value?.focus()
}

defineExpose({ focusPanel })

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

/**
 * Closing unmounts the sheet under the finger; the same tap then hits the
 * row underneath and can reopen it. A brief full-screen shield eats that tap.
 */
function safeClose() {
  emit('close')
  if (import.meta.server || typeof document === 'undefined') return
  const shield = document.createElement('div')
  shield.setAttribute('aria-hidden', 'true')
  shield.style.cssText = 'position:fixed;inset:0;z-index:10000;touch-action:none;'
  document.body.appendChild(shield)
  const remove = () => {
    shield.remove()
  }
  shield.addEventListener('pointerup', remove, { once: true })
  shield.addEventListener('click', remove, { once: true })
  window.setTimeout(remove, 400)
}

let handleStartY = 0
let draggingHandle = false
let swipedHandle = false

function onHandleClick() {
  if (swipedHandle) {
    swipedHandle = false
    return
  }
  safeClose()
}

function onHandleDown(event: PointerEvent) {
  if (event.button != null && event.button !== 0) return
  draggingHandle = true
  swipedHandle = false
  handleStartY = event.clientY
  sheetOffset.value = 0
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)

  function onMove(moveEvent: PointerEvent) {
    if (!draggingHandle) return
    moveEvent.preventDefault()
    const dy = Math.max(0, moveEvent.clientY - handleStartY)
    if (dy > 10) swipedHandle = true
    sheetOffset.value = dy
  }

  function onUp() {
    const shouldClose = sheetOffset.value > 56
    draggingHandle = false
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    if (shouldClose) {
      sheetOffset.value = 0
      safeClose()
    } else {
      sheetOffset.value = 0
    }
  }

  window.addEventListener('pointermove', onMove, { passive: false })
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    openerElement = (document.activeElement as HTMLElement | null) ?? null
    sheetOffset.value = 0
    lockScroll()
    document.addEventListener('keydown', onKeydown, true)
    await nextTick()
    panel.value?.focus()
  } else {
    document.removeEventListener('keydown', onKeydown, true)
    unlockScroll()
    openerElement?.focus?.()
    openerElement = null
  }
})

onBeforeUnmount(() => {
  if (!props.open) return
  document.removeEventListener('keydown', onKeydown, true)
  unlockScroll()
})
</script>
