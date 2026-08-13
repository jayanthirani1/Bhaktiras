<template>
  <div>
    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <AdminEditorLayout
      :count-label="`${LEGAL_SLUGS.length} pages`"
      create-label="View site"
      empty-label=""
      :loading="loading"
      :empty="false"
      @create="openSite"
    >
      <template #list>
        <button
          v-for="slug in LEGAL_SLUGS"
          :key="slug"
          type="button"
          class="admin-row"
          :class="editingSlug === slug ? 'admin-row-active' : ''"
          @click="open(slug)"
        >
          <p class="font-semibold text-[hsl(var(--primary))]">{{ label(slug) }}</p>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {{ saved(slug) ? 'Saved in Firebase' : 'Using default text — save to publish edits' }}
          </p>
        </button>
      </template>
      <template #form>
        <form v-if="editingSlug" class="space-y-4" @submit.prevent="onSave">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">{{ label(editingSlug) }}</h2>
            <button type="button" class="admin-btn-secondary" @click="restoreDefault">Restore default</button>
          </div>
          <div>
            <label class="admin-label">Title</label>
            <input v-model="form.title" required class="admin-input">
          </div>
          <div>
            <label class="admin-label">Body (plain text / simple markdown)</label>
            <textarea v-model="form.body" required rows="22" class="admin-input font-mono text-sm leading-relaxed" />
            <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              Use ## headings, **bold**, and - lists. Links: [Privacy](/privacy)
            </p>
          </div>
          <div class="flex gap-2">
            <button type="submit" class="admin-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
            <NuxtLink :to="`/${editingSlug}`" target="_blank" class="admin-btn-secondary">Preview</NuxtLink>
          </div>
        </form>
        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">Select Privacy or Policy to edit.</p>
      </template>
    </AdminEditorLayout>
  </div>
</template>

<script setup lang="ts">
import type { LegalSlug } from '~/types'
import { DEFAULT_LEGAL_PAGES, LEGAL_SLUGS } from '~/data/legalPages'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { items, loading, saving, error, fetchAll, save } = useAdminSitePages()
const editingSlug = ref<LegalSlug>('privacy')
const form = reactive({ title: '', body: '' })

function label(slug: LegalSlug) {
  return slug === 'privacy' ? 'Privacy' : 'Policy'
}

function saved(slug: LegalSlug) {
  return items.value.some(p => p.id === slug && p.body?.trim())
}

function fill(slug: LegalSlug) {
  const existing = items.value.find(p => p.id === slug)
  const fallback = DEFAULT_LEGAL_PAGES[slug]
  form.title = existing?.title?.trim() || fallback.title
  form.body = existing?.body?.trim() || fallback.body
}

function open(slug: LegalSlug) {
  editingSlug.value = slug
  fill(slug)
}

function restoreDefault() {
  const fallback = DEFAULT_LEGAL_PAGES[editingSlug.value]
  form.title = fallback.title
  form.body = fallback.body
}

function openSite() {
  if (import.meta.client) window.open(`/${editingSlug.value}`, '_blank')
}

async function onSave() {
  if (saving.value) return
  const title = form.title.trim()
  const body = form.body.trim()
  if (!title || !body) {
    error.value = 'Title and body are required.'
    return
  }
  try {
    await save(editingSlug.value, { title, body })
    fill(editingSlug.value)
  } catch {
    /* error already set */
  }
}

onMounted(async () => {
  await fetchAll()
  fill(editingSlug.value)
})

useHead({ title: 'Privacy & Policy · Admin' })
</script>
