import type { CommunityReactionKey } from '~/types'

export interface CommunityReaction {
  key: CommunityReactionKey
  emoji: string
  /** Screen-reader and tooltip wording — the wall itself shows only the emoji. */
  label: string
}

/**
 * The wall's whole reaction vocabulary, in the order it is shown.
 *
 * Adding one here is not enough: the key has to be added to `reactionKeys()`
 * in `firestore.rules` too, which is what actually decides which counts a
 * browser is allowed to move. The rules are the list; this is the rendering of
 * it.
 */
export const COMMUNITY_REACTIONS: readonly CommunityReaction[] = [
  { key: 'like', emoji: '👍', label: 'Like' },
  { key: 'love', emoji: '❤️', label: 'Love' },
  { key: 'smile', emoji: '😀', label: 'Smile' },
  { key: 'honey', emoji: '🍯', label: 'Sweet' },
  { key: 'strength', emoji: '💪', label: 'Strength' }
] as const

export const COMMUNITY_REACTION_KEYS: readonly CommunityReactionKey[] =
  COMMUNITY_REACTIONS.map(reaction => reaction.key)

export function isCommunityReactionKey(value: unknown): value is CommunityReactionKey {
  return typeof value === 'string' && COMMUNITY_REACTION_KEYS.includes(value as CommunityReactionKey)
}
