<template>
  <section aria-labelledby="niyam-copy-heading" class="admin-panel space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 id="niyam-copy-heading" class="font-display text-xl font-semibold text-[hsl(var(--primary))]">
        Section copy
        <span v-if="changedCount" class="ml-1 text-sm font-normal text-amber-800">
          · {{ changedCount }} unsaved
        </span>
      </h2>
      <button
        type="button"
        class="admin-btn-secondary min-h-[44px]"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        {{ expanded ? 'Hide' : 'Edit the wording' }}
      </button>
    </div>

    <p class="text-sm text-[hsl(var(--muted-foreground))]">
      Every sentence <code>/niyams</code> shows that is not part of a niyam itself — the page
      heading, the empty states, the wording on the log and detail sheets, the leaderboard.
      A niyam's own title, detail and hint are edited on the niyam, below.
      <strong>Leave a field blank to use the wording built into the app</strong>, which is shown
      as the placeholder, so a reworded default reaches the site without anybody re-saving here.
    </p>

    <template v-if="expanded">
      <p v-if="loading" class="text-sm text-[hsl(var(--muted-foreground))]">Loading the current wording…</p>

      <template v-else>
        <!-- A failed read still leaves the form usable: the defaults are in the
             placeholders either way, and Save reports its own failure. -->
        <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>

        <form class="space-y-5" @submit.prevent="onSave">
        <fieldset v-for="group in NIYAM_COPY_GROUPS" :key="group.id" class="space-y-3">
          <legend class="text-sm font-semibold text-[hsl(var(--primary))]">{{ group.label }}</legend>
          <p class="text-xs text-[hsl(var(--muted-foreground))]">{{ group.help }}</p>

          <div
            v-for="field in fieldsIn(group.id)"
            :key="field.key"
            class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-3"
          >
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <label :for="`${uid}-${field.key}`" class="admin-label mb-0">{{ field.label }}</label>
              <button
                v-if="draft[field.key]"
                type="button"
                class="min-h-[32px] text-xs font-semibold text-[hsl(var(--primary))] hover:underline"
                @click="draft[field.key] = ''"
              >
                Use the default
              </button>
            </div>
            <p class="mb-1.5 mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{{ field.help }}</p>

            <textarea
              v-if="field.multiline"
              :id="`${uid}-${field.key}`"
              v-model="draft[field.key]"
              rows="2"
              :maxlength="NIYAM_COPY_MAX"
              class="admin-input"
              :placeholder="DEFAULT_NIYAM_COPY[field.key as NiyamCopyKey]"
            />
            <input
              v-else
              :id="`${uid}-${field.key}`"
              v-model="draft[field.key]"
              :maxlength="NIYAM_COPY_MAX"
              class="admin-input"
              :placeholder="DEFAULT_NIYAM_COPY[field.key as NiyamCopyKey]"
            >
          </div>
        </fieldset>

        <div class="flex flex-wrap items-center gap-2 border-t border-[hsl(var(--border))] pt-4">
          <button type="submit" class="admin-btn min-h-[44px]" :disabled="saving || !changedCount">
            {{ saving ? 'Saving…' : 'Save the wording' }}
          </button>
          <button
            type="button"
            class="admin-btn-secondary min-h-[44px]"
            :disabled="saving || !changedCount"
            @click="resetDraft"
          >
            Discard changes
          </button>
          <button
            type="button"
            class="min-h-[44px] text-sm font-semibold text-red-600 hover:underline disabled:opacity-40"
            :disabled="saving || !overrideCount"
            @click="clearAll"
          >
            Reset all {{ overrideCount }} to the defaults
          </button>
          <span v-if="savedNote" class="text-sm text-[hsl(var(--primary))]">{{ savedNote }}</span>
        </div>
        </form>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import type { NiyamCopyContent } from '~/types'
import type { NiyamCopyKey } from '~/data/niyamCopy'
import {
  DEFAULT_NIYAM_COPY,
  NIYAM_COPY_FIELDS,
  NIYAM_COPY_GROUPS,
  parseNiyamCopy
} from '~/data/niyamCopy'

/**
 * The niyams area's wording, as an editor.
 *
 * Only overrides are held and written: a blank field means "whatever the code
 * says", so a default reworded in a later deploy reaches the live site instead
 * of being pinned by a copy of itself saved here. The save is a partial write
 * to `siteContent/main`, so it cannot disturb the tiles, nav or section
 * switches the other content editors own.
 */
const NIYAM_COPY_MAX = 400

const { item, loading, saving, error, load, save } = useAdminSiteContent()

const uid = useId()
const expanded = ref(false)
const savedNote = ref('')
const draft = reactive<Record<string, string>>(
  Object.fromEntries(NIYAM_COPY_FIELDS.map(field => [field.key, '']))
)

function fieldsIn(group: string) {
  return NIYAM_COPY_FIELDS.filter(field => field.group === group)
}

/** The stored overrides, as the editor's baseline. */
const stored = computed<NiyamCopyContent>(() => parseNiyamCopy(item.value.niyamCopy))

function resetDraft() {
  for (const field of NIYAM_COPY_FIELDS) {
    draft[field.key] = stored.value[field.key] ?? ''
  }
  savedNote.value = ''
}

const changedCount = computed(() =>
  NIYAM_COPY_FIELDS.filter(field =>
    (draft[field.key] || '').trim() !== (stored.value[field.key] ?? '')
  ).length
)

const overrideCount = computed(() =>
  NIYAM_COPY_FIELDS.filter(field => (draft[field.key] || '').trim()).length
)

function clearAll() {
  for (const field of NIYAM_COPY_FIELDS) draft[field.key] = ''
  savedNote.value = ''
}

async function onSave() {
  savedNote.value = ''
  try {
    await save({ niyamCopy: parseNiyamCopy({ ...draft }) })
    savedNote.value = 'Saved — /niyams shows it on the next load.'
  } catch {
    /* error is already set by the composable */
  }
}

onMounted(async () => {
  await load()
  resetDraft()
})

// A reload elsewhere in the page (a save, a retry) re-seeds the untouched form.
watch(stored, () => {
  if (!changedCount.value) resetDraft()
})
</script>
