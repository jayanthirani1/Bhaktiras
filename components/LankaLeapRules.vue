<template>
  <ol class="list-decimal space-y-2 pl-5">
    <li>Tap the sky, or press Space, to make Hanumanji leap. Let go and he glides down.</li>
    <li>Fly through the gaps. Every gate you pass scores a point. Touching a rock or the sea ends the run.</li>
    <li>Collect tulsi leaves along the way.</li>
    <li>Before <StoryLink id="surasa">Surasa</StoryLink>, take the blue Laghima orb. Hanumanji becomes tiny and slips through her narrow mouth.</li>
    <li><StoryLink id="mainak">Mainak</StoryLink> rises from the sea with a golden orb. Take it and the next hit is forgiven.</li>
    <li>Over <StoryLink id="simhika">Simhika</StoryLink>’s dark water, stay high. She seizes your shadow and drags you down.</li>
    <li>Pass <StoryLink id="lankini">Lankini</StoryLink>’s gate and Lanka catches light. Fly the rooftops and stay above the rising flames.</li>
    <li>After the fire, <StoryLink id="setu">Shri Ram, Lakshman and the vanaras</StoryLink> cross the sea. The way opens above the bridge.</li>
    <li>On the <StoryLink id="battle">battlefield</StoryLink> the chariots rise and fall. One green sanjeevani waits there. Take it and Hanumanji carries the mountain until Ravan.</li>
    <li>Pass <StoryLink id="ravan">Ravan</StoryLink>’s chariot and he falls. The way home then swings faster and the gaps close in. Every gate still scores a point. Fly as often as you like; your highest score of all time is kept.</li>
  </ol>
  <p class="mt-3 text-xs">
    Tap a name to read the story.
  </p>
  <p class="mt-2 text-[11px] opacity-70">
    Audio: Hanuman Chalisa of Goswami Tulsidas.
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
