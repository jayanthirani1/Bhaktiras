<template>
  <div class="border-t border-[hsl(var(--border))]">
    <div v-if="loading" class="grid grid-cols-3 gap-1 p-1">
      <div v-for="i in 3" :key="i" class="aspect-square animate-pulse bg-[hsl(var(--muted))]" />
    </div>
    <div v-else-if="album?.photo.length">
      <div class="grid grid-cols-3 gap-1 p-1">
        <button
          v-for="(photo, index) in preview"
          :key="photo.id"
          type="button"
          class="group relative aspect-square overflow-hidden bg-[hsl(var(--muted))]"
          :aria-label="`Open ${photo.title || `${eventTitle} photo ${index + 1}`}`"
          @click="openPhoto(index)"
        >
          <img
            :src="photoUrl(photo)"
            :alt="photo.title || `${eventTitle} photo`"
            loading="lazy"
            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          >
        </button>
      </div>
      <button
        type="button"
        class="flex items-center justify-between px-5 py-3 text-sm font-semibold text-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))]/50"
        @click="openGallery"
      >
        <span class="inline-flex items-center gap-2">
          <IconPhoto class="h-4 w-4" />
          View all {{ album.photo.length }} photos
        </span>
        <IconChevronRight class="h-4 w-4" />
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="galleryOpen"
        class="fixed inset-0 z-[100] flex flex-col bg-[hsl(var(--background))]"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="galleryTitleId"
      >
        <header class="flex shrink-0 items-center justify-between gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 px-4 py-3 backdrop-blur">
          <div class="min-w-0">
            <h2 :id="galleryTitleId" class="truncate font-display text-lg font-semibold text-[hsl(var(--primary))]">
              {{ eventTitle }}
            </h2>
            <p class="text-xs text-[hsl(var(--muted-foreground))]">{{ album?.photo.length }} photos</p>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <button
              type="button"
              class="inline-flex h-10 items-center gap-1.5 rounded-full bg-[hsl(var(--muted))] px-3 text-sm font-semibold text-[hsl(var(--foreground))]"
              :aria-label="`Share ${eventTitle} album`"
              @click="shareAlbum"
            >
              <IconCheck v-if="shareState === 'copied'" class="h-4 w-4" />
              <IconShare2 v-else class="h-4 w-4" />
              {{ shareState === 'copied' ? 'Copied' : 'Share' }}
            </button>
            <button
              type="button"
              class="grid h-10 w-10 place-items-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
              aria-label="Close photo gallery"
              @click="closeGallery"
            >
              <IconX class="h-5 w-5" />
            </button>
          </div>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto p-1 sm:p-3">
          <div class="mx-auto grid max-w-6xl grid-cols-3 gap-1 sm:grid-cols-4 sm:gap-2 md:grid-cols-5">
            <button
              v-for="(photo, index) in album?.photo"
              :key="photo.id"
              type="button"
              class="group relative aspect-square overflow-hidden rounded-sm bg-[hsl(var(--muted))] sm:rounded-lg"
              :aria-label="`View ${photo.title || `photo ${index + 1}`}`"
              @click="openPhoto(index)"
            >
              <img
                :src="photoUrl(photo)"
                :alt="photo.title || `${eventTitle} photo ${index + 1}`"
                loading="lazy"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              >
            </button>
          </div>
        </div>

        <div
          v-if="selectedPhoto"
          class="absolute inset-0 z-10 flex flex-col bg-black"
        >
          <div class="flex shrink-0 items-center justify-between gap-3 bg-black/90 px-3 py-3 text-white">
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold"
              @click="selectedIndex = null"
            >
              <IconArrowLeft class="h-4 w-4" />
              All photos
            </button>
            <span class="text-sm tabular-nums">{{ (selectedIndex ?? 0) + 1 }} / {{ album?.photo.length }}</span>
            <button
              type="button"
              class="grid h-10 w-10 place-items-center rounded-full bg-white/10"
              aria-label="Close photo gallery"
              @click="closeGallery"
            >
              <IconX class="h-5 w-5" />
            </button>
          </div>

          <div class="relative min-h-0 flex-1">
            <img
              :src="photoUrl(selectedPhoto, 'large')"
              :alt="selectedPhoto.title || `${eventTitle} photo`"
              class="h-full w-full object-contain"
            >
            <button
              v-if="hasPrevious"
              type="button"
              class="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur sm:left-4"
              aria-label="Previous photo"
              @click="previousPhoto"
            >
              <IconChevronLeft class="h-6 w-6" />
            </button>
            <button
              v-if="hasNext"
              type="button"
              class="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur sm:right-4"
              aria-label="Next photo"
              @click="nextPhoto"
            >
              <IconChevronRight class="h-6 w-6" />
            </button>
          </div>
          <p
            v-if="selectedPhoto.title"
            class="shrink-0 bg-black/90 px-4 py-3 text-center text-sm text-white/80"
          >
            {{ selectedPhoto.title }}
          </p>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  IconArrowLeft,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconPhoto,
  IconShare2,
  IconX
} from '@tabler/icons-vue'

const props = defineProps<{
  albumId: string
  eventId: string
  eventTitle: string
}>()

const route = useRoute()
const router = useRouter()
const { fetchPhotoset, photoUrl } = useFlickr()
const album = ref<Awaited<ReturnType<typeof fetchPhotoset>>>(null)
const loading = ref(true)
const galleryOpen = ref(false)
const selectedIndex = ref<number | null>(null)
const galleryTitleId = `event-gallery-${useId()}`
const shareState = ref<'idle' | 'copied'>('idle')
let copiedTimer: ReturnType<typeof setTimeout> | null = null
/** Prevents closeGallery → clearQuery from fighting a fresh open from the same tick. */
let syncingFromRoute = false

const preview = computed(() => album.value?.photo.slice(0, 3) || [])
const selectedPhoto = computed(() =>
  selectedIndex.value == null ? null : album.value?.photo[selectedIndex.value] || null
)
const hasPrevious = computed(() => selectedIndex.value != null && selectedIndex.value > 0)
const hasNext = computed(() =>
  selectedIndex.value != null && selectedIndex.value < (album.value?.photo.length || 0) - 1
)

const albumQueryMatches = computed(() => {
  const raw = route.query.album
  const albumParam = Array.isArray(raw) ? raw[0] : raw
  return typeof albumParam === 'string' && albumParam === props.eventId
})

function albumPageUrl(): string {
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  return `${origin}/events?album=${encodeURIComponent(props.eventId)}`
}

function setAlbumQuery() {
  if (albumQueryMatches.value) return
  void router.replace({ query: { ...route.query, album: props.eventId } })
}

function clearAlbumQuery() {
  if (!albumQueryMatches.value) return
  const query = { ...route.query }
  delete query.album
  void router.replace({ query })
}

function openGallery() {
  galleryOpen.value = true
  document.body.style.overflow = 'hidden'
  if (!syncingFromRoute) setAlbumQuery()
}

function openPhoto(index: number) {
  openGallery()
  selectedIndex.value = index
}

function closeGallery() {
  galleryOpen.value = false
  selectedIndex.value = null
  document.body.style.overflow = ''
  if (!syncingFromRoute) clearAlbumQuery()
}

function openFromRoute() {
  if (!album.value?.photo.length || galleryOpen.value) return
  syncingFromRoute = true
  openGallery()
  syncingFromRoute = false
}

function previousPhoto() {
  if (hasPrevious.value && selectedIndex.value != null) selectedIndex.value -= 1
}

function nextPhoto() {
  if (hasNext.value && selectedIndex.value != null) selectedIndex.value += 1
}

function wasDismissed(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function markCopied() {
  shareState.value = 'copied'
  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => { shareState.value = 'idle' }, 2000)
}

async function shareAlbum() {
  const url = albumPageUrl()
  const text = `${props.eventTitle}\n\nPhoto album: ${url}`

  if (navigator.share) {
    try {
      await navigator.share({ title: props.eventTitle, text })
      return
    } catch (error) {
      if (wasDismissed(error)) return
    }
  }

  const clipboard = navigator.clipboard
  if (!clipboard?.writeText) return

  try {
    await clipboard.writeText(text)
    markCopied()
  } catch {
    // Permission refused — leave the button idle.
  }
}

function onKeydown(event: KeyboardEvent) {
  if (!galleryOpen.value) return
  if (event.key === 'Escape') {
    if (selectedIndex.value != null) selectedIndex.value = null
    else closeGallery()
  }
  if (event.key === 'ArrowLeft') previousPhoto()
  if (event.key === 'ArrowRight') nextPhoto()
}

watch(albumQueryMatches, (matches) => {
  if (loading.value) return
  if (matches) openFromRoute()
  else if (galleryOpen.value) {
    syncingFromRoute = true
    closeGallery()
    syncingFromRoute = false
  }
})

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  album.value = await fetchPhotoset(props.albumId)
  loading.value = false
  if (albumQueryMatches.value) openFromRoute()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (copiedTimer) clearTimeout(copiedTimer)
  if (galleryOpen.value) document.body.style.overflow = ''
})
</script>
