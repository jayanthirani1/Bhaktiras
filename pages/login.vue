<template>
  <div class="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-sm">
      <h1 class="text-2xl font-bold text-[hsl(var(--foreground))] text-center mb-2">Sign in</h1>
      <p class="text-sm text-[hsl(var(--muted-foreground))] text-center mb-6">
        Sign in to save your scores and personalise your experience.
      </p>

      <!-- Google sign in -->
      <button
        type="button"
        class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))] font-semibold text-[hsl(var(--foreground))] hover:border-[hsl(var(--accent))] disabled:opacity-50 mb-4"
        :disabled="loading || googleLoading"
        @click="handleGoogleSignIn"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {{ googleLoading ? 'Signing in...' : 'Continue with Google' }}
      </button>

      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-[hsl(var(--border))]" />
        </div>
        <div class="relative flex justify-center text-xs">
          <span class="bg-[hsl(var(--background))] px-2 text-[hsl(var(--muted-foreground))]">or with email</span>
        </div>
      </div>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label for="login-email" class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Email</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            inputmode="email"
            class="w-full px-4 py-2 rounded-lg border border-[hsl(var(--input))] focus:border-[hsl(var(--primary))]"
            placeholder="you@example.com"
          >
        </div>
        <div>
          <label for="login-password" class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Password</label>
          <input
            id="login-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            required
            autocomplete="current-password"
            class="w-full px-4 py-2 rounded-lg border border-[hsl(var(--input))] focus:border-[hsl(var(--primary))]"
            placeholder="••••••••"
          >
          <div class="mt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              class="text-xs font-medium text-[hsl(var(--muted-foreground))] hover:underline"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? 'Hide password' : 'Show password' }}
            </button>
            <button
              type="button"
              class="text-xs font-semibold text-[hsl(var(--golden-900))] hover:underline disabled:opacity-50"
              :disabled="resetSending"
              @click="handlePasswordReset"
            >
              {{ resetSending ? 'Sending…' : 'Forgot password?' }}
            </button>
          </div>
        </div>
        <p v-if="notice" role="status" class="text-sm text-emerald-800">{{ notice }}</p>
        <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
        <button
          type="submit"
          class="w-full py-2.5 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--accent))] font-semibold hover:opacity-90 disabled:opacity-50"
          :disabled="loading"
        >
          {{ loading ? 'Signing in...' : 'Sign in with email' }}
        </button>
      </form>
      <p class="mt-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
        New user?
        <NuxtLink :to="signupLink" class="text-[hsl(var(--golden-900))] font-medium underline">Create an account</NuxtLink>
      </p>
      <p class="mt-2 text-center text-xs text-[hsl(var(--muted-foreground))]">
        By continuing you agree to our
        <NuxtLink to="/privacy" class="font-medium text-[hsl(var(--golden-900))] hover:underline">Privacy</NuxtLink>
        and
        <NuxtLink to="/policy" class="font-medium text-[hsl(var(--golden-900))] hover:underline">Policy</NuxtLink>.
      </p>
      <p class="mt-2 text-center">
        <NuxtLink to="/" class="text-sm text-[hsl(var(--muted-foreground))] hover:underline">Back to home</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const googleLoading = ref(false)
const auth = useAuth()
const route = useRoute()

function safeRedirect() {
  const path = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return '/play'
  return path
}

const notice = ref('')
const resetSending = ref(false)
const showPassword = ref(false)
const { authErrorMessage } = useAuthErrors()

const signupLink = computed(() => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  return redirect ? { path: '/signup', query: { redirect } } : '/signup'
})

async function handleSubmit() {
  error.value = ''
  notice.value = ''
  loading.value = true
  try {
    await auth.signIn(email.value, password.value)
    await navigateTo(safeRedirect())
  } catch (e: unknown) {
    error.value = authErrorMessage(e, 'Could not sign you in. Please try again.')
  } finally {
    loading.value = false
  }
}

async function handleGoogleSignIn() {
  error.value = ''
  notice.value = ''
  googleLoading.value = true
  try {
    await auth.signInWithGoogle()
    await navigateTo(safeRedirect())
  } catch (e: unknown) {
    error.value = authErrorMessage(e, 'Could not sign you in with Google. Please try again.')
  } finally {
    googleLoading.value = false
  }
}

async function handlePasswordReset() {
  error.value = ''
  notice.value = ''
  if (!email.value.trim()) {
    error.value = 'Enter your email address first, then tap Forgot password.'
    return
  }
  resetSending.value = true
  try {
    await auth.sendPasswordReset(email.value)
    // Deliberately the same wording whether or not the account exists, so this
    // cannot be used to find out who has registered.
    notice.value = `If an account exists for ${email.value.trim()}, a reset link is on its way. Check your spam folder too.`
  } catch (e: unknown) {
    error.value = authErrorMessage(e, 'Could not send the reset email. Please try again.')
  } finally {
    resetSending.value = false
  }
}

usePageSeo('Sign in', 'Sign in to log your niyams, keep your game streaks and manage your Bhaktiras account.')
</script>
