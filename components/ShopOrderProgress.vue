<template>
  <div>
    <p v-if="status === 'cancelled'" class="text-sm font-semibold text-slate-600">This order was cancelled.</p>
    <ol v-else class="flex items-start" :aria-label="`Order progress: ${steps[current].label}`">
      <li v-for="(step, index) in steps" :key="step.label" class="relative flex flex-1 flex-col items-center text-center">
        <!-- Connector to the previous step. -->
        <span
          v-if="index > 0"
          class="absolute right-1/2 top-3 h-0.5 w-full -translate-y-1/2"
          :class="index <= current ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--border))]'"
          aria-hidden="true"
        />
        <span
          class="relative z-[1] flex h-6 w-6 items-center justify-center rounded-full border-2 text-[11px] font-bold"
          :class="index < current
            ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white'
            : index === current
              ? 'border-[hsl(var(--primary))] bg-white text-[hsl(var(--primary))]'
              : 'border-[hsl(var(--border))] bg-white text-[hsl(var(--muted-foreground))]'"
          :aria-current="index === current ? 'step' : undefined"
        >
          <template v-if="index < current">✓</template>
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span
          class="mt-1.5 px-1 text-[11px] font-semibold leading-tight"
          :class="index <= current ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'"
        >
          {{ step.label }}
        </span>
        <span v-if="!compact" class="mt-0.5 px-1 text-[10px] leading-tight text-[hsl(var(--muted-foreground))]">{{ step.hint }}</span>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import type { ShopOrderStatus } from '~/types'

/**
 * Where an order stands, as the devotee sees it. "Ready to collect" is not a
 * status the team sets: it is the next step after payment, announced on
 * WhatsApp, shown so nobody wonders what happens once they have paid.
 */
const props = defineProps<{ status: ShopOrderStatus; compact?: boolean }>()

const steps = [
  { label: 'Ordered', hint: 'Pre-order placed' },
  { label: 'Paid', hint: 'Treasury confirms' },
  { label: 'Collect', hint: 'Announced on WhatsApp' }
]

/** The step in progress: payment while unpaid, collection once paid. */
const current = computed(() => props.status === 'paid' ? 2 : 1)
</script>
