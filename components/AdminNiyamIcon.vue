<template>
  <!-- Decorative: every icon in the admin portal sits beside its own text label. -->
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="name === 'mala'">
      <circle cx="12" cy="13" r="7" />
      <circle cx="12" cy="4.5" r="1.6" />
    </template>
    <template v-else-if="name === 'stotra'">
      <path d="M4 5.5h5.5A2.5 2.5 0 0 1 12 8v11a2 2 0 0 0-2-2H4z" />
      <path d="M20 5.5h-5.5A2.5 2.5 0 0 0 12 8v11a2 2 0 0 1 2-2h6z" />
    </template>
    <template v-else-if="name === 'mandir'">
      <path d="M12 2.5 5 9h14z" />
      <path d="M6.5 9v10M12 9v10M17.5 9v10" />
      <path d="M3.5 19.5h17" />
    </template>
    <template v-else-if="name === 'path'">
      <path d="M6 20c0-4 4-4 4-8s-4-4-4-8" />
      <path d="M14 4c4 0 4 4 4 8s-4 4-4 8" />
    </template>
    <template v-else-if="name === 'dandvat'">
      <circle cx="5.5" cy="12" r="2" />
      <path d="M8 14h11" />
      <path d="M8 10c3.5 0 6-1.5 8-4" />
    </template>
    <template v-else>
      <path d="M12 3c2.5 3 4 5 4 7a4 4 0 0 1-8 0c0-2 1.5-4 4-7z" />
      <path d="M7 20.5h10" />
    </template>
  </svg>
</template>

<script setup lang="ts">
import type { NiyamIconName } from '~/composables/useAdminNiyamChallenges'

defineProps<{ name?: NiyamIconName }>()
</script>
