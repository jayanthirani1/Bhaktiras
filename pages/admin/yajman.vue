<template>
  <div>
    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <AdminEditorLayout
      :count-label="`${sorted.length} opportunit${sorted.length === 1 ? 'y' : 'ies'}`"
      create-label="Add opportunity"
      empty-label="No Yajman opportunities yet."
      :loading="loading"
      :empty="!sorted.length"
      @create="openNew"
    >
      <template #list>
        <button
          v-for="item in sorted"
          :key="item.id"
          type="button"
          class="admin-row"
          :class="isEditing && editingId === item.id ? 'admin-row-active' : ''"
          @click="openEdit(item)"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-semibold text-[hsl(var(--primary))]">{{ item.title }}</p>
              <p class="mt-1 line-clamp-2 text-sm text-[hsl(var(--muted-foreground))]">{{ item.detail }}</p>
            </div>
            <span v-if="item.amount" class="shrink-0 text-xs font-semibold text-[hsl(var(--golden-900))]">{{ item.amount }}</span>
          </div>
          <p v-if="item.active === false" class="mt-2 text-xs font-semibold text-slate-500">Hidden</p>
        </button>
      </template>

      <template #form>
        <form v-if="showForm" class="space-y-4" @submit.prevent="save">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">{{ isEditing ? 'Edit opportunity' : 'New opportunity' }}</h2>
            <button v-if="isEditing && editingId" type="button" class="admin-btn-danger" @click="onDelete(editingId)">Delete</button>
          </div>
          <div>
            <label class="admin-label">Title</label>
            <input v-model="form.title" required maxlength="100" class="admin-input" placeholder="Mahaprasad Yajman">
          </div>
          <div>
            <label class="admin-label">Details</label>
            <textarea v-model="form.detail" required maxlength="1000" rows="5" class="admin-input" />
          </div>
          <div>
            <label class="admin-label">Amount or label <span class="font-normal">(optional)</span></label>
            <input v-model="form.amount" maxlength="40" class="admin-input" placeholder="£501">
          </div>
          <div>
            <label class="admin-label">Enquiry link <span class="font-normal">(optional)</span></label>
            <input v-model="form.contactUrl" type="url" maxlength="500" class="admin-input" placeholder="https://…">
          </div>
          <div>
            <label class="admin-label">Order</label>
            <input v-model.number="form.order" type="number" min="0" class="admin-input max-w-[8rem]">
          </div>
          <label class="flex items-center gap-2 text-sm font-semibold">
            <input v-model="form.active" type="checkbox" class="h-4 w-4 rounded">
            Show on the Yajman page
          </label>
          <div class="flex gap-2">
            <button type="submit" class="admin-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
            <button type="button" class="admin-btn-secondary" @click="showForm = false">Cancel</button>
          </div>
        </form>
        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">Select an opportunity to edit, or add a new one.</p>
      </template>
    </AdminEditorLayout>
  </div>
</template>

<script setup lang="ts">
import type { YajmanOpportunity } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { items, loading, saving, error, fetchAll, create, updateItem, remove } = useAdminYajmanOpportunities()
const showForm = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ title: '', detail: '', amount: '', contactUrl: '', order: 0, active: true })

const sorted = computed(() =>
  [...items.value].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title))
)

function openNew() {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, { title: '', detail: '', amount: '', contactUrl: '', order: items.value.length + 1, active: true })
  showForm.value = true
}

function openEdit(item: YajmanOpportunity) {
  isEditing.value = true
  editingId.value = item.id
  Object.assign(form, {
    title: item.title,
    detail: item.detail,
    amount: item.amount || '',
    contactUrl: item.contactUrl || '',
    order: item.order ?? 0,
    active: item.active !== false
  })
  showForm.value = true
}

async function save() {
  const payload = {
    title: form.title.trim(),
    detail: form.detail.trim(),
    amount: form.amount.trim() || null,
    contactUrl: form.contactUrl.trim() || null,
    order: Number(form.order) || 0,
    active: form.active
  }
  if (!payload.title || !payload.detail) return
  if (isEditing.value && editingId.value) await updateItem(editingId.value, payload)
  else editingId.value = await create(payload)
  isEditing.value = true
  showForm.value = true
}

async function onDelete(id: string) {
  if (!confirm('Delete this Yajman opportunity?')) return
  await remove(id)
  showForm.value = false
  isEditing.value = false
  editingId.value = null
}

onMounted(async () => {
  await fetchAll()
  if (!items.value.length) openNew()
})

useHead({ title: 'Yajman Opportunities · Admin' })
</script>
