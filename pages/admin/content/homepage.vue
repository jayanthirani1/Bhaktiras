<template>
  <div class="space-y-4">
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">Homepage tiles</h1>
        <p class="text-sm text-[hsl(var(--muted-foreground))]">These are the tiles currently on the homepage. Edit, remove, or add tiles, then save.</p>
      </div>
      <button type="button" class="admin-btn-secondary" :disabled="saving" @click="addTile">Add tile</button>
    </div>
    <div v-for="(tile, index) in tiles" :key="`${index}-${tile.id}`" class="admin-panel">
      <div class="mb-4 flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-[hsl(var(--primary))]">Tile {{ index + 1 }}</p>
        <div class="flex gap-2">
          <button type="button" class="admin-btn-secondary" :disabled="index === 0" @click="move(index, -1)">Up</button>
          <button type="button" class="admin-btn-secondary" :disabled="index === tiles.length - 1" @click="move(index, 1)">Down</button>
          <button type="button" class="admin-btn-danger" @click="removeTile(index)">Delete</button>
        </div>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label class="admin-label">ID</label>
          <input v-model="tile.id" class="admin-input">
        </div>
        <div>
          <label class="admin-label">Icon</label>
          <select v-model="tile.icon" class="admin-input">
            <option v-for="option in SITE_ICON_OPTIONS" :key="option.key" :value="option.key">{{ option.label }}</option>
          </select>
        </div>
        <div>
          <label class="admin-label">Title</label>
          <input v-model="tile.title" class="admin-input">
        </div>
        <div>
          <label class="admin-label">Link</label>
          <input v-model="tile.href" class="admin-input">
        </div>
        <div class="md:col-span-2">
          <label class="admin-label">Description</label>
          <input v-model="tile.desc" class="admin-input">
        </div>
        <label class="inline-flex items-center gap-2 text-sm"><input v-model="tile.active" type="checkbox"> Active</label>
        <label class="inline-flex items-center gap-2 text-sm"><input v-model="tile.external" type="checkbox"> External link</label>
      </div>
    </div>
    <button type="button" class="admin-btn" :disabled="saving" @click="saveTiles">{{ saving ? 'Saving…' : 'Save homepage tiles' }}</button>
  </div>
</template>

<script setup lang="ts">
import type { HomeTileContent } from '~/types'
import { cloneList, homeTilesFromSource, SITE_ICON_OPTIONS } from '~/data/siteContent'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { item, saving, error, load, save } = useAdminSiteContent()
const tiles = ref<HomeTileContent[]>(cloneList(homeTilesFromSource(undefined)))

function fill() {
  tiles.value = cloneList(item.value.homeTiles)
}
function move(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= tiles.value.length) return
  const [entry] = tiles.value.splice(index, 1)
  tiles.value.splice(target, 0, entry)
}
function removeTile(index: number) {
  tiles.value.splice(index, 1)
}
function addTile() {
  tiles.value.push({ id: `tile-${tiles.value.length + 1}`, title: '', desc: '', href: '/', icon: 'home', active: true })
}
async function saveTiles() {
  const incomplete = tiles.value.find(tile => !tile.id.trim() || !tile.title.trim() || !tile.href.trim())
  if (incomplete) {
    error.value = 'Each tile needs an ID, title and link.'
    return
  }
  await save({
    homeTiles: tiles.value.map((tile, index) => ({ ...tile, order: index + 1 }))
  })
  fill()
}

onMounted(async () => {
  await load()
  fill()
})

useHead({ title: 'Homepage tiles · Admin' })
</script>
