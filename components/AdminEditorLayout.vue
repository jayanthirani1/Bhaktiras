<template>
  <div class="grid gap-4 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:items-start">
    <div class="space-y-3">
      <div class="flex items-center justify-between gap-2">
        <p class="text-sm text-[hsl(var(--muted-foreground))]">{{ countLabel }}</p>
        <button type="button" class="admin-btn" @click="$emit('create')">{{ createLabel }}</button>
      </div>
      <p v-if="loading && empty" class="text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
      <p v-else-if="empty" class="rounded-xl border border-dashed border-[hsl(var(--border))] bg-white px-3 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
        {{ emptyLabel }}
      </p>
      <div v-else class="relative space-y-2">
        <p v-if="loading" class="text-xs text-[hsl(var(--muted-foreground))]">Refreshing…</p>
        <slot name="list" />
      </div>
    </div>
    <div class="admin-panel">
      <slot name="form" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  countLabel: string
  createLabel: string
  emptyLabel?: string
  loading?: boolean
  empty?: boolean
}>()

defineEmits<{ create: [] }>()
</script>
