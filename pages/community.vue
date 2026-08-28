<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-24 pt-8 md:pt-12 px-4">
    <div class="max-w-6xl mx-auto">
      <PageHeader
        title="Our Community"
        subtitle="Share a note on the wall, and find yourself in the event photos."
      />

      <section
        v-if="SITE.guestCamUrl"
        class="card-surface mb-10 overflow-hidden"
      >
        <div class="bg-gradient-to-br from-[hsl(var(--golden-50))] via-[hsl(var(--background))] to-[hsl(var(--muted))] p-6 sm:p-8">
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--golden-900))]">
            Event photos
          </p>
          <h2 class="mt-2 font-display text-2xl font-semibold text-[hsl(var(--primary))] sm:text-3xl">
            Find your face in the gallery
          </h2>
          <p class="mt-3 max-w-xl text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
            Upload photos from your phone, or use GuestCam’s MagicFind to take a selfie and see every shot you’re in — no app download needed.
          </p>
          <a
            :href="SITE.guestCamUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-primary mt-6 inline-flex items-center gap-2 text-sm"
          >
            <IconCamera class="h-4 w-4" />
            {{ SITE.guestCamLabel }}
            <IconExternalLink class="h-4 w-4" />
          </a>
        </div>
      </section>

      <div class="text-center mb-10">
        <button
          v-if="isLoggedIn"
          type="button"
          class="btn-primary text-sm"
          @click="isFormOpen = !isFormOpen"
        >
          Post message
        </button>
        <div v-else class="card-surface mx-auto max-w-md p-6">
          <p class="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
            Sign in to add your message to the wall. You can still choose to post
            it anonymously — signing in only keeps anyone from posting as someone else.
          </p>
          <NuxtLink to="/login?redirect=/community" class="btn-primary mt-4 inline-flex text-sm">
            Sign in to post
          </NuxtLink>
        </div>
      </div>

      <div v-if="isFormOpen && isLoggedIn" class="mb-12">
        <div class="card-surface mx-auto max-w-lg p-6 sm:p-8">
          <h3 class="text-center font-display text-xl font-semibold text-[hsl(var(--primary))]">Your message</h3>
          <p class="mt-1 text-center text-xs text-[hsl(var(--muted-foreground))]">
            Leave the name blank to post anonymously.
          </p>
          <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
            <div v-if="prompts.length">
              <label class="mb-1 block text-sm font-medium" for="community-prompt">Prompt</label>
              <select
                id="community-prompt"
                v-model="form.prompt"
                class="w-full rounded-xl border border-[hsl(var(--golden-200))] bg-[hsl(var(--muted))]/40 px-4 py-2.5 text-sm"
              >
                <option value="" disabled>Choose a prompt…</option>
                <option v-for="p in prompts" :key="p" :value="p">{{ p }}</option>
              </select>
              <p v-if="errors.prompt" class="mt-1 text-sm text-red-600">{{ errors.prompt }}</p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium">Your name</label>
              <input
                v-model="form.name"
                type="text"
                maxlength="50"
                placeholder="Optional — leave blank for Anonymous"
                class="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 px-4 py-2"
              >
            </div>
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
            <button type="submit" :disabled="pending" class="btn-primary w-full">
              {{ pending ? 'Posting…' : (form.name.trim() ? 'Post message' : 'Post anonymously') }}
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
          <p v-if="msg.prompt" class="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--golden-900))]">
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
import { IconCamera, IconExternalLink } from '@tabler/icons-vue'
import { SITE } from '~/data/site'

const { messages, isLoading, refetch } = useGratitudeMessages()
const createMessage = useCreateGratitudeMessage()
const { userName, isLoggedIn } = useAuth()
const { communityPrompts } = useSiteContent()
const prompts = communityPrompts
const isFormOpen = ref(false)
const form = reactive({ prompt: '', message: '', name: '' })
const errors = reactive<{ message?: string; prompt?: string }>({})
const pending = computed(() => createMessage.isPending.value)

watch(
  [isLoggedIn, userName],
  () => {
    if (isLoggedIn.value && userName.value && !form.name) form.name = userName.value
  },
  { immediate: true }
)

watch(prompts, (value) => {
  if (!value.includes(form.prompt)) form.prompt = ''
}, { immediate: true })

async function onSubmit() {
  errors.message = undefined
  errors.prompt = undefined
  if (prompts.value.length && !form.prompt) {
    errors.prompt = 'Please choose a prompt.'
    return
  }
  if (form.message.trim().length < 5) {
    errors.message = 'A few more words, please (5+ characters).'
    return
  }
  try {
    const named = form.name.trim().length >= 2
    await createMessage.create({
      message: form.message,
      prompt: form.prompt,
      anonymous: !named,
      name: named ? form.name : undefined
    })
    await refetch()
    form.message = ''
    form.prompt = ''
    form.name = isLoggedIn.value && userName.value ? userName.value : ''
    isFormOpen.value = false
  } catch (e) {
    errors.message = (e as Error).message
  }
}

usePageSeo('Our Community', 'Share a memory, a prayer or a word of gratitude on the Bhaktiras community wall.')
</script>
