import type { NiyamChallenge } from '~/types'
import { SITE } from '~/data/site'

/**
 * The five niyams the sangat is keeping between now and the Patotsav.
 *
 * These are *defaults*, in the same two-layer shape as `data/timeline.ts`: the
 * page renders them so the niyams area is never blank, and an admin publishing
 * one writes a real `niyamChallenges/{id}` document that then wins on every
 * field. Until that document exists a niyam cannot take entries at all — the
 * security rules require the challenge document to be there before a
 * submission is accepted — so the card says so rather than failing on submit.
 *
 * Ids are stable slugs, not generated, precisely so a published document and
 * its default collapse into one entry in the list.
 */

/** Everything an admin's "publish" writes; the runtime fields are added on read. */
export type NiyamChallengeSeed = Omit<NiyamChallenge, 'origin' | 'createdAt' | 'updatedAt'>

/** The utsav closes every niyam — that is the point they are counted towards. */
const NIYAM_END = new Date(SITE.patotsavEnd)

/**
 * The counts the sangat already thinks in — a sankalp is taken as 11 or 21,
 * never as 10 or 20 — with 1 first for whoever recites one a day.
 */
const DEVOTIONAL_PRESETS = [1, 5, 11, 21]

export const DEFAULT_NIYAM_CHALLENGES: NiyamChallengeSeed[] = [
  {
    id: 'janmangal-stotra',
    title: 'Janmangal Stotra',
    detail:
      'Every Janmangal Namavali you recite at home or at the mandir counts towards ten lakh for the Patotsav.',
    unit: 'stotras',
    unitSingular: 'stotra',
    target: 1_000_000,
    startAt: null,
    endAt: NIYAM_END,
    active: true,
    order: 1,
    autoApproveMax: 108,
    maxPerSubmission: 1000,
    inputMode: 'count',
    presets: DEVOTIONAL_PRESETS,
    hint: 'One complete recitation of the Janmangal Namavali is one stotra.',
    // A counter is no use to somebody who does not have the words. This is the
    // Kirtanavali page for the Namavali; the link is admin-editable per niyam.
    resourceUrl: 'https://path.swaminarayan.faith/kirtanavali/kirtans/660/36917',
    resourceLabel: 'Read the Janmangal Namavali',
    icon: 'stotra'
  },
  {
    id: 'mala',
    title: 'Mala',
    detail: 'Turn your mala at any time of day and add the rounds here — ten lakh together.',
    unit: 'malas',
    unitSingular: 'mala',
    target: 1_000_000,
    startAt: null,
    endAt: NIYAM_END,
    active: true,
    order: 2,
    autoApproveMax: 21,
    maxPerSubmission: 108,
    inputMode: 'count',
    presets: [1, 2, 5, 11],
    hint: 'One full round of 108 beads is one mala.',
    icon: 'mala'
  },
  {
    id: 'mandir-darshan',
    title: 'Daily Darshan',
    detail: 'Come to the mandir for morning or evening sabha — one check-in for each, twice a day.',
    unit: 'sabhas',
    unitSingular: 'sabha',
    target: 10_000,
    startAt: null,
    endAt: NIYAM_END,
    active: true,
    order: 3,
    autoApproveMax: 1,
    maxPerSubmission: 2,
    inputMode: 'checkin',
    presets: [1],
    hint: 'One morning sabha and one evening sabha — Aarti, Chesta or Katha in person.',
    icon: 'mandir'
  },
  {
    id: 'shanti-path',
    title: 'Shanti Path',
    detail: 'All five chapters make one full path. Ten thousand complete paths before the utsav.',
    unit: 'paths',
    unitSingular: 'path',
    target: 10_000,
    startAt: null,
    endAt: NIYAM_END,
    active: true,
    order: 4,
    autoApproveMax: 5,
    maxPerSubmission: 40,
    inputMode: 'count',
    presets: [1, 2, 3, 5],
    hint: 'Only complete paths count — all five chapters.',
    icon: 'path'
  },
  {
    id: 'dandvat-pranam',
    title: 'Dandvat & Panchang Pranaam',
    detail: 'Each dandvat or panchang pranaam offered at the charanarvind counts towards ten lakh.',
    unit: 'pranaams',
    unitSingular: 'pranaam',
    target: 1_000_000,
    startAt: null,
    endAt: NIYAM_END,
    active: true,
    order: 5,
    autoApproveMax: 108,
    maxPerSubmission: 1008,
    inputMode: 'count',
    presets: [11, 21, 51, 108],
    hint: 'One dandvat or one panchang pranaam is one.',
    icon: 'dandvat'
  }
]

export const DEFAULT_NIYAM_IDS = DEFAULT_NIYAM_CHALLENGES.map(c => c.id)

export function defaultNiyamChallenge(id: string): NiyamChallengeSeed | undefined {
  return DEFAULT_NIYAM_CHALLENGES.find(c => c.id === id)
}
