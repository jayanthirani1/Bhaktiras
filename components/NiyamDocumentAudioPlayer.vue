<template>
  <div
    v-if="src"
    class="flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-[hsl(var(--golden-200))] bg-[hsl(var(--golden-50))] px-2.5 py-1.5"
  >
    <button
      type="button"
      class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90"
      :aria-label="playing ? 'Pause audio' : 'Play audio'"
      @click="togglePlay"
    >
      <IconPlayerPause v-if="playing" class="h-4 w-4" aria-hidden="true" />
      <IconPlayerPlay v-else class="h-4 w-4" aria-hidden="true" />
    </button>

    <div class="min-w-0 flex-1">
      <input
        type="range"
        min="0"
        :max="duration || 0"
        step="0.1"
        :value="current"
        class="niyam-audio-seek w-full accent-[hsl(var(--primary))]"
        :aria-label="`Audio progress, ${formatTime(current)} of ${formatTime(duration)}`"
        @input="onSeek"
      >
      <p class="mt-0.5 text-[10px] tabular-nums text-[hsl(var(--muted-foreground))]">
        {{ formatTime(current) }} / {{ formatTime(duration) }}
      </p>
    </div>

    <button
      type="button"
      class="inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-[10px] font-bold tracking-[0.12em] transition-colors"
      :class="loop
        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white'
        : 'border-[hsl(var(--golden-200))] bg-white text-[hsl(var(--primary))]'"
      :aria-pressed="loop"
      aria-label="Repeat audio"
      @click="loop = !loop"
    >
      <IconRepeat class="h-3.5 w-3.5" aria-hidden="true" />
      LOOP
    </button>

    <audio
      ref="audioEl"
      :src="src"
      preload="metadata"
      class="hidden"
      @play="playing = true"
      @pause="playing = false"
      @ended="onEnded"
      @timeupdate="onTime"
      @loadedmetadata="onMeta"
    />
  </div>
</template>

<script setup lang="ts">
import { IconPlayerPause, IconPlayerPlay, IconRepeat } from '@tabler/icons-vue'

const props = defineProps<{ src: string }>()

const audioEl = ref<HTMLAudioElement | null>(null)
const playing = ref(false)
const loop = ref(false)
const current = ref(0)
const duration = ref(0)

watch(() => props.src, () => {
  playing.value = false
  current.value = 0
  duration.value = 0
})

watch(loop, (value) => {
  if (audioEl.value) audioEl.value.loop = value
})

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = String(total % 60).padStart(2, '0')
  return `${m}:${s}`
}

function togglePlay() {
  const el = audioEl.value
  if (!el) return
  el.loop = loop.value
  if (el.paused) void el.play()
  else el.pause()
}

function onSeek(event: Event) {
  const el = audioEl.value
  if (!el) return
  const next = Number((event.target as HTMLInputElement).value)
  el.currentTime = next
  current.value = next
}

function onTime() {
  current.value = audioEl.value?.currentTime || 0
}

function onMeta() {
  duration.value = audioEl.value?.duration || 0
}

function onEnded() {
  playing.value = false
  if (!loop.value) current.value = 0
}

onBeforeUnmount(() => {
  audioEl.value?.pause()
})
</script>
