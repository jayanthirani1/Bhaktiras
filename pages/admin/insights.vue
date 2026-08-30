<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-[hsl(var(--muted-foreground))]">
        <span v-if="loading">Counting…</span>
        <span v-else-if="error" class="text-red-600">{{ error }}</span>
        <span v-else-if="data">
          Counted {{ computedLabel }}<span v-if="data.cached"> · cached</span>
        </span>
      </p>
      <button type="button" class="admin-btn-secondary" :disabled="loading" @click="load(true)">
        {{ loading ? 'Refreshing…' : 'Refresh' }}
      </button>
    </div>

    <div v-if="loading && !data" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="n in 8" :key="n" class="admin-panel animate-pulse">
        <div class="h-3 w-24 rounded bg-[hsl(var(--muted))]" />
        <div class="mt-3 h-7 w-16 rounded bg-[hsl(var(--muted))]" />
      </div>
    </div>

    <template v-else-if="data">
      <div
        v-if="data.errors?.length"
        class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        role="alert"
      >
        <p class="font-semibold">Some figures could not be counted.</p>
        <ul class="mt-1 space-y-0.5">
          <li v-for="item in data.errors" :key="item.section">
            <strong>{{ item.section }}:</strong> {{ item.message }}
          </li>
        </ul>
        <p class="mt-1 text-xs">Everything else below is accurate. Refresh to retry.</p>
      </div>

      <!-- Hero: the one number this page leads with. -->
      <section class="admin-panel">
        <p class="admin-label mb-0">Active today</p>
        <p class="mt-1 text-5xl font-semibold leading-none text-[hsl(var(--primary))]">
          {{ data.accounts.activeLast1 }}
        </p>
        <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          Signed-in accounts that used Bhaktiras in the last 24 hours —
          {{ percent(data.accounts.activeLast1, data.accounts.total) }} of all {{ data.accounts.total }} members.
        </p>
      </section>

      <section class="admin-panel">
        <AdminTrendChart
          v-if="trendPoints.length > 1"
          :caption="trendCaption"
          series-label="Active members"
          :points="trendPoints"
        />
        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">
          Not enough history to chart yet — {{ recordedDays }} night{{ recordedDays === 1 ? '' : 's' }}
          recorded so far. The line appears from the second one.
        </p>
        <p class="mt-3 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
          Today is counted live; every earlier day comes from a nightly snapshot
          <span v-if="recordedFrom">({{ recordedDays }} recorded, from {{ recordedFrom }})</span>
          <span v-else>({{ recordedDays }} recorded)</span>.
          Active members cannot be worked out retrospectively — an account records only the most
          recent time it was used — so days before the nightly snapshot began are left off the chart
          rather than drawn as zero.
        </p>
      </section>

      <section>
        <h2 class="mb-2 font-display text-lg font-semibold text-[hsl(var(--primary))]">Members</h2>
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStat label="Total members" :value="data.accounts.total" hint="Accounts ever created" />
          <AdminStat label="Active this week" :value="data.accounts.activeLast7" :hint="`${percent(data.accounts.activeLast7, data.accounts.total)} of members`" />
          <AdminStat label="Active this month" :value="data.accounts.activeLast30" :hint="`${percent(data.accounts.activeLast30, data.accounts.total)} of members`" />
          <AdminStat
            label="Stickiness"
            :value="stickiness"
            hint="Active today ÷ active this month. Higher means people come back daily."
          />
          <AdminStat label="Joined this week" :value="data.accounts.newLast7" hint="New accounts in the last 7 days" />
          <AdminStat label="Joined this month" :value="data.accounts.newLast30" hint="New accounts in the last 30 days" />
          <AdminStat label="Google sign-in" :value="data.accounts.google" hint="Rest use email and password" />
          <AdminStat
            label="Never opened"
            :value="data.accounts.neverActive"
            hint="Signed up but never used the site since"
          />
        </div>
      </section>

      <section class="grid gap-5 xl:grid-cols-2">
        <div class="admin-panel">
          <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">Notification reach</h2>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {{ data.push.accounts }} of {{ data.accounts.total }} members can receive a push,
            across {{ data.push.devices }} device{{ data.push.devices === 1 ? '' : 's' }}.
          </p>

          <div class="mt-4">
            <div class="flex items-baseline justify-between">
              <span class="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Opted in</span>
              <span class="text-sm font-semibold text-[hsl(var(--foreground))]">
                {{ percent(data.push.accounts, data.accounts.total) }}
              </span>
            </div>
            <div class="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[hsl(var(--primary)/0.12)]">
              <div
                class="h-full rounded-r bg-[hsl(var(--primary))]"
                :style="{ width: ratio(data.push.accounts, data.accounts.total) }"
              />
            </div>
          </div>

          <AdminBars class="mt-5" caption="Devices by platform" :rows="platformRows" />
          <p class="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
            Announcements {{ data.push.announcements }} · Niyam reminders {{ data.push.niyams }} · Games and records {{ data.push.games }}.
            iPhone and iPad only receive push once Bhaktiras is added to the Home Screen.
          </p>
        </div>

        <div class="admin-panel">
          <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">Games</h2>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {{ data.games.playersToday }} played today · {{ data.games.playersThisWeek }} this week
            · {{ data.games.playsThisWeek }} plays in 7 days.
          </p>
          <AdminBars
            v-if="gameRows.length"
            class="mt-4"
            caption="Plays today, by game"
            :rows="gameRows"
          />
          <p v-else class="mt-4 text-sm text-[hsl(var(--muted-foreground))]">No games played yet today.</p>
        </div>
      </section>

      <section class="admin-panel">
        <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">Privacy policy acceptance</h2>
        <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          {{ onCurrentPolicy }} of {{ data.policy.profiles }} member profiles have accepted the current
          policy ({{ currentPolicyVersion }}).
          <span v-if="behindPolicy">{{ behindPolicy }} accepted an earlier version and will be asked again.</span>
        </p>
      </section>

      <p class="text-xs text-[hsl(var(--muted-foreground))]">
        These are totals only — no individual member's activity is shown here. What a devotee has
        submitted to a niyam challenge is deliberately excluded: it is personal sadhana, not a
        leaderboard. Review those entries on the challenge itself.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { getApp } from 'firebase/app'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { PRIVACY_POLICY_VERSION } from '~/utils/privacy'

definePageMeta({ layout: 'admin', middleware: 'admin' })

type Overview = {
  accounts: {
    total: number
    newLast7: number
    newLast30: number
    activeLast1: number
    activeLast7: number
    activeLast30: number
    neverActive: number
    google: number
    password: number
  }
  push: {
    devices: number
    accounts: number
    announcements: number
    games: number
    niyams: number
    platforms: Record<string, number>
  }
  games: {
    playersToday: number
    playersThisWeek: number
    playsThisWeek: number
    playsPerGame: Record<string, number>
  }
  policy: { profiles: number; versions: Record<string, number> }
  history: {
    measured: number
    points: Array<{ dateId: string; activeMembers: number | null }>
  }
  errors?: Array<{ section: string; message: string }>
  computedAt: number
  cached: boolean
}

const GAME_LABELS: Record<string, string> = {
  wordle: 'Wordle',
  crossword: 'Crossword',
  connections: 'Connections',
  'one-percent': '1% Club',
  'mini-crossword': 'Mini crossword',
  'bracket-city': 'Bracket City',
  'bhakti-marg': 'Surya Chandra',
  'surya-chandra': 'Surya Chandra',
  'ras-rani': 'Ras Rani'
}

const data = ref<Overview | null>(null)
const loading = ref(false)
const error = ref('')
const currentPolicyVersion = PRIVACY_POLICY_VERSION

function percent(part: number, whole: number) {
  if (!whole) return '0%'
  return `${Math.round((part / whole) * 100)}%`
}

function ratio(part: number, whole: number) {
  if (!whole) return '0%'
  return `${Math.min(100, (part / whole) * 100)}%`
}

const stickiness = computed(() => {
  const value = data.value
  if (!value?.accounts.activeLast30) return '—'
  return percent(value.accounts.activeLast1, value.accounts.activeLast30)
})

const platformRows = computed(() => {
  const platforms = data.value?.push.platforms || {}
  return Object.entries(platforms)
    .filter(([, count]) => count > 0)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
})

const gameRows = computed(() => {
  const plays = data.value?.games.playsPerGame || {}
  return Object.entries(plays)
    .map(([key, value]) => ({ label: GAME_LABELS[key] || key, value }))
    .sort((a, b) => b.value - a.value)
})

const recordedDays = computed(() => data.value?.history?.measured ?? 0)

/**
 * The chart starts at the first day the nightly snapshot recorded. Before that
 * the figure is genuinely unknown — plotting it as zero drew a flat, dead line
 * across most of the month and buried the days that do have a reading.
 */
const trendPoints = computed(() => {
  const points = data.value?.history?.points ?? []
  const first = points.findIndex(point => point.activeMembers != null)
  if (first === -1) return []
  return points.slice(first).map(point => ({ dateId: point.dateId, value: point.activeMembers }))
})

/** The window is however much has been recorded, not a flat 30 days. */
const trendCaption = computed(() => `Active members, last ${trendPoints.value.length} days`)

const recordedFrom = computed(() => {
  const dateId = trendPoints.value[0]?.dateId
  if (!dateId) return ''
  const [year, month, day] = dateId.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
    .format(new Date(year, month - 1, day))
})

const onCurrentPolicy = computed(() => data.value?.policy.versions[currentPolicyVersion] || 0)
const behindPolicy = computed(() => {
  const value = data.value
  if (!value) return 0
  return value.policy.profiles - onCurrentPolicy.value
})

const computedLabel = computed(() => {
  const at = data.value?.computedAt
  if (!at) return ''
  return new Intl.DateTimeFormat('en-GB', { timeStyle: 'short' }).format(new Date(at))
})

async function load(refresh = false) {
  loading.value = true
  error.value = ''
  try {
    const call = httpsCallable<{ refresh: boolean }, Overview>(
      getFunctions(getApp(), 'europe-west2'),
      'getAdminOverview'
    )
    const response = await call({ refresh })
    data.value = response.data
  } catch (value) {
    error.value = (value as { message?: string })?.message || 'Could not load insights.'
  } finally {
    loading.value = false
  }
}

onMounted(() => load())
useHead({ title: 'Insights · Admin' })
</script>
