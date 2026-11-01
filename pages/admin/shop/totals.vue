<template>
  <div class="space-y-4">
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    <div class="admin-panel flex flex-wrap items-center justify-between gap-3">
      <p class="max-w-2xl text-sm text-[hsl(var(--muted-foreground))]">
        <strong class="text-[hsl(var(--primary))]">Paid</strong> is what to order from suppliers — unpaid orders are not counted.
        <strong class="text-[hsl(var(--primary))]">Awaiting payment</strong> is shown so the team can see what is still to chase. Cancelled orders are left out.
      </p>
      <div class="flex gap-2">
        <button type="button" class="admin-btn-secondary" :disabled="loading" @click="load">Refresh</button>
        <button type="button" class="admin-btn" :disabled="!rows.length" @click="exportCsv">Export CSV</button>
      </div>
    </div>

    <p v-if="loading && !rows.length" class="text-sm text-[hsl(var(--muted-foreground))]">Adding up orders…</p>
    <p v-else-if="!rows.length" class="rounded-xl border border-dashed border-[hsl(var(--border))] bg-white px-3 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
      No orders yet.
    </p>

    <div v-for="group in grouped" :key="group.productId" class="admin-panel">
      <div class="flex items-baseline justify-between gap-3">
        <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">{{ group.name }}</h2>
        <span class="text-xs text-[hsl(var(--muted-foreground))]">{{ group.category }}</span>
      </div>
      <table class="mt-3 w-full text-sm">
        <thead>
          <tr class="border-b border-[hsl(var(--border))] text-left text-xs uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">
            <th class="py-1.5 font-semibold">Size</th>
            <th class="py-1.5 text-right font-semibold">Paid</th>
            <th class="py-1.5 text-right font-semibold">Awaiting payment</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in group.rows" :key="row.key" class="border-b border-[hsl(var(--border))] last:border-0">
            <td class="py-1.5">{{ row.size || 'One size' }}<span v-if="row.group === 'child'" class="text-[hsl(var(--muted-foreground))]"> (child)</span></td>
            <td class="py-1.5 text-right font-semibold tabular-nums">{{ row.paid }}</td>
            <td class="py-1.5 text-right tabular-nums text-[hsl(var(--muted-foreground))]">{{ row.awaiting }}</td>
          </tr>
          <tr v-if="group.rows.length > 1" class="font-semibold">
            <td class="pt-2">Total</td>
            <td class="pt-2 text-right tabular-nums">{{ group.paid }}</td>
            <td class="pt-2 text-right tabular-nums text-[hsl(var(--muted-foreground))]">{{ group.awaiting }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ShopTotalRow } from '~/data/shop'
import { downloadCsv, supplierTotals, totalsToCsv } from '~/data/shop'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const orders = useShopAdminOrders()
const productsAdmin = useShopAdminProducts()
const loading = computed(() => orders.loading.value || productsAdmin.loading.value)
const error = computed(() => orders.error.value || productsAdmin.error.value)

const rows = computed(() => supplierTotals(orders.orders.value, productsAdmin.products.value))
const grouped = computed(() => {
  const groups: Array<{ productId: string; name: string; category: string; rows: ShopTotalRow[]; paid: number; awaiting: number }> = []
  for (const row of rows.value) {
    let group = groups.find(item => item.productId === row.productId)
    if (!group) {
      group = { productId: row.productId, name: row.name, category: row.category, rows: [], paid: 0, awaiting: 0 }
      groups.push(group)
    }
    group.rows.push(row)
    group.paid += row.paid
    group.awaiting += row.awaiting
  }
  return groups
})

async function load() {
  await Promise.all([orders.fetchAll(), productsAdmin.fetchAll()])
}

function exportCsv() {
  downloadCsv(`bhaktiras-shop-totals-${new Date().toISOString().slice(0, 10)}.csv`, totalsToCsv(rows.value))
}

onMounted(load)

useHead({ title: 'Order totals · Admin' })
</script>
