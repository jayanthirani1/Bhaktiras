import type { TimelineItem } from '~/types'
import { SITE } from '~/data/site'

/**
 * Local journey milestones. Firestore `timeline` docs overlay/add to this.
 * Year picker is the last 10 years including 2027 (Patotsav).
 */
export const JOURNEY_MILESTONES: TimelineItem[] = [
  { id: '1987', year: '1987', date: '1987', title: 'The first steps', description: 'The Woolwich satsang mandal begins gathering — small sabhas, big hearts. This is year one of a 39-year journey.' },
  { id: '1990', year: '1990', date: '1990', title: 'A growing mandal', description: 'Families join, children learn aarti, and the weekly sabha becomes a home away from home.' },
  { id: '1995', year: '1995', date: '1995', title: 'Seva takes root', description: 'Kitchen, kids, and kirtan teams form. Seva stops being a task and becomes a sanskar.' },
  { id: '2000', year: '2000', date: '2000', title: 'A new century of bhakti', description: 'Utsavs grow. The mandal starts dreaming of a permanent mandir home in Woolwich.' },
  { id: '2005', year: '2005', date: '2005', title: 'Youth find their voice', description: 'Kishore-kishori sabhas, sports, and katha — the next generation steps forward.' },
  { id: '2010', year: '2010', date: '2010', title: 'Community beyond the sabha', description: 'Outreach, festivals, and friendships with the wider Woolwich community deepen.' },
  { id: '2015', year: '2015', date: '2015', title: 'A decade of devotion in a new chapter', description: 'The mandir’s presence in SE London becomes unmistakable — darshan, festivals, and daily niyams.' },
  { id: '2016', year: '2016', date: '2016', title: 'Bhaktiras takes shape', description: 'A name, a feeling, a promise: this mandir belongs to everyone who walks in.' },
  { id: '2020', year: '2020', date: '2020', title: 'Bhakti through the screen', description: 'When the doors closed, the satsang did not. Online sabha, phone seva, and care for elders.' },
  { id: '2023', year: '2023', date: '2023', title: 'Together again', description: 'Halls fill. Children run. The mandir sounds like home once more.' },
  { id: '2025', year: '2025', date: '2025', title: 'Towards Patotsav', description: 'Teams form, niyams begin, and the countdown to mahotsav starts in every sabha.' },
  { id: '2026', year: '2026', date: '2026', title: 'Towards mahotsav', description: 'Teams form, niyams deepen, and the countdown to Patotsav fills every sabha.' },
  { id: '2027', year: '2027', date: '2027', title: 'Bhaktiras Patotsav', description: 'Celebrating 10 years of this mandir chapter — with Ghanshyam Maharaj. Saturday 14th August – Sunday 22nd August.' }
]

export function journeyYears(): number[] {
  const end = SITE.journeyEndYear
  const start = SITE.journeyStartYear
  const years: number[] = []
  for (let y = start; y <= end; y++) years.push(y)
  return years
}
