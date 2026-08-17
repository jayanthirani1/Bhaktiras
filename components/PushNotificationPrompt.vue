<template>
  <Teleport to="body">
    <div
      v-if="moment"
      class="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[70] mx-auto max-w-md rounded-2xl border border-[hsl(var(--golden-200))] bg-white p-4 shadow-[0_22px_60px_-20px_rgba(56,32,97,0.45)] md:bottom-6"
      role="dialog"
      aria-labelledby="push-prompt-title"
      aria-describedby="push-prompt-description"
    >
      <div class="flex items-start gap-3">
        <div class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[hsl(var(--golden-100))] text-[hsl(var(--primary))]">
          <IconBell class="h-5 w-5" aria-hidden="true" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 id="push-prompt-title" class="font-display text-base font-semibold text-[hsl(var(--primary))]">
            {{ copy.title }}
          </h2>
          <p id="push-prompt-description" class="mt-1 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
            {{ copy.body }}
          </p>
        </div>
        <button
          type="button"
          class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
          aria-label="Not now"
          @click="close(true)"
        >
          <IconX class="h-4 w-4" />
        </button>
      </div>

      <div class="mt-4 flex gap-2">
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
      </div>
      <p v-if="push.error.value" role="alert" class="mt-2 text-xs text-red-600">{{ push.error.value }}</p>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { IconBell, IconX } from '@tabler/icons-vue'

const { moment, push, close, accept } = usePushPrompt()

const copy = computed(() => {
  if (moment.value === 'game-complete') {
    return {
      title: 'Remind me tomorrow’s game?',
      body: 'Get one gentle reminder when the next daily challenge is ready.',
      action: 'Remind me'
    }
  }
  if (moment.value === 'events') {
    return {
      title: 'Notify me about new events?',
      body: 'Hear when a new sabha or Patotsav event is published.',
      action: 'Notify me'
    }
  }
  return {
    title: 'Stay updated for Patotsav?',
    body: 'Receive important Patotsav announcements on this device.',
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
