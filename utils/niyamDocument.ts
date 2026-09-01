import type { NiyamDocument, NiyamDocumentChapter } from '~/types'
import { safeResourceUrl } from '~/utils/niyamChallenge'

export const NIYAM_DOCUMENT_TITLE_MAX = 120
export const NIYAM_DOCUMENT_BODY_MAX = 50_000
export const NIYAM_DOCUMENT_CHAPTER_TITLE_MAX = 120
export const NIYAM_DOCUMENT_MAX_CHAPTERS = 100

export type NiyamDocumentLanguage = 'en' | 'gu'

type NiyamDocumentBodySource = Pick<NiyamDocument, 'bodyEnglish' | 'bodyGujarati'>

function trimBody(value: string | null | undefined, max = NIYAM_DOCUMENT_BODY_MAX) {
  return String(value || '').slice(0, max)
}

export function newNiyamDocumentChapterId() {
  return `ch_${Math.random().toString(36).slice(2, 10)}`
}

export function mapNiyamDocumentChapter(raw: unknown): NiyamDocumentChapter | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Record<string, unknown>
  const id = String(data.id || '').trim()
  if (!id) return null
  const title = String(data.title || '').trim().slice(0, NIYAM_DOCUMENT_CHAPTER_TITLE_MAX)
  return {
    id,
    title: title || undefined,
    bodyEnglish: trimBody(data.bodyEnglish as string | undefined),
    bodyGujarati: trimBody(data.bodyGujarati as string | undefined)
  }
}

export function niyamDocumentChapterHasContent(chapter: Pick<NiyamDocumentChapter, 'bodyEnglish' | 'bodyGujarati'>) {
  return !!(chapter.bodyEnglish || '').trim() || !!(chapter.bodyGujarati || '').trim()
}

export function niyamDocumentChapters(doc: Pick<NiyamDocument, 'chapters'>): NiyamDocumentChapter[] {
  const chapters = Array.isArray(doc.chapters) ? doc.chapters : []
  return chapters
    .map(chapter => mapNiyamDocumentChapter(chapter))
    .filter((chapter): chapter is NiyamDocumentChapter => !!chapter)
    .filter(niyamDocumentChapterHasContent)
    .slice(0, NIYAM_DOCUMENT_MAX_CHAPTERS)
}

export function niyamDocumentUsesChapters(doc: Pick<NiyamDocument, 'chapters'>) {
  return niyamDocumentChapters(doc).length > 0
}

export function niyamDocumentContentSource(
  doc: NiyamDocument,
  chapterIndex = 0
): NiyamDocumentBodySource {
  const chapters = niyamDocumentChapters(doc)
  if (chapters.length > 0) {
    return chapters[chapterIndex] ?? { bodyEnglish: '', bodyGujarati: '' }
  }
  return doc
}

export function niyamDocumentBody(
  doc: NiyamDocument,
  lang: NiyamDocumentLanguage,
  chapterIndex = 0
): string {
  const source = niyamDocumentContentSource(doc, chapterIndex)
  const english = (source.bodyEnglish || '').trim()
  const gujarati = (source.bodyGujarati || '').trim()
  if (lang === 'gu') return gujarati || english
  return english || gujarati
}

export function niyamDocumentHasLanguage(
  doc: NiyamDocument,
  lang: NiyamDocumentLanguage,
  chapterIndex = 0
): boolean {
  const source = niyamDocumentContentSource(doc, chapterIndex)
  const text = lang === 'gu' ? source.bodyGujarati : source.bodyEnglish
  return !!(text || '').trim()
}

export function niyamDocumentLanguagesAvailable(
  doc: NiyamDocument,
  chapterIndex = 0
): NiyamDocumentLanguage[] {
  const out: NiyamDocumentLanguage[] = []
  if (niyamDocumentHasLanguage(doc, 'en', chapterIndex)) out.push('en')
  if (niyamDocumentHasLanguage(doc, 'gu', chapterIndex)) out.push('gu')
  return out
}

export function defaultNiyamDocumentLanguage(
  doc: NiyamDocument,
  chapterIndex = 0
): NiyamDocumentLanguage {
  if (niyamDocumentHasLanguage(doc, 'en', chapterIndex)) return 'en'
  if (niyamDocumentHasLanguage(doc, 'gu', chapterIndex)) return 'gu'
  return 'en'
}

export function niyamDocumentHasAnyContent(doc: Pick<NiyamDocument, 'bodyEnglish' | 'bodyGujarati' | 'chapters'>) {
  if (niyamDocumentUsesChapters(doc)) return true
  return !!(doc.bodyEnglish || '').trim() || !!(doc.bodyGujarati || '').trim()
}

export function mapNiyamDocument(id: string, data: Record<string, unknown>): NiyamDocument {
  const chapters = Array.isArray(data.chapters)
    ? data.chapters
        .map(chapter => mapNiyamDocumentChapter(chapter))
        .filter((chapter): chapter is NiyamDocumentChapter => !!chapter)
        .slice(0, NIYAM_DOCUMENT_MAX_CHAPTERS)
    : undefined

  return {
    id,
    title: String(data.title || '').trim().slice(0, NIYAM_DOCUMENT_TITLE_MAX),
    bodyEnglish: trimBody(data.bodyEnglish as string | undefined),
    bodyGujarati: trimBody(data.bodyGujarati as string | undefined),
    chapters: chapters?.length ? chapters : undefined,
    audioUrl: safeResourceUrl(data.audioUrl) || undefined,
    active: data.active !== false,
    order: Number(data.order) || 0,
    createdAt: data.createdAt as NiyamDocument['createdAt'],
    updatedAt: data.updatedAt as NiyamDocument['updatedAt']
  }
}
