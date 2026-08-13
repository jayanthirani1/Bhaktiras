<template>
  <div class="space-y-2" @click.stop>
    <input ref="fileRef" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="onFile">
    <div v-if="modelValue" class="space-y-3">
      <img :src="modelValue" alt="Uploaded image" class="w-full h-auto rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] object-contain">
      <div class="space-y-2">
        <input
          :value="modelValue"
          type="url"
          class="admin-input font-mono text-xs"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        >
        <div class="flex gap-2">
          <button type="button" class="admin-btn-secondary text-xs" :disabled="uploading" @click.prevent="fileRef?.click()">
            {{ uploading ? 'Uploading…' : 'Replace' }}
          </button>
          <button type="button" class="admin-btn-danger text-xs" @click.prevent="emit('update:modelValue', '')">
            Remove
          </button>
        </div>
      </div>
    </div>
    <button
      v-else
      type="button"
      class="w-full rounded-xl border-2 border-dashed border-[hsl(var(--border))] px-4 py-8 text-sm text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--accent))]"
      :disabled="uploading"
      @click.prevent="fileRef?.click()"
    >
      {{ uploading ? 'Uploading…' : 'Click to upload image' }}
    </button>
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { getApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, type FirebaseStorage } from 'firebase/storage'

const props = defineProps<{ modelValue: string; folder?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const fileRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const error = ref('')

function contentTypeFor(file: File) {
  if (file.type && file.type.startsWith('image/')) return file.type
  const name = file.name.toLowerCase()
  if (name.endsWith('.png')) return 'image/png'
  if (name.endsWith('.webp')) return 'image/webp'
  if (name.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

function getStorageInstance(): FirebaseStorage {
  const nuxt = useNuxtApp()
  const provided = nuxt.$firebaseStorage as FirebaseStorage | null | undefined
  if (provided) return provided
  const config = useRuntimeConfig().public
  const bucket = String(config.firebaseStorageBucket || `${config.firebaseProjectId}.firebasestorage.app`)
  return getStorage(getApp(), `gs://${bucket}`)
}

function explainStorageError(err: unknown) {
  const code = typeof err === 'object' && err && 'code' in err ? String((err as { code?: string }).code) : ''
  const message = err instanceof Error ? err.message : String(err)
  if (code.includes('unauthorized') || message.includes('unauthorized')) {
    return 'Upload blocked by Storage rules. Deploy storage.rules, then retry.'
  }
  if (code.includes('unauthenticated') || message.includes('unauthenticated')) {
    return 'Sign in again, then retry the upload.'
  }
  if (code.includes('retry-limit') || code.includes('unknown') || message.includes('CORS') || message.includes('unknown')) {
    return 'Storage bucket may be wrong or CORS-blocked. Check NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET (use project.firebasestorage.app) and restart the dev server.'
  }
  return message || 'Upload failed.'
}

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  error.value = ''
  uploading.value = true
  try {
    const nuxt = useNuxtApp()
    const auth = (nuxt.$firebaseAuth as Auth | null | undefined) || getAuth(getApp())
    if (!auth.currentUser) throw new Error('Sign in again, then retry the upload.')
    if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
      throw new Error('Please choose a JPG, PNG, WebP or GIF image.')
    }
    if (file.size > 8 * 1024 * 1024) throw new Error('Image must be under 8 MB.')

    const storage = getStorageInstance()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'image.jpg'
    const path = `${props.folder || 'uploads'}/${Date.now()}-${safeName}`
    const r = storageRef(storage, path)
    await uploadBytes(r, file, { contentType: contentTypeFor(file) })
    emit('update:modelValue', await getDownloadURL(r))
  } catch (err) {
    error.value = explainStorageError(err)
  } finally {
    uploading.value = false
    if (fileRef.value) fileRef.value.value = ''
  }
}
</script>
