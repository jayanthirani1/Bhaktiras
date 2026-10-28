import { HAAR_TRAIL_GOAL, isHaarBoard, traceHaarTrail } from '~/data/haarTrail'

/**
 * Hands back the Haar Trail evidence image, but only for a board whose petal
 * trail really reaches the kitchen door. The image sits in `server/assets`, not
 * `public/`, so the only way to it is through a solved puzzle.
 *
 * To change the image, replace `server/assets/haar-trail/evidence.*` with a
 * .jpg, .png or .webp of the same name and redeploy.
 */
const EVIDENCE: Array<[file: string, type: string]> = [
  ['haar-trail/evidence.jpg', 'image/jpeg'],
  ['haar-trail/evidence.png', 'image/png'],
  ['haar-trail/evidence.webp', 'image/webp']
]

export default defineEventHandler(async (event) => {
  const body = await readBody<{ rotations?: unknown }>(event)
  const rotations = body?.rotations
  if (!isHaarBoard(rotations) || !traceHaarTrail(rotations).reached.has(HAAR_TRAIL_GOAL)) {
    throw createError({ statusCode: 403, statusMessage: 'The trail does not lead there' })
  }

  const storage = useStorage('assets:server')
  for (const [file, type] of EVIDENCE) {
    const image = await storage.getItemRaw(file)
    if (!image) continue
    setResponseHeaders(event, { 'Content-Type': type, 'Cache-Control': 'no-store' })
    return image
  }
  throw createError({ statusCode: 500, statusMessage: 'Evidence image missing' })
})
