# Promo film

Builds the Bhaktiras promo video in two cuts — 1080×1920 vertical for Reels and
Stories, 1920×1080 landscape for YouTube and the web — from real screenshots of
the running app.

Nothing here is part of the app. It is marketing tooling that happens to live in
the repo so the film is reproducible rather than trapped in one person's
Downloads folder. `npm run typecheck` neither sees nor cares about it.

## The rule this is built on

**The app generates the imagery. Code composites all the text.**

Every screen in the film is a genuine capture of the app running — not a mockup,
not a redraw. Every word on top of it is set in the app's own Cinzel and DM Sans
and positioned by `promo.html`. Colours are the literal tokens from
`assets/app.css` (`--purple: 262 50% 25%`, `--gold: 45 69% 52%`), so the film
cannot drift off-brand.

If an image model is ever added to this pipeline it generates *backgrounds*.
It never renders a word.

## Running it

Playwright and ffmpeg are deliberately **not** in `package.json` — every `npm ci`
in CI would then pull a browser driver and a ~70MB ffmpeg binary to build a video
nobody asked it for. Install them for the run and leave the manifest alone:

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm i --no-save playwright @ffmpeg-installer/ffmpeg
```

Then, with the dev server up in another shell:

```bash
npm run dev

node scripts/promo/shoot.mjs    # app screens        -> .promo/screens
node scripts/promo/play.mjs     # a played Connections board
PROMO_FFMPEG="$(node -e "console.log(require('@ffmpeg-installer/ffmpeg').path)")" \
  node scripts/promo/render.mjs # frames + encode    -> .promo/*.mp4
```

A full render is 600 frames per cut and takes about five minutes.

| Variable | Default | Why |
|---|---|---|
| `PROMO_BASE` | `http://localhost:3000` | Point the capture at the deployed site instead |
| `PROMO_OUT` | `.promo/screens` | Where captures land |
| `PROMO_CHROME` | the container's Chromium | Any Chromium build |
| `PROMO_FFMPEG` | `ffmpeg` on PATH | Needs H.264 and AAC — see below |

Everything is written to `.promo/`, which is gitignored: the frame PNGs alone
run to about 435MB.

## Things that will bite you

**Playwright's bundled ffmpeg cannot encode this.** It is a stripped build with
VP8 and WebM only — no H.264, no AAC, no MP4 muxer. It is fine for Playwright's
own screen recording and useless here. Use a full build.

**Chromium does not read `HTTPS_PROXY`.** curl does, so a proxied environment
will happily fetch a URL that the browser then cannot reach at all. `shoot.mjs`
passes the proxy explicitly for non-localhost origins.

**The dev server has no Firestore.** Content falls back to the static files in
`data/`, so Events, Journey, the community wall and Darshan render their empty
states. The film is deliberately built around the screens that hold real content
without a database — home, Connections, Niyams. Shooting the deployed site with
`PROMO_BASE` is what fixes this, and is worth doing before anyone signs the film
off.

**The dev server injects DevTools.** `#nuxt-devtools-container` and
`#vue-tracer-overlay` float over the app and land squarely in frame. Both capture
scripts hide them before the shutter.

**The timeline is deterministic on purpose.** `promo.html` exposes `seek(t)` and
uses no CSS animation or `requestAnimationFrame`; the renderer sets the time,
then screenshots. Re-runs are identical, and no frame is ever caught with a
transition half-finished. Sizes in that file are all in `U` — one percent of the
frame's short edge — passed through `S()`, which is what lets one layout serve
both aspect ratios.

## Editing the film

Beats live in the `BEATS` map in `promo.html`, as `[start, end]` in seconds, with
`window.PROMO_DURATION` as the total. Copy is in the markup above the script.
Change a beat, re-run `render.mjs`.

To check a change without waiting for a full render, load
`file://…/scripts/promo/promo.html?format=vertical` and call `seek(12.6)` in the
console.
