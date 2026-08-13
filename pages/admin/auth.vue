<template>
  <div class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[hsl(var(--primary))] p-6">
    <div class="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-[hsl(var(--accent))]/20 blur-3xl" />
    <div class="relative z-10 w-full max-w-md">
      <div class="mb-8 text-center">
        <h1 class="font-display text-3xl font-bold text-white">Management portal</h1>
        <p class="mt-2 text-sm text-white/70">Sign in to update timeline, events, and games</p>
      </div>
      <div class="rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <form class="space-y-4" @submit.prevent="onSubmit">
          <div>
            <label class="admin-label">Admin email</label>
            <input v-model="email" type="email" required class="admin-input" placeholder="you@sksswoolwich.org">
          </div>
          <div>
            <label class="admin-label">Password</label>
            <input v-model="password" type="password" required minlength="6" class="admin-input" placeholder="••••••••">
          </div>
          <p v-if="error" class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{{ error }}</p>
          <button type="submit" class="btn-primary w-full" :disabled="loading">
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
const { signIn, signOut } = useAuth()
const { refreshAdmin, isAdminUser } = useAdminAccess()

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await signIn(email.value, password.value)
    await refreshAdmin()
    if (!isAdminUser.value) {
      await signOut()
      error.value = 'This account is not an admin. Add admins/{your Auth UID} with name, role, and active: true.'
      return
    }
    await navigateTo('/admin')
  } catch (e) {
    error.value = 'Invalid credentials or unauthorized access.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

useHead({ title: 'Admin login · Bhaktiras' })
</script>
