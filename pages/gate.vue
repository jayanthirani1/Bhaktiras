<template>
  <div class="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] px-4 py-12">
    <div class="w-full max-w-sm text-center">
      <h1 class="font-display text-2xl font-bold text-[hsl(var(--foreground))]">Bhaktiras</h1>
      <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
        This site is not public yet. Enter the preview password.
      </p>
      <form class="mt-6 space-y-4 text-left" @submit.prevent="unlock">
        <label for="site-password" class="mb-1 block text-sm font-medium">Password</label>
        <input
          id="site-password"
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          class="w-full rounded-lg border border-[hsl(var(--input))] px-4 py-2 focus:border-[hsl(var(--primary))]"
        >
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button
          type="submit"
          class="w-full rounded-xl bg-[hsl(var(--primary))] py-2.5 font-semibold text-white disabled:opacity-50"
          :disabled="loading"
        >
          {{ loading ? 'Checking…' : 'Enter' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const password = ref('')
const loading = ref(false)
const error = ref('')

async function unlock() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/site-gate', { method: 'POST', body: { password: password.value } })
    await navigateTo('/')
  } catch {
    error.value = 'That password is not right.'
  } finally {
    loading.value = false
  }
}
</script>
