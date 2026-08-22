<template>
  <AppPromptCard
    v-if="visible"
    id="install-prompt"
    :title="copy.title"
    :body="copy.body"
    @close="close(true)"
  >
    <template #icon>
      <IconDeviceMobileDown class="h-5 w-5" aria-hidden="true" />
    </template>

    <template v-if="method === 'ios-safari'" #detail>
      <ol class="mt-3 space-y-1.5 text-xs text-[hsl(var(--muted-foreground))]">
        <li class="flex items-center gap-2">
          <IconShare2 class="h-4 w-4 shrink-0 text-[hsl(var(--primary))]" aria-hidden="true" />
          <span>Tap <strong class="font-semibold">Share</strong> at the bottom of Safari</span>
        </li>
        <li class="flex items-center gap-2">
          <IconSquarePlus class="h-4 w-4 shrink-0 text-[hsl(var(--primary))]" aria-hidden="true" />
          <span>Choose <strong class="font-semibold">Add to Home Screen</strong></span>
        </li>
      </ol>
    </template>

    <template #actions>
      <button
        v-if="method === 'prompt'"
        type="button"
        class="flex-1 rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold text-white"
        @click="accept"
      >
        Install
      </button>
      <button
        type="button"
        class="rounded-xl px-4 py-2.5 text-sm font-semibold text-[hsl(var(--muted-foreground))]"
        :class="method === 'prompt' ? '' : 'flex-1 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'"
        @click="close(true)"
      >
        {{ method === 'prompt' ? 'Not now' : 'Got it' }}
      </button>
    </template>
  </AppPromptCard>
</template>

<script setup lang="ts">
import { IconDeviceMobileDown, IconShare2, IconSquarePlus } from '@tabler/icons-vue'

const { moment, method, close, accept } = useInstallPrompt()
const active = useAppPrompts().visible('install')

const visible = computed(() => !!moment.value && !!method.value && active.value)

/**
 * Three different asks. Chromium gets a button that installs; iOS Safari gets
 * the Share-sheet steps, because Apple offers no button to give it; anything
 * else on iOS cannot install at all and is sent to Safari.
 */
const copy = computed(() => {
  if (method.value === 'ios-safari') {
    return {
      title: 'Add Bhaktiras to your Home Screen',
      body: 'It opens full screen, like an app — and on iPhone it is the only way to receive temple and Patotsav announcements.'
    }
  }
  if (method.value === 'ios-other') {
    return {
      title: 'Install Bhaktiras from Safari',
      body: 'Open this page in Safari, tap Share, then Add to Home Screen. Chrome and Firefox on iPhone cannot install apps.'
    }
  }
  return {
    title: 'Add Bhaktiras to your phone?',
    body: 'Install it for a full-screen Bhaktiras, one tap from your home screen. Nothing to download from an app store.'
  }
})
</script>
