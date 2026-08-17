<template>
  <div class="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-sm">
      <h1 class="text-2xl font-bold text-[hsl(var(--foreground))] text-center mb-2">Create account</h1>
      <p class="text-sm text-[hsl(var(--muted-foreground))] text-center mb-6">
        Sign up to save your scores and see your greeting across the app.
      </p>

      <label class="mb-5 flex items-start gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-sm">
        <input
          v-model="acceptedPolicies"
          type="checkbox"
          class="mt-0.5 h-4 w-4 shrink-0 rounded"
        >
        <span class="leading-relaxed text-[hsl(var(--muted-foreground))]">
          I have read and agree to the
          <NuxtLink to="/privacy" target="_blank" class="font-semibold text-[hsl(var(--accent))] underline">Privacy Policy</NuxtLink>
          and
          <NuxtLink to="/policy" target="_blank" class="font-semibold text-[hsl(var(--accent))] underline">Site Policy</NuxtLink>.
        </span>
      </label>

      <!-- Google sign up -->
      <button
        type="button"
        class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))] font-semibold text-[hsl(var(--foreground))] hover:border-[hsl(var(--accent))] disabled:opacity-50 mb-4"
        :disabled="loading || googleLoading || !acceptedPolicies"
        @click="handleGoogleSignUp"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {{ googleLoading ? 'Signing up...' : 'Sign up with Google' }}
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
          <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-2 rounded-lg border border-[hsl(var(--border))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20 focus:border-[hsl(var(--primary))]"
            placeholder="you@example.com"
          >
        </div>
        <div>
          <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            class="w-full px-4 py-2 rounded-lg border border-[hsl(var(--border))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20 focus:border-[hsl(var(--primary))]"
            placeholder="At least 6 characters"
          >
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button
          type="submit"
          class="w-full py-2.5 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--accent))] font-semibold hover:opacity-90 disabled:opacity-50"
          :disabled="loading || !acceptedPolicies"
        >
          {{ loading ? 'Creating account...' : 'Create account with email' }}
        </button>
      </form>
      <p class="mt-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Already have an account?
        <NuxtLink :to="loginLink" class="text-[hsl(var(--accent))] font-medium underline">Sign in</NuxtLink>
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
const acceptedPolicies = ref(false)
const auth = useAuth()
const route = useRoute()

function safeRedirect() {
  const path = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return '/play'
  return path
}

const loginLink = computed(() => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  return redirect ? { path: '/login', query: { redirect } } : '/login'
})

async function handleSubmit() {
  error.value = ''
  if (!acceptedPolicies.value) {
    error.value = 'Please accept the Privacy Policy and Site Policy to create an account.'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }
  loading.value = true
  try {
    await auth.signUp(email.value, password.value)
    await auth.recordPolicyAcceptance()
    await navigateTo(safeRedirect())
  } catch (e: unknown) {
    error.value = (e as { message?: string })?.message ?? 'Sign up failed'
  } finally {
    loading.value = false
  }
}

async function handleGoogleSignUp() {
  error.value = ''
  if (!acceptedPolicies.value) {
    error.value = 'Please accept the Privacy Policy and Site Policy to create an account.'
    return
  }
  googleLoading.value = true
  try {
    await auth.signInWithGoogle()
    await auth.recordPolicyAcceptance()
    await navigateTo(safeRedirect())
  } catch (e: unknown) {
    const message = (e as { message?: string })?.message || ''
    error.value = message.includes('auth/account-exists-with-different-credential')
      ? 'An account already exists with this email. Sign in with email and password, then link Google from Your account.'
      : message || 'Sign up with Google failed'
  } finally {
    googleLoading.value = false
  }
}
</script>
