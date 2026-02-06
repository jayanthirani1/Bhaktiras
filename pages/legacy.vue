<template>
  <div class="min-h-screen bg-stone-50 pb-24 pt-8 md:pt-12 px-4">
    <div class="max-w-3xl mx-auto">
      <PageHeader
        title="Time Capsule 2036"
        subtitle="Leave a message for the future devotees. To be opened on our 20th Anniversary."
      />

      <div class="mt-12">
        <div
          v-if="submitted"
          class="bg-white rounded-3xl p-12 shadow-xl border border-[hsl(var(--primary))]/20 text-center"
        >
          <div class="w-20 h-20 bg-[hsl(var(--primary))]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[hsl(var(--primary))]">
            <IconLock class="w-10 h-10" />
          </div>
          <h3 class="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">Message Sealed Securely</h3>
          <p class="text-[hsl(var(--muted-foreground))] leading-relaxed">
            Thank you for contributing to our legacy. Your words have been preserved
            and will inspire future generations when revealed in 2036.
          </p>
          <button
            type="button"
            class="mt-8 text-[hsl(var(--primary))] font-medium hover:underline"
            @click="submitted = false; message = ''"
          >
            Submit another message
          </button>
        </div>
        <div
          v-else
          class="bg-white rounded-3xl p-8 shadow-xl border border-[hsl(var(--golden-200))] relative overflow-hidden"
        >
          <div class="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--primary))]/5 rounded-bl-full" />
          <div class="flex items-center space-x-2 text-[hsl(var(--primary))] font-bold mb-6 text-sm uppercase tracking-wider">
            <IconSparkles class="w-4 h-4" />
            <span>Future Legacy</span>
          </div>
          <form class="relative z-10" @submit.prevent="handleSubmit">
            <div class="mb-6">
              <label class="block text-[hsl(var(--foreground))] font-medium mb-2">Your Message for 2036</label>
              <textarea
                v-model="message"
                placeholder="What are your hopes for the next 10 years?"
                class="min-h-[200px] w-full resize-none bg-[hsl(var(--golden-50))]/30 border border-[hsl(var(--golden-200))] focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20 rounded-xl text-lg leading-relaxed p-4"
              />
            </div>
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p class="text-xs text-[hsl(var(--muted-foreground))]/80 flex items-center">
                <IconLock class="w-3 h-3 mr-1" />
                Encrypted & Stored until 2036
              </p>
              <button
                type="submit"
                :disabled="!message.trim() || createMessage.isPending.value"
                class="w-full sm:w-auto px-8 py-3 rounded-xl bg-[hsl(var(--foreground))] text-white font-semibold shadow-lg shadow-[hsl(var(--foreground))]/20 hover:bg-[hsl(var(--foreground))]/90 disabled:opacity-70 transition-all flex items-center justify-center space-x-2"
              >
                <IconLoader2 v-if="createMessage.isPending.value" class="w-4 h-4 animate-spin" />
                <IconSend v-else class="w-4 h-4" />
                <span>{{ createMessage.isPending.value ? 'Sealing...' : 'Seal in Time Capsule' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconLock, IconSend, IconLoader2, IconSparkles } from '@tabler/icons-vue'
const message = ref('')
const submitted = ref(false)
const createMessage = useCreateTimeCapsuleMessage()

async function handleSubmit() {
  if (!message.value.trim()) return
  try {
    await createMessage.create({ message: message.value })
    submitted.value = true
  } catch (_e) {
    // show error
  }
}
</script>
