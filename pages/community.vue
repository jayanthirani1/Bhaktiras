<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-24 pt-8 md:pt-12 px-4">
    <div class="max-w-6xl mx-auto">
      <PageHeader
        title="Our Community"
        subtitle="Like a guest book or the Lee Valley message wall — leave an anonymous note. What does this mandir mean to you?"
      />

      <div class="mb-6 flex flex-wrap justify-center gap-2">
        <button
          v-for="p in prompts"
          :key="p"
          type="button"
          class="max-w-full rounded-full px-3 py-1.5 text-left text-xs font-medium transition-colors sm:text-sm"
          :class="form.prompt === p
            ? 'bg-[hsl(var(--primary))] text-white'
            : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]'"
          @click="form.prompt = p; isFormOpen = true"
        >
          {{ p }}
        </button>
      </div>

      <div class="text-center mb-10">
        <button type="button" class="btn-primary text-sm" @click="isFormOpen = !isFormOpen">
          Leave a message
        </button>
      </div>

      <div v-show="isFormOpen" class="mb-12">
        <div class="card-surface mx-auto max-w-lg p-6 sm:p-8">
          <h3 class="text-center font-display text-xl font-semibold">{{ form.prompt || 'Your message' }}</h3>
          <p class="mt-1 text-center text-xs text-[hsl(var(--muted-foreground))]">Anonymous by default — no names on the wall.</p>
          <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
            <div>
              <label class="mb-1 block text-sm font-medium">Message</label>
              <textarea
                v-model="form.message"
                rows="4"
                maxlength="280"
                placeholder="Write from the heart…"
                class="w-full resize-none rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 px-4 py-3 focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/15"
              />
              <p class="mt-1 text-right text-[10px] text-[hsl(var(--muted-foreground))]">{{ form.message.length }}/280</p>
              <p v-if="errors.message" class="text-sm text-red-600">{{ errors.message }}</p>
            </div>
            <label class="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
              <input v-model="form.signName" type="checkbox" class="rounded border-[hsl(var(--border))]">
              I’d like to sign my name (optional)
            </label>
            <input
              v-if="form.signName"
              v-model="form.name"
              type="text"
              maxlength="50"
              placeholder="Your name"
              class="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 px-4 py-2"
            >
            <button type="submit" :disabled="createMessage.isPending.value" class="btn-primary w-full">
              {{ createMessage.isPending.value ? 'Posting…' : 'Post anonymously' }}
            </button>
          </form>
        </div>
      </div>

      <div v-if="isLoading" class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 6" :key="i" class="h-40 rounded-2xl bg-[hsl(var(--muted))] animate-pulse" />
      </div>
      <div v-else class="columns-1 gap-5 space-y-5 md:columns-2 lg:columns-3">
        <article
          v-for="msg in messages"
          :key="msg.id"
          class="card-surface break-inside-avoid p-5 sm:p-6"
        >
          <p v-if="msg.prompt" class="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--accent))]">
            {{ msg.prompt }}
          </p>
          <p class="mt-3 font-serif text-lg italic leading-relaxed text-[hsl(var(--foreground))]/90">
            “{{ msg.message }}”
          </p>
          <p class="mt-4 text-xs font-medium text-[hsl(var(--muted-foreground))]">{{ msg.name }}</p>
        </article>
        <p v-if="messages.length === 0" class="text-center text-sm text-[hsl(var(--muted-foreground))]">
          Be the first to leave a note on the wall.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { COMMUNITY_PROMPTS } from '~/data/communityPrompts'

const { messages, isLoading, refetch } = useGratitudeMessages()
const createMessage = useCreateGratitudeMessage()
const prompts = COMMUNITY_PROMPTS
const isFormOpen = ref(false)
const form = reactive({ prompt: COMMUNITY_PROMPTS[0] || '', message: '', name: '', signName: false })
const errors = reactive<{ message?: string }>({})

async function onSubmit() {
  errors.message = undefined
  if (form.message.trim().length < 5) {
    errors.message = 'A few more words, please (5+ characters).'
    return
  }
  if (form.signName && form.name.trim().length < 2) {
    errors.message = 'Add a name, or leave it anonymous.'
    return
  }
  try {
    await createMessage.create({
      message: form.message,
      prompt: form.prompt,
      anonymous: !form.signName,
      name: form.signName ? form.name : undefined
    })
    await refetch()
    form.message = ''
    form.name = ''
    form.signName = false
    isFormOpen.value = false
  } catch (e) {
    errors.message = (e as Error).message
  }
}
</script>
