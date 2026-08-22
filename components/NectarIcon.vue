<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="217.8 304.8 11 16.2"
    overflow="visible"
    fill="currentColor"
    aria-hidden="true"
    :width="size"
    :height="size"
  >
    <!-- Tilak / nectar droplet from assets/logos/bhaktiras-main.svg (#logo-main-tilak) -->
    <path d="M226.69,316.91c-1.27,3.25-5.18,3.52-6.97.62-.29-.46-.49-.93-.58-1.37-.85-4.05,2.72-6.24,3.88-10.36.96,4.07,5.16,6.73,3.79,10.74-.04.12-.08.24-.12.36Z" />
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  size?: number | string
}>()
</script>
