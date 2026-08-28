<template>
  <div class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[hsl(var(--primary))] p-6">
    <div class="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-[hsl(var(--accent))]/20 blur-3xl" />
    <div class="relative z-10 w-full max-w-md">
      <div class="mb-8 text-center">
        <h1 class="font-display text-3xl font-bold text-white">Management portal</h1>
        <p class="mt-2 text-sm text-white/70">Sign in to update timeline, events, and games</p>
      </div>
      <div class="rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[hsl(var(--border))] bg-white py-2.5 font-semibold text-[hsl(var(--foreground))] hover:border-[hsl(var(--accent))] disabled:opacity-50"
          :disabled="loading || googleLoading"
          @click="onGoogle"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {{ googleLoading ? 'Signing in…' : 'Continue with Google' }}
        </button>
        <p v-if="error" class="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{{ error }}</p>

        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-[hsl(var(--border))]" />
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="bg-white px-2 text-[hsl(var(--muted-foreground))]">or with email</span>
          </div>
        </div>

        <form class="space-y-4" @submit.prevent="onSubmit">
          <div>
            <label class="admin-label">Admin email</label>
            <input v-model="email" type="email" required class="admin-input" placeholder="you@sksswoolwich.org">
          </div>
          <div>
            <label class="admin-label">Password</label>
            <input v-model="password" type="password" required minlength="6" class="admin-input" placeholder="••••••••">
          </div>
          <button type="submit" class="btn-primary w-full" :disabled="loading || googleLoading">
            {{ loading ? 'Signing in…' : 'Secure login' }}
          </button>
        </form>
      </div>
      <p class="mt-6 text-center">
        <NuxtLink to="/" class="text-sm text-white/80 hover:text-white">Back to website</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank', middleware: 'admin' })

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const googleLoading = ref(false)
const { signIn, signInWithGoogle, signOut } = useAuth()
const { refreshAdmin, isAdminUser } = useAdminAccess()

async function enterIfAdmin() {
  await refreshAdmin()
  if (!isAdminUser.value) {
    await signOut()
    error.value = 'This account is not an admin. Add admins/{your Auth UID} with name and active: true.'
    return false
  }
  await navigateTo('/admin')
  return true
}

async function onGoogle() {
  error.value = ''
  googleLoading.value = true
  try {
    await signInWithGoogle()
    await enterIfAdmin()
  } catch (e) {
    error.value = (e as { message?: string })?.message || 'Google sign in failed.'
    console.error(e)
  } finally {
    googleLoading.value = false
  }
}

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await signIn(email.value, password.value)
    await enterIfAdmin()
  } catch (e) {
    error.value = 'Invalid credentials or unauthorized access.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

useHead({ title: 'Admin login · Bhaktiras' })
</script>
