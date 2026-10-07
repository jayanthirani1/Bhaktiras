/**
 * Lanka Leap simulation, shared by the play page and the Cloud Function that
 * replays submitted runs. A run is fully described by its seed and the ticks
 * on which the player leapt, so the server can re-fly it and get the same score.
 *
 * Determinism across JS engines: only + - * /, comparisons, Math.floor/min/max
 * and Math.imul are used here. No Math.sin, Math.sqrt or Math.random.
 */

export const TICK_MS = 1000 / 60
export const WORLD_WIDTH = 400
export const WORLD_HEIGHT = 640
export const SEA_LEVEL = 590
export const HERO_X = 110
export const HERO_RADIUS = 17
export const HERO_SMALL_RADIUS = 7
export const PILLAR_WIDTH = 64
/** Obstacle index of Lankini's gate; passing it means Hanumanji reached Lanka. */
export const LANKA_AT = 40
export const MAX_RUN_TICKS = 60 * 60 * 20

const GRAVITY = 0.36
const LEAP_VELOCITY = -6.6
const SMALL_LEAP_VELOCITY = -5
const MAX_FALL = 9.5
const SIMHIKA_PULL = 0.32
export const SIMHIKA_REACH = 110
const FIRST_GATE_X = 460
const SHRINK_TICKS = 150
const GRACE_TICKS = 70
const PICKUP_RADIUS = 14
/**
 * Hanumanji's drawn body around the head hit circle (tail and legs behind,
 * hand ahead). Pickups are collected anywhere on it; obstacles only hit the head.
 */
const BODY_BACK = 58
const BODY_FRONT = 30
const BODY_TOP = 22
const BODY_BOTTOM = 28
const SURASA_GAP = 72
const GAP_TOP_LIMIT = 130
const GAP_BOTTOM_LIMIT = SEA_LEVEL - 110

/** @typedef {'gate' | 'surasa' | 'simhika' | 'mainak' | 'lankini'} ObstacleKind */
/** @typedef {'tulsi' | 'laghima' | 'mainak'} PickupKind */
/** @typedef {'rock' | 'sea' | 'surasa' | 'simhika' | 'lankini' | 'time'} DeathCause */
/** @typedef {'leap' | 'score' | 'tulsi' | 'laghima' | 'mainak' | 'shield-break' | 'lanka' | 'dead'} RunEvent */

/**
 * @typedef {object} Pickup
 * @property {PickupKind} kind
 * @property {number} x
 * @property {number} y
 * @property {boolean} taken
 */

/**
 * @typedef {object} Obstacle
 * @property {number} index
 * @property {ObstacleKind} kind
 * @property {number} x
 * @property {number} gapTop
 * @property {number} gapBottom Sea level when there is no lower pillar.
 * @property {number} reachY Simhika pulls Hanumanji down below this line; Infinity elsewhere.
 * @property {Pickup | null} pickup
 * @property {boolean} passed
 */

/**
 * @typedef {object} RunState
 * @property {number} tick
 * @property {number} y
 * @property {number} vy
 * @property {number} distance
 * @property {number} score
 * @property {number} tulsi
 * @property {number} leaps
 * @property {boolean} alive
 * @property {boolean} shield
 * @property {number} shrinkTicks
 * @property {number} graceTicks
 * @property {boolean} grabbed
 * @property {boolean} reachedLanka
 * @property {DeathCause | null} cause
 * @property {Obstacle[]} course
 * @property {number} firstActive
 * @property {RunEvent[]} events
 * @property {() => number} rnd
 * @property {number} nextSurasa
 * @property {number} nextMainak
 * @property {number} nextSimhika
 */

/** @param {number} seed */
function mulberry32(seed) {
  let a = seed | 0
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** @param {string} value */
function hashString(value) {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** @param {string} dateId */
export function lankaLeapSeed(dateId) {
  return `lanka-leap:${dateId}`
}

/** @param {number} value @param {number} lo @param {number} hi */
function clamp(value, lo, hi) {
  return value < lo ? lo : value > hi ? hi : value
}

/** Difficulty ramps to Lanka, then keeps climbing more gently beyond it. */
function difficulty(index) {
  const toLanka = Math.min(index / LANKA_AT, 1)
  const beyond = index > LANKA_AT ? Math.min((index - LANKA_AT) / 40, 1) : 0
  return { toLanka, beyond }
}

/** @param {number} score */
export function speedFor(score) {
  const { toLanka, beyond } = difficulty(score)
  return 2.6 + 0.8 * toLanka + 0.4 * beyond
}

/** @param {number} index */
function spacingFor(index) {
  const { toLanka, beyond } = difficulty(index)
  return 250 - 45 * toLanka - 15 * beyond
}

/** @param {RunState} s @param {number} index */
function scheduleAvoidingLanka(s, index) {
  return index === LANKA_AT || index === LANKA_AT + 1 ? LANKA_AT + 2 : index
}

/** @param {RunState} s @param {number} index @returns {Obstacle} */
function makeObstacle(s, index) {
  const rnd = s.rnd
  const prev = index > 0 ? s.course[index - 1] : null
  const x = prev ? prev.x + spacingFor(index) : FIRST_GATE_X

  /** @type {ObstacleKind} */
  let kind = 'gate'
  if (index === LANKA_AT) kind = 'lankini'
  else if (index === s.nextSurasa) {
    kind = 'surasa'
    s.nextSurasa = scheduleAvoidingLanka(s, index + 8 + Math.floor(rnd() * 5))
  } else if (index >= s.nextMainak && index + 1 !== s.nextSurasa) {
    kind = 'mainak'
    s.nextMainak = index + 11 + Math.floor(rnd() * 6)
  } else if (index >= s.nextSimhika && index + 1 !== s.nextSurasa) {
    kind = 'simhika'
    s.nextSimhika = index + 7 + Math.floor(rnd() * 5)
  }

  const { toLanka, beyond } = difficulty(index)
  let gap = 196 - 56 * toLanka - 16 * beyond
  if (kind === 'surasa') gap = SURASA_GAP
  if (kind === 'lankini') gap = 170

  const prevCenter = prev ? (prev.gapTop + (prev.kind === 'simhika' ? prev.reachY - 30 : prev.gapBottom)) / 2 : SEA_LEVEL / 2
  const maxShift = kind === 'surasa' ? 90 : 160
  const lo = GAP_TOP_LIMIT + gap / 2
  const hi = (kind === 'simhika' ? GAP_BOTTOM_LIMIT - 110 : GAP_BOTTOM_LIMIT) - gap / 2
  const target = lo + rnd() * (hi - lo)
  const center = clamp(clamp(target, prevCenter - maxShift, prevCenter + maxShift), lo, hi)
  const gapTop = center - gap / 2
  const lower = center + gap / 2

  /** @type {Pickup | null} */
  let pickup = null
  const midX = x + PILLAR_WIDTH / 2
  if (index + 1 === s.nextSurasa) pickup = { kind: 'laghima', x: midX, y: center, taken: false }
  else if (kind === 'mainak') pickup = { kind: 'mainak', x: midX, y: lower - 24, taken: false }
  else if (kind !== 'surasa' && rnd() < 0.6) {
    pickup = { kind: 'tulsi', x: midX, y: center + (rnd() * 2 - 1) * (gap / 2 - 30), taken: false }
  }

  return {
    index,
    kind,
    x,
    gapTop,
    gapBottom: kind === 'simhika' ? SEA_LEVEL : lower,
    reachY: kind === 'simhika' ? lower + 30 : Infinity,
    pickup,
    passed: false
  }
}

/** @param {RunState} s */
function ensureCourse(s) {
  const horizon = s.distance + WORLD_WIDTH + 400
  while (!s.course.length || s.course[s.course.length - 1].x < horizon) {
    s.course.push(makeObstacle(s, s.course.length))
  }
}

/** @param {string} seed @returns {RunState} */
export function createRun(seed) {
  const rnd = mulberry32(hashString(seed))
  for (let i = 0; i < 8; i++) rnd()
  /** @type {RunState} */
  const s = {
    tick: 0,
    y: SEA_LEVEL / 2 - 40,
    vy: 0,
    distance: 0,
    score: 0,
    tulsi: 0,
    leaps: 0,
    alive: true,
    shield: false,
    shrinkTicks: 0,
    graceTicks: 0,
    grabbed: false,
    reachedLanka: false,
    cause: null,
    course: [],
    firstActive: 0,
    events: [],
    rnd,
    nextSurasa: 0,
    nextMainak: 0,
    nextSimhika: 0
  }
  s.nextSurasa = 7 + Math.floor(rnd() * 3)
  s.nextMainak = 10 + Math.floor(rnd() * 4)
  s.nextSimhika = 4 + Math.floor(rnd() * 3)
  ensureCourse(s)
  return s
}

/** @param {number} cx @param {number} cy @param {number} r @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2 */
function hitsRect(cx, cy, r, x1, y1, x2, y2) {
  const nx = clamp(cx, x1, x2)
  const ny = clamp(cy, y1, y2)
  const dx = cx - nx
  const dy = cy - ny
  return dx * dx + dy * dy < r * r
}

/** @param {RunState} s @param {DeathCause} cause */
function takeHit(s, cause) {
  if (s.graceTicks > 0) return
  if (s.shield) {
    s.shield = false
    s.graceTicks = GRACE_TICKS
    s.events.push('shield-break')
    return
  }
  s.alive = false
  s.cause = cause
  s.events.push('dead')
}

/** @param {RunState} s */
export function heroRadius(s) {
  return s.shrinkTicks > 0 ? HERO_SMALL_RADIUS : HERO_RADIUS
}

/**
 * Advances the run by one tick.
 * @param {RunState} s
 * @param {boolean} leap
 */
export function step(s, leap) {
  s.events.length = 0
  if (!s.alive) return

  const small = s.shrinkTicks > 0
  if (leap) {
    s.vy = small ? SMALL_LEAP_VELOCITY : LEAP_VELOCITY
    s.leaps++
    s.events.push('leap')
  }

  const r = heroRadius(s)
  const hx = s.distance + HERO_X

  s.grabbed = false
  for (let i = s.firstActive; i < s.course.length; i++) {
    const o = s.course[i]
    if (o.x - SIMHIKA_REACH > hx) break
    if (o.kind === 'simhika' && hx > o.x - SIMHIKA_REACH && hx < o.x + PILLAR_WIDTH + SIMHIKA_REACH && s.y > o.reachY) {
      s.grabbed = true
    }
  }

  s.vy = Math.min(s.vy + GRAVITY + (s.grabbed ? SIMHIKA_PULL : 0), MAX_FALL)
  s.y += s.vy
  if (s.y < r) {
    s.y = r
    if (s.vy < 0) s.vy = 0
  }
  s.distance += speedFor(s.score)
  s.tick++
  if (s.shrinkTicks > 0) s.shrinkTicks--
  if (s.graceTicks > 0) s.graceTicks--
  ensureCourse(s)

  const x = s.distance + HERO_X
  const rNow = heroRadius(s)
  const body = rNow / HERO_RADIUS
  const front = Math.max(rNow, BODY_FRONT * body)
  for (let i = s.firstActive; i < s.course.length; i++) {
    const o = s.course[i]
    if (o.x > x + front + PICKUP_RADIUS) break
    if (o.x + PILLAR_WIDTH < x - HERO_X - 40) {
      if (i === s.firstActive) s.firstActive = i + 1
      continue
    }

    const p = o.pickup
    if (p && !p.taken) {
      if (hitsRect(p.x, p.y, PICKUP_RADIUS, x - BODY_BACK * body, s.y - BODY_TOP * body, x + BODY_FRONT * body, s.y + BODY_BOTTOM * body)) {
        p.taken = true
        if (p.kind === 'tulsi') {
          s.tulsi++
          s.events.push('tulsi')
        } else if (p.kind === 'laghima') {
          s.shrinkTicks = SHRINK_TICKS
          s.events.push('laghima')
        } else {
          s.shield = true
          s.events.push('mainak')
        }
      }
    }

    if (!o.passed && x - rNow > o.x + PILLAR_WIDTH) {
      o.passed = true
      s.score++
      s.events.push('score')
      if (o.kind === 'lankini') {
        s.reachedLanka = true
        s.events.push('lanka')
      }
    }

    if (s.graceTicks === 0) {
      const cause = o.kind === 'gate' || o.kind === 'mainak' ? 'rock' : o.kind
      if (hitsRect(x, s.y, rNow, o.x, -1000, o.x + PILLAR_WIDTH, o.gapTop)) takeHit(s, cause)
      else if (o.gapBottom < SEA_LEVEL && hitsRect(x, s.y, rNow, o.x, o.gapBottom, o.x + PILLAR_WIDTH, SEA_LEVEL)) takeHit(s, cause)
      if (!s.alive) return
    }
  }

  if (s.y + rNow >= SEA_LEVEL) {
    if (s.shield || s.graceTicks > 0) {
      if (s.graceTicks === 0) takeHit(s, s.grabbed ? 'simhika' : 'sea')
      s.y = SEA_LEVEL - rNow - 1
      s.vy = LEAP_VELOCITY
    } else {
      takeHit(s, s.grabbed ? 'simhika' : 'sea')
    }
  }

  if (s.alive && s.tick >= MAX_RUN_TICKS) {
    s.alive = false
    s.cause = 'time'
    s.events.push('dead')
  }
}

/**
 * Re-flies a run from its leap ticks. Used to verify a submitted score.
 * @param {string} seed
 * @param {number[]} leapTicks Ascending tick numbers on which the player leapt.
 */
export function simulateRun(seed, leapTicks) {
  const s = createRun(seed)
  let next = 0
  while (s.alive) {
    const leap = next < leapTicks.length && leapTicks[next] === s.tick
    if (leap) next++
    step(s, leap)
  }
  return {
    score: s.score,
    tulsi: s.tulsi,
    reachedLanka: s.reachedLanka,
    ticks: s.tick,
    cause: s.cause,
    leapsUsed: next
  }
}
