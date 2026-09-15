<template>
  <div
    v-if="embed"
    class="overflow-hidden rounded-xl border border-[hsl(var(--golden-200))] bg-[hsl(var(--golden-50))]"
  >
    <iframe
      :src="embed.embedUrl"
      :title="embed.title"
      :height="embed.height"
      class="w-full border-0"
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin"
    />
  </div>
</template>

<script setup lang="ts">
import { niyamAudioEmbed, type NiyamAudioEmbed } from '~/utils/niyamAudioEmbed'

const props = defineProps<{ src: string }>()

const embed = computed<NiyamAudioEmbed | null>(() => niyamAudioEmbed(props.src))
</script>
