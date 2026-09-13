<template>
  <Teleport to="body">
    <div
      v-if="restartNotice && onPlayRoute"
      class="fixed inset-x-0 bottom-20 z-[70] flex justify-center px-4 pointer-events-none sm:bottom-6"
      role="status"
    >
      <div
        class="pointer-events-auto w-full max-w-md rounded-2xl border border-orange-200 bg-white p-4 shadow-[0_18px_50px_-20px_rgba(154,52,18,0.45)]"
      >
        <p class="text-sm leading-snug text-[hsl(var(--primary))]">
          Your {{ restartNotice.previousStreak }}-day streak ended after a missed day. It has restarted from day 1 — keep going!
        </p>
        <button
          type="button"
          class="mt-2 text-xs font-semibold text-orange-800 underline underline-offset-2 hover:text-orange-950"
          @click="dismissRestartNotice"
        >
          Got it
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const route = useRoute()
const { restartNotice, dismissRestartNotice } = usePlayStreak()

const onPlayRoute = computed(() => {
  const path = route.path
  // Games hub shows the same copy on the streak card.
  return path.startsWith('/play/')
})
</script>
