<template>
  <li class="relative border-b border-[hsl(var(--border))] last:border-b-0">
    <!-- The row body is one large target for "tell me more"; the pill beside it
         is the target for "I have done some". Two intents, no ambiguity. -->
    <button
      type="button"
      class="absolute inset-0 rounded-2xl transition-colors hover:bg-[hsl(var(--golden-50))]/70"
      @click="emit('detail')"
    >
      <span class="sr-only">{{ challenge.title }} — see the sangat's progress</span>
    </button>

    <div class="pointer-events-none relative flex items-start gap-3 px-4 py-4">
      <span
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--golden-50))] text-[hsl(var(--golden-900))]"
        aria-hidden="true"
      >
        <NiyamIcon :name="iconFor(challenge)" class="h-6 w-6" />
      </span>

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="font-display text-base font-semibold leading-tight text-[hsl(var(--primary))]">
              {{ challenge.title }}
            </h3>
            <p class="mt-0.5 text-xs leading-snug text-[hsl(var(--muted-foreground))]">{{ gloss }}</p>
          </div>

          <div class="pointer-events-auto shrink-0">
            <button
              v-if="canLog"
              type="button"
              class="flex h-12 min-w-[3rem] items-center justify-center gap-1 rounded-full bg-[hsl(var(--primary))] px-3.5 text-sm font-semibold text-white transition-colors hover:bg-[hsl(var(--primary))]/90"
              @click="emit('log')"
            >
              <IconPlus v-if="!isCheckin" class="h-4 w-4" aria-hidden="true" />
              <IconMapPin v-else class="h-4 w-4" aria-hidden="true" />
              <span>{{ isCheckin ? "I'm here" : 'Log' }}</span>
              <span class="sr-only">— add to {{ challenge.title }}</span>
            </button>
            <span
              v-else
              class="flex h-12 items-center gap-1.5 rounded-full bg-[hsl(var(--muted))] px-3 text-xs font-semibold text-[hsl(var(--muted-foreground))]"
            >
              <IconLock class="h-3.5 w-3.5" aria-hidden="true" />
              {{ closedLabel }}
            </span>
          </div>
        </div>

        <div class="mt-3 flex items-end justify-between gap-3">
          <div>
            <p class="font-display text-2xl leading-none text-[hsl(var(--primary))]">
              {{ formatCount(stats.approvedTotal) }}
            </p>
            <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              of {{ formatTarget(challenge.target) }}
            </p>
          </div>
          <p class="max-w-[52%] text-right text-[11px] leading-snug text-[hsl(var(--muted-foreground))]">
            <template v-if="!published">Waiting for the mandir to open it</template>
            <template v-else-if="stats.approvedTotal <= 0">Nothing counted yet</template>
            <template v-else-if="milestone.reached">
              <span class="font-semibold text-[hsl(var(--golden-900))]">Goal reached — Jay Swaminarayan</span>
            </template>
            <template v-else>
              Next {{ formatTarget(milestone.value) }}<br>
              <span class="text-[hsl(var(--golden-900))]">{{ formatCount(milestone.remaining) }} to go</span>
            </template>
          </p>
        </div>

        <NiyamProgress
          class="mt-2.5"
          :challenge="challenge"
          :approved="stats.approvedTotal"
          :pending="stats.pendingTotal"
        />
      </div>
    </div>
  </li>
</template>

<script setup lang="ts">
import { IconLock, IconMapPin, IconPlus } from '@tabler/icons-vue'
import type { NiyamChallenge, NiyamChallengeStats, NiyamIconKey } from '~/types'
import {
  challengeWindow,
  formatCount,
  formatTarget,
  iconFor,
  inputModeFor,
  isChallengeOpen,
  isPublished,
  milestoneFor
} from '~/utils/niyamChallenge'

const props = defineProps<{
  challenge: NiyamChallenge
  stats: NiyamChallengeStats
}>()

const emit = defineEmits<{ detail: []; log: [] }>()

/** Plain English under the Sanskrit name — gloss it once, never replace it. */
const GLOSSES: Record<NiyamIconKey, string> = {
  stotra: 'recitations of the Namavali',
  mala: 'rounds of the mala',
  mandir: 'sabhas attended in person',
  path: 'complete paths, all five chapters',
  dandvat: 'pranaams offered',
  niyam: 'entries'
}

const published = computed(() => isPublished(props.challenge))
const isCheckin = computed(() => inputModeFor(props.challenge) === 'checkin')
const canLog = computed(() => published.value && isChallengeOpen(props.challenge))
const gloss = computed(() => GLOSSES[iconFor(props.challenge)] || props.challenge.unit)
const milestone = computed(() => milestoneFor(props.stats.approvedTotal, props.challenge.target))

const closedLabel = computed(() => {
  if (!published.value) return 'Not open yet'
  const range = challengeWindow(props.challenge)
  if (!props.challenge.active) return 'Paused'
  if (!range.hasStarted) return 'Soon'
  return 'Closed'
})
</script>
