import type { HaarChainOfEvidence } from '~/data/haarTrail'

/**
 * Room 2, puzzle 5's chain of evidence, shown under the evidence image once a
 * team rebuilds the Haar's route. It lives on the server, not in `data/`, so it
 * only ever reaches a browser through a solved board.
 *
 * PLACEHOLDER — the real chain of evidence is still being written. Replace the
 * entries below, set `placeholder` to false, and redeploy.
 */
export const HAAR_TRAIL_CHAIN_OF_EVIDENCE: HaarChainOfEvidence = {
  placeholder: true,
  title: 'Room 2 · Puzzle 5: Chain of evidence',
  intro: 'Every hand the Haar passed through, in order. Check each link against the case files.',
  entries: [
    { time: '00:00', text: 'Placeholder: the first link in the chain of evidence.' },
    { time: '00:00', text: 'Placeholder: the second link in the chain of evidence.' },
    { time: '00:00', text: 'Placeholder: the third link in the chain of evidence.' },
    { time: '00:00', text: 'Placeholder: the fourth link in the chain of evidence.' }
  ]
}
