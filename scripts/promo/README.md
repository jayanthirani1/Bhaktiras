# Promo video renderer

Makes a promo film of the app out of the app itself: real screens, photographed
from a running site, panned inside a handset over the Bhaktiras purple and gold,
with title cards at either end.

Two files come out of `out/`:

| File | Shape | For |
|---|---|---|
| `bhaktiras-promo-vertical.mp4` | 1080×1920 | WhatsApp status, Reels, Shorts |
| `bhaktiras-promo-landscape.mp4` | 1920×1080 | YouTube, or a screen at the mandir |

Both are H.264 in an MP4, 30fps, silent — add music in any editor, or see
[Adding music](#adding-music).

## Running it

```sh
cd scripts/promo
npm install          # playwright + a static ffmpeg, kept out of the app's deps
node render.mjs --capture
```

`--capture` photographs the app first; without it the renderer reuses the last
capture in `.cache/`, which is what you want while you are changing the edit.

```sh
node render.mjs --stills=5,16,29   # single PNGs at those seconds — seconds, not minutes
node render.mjs --only=vertical    # one shape
```

By default it films the deployed site, so the screens have real content in them.
To film a branch instead, run the dev server and point the capture at it:

```sh
npm run dev                                   # in the repo root
PROMO_BASE=http://localhost:3000 node render.mjs --capture
```

Be aware that a dev server without Firebase credentials falls back to the static
data in `data/`, which leaves the journey, events, niyams and community screens
empty — fine for checking a layout change, not what you want in a finished film.

## Editing the promo

`scenes.mjs` is the whole edit. Nothing else names a page or a caption.

- **`SHOTS`** is the shot list, in order: the screen to show, how long to hold
  it, how far to scroll while holding, and the words on top. Re-run
  `node render.mjs` — no capture needed unless a shot asks to scroll further
  than the capture went.
- **`SCREENS`** is what gets photographed. A screen's `from`/`to` must cover
  every `from`/`to` any shot asks of it. Changing these needs `--capture`.
- **`FORMATS`** sets the output shapes, and `FPS` and `DISSOLVE` the timing.

Scroll ranges want checking against the page: `events`, `play` and `niyams` are
short pages that run out after a couple of hundred pixels, and scrolling past
the end lands you on the site footer. The capture clamps to the foot of the page
and records what it actually used, so an over-long range degrades into a held
frame rather than a broken pan — but it is still worth setting honestly.

## How it works

Three steps, in `capture.mjs`, `stage.html` and `render.mjs`.

**Capture** drives Chromium at a phone viewport and takes one screenshot per
scroll stop, twelve pixels apart. Panning a screen is then a matter of flipping
through those stills, which keeps the sticky header and the tab bar pinned where
the app puts them — a single tall full-page screenshot loses both, and the
footage stops reading as an app.

**The stage** is a plain HTML page with no animation of its own: no transitions,
no keyframes, no `requestAnimationFrame`. Every visible property is set by
`paint()` from a state object.

**The render** computes that state from the frame number alone and pipes the
screenshots straight into ffmpeg. Because nothing depends on wall-clock time, a
frame that takes 200ms to screenshot does not speed the footage up, and two runs
of the same shot list produce the same film.

## Adding music

The renderer leaves the video silent rather than pick a track for you. To lay one
under it:

```sh
./node_modules/ffmpeg-static/ffmpeg -i out/bhaktiras-promo-vertical.mp4 \
  -i track.m4a -shortest -c:v copy -c:a aac -b:a 192k out/promo-with-music.mp4
```

Use something the mandir has the right to publish — a licensed track, or a
recording of our own kirtan.

## Things to know before publishing

- The footage is whatever the live site showed on the day it was captured. The
  countdown, the niyam totals and the events are all real, and all dated.
- Some app screens carry devotees' names — the Wordle leaderboard and crowns,
  the community wall. The shot list keeps clear of them. If you add a shot,
  check what is on screen before it goes out.
