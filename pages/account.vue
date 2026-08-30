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
        <IconLock class="mx-auto h-8 w-8 text-[hsl(var(--golden-900))]" />
        <h2 class="mt-3 font-display text-xl font-semibold text-[hsl(var(--primary))]">Sign in required</h2>
        <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Sign in to manage or export your account data.</p>
        <NuxtLink to="/login?redirect=/account" class="btn-primary mt-5 inline-flex">Sign in</NuxtLink>
      </div>

      <div v-else class="space-y-5">
        <section class="card-surface p-5 sm:p-6">
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--golden-900))]">Account details</p>
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
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-start gap-3">
              <IconBell class="mt-0.5 h-6 w-6 shrink-0 text-[hsl(var(--golden-900))]" />
              <div>
                <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">Push notifications</h2>
                <p class="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                  Receive announcements, niyam reminders and daily game reminders on this device. You can turn them off at any time.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="push.enabled.value"
              :disabled="push.busy.value || push.supported.value === false"
              class="relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-40"
              :class="push.enabled.value ? 'bg-emerald-500' : 'bg-[hsl(var(--border))]'"
              @click="togglePush"
            >
              <span
                class="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                :class="push.enabled.value ? 'translate-x-5' : 'translate-x-0'"
              />
              <span class="sr-only">{{ push.enabled.value ? 'Turn notifications off' : 'Turn notifications on' }}</span>
            </button>
          </div>
          <div
            v-if="push.enabled.value"
            class="mt-5 divide-y divide-[hsl(var(--border))] rounded-xl border border-[hsl(var(--border))]"
          >
            <div
              v-for="option in pushCategories"
              :key="option.topic"
              class="flex items-center justify-between gap-4 p-4"
            >
              <div>
                <p class="text-sm font-semibold text-[hsl(var(--foreground))]">{{ option.label }}</p>
                <p class="mt-0.5 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {{ option.description }}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                :aria-label="`${option.label} notifications`"
                :aria-checked="push.topics.value.includes(option.topic)"
                :disabled="push.busy.value"
                class="relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40"
                :class="push.topics.value.includes(option.topic) ? 'bg-emerald-500' : 'bg-[hsl(var(--border))]'"
                @click="togglePushTopic(option.topic)"
              >
                <span
                  class="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
                  :class="push.topics.value.includes(option.topic) ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>
          </div>
          <p v-if="push.needsHomeScreen.value" class="mt-3 text-xs text-amber-700">
            On iPhone and iPad, notifications only work once Bhaktiras is installed. Tap Share, choose
            “Add to Home Screen”, then open Bhaktiras from your Home Screen and turn notifications on there.
          </p>
          <p v-else-if="push.supported.value === false" class="mt-3 text-xs text-amber-700">
            This browser does not support web push. Try the latest Chrome, Edge or Safari,
            and make sure iOS is on version 16.4 or newer.
          </p>
          <p v-else-if="push.enabled.value" class="mt-3 text-xs font-medium text-emerald-700">
            Choose the updates you want to receive above.
          </p>
          <p v-if="push.error.value" role="alert" class="mt-3 text-sm text-red-600">{{ push.error.value }}</p>
        </section>

        <section class="card-surface p-5 sm:p-6">
          <div class="flex items-start gap-3">
            <IconLink class="mt-0.5 h-6 w-6 shrink-0 text-[hsl(var(--golden-900))]" />
            <div>
              <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">Sign-in methods</h2>
              <p class="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                Link more than one method to this account. Your scores, niyam challenge entries and streak stay under the same profile.
              </p>
            </div>
          </div>

          <div class="mt-5 space-y-3">
            <div class="flex items-center justify-between gap-3 rounded-xl border border-[hsl(var(--border))] p-4">
              <div class="flex min-w-0 items-center gap-3">
                <IconBrandGoogle class="h-5 w-5 shrink-0" />
                <div class="min-w-0">
                  <p class="text-sm font-semibold">Google</p>
                  <p class="text-xs text-[hsl(var(--muted-foreground))]">{{ usesGoogle ? 'Connected' : 'Not connected' }}</p>
                </div>
              </div>
              <span v-if="usesGoogle" class="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">Linked</span>
              <button
                v-else
                type="button"
                class="rounded-xl bg-[hsl(var(--primary))] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                :disabled="linking"
                @click="connectGoogle"
              >
                {{ linkingMethod === 'google' ? 'Connecting…' : 'Link Google' }}
              </button>
            </div>

            <div class="rounded-xl border border-[hsl(var(--border))] p-4">
              <div class="flex items-center justify-between gap-3">
                <div class="flex min-w-0 items-center gap-3">
                  <IconMail class="h-5 w-5 shrink-0" />
                  <div class="min-w-0">
                    <p class="text-sm font-semibold">Email and password</p>
                    <p class="truncate text-xs text-[hsl(var(--muted-foreground))]">
                      {{ usesPassword ? 'Connected' : auth.user.value.email }}
                    </p>
                  </div>
                </div>
                <span v-if="usesPassword" class="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">Linked</span>
                <button
                  v-else-if="!emailLinkOpen"
                  type="button"
                  class="rounded-xl border border-[hsl(var(--border))] px-3 py-2 text-xs font-semibold text-[hsl(var(--primary))]"
                  @click="emailLinkOpen = true"
                >
                  Add password
                </button>
              </div>

              <form v-if="!usesPassword && emailLinkOpen" class="mt-4 space-y-3 border-t border-[hsl(var(--border))] pt-4" @submit.prevent="connectEmailPassword">
                <div>
                  <label for="link-password" class="mb-1 block text-sm font-medium">New password</label>
                  <input
                    id="link-password"
                    v-model="linkPassword"
                    type="password"
                    minlength="6"
                    required
                    autocomplete="new-password"
                    class="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2"
                  >
                </div>
                <div>
                  <label for="link-password-confirm" class="mb-1 block text-sm font-medium">Confirm password</label>
                  <input
                    id="link-password-confirm"
                    v-model="linkPasswordConfirm"
                    type="password"
                    minlength="6"
                    required
                    autocomplete="new-password"
                    class="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2"
                  >
                </div>
                <div class="flex gap-2">
                  <button type="submit" class="btn-primary text-sm" :disabled="linking">
                    {{ linkingMethod === 'password' ? 'Connecting…' : 'Add email password' }}
                  </button>
                  <button type="button" class="px-3 py-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]" :disabled="linking" @click="cancelEmailLink()">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          <p v-if="linkMessage" class="mt-3 text-sm font-medium text-emerald-700">{{ linkMessage }}</p>
          <p v-if="linkError" role="alert" class="mt-3 text-sm text-red-600">{{ linkError }}</p>
        </section>

        <section class="card-surface p-5 sm:p-6">
          <div class="flex items-start gap-3">
            <IconDownload class="mt-0.5 h-6 w-6 shrink-0 text-[hsl(var(--golden-900))]" />
            <div>
              <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">Download your data</h2>
              <p class="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                Download a JSON file containing your account details, policy acceptance, game scores, streak,
                daily game completions and anything left from the retired niyam tracker.
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
                This permanently deletes your login, scores, streak, daily completions, saved niyam ticks and
                policy acceptance record. Anonymous posts and anonymised community totals cannot be linked back
                to you.
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
import type { PushTopic } from '~/composables/usePushNotifications'
import {
  IconBell,
  IconBrandGoogle,
  IconDownload,
  IconLink,
  IconLock,
  IconMail,
  IconTrash
} from '@tabler/icons-vue'

const auth = useAuth()
const push = usePushNotifications()
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
const emailLinkOpen = ref(false)
const linkPassword = ref('')
const linkPasswordConfirm = ref('')
const linkingMethod = ref<'google' | 'password' | null>(null)
const linking = computed(() => linkingMethod.value != null)
const linkError = ref('')
const linkMessage = ref('')
const pushCategories: Array<{ topic: PushTopic; label: string; description: string }> = [
  {
    topic: 'announcements',
    label: 'Announcements',
    description: 'Temple and Patotsav updates, including new events.'
  },
  {
    topic: 'games',
    label: 'Daily games and records',
    description: 'A reminder when the next daily challenge is ready, and when someone beats a record.'
  },
  {
    topic: 'niyams',
    label: 'Daily niyam reminder',
    description: 'An evening nudge to log what you kept today.'
  }
]

async function togglePush() {
  try {
    if (push.enabled.value) await push.disable()
    else await push.enable()
  } catch {
    // A user-friendly error is displayed in the notification section.
  }
}

async function togglePushTopic(topic: PushTopic) {
  try {
    await push.setTopicEnabled(topic, !push.topics.value.includes(topic))
  } catch {
    // A user-friendly error is displayed in the notification section.
  }
}

async function connectGoogle() {
  linkingMethod.value = 'google'
  linkError.value = ''
  linkMessage.value = ''
  try {
    await auth.linkGoogle()
    linkMessage.value = 'Google is now linked to this account.'
  } catch (value) {
    linkError.value = linkFriendlyError(value)
  } finally {
    linkingMethod.value = null
  }
}

async function connectEmailPassword() {
  linkError.value = ''
  linkMessage.value = ''
  if (linkPassword.value !== linkPasswordConfirm.value) {
    linkError.value = 'The passwords do not match.'
    return
  }
  linkingMethod.value = 'password'
  try {
    await auth.linkEmailPassword(linkPassword.value)
    linkMessage.value = 'Email and password sign-in is now linked to this account.'
    cancelEmailLink(false)
  } catch (value) {
    linkError.value = linkFriendlyError(value)
  } finally {
    linkingMethod.value = null
  }
}

function cancelEmailLink(clearMessages = true) {
  emailLinkOpen.value = false
  linkPassword.value = ''
  linkPasswordConfirm.value = ''
  if (clearMessages) {
    linkError.value = ''
    linkMessage.value = ''
  }
}

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

function linkFriendlyError(value: unknown) {
  const message = (value as { message?: string })?.message || ''
  if (
    message.includes('auth/credential-already-in-use')
    || message.includes('auth/email-already-in-use')
  ) {
    return 'That sign-in method already belongs to another Bhaktiras account. Automatic merging is disabled to protect both accounts’ data; contact an admin for help.'
  }
  if (message.includes('auth/provider-already-linked')) return 'That sign-in method is already linked.'
  if (message.includes('auth/popup-closed-by-user')) return 'Google linking was cancelled.'
  if (message.includes('auth/weak-password')) return 'Choose a password with at least 6 characters.'
  return message || 'Could not link that sign-in method. Please try again.'
}

useHead({ title: 'Your account · Bhaktiras' })

useNoIndex()
</script>
