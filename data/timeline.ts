import { SITE } from '~/data/site'

/** Year picker is journeyStartYear through journeyEndYear (Patotsav). */
export function journeyYears(): number[] {
  const end = SITE.journeyEndYear
  const start = SITE.journeyStartYear
  const years: number[] = []
  for (let y = start; y <= end; y++) years.push(y)
  return years
}
