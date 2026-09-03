<template>
  <div class="game-letter-keyboard touch-manipulation select-none" :class="disabled ? 'opacity-50 pointer-events-none' : ''">
    <div class="flex justify-center gap-1.5">
      <button
        v-for="k in TOP"
        :key="k"
        type="button"
        class="game-letter-key"
        :class="{ 'game-letter-key--press': pressed === k }"
        @pointerdown="onPointer($event, k)"
        @click="onClick($event, k)"
      >
        {{ k }}
      </button>
    </div>
    <div class="mt-1.5 flex justify-center gap-1.5">
      <button
        v-for="k in MID"
        :key="k"
        type="button"
        class="game-letter-key"
        :class="{ 'game-letter-key--press': pressed === k }"
        @pointerdown="onPointer($event, k)"
        @click="onClick($event, k)"
      >
        {{ k }}
      </button>
    </div>
    <div class="mt-1.5 flex justify-center gap-1.5">
      <button
        v-if="showClear"
        type="button"
        class="game-letter-key game-letter-key--wide"
        :class="{ 'game-letter-key--press': pressed === 'CLEAR' }"
        aria-label="Clear"
        @pointerdown="onPointer($event, 'CLEAR')"
        @click="onClick($event, 'CLEAR')"
      >
        CLR
      </button>
      <button
        v-for="k in BOT"
        :key="k"
        type="button"
        class="game-letter-key"
        :class="{ 'game-letter-key--press': pressed === k }"
        @pointerdown="onPointer($event, k)"
        @click="onClick($event, k)"
      >
        {{ k }}
      </button>
      <button
        type="button"
        class="game-letter-key game-letter-key--wide"
        :class="{ 'game-letter-key--press': pressed === 'DEL' }"
        aria-label="Delete"
        @pointerdown="onPointer($event, 'DEL')"
        @click="onClick($event, 'DEL')"
      >
        DEL
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  disabled?: boolean
  /** Puts a Clear key on the bottom row (crossword board wipe, Wordle current row). */
  showClear?: boolean
}>(), {
  disabled: false,
  showClear: false
})
const emit = defineEmits<{ letter: [string]; delete: []; clear: [] }>()

const TOP = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']
const MID = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L']
const BOT = ['Z', 'X', 'C', 'V', 'B', 'N', 'M']

const tap = useKeyTapGuard()
const pressed = ref<string | null>(null)
let pressTimer: ReturnType<typeof setTimeout> | null = null
function flash(key: string) {
  pressed.value = key
  if (pressTimer) clearTimeout(pressTimer)
  pressTimer = setTimeout(() => { pressed.value = null }, 120)
}

function run(key: string) {
  if (props.disabled) return
  if (!tap.allow(key)) return
  flash(key)
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(key === 'DEL' || key === 'CLEAR' ? 14 : 8)
    }
  } catch {}
  if (key === 'DEL') emit('delete')
  else if (key === 'CLEAR') emit('clear')
  else emit('letter', key)
}

function onPointer(e: PointerEvent, key: string) {
  if (e.button !== 0 && e.button !== -1) return
  // Mouse is handled on click. Touch/pen must not also get the compatibility
  // mouse pointerdown that some browsers fire after the finger event.
  if (e.pointerType === 'mouse') return
  e.preventDefault()
  tap.markPointerHandled()
  run(key)
}

function onClick(e: MouseEvent, key: string) {
  if (tap.clickIsEcho()) {
    e.preventDefault()
    return
  }
  run(key)
}
</script>

<style scoped>
.game-letter-keyboard {
  border-radius: 1rem;
  background: hsl(var(--muted));
  padding: 0.65rem 0.4rem 0.75rem;
}
.game-letter-key {
  min-width: 1.7rem;
  height: 2.65rem;
  flex: 1 1 0;
  max-width: 2.2rem;
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
  border-radius: 0.45rem;
  border: 1px solid hsl(var(--border));
  background: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  color: hsl(var(--foreground));
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
  transition: transform 75ms ease, background-color 75ms ease;
}
.game-letter-key--wide {
  max-width: 3.4rem;
  flex: 1.4 1 0;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
}
.game-letter-key--press,
.game-letter-key:active {
  transform: scale(0.94);
  background: hsl(var(--golden-100));
}
@media (min-width: 400px) {
  .game-letter-key {
    min-width: 1.9rem;
    height: 2.85rem;
    max-width: 2.4rem;
    font-size: 0.9rem;
  }
  .game-letter-key--wide {
    max-width: 3.8rem;
  }
}
</style>
