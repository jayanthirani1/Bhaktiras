<template>
  <div class="border-t border-[hsl(var(--border))]">
    <div v-if="loading" class="grid grid-cols-3 gap-1 p-1">
      <div v-for="i in 3" :key="i" class="aspect-square animate-pulse bg-[hsl(var(--muted))]" />
    </div>
    <div v-else-if="album?.photo.length">
      <div class="grid grid-cols-3 gap-1 p-1">
        <a
          v-for="photo in preview"
          :key="photo.id"
          :href="photoUrl(photo, 'large')"
          target="_blank"
          rel="noopener noreferrer"
          class="group relative aspect-square overflow-hidden bg-[hsl(var(--muted))]"
        >
          <img
            :src="photoUrl(photo)"
            :alt="photo.title || `${eventTitle} photo`"
            loading="lazy"
            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          >
        </a>
      </div>
      <a
        v-if="albumUrl"
        :href="albumUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center justify-between px-5 py-3 text-sm font-semibold text-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))]/50"
      >
        <span class="inline-flex items-center gap-2">
          <IconPhoto class="h-4 w-4" />
          View all {{ album.photo.length }} photos
        </span>
        <IconExternalLink class="h-4 w-4" />
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconExternalLink, IconPhoto } from '@tabler/icons-vue'

const props = defineProps<{
  albumId: string
  eventTitle: string
}>()

const config = useRuntimeConfig().public
const { fetchPhotoset, photoUrl } = useFlickr()
const album = ref<Awaited<ReturnType<typeof fetchPhotoset>>>(null)
const loading = ref(true)

const preview = computed(() => album.value?.photo.slice(0, 3) || [])
/** Flickr returns the album owner, so the link works even if no user id is configured. */
const albumUrl = computed(() => {
  const owner = album.value?.owner || String(config.flickrUserId || '')
  return owner ? `https://www.flickr.com/photos/${owner}/sets/${props.albumId}/` : ''
})

onMounted(async () => {
  album.value = await fetchPhotoset(props.albumId)
  loading.value = false
})
</script>
