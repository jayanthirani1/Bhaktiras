<template>
  <AppPromptCard
    v-if="visible"
    id="push-prompt"
    :title="copy.title"
    :body="copy.body"
    :error="push.error.value"
    @close="close(true)"
  >
    <template #icon>
      <IconBell class="h-5 w-5" aria-hidden="true" />
    </template>
    <template #actions>
      <button
        type="button"
        class="flex-1 rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        :disabled="push.busy.value"
        @click="turnOn"
      >
        {{ push.busy.value ? 'Turning on…' : copy.action }}
      </button>
      <button
        type="button"
        class="rounded-xl px-4 py-2.5 text-sm font-semibold text-[hsl(var(--muted-foreground))]"
        :disabled="push.busy.value"
        @click="close(true)"
      >
        Not now
      </button>
    </template>
  </AppPromptCard>
</template>

<script setup lang="ts">
import { IconBell } from '@tabler/icons-vue'

const { moment, push, close, accept } = usePushPrompt()
const active = useAppPrompts().visible('push')

/** Queued behind sign-in and install: pending, but not this round's card. */
const visible = computed(() => !!moment.value && active.value)

const copy = computed(() => {
  if (moment.value === 'game-complete') {
    return {
      title: 'Remind me tomorrow’s game?',
      body: 'Get a nudge when the next daily challenge is ready, and when someone beats a record.',
      action: 'Remind me'
    }
  }
  if (moment.value === 'signed-in') {
    return {
      title: 'Turn on notifications?',
      body: 'Sabha times, Patotsav dates and mandir announcements come through to this device. You can change this any time from your account.',
      action: 'Turn them on'
    }
  }
  return {
    title: 'Stay updated with announcements?',
    body: 'Receive temple and Patotsav announcements on this device.',
    action: 'Stay updated'
  }
})

async function turnOn() {
  try {
    await accept()
  } catch {
    // The composable exposes a user-friendly error below the actions.
  }
}
</script>
