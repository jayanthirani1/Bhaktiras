<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-if="canShare"
      type="button"
      class="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--golden-300))] bg-white px-4 py-2 text-sm font-semibold text-[hsl(var(--primary))]"
      @click="share"
    >
      <IconShare class="h-4 w-4" /> Save these details
    </button>
    <a
      v-else
      :href="whatsappUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--golden-300))] bg-white px-4 py-2 text-sm font-semibold text-[hsl(var(--primary))]"
    >
      <IconBrandWhatsapp class="h-4 w-4" /> Send to myself on WhatsApp
    </a>
    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--golden-300))] bg-white px-4 py-2 text-sm font-semibold text-[hsl(var(--primary))]"
      @click="copyAll"
    >
      <IconCopy class="h-4 w-4" /> {{ copied ? 'Copied' : 'Copy all' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { IconBrandWhatsapp, IconCopy, IconShare } from '@tabler/icons-vue'
import type { ShopSettings } from '~/types'
import { formatPence, hasBankDetails } from '~/data/shop'

/**
 * Many people pay later, from their banking app, so the reference, amount and
 * bank details need to leave the page with them: the phone's share sheet
 * where there is one (save to Notes, send on WhatsApp), WhatsApp otherwise,
 * and a plain copy either way.
 */
const props = defineProps<{ reference: string; total: number; settings: ShopSettings }>()

const copied = ref(false)
const canShare = ref(false)

onMounted(() => {
  canShare.value = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
})

const text = computed(() => {
  const lines = [
    `Bhaktiras souvenir order ${props.reference}`,
    `Amount: ${formatPence(props.total)}`,
    `Payment reference: ${props.reference}`
  ]
  if (hasBankDetails(props.settings)) {
    if (props.settings.bankAccountName) lines.push(`Account name: ${props.settings.bankAccountName}`)
    if (props.settings.bankName) lines.push(`Bank: ${props.settings.bankName}`)
    lines.push(`Sort code: ${props.settings.sortCode}`, `Account number: ${props.settings.accountNumber}`)
  }
  lines.push('Or pay at the mandir.')
  return lines.join('\n')
})

const whatsappUrl = computed(() => `https://wa.me/?text=${encodeURIComponent(text.value)}`)

async function share() {
  try {
    await navigator.share({ title: `Order ${props.reference}`, text: text.value })
  } catch {
    // Cancelled, or refused: the copy button is right beside it.
  }
}

async function copyAll() {
  try {
    await navigator.clipboard.writeText(text.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Clipboard blocked: the details are on screen to copy by hand.
  }
}
</script>
