<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-4 pb-24 pt-8 md:pt-12">
    <div class="mx-auto max-w-xl">
      <PageHeader
        title="Submit a bug"
        subtitle="Tell us what went wrong and where you saw it."
      />

      <div v-if="submitted" class="card-surface p-6 text-center sm:p-8">
        <div class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <IconCheck class="h-6 w-6" />
        </div>
        <h2 class="mt-4 font-display text-2xl font-semibold text-[hsl(var(--primary))]">Report received</h2>
        <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          Thank you. The team can now review and track this bug.
        </p>
        <NuxtLink to="/" class="btn-primary mt-6 inline-flex">Back to home</NuxtLink>
      </div>

      <form v-else class="card-surface space-y-5 p-6 sm:p-8" @submit.prevent="submit">
        <div>
          <label for="bug-title" class="mb-1.5 block text-sm font-semibold">What went wrong?</label>
          <input
            id="bug-title"
            v-model="form.title"
            required
            minlength="3"
            maxlength="100"
            class="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3"
            placeholder="Short summary of the problem"
          >
        </div>
        <div>
          <label for="bug-description" class="mb-1.5 block text-sm font-semibold">Details</label>
          <textarea
            id="bug-description"
            v-model="form.description"
            required
            minlength="10"
            maxlength="1500"
            rows="7"
            class="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3"
            placeholder="What did you expect, what happened instead, and how can we reproduce it?"
          />
        </div>
        <div>
          <label for="bug-page" class="mb-1.5 block text-sm font-semibold">Page</label>
          <input
            id="bug-page"
            v-model="form.pageUrl"
            maxlength="300"
            class="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3"
            placeholder="/play/wordle"
          >
          <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Filled automatically when you open this form.</p>
        </div>
        <div>
          <label for="bug-email" class="mb-1.5 block text-sm font-semibold">Email <span class="font-normal text-[hsl(var(--muted-foreground))]">(optional)</span></label>
          <input
            id="bug-email"
            v-model="form.contactEmail"
            type="email"
            maxlength="150"
            class="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3"
            placeholder="Only if you want us to follow up"
          >
        </div>

        <p v-if="error" role="alert" class="text-sm text-red-600">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="submitting">
          {{ submitting ? 'Sending…' : 'Submit bug' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { addDoc, collection, serverTimestamp, type Firestore } from 'firebase/firestore'
import { IconCheck } from '@tabler/icons-vue'

const route = useRoute()
const form = reactive({
  title: '',
  description: '',
  pageUrl: '',
  contactEmail: ''
})
const submitting = ref(false)
const submitted = ref(false)
const error = ref('')

onMounted(() => {
  const from = typeof route.query.from === 'string' ? route.query.from : ''
  form.pageUrl = from || document.referrer || ''
})

/**
 * The security rules only accept an absolute http(s) `pageUrl`, but the footer
 * link fills this field from `route.fullPath` — a relative path like
 * `/play/wordle`. Resolve relative paths against this origin so those reports
 * are storable, and drop anything that is not http(s) rather than send a value
 * the rules will reject. The rules stay strict: this is the convenience layer,
 * not the security boundary.
 */
function toAbsoluteHttpUrl(value: string): string | null {
  const raw = value.trim()
  if (!raw) return null
  try {
    const url = new URL(raw, window.location.origin)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.href.slice(0, 300)
  } catch {
    return null
  }
}

async function submit() {
  const title = form.title.trim()
  const description = form.description.trim()
  // Mirrors the rule thresholds, so a short entry is caught here with a usable
  // message instead of coming back as a permission error.
  if (title.length < 3 || description.length < 10) return

  const db = useNuxtApp().$firebaseDb as Firestore | null
  if (!db) {
    error.value = 'Bug reporting is temporarily unavailable. Please try again later.'
    return
  }

  submitting.value = true
  error.value = ''
  try {
    await addDoc(collection(db, 'bugReports'), {
      title,
      description,
      pageUrl: toAbsoluteHttpUrl(form.pageUrl),
      contactEmail: form.contactEmail.trim().toLowerCase().slice(0, 150) || null,
      status: 'open',
      createdAt: serverTimestamp()
    })
    submitted.value = true
  } catch {
    error.value = 'We could not submit the report. Please check your connection and try again.'
  } finally {
    submitting.value = false
  }
}

useHead({ title: 'Submit a bug · Bhaktiras' })
</script>
