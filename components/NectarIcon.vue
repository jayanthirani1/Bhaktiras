<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    :class="class"
    :width="size"
    :height="size"
  >
    <!-- Nectar droplet shape inspired by the Bhaktiras logo tilak -->
    <path d="M12 2C12 2 6 10 6 14.5C6 17.5 8.69 20 12 20C15.31 20 18 17.5 18 14.5C18 10 12 2 12 2Z" />
    <!-- Inner highlight -->
    <ellipse cx="10" cy="12" rx="2" ry="3" fill="white" opacity="0.3" />
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  size?: number | string
  class?: string
}>()
</script>
