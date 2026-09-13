/**
 * Continuous reading text size for Nitya Niyam / document pages.
 * Slider 0–100 maps to rem; persisted under `bhaktiras-doc-font-rem`.
 */

export const DOC_FONT_STORAGE_KEY = 'bhaktiras-doc-font-rem'
/** Legacy three-step key — migrated once on read. */
export const DOC_FONT_LEGACY_KEY = 'bhaktiras-doc-font'

export const DOC_FONT_SLIDER_MIN = 0
export const DOC_FONT_SLIDER_MAX = 100
export const DOC_FONT_REM_MIN = 1
export const DOC_FONT_REM_MAX = 1.5
export const DOC_FONT_REM_DEFAULT = 1.175

const LEGACY_REM: Record<string, number> = {
  sm: 1.05,
  md: DOC_FONT_REM_DEFAULT,
  lg: 1.35
}

export function remFromSlider(slider: number): number {
  const t = Math.min(DOC_FONT_SLIDER_MAX, Math.max(DOC_FONT_SLIDER_MIN, slider)) / DOC_FONT_SLIDER_MAX
  return DOC_FONT_REM_MIN + t * (DOC_FONT_REM_MAX - DOC_FONT_REM_MIN)
}

export function sliderFromRem(rem: number): number {
  const clamped = Math.min(DOC_FONT_REM_MAX, Math.max(DOC_FONT_REM_MIN, rem))
  const t = (clamped - DOC_FONT_REM_MIN) / (DOC_FONT_REM_MAX - DOC_FONT_REM_MIN)
  return Math.round(t * DOC_FONT_SLIDER_MAX)
}

export function lineHeightForRem(rem: number, gujarati = false): string {
  if (gujarati) {
    if (rem < 1.1) return '1.85'
    if (rem < 1.3) return '2'
    return '2.15'
  }
  if (rem < 1.1) return '1.7'
  if (rem < 1.3) return '1.85'
  return '1.95'
}

export function docProseStyleFromRem(rem: number): Record<string, string> {
  return {
    '--doc-font-size': `${rem}rem`,
    '--doc-line-height': lineHeightForRem(rem, false),
    '--doc-line-height-gu': lineHeightForRem(rem, true)
  }
}

/** Read preferred rem from localStorage, migrating the old sm/md/lg key. */
export function readStoredDocFontRem(): number {
  if (!import.meta.client) return DOC_FONT_REM_DEFAULT
  const raw = localStorage.getItem(DOC_FONT_STORAGE_KEY)
  if (raw != null) {
    const n = Number(raw)
    if (Number.isFinite(n) && n >= DOC_FONT_REM_MIN && n <= DOC_FONT_REM_MAX) return n
  }
  const legacy = localStorage.getItem(DOC_FONT_LEGACY_KEY)
  if (legacy && legacy in LEGACY_REM) {
    const rem = LEGACY_REM[legacy]
    localStorage.setItem(DOC_FONT_STORAGE_KEY, String(rem))
    return rem
  }
  return DOC_FONT_REM_DEFAULT
}

export function writeStoredDocFontRem(rem: number) {
  if (!import.meta.client) return
  const clamped = Math.min(DOC_FONT_REM_MAX, Math.max(DOC_FONT_REM_MIN, rem))
  localStorage.setItem(DOC_FONT_STORAGE_KEY, String(clamped))
}
