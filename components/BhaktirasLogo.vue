<template>
  <div
    class="logo-lockup block shrink-0 overflow-visible"
    :class="[sizeClass, { 'logo-animate': animate || compact }]"
    v-html="markup"
  />
</template>

<script setup lang="ts">
import mainSvg from '~/assets/logos/bhaktiras-main.svg?raw'
import textSvg from '~/assets/logos/bhaktiras-text.svg?raw'

const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
}>(), {
  size: 'md',
  animate: false
})

const compact = computed(() => props.size === 'sm')

function prepareSvg(raw: string, prefix: string) {
  return raw
    .replace(/<\?xml[^>]*>/, '')
    .replaceAll('class="cls-', `class="${prefix}-cls-`)
    .replaceAll('.cls-', `.${prefix}-cls-`)
    .replace(
      '<svg ',
      `<svg class="logo-svg-inner block h-full w-full overflow-visible" width="100%" height="100%" role="img" aria-label="Bhaktiras" `
    )
}

const markup = computed(() =>
  prepareSvg(compact.value ? textSvg : mainSvg, compact.value ? 'txt' : 'main')
)

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'h-8 w-auto aspect-[321/69] max-w-[13rem] sm:h-9 md:h-10 md:max-w-[18rem]'
  if (props.size === 'lg') return 'w-44 sm:w-56 md:w-64 aspect-[267/354]'
  return 'w-28 sm:w-36 aspect-[267/354]'
})
</script>
