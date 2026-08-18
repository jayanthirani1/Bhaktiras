<template>
  <div class="space-y-4">
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">Navigation</h1>
        <p class="text-sm text-[hsl(var(--muted-foreground))]">This is the current site navigation. Edit, remove, or add items, then save.</p>
      </div>
      <button type="button" class="admin-btn-secondary" :disabled="saving" @click="addItem">Add nav item</button>
    </div>
    <div v-for="(navItem, index) in navItems" :key="`${index}-${navItem.id}`" class="admin-panel">
      <div class="mb-4 flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-[hsl(var(--primary))]">Nav item {{ index + 1 }}</p>
        <div class="flex gap-2">
          <button type="button" class="admin-btn-secondary" :disabled="index === 0" @click="move(index, -1)">Up</button>
          <button type="button" class="admin-btn-secondary" :disabled="index === navItems.length - 1" @click="move(index, 1)">Down</button>
          <button type="button" class="admin-btn-danger" @click="removeItem(index)">Delete</button>
        </div>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label class="admin-label">ID</label>
          <input v-model="navItem.id" class="admin-input">
        </div>
        <div>
          <label class="admin-label">Icon</label>
          <select v-model="navItem.icon" class="admin-input">
            <option v-for="option in SITE_ICON_OPTIONS" :key="option.key" :value="option.key">{{ option.label }}</option>
          </select>
        </div>
        <div>
          <label class="admin-label">Label</label>
          <input v-model="navItem.label" class="admin-input">
        </div>
        <div>
          <label class="admin-label">Link</label>
          <input v-model="navItem.href" class="admin-input">
        </div>
        <label class="inline-flex items-center gap-2 text-sm"><input v-model="navItem.active" type="checkbox"> Active</label>
        <label class="inline-flex items-center gap-2 text-sm"><input v-model="navItem.external" type="checkbox"> External link</label>
        <label class="inline-flex items-center gap-2 text-sm"><input v-model="navItem.showInDesktopNav" type="checkbox"> Show on desktop</label>
        <label class="inline-flex items-center gap-2 text-sm"><input v-model="navItem.showInMobileNav" type="checkbox"> Show on mobile</label>
        <label class="inline-flex items-center gap-2 text-sm md:col-span-2"><input v-model="navItem.mobilePrimary" type="checkbox"> Pin in mobile bottom bar</label>
      </div>
    </div>
    <button type="button" class="admin-btn" :disabled="saving" @click="saveNav">{{ saving ? 'Saving…' : 'Save navigation' }}</button>
  </div>
</template>

<script setup lang="ts">
import type { NavItemContent } from '~/types'
import { cloneList, navItemsFromSource, SITE_ICON_OPTIONS } from '~/data/siteContent'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { item, saving, error, load, save } = useAdminSiteContent()
const navItems = ref<NavItemContent[]>(cloneList(navItemsFromSource(undefined)))

function fill() {
  navItems.value = cloneList(item.value.navItems)
}
function move(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= navItems.value.length) return
  const [entry] = navItems.value.splice(index, 1)
  navItems.value.splice(target, 0, entry)
}
function removeItem(index: number) {
  navItems.value.splice(index, 1)
}
function addItem() {
  navItems.value.push({
    id: `nav-${navItems.value.length + 1}`,
    label: '',
    href: '/',
    icon: 'home',
    active: true,
    showInDesktopNav: true,
    showInMobileNav: true,
    mobilePrimary: false
  })
}
async function saveNav() {
  const incomplete = navItems.value.find(navItem => !navItem.id.trim() || !navItem.label.trim() || !navItem.href.trim())
  if (incomplete) {
    error.value = 'Each nav item needs an ID, label and link.'
    return
  }
  await save({
    navItems: navItems.value.map((navItem, index) => ({ ...navItem, order: index + 1 }))
  })
  fill()
}

onMounted(async () => {
  await load()
  fill()
})

useHead({ title: 'Navigation · Admin' })
</script>
