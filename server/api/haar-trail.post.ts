import { HAAR_TRAIL_GOAL, isHaarBoard, traceHaarTrail, type HaarEvidence } from '~/data/haarTrail'

/**
 * Hands back the Haar Trail evidence — the image and room 2 puzzle 5's chain of
 * evidence — but only for a board whose route really reaches Ankut prep. The
 * image sits in `server/assets` and the chain in `server/utils`, never in
 * `public/` or the client bundle, so the only way to either is a solved puzzle.
 *
 * To change the image, replace `server/assets/haar-trail/evidence.*` with a
 * .jpg, .png or .webp of the same name; the chain of evidence is
 * `server/utils/haarTrailChainOfEvidence.ts`. Redeploy after either.
 */
const IMAGES: Array<[file: string, type: string]> = [
  ['haar-trail/evidence.jpg', 'image/jpeg'],
  ['haar-trail/evidence.png', 'image/png'],
  ['haar-trail/evidence.webp', 'image/webp']
]

export default defineEventHandler(async (event): Promise<HaarEvidence> => {
  const body = await readBody<{ rotations?: unknown }>(event)
  const rotations = body?.rotations
  if (!isHaarBoard(rotations) || !traceHaarTrail(rotations).reached.has(HAAR_TRAIL_GOAL)) {
    throw createError({ statusCode: 403, statusMessage: 'The route does not lead there' })
  }

  const storage = useStorage('assets:server')
  for (const [file, type] of IMAGES) {
    const image = await storage.getItemRaw<Buffer>(file)
    if (!image) continue
    setResponseHeader(event, 'Cache-Control', 'no-store')
    return {
      image: `data:${type};base64,${Buffer.from(image).toString('base64')}`,
      chain: HAAR_TRAIL_CHAIN_OF_EVIDENCE
    }
  }
  throw createError({ statusCode: 500, statusMessage: 'Evidence image missing' })
})
