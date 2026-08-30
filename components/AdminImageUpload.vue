<template>
  <div class="space-y-3" @click.stop>
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
    <template v-else>
      <div v-if="pickerUrls.length" class="space-y-2">
        <p class="text-xs text-[hsl(var(--muted-foreground))]">Choose an existing poster, or upload a new one below.</p>
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
          <button
            v-for="url in pickerUrls"
            :key="url"
            type="button"
            class="overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] hover:border-[hsl(var(--accent))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--accent))]"
            @click.prevent="emit('update:modelValue', url)"
          >
            <img :src="url" alt="" class="aspect-[4/3] w-full object-cover">
          </button>
        </div>
      </div>
      <button
        type="button"
        class="w-full rounded-xl border-2 border-dashed border-[hsl(var(--border))] px-4 py-8 text-sm text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--accent))]"
        :disabled="uploading"
        @click.prevent="fileRef?.click()"
      >
        {{ uploading ? 'Uploading…' : pickerUrls.length ? 'Upload new image' : 'Click to upload image' }}
      </button>
    </template>
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { getApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, listAll, type FirebaseStorage } from 'firebase/storage'

const props = defineProps<{ modelValue: string; folder?: string; existingUrls?: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const fileRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const error = ref('')
const storageUrls = ref<string[]>([])

const pickerUrls = computed(() => {
  const seen = new Set<string>()
  const urls: string[] = []
  for (const url of [...(props.existingUrls || []), ...storageUrls.value]) {
    const trimmed = url.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    urls.push(trimmed)
  }
  return urls
})

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

async function loadStorageUrls() {
  if (!props.folder) return
  try {
    const storage = getStorageInstance()
    const folderRef = storageRef(storage, props.folder)
    const result = await listAll(folderRef)
    storageUrls.value = await Promise.all(result.items.map(item => getDownloadURL(item)))
  } catch {
    storageUrls.value = []
  }
}

onMounted(() => {
  void loadStorageUrls()
})

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
    const url = await getDownloadURL(r)
    if (!storageUrls.value.includes(url)) storageUrls.value = [url, ...storageUrls.value]
    emit('update:modelValue', url)
  } catch (err) {
    error.value = explainStorageError(err)
  } finally {
    uploading.value = false
    if (fileRef.value) fileRef.value.value = ''
  }
}
</script>
