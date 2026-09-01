import type { NiyamCopyKey } from '~/data/niyamCopy'
import { niyamCopyText } from '~/data/niyamCopy'

/**
 * The niyams area's wording, defaults folded in.
 *
 * Reads the same shared `siteContent` state as the rest of the CMS, so a
 * component can ask for its own sentences instead of the page threading a
 * dozen strings down as props. `useSiteContent` de-duplicates the fetch, and
 * `content` already carries the defaults, so this never renders blank.
 */
export function useNiyamCopy() {
  const { content } = useSiteContent()
  return (key: NiyamCopyKey) => niyamCopyText(content.value.niyamCopy, key)
}
