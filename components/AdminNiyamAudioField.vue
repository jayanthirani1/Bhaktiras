<template>
  <div class="space-y-3" @click.stop>
    <div class="inline-flex rounded-lg border border-[hsl(var(--border))] bg-white p-0.5 text-xs">
      <button
        type="button"
        class="min-h-[36px] rounded-md px-3 py-1 font-semibold transition-colors"
        :class="kind === 'file'
          ? 'bg-[hsl(var(--primary))] text-white'
          : 'text-[hsl(var(--muted-foreground))]'"
        @click.prevent="setKind('file')"
      >
        Upload file
      </button>
      <button
        type="button"
        class="min-h-[36px] rounded-md px-3 py-1 font-semibold transition-colors"
        :class="kind === 'link'
          ? 'bg-[hsl(var(--primary))] text-white'
          : 'text-[hsl(var(--muted-foreground))]'"
        @click.prevent="setKind('link')"
      >
        Add link
      </button>
    </div>

    <template v-if="kind === 'file'">
      <input
        ref="fileRef"
        type="file"
        accept="audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/ogg,audio/webm,audio/x-m4a,.mp3,.m4a,.aac,.wav,.ogg"
        class="hidden"
        @change="onFile"
      >
      <div v-if="modelValue" class="space-y-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-3">
        <p class="truncate text-xs font-medium text-[hsl(var(--foreground))]">{{ fileLabel }}</p>
        <audio :src="modelValue" controls preload="metadata" class="w-full" />
        <div class="flex flex-wrap gap-2">
          <button type="button" class="admin-btn-secondary text-xs" :disabled="uploading" @click.prevent="fileRef?.click()">
            {{ uploading ? 'Uploading…' : 'Replace file' }}
          </button>
          <button type="button" class="admin-btn-danger text-xs" @click.prevent="clear">
            Remove
          </button>
        </div>
      </div>
      <button
        v-else
        type="button"
        class="w-full rounded-xl border-2 border-dashed border-[hsl(var(--border))] px-4 py-8 text-sm text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--accent))]"
        :disabled="uploading"
        @click.prevent="fileRef?.click()"
      >
        {{ uploading ? 'Uploading…' : 'Click to upload audio (MP3, M4A, WAV…)' }}
      </button>
      <p class="text-xs text-[hsl(var(--muted-foreground))]">
        Played in the reading page with a repeat option. Max 40 MB.
      </p>
    </template>

    <template v-else>
      <input
        :value="modelValue"
        type="url"
        class="admin-input"
        placeholder="https://…"
        @input="onLinkInput(($event.target as HTMLInputElement).value)"
      >
      <p class="text-xs text-[hsl(var(--muted-foreground))]">
        Opens in an embedded player when possible (YouTube, Spotify, SoundCloud); otherwise opens in a new tab.
      </p>
      <button
        v-if="modelValue"
        type="button"
        class="admin-btn-danger text-xs"
        @click.prevent="clear"
      >
        Remove link
      </button>
    </template>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { getApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, type FirebaseStorage } from 'firebase/storage'

const props = defineProps<{
  modelValue: string
  kind: 'file' | 'link'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:kind': [value: 'file' | 'link']
}>()

const fileRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const error = ref('')

const fileLabel = computed(() => {
  try {
    const path = decodeURIComponent(new URL(props.modelValue).pathname)
    const name = path.split('/').pop() || 'Audio file'
    return name.replace(/^\d+-/, '')
  } catch {
    return 'Audio file'
  }
})

function setKind(next: 'file' | 'link') {
  if (next === props.kind) return
  error.value = ''
  emit('update:kind', next)
  emit('update:modelValue', '')
}

function clear() {
  error.value = ''
  emit('update:modelValue', '')
}

function onLinkInput(value: string) {
  error.value = ''
  emit('update:modelValue', value.trim())
}

function contentTypeFor(file: File) {
  if (file.type && file.type.startsWith('audio/')) return file.type
  const name = file.name.toLowerCase()
  if (name.endsWith('.m4a') || name.endsWith('.mp4')) return 'audio/mp4'
  if (name.endsWith('.aac')) return 'audio/aac'
  if (name.endsWith('.wav')) return 'audio/wav'
  if (name.endsWith('.ogg')) return 'audio/ogg'
  if (name.endsWith('.webm')) return 'audio/webm'
  return 'audio/mpeg'
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
    return 'Storage bucket may be wrong or CORS-blocked. Check NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET and restart the dev server.'
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
    if (!file.type.startsWith('audio/') && !/\.(mp3|m4a|aac|wav|ogg|webm)$/i.test(file.name)) {
      throw new Error('Please choose an MP3, M4A, AAC, WAV or OGG audio file.')
    }
    if (file.size > 40 * 1024 * 1024) throw new Error('Audio must be under 40 MB.')

    const storage = getStorageInstance()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'audio.mp3'
    const path = `niyam-audio/${Date.now()}-${safeName}`
    const r = storageRef(storage, path)
    await uploadBytes(r, file, { contentType: contentTypeFor(file) })
    const url = await getDownloadURL(r)
    emit('update:kind', 'file')
    emit('update:modelValue', url)
  } catch (err) {
    error.value = explainStorageError(err)
  } finally {
    uploading.value = false
    if (fileRef.value) fileRef.value.value = ''
  }
}
</script>
