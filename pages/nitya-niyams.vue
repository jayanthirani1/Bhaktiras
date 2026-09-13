<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-mobile-nav pt-8 md:pb-10 md:pt-12">
    <div class="mx-auto max-w-3xl px-4">
      <NuxtLink
        to="/niyams"
        class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
      >
        ← Niyams
      </NuxtLink>

      <header class="mb-4">
        <h1 class="font-display text-3xl font-semibold leading-tight text-[hsl(var(--primary))] sm:text-4xl">
          Nitya Niyams
        </h1>
        <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          Scroll through every reading in one place — English or Gujarati.
        </p>
      </header>

      <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>
      <p v-else-if="loading && !sections.length" class="card-surface px-5 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading…
      </p>

      <template v-else-if="sections.length">
        <nav
          class="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Jump to a nitya niyam"
        >
          <button
            v-for="item in jumpTargets"
            :key="item.id"
            type="button"
            class="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
            :class="activeDocId === item.id
              ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white'
              : 'border-[hsl(var(--border))] bg-white text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--golden-200))] hover:text-[hsl(var(--foreground))]'"
            @click="jumpTo(item.id)"
          >
            {{ item.shortTitle }}
          </button>
        </nav>

        <div
          class="sticky top-0 z-20 -mx-4 mb-5 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--background))]/80"
        >
          <div class="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2">
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-bold uppercase tracking-[0.14em] text-[hsl(var(--golden-900))]">
                {{ activeDocTitle }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <NiyamDocumentLanguageToggle
                v-model="language"
                :languages="languages"
              />
              <NiyamDocumentFontSizeControl v-model="fontRem" />
            </div>
          </div>
        </div>

        <div class="space-y-10">
          <section
            v-for="section in visibleSections"
            :key="section.key"
            :id="section.anchorId"
            :data-doc-id="section.docId"
            class="nitya-section scroll-mt-24"
          >
            <header v-if="section.showDocTitle" class="mb-4">
              <h2 class="font-display text-2xl font-semibold text-[hsl(var(--primary))] sm:text-3xl">
                {{ section.docTitle }}
              </h2>
            </header>
            <p
              v-if="section.chapterTitle"
              class="mb-3 text-base font-medium text-[hsl(var(--golden-900))]"
            >
              {{ section.chapterTitle }}
            </p>
            <article
              class="doc-prose rounded-2xl border border-[hsl(var(--golden-200))] bg-[hsl(var(--golden-50))]/40 px-5 py-7 shadow-sm sm:px-10 sm:py-10"
              :lang="language === 'gu' ? 'gu' : 'en'"
              :style="proseStyle"
              v-html="section.html"
            />
          </section>
        </div>

        <div ref="sentinel" class="h-8" aria-hidden="true" />

        <p
          v-if="!allVisible"
          class="py-6 text-center text-sm text-[hsl(var(--muted-foreground))]"
        >
          Loading more…
        </p>
        <p
          v-else
          class="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]"
        >
          End of Nitya Niyams
        </p>
      </template>

      <div v-else class="card-surface px-5 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
        No Nitya Niyams to show yet.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NiyamDocument } from '~/types'
import { renderSimpleMarkdown } from '~/utils/simpleMarkdown'
import {
  niyamDocumentBody,
  niyamDocumentChapters,
  niyamDocumentLanguagesAvailable,
  type NiyamDocumentLanguage
} from '~/utils/niyamDocument'
import {
  DOC_FONT_REM_DEFAULT,
  docProseStyleFromRem,
  readStoredDocFontRem,
  writeStoredDocFontRem
} from '~/utils/niyamDocumentFont'

useSeoMeta({
  title: 'Nitya Niyams',
  description: 'Scroll through daily Swaminarayan Nitya Niyam readings in English or Gujarati.'
})

const LANG_KEY = 'bhaktiras-doc-lang'

type ScrollSection = {
  key: string
  anchorId: string
  docId: string
  docTitle: string
  shortTitle: string
  showDocTitle: boolean
  chapterTitle?: string
  html: string
}

const { documents, loading, error, fetchAll } = useNiyamDocuments()

const language = ref<NiyamDocumentLanguage>('en')
const fontRem = ref(DOC_FONT_REM_DEFAULT)
const visibleCount = ref(4)
const activeDocId = ref('')
const sentinel = ref<HTMLElement | null>(null)

const nityaDocuments = computed(() =>
  documents.value.filter(doc => doc.active !== false && doc.section === 'nitya')
)

function shortTitle(title: string) {
  const cleaned = title.replace(/^Shree Harini\s+/i, '').trim()
  const beforeDash = cleaned.split(/\s+[—–-]\s+/)[0]?.trim() || cleaned
  return beforeDash.length > 28 ? `${beforeDash.slice(0, 26)}…` : beforeDash
}

const sections = computed((): ScrollSection[] => {
  const out: ScrollSection[] = []
  for (const doc of nityaDocuments.value) {
    const chapters = niyamDocumentChapters(doc)
    const short = shortTitle(doc.title)
    if (chapters.length) {
      chapters.forEach((chapter, index) => {
        out.push({
          key: `${doc.id}:${chapter.id}`,
          anchorId: index === 0 ? doc.id : `${doc.id}--${chapter.id}`,
          docId: doc.id,
          docTitle: doc.title,
          shortTitle: short,
          showDocTitle: index === 0,
          chapterTitle: chapter.title,
          html: renderSimpleMarkdown(niyamDocumentBody(doc, language.value, index))
        })
      })
    } else {
      out.push({
        key: doc.id,
        anchorId: doc.id,
        docId: doc.id,
        docTitle: doc.title,
        shortTitle: short,
        showDocTitle: true,
        html: renderSimpleMarkdown(niyamDocumentBody(doc, language.value, 0))
      })
    }
  }
  return out
})

const visibleSections = computed(() => sections.value.slice(0, visibleCount.value))
const allVisible = computed(() => visibleCount.value >= sections.value.length)

const jumpTargets = computed(() =>
  nityaDocuments.value.map(doc => ({
    id: doc.id,
    shortTitle: shortTitle(doc.title)
  }))
)

const activeDocTitle = computed(() => {
  const match = nityaDocuments.value.find(doc => doc.id === activeDocId.value)
  return match?.title || nityaDocuments.value[0]?.title || 'Nitya Niyams'
})

const languages = computed((): NiyamDocumentLanguage[] => {
  const first = nityaDocuments.value[0]
  if (!first) return ['en']
  const available = niyamDocumentLanguagesAvailable(first, 0)
  return available.length ? available : ['en', 'gu']
})

const proseStyle = computed(() => docProseStyleFromRem(fontRem.value))

function revealMore() {
  if (allVisible.value) return
  visibleCount.value = Math.min(visibleCount.value + 3, sections.value.length)
}

function jumpTo(docId: string) {
  const index = sections.value.findIndex(section => section.docId === docId && section.showDocTitle)
  if (index >= 0 && index >= visibleCount.value) {
    visibleCount.value = Math.min(index + 2, sections.value.length)
  }
  activeDocId.value = docId
  nextTick(() => {
    document.getElementById(docId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function syncActiveFromScroll() {
  const nodes = [...document.querySelectorAll<HTMLElement>('.nitya-section[data-doc-id]')]
  if (!nodes.length) return
  const marker = 96
  let current = nodes[0]?.dataset.docId || ''
  for (const node of nodes) {
    const top = node.getBoundingClientRect().top
    if (top <= marker) current = node.dataset.docId || current
  }
  if (current) activeDocId.value = current
}

watch(language, (value) => {
  if (import.meta.client) localStorage.setItem(LANG_KEY, value)
})

watch(fontRem, (value) => {
  writeStoredDocFontRem(value)
})

watch(sections, (list) => {
  if (!activeDocId.value && list[0]) activeDocId.value = list[0].docId
  if (visibleCount.value < 4) visibleCount.value = Math.min(4, list.length)
}, { immediate: true })

let cleanup: (() => void) | null = null

onMounted(async () => {
  const savedLang = localStorage.getItem(LANG_KEY) as NiyamDocumentLanguage | null
  if (savedLang === 'en' || savedLang === 'gu') language.value = savedLang
  fontRem.value = readStoredDocFontRem()

  await fetchAll(true, 'nitya')

  await nextTick()
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some(entry => entry.isIntersecting)) revealMore()
    },
    { rootMargin: '400px 0px' }
  )
  if (sentinel.value) observer.observe(sentinel.value)

  const onScroll = () => syncActiveFromScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  syncActiveFromScroll()

  cleanup = () => {
    observer.disconnect()
    window.removeEventListener('scroll', onScroll)
  }
})

onBeforeUnmount(() => {
  cleanup?.()
})
</script>
