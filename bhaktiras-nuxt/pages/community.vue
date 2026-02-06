<template>
  <div class="min-h-screen bg-stone-50 pb-24 pt-8 md:pt-12 px-4">
    <div class="max-w-6xl mx-auto">
      <PageHeader
        title="Wall of Gratitude"
        subtitle="Share your experiences, prayers, and heartfelt thanks."
      />

      <div class="text-center mb-12">
        <button
          type="button"
          class="inline-flex items-center space-x-2 px-6 py-3 bg-[hsl(var(--primary))] text-white rounded-full shadow-lg shadow-[hsl(var(--primary))]/25 hover:shadow-xl hover:bg-[hsl(var(--primary))]/90 transition-all active:scale-95"
          @click="isFormOpen = !isFormOpen"
        >
          <IconHeart class="w-5 h-5 fill-current" />
          <span class="font-semibold">Share Your Gratitude</span>
        </button>
      </div>

      <div v-show="isFormOpen" class="mb-12 overflow-hidden">
        <div class="bg-white max-w-lg mx-auto p-8 rounded-2xl shadow-xl border border-[hsl(var(--primary))]/20">
          <h3 class="text-xl font-bold text-[hsl(var(--foreground))] mb-6 text-center">Write a Message</h3>
          <form class="space-y-6" @submit.prevent="onSubmit">
            <div>
              <label class="block text-[hsl(var(--foreground))] font-medium mb-1">Your Name</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="Enter your name"
                class="w-full px-4 py-2 rounded-lg bg-[hsl(var(--golden-50))]/50 border border-[hsl(var(--golden-200))] focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
              >
              <p v-if="errors.name" class="text-red-500 text-sm mt-1">{{ errors.name }}</p>
            </div>
            <div>
              <label class="block text-[hsl(var(--foreground))] font-medium mb-1">Your Message</label>
              <textarea
                v-model="form.message"
                placeholder="Share your thoughts..."
                rows="4"
                class="w-full px-4 py-2 rounded-lg resize-none bg-[hsl(var(--golden-50))]/50 border border-[hsl(var(--golden-200))] focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
              />
              <p v-if="errors.message" class="text-red-500 text-sm mt-1">{{ errors.message }}</p>
            </div>
            <button
              type="submit"
              :disabled="createMessage.isPending.value"
              class="w-full h-12 rounded-xl bg-[hsl(var(--foreground))] text-white font-semibold flex items-center justify-center space-x-2 hover:bg-[hsl(var(--foreground))]/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              <IconLoader2 v-if="createMessage.isPending.value" class="w-5 h-5 animate-spin" />
              <IconSend v-else class="w-5 h-5" />
              <span>{{ createMessage.isPending.value ? 'Posting...' : 'Post Message' }}</span>
            </button>
          </form>
        </div>
      </div>

      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 6" :key="i" class="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
      <div v-else class="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="break-inside-avoid bg-white p-6 rounded-2xl shadow-sm border border-[hsl(var(--golden-100))] hover:shadow-md transition-shadow"
        >
          <div class="mb-4 text-[hsl(var(--primary))]/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14.017 21L14.017 18C14.017 16.8954 13.1216 16 12.017 16H9.01699V12.9996H12.017V7.9996H5.01699V14.9996H8.01699V17.9996H5.01699C3.91243 17.9996 3.01699 17.1042 3.01699 16V6.00041C3.01699 4.89584 3.91243 4.00041 5.01699 4.00041H14.017C15.1216 4.00041 16.017 4.89584 16.017 6.00041V11.0004H19.017V8.00041H21.017V16H19.017V21H14.017ZM20.017 14H18.017V12H20.017V14ZM9.01699 10.9996V7.9996H7.01699V10.9996H9.01699Z" />
            </svg>
          </div>
          <p class="text-[hsl(var(--foreground))]/80 leading-relaxed font-serif italic text-lg mb-6">
            "{{ msg.message }}"
          </p>
          <div class="flex items-center justify-between border-t border-[hsl(var(--golden-100))] pt-4">
            <span class="font-bold text-[hsl(var(--foreground))] text-sm">{{ msg.name }}</span>
            <IconHeart class="w-4 h-4 text-red-400 fill-red-400" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconHeart, IconSend, IconLoader2 } from '@tabler/icons-vue'

const { messages, isLoading, refetch } = useGratitudeMessages()
const createMessage = useCreateGratitudeMessage()
const isFormOpen = ref(false)
const form = reactive({ name: '', message: '' })
const errors = reactive<{ name?: string; message?: string }>({})

function validate() {
  errors.name = undefined
  errors.message = undefined
  if (form.name.length < 2) errors.name = 'Name must be at least 2 characters'
  if (form.name.length > 50) errors.name = 'Name too long'
  if (form.message.length < 5) errors.message = 'Message must be at least 5 characters'
  if (form.message.length > 200) errors.message = 'Message too long'
  return !errors.name && !errors.message
}

async function onSubmit() {
  if (!validate()) return
  try {
    await createMessage.create({ name: form.name, message: form.message })
    await refetch()
    form.name = ''
    form.message = ''
    isFormOpen.value = false
    // Could add a toast here
  } catch (e) {
    errors.message = (e as Error).message
  }
}
</script>
