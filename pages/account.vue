<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-4 pb-24 pt-8 md:pt-12">
    <div class="mx-auto max-w-2xl">
      <PageHeader
        title="Your account"
        subtitle="See what is linked to your account, download a copy, or delete it."
      />

      <div v-if="auth.loading.value" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading your account…
      </div>

      <div v-else-if="!auth.user.value" class="card-surface p-8 text-center">
        <IconLock class="mx-auto h-8 w-8 text-[hsl(var(--accent))]" />
        <h2 class="mt-3 font-display text-xl font-semibold text-[hsl(var(--primary))]">Sign in required</h2>
        <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Sign in to manage or export your account data.</p>
        <NuxtLink to="/login?redirect=/account" class="btn-primary mt-5 inline-flex">Sign in</NuxtLink>
      </div>

      <div v-else class="space-y-5">
        <section class="card-surface p-5 sm:p-6">
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--accent))]">Account details</p>
          <dl class="mt-4 space-y-3 text-sm">
            <div>
              <dt class="text-[hsl(var(--muted-foreground))]">Name</dt>
              <dd class="font-semibold text-[hsl(var(--foreground))]">{{ auth.userName.value || 'Not provided' }}</dd>
            </div>
            <div>
              <dt class="text-[hsl(var(--muted-foreground))]">Email</dt>
              <dd class="break-all font-semibold text-[hsl(var(--foreground))]">{{ auth.user.value.email }}</dd>
            </div>
          </dl>
          <button type="button" class="mt-5 text-sm font-semibold text-[hsl(var(--primary))] underline" @click="signOut">
            Sign out
          </button>
        </section>

        <section class="card-surface p-5 sm:p-6">
          <div class="flex items-start gap-3">
            <IconDownload class="mt-0.5 h-6 w-6 shrink-0 text-[hsl(var(--accent))]" />
            <div>
              <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">Download your data</h2>
              <p class="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                Download a JSON file containing your account details, policy acceptance, game scores, streak,
                niyam progress and daily game completions.
              </p>
            </div>
          </div>
          <button
            type="button"
            class="btn-primary mt-5 inline-flex items-center gap-2 text-sm"
            :disabled="exporting"
            @click="downloadData"
          >
            <IconDownload class="h-4 w-4" />
            {{ exporting ? 'Preparing…' : 'Download my data' }}
          </button>
          <p v-if="exportError" role="alert" class="mt-3 text-sm text-red-600">{{ exportError }}</p>
        </section>

        <section class="rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">
          <div class="flex items-start gap-3">
            <IconTrash class="mt-0.5 h-6 w-6 shrink-0 text-red-700" />
            <div>
              <h2 class="font-display text-xl font-semibold text-red-900">Delete your account</h2>
              <p class="mt-2 text-sm leading-relaxed text-red-800">
                This permanently deletes your login, scores, streak, saved niyams, daily completions and policy
                acceptance record. Anonymous posts and anonymised community totals cannot be linked back to you.
              </p>
            </div>
          </div>

          <button
            v-if="!deleteOpen"
            type="button"
            class="mt-5 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white"
            @click="deleteOpen = true"
          >
            Delete my account
          </button>

          <form v-else class="mt-5 space-y-4 rounded-xl border border-red-200 bg-white/70 p-4" @submit.prevent="removeAccount">
            <p class="text-sm font-semibold text-red-900">This cannot be undone.</p>
            <div v-if="usesPassword">
              <label for="delete-password" class="mb-1 block text-sm font-medium text-red-900">Confirm your password</label>
              <input
                id="delete-password"
                v-model="password"
                type="password"
                required
                autocomplete="current-password"
                class="w-full rounded-lg border border-red-200 bg-white px-3 py-2"
              >
            </div>
            <p v-else-if="usesGoogle" class="text-sm text-red-800">
              Google will ask you to confirm your identity before deletion.
            </p>
            <div>
              <label for="delete-confirmation" class="mb-1 block text-sm font-medium text-red-900">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                id="delete-confirmation"
                v-model="confirmation"
                required
                autocomplete="off"
                class="w-full rounded-lg border border-red-200 bg-white px-3 py-2"
              >
            </div>
            <p v-if="error" role="alert" class="text-sm font-medium text-red-700">{{ error }}</p>
            <div class="flex flex-wrap gap-2">
              <button
                type="submit"
                class="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                :disabled="deleting || confirmation !== 'DELETE'"
              >
                {{ deleting ? 'Deleting…' : 'Permanently delete account' }}
              </button>
              <button type="button" class="rounded-xl px-4 py-2 text-sm font-semibold text-red-800" :disabled="deleting" @click="cancelDelete">
                Cancel
              </button>
            </div>
          </form>
        </section>

        <p class="text-center text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
          For corrections or anything this page cannot resolve, contact a temple admin.
          Read our <NuxtLink to="/privacy" class="font-semibold underline">Privacy Policy</NuxtLink>.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconDownload, IconLock, IconTrash } from '@tabler/icons-vue'

const auth = useAuth()
const {
  exporting,
  deleting,
  usesPassword,
  usesGoogle,
  exportMyData,
  deleteMyAccount
} = useAccountPrivacy()
const deleteOpen = ref(false)
const password = ref('')
const confirmation = ref('')
const error = ref('')
const exportError = ref('')

async function downloadData() {
  exportError.value = ''
  try {
    await exportMyData()
  } catch (value) {
    exportError.value = friendlyError(value)
  }
}

function cancelDelete() {
  deleteOpen.value = false
  password.value = ''
  confirmation.value = ''
  error.value = ''
}

async function removeAccount() {
  if (confirmation.value !== 'DELETE') return
  error.value = ''
  try {
    await deleteMyAccount(password.value)
    await navigateTo('/')
  } catch (value) {
    error.value = friendlyError(value)
  }
}

async function signOut() {
  await auth.signOut()
  await navigateTo('/login')
}

function friendlyError(value: unknown) {
  const message = (value as { message?: string })?.message || 'Something went wrong. Please try again.'
  if (message.includes('auth/wrong-password') || message.includes('auth/invalid-credential')) {
    return 'That password was not correct.'
  }
  if (message.includes('auth/popup-closed-by-user')) return 'Google confirmation was cancelled.'
  if (message.includes('auth/requires-recent-login')) return 'Please sign out, sign in again, then retry deletion.'
  return message
}

useHead({ title: 'Your account · Bhaktiras' })
</script>
