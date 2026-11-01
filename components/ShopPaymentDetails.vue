<template>
  <div class="rounded-2xl border border-[hsl(var(--golden-300))] bg-[hsl(var(--golden-50))] p-4 sm:p-5">
    <p class="text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--golden-900))]">How to pay</p>
    <dl class="mt-3 grid gap-x-4 gap-y-2.5 text-sm sm:grid-cols-[auto_1fr]">
      <dt class="text-[hsl(var(--muted-foreground))]">Payment reference</dt>
      <dd class="flex flex-wrap items-center gap-2">
        <span class="font-mono text-base font-bold tracking-wide text-[hsl(var(--primary))]">{{ reference }}</span>
        <button type="button" class="rounded-full border border-[hsl(var(--golden-300))] bg-white px-2.5 py-0.5 text-xs font-semibold text-[hsl(var(--primary))]" @click="copy(reference)">
          {{ copied === reference ? 'Copied' : 'Copy' }}
        </button>
      </dd>
      <dt class="text-[hsl(var(--muted-foreground))]">Amount</dt>
      <dd class="font-semibold tabular-nums">{{ formatPence(total) }}</dd>
      <template v-if="hasBankDetails(settings)">
        <template v-if="settings.bankAccountName">
          <dt class="text-[hsl(var(--muted-foreground))]">Account name</dt>
          <dd class="font-semibold">{{ settings.bankAccountName }}</dd>
        </template>
        <template v-if="settings.bankName">
          <dt class="text-[hsl(var(--muted-foreground))]">Bank</dt>
          <dd class="font-semibold">{{ settings.bankName }}</dd>
        </template>
        <dt class="text-[hsl(var(--muted-foreground))]">Sort code</dt>
        <dd class="font-mono font-semibold">{{ settings.sortCode }}</dd>
        <dt class="text-[hsl(var(--muted-foreground))]">Account number</dt>
        <dd class="flex flex-wrap items-center gap-2">
          <span class="font-mono font-semibold">{{ settings.accountNumber }}</span>
          <button type="button" class="rounded-full border border-[hsl(var(--golden-300))] bg-white px-2.5 py-0.5 text-xs font-semibold text-[hsl(var(--primary))]" @click="copy(settings.accountNumber)">
            {{ copied === settings.accountNumber ? 'Copied' : 'Copy' }}
          </button>
        </dd>
      </template>
    </dl>
    <p v-if="!hasBankDetails(settings)" class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
      Bank details will be shared by the Treasury team. You can also pay at the mandir.
    </p>
    <p class="mt-3 text-sm leading-relaxed text-[hsl(var(--foreground))]">{{ settings.paymentInstructions }}</p>
  </div>
</template>

<script setup lang="ts">
import type { ShopSettings } from '~/types'
import { formatPence, hasBankDetails } from '~/data/shop'

defineProps<{ reference: string; total: number; settings: ShopSettings }>()

const copied = ref('')

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = text
    setTimeout(() => { if (copied.value === text) copied.value = '' }, 2000)
  } catch {
    // Clipboard blocked: the text is on screen to copy by hand.
  }
}
</script>
