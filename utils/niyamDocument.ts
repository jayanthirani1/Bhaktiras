import type { NiyamDocument } from '~/types'

export const NIYAM_DOCUMENT_TITLE_MAX = 120
export const NIYAM_DOCUMENT_BODY_MAX = 50_000

export type NiyamDocumentLanguage = 'en' | 'gu'

export function niyamDocumentBody(
  doc: Pick<NiyamDocument, 'bodyEnglish' | 'bodyGujarati'>,
  lang: NiyamDocumentLanguage
): string {
  const english = (doc.bodyEnglish || '').trim()
  const gujarati = (doc.bodyGujarati || '').trim()
  if (lang === 'gu') return gujarati || english
  return english || gujarati
}

export function niyamDocumentHasLanguage(
  doc: Pick<NiyamDocument, 'bodyEnglish' | 'bodyGujarati'>,
  lang: NiyamDocumentLanguage
): boolean {
  const text = lang === 'gu' ? doc.bodyGujarati : doc.bodyEnglish
  return !!(text || '').trim()
}

export function niyamDocumentLanguagesAvailable(
  doc: Pick<NiyamDocument, 'bodyEnglish' | 'bodyGujarati'>
): NiyamDocumentLanguage[] {
  const out: NiyamDocumentLanguage[] = []
  if (niyamDocumentHasLanguage(doc, 'en')) out.push('en')
  if (niyamDocumentHasLanguage(doc, 'gu')) out.push('gu')
  return out
}

export function defaultNiyamDocumentLanguage(
  doc: Pick<NiyamDocument, 'bodyEnglish' | 'bodyGujarati'>
): NiyamDocumentLanguage {
  if (niyamDocumentHasLanguage(doc, 'en')) return 'en'
  if (niyamDocumentHasLanguage(doc, 'gu')) return 'gu'
  return 'en'
}

export function mapNiyamDocument(id: string, data: Record<string, unknown>): NiyamDocument {
  return {
    id,
    title: String(data.title || '').trim().slice(0, NIYAM_DOCUMENT_TITLE_MAX),
    bodyEnglish: String(data.bodyEnglish || '').slice(0, NIYAM_DOCUMENT_BODY_MAX),
    bodyGujarati: String(data.bodyGujarati || '').slice(0, NIYAM_DOCUMENT_BODY_MAX),
    active: data.active !== false,
    order: Number(data.order) || 0,
    createdAt: data.createdAt as NiyamDocument['createdAt'],
    updatedAt: data.updatedAt as NiyamDocument['updatedAt']
  }
}
