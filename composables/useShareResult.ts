/**
 * Shares a game result. On a phone it opens the share sheet, which is the
 * quickest way into the sangat's WhatsApp groups; elsewhere, or if the sheet is
 * unavailable, it copies the text. `shareCopied` flips for two seconds after a copy.
 */
export function useShareResult() {
  const shareCopied = ref(false)

  async function share(text: string) {
    const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches
    if (touch && typeof navigator.share === 'function') {
      try {
        await navigator.share({ text })
        return
      } catch (error) {
        if ((error as { name?: string })?.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard?.writeText(text)
      shareCopied.value = true
      setTimeout(() => { shareCopied.value = false }, 2000)
    } catch {}
  }

  return { share, shareCopied }
}
