<template>
  <div class="max-w-3xl space-y-4">
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <section class="admin-panel space-y-3">
      <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">Give someone shop access</h2>
      <p class="text-sm text-[hsl(var(--muted-foreground))]">
        Shop access is for the Souvenir lead and the Treasury team. They sign in at <span class="font-mono">/admin</span> and see
        the shop pages only — orders, products, totals and settings — and nothing else in the admin area. They need a
        Bhaktiras account first: ask them to sign up, then add the email they used.
      </p>
      <form class="flex flex-wrap items-end gap-2" @submit.prevent="add">
        <div class="min-w-[14rem] flex-1">
          <label class="admin-label" for="t-email">Email</label>
          <input id="t-email" v-model="email" type="email" required class="admin-input" placeholder="name@example.com">
        </div>
        <div class="min-w-[10rem] flex-1">
          <label class="admin-label" for="t-name">Name <span class="font-normal">(shown in order history)</span></label>
          <input id="t-name" v-model="name" maxlength="80" class="admin-input" placeholder="e.g. Treasury — Priya">
        </div>
        <button type="submit" class="admin-btn" :disabled="saving">{{ saving ? 'Adding…' : 'Add' }}</button>
      </form>
      <p v-if="added" class="text-sm font-semibold text-emerald-700">{{ added }}</p>
    </section>

    <section class="admin-panel">
      <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">Shop team</h2>
      <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Full admins can use the shop as well, and are not listed here.</p>
      <p v-if="loading && !staff.length" class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
      <p v-else-if="!staff.length" class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Nobody yet.</p>
      <ul v-else class="mt-3 divide-y divide-[hsl(var(--border))]">
        <li v-for="member in staff" :key="member.id" class="flex flex-wrap items-center justify-between gap-2 py-2.5">
          <div class="min-w-0">
            <p class="font-semibold">{{ member.name }}<span v-if="!member.active" class="ml-2 text-xs font-semibold text-slate-500">Paused</span></p>
            <p class="truncate text-xs text-[hsl(var(--muted-foreground))]">{{ member.email }}</p>
          </div>
          <div class="flex gap-2">
            <button type="button" class="admin-btn-secondary text-xs" :disabled="saving" @click="setActive(member, !member.active)">
              {{ member.active ? 'Pause' : 'Resume' }}
            </button>
            <button type="button" class="admin-btn-danger text-xs" :disabled="saving" @click="onRemove(member)">Remove</button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ShopStaffRecord } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { staff, loading, saving, error, fetchAll, grant, setActive, remove } = useShopStaff()
const email = ref('')
const name = ref('')
const added = ref('')

async function add() {
  added.value = ''
  try {
    await grant(email.value.trim(), name.value.trim())
    added.value = `${email.value.trim()} now has shop access.`
    email.value = ''
    name.value = ''
  } catch {
    // Shown via `error`.
  }
}

async function onRemove(member: ShopStaffRecord) {
  if (!confirm(`Remove shop access for ${member.name || member.email}?`)) return
  await remove(member)
}

onMounted(fetchAll)

useHead({ title: 'Shop team · Admin' })
</script>
