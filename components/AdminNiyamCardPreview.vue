<template>
  <div>
    <p class="admin-label mb-1">Preview — how the devotee's card will read</p>
    <!-- Static on purpose: nothing in here is a real control, so it adds no
         tab stops between the fields an admin is actually filling in. -->
    <div class="rounded-2xl border border-[hsl(var(--golden-200))] bg-white">
      <div class="flex items-start gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--golden-50))] px-4 py-3">
        <NiyamIcon :name="iconFor(challenge)" class="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--golden-900))]" />
        <div class="min-w-0">
          <p class="font-display text-lg text-[hsl(var(--primary))]">{{ challenge.title || 'Untitled niyam' }}</p>
          <p v-if="challenge.detail" class="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
            {{ challenge.detail }}
          </p>
        </div>
      </div>

      <div class="px-4 py-4">
        <p class="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--golden-900))]">
          Together so far
        </p>
        <p class="mt-0.5 text-center font-display text-3xl text-[hsl(var(--primary))]">
          {{ formatBigCount(approvedTotal) }}
        </p>
        <p class="mt-0.5 text-center text-sm text-[hsl(var(--muted-foreground))]">
          of {{ formatCount(challenge.target) }} {{ challenge.unit }}
        </p>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
          <div class="h-full bg-[hsl(var(--golden-500))]" :style="{ width: `${percent}%` }" />
        </div>

        <div class="mt-4 border-t border-[hsl(var(--border))] pt-4">
          <p v-if="challenge.hint" class="text-sm text-[hsl(var(--foreground))]">{{ challenge.hint }}</p>

          <template v-if="challenge.inputMode === 'checkin'">
            <span class="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[hsl(var(--primary))] px-4 text-sm font-semibold text-white">
              I was at {{ challenge.unitSingular }} today
            </span>
            <p class="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
              One tap adds a single {{ challenge.unitSingular }}. No number to type.
            </p>
          </template>

          <template v-else>
            <p class="mt-3 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
              How many {{ challenge.unit }} have you done?
            </p>
            <div class="mt-2 flex flex-wrap gap-2">
              <span
                v-for="preset in presets"
                :key="preset"
                class="inline-flex min-h-[40px] min-w-[3rem] items-center justify-center rounded-lg border border-[hsl(var(--golden-200))] bg-[hsl(var(--golden-50))] px-3 text-sm font-semibold text-[hsl(var(--primary))]"
              >
                +{{ formatCount(preset) }}
              </span>
              <span
                v-if="!presets.length"
                class="text-xs text-[hsl(var(--muted-foreground))]"
              >
                No one-tap amounts — the devotee types a number.
              </span>
            </div>
          </template>

          <p class="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
            <template v-if="challenge.autoApproveMax > 0">
              Up to {{ formatCount(challenge.autoApproveMax) }}
              {{ unitLabel(challenge, challenge.autoApproveMax) }} in one entry counts straight away.
              Anything larger waits for an admin to confirm it.
            </template>
            <template v-else>
              Every entry on this niyam is confirmed by an admin before it joins the total.
            </template>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NiyamChallenge } from '~/types'
import { formatBigCount } from '~/composables/useAdminNiyamChallenges'
import { formatCount, iconFor, percentOf, unitLabel } from '~/utils/niyamChallenge'

const props = withDefaults(defineProps<{
  challenge: NiyamChallenge
  approvedTotal?: number
}>(), { approvedTotal: 0 })

const presets = computed(() => (props.challenge.presets || []).filter(n => n > 0).slice(0, 6))
const percent = computed(() => percentOf(props.approvedTotal, props.challenge.target))
</script>
