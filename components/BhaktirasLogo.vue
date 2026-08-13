<template>
  <div
    class="logo-lockup block shrink-0 overflow-visible"
    :class="[sizeClass, { 'logo-animate': animate || compact, 'logo-compact': compact }]"
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
  let out = raw
    .replace(/<\?xml[^>]*>/, '')
    .replaceAll('class="cls-', `class="${prefix}-cls-`)
    .replaceAll('.cls-', `.${prefix}-cls-`)
    .replaceAll('class="st', `class="${prefix}-st`)
    .replaceAll('.st0', `.${prefix}-st0`)
    .replaceAll('.st1', `.${prefix}-st1`)
    .replace(
      '<svg ',
      `<svg class="logo-svg-inner block h-full w-full overflow-visible" width="100%" height="100%" role="img" aria-label="Bhaktiras" `
    )

  if (prefix === 'main') {
    const tilakRe = /<path id="logo-main-tilak"[^/]*\/>/
    const tilak = out.match(tilakRe)?.[0]
    if (tilak) {
      out = out.replace(tilakRe, '')
      out = out.replace(
        '</svg>',
        `<g id="logo-droplet-layer">
          ${tilak}
          <g id="logo-splash" fill="#d9ae30" aria-hidden="true">
            <ellipse class="logo-splash-drop" cx="230.4" cy="330.4" rx="2.1" ry="3.3"/>
            <ellipse class="logo-splash-drop" cx="230.4" cy="330.4" rx="1.7" ry="2.7"/>
            <ellipse class="logo-splash-drop" cx="230.4" cy="330.4" rx="1.3" ry="2.1"/>
            <ellipse class="logo-splash-drop" cx="230.4" cy="330.4" rx="1.9" ry="2.9"/>
            <ellipse class="logo-splash-drop" cx="230.4" cy="330.4" rx="1.15" ry="1.85"/>
            <ellipse class="logo-splash-drop" cx="230.4" cy="330.4" rx="1.5" ry="2.4"/>
            <circle class="logo-splash-drop" cx="230.4" cy="330.4" r="1.25"/>
          </g>
        </g></svg>`
      )
    }
  }

  if (prefix === 'txt') {
    const tilakRe = /<path id="logo-tilak"[^/]*\/>/
    const tilak = out.match(tilakRe)?.[0]
    if (tilak) {
      out = out.replace(tilakRe, '')
      out = out.replace(
        '</svg>',
        `<g id="logo-text-droplet-layer">
          ${tilak}
          <g id="logo-text-splash" fill="#d9ae30" aria-hidden="true">
            <ellipse class="logo-splash-drop" cx="268.4" cy="35.2" rx="2.2" ry="3.4"/>
            <ellipse class="logo-splash-drop" cx="268.4" cy="35.2" rx="1.9" ry="2.9"/>
            <ellipse class="logo-splash-drop" cx="268.4" cy="35.2" rx="1.6" ry="2.4"/>
            <ellipse class="logo-splash-drop" cx="268.4" cy="35.2" rx="2" ry="3.1"/>
            <ellipse class="logo-splash-drop" cx="268.4" cy="35.2" rx="1.4" ry="2.1"/>
            <ellipse class="logo-splash-drop" cx="268.4" cy="35.2" rx="1.7" ry="2.6"/>
            <circle class="logo-splash-drop" cx="268.4" cy="35.2" r="1.5"/>
          </g>
        </g></svg>`
      )
    }
  }

  return out
}

const markup = computed(() =>
  prepareSvg(compact.value ? textSvg : mainSvg, compact.value ? 'txt' : 'main')
)

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'h-7 w-auto aspect-[321/55] max-w-[14rem] sm:h-8 md:h-9 md:max-w-[20rem]'
  if (props.size === 'lg') return 'w-44 sm:w-56 md:w-64 aspect-[267/354]'
  return 'w-28 sm:w-36 aspect-[267/354]'
})
</script>
