/**
 * Sound effects and vibration for every game, made with Web Audio so there are
 * no files to load. One audio context is shared by the whole app, and it is
 * unlocked by the first tap anywhere, because mobile browsers keep audio
 * suspended until a gesture. The sounds are soft on purpose: most players have
 * the Hanuman Chalisa or their own music on.
 *
 * Mute is one site-wide setting (`GameSoundToggle`). Lanka Leap passes its own
 * ref, since its speaker button mutes the Chalisa too.
 */
export type GameSound =
  | 'tap'
  | 'select'
  | 'correct'
  | 'wrong'
  | 'hint'
  | 'solve'
  | 'lose'
  | 'leap'
  | 'tulsi'
  | 'power'
  | 'shield-break'
  | 'shave'
  | 'scene'
  | 'ayodhya'
  | 'dead'

const MUTED_KEY = 'bhaktiras:game-sound-muted'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null
let unlockArmed = false

function unlock() {
  if (import.meta.server) return
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = 0.7
    master.connect(ctx.destination)
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.4), ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
}

function armUnlock() {
  if (unlockArmed || import.meta.server) return
  unlockArmed = true
  window.addEventListener('pointerdown', unlock, { capture: true, passive: true })
  window.addEventListener('keydown', unlock, { capture: true, passive: true })
}

function tone(freq: number, start: number, length: number, gain: number, type: OscillatorType = 'sine', endFreq?: number) {
  if (!ctx || !master) return
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + length)
  env.gain.setValueAtTime(0.0001, start)
  env.gain.exponentialRampToValueAtTime(gain, start + 0.01)
  env.gain.exponentialRampToValueAtTime(0.0001, start + length)
  osc.connect(env)
  env.connect(master)
  osc.start(start)
  osc.stop(start + length + 0.05)
}

function hiss(start: number, length: number, gain: number, from: number, to: number) {
  if (!ctx || !master || !noise) return
  const src = ctx.createBufferSource()
  src.buffer = noise
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = 1.2
  filter.frequency.setValueAtTime(from, start)
  filter.frequency.exponentialRampToValueAtTime(to, start + length)
  const env = ctx.createGain()
  env.gain.setValueAtTime(0.0001, start)
  env.gain.exponentialRampToValueAtTime(gain, start + length * 0.25)
  env.gain.exponentialRampToValueAtTime(0.0001, start + length)
  src.connect(filter)
  filter.connect(env)
  env.connect(master)
  src.start(start)
  src.stop(start + length + 0.05)
}

/** A temple bell: a fundamental with inharmonic partials that ring out. */
function bell(freq: number, start: number, gain: number, length = 1.4) {
  tone(freq, start, length, gain)
  tone(freq * 2.76, start, length * 0.5, gain * 0.35)
  tone(freq * 5.4, start, length * 0.25, gain * 0.15)
}

function render(sound: GameSound) {
  if (!ctx) return
  const t = ctx.currentTime + 0.005
  if (sound === 'tap') tone(880, t, 0.05, 0.025)
  else if (sound === 'select') tone(660, t, 0.08, 0.04, 'triangle')
  else if (sound === 'correct') {
    tone(784, t, 0.18, 0.07)
    tone(1175, t + 0.08, 0.3, 0.06)
  } else if (sound === 'wrong') {
    tone(196, t, 0.22, 0.07, 'triangle', 150)
    tone(185, t + 0.02, 0.2, 0.04, 'triangle')
  } else if (sound === 'hint') {
    tone(1319, t, 0.16, 0.04)
    tone(1760, t + 0.06, 0.22, 0.035)
  } else if (sound === 'solve') {
    ;[523, 659, 784, 1047].forEach((f, i) => bell(f, t + i * 0.12, 0.08, 1.6))
  } else if (sound === 'lose') {
    tone(392, t, 0.3, 0.06, 'triangle')
    tone(262, t + 0.18, 0.5, 0.06, 'triangle')
  } else if (sound === 'leap') hiss(t, 0.16, 0.05, 700, 2200)
  else if (sound === 'tulsi') {
    tone(1568, t, 0.22, 0.07)
    tone(2093, t + 0.05, 0.28, 0.05)
  } else if (sound === 'power') {
    bell(784, t, 0.09)
    bell(988, t + 0.09, 0.08)
    bell(1175, t + 0.18, 0.08)
  } else if (sound === 'shield-break') {
    tone(180, t, 0.25, 0.14, 'triangle', 70)
    hiss(t, 0.2, 0.08, 3000, 600)
  } else if (sound === 'shave') {
    tone(2637, t, 0.12, 0.04)
    tone(3136, t + 0.04, 0.14, 0.035)
  } else if (sound === 'scene') {
    bell(196, t, 0.16, 2.4)
    bell(392, t + 0.02, 0.06, 1.6)
  } else if (sound === 'ayodhya') {
    ;[523, 659, 784, 1047, 1319].forEach((f, i) => bell(f, t + i * 0.14, 0.09, 1.8))
    bell(262, t, 0.14, 3)
  } else if (sound === 'dead') {
    tone(220, t, 0.45, 0.12, 'triangle', 90)
    hiss(t, 0.3, 0.06, 900, 200)
  }
}

export function useGameSound(mutedOverride?: Ref<boolean>) {
  const shared = useState('game-sound-muted', () => false)
  const muted = mutedOverride ?? shared

  onMounted(() => {
    armUnlock()
    if (mutedOverride) return
    try {
      shared.value = localStorage.getItem(MUTED_KEY) === '1'
    } catch {}
  })

  function toggle() {
    shared.value = !shared.value
    try {
      localStorage.setItem(MUTED_KEY, shared.value ? '1' : '0')
    } catch {}
    if (!shared.value) {
      unlock()
      play('select')
    }
  }

  function play(sound: GameSound) {
    if (muted.value || !ctx || ctx.state !== 'running') return
    render(sound)
  }

  /** A short vibration where the phone supports it. Silent elsewhere, and never throws. */
  function buzz(pattern: number | number[]) {
    try {
      if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
      // Chrome refuses, and logs an error, until the page has had a real tap.
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return
      navigator.vibrate(pattern)
    } catch {}
  }

  return { muted, toggle, play, buzz, unlock }
}
