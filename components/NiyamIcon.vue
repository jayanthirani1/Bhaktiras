<template>
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
    <!-- Mala: the ring of beads, with the sumeru bead marked at the top. -->
    <template v-if="name === 'mala'">
      <circle cx="12" cy="13.5" r="6.5" />
      <circle cx="12" cy="4.5" r="1.8" />
      <circle cx="12" cy="7" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="5.5" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="20" r="0.9" fill="currentColor" stroke="none" />
    </template>

    <!-- Janmangal Stotra: an open pothi. -->
    <template v-else-if="name === 'stotra'">
      <path d="M12 6.5C10.4 5.2 8.4 4.5 6 4.5H3.5v13H6c2.4 0 4.4.7 6 2" />
      <path d="M12 6.5c1.6-1.3 3.6-2 6-2h2.5v13H18c-2.4 0-4.4.7-6 2" />
      <path d="M12 6.5v15" />
    </template>

    <!-- Mandir: shikhar over the sabha hall. -->
    <template v-else-if="name === 'mandir'">
      <path d="M12 2.5 7 9h10l-5-6.5Z" />
      <path d="M12 2.5v-1" />
      <path d="M6 9v12" />
      <path d="M18 9v12" />
      <path d="M3.5 21.5h17" />
      <path d="M10 21.5v-4.5a2 2 0 0 1 4 0v4.5" />
    </template>

    <!-- Shanti Path: the five chapters as five leaves. -->
    <template v-else-if="name === 'path'">
      <path d="M4.5 6.5h15" />
      <path d="M4.5 10h15" />
      <path d="M4.5 13.5h15" />
      <path d="M4.5 17h15" />
      <path d="M4.5 20.5h9" />
      <path d="M4.5 3h11" />
    </template>

    <!-- Dandvat: the body laid full length before the charanarvind. -->
    <template v-else-if="name === 'dandvat'">
      <path d="M2.5 17.5h13" />
      <circle cx="17.5" cy="15.5" r="2" />
      <path d="M2.5 17.5c0-1.2 1-2 2.2-2h8.6" />
      <path d="M6 21.5h12" />
      <path d="M9 6.5h6" />
      <path d="M12 3.5v6" />
    </template>

    <!-- Anything else: a diya. -->
    <template v-else>
      <path d="M12 3.5c1.8 2 2.7 3.6 2.7 5a2.7 2.7 0 0 1-5.4 0c0-1.4.9-3 2.7-5Z" />
      <path d="M4 13.5h16c0 3.3-3.6 6-8 6s-8-2.7-8-6Z" />
    </template>
  </svg>
</template>

<script setup lang="ts">
import type { NiyamIconKey } from '~/types'

defineProps<{ name: NiyamIconKey }>()
</script>
