<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-3 pb-24 pt-0 md:px-4 md:pt-12">
    <div class="mx-auto max-w-2xl">
      <div class="sticky top-0 z-40 -mx-3 mb-4 flex items-center gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 px-3 py-2 backdrop-blur md:top-16 md:-mx-4 md:px-4">
        <NuxtLink to="/play" class="rounded-full bg-[hsl(var(--muted))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--muted-foreground))]">
          ‹ Back
        </NuxtLink>
        <span class="rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-sm font-semibold tabular-nums text-[hsl(var(--primary))]">
          ⏱ {{ timer.display.value }}
        </span>
        <div v-if="!playedElsewhere && !loading && !finished && !howto.showIntro.value" class="ml-auto flex gap-2">
          <button
            type="button"
            class="rounded-full border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
            :disabled="!canHint"
            @click="requestHint"
          >
            Hint
          </button>
        </div>
      </div>

      <PageHeader title="Sopan" subtitle="Climb the word ladder. Every step changes just one letter." />

      <GamePlayedElsewhere
        v-if="playedElsewhere"
        title="Sopan"
        :summary="elsewhereSummary"
      />
      <div v-else-if="loading || !howto.ready.value" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading today's ladder…
      </div>
      <GameHowTo
        v-else-if="howto.showIntro.value"
        intro
        title="Climb the word ladder."
        @start="beginAfterHowTo"
      >
        <SopanRules />
      </GameHowTo>
      <div v-else class="space-y-4">
        <div class="rounded-2xl border border-[hsl(var(--golden-200))] bg-[hsl(var(--card))] p-4 text-center" aria-live="polite">
          <template v-if="clue">
            <p class="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--golden-900))]">{{ clue.label }}</p>
            <p class="mt-1 text-base font-semibold text-[hsl(var(--foreground))]">{{ clue.text }}</p>
          </template>
          <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">{{ statusText }}</p>
          <p v-if="clue && statusText" class="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{{ statusText }}</p>
        </div>

        <div ref="ladderEl" class="mx-auto w-full max-w-[22rem] select-none">
          <template v-for="(item, position) in displayItems" :key="item.key">
            <div
              v-if="position > 0"
              class="mx-auto h-3 w-1 rounded-full transition-colors"
              :class="linkedAt(position) ? 'bg-emerald-500' : 'bg-[hsl(var(--border))]'"
              aria-hidden="true"
            />
            <div
              :data-rung-row="typeof item.slot === 'number' ? '' : undefined"
              class="relative flex items-center gap-2 rounded-2xl border p-1.5 transition-shadow"
              :class="rowClass(item.slot)"
              :style="dragStyle(item.slot)"
              role="button"
              :tabindex="isSelectable(item.slot) ? 0 : -1"
              :aria-label="rowAria(item.slot)"
              @click="select(item.slot)"
            >
              <div class="flex flex-1 justify-center gap-1.5 pl-9">
                <span
                  v-for="n in 4"
                  :key="n"
                  class="flex h-11 w-11 items-center justify-center rounded-lg border text-xl font-bold uppercase transition-colors sm:h-12 sm:w-12"
                  :class="boxClass(item.slot, position, n - 1)"
                >{{ letterAt(item.slot, n - 1) }}</span>
              </div>
              <button
                v-if="typeof item.slot === 'number'"
                type="button"
                class="flex h-11 w-9 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] disabled:opacity-30"
                :class="canReorder ? 'cursor-grab touch-none active:cursor-grabbing' : ''"
                :disabled="!canReorder"
                :aria-label="`Move ${wordAt(item.slot) || 'this rung'} up or down`"
                @pointerdown="onHandleDown($event, item.slot)"
                @pointermove="onHandleMove"
                @pointerup="onHandleUp"
                @pointercancel="onHandleUp"
                @click.stop
                @keydown.up.prevent="moveRungBy(item.slot, -1)"
                @keydown.down.prevent="moveRungBy(item.slot, 1)"
              >
                <IconGripVertical class="h-5 w-5" aria-hidden="true" />
              </button>
              <span v-else class="flex h-11 w-9 items-center justify-center text-[hsl(var(--muted-foreground))]">
                <IconLock v-if="!ends" class="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
          </template>
        </div>

        <div v-if="!finished && keyboardOn" class="mx-auto max-w-md">
          <GameLetterKeyboard @letter="typeLetter" @delete="backspace" />
        </div>

        <div v-if="finished" class="card-surface space-y-3 p-6 text-center">
          <h2 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">
            {{ hintsUsed === 0 ? 'Sure-footed climb!' : 'Ladder climbed!' }}
          </h2>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">{{ resultSummary }}</p>
          <div class="flex flex-wrap justify-center gap-2">
            <button type="button" class="rounded-xl bg-[hsl(var(--primary))] px-4 py-2 text-sm font-semibold text-white" @click="shareResult">
              {{ shareCopied ? 'Copied!' : 'Share result' }}
            </button>
            <button
              v-if="isLoggedIn && !scoreSubmitted"
              type="button"
              class="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              :disabled="submitting"
              @click="submitToLeaderboard"
            >
              {{ submitting ? 'Submitting…' : 'Submit to leaderboard' }}
            </button>
            <NuxtLink v-else-if="!isLoggedIn" to="/login?redirect=/play/sopan" class="self-center text-sm font-semibold text-[hsl(var(--primary))] underline">
              Sign in to submit your result
            </NuxtLink>
          </div>
          <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>
        </div>

        <GameCrowns :ids="['sopan-fastest']" />

        <GameHowTo>
          <SopanRules />
        </GameHowTo>

        <GameLeaderboard
          :entries="entries"
          :loading="boardLoading"
          :date-id="dateId"
          :current-user-id="auth.user.value?.uid"
          game="sopan"
          :format-score="formatBoardScore"
        />
      </div>
    </div>

    <GameHintConfirm
      :open="!!pendingHint"
      :kind="pendingHint"
      :title="pendingHint === 'word' ? 'Place a rung?' : undefined"
      :message="pendingHint === 'word' ? 'This will move one rung into its place and add +10 seconds to your total time.' : undefined"
      :confirm-label="pendingHint === 'word' ? 'Place (+10s)' : undefined"
      @confirm="confirmHint"
      @cancel="pendingHint = null"
    />
  </div>
</template>

<script setup lang="ts">
import { IconGripVertical, IconLock } from '@tabler/icons-vue'
import { formatElapsed, formatElapsedForLeaderboard } from '~/composables/useGameTimer'
import {
  changedLetterIndex,
  isLadder,
  oneLetterApart,
  resolveSopanEnds,
  scrambledSopanOrder,
  SOPAN_WORD_LENGTH
} from '~/utils/sopan'

type EndKey = 'top' | 'bottom'
type Slot = EndKey | number

const SopanRules = defineComponent({
  render: () => h('ol', { class: 'list-decimal space-y-2 pl-5' }, [
    h('li', 'Tap a rung to see its clue. Every answer is a four-letter word.'),
    h('li', 'Drag the rungs by the grip so each word changes just one letter from the next.'),
    h('li', 'When the ladder holds, the top and bottom rungs unlock. They share one clue.'),
    h('li', 'Hints add time: a letter costs 5 seconds, placing a rung costs 10.')
  ])
})

const { puzzle, dateId: puzzleDateId, loading } = useSopanPuzzle()
const STORAGE_KEY = `sopan:${puzzleDateId}`
const TIMER_KEY = `sopan-timer:${puzzleDateId}`

const timer = useGameTimer(TIMER_KEY)
const howto = useHowToPlay('sopan', ['sopan:', 'sopan-timer:'])
const auth = useAuth()
const isLoggedIn = computed(() => !!auth.user.value)
const { playedElsewhere, result: elsewhereResult, markDone } = useDailyGameCompletion('sopan')
const { entries, loading: boardLoading, dateId, submitScore } = useGameLeaderboard('sopan', { sort: 'asc', rankBy: 'timeMs' })
const achievements = useAchievements()

const order = ref<number[]>([0, 1, 2, 3, 4])
const typed = ref<string[]>(['', '', '', '', ''])
const solved = ref<boolean[]>([false, false, false, false, false])
const endTyped = ref<Record<EndKey, string>>({ top: '', bottom: '' })
const endSolved = ref<Record<EndKey, boolean>>({ top: false, bottom: false })
/** Which word sits on top, fixed once the player's middle order links to both ends. */
const ends = ref<Record<EndKey, string> | null>(null)
const active = ref<Slot | null>(null)
const hinted = ref<string[]>([])
const hintsUsed = ref(0)
const wrongSlot = ref<Slot | null>(null)
const pendingHint = ref<'letter' | 'word' | null>(null)
const shareCopied = ref(false)
const scoreSubmitted = ref(false)
const submitting = ref(false)
const submitError = ref('')
const ladderEl = ref<HTMLElement | null>(null)

const allSolved = computed(() => solved.value.every(Boolean))
const finished = computed(() => endSolved.value.top && endSolved.value.bottom)
const middleWords = computed(() => order.value.map(i => puzzle.value.rungs[i]?.word || ''))
const phase = computed(() => finished.value ? 'done' : ends.value ? 'ends' : allSolved.value ? 'order' : 'solve')
const canReorder = computed(() => phase.value === 'solve' || phase.value === 'order')
const keyboardOn = computed(() => phase.value === 'solve' || phase.value === 'ends')

const displayItems = computed(() => [
  { key: 'top', slot: 'top' as Slot },
  ...order.value.map(i => ({ key: `rung-${i}`, slot: i as Slot })),
  { key: 'bottom', slot: 'bottom' as Slot }
])

const statusText = computed(() => {
  if (phase.value === 'order') {
    return isLadder(middleWords.value)
      ? 'Every step works, but the top and bottom will not fit that order. Try another.'
      : 'All five solved. Drag the rungs so each word changes just one letter from the next.'
  }
  if (phase.value === 'ends') return 'The ladder holds. Solve the top and bottom rungs.'
  if (phase.value === 'solve') return 'Tap a rung to see its clue. Drag by the grip to reorder at any time.'
  return ''
})

const clue = computed(() => {
  const slot = active.value
  if (typeof slot === 'number') return { label: 'Clue', text: puzzle.value.rungs[slot]?.clue || '' }
  if (slot && ends.value) return { label: 'Top & bottom', text: puzzle.value.endsClue }
  return null
})

const resultSummary = computed(() => [
  timer.display.value,
  hintsUsed.value === 0 ? 'no hints' : `${hintsUsed.value} hint${hintsUsed.value === 1 ? '' : 's'}`
].join(' · '))

const elsewhereSummary = computed(() => {
  const result = elsewhereResult.value
  return [result?.timeMs != null ? formatElapsed(result.timeMs) : '', result?.detail || ''].filter(Boolean).join(' · ')
})

function slotKey(slot: Slot) {
  return String(slot)
}

function wordAt(slot: Slot): string | null {
  if (typeof slot === 'number') return solved.value[slot] ? puzzle.value.rungs[slot]?.word ?? null : null
  return endSolved.value[slot] && ends.value ? ends.value[slot] : null
}

function answerFor(slot: Slot): string {
  if (typeof slot === 'number') return puzzle.value.rungs[slot]?.word || ''
  return ends.value?.[slot] || ''
}

function typedAt(slot: Slot): string {
  return typeof slot === 'number' ? typed.value[slot] || '' : endTyped.value[slot]
}

function setTyped(slot: Slot, value: string) {
  if (typeof slot === 'number') typed.value = typed.value.map((entry, i) => (i === slot ? value : entry))
  else endTyped.value = { ...endTyped.value, [slot]: value }
}

function isEditable(slot: Slot) {
  if (finished.value) return false
  if (typeof slot === 'number') return !solved.value[slot]
  return !!ends.value && !endSolved.value[slot]
}

function isSelectable(slot: Slot) {
  return typeof slot === 'number' || !!ends.value
}

function letterAt(slot: Slot, index: number) {
  return (wordAt(slot) ?? typedAt(slot))[index] || ''
}

function linkedAt(position: number) {
  const above = wordAt(displayItems.value[position - 1].slot)
  const below = wordAt(displayItems.value[position].slot)
  return !!above && !!below && oneLetterApart(above, below)
}

function rowClass(slot: Slot) {
  const isActive = active.value === slot && !finished.value
  const dragging = drag.value?.slot === slot
  return [
    !isSelectable(slot) ? 'border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]' : 'bg-white',
    isActive ? 'border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary))]/25' : isSelectable(slot) ? 'border-[hsl(var(--border))]' : '',
    wrongSlot.value === slot ? 'sopan-shake border-red-400' : '',
    dragging ? 'z-10 shadow-lg' : ''
  ].join(' ')
}

function boxClass(slot: Slot, position: number, index: number) {
  const word = wordAt(slot)
  if (word) {
    const above = position > 0 ? wordAt(displayItems.value[position - 1].slot) : null
    const changed = above && oneLetterApart(above, word) && changedLetterIndex(above, word) === index
    return changed
      ? 'border-amber-500 bg-amber-400 text-amber-950'
      : 'border-emerald-600 bg-emerald-500 text-white'
  }
  if (wrongSlot.value === slot || typedAt(slot).length === SOPAN_WORD_LENGTH) return 'border-red-400 bg-red-50 text-red-700'
  if (typedAt(slot)[index]) return 'border-[hsl(var(--primary))] bg-white text-[hsl(var(--primary))]'
  return 'border-[hsl(var(--border))] bg-[hsl(var(--background))]'
}

function rowAria(slot: Slot) {
  const word = wordAt(slot)
  if (typeof slot === 'number') return word ? `Solved rung ${word}` : `Rung: ${puzzle.value.rungs[slot]?.clue || ''}`
  const label = slot === 'top' ? 'Top rung' : 'Bottom rung'
  if (!ends.value) return `${label}, locked`
  return word ? `${label} ${word}` : label
}

function nextEditable(after: Slot | null = null): Slot | null {
  const slots = displayItems.value.map(item => item.slot)
  const start = after == null ? -1 : slots.indexOf(after)
  for (let step = 1; step <= slots.length; step++) {
    const slot = slots[(start + step + slots.length) % slots.length]
    if (isEditable(slot)) return slot
  }
  return null
}

function select(slot: Slot) {
  if (!isSelectable(slot) || finished.value) return
  active.value = slot
}

function flashWrong(slot: Slot) {
  wrongSlot.value = slot
  setTimeout(() => {
    if (wrongSlot.value === slot) wrongSlot.value = null
  }, 650)
}

function markSolved(slot: Slot) {
  if (typeof slot === 'number') solved.value = solved.value.map((value, i) => value || i === slot)
  else endSolved.value = { ...endSolved.value, [slot]: true }

  if (finished.value) {
    active.value = null
    finishGame()
    return
  }
  if (typeof slot === 'number' && allSolved.value) checkLadder()
  if (!ends.value || typeof slot !== 'number') active.value = nextEditable(slot)
}

function checkSlot(slot: Slot) {
  const entry = typedAt(slot)
  if (entry.length < SOPAN_WORD_LENGTH) return
  if (entry === answerFor(slot)) markSolved(slot)
  else flashWrong(slot)
}

function typeLetter(letter: string) {
  if (finished.value || loading.value) return
  let slot = active.value
  if (slot == null || !isEditable(slot)) {
    slot = nextEditable(slot)
    active.value = slot
  }
  if (slot == null) return
  const entry = typedAt(slot)
  if (entry.length >= SOPAN_WORD_LENGTH) return
  timer.ensureStarted()
  setTyped(slot, entry + letter.toUpperCase())
  checkSlot(slot)
  saveState()
}

function backspace() {
  const slot = active.value
  if (slot == null || !isEditable(slot)) return
  setTyped(slot, typedAt(slot).slice(0, -1))
  wrongSlot.value = null
  saveState()
}

function moveActive(delta: number) {
  const slots = displayItems.value.map(item => item.slot).filter(isSelectable)
  if (!slots.length) return
  const current = active.value == null ? -1 : slots.indexOf(active.value)
  const next = Math.min(slots.length - 1, Math.max(0, current + delta))
  active.value = slots[next]
}

function checkLadder() {
  if (!allSolved.value || ends.value) return
  const resolved = resolveSopanEnds(puzzle.value, middleWords.value)
  if (!resolved) return
  ends.value = resolved
  active.value = nextEditable(null)
  saveState()
}

function moveRungTo(rung: number, to: number) {
  const from = order.value.indexOf(rung)
  if (from === -1 || from === to) return
  const next = [...order.value]
  next.splice(from, 1)
  next.splice(to, 0, rung)
  order.value = next
}

function moveRungBy(rung: number, delta: number) {
  if (!canReorder.value) return
  const from = order.value.indexOf(rung)
  const to = Math.min(order.value.length - 1, Math.max(0, from + delta))
  timer.ensureStarted()
  moveRungTo(rung, to)
  afterReorder()
}

function afterReorder() {
  saveState()
  checkLadder()
}

const drag = ref<{ slot: number, pointerId: number, startY: number, offset: number, step: number } | null>(null)

function dragStyle(slot: Slot) {
  if (drag.value?.slot !== slot) return undefined
  return { transform: `translateY(${drag.value.offset}px)` }
}

function onHandleDown(event: PointerEvent, rung: number) {
  if (!canReorder.value || (event.button !== 0 && event.pointerType === 'mouse')) return
  event.preventDefault()
  const rows = ladderEl.value?.querySelectorAll<HTMLElement>('[data-rung-row]')
  const step = rows && rows.length > 1
    ? rows[1].getBoundingClientRect().top - rows[0].getBoundingClientRect().top
    : 64
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  drag.value = { slot: rung, pointerId: event.pointerId, startY: event.clientY, offset: 0, step: step || 64 }
  timer.ensureStarted()
}

function onHandleMove(event: PointerEvent) {
  const current = drag.value
  if (!current || event.pointerId !== current.pointerId) return
  const from = order.value.indexOf(current.slot)
  const shift = Math.round((event.clientY - current.startY) / current.step)
  const to = Math.min(order.value.length - 1, Math.max(0, from + shift))
  if (to !== from) {
    moveRungTo(current.slot, to)
    current.startY += (to - from) * current.step
  }
  current.offset = Math.max(-current.step, Math.min(current.step, event.clientY - current.startY))
}

function onHandleUp(event: PointerEvent) {
  if (!drag.value || event.pointerId !== drag.value.pointerId) return
  drag.value = null
  afterReorder()
}

const canHint = computed(() => {
  if (finished.value || loading.value) return false
  if (phase.value === 'order') return true
  return nextEditable(null) != null
})

function requestHint() {
  if (!canHint.value) return
  pendingHint.value = phase.value === 'order' ? 'word' : 'letter'
}

function confirmHint() {
  const kind = pendingHint.value
  pendingHint.value = null
  if (kind === 'word') placeRungHint()
  else if (kind === 'letter') revealLetterHint()
}

function revealLetterHint() {
  const slot = active.value != null && isEditable(active.value) ? active.value : nextEditable(active.value)
  if (slot == null) return
  const answer = answerFor(slot)
  const entry = typedAt(slot)
  let index = 0
  while (index < answer.length && entry[index] === answer[index]) index++
  if (index >= answer.length) return
  timer.ensureStarted()
  timer.addPenalty(5_000)
  hintsUsed.value += 1
  if (!hinted.value.includes(slotKey(slot))) hinted.value = [...hinted.value, slotKey(slot)]
  active.value = slot
  setTyped(slot, answer.slice(0, index + 1))
  wrongSlot.value = null
  checkSlot(slot)
  saveState()
}

function placeRungHint() {
  const forward = puzzle.value.rungs.map((_, i) => i)
  const reverse = [...forward].reverse()
  const matches = (target: number[]) => target.filter((rung, i) => order.value[i] === rung).length
  const target = matches(reverse) > matches(forward) ? reverse : forward
  const position = target.findIndex((rung, i) => order.value[i] !== rung)
  if (position === -1) return
  timer.ensureStarted()
  timer.addPenalty(10_000)
  hintsUsed.value += 1
  moveRungTo(target[position], position)
  afterReorder()
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      puzzleId: puzzle.value.id,
      order: order.value,
      typed: typed.value,
      solved: solved.value,
      endTyped: endTyped.value,
      endSolved: endSolved.value,
      ends: ends.value,
      hinted: hinted.value,
      hintsUsed: hintsUsed.value,
      finished: finished.value,
      scoreSubmitted: scoreSubmitted.value
    }))
  } catch {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    const count = puzzle.value.rungs.length
    if (data.puzzleId !== puzzle.value.id || !Array.isArray(data.order) || data.order.length !== count) return false
    order.value = data.order.map(Number)
    typed.value = Array.from({ length: count }, (_, i) => String(data.typed?.[i] || ''))
    solved.value = Array.from({ length: count }, (_, i) => !!data.solved?.[i])
    endTyped.value = { top: String(data.endTyped?.top || ''), bottom: String(data.endTyped?.bottom || '') }
    endSolved.value = { top: !!data.endSolved?.top, bottom: !!data.endSolved?.bottom }
    ends.value = data.ends?.top && data.ends?.bottom ? { top: String(data.ends.top), bottom: String(data.ends.bottom) } : null
    hinted.value = Array.isArray(data.hinted) ? data.hinted.map(String) : []
    hintsUsed.value = Number(data.hintsUsed) || 0
    scoreSubmitted.value = !!data.scoreSubmitted
    return true
  } catch {
    return false
  }
}

function resetBoard() {
  const count = puzzle.value.rungs.length
  order.value = scrambledSopanOrder(puzzle.value.rungs, `${puzzleDateId}:${puzzle.value.id}`)
  typed.value = Array.from({ length: count }, () => '')
  solved.value = Array.from({ length: count }, () => false)
  endTyped.value = { top: '', bottom: '' }
  endSolved.value = { top: false, bottom: false }
  ends.value = null
  hinted.value = []
  hintsUsed.value = 0
  scoreSubmitted.value = false
}

function finishGame() {
  timer.stop()
  saveState()
  void markDone({
    timeMs: timer.elapsedMs.value,
    detail: hintsUsed.value === 0 ? 'no hints' : `${hintsUsed.value} hint${hintsUsed.value === 1 ? '' : 's'}`
  })
}

function shareResult() {
  const ladder = displayItems.value
    .map(item => (hinted.value.includes(slotKey(item.slot)) ? '🟨' : '🟩').repeat(SOPAN_WORD_LENGTH))
    .join('\n')
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/play/sopan` : ''
  const text = [
    'Bhaktiras Sopan 🪜',
    resultSummary.value,
    '',
    ladder,
    '',
    shareUrl
  ].join('\n').trimEnd()
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      shareCopied.value = true
      setTimeout(() => { shareCopied.value = false }, 2000)
    })
  }
}

function formatBoardScore(entry: { score?: number, timeMs?: number, detail?: string }) {
  const ms = entry.timeMs ?? entry.score
  if (ms == null) return entry.detail || '—'
  const peers = entries.value
    .map(e => e.timeMs ?? e.score)
    .filter((value): value is number => value != null)
  const time = formatElapsedForLeaderboard(ms, peers)
  return entry.detail ? `${time} · ${entry.detail}` : time
}

async function submitToLeaderboard() {
  if (!auth.user.value || scoreSubmitted.value || submitting.value || !finished.value) return
  submitting.value = true
  submitError.value = ''
  const userName = auth.user.value.displayName || auth.user.value.email?.split('@')[0] || 'Player'
  const detail = hintsUsed.value === 0 ? 'no hints' : `${hintsUsed.value} hint${hintsUsed.value === 1 ? '' : 's'}`
  try {
    await submitScore({
      score: timer.elapsedMs.value,
      timeMs: timer.elapsedMs.value,
      detail,
      userId: auth.user.value.uid,
      userName,
      userEmail: auth.user.value.email || undefined
    })
    scoreSubmitted.value = true
    saveState()
    try {
      await achievements.processResult('sopan', {
        userName,
        timeMs: timer.elapsedMs.value,
        hintsUsed: hintsUsed.value
      })
    } catch {}
  } catch (error) {
    submitError.value = (error as Error).message
  } finally {
    submitting.value = false
  }
}

watch([finished, () => auth.user.value?.uid], ([done, uid]) => {
  if (done && uid && !scoreSubmitted.value && !submitting.value) void submitToLeaderboard()
}, { immediate: true })

function beginAfterHowTo() {
  howto.markSeen()
  syncPlayTimer()
}

function syncPlayTimer() {
  if (!howto.ready.value || howto.showIntro.value) return
  if (loading.value || playedElsewhere.value) return
  if (finished.value) {
    timer.read()
    if (timer.startedAt.value && !timer.finishedAt.value) timer.stop()
    return
  }
  timer.loadOrStart()
}

watch([loading, () => puzzle.value.id], () => {
  if (loading.value) return
  if (!loadState()) resetBoard()
  active.value = nextEditable(null)
  syncPlayTimer()
}, { immediate: true })

watch([playedElsewhere, () => howto.ready.value, () => howto.showIntro.value], () => { syncPlayTimer() })

onMounted(() => {
  const onKey = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    const tag = (event.target as HTMLElement | null)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if (pendingHint.value || finished.value || loading.value || howto.showIntro.value || playedElsewhere.value) return
    if (event.key === 'Backspace') {
      event.preventDefault()
      backspace()
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      if ((event.target as HTMLElement | null)?.closest('[data-rung-row] button')) return
      event.preventDefault()
      moveActive(event.key === 'ArrowDown' ? 1 : -1)
    } else if (/^[A-Za-z]$/.test(event.key) && !event.repeat) {
      event.preventDefault()
      typeLetter(event.key)
    }
  }
  window.addEventListener('keydown', onKey)
  onUnmounted(() => window.removeEventListener('keydown', onKey))
})

useHead({ title: 'Sopan · Bhaktiras' })
</script>

<style scoped>
.sopan-shake {
  animation: sopan-shake 0.45s ease-in-out;
}
@keyframes sopan-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
@media (prefers-reduced-motion: reduce) {
  .sopan-shake { animation: none; }
}
</style>
