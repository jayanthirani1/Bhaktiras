<template>
  <NuxtLink
    v-if="documentPath"
    :to="documentPath"
    class="flex items-center justify-between gap-3 rounded-xl border border-[hsl(var(--golden-200))] bg-[hsl(var(--golden-50))] px-3 py-2.5 text-left transition-colors hover:bg-[hsl(var(--golden-100))]"
  >
    <span class="min-w-0">
      <span class="block text-sm font-semibold text-[hsl(var(--primary))]">{{ label }}</span>
      <span class="mt-0.5 block truncate text-xs text-[hsl(var(--muted-foreground))]">
        Read in Bhaktiras · English or Gujarati
      </span>
    </span>
    <IconBook class="h-4 w-4 shrink-0 text-[hsl(var(--golden-900))]" aria-hidden="true" />
  </NuxtLink>

  <a
    v-else-if="href"
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
import { IconBook, IconExternalLink } from '@tabler/icons-vue'
import type { NiyamChallenge } from '~/types'
import { niyamDocumentPath } from '~/composables/useNiyamDocuments'
import { resourceUrlHost, safeResourceUrl } from '~/utils/niyamChallenge'

const props = defineProps<{ challenge: NiyamChallenge | null }>()

const copy = useNiyamCopy()
const { documentById, fetchAll } = useNiyamDocuments()

const documentId = computed(() => (props.challenge?.resourceDocumentId || '').trim())
const linkedDocument = computed(() => documentById(documentId.value))

onMounted(() => {
  if (documentId.value && !linkedDocument.value) {
    void fetchAll()
  }
})

watch(documentId, (id) => {
  if (id && !documentById(id)) void fetchAll()
})

const documentPath = computed(() => {
  if (!documentId.value) return null
  return niyamDocumentPath(documentId.value, props.challenge?.id)
})

const href = computed(() => {
  if (documentId.value) return null
  return safeResourceUrl(props.challenge?.resourceUrl)
})

const host = computed(() => (href.value ? resourceUrlHost(href.value) : ''))

const label = computed(() => {
  const custom = (props.challenge?.resourceLabel || '').trim()
  if (custom) return custom
  if (linkedDocument.value?.title) return linkedDocument.value.title
  return copy('resourceLinkLabel')
})
</script>
