<template>
  <NiyamSheet
    ref="sheet"
    :open="open"
    :title="challenge?.title || ''"
    :subtitle="sheetSubtitle"
    @close="emit('close')"
  >
    <template v-if="challenge">
      <!-- Confirmation. Replaces a confirm dialog: the write already happened,
           and a 30-second undo catches the mis-tap without doubling the taps
           for everybody who got it right. -->
      <div v-if="phase !== 'input'" role="status" class="text-center">
        <span
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          :class="phase === 'undone' ? 'bg-[hsl(var(--muted))]' : 'bg-[hsl(var(--golden-100))]'"
        >
          <IconArrowBackUp v-if="phase === 'undone'" class="h-7 w-7 text-[hsl(var(--muted-foreground))]" aria-hidden="true" />
          <IconCheck v-else class="h-7 w-7 text-[hsl(var(--primary))]" aria-hidden="true" />
        </span>

        <template v-if="phase === 'undone'">
          <p class="mt-4 font-display text-xl text-[hsl(var(--primary))]">Entry removed</p>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Nothing was added to the sangat's total.</p>
        </template>

        <template v-else>
          <p class="mt-4 font-display text-xl text-[hsl(var(--primary))]">Thank you</p>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {{ formatCount(committed) }} {{ unitLabel(challenge, committed) }}
            {{ result?.status === 'pending' ? 'recorded.' : 'added.' }}
          </p>

          <div v-if="result?.status === 'approved'" class="mt-5 space-y-4">
            <div v-if="isLoggedIn" class="rounded-xl bg-[hsl(var(--muted))]/60 px-4 py-3">
              <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--golden-900))]">
                Yours
              </p>
              <p class="mt-1 font-display text-3xl text-[hsl(var(--primary))]">
                {{ formatCount(myPersonal) }}
              </p>
              <p class="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                {{ unitLabel(challenge, myPersonal) }} counted
              </p>
            </div>
            <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--golden-900))]">
              Together so far
            </p>
            <p class="mt-1 font-display text-4xl text-[hsl(var(--primary))]">
              <NiyamCountUp :from="totalBefore" :to="stats.approvedTotal" />
            </p>
            <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              of {{ formatTarget(challenge.target) }} {{ unitLabel(challenge, challenge.target) }}
            </p>
            </div>
          </div>

          <p
            v-else
            class="mt-5 flex items-start gap-2 rounded-xl bg-[hsl(var(--muted))] px-3 py-2.5 text-left text-sm text-[hsl(var(--foreground))]"
          >
            <IconClockPause class="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--golden-900))]" aria-hidden="true" />
            <span>{{ reviewReason(challenge) }}</span>
          </p>
        </template>
      </div>

      <!-- Sign in -->
      <div v-else-if="!isLoggedIn" class="text-center">
        <p class="text-sm text-[hsl(var(--muted-foreground))]">{{ copy('signedOutNote') }}</p>
      </div>

      <!-- Not published: the security rules would refuse the write, so never offer it. -->
      <div v-else-if="!published" class="flex items-start gap-2 rounded-xl bg-[hsl(var(--muted))] px-3 py-3 text-sm">
        <IconLock class="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" aria-hidden="true" />
        <span>{{ copy('notPublishedNote') }}</span>
      </div>

      <!-- Attendance: one tap is one sabha. A number field would be silly here. -->
      <div v-else-if="isCheckin" class="text-center">
        <p class="text-sm text-[hsl(var(--muted-foreground))]">{{ challenge.hint || challenge.detail }}</p>

        <NiyamResourceLink :challenge="challenge" class="mt-4 text-left" />

        <div v-if="isLoggedIn" class="mt-4 rounded-xl bg-[hsl(var(--muted))]/60 px-4 py-3">
          <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--golden-900))]">
            Yours
          </p>
          <p class="mt-1 font-display text-2xl text-[hsl(var(--primary))]">
            {{ formatCount(myPersonal) }}
          </p>
          <p class="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
            {{ unitLabel(challenge, myPersonal) }} counted
            <span v-if="myPending > 0">
              · {{ formatCount(myPending) }} awaiting review
            </span>
          </p>
        </div>

        <p
          v-if="atMandir"
          class="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--golden-50))] px-3 py-1.5 text-xs font-semibold text-[hsl(var(--golden-900))]"
        >
          <IconMapPin class="h-3.5 w-3.5" aria-hidden="true" />
          You're at the Mandir
        </p>

        <div
          v-if="geolocationSupported"
          class="mt-5 rounded-xl border border-[hsl(var(--border))] px-4 py-4 text-left"
        >
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-[hsl(var(--foreground))]">Auto check-in</p>
              <p class="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                Record a sabha automatically when you arrive at the Mandir
              </p>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="autoCheckInEnabled"
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2"
              :class="autoCheckInEnabled ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))]'"
              @click="toggleAutoCheckIn"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="autoCheckInEnabled ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </div>
          <p
            v-if="permissionDenied"
            class="mt-3 text-xs text-amber-700"
          >
            Location access was denied. Enable it in your browser settings to use auto check-in.
          </p>
        </div>

        <p
          v-if="dailyCheckinComplete"
          class="mt-5 flex items-start gap-2 rounded-xl bg-[hsl(var(--golden-50))] px-3 py-2.5 text-left text-sm text-[hsl(var(--golden-900))]"
        >
          <IconCheck class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>You have logged both sabhas for today. You can check in again tomorrow.</span>
        </p>
        <p
          v-else-if="checkinCooldown.blocked"
          class="mt-5 flex items-start gap-2 rounded-xl bg-[hsl(var(--muted))] px-3 py-2.5 text-left text-sm"
        >
          <IconInfoCircle class="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--golden-900))]" aria-hidden="true" />
          <span>{{ mandirCheckinBlockedMessage(checkinCooldown) }}</span>
        </p>
        <p v-else-if="showSabhaPicker" class="mt-5 text-sm text-[hsl(var(--muted-foreground))]">
          Which sabha did you attend today?
        </p>
        <p v-else class="mt-5 text-sm text-[hsl(var(--muted-foreground))]">
          One morning and one evening sabha each day — Aarti, Chesta or Katha in person.
          <span v-if="atMandir"> Tap below to check in for this sabha.</span>
          <span v-else> Tap below to log which sabha you attended.</span>
        </p>

        <div
          v-if="showSabhaPicker"
          class="mt-4 space-y-2"
          role="group"
          aria-label="Which sabha did you attend?"
        >
          <button
            type="button"
            class="w-full rounded-xl border border-[hsl(var(--golden-200))] bg-white px-4 py-3.5 text-left text-sm font-semibold text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--golden-50))] disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="sabhaLogged.morning || submitting"
            @click="commitSabha('morning')"
          >
            Morning sabha
            <span v-if="sabhaLogged.morning" class="ml-1 font-normal text-[hsl(var(--muted-foreground))]">(already logged)</span>
          </button>
          <button
            type="button"
            class="w-full rounded-xl border border-[hsl(var(--golden-200))] bg-white px-4 py-3.5 text-left text-sm font-semibold text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--golden-50))] disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="sabhaLogged.evening || submitting"
            @click="commitSabha('evening')"
          >
            Evening sabha
            <span v-if="sabhaLogged.evening" class="ml-1 font-normal text-[hsl(var(--muted-foreground))]">(already logged)</span>
          </button>
          <button
            type="button"
            class="w-full rounded-xl border border-[hsl(var(--golden-200))] bg-[hsl(var(--golden-50))] px-4 py-3.5 text-left text-sm font-semibold text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--golden-100))] disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="sabhaLogged.morning || sabhaLogged.evening || submitting"
            @click="commitSabha('both')"
          >
            Both sabhas
            <span class="block text-xs font-normal text-[hsl(var(--muted-foreground))]">Adds 2 to today's count</span>
          </button>
          <button
            type="button"
            class="w-full rounded-xl px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            @click="showSabhaPicker = false"
          >
            Back
          </button>
        </div>
      </div>
      <div v-else>
        <p class="text-center text-sm text-[hsl(var(--muted-foreground))]">
          {{ challenge.hint || challenge.detail }}
        </p>

        <!-- Where the words are, before the counter: somebody opening this to
             recite needs the text more than they need the plus button. -->
        <NiyamResourceLink :challenge="challenge" class="mt-4" />

        <div v-if="isLoggedIn" class="mt-4 rounded-xl bg-[hsl(var(--muted))]/60 px-4 py-3 text-center">
          <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--golden-900))]">
            Yours
          </p>
          <p class="mt-1 font-display text-2xl text-[hsl(var(--primary))]">
            {{ formatCount(myPersonal) }}
          </p>
          <p class="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
            {{ unitLabel(challenge, myPersonal) }} counted
            <span v-if="myPending > 0">
              · {{ formatCount(myPending) }} awaiting review
            </span>
          </p>
        </div>

        <div class="mt-5 flex items-center justify-center gap-4">
          <button
            type="button"
            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--golden-200))] bg-white text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--golden-50))] disabled:opacity-40"
            :disabled="value <= 0"
            @pointerdown="startRepeat(-1)"
            @pointerup="stopRepeat"
            @pointerleave="stopRepeat"
            @pointercancel="stopRepeat"
          >
            <IconMinus class="h-6 w-6" aria-hidden="true" />
            <span class="sr-only">One fewer</span>
          </button>

          <p class="min-w-[5rem] text-center font-display text-5xl leading-none text-[hsl(var(--primary))]" aria-live="polite">
            {{ formatCount(value) }}
          </p>

          <button
            type="button"
            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--golden-200))] bg-white text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--golden-50))] disabled:opacity-40"
            :disabled="value >= challenge.maxPerSubmission"
            @pointerdown="startRepeat(1)"
            @pointerup="stopRepeat"
            @pointerleave="stopRepeat"
            @pointercancel="stopRepeat"
          >
            <IconPlus class="h-6 w-6" aria-hidden="true" />
            <span class="sr-only">One more</span>
          </button>
        </div>
        <p class="mt-2 text-center text-xs text-[hsl(var(--muted-foreground))]">
          {{ unitLabel(challenge, value) }} to add
        </p>

        <div v-if="presets.length" class="mt-5 grid grid-cols-4 gap-2">
          <button
            v-for="preset in presets"
            :key="preset"
            type="button"
            class="h-14 rounded-2xl border border-[hsl(var(--golden-200))] bg-[hsl(var(--golden-50))] text-base font-semibold text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--golden-100))]"
            @click="tapPreset(preset)"
          >
            +{{ preset }}
          </button>
        </div>

        <div class="mt-4 space-y-2">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-2 rounded-xl px-1 py-2 text-left text-sm font-semibold text-[hsl(var(--primary))]"
            :aria-expanded="showNumber"
            @click="toggleNumber"
          >
            <span>Enter a number</span>
            <IconChevronDown class="h-4 w-4 transition-transform" :class="showNumber && 'rotate-180'" aria-hidden="true" />
          </button>
          <!-- inputmode, not type=number: spinner arrows and the scroll wheel
               silently change a committed count on desktop. -->
          <input
            v-if="showNumber"
            :id="numberId"
            ref="numberInput"
            :value="numberText"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            autocomplete="off"
            class="admin-input text-lg"
            :aria-label="`How many ${challenge.unit}`"
            @input="onNumberInput"
          >

          <button
            type="button"
            class="flex w-full items-center justify-between gap-2 rounded-xl px-1 py-2 text-left text-sm font-semibold text-[hsl(var(--primary))]"
            :aria-expanded="showNote"
            @click="showNote = !showNote"
          >
            <span>Add a note</span>
            <IconChevronDown class="h-4 w-4 transition-transform" :class="showNote && 'rotate-180'" aria-hidden="true" />
          </button>
          <input
            v-if="showNote"
            v-model="note"
            type="text"
            :maxlength="SUBMISSION_NOTE_MAX"
            class="admin-input"
            aria-label="Note (optional)"
            placeholder="e.g. over the weekend at home"
          >
        </div>

        <p
          v-if="submitCooldown.blocked"
          class="mt-4 flex items-start gap-2 rounded-xl bg-[hsl(var(--muted))] px-3 py-2.5 text-sm"
        >
          <IconInfoCircle class="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--golden-900))]" aria-hidden="true" />
          <span>{{ niyamDoubleTapMessage(submitCooldown.remainingMs) }}</span>
        </p>
        <p
          v-else-if="value >= challenge.maxPerSubmission"
          class="mt-4 flex items-start gap-2 rounded-xl bg-[hsl(var(--muted))] px-3 py-2.5 text-sm"
        >
          <IconInfoCircle class="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--golden-900))]" aria-hidden="true" />
          <span>
            {{ formatCount(challenge.maxPerSubmission) }}
            {{ unitLabel(challenge, challenge.maxPerSubmission) }} is the most one entry can hold. Add the rest as a second entry.
          </span>
        </p>
        <p
          v-else-if="needsReview(challenge, value)"
          class="mt-4 flex items-start gap-2 rounded-xl bg-[hsl(var(--muted))] px-3 py-2.5 text-sm"
        >
          <IconClockPause class="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--golden-900))]" aria-hidden="true" />
          <span>{{ reviewReason(challenge) }}</span>
        </p>
      </div>

      <p v-if="localError" class="mt-4 flex items-start gap-2 text-sm text-red-700">
        <IconAlertTriangle class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{{ localError }}</span>
      </p>
    </template>

    <template #footer>
      <div v-if="challenge">
      <div v-if="phase !== 'input'" class="flex items-center gap-2">
        <button
          v-if="phase === 'done' && result?.submission && undoSeconds > 0 && !isCheckin"
          type="button"
          class="flex-1 rounded-xl border border-[hsl(var(--golden-200))] bg-white px-4 py-3 text-sm font-semibold text-[hsl(var(--primary))] hover:bg-[hsl(var(--golden-50))]"
          @click="undo"
        >
          Undo ({{ undoSeconds }}s)
        </button>
        <button
          type="button"
          class="flex-1 rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-semibold text-white hover:bg-[hsl(var(--primary))]/90"
          @click="emit('close')"
        >
          Done
        </button>
      </div>

      <NuxtLink
        v-else-if="!isLoggedIn"
        to="/login?redirect=/niyams"
        class="flex w-full items-center justify-center rounded-xl bg-[hsl(var(--primary))] px-4 py-3.5 text-base font-semibold text-white hover:bg-[hsl(var(--primary))]/90"
      >
        Sign in to add your {{ challenge.unit }}
      </NuxtLink>

      <button
        v-else-if="!published"
        type="button"
        class="w-full rounded-xl border border-[hsl(var(--golden-200))] bg-white px-4 py-3 text-sm font-semibold text-[hsl(var(--primary))] hover:bg-[hsl(var(--golden-50))]"
        @click="emit('close')"
      >
        Close
      </button>

      <button
        v-else-if="!isCheckin"
        type="button"
        class="w-full rounded-xl bg-[hsl(var(--primary))] px-4 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[hsl(var(--primary))]/90 disabled:opacity-50"
        :disabled="submitting || value < 1 || submitCooldown.blocked"
        @click="commit(value)"
      >
        {{ submitCooldown.blocked
          ? `Wait ${formatCheckinCooldownRemaining(submitCooldown.remainingMs)}`
          : commitLabel }}
      </button>

      <div v-else-if="isCheckin && dailyCheckinComplete" class="space-y-2">
        <p class="rounded-xl bg-[hsl(var(--muted))] px-4 py-3 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Both sabhas logged for today.
        </p>
        <button
          type="button"
          class="w-full rounded-xl border border-[hsl(var(--golden-200))] bg-white px-4 py-3 text-sm font-semibold text-[hsl(var(--primary))] hover:bg-[hsl(var(--golden-50))]"
          @click="emit('close')"
        >
          Close
        </button>
      </div>

      <div v-else-if="isCheckin" class="space-y-2">
        <button
          v-if="!showSabhaPicker"
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 py-5 font-display text-lg font-semibold text-white transition-colors hover:bg-[hsl(var(--primary))]/90 disabled:opacity-50"
          :disabled="submitting || checkingLocation || (atMandir ? atMandirCheckinBlocked : sabhaPickerBlocked)"
          @click="onCheckinClick"
        >
          <IconMapPin class="h-5 w-5" aria-hidden="true" />
          {{ checkinButtonLabel }}
        </button>
        <p v-if="!showSabhaPicker" class="text-center text-xs text-[hsl(var(--muted-foreground))]">
          <template v-if="atMandir">Check in for the {{ currentSabhaLabel }} sabha.</template>
          <template v-else>{{ copy('checkinFooterNote') }}</template>
        </p>
      </div>
      </div>
    </template>
  </NiyamSheet>
</template>

<script setup lang="ts">
import {
  IconAlertTriangle,
  IconArrowBackUp,
  IconCheck,
  IconChevronDown,
  IconClockPause,
  IconInfoCircle,
  IconLock,
  IconMapPin,
  IconMinus,
  IconPlus
} from '@tabler/icons-vue'
import type { NiyamChallenge, NiyamChallengeStats, NiyamSubmission, NiyamSubmissionStatus } from '~/types'
import {
  formatCount,
  formatTarget,
  inputModeFor,
  isPublished,
  mandirCheckinBlockedMessage,
  mandirCheckinCooldown,
  mandirCheckinSlot,
  mandirCheckinSlotLabel,
  mandirManualCheckinPlan,
  mandirSabhaLoggedToday,
  validateMandirCheckinSubmission,
  formatCheckinCooldownRemaining,
  needsReview,
  niyamDoubleTapMessage,
  niyamSubmitCooldown,
  NIYAM_DOUBLE_TAP_MS,
  presetsFor,
  reviewReason,
  SUBMISSION_NOTE_MAX,
  unitLabel,
  type MandirCheckinSlot,
  type MandirManualCheckinChoice
} from '~/utils/niyamChallenge'

export interface NiyamLogResult {
  status: NiyamSubmissionStatus
  submission: NiyamSubmission | null
}

const props = defineProps<{
  open: boolean
  challenge: NiyamChallenge | null
  stats: NiyamChallengeStats
  mySubmissions: NiyamSubmission[]
  myPersonal: number
  myPending: number
  isLoggedIn: boolean
  submitting: boolean
  atMandir?: boolean
  checkingLocation?: boolean
  locationError?: string | null
  autoCheckInEnabled?: boolean
  geolocationSupported?: boolean
  locationPermission?: string
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: {
    amount: number
    note: string
    checkinSlot?: MandirCheckinSlot | null
    done: (result: NiyamLogResult) => void
    fail: (message: string) => void
  }]
  withdraw: [submission: NiyamSubmission]
  'enable-auto-check-in': []
  'disable-auto-check-in': []
}>()

const copy = useNiyamCopy()

const UNDO_SECONDS = 30

const now = ref(Date.now())
let cooldownTimer: ReturnType<typeof setInterval> | null = null

const value = ref(0)
const note = ref('')
const numberText = ref('')
const showNumber = ref(false)
const showNote = ref(false)
const localError = ref('')
const phase = ref<'input' | 'done' | 'undone'>('input')
const result = ref<NiyamLogResult | null>(null)
const committed = ref(0)
const totalBefore = ref(0)
const undoSeconds = ref(0)
const numberId = useId()
const numberInput = ref<HTMLInputElement | null>(null)
const sheet = useTemplateRef<{ focusPanel: () => void }>('sheet')

/** The controls that had focus are gone once the sheet swaps state; take it back. */
async function reclaimFocus() {
  await nextTick()
  sheet.value?.focusPanel()
}

/** A chip sets the value the first time and adds after that, so +11 twice reads 22. */
let chipUsed = false
let holdTimer: ReturnType<typeof setTimeout> | null = null
let holdInterval: ReturnType<typeof setInterval> | null = null
let undoTimer: ReturnType<typeof setInterval> | null = null

const showSabhaPicker = ref(false)

const published = computed(() => !!props.challenge && isPublished(props.challenge))
const isCheckin = computed(() => !!props.challenge && inputModeFor(props.challenge) === 'checkin')
const presets = computed(() => (props.challenge ? presetsFor(props.challenge) : []))
const permissionDenied = computed(() => props.locationPermission === 'denied')
const sabhaLogged = computed(() => mandirSabhaLoggedToday(props.mySubmissions))
const dailyCheckinComplete = computed(() => sabhaLogged.value.morning && sabhaLogged.value.evening)
const currentSabhaLabel = computed(() => mandirCheckinSlotLabel(mandirCheckinSlot(now.value)))

const atMandirCheckinBlocked = computed(() => dailyCheckinComplete.value || checkinCooldown.value.blocked)

const sabhaPickerBlocked = computed(() => {
  if (!isCheckin.value) return false
  if (dailyCheckinComplete.value) return true
  return checkinCooldown.value.blocked && checkinCooldown.value.reason === 'double-tap'
})

const checkinCooldown = computed(() => {
  if (!isCheckin.value || !props.challenge) return { blocked: false, nextAt: 0, remainingMs: 0 }
  return mandirCheckinCooldown(
    props.mySubmissions,
    props.challenge.maxPerSubmission,
    now.value
  )
})

const submitCooldown = computed(() => {
  if (isCheckin.value || !props.challenge) return { blocked: false, nextAt: 0, remainingMs: 0 }
  return niyamSubmitCooldown(props.mySubmissions, NIYAM_DOUBLE_TAP_MS, now.value)
})

const checkinButtonLabel = computed(() => {
  if (props.submitting) return 'Adding…'
  if (props.checkingLocation) return 'Checking location…'
  if (checkinCooldown.value.blocked) {
    if (checkinCooldown.value.reason === 'daily') return 'Both sabhas logged today'
    if (checkinCooldown.value.reason === 'slot') {
      return checkinCooldown.value.slot === 'morning'
        ? 'Morning already logged'
        : 'Evening already logged'
    }
    return `Next sabha in ${formatCheckinCooldownRemaining(checkinCooldown.value.remainingMs)}`
  }
  if (props.atMandir) return `Check in — ${currentSabhaLabel.value} sabha`
  return 'Log sabha'
})

function toggleAutoCheckIn() {
  if (props.autoCheckInEnabled) emit('disable-auto-check-in')
  else emit('enable-auto-check-in')
}

const sheetSubtitle = computed(() => {
  if (!props.challenge) return ''
  if (phase.value !== 'input') return ''
  if (isCheckin.value) return 'Morning or evening sabha?'
  return 'How many have you done?'
})

function startCooldownTimer() {
  stopCooldownTimer()
  now.value = Date.now()
  cooldownTimer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
}

function stopCooldownTimer() {
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = null
}

function reset() {
  stopRepeat()
  stopUndoTimer()
  chipUsed = false
  value.value = 0
  numberText.value = ''
  note.value = ''
  showNumber.value = false
  showNote.value = false
  showSabhaPicker.value = false
  localError.value = ''
  phase.value = 'input'
  result.value = null
  committed.value = 0
  undoSeconds.value = 0
}

const commitLabel = computed(() => {
  if (!props.challenge) return 'Add'
  if (props.submitting) return 'Adding…'
  if (value.value < 1) return `Choose how many ${props.challenge.unit}`
  return `Add ${formatCount(value.value)} ${unitLabel(props.challenge, value.value)}`
})

function clamp(next: number): number {
  const max = props.challenge?.maxPerSubmission ?? 1
  return Math.max(0, Math.min(max, Math.round(next)))
}

function setValue(next: number) {
  value.value = clamp(next)
  numberText.value = value.value ? String(value.value) : ''
}

function tapPreset(preset: number) {
  localError.value = ''
  setValue(chipUsed && value.value > 0 ? value.value + preset : preset)
  chipUsed = true
}

function step(direction: number) {
  chipUsed = false
  setValue(value.value + direction)
}

function startRepeat(direction: number) {
  step(direction)
  stopRepeat()
  holdTimer = setTimeout(() => {
    holdInterval = setInterval(() => step(direction), 90)
  }, 450)
}

function stopRepeat() {
  if (holdTimer) clearTimeout(holdTimer)
  if (holdInterval) clearInterval(holdInterval)
  holdTimer = null
  holdInterval = null
}

function onNumberInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value.replace(/\D+/g, '')
  chipUsed = false
  value.value = clamp(Number(raw) || 0)
  numberText.value = raw ? String(value.value) : ''
  ;(event.target as HTMLInputElement).value = numberText.value
}

async function toggleNumber() {
  showNumber.value = !showNumber.value
  if (!showNumber.value) return
  await nextTick()
  numberInput.value?.focus()
}

function stopUndoTimer() {
  if (undoTimer) clearInterval(undoTimer)
  undoTimer = null
}

function startUndoTimer() {
  stopUndoTimer()
  undoSeconds.value = UNDO_SECONDS
  undoTimer = setInterval(() => {
    undoSeconds.value -= 1
    if (undoSeconds.value <= 0) stopUndoTimer()
  }, 1000)
}

function commit(amount: number, checkinSlot?: MandirCheckinSlot | null) {
  if (!props.challenge || props.submitting || props.checkingLocation || submitCooldown.value.blocked) return
  localError.value = ''

  const requested = clamp(amount)
  if (requested < 1) {
    localError.value = `Choose how many ${props.challenge.unit} you have done.`
    return
  }

  if (isCheckin.value) {
    const verdict = validateMandirCheckinSubmission(props.mySubmissions, {
      amount: requested,
      checkinSlot: checkinSlot ?? null
    })
    if (!verdict.ok) {
      localError.value = verdict.error || 'This check-in could not be recorded.'
      return
    }
  } else if (checkinCooldown.value.blocked) {
    return
  }

  totalBefore.value = props.stats.approvedTotal
  emit('submit', {
    amount: requested,
    note: note.value,
    checkinSlot: checkinSlot ?? null,
    done: (payload) => {
      committed.value = requested
      result.value = payload
      phase.value = 'done'
      showSabhaPicker.value = false
      now.value = Date.now()
      startUndoTimer()
      reclaimFocus()
    },
    fail: (message) => {
      localError.value = message
    }
  })
}

function onCheckinClick() {
  if (!props.challenge || props.submitting || props.checkingLocation) return
  if (props.atMandir) {
    if (atMandirCheckinBlocked.value) return
    commit(1)
    return
  }
  if (sabhaPickerBlocked.value) return
  showSabhaPicker.value = true
  localError.value = ''
}

function commitSabha(choice: MandirManualCheckinChoice) {
  const plan = mandirManualCheckinPlan(props.mySubmissions, choice)
  if (plan.error || plan.amount < 1) {
    localError.value = plan.error || 'Could not log that sabha.'
    return
  }
  commit(plan.amount, plan.checkinSlot ?? null)
}

function undo() {
  const submission = result.value?.submission
  if (!submission) return
  stopUndoTimer()
  phase.value = 'undone'
  emit('withdraw', submission)
  reclaimFocus()
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    reset()
    startCooldownTimer()
  } else {
    stopUndoTimer()
    stopCooldownTimer()
  }
})

onBeforeUnmount(() => {
  stopRepeat()
  stopUndoTimer()
  stopCooldownTimer()
})
</script>
