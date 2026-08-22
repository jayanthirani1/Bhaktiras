export type AppPromptKind = 'sign-in' | 'install' | 'push'

/**
 * Only one card is ever on screen.
 *
 * All three prompts live in the same corner and share the same triggers — a
 * signed-out devotee finishing a game on an uninstalled phone qualifies for
 * every one of them at once. Stacking them reads as nagging and gets all three
 * dismissed together, so they queue instead.
 *
 * Order is by what the next prompt depends on: signing in is what makes scores,
 * niyams and streaks persist at all; installing is what makes push possible on
 * iOS; push is last because it is the one ask a refusal makes permanent.
 *
 * A queued prompt is *hidden*, never dismissed — whoever loses this round must
 * not record a "seen" flag, or waiting its turn would silently spend its slot.
 */
const PRIORITY: AppPromptKind[] = ['sign-in', 'install', 'push']

export function useAppPrompts() {
  const pending = useState<AppPromptKind[]>('app-prompts-pending', () => [])

  const active = computed(() => PRIORITY.find(kind => pending.value.includes(kind)) ?? null)

  function setPending(kind: AppPromptKind, value: boolean) {
    const has = pending.value.includes(kind)
    if (value === has) return
    pending.value = value
      ? [...pending.value, kind]
      : pending.value.filter(item => item !== kind)
  }

  /** True only when this prompt both wants to show and outranks the others. */
  function visible(kind: AppPromptKind) {
    return computed(() => active.value === kind)
  }

  return { active, setPending, visible }
}
