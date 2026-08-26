<template>
  <article class="card-surface overflow-hidden">
    <div class="border-b border-[hsl(var(--border))] bg-[hsl(var(--golden-50))] px-5 py-4 sm:px-6">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div class="min-w-0">
          <h2 class="font-display text-xl text-[hsl(var(--primary))]">Visit Mandir</h2>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Your personal daily darshan
          </p>
        </div>
        <span
          class="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
          :class="visitedToday
            ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
            : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'"
        >
          {{ visitedToday ? 'Visited today' : 'Not yet today' }}
        </span>
      </div>
    </div>

    <div class="px-5 py-5 sm:px-6">
      <!-- Visit status -->
      <div class="text-center">
        <div
          class="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
          :class="visitedToday
            ? 'bg-[hsl(var(--golden-100))]'
            : 'bg-[hsl(var(--muted))]'"
        >
          <svg
            v-if="visitedToday"
            class="h-10 w-10 text-[hsl(var(--primary))]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg
            v-else
            class="h-10 w-10 text-[hsl(var(--muted-foreground))]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        <p class="mt-4 font-display text-2xl text-[hsl(var(--primary))]">
          <template v-if="visitedToday">
            Jay Swaminarayan!
          </template>
          <template v-else-if="checking">
            Checking your location…
          </template>
          <template v-else>
            Visit the Mandir today
          </template>
        </p>

        <p v-if="visitedToday && todayVisit" class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          {{ todayVisit.source === 'auto' ? 'Automatically recorded' : 'Manually checked in' }}
        </p>
      </div>

      <!-- Streak display -->
      <div v-if="currentStreak > 0" class="mt-5 text-center">
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--golden-900))]">
          Current streak
        </p>
        <p class="mt-1 font-display text-3xl text-[hsl(var(--primary))]">
          {{ currentStreak }} {{ currentStreak === 1 ? 'day' : 'days' }}
        </p>
      </div>

      <!-- Location toggle -->
      <div class="mt-6 border-t border-[hsl(var(--border))] pt-5">
        <template v-if="isLoggedIn">
          <template v-if="isGeolocationSupported">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-sm font-semibold text-[hsl(var(--foreground))]">Auto check-in</p>
                <p class="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                  Automatically record when you're at the Mandir
                </p>
              </div>
              <button
                type="button"
                role="switch"
                :aria-checked="alwaysAllowLocation"
                class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2"
                :class="alwaysAllowLocation ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))]'"
                @click="toggleLocation"
              >
                <span
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  :class="alwaysAllowLocation ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>

            <p
              v-if="permissionState === 'denied'"
              class="mt-3 text-xs text-amber-700"
            >
              Location access was denied. Please enable it in your browser settings to use auto check-in.
            </p>

            <!-- Distance indicator when tracking -->
            <p
              v-if="alwaysAllowLocation && distanceToMandir !== null && !visitedToday"
              class="mt-3 text-sm text-[hsl(var(--muted-foreground))]"
            >
              <template v-if="isAtMandir">
                You're at the Mandir — checking in…
              </template>
              <template v-else>
                {{ formatDistance(distanceToMandir) }} from Mandir
              </template>
            </p>
          </template>

          <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">
            Your browser doesn't support location services. Use the button below to check in manually.
          </p>

          <!-- Manual check-in -->
          <div v-if="!visitedToday" class="mt-4">
            <button
              type="button"
              class="admin-btn w-full"
              :disabled="checking"
              @click="handleManualCheckIn"
            >
              {{ checking ? 'Checking…' : 'I\'m at the Mandir — check in' }}
            </button>
            <p class="mt-2 text-center text-xs text-[hsl(var(--muted-foreground))]">
              Please only check in when you are physically at the Mandir
            </p>
          </div>

          <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
        </template>

        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">
          <NuxtLink to="/login?redirect=/niyams" class="font-semibold text-[hsl(var(--golden-900))] hover:underline">
            Sign in
          </NuxtLink>
          to track your Mandir visits.
        </p>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
const {
  todayVisit,
  visitedToday,
  currentStreak,
  checking,
  error,
  alwaysAllowLocation,
  isAtMandir,
  distanceToMandir,
  permissionState,
  isGeolocationSupported,
  checkInManually,
  enableLocationTracking,
  disableLocationTracking
} = useMandirVisit()

const { isLoggedIn } = useAuth()

async function toggleLocation() {
  if (alwaysAllowLocation.value) {
    disableLocationTracking()
  } else {
    await enableLocationTracking()
  }
}

async function handleManualCheckIn() {
  await checkInManually()
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}
</script>
