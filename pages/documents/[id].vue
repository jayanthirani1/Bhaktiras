<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-4 pb-mobile-nav pt-8 md:pb-10 md:pt-12">
    <div class="mx-auto max-w-2xl">
      <NuxtLink
        :to="backPath"
        class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
      >
        ← Back
      </NuxtLink>

      <div v-if="loading" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading…
      </div>

      <div v-else-if="error" class="card-surface p-8 text-center text-sm text-red-600">
        {{ error }}
      </div>

      <div v-else-if="notFound || !document" class="card-surface p-8 text-center">
        <h1 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">Document not found</h1>
        <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          This reading may have been removed or is not published yet.
        </p>
      </div>

      <template v-else>
        <header class="mb-5">
          <p v-if="challenge" class="text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--golden-900))]">
            {{ challenge.title }}
          </p>
          <div class="mt-1 flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <h1 class="font-display text-3xl font-semibold leading-tight text-[hsl(var(--primary))]">
                {{ document.title }}
              </h1>
              <p
                v-if="usesChapters"
                class="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]"
              >
                Chapter {{ chapterIndex + 1 }} of {{ chapters.length }}
              </p>
            </div>
            <div class="mt-1.5 flex shrink-0 items-center gap-2">
              <NiyamDocumentLanguageToggle
                v-model="language"
                :languages="languages"
              />
              <a
                v-if="audioHref"
                :href="audioHref"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex shrink-0 items-center gap-1 rounded-full border border-[hsl(var(--golden-200))] bg-[hsl(var(--golden-50))] px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--golden-100))]"
                aria-label="Open audio in a new tab"
              >
                <IconHeadphones class="h-3 w-3 shrink-0" aria-hidden="true" />
                AUDIO
              </a>
            </div>
          </div>
          <p
            v-if="currentChapter?.title"
            class="mt-2 text-sm font-medium text-[hsl(var(--golden-900))]"
          >
            {{ currentChapter.title }}
          </p>
        </header>

        <article
          class="legal-prose rounded-2xl border border-[hsl(var(--border))] bg-white p-5 sm:p-8"
          :lang="language === 'gu' ? 'gu' : 'en'"
          v-html="html"
        />

        <section
          v-if="usesChapters && !isLastChapter"
          class="mt-6"
        >
          <button
            type="button"
            class="w-full rounded-xl bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-white hover:bg-[hsl(var(--primary))]/90 sm:w-auto"
            @click="goToNextChapter"
          >
            Next chapter
          </button>
          <button
            v-if="chapterIndex > 0"
            type="button"
            class="mt-3 block text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            @click="goToPreviousChapter"
          >
            ← Previous chapter
          </button>
        </section>

        <section
          v-else-if="showRecordEntry"
          class="mt-6 rounded-2xl border border-[hsl(var(--golden-200))] bg-[hsl(var(--golden-50))] p-5"
        >
          <p class="text-sm text-[hsl(var(--muted-foreground))]">
            Finished reading? Record what you have done for {{ challenge?.title }}.
          </p>
          <button
            type="button"
            class="mt-4 w-full rounded-xl bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-white hover:bg-[hsl(var(--primary))]/90 sm:w-auto"
            @click="openLog"
          >
            Record your entry
          </button>
          <button
            v-if="usesChapters && chapterIndex > 0"
            type="button"
            class="mt-4 block text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            @click="goToPreviousChapter"
          >
            ← Previous chapter
          </button>
        </section>
      </template>
    </div>

    <NiyamLogSheet
      v-if="challenge"
      :open="sheetOpen"
      :challenge="challenge"
      :stats="statsFor(challenge.id)"
      :my-submissions="submissionsFor(challenge.id)"
      :my-personal="myPersonalTotal(challenge.id)"
      :my-pending="myPendingTotal(challenge.id)"
      :is-logged-in="isLoggedIn"
      :submitting="submitting"
      :at-mandir="isAtMandir"
      :checking-location="checkingLocation"
      :location-error="locationError"
      :auto-check-in-enabled="alwaysAllowLocation"
      :geolocation-supported="isGeolocationSupported"
      :location-permission="permissionState"
      @close="sheetOpen = false"
      @submit="onSubmit"
      @withdraw="withdraw"
      @enable-auto-check-in="enableLocationTracking"
      @disable-auto-check-in="disableLocationTracking"
    />
  </div>
</template>

<script setup lang="ts">
import { IconHeadphones } from '@tabler/icons-vue'
import type { MandirCheckinSlot, NiyamSubmission, NiyamSubmissionStatus } from '~/types'
import { renderSimpleMarkdown } from '~/utils/simpleMarkdown'
import {
  defaultNiyamDocumentLanguage,
  niyamDocumentBody,
  niyamDocumentChapters,
  niyamDocumentLanguagesAvailable,
  niyamDocumentUsesChapters,
  type NiyamDocumentLanguage
} from '~/utils/niyamDocument'
import { inputModeFor, validateMandirCheckinSubmission } from '~/utils/niyamChallenge'

const LANG_KEY = 'bhaktiras-doc-lang'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const documentId = computed(() => String(route.params.id || ''))
const niyamId = computed(() => String(route.query.niyam || ''))

const { document, loading, error, notFound } = useNiyamDocument(documentId)

const {
  challenges,
  submitting,
  isLoggedIn,
  statsFor,
  submissionsFor,
  myPersonalTotal,
  myPendingTotal,
  submit,
  withdraw
} = useNiyamChallenges()

const {
  isAtMandir,
  checking: checkingLocation,
  error: locationError,
  alwaysAllowLocation,
  isGeolocationSupported,
  permissionState,
  enableLocationTracking,
  disableLocationTracking
} = useMandirVisit()

const sheetOpen = ref(false)
const language = ref<NiyamDocumentLanguage>('en')
const chapterIndex = ref(0)

const challenge = computed(() =>
  challenges.value.find(item => item.id === niyamId.value) ?? null
)

const chapters = computed(() =>
  document.value ? niyamDocumentChapters(document.value) : []
)

const usesChapters = computed(() => chapters.value.length > 0)

const currentChapter = computed(() => chapters.value[chapterIndex.value] ?? null)

const isLastChapter = computed(() =>
  !usesChapters.value || chapterIndex.value >= chapters.value.length - 1
)

const showRecordEntry = computed(() => !!challenge.value && isLastChapter.value)

const audioHref = computed(() => (document.value?.audioUrl || '').trim())

const languages = computed(() =>
  document.value ? niyamDocumentLanguagesAvailable(document.value, chapterIndex.value) : []
)

const html = computed(() => {
  if (!document.value) return ''
  return renderSimpleMarkdown(niyamDocumentBody(document.value, language.value, chapterIndex.value))
})

const backPath = computed(() => (niyamId.value ? '/niyams' : '/niyams'))

function clampChapterIndex(index: number) {
  const max = Math.max(chapters.value.length - 1, 0)
  return Math.min(Math.max(index, 0), max)
}

function syncChapterFromQuery() {
  const raw = Number(route.query.chapter)
  if (!Number.isFinite(raw) || raw < 1) {
    chapterIndex.value = 0
    return
  }
  chapterIndex.value = clampChapterIndex(Math.floor(raw) - 1)
}

function updateChapterQuery(index: number) {
  const next = clampChapterIndex(index)
  chapterIndex.value = next
  const query = { ...route.query }
  if (next > 0) query.chapter = String(next + 1)
  else delete query.chapter
  void router.replace({ query })
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

function goToNextChapter() {
  updateChapterQuery(chapterIndex.value + 1)
}

function goToPreviousChapter() {
  updateChapterQuery(chapterIndex.value - 1)
}

watch(document, (doc) => {
  if (!doc) return
  syncChapterFromQuery()
  const stored = import.meta.client
    ? (localStorage.getItem(LANG_KEY) as NiyamDocumentLanguage | null)
    : null
  const preferred = stored === 'gu' || stored === 'en' ? stored : null
  const available = niyamDocumentLanguagesAvailable(doc, chapterIndex.value)
  if (preferred && available.includes(preferred)) {
    language.value = preferred
  } else {
    language.value = defaultNiyamDocumentLanguage(doc, chapterIndex.value)
  }
}, { immediate: true })

watch(() => route.query.chapter, () => {
  if (!document.value) return
  syncChapterFromQuery()
})

watch(chapterIndex, (index) => {
  if (!document.value) return
  const available = niyamDocumentLanguagesAvailable(document.value, index)
  if (!available.includes(language.value)) {
    language.value = defaultNiyamDocumentLanguage(document.value, index)
  }
})

watch(language, (value) => {
  if (!import.meta.client) return
  localStorage.setItem(LANG_KEY, value)
})

function openLog() {
  if (!auth.isLoggedIn.value) {
    navigateTo(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  sheetOpen.value = true
}

async function onSubmit(payload: {
  amount: number
  note: string
  checkinSlot?: MandirCheckinSlot | null
  done: (result: { status: NiyamSubmissionStatus; submission: NiyamSubmission | null }) => void
  fail: (message: string) => void
}) {
  const current = challenge.value
  if (!current) {
    payload.fail('This document is not linked to a niyam.')
    return
  }
  if (!isLoggedIn.value) {
    payload.fail('Sign in to add to this challenge')
    return
  }
  if (inputModeFor(current) === 'checkin') {
    const verdict = validateMandirCheckinSubmission(
      submissionsFor(current.id),
      { amount: payload.amount, checkinSlot: payload.checkinSlot ?? null }
    )
    if (!verdict.ok) {
      payload.fail(verdict.error || 'This check-in could not be recorded.')
      return
    }
  }
  try {
    const { status, submission } = await submit(
      current,
      payload.amount,
      payload.note,
      payload.checkinSlot ?? null
    )
    payload.done({ status, submission })
  } catch (e) {
    payload.fail((e as Error).message)
  }
}

useHead(() => ({
  title: document.value
    ? `${document.value.title} · Bhaktiras`
    : 'Document · Bhaktiras'
}))
</script>
