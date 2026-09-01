<template>
  <a
    v-if="href"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    class="flex items-center justify-between gap-3 rounded-xl border border-[hsl(var(--golden-200))] bg-[hsl(var(--golden-50))] px-3 py-2.5 text-left transition-colors hover:bg-[hsl(var(--golden-100))]"
  >
    <span class="min-w-0">
      <span class="block text-sm font-semibold text-[hsl(var(--primary))]">{{ label }}</span>
      <span v-if="host" class="mt-0.5 block truncate text-xs text-[hsl(var(--muted-foreground))]">
        {{ host }} · opens in a new tab
      </span>
    </span>
    <IconExternalLink class="h-4 w-4 shrink-0 text-[hsl(var(--golden-900))]" aria-hidden="true" />
  </a>
</template>

<script setup lang="ts">
import { IconExternalLink } from '@tabler/icons-vue'
import type { NiyamChallenge } from '~/types'
import { resourceUrlHost, safeResourceUrl } from '~/utils/niyamChallenge'

/**
 * "Where the words are" for a niyam that is a recitation.
 *
 * Nothing renders unless the niyam carries a usable http(s) link, so this can
 * sit unconditionally in a sheet. The href is re-checked here rather than
 * trusted from the document: this is the last point before it reaches an
 * anchor tag.
 */
const props = defineProps<{ challenge: NiyamChallenge | null }>()

const copy = useNiyamCopy()

const href = computed(() => safeResourceUrl(props.challenge?.resourceUrl))
const host = computed(() => resourceUrlHost(href.value))
const label = computed(() =>
  (props.challenge?.resourceLabel || '').trim() || copy('resourceLinkLabel')
)
</script>
