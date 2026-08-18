<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
await navigateTo('/admin/games/crossword', { redirectCode: 301, replace: true })
</script>
