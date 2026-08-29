/**
 * The promo, as data.
 *
 * Everything the renderer needs is here: which screens to photograph, how far
 * to scroll each one, and the shot list that stitches them together. Editing
 * the promo means editing this file — `capture.mjs` and `render.mjs` never
 * name a page or a caption.
 */

/**
 * Screens to photograph from the running app.
 *
 * `from`/`to` are scroll offsets in CSS pixels. The capture step walks that
 * range in `SCROLL_STEP` increments and saves one viewport shot per stop, so
 * the compositor can pan a screen by flipping through them. Panning a single
 * tall full-page screenshot would have been fewer files, but it loses the
 * sticky header and the bottom tab bar — the two things that make footage read
 * as an app rather than a web page.
 *
 * `prepare` runs after load, before the first shot, for screens that need a tap
 * to get to the state worth filming.
 */
export const SCREENS = [
  { id: 'home', route: '/', from: 0, to: 900 },
  // The top of the journey page is the year picker and the headline of the
  // year's first entry; further down is body copy, which does not read at
  // handset size in a two-second glance.
  { id: 'journey', route: '/journey', from: 0, to: 200 },
  // Events, niyams and play are short pages: a few hundred pixels of scroll and
  // the site footer is on screen. The ranges stop above it.
  { id: 'events', route: '/events', from: 0, to: 200 },
  { id: 'niyams', route: '/niyams', from: 40, to: 440 },
  { id: 'play', route: '/play', from: 0, to: 200 },
  {
    id: 'wordle',
    route: '/play/wordle',
    from: 0,
    to: 48,
    /**
     * The board sits behind a "how to play" card until the game starts, and an
     * empty board is a dull three seconds. Two guessed words give the grid its
     * greens and ambers; they are ordinary English words because the app checks
     * its guess list and a rejected word puts an error toast on screen. Guesses
     * live in the browser only — nothing is written back to the temple's data.
     *
     * The scroll stops short: below the keyboard sit the all-time crowns and
     * today's leaderboard, which carry members' names.
     */
    prepare: async page => {
      const start = page.getByRole('button', { name: /start game/i })
      if (await start.count()) {
        await start.first().click()
        await page.waitForTimeout(1200)
      }
      for (const word of ['ARISE', 'MOUNT']) {
        for (const letter of word) {
          await page.keyboard.press(letter)
          await page.waitForTimeout(90)
        }
        await page.keyboard.press('Enter')
        await page.waitForTimeout(2200)
      }
    }
  },
  { id: 'seva', route: '/seva', from: 0, to: 860 }
]

/** Scroll granularity, in CSS pixels, for the pan sequences. */
export const SCROLL_STEP = 12

/** Phone viewport the app is photographed at — a mid-size modern handset. */
export const DEVICE = { width: 390, height: 844, scale: 2 }

/** Frames per second of the finished video. */
export const FPS = 30

/** Seconds of cross-fade between consecutive shots. */
export const DISSOLVE = 0.55

/**
 * The shot list.
 *
 * `title` shots are full-bleed cards; `phone` shots pan a captured screen
 * inside the handset. `from`/`to` are scroll offsets and must sit inside the
 * range captured for that screen.
 */
export const SHOTS = [
  {
    kind: 'title',
    dur: 3.2,
    mark: 'wordmark',
    sub: 'Celebrating ten years with Ghanshyam Maharaj'
  },
  {
    kind: 'phone',
    screen: 'home',
    dur: 4.6,
    from: 0,
    to: 760,
    kicker: 'THE APP',
    caption: 'Ten years with Ghanshyam Maharaj — in your pocket.'
  },
  {
    kind: 'phone',
    screen: 'journey',
    dur: 4.2,
    from: 20,
    to: 190,
    kicker: 'OUR JOURNEY',
    caption: 'Every year since 2017. Moments, photos and video.'
  },
  {
    kind: 'phone',
    screen: 'events',
    dur: 4.2,
    from: 0,
    to: 200,
    kicker: 'OUR EVENTS',
    caption: 'Sabhas, programmes and the mahotsav dates.'
  },
  {
    kind: 'phone',
    screen: 'niyams',
    dur: 4.4,
    from: 40,
    to: 440,
    kicker: 'OUR NIYAMS',
    caption: 'Sadhana we keep together — badha saathe.'
  },
  {
    kind: 'phone',
    screen: 'play',
    dur: 3.8,
    from: 0,
    to: 200,
    kicker: 'DAILY GAMES',
    caption: 'Satsang puzzles. A new one every day.'
  },
  {
    kind: 'phone',
    screen: 'wordle',
    dur: 3.0,
    from: 4,
    to: 44,
    kicker: 'DAILY GAMES',
    caption: 'Six tries. Keep the streak going.'
  },
  {
    kind: 'phone',
    screen: 'seva',
    dur: 4.0,
    from: 10,
    to: 820,
    kicker: 'SEVA',
    caption: 'Find your team. Join the WhatsApp community.'
  },
  {
    kind: 'title',
    dur: 4.6,
    mark: 'mark',
    heading: '14 – 22 August 2027',
    sub: 'Bhaktiras Patotsav · Shree KS Swaminarayan Temple Woolwich',
    cta: 'sksswoolwich-bhaktiras--skssw-bhaktiras.europe-west4.hosted.app'
  }
]

/** Output shapes. `phone` is the handset height in output pixels. */
export const FORMATS = {
  vertical: { id: 'vertical', width: 1080, height: 1920, phone: 1330, layout: 'stacked' },
  landscape: { id: 'landscape', width: 1920, height: 1080, phone: 940, layout: 'side' }
}

/** Scroll stops captured for one screen, in the order the files are numbered. */
export function scrollStops(screen) {
  const stops = []
  for (let y = screen.from; y <= screen.to; y += SCROLL_STEP) stops.push(y)
  return stops
}
