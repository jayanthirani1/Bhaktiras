<template>
  <div>
    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <AdminEditorLayout
      :count-label="`${sorted.length} document${sorted.length === 1 ? '' : 's'}`"
      create-label="New document"
      empty-label="No documents yet. Add one to link from a niyam."
      :loading="loading"
      :empty="!sorted.length"
      @create="openNew"
    >
      <template #list>
        <button
          v-for="item in sorted"
          :key="item.id"
          type="button"
          class="admin-row"
          :class="isEditing && editingId === item.id ? 'admin-row-active' : ''"
          @click="openEdit(item)"
        >
          <p class="font-semibold text-[hsl(var(--primary))]">{{ item.title || 'Untitled' }}</p>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            <span v-if="chapterCount(item)">{{ chapterCount(item) }} chapter{{ chapterCount(item) === 1 ? '' : 's' }}</span>
            <span v-else-if="hasEnglish(item)">English</span>
            <span v-if="!chapterCount(item) && hasEnglish(item) && hasGujarati(item)"> · </span>
            <span v-if="!chapterCount(item) && hasGujarati(item)">Gujarati</span>
            <span v-if="!chapterCount(item) && !hasEnglish(item) && !hasGujarati(item)">No body text yet</span>
            <span v-if="!item.active" class="ml-1 text-amber-700">· hidden</span>
          </p>
        </button>
      </template>
      <template #form>
        <form v-if="showForm" class="space-y-4" @submit.prevent="save">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">
              {{ isEditing ? 'Edit document' : 'New document' }}
            </h2>
            <button v-if="isEditing && editingId" type="button" class="admin-btn-danger" @click="onDelete(editingId)">
              Delete
            </button>
          </div>

          <div>
            <label class="admin-label">Title</label>
            <input v-model="form.title" required class="admin-input" :maxlength="NIYAM_DOCUMENT_TITLE_MAX">
            <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              Shown on the link card unless the niyam has its own link text.
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <label class="flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))]">
              <input v-model="form.active" type="checkbox" class="rounded border-[hsl(var(--border))]">
              Visible on the site
            </label>
            <div>
              <label class="admin-label">Sort order</label>
              <input v-model.number="form.order" type="number" min="0" step="1" class="admin-input">
            </div>
          </div>

          <div>
            <label class="admin-label">Audio URL (optional)</label>
            <input
              v-model="form.audioUrl"
              type="url"
              class="admin-input"
              placeholder="https://…"
            >
            <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              External link shown next to the language switcher on the reading page. Opens in a new tab.
            </p>
          </div>

          <AdminMarkdownHint class="mb-1" />

          <div class="space-y-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 class="text-sm font-semibold text-[hsl(var(--primary))]">Chapters</h3>
                <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  Split a long reading into steps. Devotees tap “Next chapter” until the last one, where they can record their entry.
                </p>
              </div>
              <button type="button" class="admin-btn-secondary" @click="addChapter">
                Add chapter
              </button>
            </div>

            <p v-if="!form.chapters.length" class="text-sm text-[hsl(var(--muted-foreground))]">
              No chapters yet — the single English and Gujarati fields below are used.
            </p>

            <div v-else class="space-y-4">
              <p class="text-xs text-[hsl(var(--muted-foreground))]">
                Chapters are shown instead of the single-page text below.
              </p>
              <section
                v-for="(chapter, index) in form.chapters"
                :key="chapter.id"
                class="space-y-3 rounded-xl border border-[hsl(var(--border))] bg-white p-4"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p class="text-sm font-semibold text-[hsl(var(--primary))]">
                    Chapter {{ index + 1 }}
                    <span v-if="chapter.title" class="font-normal text-[hsl(var(--muted-foreground))]">· {{ chapter.title }}</span>
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="admin-btn-secondary px-2 py-1 text-xs"
                      :disabled="index === 0"
                      @click="moveChapter(index, -1)"
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      class="admin-btn-secondary px-2 py-1 text-xs"
                      :disabled="index === form.chapters.length - 1"
                      @click="moveChapter(index, 1)"
                    >
                      Move down
                    </button>
                    <button type="button" class="admin-btn-danger px-2 py-1 text-xs" @click="removeChapter(index)">
                      Remove
                    </button>
                  </div>
                </div>

                <div>
                  <label class="admin-label">Chapter title (optional)</label>
                  <input
                    v-model="chapter.title"
                    class="admin-input"
                    :maxlength="NIYAM_DOCUMENT_CHAPTER_TITLE_MAX"
                    placeholder="e.g. Chapter 1"
                  >
                </div>

                <div>
                  <label class="admin-label">English text</label>
                  <textarea
                    v-model="chapter.bodyEnglish"
                    rows="8"
                    class="admin-input font-mono text-sm leading-relaxed"
                    :maxlength="NIYAM_DOCUMENT_BODY_MAX"
                  />
                </div>

                <div>
                  <label class="admin-label">Gujarati text</label>
                  <textarea
                    v-model="chapter.bodyGujarati"
                    rows="8"
                    class="admin-input font-mono text-sm leading-relaxed"
                    :maxlength="NIYAM_DOCUMENT_BODY_MAX"
                  />
                </div>
              </section>
            </div>
          </div>

          <div v-if="!form.chapters.length" class="space-y-4">
            <p class="admin-label">Single-page text</p>
            <div>
              <label class="admin-label">English text</label>
              <textarea
                v-model="form.bodyEnglish"
                rows="14"
                class="admin-input font-mono text-sm leading-relaxed"
                :maxlength="NIYAM_DOCUMENT_BODY_MAX"
                placeholder="## Janmangal Stotra&#10;&#10;Paste or write the English text here."
              />
            </div>

            <div>
              <label class="admin-label">Gujarati text</label>
              <textarea
                v-model="form.bodyGujarati"
                rows="14"
                class="admin-input font-mono text-sm leading-relaxed"
                :maxlength="NIYAM_DOCUMENT_BODY_MAX"
                placeholder="ગુજરાતી શ્લોક અહીં લખો…"
              />
            </div>
          </div>

          <p class="text-xs text-[hsl(var(--muted-foreground))]">
            At least one language is required in each chapter, or in the single-page text when there are no chapters.
          </p>

          <div class="flex flex-wrap gap-2">
            <button type="submit" class="admin-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
            <button type="button" class="admin-btn-secondary" @click="showForm = false">Cancel</button>
            <NuxtLink
              v-if="isEditing && editingId"
              :to="previewPath"
              target="_blank"
              class="admin-btn-secondary"
            >
              Preview
            </NuxtLink>
          </div>
        </form>
        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">
          Select a document to edit, or create a new one. Then link it from a niyam under “Document”.
        </p>
      </template>
    </AdminEditorLayout>
  </div>
</template>

<script setup lang="ts">
import type { NiyamDocument, NiyamDocumentChapter } from '~/types'
import {
  NIYAM_DOCUMENT_BODY_MAX,
  NIYAM_DOCUMENT_CHAPTER_TITLE_MAX,
  NIYAM_DOCUMENT_MAX_CHAPTERS,
  NIYAM_DOCUMENT_TITLE_MAX,
  newNiyamDocumentChapterId,
  niyamDocumentChapterHasContent,
  niyamDocumentChapters
} from '~/utils/niyamDocument'
import { safeResourceUrl } from '~/utils/niyamChallenge'

definePageMeta({ layout: 'admin', middleware: 'admin' })

type ChapterForm = {
  id: string
  title: string
  bodyEnglish: string
  bodyGujarati: string
}

const { items, loading, saving, error, fetchAll, create, updateItem, remove } = useAdminNiyamDocuments()

const showForm = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({
  title: '',
  bodyEnglish: '',
  bodyGujarati: '',
  audioUrl: '',
  chapters: [] as ChapterForm[],
  active: true,
  order: 0
})

const sorted = computed(() =>
  [...items.value].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title))
)

const previewPath = computed(() => (editingId.value ? `/documents/${editingId.value}` : '/documents'))

function hasEnglish(item: NiyamDocument) {
  return !!(item.bodyEnglish || '').trim()
}

function hasGujarati(item: NiyamDocument) {
  return !!(item.bodyGujarati || '').trim()
}

function chapterCount(item: NiyamDocument) {
  return niyamDocumentChapters(item).length
}

function chapterToForm(chapter: NiyamDocumentChapter): ChapterForm {
  return {
    id: chapter.id,
    title: chapter.title || '',
    bodyEnglish: chapter.bodyEnglish || '',
    bodyGujarati: chapter.bodyGujarati || ''
  }
}

function openNew() {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, {
    title: '',
    bodyEnglish: '',
    bodyGujarati: '',
    audioUrl: '',
    chapters: [],
    active: true,
    order: sorted.value.length
  })
  showForm.value = true
}

function openEdit(item: NiyamDocument) {
  isEditing.value = true
  editingId.value = item.id
  Object.assign(form, {
    title: item.title,
    bodyEnglish: item.bodyEnglish || '',
    bodyGujarati: item.bodyGujarati || '',
    audioUrl: item.audioUrl || '',
    chapters: niyamDocumentChapters(item).map(chapterToForm),
    active: item.active !== false,
    order: item.order ?? 0
  })
  showForm.value = true
}

function addChapter() {
  if (form.chapters.length >= NIYAM_DOCUMENT_MAX_CHAPTERS) {
    error.value = `A document can have at most ${NIYAM_DOCUMENT_MAX_CHAPTERS} chapters.`
    return
  }
  const isFirst = form.chapters.length === 0
  const chapter: ChapterForm = {
    id: newNiyamDocumentChapterId(),
    title: '',
    bodyEnglish: isFirst ? form.bodyEnglish.trim() : '',
    bodyGujarati: isFirst ? form.bodyGujarati.trim() : ''
  }
  form.chapters.push(chapter)
  if (isFirst && (chapter.bodyEnglish || chapter.bodyGujarati)) {
    form.bodyEnglish = ''
    form.bodyGujarati = ''
  }
}

function removeChapter(index: number) {
  form.chapters.splice(index, 1)
}

function moveChapter(index: number, delta: number) {
  const next = index + delta
  if (next < 0 || next >= form.chapters.length) return
  const [chapter] = form.chapters.splice(index, 1)
  form.chapters.splice(next, 0, chapter)
}

function serializeChapters(chapters: ChapterForm[]): NiyamDocumentChapter[] {
  return chapters
    .map((chapter) => {
      const title = chapter.title.trim().slice(0, NIYAM_DOCUMENT_CHAPTER_TITLE_MAX)
      const bodyEnglish = chapter.bodyEnglish.trim().slice(0, NIYAM_DOCUMENT_BODY_MAX)
      const bodyGujarati = chapter.bodyGujarati.trim().slice(0, NIYAM_DOCUMENT_BODY_MAX)
      return {
        id: chapter.id,
        title: title || undefined,
        bodyEnglish,
        bodyGujarati
      }
    })
    .filter(niyamDocumentChapterHasContent)
}

async function save() {
  const title = form.title.trim()
  const bodyEnglish = form.bodyEnglish.trim()
  const bodyGujarati = form.bodyGujarati.trim()
  const chapters = serializeChapters(form.chapters)

  if (!title) {
    error.value = 'Title is required.'
    return
  }
  if (form.chapters.length && !chapters.length) {
    error.value = 'Add text in at least one chapter.'
    return
  }
  if (!chapters.length && !bodyEnglish && !bodyGujarati) {
    error.value = 'Add text in English, Gujarati, or both — or add at least one chapter.'
    return
  }

  const payload: Record<string, unknown> = {
    title: title.slice(0, NIYAM_DOCUMENT_TITLE_MAX),
    bodyEnglish: bodyEnglish.slice(0, NIYAM_DOCUMENT_BODY_MAX),
    bodyGujarati: bodyGujarati.slice(0, NIYAM_DOCUMENT_BODY_MAX),
    audioUrl: safeResourceUrl(form.audioUrl) || '',
    active: !!form.active,
    order: Math.max(0, Math.floor(Number(form.order) || 0))
  }
  if (chapters.length) payload.chapters = chapters
  else payload.chapters = []

  try {
    if (isEditing.value && editingId.value) {
      await updateItem(editingId.value, payload)
      form.chapters = chapters.map(chapterToForm)
    } else {
      const id = await create(payload)
      editingId.value = id
      isEditing.value = true
      form.chapters = chapters.map(chapterToForm)
    }
  } catch {
    // error surfaced by composable
  }
}

async function onDelete(id: string) {
  if (!confirm('Delete this document? Niyams linked to it will need a new link.')) return
  await remove(id)
  showForm.value = false
  editingId.value = null
}

onMounted(() => {
  void fetchAll()
})

useHead({ title: 'Documents · Admin · Bhaktiras' })
</script>
