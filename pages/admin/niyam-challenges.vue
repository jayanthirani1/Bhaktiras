<template>
  <div class="space-y-4">
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-if="submissionError" class="text-sm text-red-600">{{ submissionError }}</p>
    <p class="text-sm text-[hsl(var(--muted-foreground))]">
      Shared goals with a target and a deadline. The daily niyam checklist is
      <NuxtLink to="/admin/niyams" class="font-semibold text-[hsl(var(--golden-900))] hover:underline">
        Niyams →
      </NuxtLink>
    </p>

    <AdminEditorLayout
      :count-label="`${sorted.length} challenge${sorted.length === 1 ? '' : 's'}`"
      create-label="New challenge"
      empty-label="No challenges yet. Set one — a target, a deadline, and everyone's entries ladder up to it."
      :loading="loading"
      :empty="!sorted.length"
      @create="openNew"
    >
      <template #list>
        <button
          v-for="c in sorted"
          :key="c.id"
          type="button"
          class="admin-row"
          :class="editingId === c.id ? 'admin-row-active' : ''"
          @click="openEdit(c)"
        >
          <div class="flex items-start justify-between gap-2">
            <p class="font-semibold text-[hsl(var(--primary))]">{{ c.title }}</p>
            <span
              class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
              :class="isChallengeOpen(c)
                ? 'bg-[hsl(var(--golden-50))] text-[hsl(var(--primary))]'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'"
            >
              {{ isChallengeOpen(c) ? 'Open' : c.active ? 'Scheduled' : 'Paused' }}
            </span>
          </div>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {{ formatCount(c.target) }} {{ c.unit }} · closes {{ dateLabel(c.endAt) }}
          </p>
        </button>
      </template>

      <template #form>
        <div v-if="showForm" class="space-y-6">
          <!-- ── Challenge settings ──────────────────────────────── -->
          <form class="space-y-4" @submit.prevent="save">
            <div class="flex items-center justify-between gap-3">
              <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">
                {{ editingId ? 'Edit challenge' : 'New challenge' }}
              </h2>
              <button v-if="editingId" type="button" class="admin-btn-danger" @click="onDelete">
                Delete
              </button>
            </div>

            <div>
              <label class="admin-label">Title</label>
              <input v-model="form.title" required class="admin-input" placeholder="10,000 Malas for Patotsav">
            </div>

            <div>
              <label class="admin-label">Detail</label>
              <textarea
                v-model="form.detail"
                rows="2"
                class="admin-input"
                placeholder="Every mala you turn between now and the utsav counts towards our shared total."
              />
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div>
                <label class="admin-label">Target</label>
                <input v-model.number="form.target" type="number" min="1" step="1" class="admin-input">
              </div>
              <div>
                <label class="admin-label">Unit (plural)</label>
                <input v-model="form.unit" class="admin-input" placeholder="malas">
              </div>
              <div>
                <label class="admin-label">Unit (singular)</label>
                <input v-model="form.unitSingular" class="admin-input" placeholder="mala">
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label class="admin-label">Starts</label>
                <input v-model="form.startDate" type="date" class="admin-input">
              </div>
              <div>
                <label class="admin-label">Closes (end of that day)</label>
                <input v-model="form.endDate" type="date" class="admin-input">
              </div>
            </div>

            <!-- The anti-inflation dials. -->
            <div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-3">
              <p class="text-sm font-semibold text-[hsl(var(--primary))]">Review thresholds</p>
              <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                An entry at or below the auto-approve figure joins the total straight away.
                Anything larger is held here for you to approve first. The hard limit is refused outright.
              </p>
              <div class="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label class="admin-label">Auto-approve up to</label>
                  <input v-model.number="form.autoApproveMax" type="number" min="0" step="1" class="admin-input">
                </div>
                <div>
                  <label class="admin-label">Hard limit per entry</label>
                  <input v-model.number="form.maxPerSubmission" type="number" min="1" step="1" class="admin-input">
                </div>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label class="admin-label">Order</label>
                <input v-model.number="form.order" type="number" min="0" class="admin-input max-w-[8rem]">
              </div>
              <label class="flex items-end gap-2 pb-2 text-sm font-semibold text-[hsl(var(--foreground))]">
                <input v-model="form.active" type="checkbox" class="h-4 w-4 rounded border-[hsl(var(--border))]">
                Accepting entries
              </label>
            </div>

            <div class="flex gap-2">
              <button type="submit" class="admin-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
              <button type="button" class="admin-btn-secondary" @click="closeForm">Cancel</button>
            </div>
          </form>

          <!-- ── Live totals ─────────────────────────────────────── -->
          <div v-if="editingId" class="border-t border-[hsl(var(--border))] pt-5">
            <h3 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">Progress</h3>
            <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              Counted from approved entries by the <code>syncNiyamChallengeTotals</code> function.
              Approving or rejecting below updates it within a second or two.
            </p>
            <dl class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div class="rounded-xl bg-[hsl(var(--muted))]/60 px-3 py-2">
                <dt class="text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--golden-900))]">Counted</dt>
                <dd class="font-display text-lg text-[hsl(var(--primary))]">{{ formatCount(stats?.approvedTotal || 0) }}</dd>
              </div>
              <div class="rounded-xl bg-amber-50 px-3 py-2">
                <dt class="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800">Held</dt>
                <dd class="font-display text-lg text-amber-800">{{ formatCount(stats?.pendingTotal || 0) }}</dd>
              </div>
              <div class="rounded-xl bg-[hsl(var(--muted))]/60 px-3 py-2">
                <dt class="text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--golden-900))]">Devotees</dt>
                <dd class="font-display text-lg text-[hsl(var(--primary))]">{{ formatCount(stats?.participants || 0) }}</dd>
              </div>
              <div class="rounded-xl bg-[hsl(var(--muted))]/60 px-3 py-2">
                <dt class="text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--golden-900))]">Entries</dt>
                <dd class="font-display text-lg text-[hsl(var(--primary))]">{{ formatCount(submissions.length) }}</dd>
              </div>
            </dl>
          </div>

          <!-- ── Needs approval ──────────────────────────────────── -->
          <div v-if="editingId" class="border-t border-[hsl(var(--border))] pt-5">
            <h3 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">
              Waiting for you ({{ pending.length }})
            </h3>
            <p v-if="loadingSubmissions" class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Loading entries…</p>
            <p v-else-if="!pending.length" class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              Nothing held back. Entries above
              {{ formatCount(form.autoApproveMax) }} {{ form.unit }} will land here.
            </p>
            <ul v-else class="mt-3 space-y-3">
              <li
                v-for="entry in pending"
                :key="entry.id"
                class="rounded-xl border border-amber-200 bg-amber-50/60 p-3"
              >
                <div class="flex flex-wrap items-baseline justify-between gap-2">
                  <p class="font-semibold text-[hsl(var(--foreground))]">
                    {{ entry.userName }}
                    <span class="text-[hsl(var(--primary))]">
                      · {{ formatCount(entry.amount) }} {{ form.unit }}
                    </span>
                  </p>
                  <p class="text-xs text-[hsl(var(--muted-foreground))]">{{ formatUkDateLabel(entry.dayKey) }}</p>
                </div>
                <p v-if="entry.note" class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">“{{ entry.note }}”</p>

                <!-- The judgement context: what this person has done already. -->
                <p class="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                  {{ personSummary(entry) }}
                </p>

                <div class="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="admin-btn"
                    :disabled="!!reviewingId"
                    @click="approve(entry)"
                  >
                    {{ reviewingId === entry.id ? 'Saving…' : 'Approve' }}
                  </button>
                  <button
                    type="button"
                    class="admin-btn-secondary"
                    :disabled="!!reviewingId"
                    @click="onReject(entry)"
                  >
                    Reject
                  </button>
                </div>
              </li>
            </ul>
          </div>

          <!-- ── Everyone's entries ──────────────────────────────── -->
          <div v-if="editingId" class="border-t border-[hsl(var(--border))] pt-5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">All entries</h3>
              <div class="inline-flex rounded-lg border border-[hsl(var(--border))] bg-white p-0.5 text-xs">
                <button
                  v-for="option in filters"
                  :key="option.id"
                  type="button"
                  class="rounded-md px-2.5 py-1 font-semibold transition-colors"
                  :class="filter === option.id
                    ? 'bg-[hsl(var(--primary))] text-white'
                    : 'text-[hsl(var(--muted-foreground))]'"
                  @click="filter = option.id"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <p v-if="!filtered.length" class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
              No entries to show.
            </p>
            <div v-else class="mt-3 overflow-x-auto">
              <table class="w-full min-w-[34rem] text-left text-sm">
                <thead class="text-[10px] uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                  <tr>
                    <th class="py-2 pr-3 font-semibold">Devotee</th>
                    <th class="py-2 pr-3 font-semibold">Amount</th>
                    <th class="py-2 pr-3 font-semibold">Day</th>
                    <th class="py-2 pr-3 font-semibold">Status</th>
                    <th class="py-2 font-semibold">Change</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[hsl(var(--border))]">
                  <tr v-for="entry in filtered" :key="entry.id">
                    <td class="py-2 pr-3">
                      <span class="font-semibold text-[hsl(var(--foreground))]">{{ entry.userName }}</span>
                      <span v-if="entry.note" class="block text-xs text-[hsl(var(--muted-foreground))]">{{ entry.note }}</span>
                    </td>
                    <td class="py-2 pr-3 font-semibold text-[hsl(var(--primary))]">{{ formatCount(entry.amount) }}</td>
                    <td class="py-2 pr-3 text-xs text-[hsl(var(--muted-foreground))]">{{ formatUkDateLabel(entry.dayKey) }}</td>
                    <td class="py-2 pr-3">
                      <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="chipClass(entry.status)">
                        {{ chipLabel(entry.status) }}
                      </span>
                    </td>
                    <td class="py-2">
                      <div class="flex gap-1.5">
                        <button
                          v-if="entry.status !== 'approved'"
                          type="button"
                          class="text-xs font-semibold text-[hsl(var(--primary))] hover:underline disabled:opacity-40"
                          :disabled="!!reviewingId"
                          @click="approve(entry)"
                        >
                          Approve
                        </button>
                        <button
                          v-if="entry.status === 'approved'"
                          type="button"
                          class="text-xs font-semibold text-amber-700 hover:underline disabled:opacity-40"
                          :disabled="!!reviewingId"
                          @click="hold(entry)"
                        >
                          Hold
                        </button>
                        <button
                          v-if="entry.status !== 'rejected'"
                          type="button"
                          class="text-xs font-semibold text-red-600 hover:underline disabled:opacity-40"
                          :disabled="!!reviewingId"
                          @click="onReject(entry)"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="submissions.length >= 300" class="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
              Showing the 300 most recent entries.
            </p>
          </div>

          <!-- ── Per-person totals ───────────────────────────────── -->
          <div v-if="editingId && contributors.length" class="border-t border-[hsl(var(--border))] pt-5">
            <h3 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">
              Devotees ({{ contributors.length }})
            </h3>
            <ul class="mt-3 divide-y divide-[hsl(var(--border))] text-sm">
              <li v-for="person in contributors" :key="person.id" class="flex items-center justify-between gap-3 py-2">
                <span class="font-semibold text-[hsl(var(--foreground))]">{{ person.userName }}</span>
                <span class="text-right">
                  <span class="font-semibold text-[hsl(var(--primary))]">
                    {{ formatCount(person.approvedTotal) }} {{ form.unit }}
                  </span>
                  <span v-if="person.pendingTotal" class="block text-xs text-amber-700">
                    +{{ formatCount(person.pendingTotal) }} held
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">
          Select a challenge to edit and review its entries, or create a new one.
        </p>
      </template>
    </AdminEditorLayout>
  </div>
</template>

<script setup lang="ts">
import { Timestamp } from 'firebase/firestore'
import type { NiyamChallenge, NiyamSubmission, NiyamSubmissionStatus } from '~/types'
import {
  DEFAULT_AUTO_APPROVE_MAX,
  DEFAULT_MAX_PER_SUBMISSION,
  formatCount,
  isChallengeOpen,
  sortChallenges,
  toMillis
} from '~/utils/niyamChallenge'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const {
  items,
  loading,
  saving,
  error,
  fetchAll,
  create,
  updateItem,
  submissions,
  contributors,
  stats,
  pending,
  loadingSubmissions,
  reviewingId,
  submissionError,
  contextFor,
  loadChallengeDetail,
  approve,
  reject,
  hold,
  purgeChallenge
} = useAdminNiyamChallenges()

type FilterId = 'all' | 'pending' | 'approved' | 'rejected'

const filters: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Held' },
  { id: 'approved', label: 'Counted' },
  { id: 'rejected', label: 'Rejected' }
]

const filter = ref<FilterId>('all')
const showForm = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
  title: '',
  detail: '',
  unit: 'malas',
  unitSingular: 'mala',
  target: 10000,
  startDate: '',
  endDate: '',
  active: true,
  order: 0,
  autoApproveMax: DEFAULT_AUTO_APPROVE_MAX,
  maxPerSubmission: DEFAULT_MAX_PER_SUBMISSION
})

const sorted = computed(() => sortChallenges(items.value))

const filtered = computed(() =>
  filter.value === 'all'
    ? submissions.value
    : submissions.value.filter(s => s.status === filter.value)
)

onMounted(fetchAll)

/** `YYYY-MM-DD` for a date input, in UK time so it matches what admins see. */
function dateInputValue(value: NiyamChallenge['startAt']): string {
  const ms = toMillis(value)
  return ms ? ukDateId(new Date(ms)) : ''
}

function dateLabel(value: NiyamChallenge['endAt']): string {
  const ms = toMillis(value)
  return ms ? formatUkDateLabel(ukDateId(new Date(ms))) : 'no end date'
}

/** Start of the given day; end dates get the whole day, so the last day counts. */
function toTimestamp(dateString: string, edge: 'start' | 'end'): Timestamp | null {
  if (!dateString) return null
  const [year, month, day] = dateString.split('-').map(Number)
  if (!year || !month || !day) return null
  const date = edge === 'start'
    ? new Date(year, month - 1, day, 0, 0, 0, 0)
    : new Date(year, month - 1, day, 23, 59, 59, 999)
  return Timestamp.fromDate(date)
}

function openNew() {
  editingId.value = null
  Object.assign(form, {
    title: '',
    detail: '',
    unit: 'malas',
    unitSingular: 'mala',
    target: 10000,
    startDate: ukDateId(),
    endDate: addUkDays(ukDateId(), 90),
    active: true,
    order: items.value.length + 1,
    autoApproveMax: DEFAULT_AUTO_APPROVE_MAX,
    maxPerSubmission: DEFAULT_MAX_PER_SUBMISSION
  })
  showForm.value = true
  submissions.value = []
  contributors.value = []
  stats.value = null
}

async function openEdit(challenge: NiyamChallenge) {
  const id = String(challenge.id || '').trim()
  if (!id) {
    error.value = 'This challenge is missing a document id.'
    return
  }
  editingId.value = id
  Object.assign(form, {
    title: challenge.title,
    detail: challenge.detail,
    unit: challenge.unit || 'entries',
    unitSingular: challenge.unitSingular || 'entry',
    target: challenge.target || 0,
    startDate: dateInputValue(challenge.startAt),
    endDate: dateInputValue(challenge.endAt),
    active: challenge.active !== false,
    order: challenge.order ?? 0,
    autoApproveMax: challenge.autoApproveMax ?? DEFAULT_AUTO_APPROVE_MAX,
    maxPerSubmission: challenge.maxPerSubmission ?? DEFAULT_MAX_PER_SUBMISSION
  })
  showForm.value = true
  filter.value = 'all'
  await loadChallengeDetail(id)
}

function closeForm() {
  showForm.value = false
  editingId.value = null
}

async function save() {
  if (saving.value) return
  const title = form.title.trim()
  if (!title) {
    error.value = 'Give the challenge a title.'
    return
  }
  const target = Math.max(1, Math.floor(Number(form.target) || 0))
  const maxPerSubmission = Math.max(1, Math.floor(Number(form.maxPerSubmission) || 1))
  const autoApproveMax = Math.min(maxPerSubmission, Math.max(0, Math.floor(Number(form.autoApproveMax) || 0)))

  const payload = {
    title,
    detail: form.detail.trim(),
    unit: form.unit.trim() || 'entries',
    unitSingular: form.unitSingular.trim() || form.unit.trim() || 'entry',
    target,
    startAt: toTimestamp(form.startDate, 'start'),
    endAt: toTimestamp(form.endDate, 'end'),
    active: !!form.active,
    order: Math.max(0, Math.floor(Number(form.order) || 0)),
    autoApproveMax,
    maxPerSubmission
  }

  try {
    if (editingId.value) {
      await updateItem(editingId.value, payload)
    } else {
      const id = await create(payload)
      editingId.value = id || null
      if (id) await loadChallengeDetail(id)
    }
    form.autoApproveMax = autoApproveMax
    form.maxPerSubmission = maxPerSubmission
  } catch {
    /* error already set by the composable */
  }
}

async function onDelete() {
  const id = editingId.value
  if (!id) return
  if (!confirm('Delete this challenge? Every entry devotees have submitted towards it is deleted too.')) return
  try {
    await purgeChallenge(id)
    closeForm()
  } catch (e) {
    error.value = (e as Error).message
  }
}

/**
 * Rejecting without a word back is a dead end for the devotee, so offer a
 * reason. Cancelling the prompt cancels the rejection; an empty reason is fine.
 */
function onReject(entry: NiyamSubmission) {
  const reason = prompt(`Why is ${entry.userName}'s entry of ${formatCount(entry.amount)} ${form.unit} not being counted? (optional)`)
  if (reason === null) return
  reject(entry, reason)
}

/** One line an admin can judge a held entry against. */
function personSummary(entry: NiyamSubmission): string {
  const context = contextFor(entry)
  const parts = [
    `${formatCount(context.approvedTotal)} ${form.unit} counted so far`,
    `${context.entryCount} ${context.entryCount === 1 ? 'entry' : 'entries'} in total`
  ]
  if (context.sameDayCount > 1) {
    parts.push(`${context.sameDayCount} entries on this day (${formatCount(context.sameDayTotal)} ${form.unit})`)
  }
  if (context.pendingCount > 1) parts.push(`${context.pendingCount} awaiting review`)
  return parts.join(' · ')
}

function chipLabel(status: NiyamSubmissionStatus) {
  if (status === 'approved') return 'Counted'
  if (status === 'rejected') return 'Rejected'
  return 'Held'
}

function chipClass(status: NiyamSubmissionStatus) {
  if (status === 'approved') return 'bg-[hsl(var(--golden-50))] text-[hsl(var(--primary))]'
  if (status === 'rejected') return 'bg-red-50 text-red-700'
  return 'bg-amber-50 text-amber-800'
}

useHead({ title: 'Niyam challenges · Admin' })
</script>
