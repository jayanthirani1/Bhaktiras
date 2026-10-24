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
/** Obstacle index where the fire ends and Nala's bridge begins. */
export const BRIDGE_AT = LANKA_AT + 24
/** Obstacle index where the crossing gives way to the battle on Lanka. */
export const BATTLE_AT = BRIDGE_AT + 8
/** Obstacle index of Ravan's chariot. The battle runs much longer than the fire. */
export const RAVAN_AT = BATTLE_AT + 40
export const MAX_RUN_TICKS = 60 * 60 * 20

const GRAVITY = 0.36
const FLOAT_GRAVITY = 0.28
const LEAP_VELOCITY = -6.6
const GREAT_LEAP_VELOCITY = -7.4
const FLOAT_TICKS = 18
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
/** How far before a rooftop the flames start to climb. */
export const FIRE_LEAD = 340
/** Gap left above the flames once they have fully risen. */
export const FIRE_CLEAR = 108

/** @typedef {'gate' | 'surasa' | 'simhika' | 'mainak' | 'lankini' | 'roof' | 'setu' | 'stone' | 'field' | 'ravan' | 'dawn'} ObstacleKind */
/** @typedef {'tulsi' | 'laghima' | 'mainak' | 'sanjeevani'} PickupKind */
/** @typedef {'rock' | 'sea' | 'surasa' | 'simhika' | 'lankini' | 'tower' | 'fire' | 'stone' | 'field' | 'ravan' | 'time'} DeathCause */
/** @typedef {'leap' | 'score' | 'tulsi' | 'laghima' | 'mainak' | 'sanjeevani' | 'shield-break' | 'lanka' | 'bridge' | 'battle' | 'ravan' | 'dead'} RunEvent */

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
 * @property {boolean} reachedBridge
 * @property {boolean} reachedBattle
 * @property {boolean} reachedRavan
 * @property {boolean} greatLeap Sanjeevani is stored. The next leap rises higher.
 * @property {number} floatTicks Remaining ticks of the lighter sanjeevani leap.
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
/** 0 at Ravan's chariot, 1 after fifty-five more gates. The way home tightens faster than the battle. */
function pastRavan(index) {
  return index > RAVAN_AT ? Math.min((index - RAVAN_AT) / 55, 1) : 0
}

/** @param {number} score */
export function speedFor(score) {
  const { toLanka, beyond } = difficulty(score)
  const climb = score > BRIDGE_AT ? (BRIDGE_AT - LANKA_AT) / 40 : beyond
  const battle = score > BATTLE_AT ? Math.min((score - BATTLE_AT) / 40, 1) : 0
  return 2.6 + 0.8 * toLanka + 0.2 * climb + 0.55 * battle + 1.7 * pastRavan(score)
}

/** @param {number} index */
function spacingFor(index) {
  if (index > RAVAN_AT) return 214 - 62 * pastRavan(index)
  if (index >= BATTLE_AT) return 228
  if (index >= BRIDGE_AT) return 240
  const { toLanka, beyond } = difficulty(index)
  return 250 - 45 * toLanka - 8 * beyond
}

/** @param {RunState} s @param {number} index */
function scheduleAvoidingLanka(s, index) {
  return index === LANKA_AT || index === LANKA_AT + 1 ? LANKA_AT + 2 : index
}

/**
 * Top of the flames in a rooftop gap. Rises as Hanumanji approaches, and is
 * level with the roof when he is still far away. Rendering uses the same line.
 * @param {Obstacle} obstacle
 * @param {number} heroX
 */
export function flameTop(obstacle, heroX) {
  if (!obstacle || obstacle.index <= LANKA_AT || obstacle.index >= BRIDGE_AT) return obstacle ? obstacle.gapBottom : SEA_LEVEL
  const room = obstacle.gapBottom - obstacle.gapTop - FIRE_CLEAR
  if (room <= 0) return obstacle.gapBottom
  const t = clamp((heroX - (obstacle.x - FIRE_LEAD)) / FIRE_LEAD, 0, 1)
  return obstacle.gapBottom - room * t * 0.68
}

/**
 * How far a gate has drifted this tick. Chariots after the bridge rise and
 * fall. Rendering uses the same shift as the collision.
 * @param {Obstacle} obstacle
 * @param {number} tick
 */
export function gapShift(obstacle, tick) {
  if (!obstacle || (obstacle.kind !== 'field' && obstacle.kind !== 'ravan' && obstacle.kind !== 'dawn')) return 0
  const period = obstacle.kind === 'ravan' ? 56 : obstacle.kind === 'dawn' ? 74 - Math.floor(32 * pastRavan(obstacle.index)) : 72
  const amp = obstacle.kind === 'field'
    ? 22 + Math.min(obstacle.index - BATTLE_AT, 28) * 0.65
    : obstacle.kind === 'ravan' ? 20 : 16 + 26 * pastRavan(obstacle.index)
  const cycle = period * 2
  const m = (tick + obstacle.index * 37) % cycle
  const tri = m < period ? m / period : (cycle - m) / period
  let shift = (tri * 2 - 1) * amp
  if (obstacle.gapTop + shift < 72) shift = 72 - obstacle.gapTop
  if (obstacle.gapBottom + shift > SEA_LEVEL - 72) shift = SEA_LEVEL - 72 - obstacle.gapBottom
  return shift
}

/** @param {RunState} s @param {number} index @returns {Obstacle} */
function makeObstacle(s, index) {
  const rnd = s.rnd
  const prev = index > 0 ? s.course[index - 1] : null
  const x = prev ? prev.x + spacingFor(index) : FIRST_GATE_X

  /** @type {ObstacleKind} */
  let kind = 'gate'
  if (index === LANKA_AT) kind = 'lankini'
  else if (index === BRIDGE_AT) kind = 'setu'
  else if (index === RAVAN_AT) kind = 'ravan'
  else if (index > RAVAN_AT) kind = 'dawn'
  else if (index >= BATTLE_AT) kind = 'field'
  else if (index > BRIDGE_AT) kind = 'stone'
  else if (index > LANKA_AT) kind = 'roof'
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
  if (kind === 'roof') gap = 228 - Math.min(index - LANKA_AT, 12)
  if (kind === 'setu' || kind === 'stone') gap = 206
  if (kind === 'field') gap = 190 - Math.min(index - BATTLE_AT, 32) * 1.25
  if (kind === 'ravan') gap = 150
  if (kind === 'dawn') gap = 166 - 50 * pastRavan(index)

  const prevCenter = prev ? (prev.gapTop + (prev.kind === 'simhika' ? prev.reachY - 30 : prev.gapBottom)) / 2 : SEA_LEVEL / 2
  const dawnShift = 64 + 48 * pastRavan(index)
  const maxShift = kind === 'surasa' ? 90 : kind === 'roof' ? 80 : kind === 'setu' || kind === 'stone' ? 62 : kind === 'field' ? 74 : kind === 'ravan' ? 34 : kind === 'dawn' ? dawnShift : 160
  const lo = GAP_TOP_LIMIT + gap / 2
  const hi = (kind === 'simhika' ? GAP_BOTTOM_LIMIT - 110 : GAP_BOTTOM_LIMIT) - gap / 2
  const target = lo + rnd() * (hi - lo)
  const center = clamp(clamp(target, prevCenter - maxShift, prevCenter + maxShift), lo, hi)
  const gapTop = center - gap / 2
  const lower = center + gap / 2

  /** @type {Pickup | null} */
  let pickup = null
  const midX = x + PILLAR_WIDTH / 2
  if (index <= LANKA_AT && index + 1 === s.nextSurasa) pickup = { kind: 'laghima', x: midX, y: center, taken: false }
  else if (kind === 'mainak') pickup = { kind: 'mainak', x: midX, y: lower - 24, taken: false }
  else if ((kind === 'field' && (index === RAVAN_AT - 1 || rnd() < 0.16)) || (kind === 'dawn' && rnd() < 0.07)) pickup = { kind: 'sanjeevani', x: midX, y: center, taken: false }
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
    reachedBridge: false,
    reachedBattle: false,
    reachedRavan: false,
    greatLeap: false,
    floatTicks: 0,
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
    if (s.greatLeap && !small) {
      s.vy = GREAT_LEAP_VELOCITY
      s.greatLeap = false
      s.floatTicks = FLOAT_TICKS
    } else {
      s.vy = small ? SMALL_LEAP_VELOCITY : LEAP_VELOCITY
    }
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

  const gravity = s.floatTicks > 0 ? FLOAT_GRAVITY : GRAVITY
  s.vy = Math.min(s.vy + gravity + (s.grabbed ? SIMHIKA_PULL : 0), MAX_FALL)
  s.y += s.vy
  if (s.y < r) {
    s.y = r
    if (s.vy < 0) s.vy = 0
  }
  s.distance += speedFor(s.score)
  s.tick++
  if (s.shrinkTicks > 0) s.shrinkTicks--
  if (s.graceTicks > 0) s.graceTicks--
  if (s.floatTicks > 0) s.floatTicks--
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
    const shift = gapShift(o, s.tick)
    if (p && !p.taken) {
      if (hitsRect(p.x, p.y + shift, PICKUP_RADIUS, x - BODY_BACK * body, s.y - BODY_TOP * body, x + BODY_FRONT * body, s.y + BODY_BOTTOM * body)) {
        p.taken = true
        if (p.kind === 'tulsi') {
          s.tulsi++
          s.events.push('tulsi')
        } else if (p.kind === 'laghima') {
          s.shrinkTicks = SHRINK_TICKS
          s.events.push('laghima')
        } else if (p.kind === 'sanjeevani') {
          s.greatLeap = true
          s.events.push('sanjeevani')
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
      if (o.kind === 'setu') {
        s.reachedBridge = true
        s.events.push('bridge')
      }
      if (o.kind === 'field' && o.index === BATTLE_AT) {
        s.reachedBattle = true
        s.events.push('battle')
      }
      if (o.kind === 'ravan') {
        s.reachedRavan = true
        s.events.push('ravan')
      }
    }

    if (s.graceTicks === 0) {
      const cause = o.kind === 'roof' ? 'tower' : o.kind === 'stone' || o.kind === 'setu' ? 'stone' : o.kind === 'field' || o.kind === 'dawn' ? 'field' : o.kind === 'ravan' ? 'ravan' : o.kind === 'gate' || o.kind === 'mainak' ? 'rock' : o.kind
      const top = o.gapTop + shift
      const bottom = o.gapBottom + shift
      if (hitsRect(x, s.y, rNow, o.x, -1000, o.x + PILLAR_WIDTH, top)) takeHit(s, cause)
      else if (bottom < SEA_LEVEL && hitsRect(x, s.y, rNow, o.x, bottom, o.x + PILLAR_WIDTH, SEA_LEVEL)) takeHit(s, cause)
      if (s.alive && o.kind === 'roof') {
        const flames = flameTop(o, x)
        if (flames < o.gapBottom - 1 && hitsRect(x, s.y, rNow, o.x, flames, o.x + PILLAR_WIDTH, o.gapBottom)) {
          takeHit(s, 'fire')
        }
      }
      if (!s.alive) return
    }
  }

  if (s.y + rNow >= SEA_LEVEL) {
    const ground = s.grabbed ? 'simhika' : s.reachedLanka && !s.reachedBridge ? 'fire' : s.reachedBattle && !s.reachedRavan ? 'field' : 'sea'
    if (s.shield || s.graceTicks > 0) {
      if (s.graceTicks === 0) takeHit(s, ground)
      s.y = SEA_LEVEL - rNow - 1
      s.vy = LEAP_VELOCITY
    } else {
      takeHit(s, ground)
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
