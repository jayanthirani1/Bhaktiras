<template>
  <div v-if="hasActions" class="mt-5 flex flex-wrap gap-2">
    <button
      type="button"
      class="event-action"
      :aria-label="`Share ${event.title}`"
      @click="share"
    >
      <IconCheck v-if="shareState === 'copied'" class="h-4 w-4" />
      <IconShare2 v-else class="h-4 w-4" />
      {{ shareState === 'copied' ? 'Copied' : 'Share' }}
    </button>

    <button
      v-if="allowCalendar && canAddToCalendar"
      type="button"
      class="event-action"
      :aria-label="`Add ${event.title} to your calendar`"
      @click="addToCalendar"
    >
      <IconCalendarPlus class="h-4 w-4" />
      Add to calendar
    </button>
  </div>
</template>

<script setup lang="ts">
import { IconCalendarPlus, IconCheck, IconShare2 } from '@tabler/icons-vue'
import { buildEventIcs, buildEventMessage, eventIcsFilename } from '~/utils/eventSharing'
import type { Event } from '~/types'

/**
 * Share an event as a message, and put it in your calendar.
 *
 * Both asked for by the community through the bug report form. The share is
 * the one people actually use — a Patotsav date gets forwarded to a family
 * group long before anyone opens a calendar — so it goes first and is offered
 * on past events too, which is how the photo albums get passed around.
 */
const props = withDefaults(defineProps<{
  event: Event
  /** Past events are still worth sharing; diarising one is just clutter. */
  allowCalendar?: boolean
}>(), { allowCalendar: false })

const shareState = ref<'idle' | 'copied'>('idle')
let copiedTimer: ReturnType<typeof setTimeout> | null = null

const canAddToCalendar = computed(() => buildEventIcs(props.event, '') !== null)
const hasActions = computed(() => !!props.event.title)

/**
 * The live origin rather than `SITE.url`, so a shared link points at whatever
 * domain the reader is already on.
 */
function origin(): string {
  return typeof window === 'undefined' ? '' : window.location.origin
}

/** A cancelled share sheet is a choice, not a failure — never fall back on it. */
function wasDismissed(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function markCopied() {
  shareState.value = 'copied'
  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => { shareState.value = 'idle' }, 2000)
}

async function share() {
  const text = buildEventMessage(props.event, origin())

  // The message already ends with the link. Passing `url` as well makes some
  // targets append it a second time.
  if (navigator.share) {
    try {
      await navigator.share({ title: props.event.title, text })
      return
    } catch (error) {
      if (wasDismissed(error)) return
    }
  }

  // Checked rather than optional-chained: `navigator.clipboard?.writeText(text)`
  // resolves to undefined where there is no clipboard at all, which would
  // report "Copied" over an empty clipboard.
  const clipboard = navigator.clipboard
  if (!clipboard?.writeText) return

  try {
    await clipboard.writeText(text)
    markCopied()
  } catch {
    // Permission refused, or no user activation. Nothing useful to say — the
    // card itself is still there to be read.
  }
}

function downloadIcs(ics: string, filename: string) {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

async function addToCalendar() {
  const ics = buildEventIcs(props.event, origin())
  if (!ics) return
  const filename = eventIcsFilename(props.event)

  // On a phone this is the path that works: iOS offers "Add to Calendar"
  // straight from the share sheet, where a download would strand the file in
  // Files for the reader to find and open themselves.
  try {
    const file = new File([ics], filename, { type: 'text/calendar' })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: props.event.title })
      return
    }
  } catch (error) {
    if (wasDismissed(error)) return
    // Anything else — no File constructor, a target that refused the file —
    // is what the download below is for.
  }

  downloadIcs(ics, filename)
}

onUnmounted(() => {
  if (copiedTimer) clearTimeout(copiedTimer)
})
</script>

<style scoped>
.event-action {
  @apply inline-flex items-center gap-2 rounded-full bg-[hsl(var(--muted))] px-3.5 py-1.5 text-sm font-semibold text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))];
}
</style>
