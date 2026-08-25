<template>
  <div class="space-y-4">
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">Community questions</h1>
        <p class="text-sm text-[hsl(var(--muted-foreground))]">These appear in the prompt dropdown when someone posts a message. Edit, remove, or add questions, then save.</p>
      </div>
      <button type="button" class="admin-btn-secondary" :disabled="saving" @click="addPrompt">Add question</button>
    </div>
    <div v-for="(prompt, index) in prompts" :key="`${index}-${prompt.id}`" class="admin-panel">
      <div class="mb-4 flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-[hsl(var(--primary))]">Question {{ index + 1 }}</p>
        <div class="flex gap-2">
          <button type="button" class="admin-btn-secondary" :disabled="index === 0" @click="move(index, -1)">Up</button>
          <button type="button" class="admin-btn-secondary" :disabled="index === prompts.length - 1" @click="move(index, 1)">Down</button>
          <button type="button" class="admin-btn-danger" @click="removePrompt(index)">Delete</button>
        </div>
      </div>
      <div class="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)]">
        <div>
          <label class="admin-label">ID</label>
          <input v-model="prompt.id" class="admin-input">
        </div>
        <div>
          <label class="admin-label">Question</label>
          <input v-model="prompt.text" class="admin-input">
        </div>
        <label class="inline-flex items-center gap-2 text-sm md:col-span-2"><input v-model="prompt.active" type="checkbox"> Active</label>
      </div>
    </div>
    <button type="button" class="admin-btn" :disabled="saving" @click="savePrompts">{{ saving ? 'Saving…' : 'Save questions' }}</button>
  </div>
</template>

<script setup lang="ts">
import type { CommunityPromptContent } from '~/types'
import { cloneList, communityPromptsFromSource } from '~/data/siteContent'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { item, saving, error, load, save } = useAdminSiteContent()
const prompts = ref<CommunityPromptContent[]>(cloneList(communityPromptsFromSource(undefined)))

function fill() {
  prompts.value = cloneList(item.value.communityPrompts)
}
function move(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= prompts.value.length) return
  const [entry] = prompts.value.splice(index, 1)
  prompts.value.splice(target, 0, entry)
}
function removePrompt(index: number) {
  prompts.value.splice(index, 1)
}
function addPrompt() {
  prompts.value.push({ id: `prompt-${prompts.value.length + 1}`, text: '', active: true })
}
async function savePrompts() {
  const incomplete = prompts.value.find(prompt => !prompt.id.trim() || !prompt.text.trim())
  if (incomplete) {
    error.value = 'Each question needs an ID and text.'
    return
  }
  await save({
    communityPrompts: prompts.value.map((prompt, index) => ({ ...prompt, order: index + 1 }))
  })
  fill()
}

onMounted(async () => {
  await load()
  fill()
})

useHead({ title: 'Community questions · Admin' })
</script>
