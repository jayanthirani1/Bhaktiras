<template>
  <ol class="list-decimal space-y-2 pl-5">
    <li>Tap the sky, or press Space, to make Hanumanji leap. Let go and he glides down.</li>
    <li>Fly through the gaps. Every gate you pass scores a point. Touching a rock or the sea ends the run.</li>
    <li>Collect tulsi leaves along the way.</li>
    <li>Before <StoryLink id="surasa">Surasa</StoryLink>, take the blue Laghima orb. Hanumanji becomes tiny and slips through her narrow mouth.</li>
    <li><StoryLink id="mainak">Mainak</StoryLink> rises from the sea with a golden orb. Take it and the next hit is forgiven.</li>
    <li>Over <StoryLink id="simhika">Simhika</StoryLink>’s dark water, stay high. She seizes your shadow and drags you down.</li>
    <li>Pass <StoryLink id="lankini">Lankini</StoryLink>’s gate to reach Lanka, then keep going for a higher score. Fly as often as you like; your best run of the day counts.</li>
  </ol>
  <p class="mt-3 text-xs">
    Tap a name to read their story from the Sundar Kand.
  </p>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'

const StoryLink = defineComponent({
  props: { id: { type: String, required: true } },
  setup(props, { slots }) {
    return () => h(NuxtLink, {
      to: `/play/lanka-leap/stories#${props.id}`,
      class: 'font-semibold text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900'
    }, slots.default)
  }
})
</script>
