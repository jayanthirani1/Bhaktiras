<template>
  <AppPromptCard
    v-if="visible"
    id="signin-prompt"
    title="Sign in to keep your progress"
    body="Your streak, achievements, niyams and leaderboard place are saved to your account — not to this phone."
    dismiss-label="Not now"
    @close="close(true)"
  >
    <template #icon>
      <IconUserCircle class="h-5 w-5" aria-hidden="true" />
    </template>
    <template #actions>
      <button
        type="button"
        class="flex-1 rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold text-white"
        @click="accept"
      >
        Sign in
      </button>
      <button
        type="button"
        class="rounded-xl px-4 py-2.5 text-sm font-semibold text-[hsl(var(--muted-foreground))]"
        @click="close(true)"
      >
        Not now
      </button>
    </template>
  </AppPromptCard>
</template>

<script setup lang="ts">
import { IconUserCircle } from '@tabler/icons-vue'

const { visible: pending, close, accept } = useSignInPrompt()
const active = useAppPrompts().visible('sign-in')

const visible = computed(() => pending.value && active.value)
</script>
