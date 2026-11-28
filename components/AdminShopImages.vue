<template>
  <div class="space-y-3">
    <input ref="fileRef" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple class="hidden" @change="onFiles">
    <ul v-if="modelValue.length" class="grid grid-cols-3 gap-2 sm:grid-cols-4">
      <li v-for="(url, index) in modelValue" :key="url" class="relative overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
        <img :src="url" :alt="`Photo ${index + 1}`" class="aspect-square w-full object-cover">
        <span v-if="index === 0" class="absolute left-1 top-1 rounded bg-[hsl(var(--primary))] px-1.5 py-0.5 text-[10px] font-bold text-white">Cover</span>
        <div class="flex justify-between gap-1 bg-white/95 p-1">
          <button type="button" class="rounded px-1.5 text-xs font-semibold text-[hsl(var(--primary))] disabled:opacity-30" :disabled="index === 0" aria-label="Move earlier" @click="move(index, -1)">←</button>
          <button type="button" class="rounded px-1.5 text-xs font-semibold text-red-600" aria-label="Remove photo" @click="remove(index)">✕</button>
          <button type="button" class="rounded px-1.5 text-xs font-semibold text-[hsl(var(--primary))] disabled:opacity-30" :disabled="index === modelValue.length - 1" aria-label="Move later" @click="move(index, 1)">→</button>
        </div>
      </li>
    </ul>
    <button
      v-if="modelValue.length < SHOP_MAX_IMAGES"
      type="button"
      class="w-full rounded-xl border-2 border-dashed border-[hsl(var(--border))] px-4 py-5 text-sm text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--accent))]"
      :disabled="uploading"
      @click.prevent="fileRef?.click()"
    >
      {{ uploading ? 'Uploading…' : modelValue.length ? 'Add more photos' : 'Upload photos' }}
    </button>
    <p class="text-xs text-[hsl(var(--muted-foreground))]">Up to {{ SHOP_MAX_IMAGES }} photos, 8 MB each. The first is the cover.</p>
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { getApp } from 'firebase/app'
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes, type FirebaseStorage } from 'firebase/storage'
import { SHOP_MAX_IMAGES } from '~/data/shop'

const props = defineProps<{ modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const fileRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const error = ref('')

function storage(): FirebaseStorage {
  const provided = useNuxtApp().$firebaseStorage as FirebaseStorage | null | undefined
  return provided || getStorage(getApp())
}

/**
 * Product photos are shown on phones, often on mobile data at the mandir. A
 * photo straight off a phone camera is 3–8 MB; scaled to 1600px on its long
 * side and re-encoded it is a few hundred KB and looks the same on screen.
 * GIFs (possibly animated) and images already small enough go up untouched,
 * as does anything the browser cannot decode.
 */
const MAX_EDGE = 1600

async function shrinkForWeb(file: File): Promise<{ blob: Blob; type: string; name: string }> {
  const original = { blob: file as Blob, type: file.type, name: file.name }
  if (file.type === 'image/gif' || typeof createImageBitmap !== 'function') return original
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size < 600 * 1024) {
      bitmap.close()
      return original
    }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext('2d')
    if (!context) return original
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    // PNG keeps transparency (logos on clear backgrounds); photos go to JPEG.
    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, 0.85))
    if (!blob || blob.size >= file.size) return original
    const name = type === 'image/jpeg' ? file.name.replace(/\.[a-z0-9]+$/i, '') + '.jpg' : file.name
    return { blob, type, name }
  } catch {
    return original
  }
}

function move(index: number, by: number) {
  const next = [...props.modelValue]
  const [item] = next.splice(index, 1)
  next.splice(index + by, 0, item)
  emit('update:modelValue', next)
}

function remove(index: number) {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}

async function onFiles(event: Event) {
  const files = [...((event.target as HTMLInputElement).files || [])]
  if (!files.length) return
  error.value = ''
  uploading.value = true
  const urls = [...props.modelValue]
  try {
    for (const file of files) {
      if (urls.length >= SHOP_MAX_IMAGES) break
      if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error(`${file.name}: please choose a JPG, PNG, WebP or GIF image.`)
      if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name} is over 8 MB.`)
      const upload = await shrinkForWeb(file)
      const safeName = upload.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'photo.jpg'
      const objectRef = storageRef(storage(), `shop/${Date.now()}-${safeName}`)
      await uploadBytes(objectRef, upload.blob, { contentType: upload.type })
      urls.push(await getDownloadURL(objectRef))
      emit('update:modelValue', [...urls])
    }
  } catch (e) {
    const code = typeof e === 'object' && e && 'code' in e ? String((e as { code?: string }).code) : ''
    error.value = code.includes('unauthorized')
      ? 'Upload blocked by Storage rules. Deploy storage.rules, then retry.'
      : (e as Error).message || 'Upload failed.'
  } finally {
    uploading.value = false
    if (fileRef.value) fileRef.value.value = ''
  }
}
</script>
