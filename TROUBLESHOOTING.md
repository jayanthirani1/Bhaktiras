# Bhaktiras — Troubleshooting

Symptom first. Each entry names what you would see, why it happens, and the file
to open. Written for someone — human or agent — who has just landed in this repo
and something is not working.

For what the app *is*, read `PROJECT-MAP.md`. For known-but-unfixed problems,
read `IMPROVEMENTS.md`. This file is for problems you are hitting **right now**.

**Sections:** [Local development](#local-development) ·
[Data not appearing](#data-not-appearing) · [Auth and admin](#auth-and-admin) ·
[The site is locked](#the-site-is-locked) · [Push notifications](#push-notifications) ·
[Games](#games) · [Deploys](#deploys)

---

## First, the shape of the thing

Almost every "it's broken" report on this project turns out to be one of five
things. Check them in this order before reading further:

1. **No `.env`.** `plugins/firebase.client.ts` returns `firebaseDb: null` when
   `NUXT_PUBLIC_FIREBASE_PROJECT_ID` or `NUXT_PUBLIC_FIREBASE_API_KEY` is
   missing. Every Firestore read then no-ops and the app serves the static
   fallbacks in `data/`. **This is a supported mode** — the dev server plays every
   game end to end without credentials — so "no live data" is not a bug on its own.
2. **A Firestore rule denied the read**, and the composable swallowed the error
   (see [Empty page that should have data](#a-page-renders-empty-and-the-console-is-quiet)).
3. **`SITE_PASSWORD` is set**, so the whole site redirects to `/gate`.
4. **You are not an admin** — `admins/{uid}` does not exist for your account.
5. **The collection has no rules block at all**, so it is denied by default. Three
   game collections are in this state today; see
   [A game ignores its Firestore override](#a-game-ignores-its-firestore-override).

---

## Local development

### `npm run dev` shows the site but nothing is live

Expected without `.env`. The static layer in `data/` renders: timeline, niyams,
seva teams, quotes, every game's puzzle bank. What you will *not* get is
Firestore content, sign-in, leaderboards, admin, or push.

To go live locally, `cp .env.example .env` and fill in the six
`NUXT_PUBLIC_FIREBASE_*` values from Firebase Console → Project settings →
General. **No quotes around values, and restart the dev server** — Nuxt reads
`.env` once at boot. `plugins/firebase.client.ts` logs
`[Firebase] Connected to project: …` in dev when it worked, and a `[Firebase]
Config missing` warning when it did not.

### `[push] Skipped public/firebase-messaging-sw.js` on every build

Working as designed. `scripts/writeFirebaseMessagingSw.mjs` regenerates the push
service worker on every `nuxt` command and **refuses to write a blank one**. With
no Firebase config it warns and skips locally, and *throws* when `CI` is set.

The file is gitignored — do not commit it and do not hand-edit it. If you need
push working locally, populate `.env` and rebuild.

### `npm run typecheck` fails on `.nuxt/tsconfig.json`

`tsconfig.json` extends a file Nuxt generates. Run `npm install` (or
`npx nuxt prepare`) first; `nuxt typecheck` normally does the prepare itself, but
a half-installed `node_modules` breaks it.

### The build fails in CI but passes locally

`.github/workflows/pr-validate.yml` runs **both** `npm run typecheck` and
`npm run build`, because `nuxt build` does not run `vue-tsc` and typecheck does not
catch every way a build can fail. Reproduce the CI job exactly:

```bash
npm ci && npm run typecheck && npm run build
```

The workflow also fails the run if `.nuxt` or `.output` are tracked in git — those
directories carry baked-in config and must never be committed.

---

## Data not appearing

### A page renders empty and the console is quiet

**This is the failure mode with the worst track record on this project.** When the
default test-mode rules expired in March, every page looked merely *empty* rather
than broken, and it stayed that way for five months.

Thirteen composables have no `error` state at all, and several catch a failed
read and set `items.value = []` — `composables/useMandir.ts:112` (`useEvents`) and
`:152` (`useGratitudeMessages`) are the canonical examples. A denied read, an expired rules deployment and an actually
empty collection all render identically.

**How to tell them apart:** open DevTools → Network, filter to
`firestore.googleapis.com`, and look for a `403`/`PERMISSION_DENIED` response. Or
read the collection from the Firebase Console with the Rules Playground. Do not
trust the UI here.

This is IMPROVEMENTS #8 and is still open. `useTimeline` is the composable that
gets it right — it falls back to static milestones *and* preserves `error`.

### A game ignores its Firestore override

Three collections are read and written by the app but have **no `match` block in
`firestore.rules`**, so Firestore denies them by default:

| Collection | Read by | Written by |
|---|---|---|
| `suryaChandraPuzzles` | `composables/useSuryaChandraPuzzle.ts:21` | `pages/admin/games/bhakti-marg.vue` (documented, manual) |
| `bhaktiMargPuzzles` | `composables/useBhaktiMargPuzzle.ts:22` | `composables/useAdminData.ts:177` |
| `rasRaniPuzzles` | `composables/useRasRaniPuzzle.ts:22` | `composables/useAdminData.ts:181` |

Each read is wrapped in a `try`/`catch` that falls back to the generated or static
daily puzzle, so the symptom is silent: you publish an override, the game keeps
serving the generated board, and nothing reports an error. The admin editor's save
fails with `PERMISSION_DENIED` in the network tab only.

**Fix:** add rules blocks mirroring `bracketCityPuzzles` (`firestore.rules:374`) —
public read where `published == true`, admin write — and deploy them. Tracked as
IMPROVEMENTS #15.

### The community wall rejects a post

The wall **requires sign-in** as of the current rules (`firestore.rules:238`).
Anything else that fails is one of the field constraints, all enforced server-side:

- `message` between 5 and 500 characters
- `name` at most 50 characters
- `createdAt` must equal `request.time` — a client-supplied timestamp is refused
- `anonymous` must be a bool; when `true` the document must carry **no** `userId`,
  when `false` `userId` must be the caller's uid
- only those six keys, nothing else

The author link is written separately to `gratitudeAuthors/{postId}`
(`firestore.rules:282`), which only admins and the author can read. If that second
write fails the post still lands but becomes unattributable.

Note that `PROJECT-MAP.md` history and IMPROVEMENTS #1 describe an older,
sign-in-free wall. The rules are the current truth.

### A niyam entry will not submit

Work through `firestore.rules:471` in order:

1. **The challenge is not published.** Until a real `niyamChallenges/{id}` document
   exists, the rules refuse submissions against it — the five in
   `data/niyamChallenges.ts` are code *defaults*, not published challenges. The UI
   gates on `isPublished()` rather than letting the write fail; if you are calling
   Firestore directly, publish from `/admin/niyam-challenges` first.
2. **`amount` exceeds `maxPerSubmission`** (`firestore.rules:522`) — a hard ceiling,
   refused outright.
3. **`status` does not match what the rules compute** (`firestore.rules:526`). It is
   not free text: at or below the challenge's `autoApproveMax` it must be
   `approved`, above it must be `pending`. Sending the wrong one is denied.

Totals never come back from a write: `niyamChallengeStats/{challengeId}` and the
per-person `contributors` rollups are closed to browsers and derived by the
`syncNiyamChallengeTotals` trigger (`functions/index.js:1488`). If the number on
the progress bar is stale, the trigger is what to check, not the client.

### "The sangat added N today" never appears

`syncNiyamChallengeTotals` writes `niyamChallengeStats.dailyTotals`. The line stays
hidden until a functions deploy carrying that code has actually run.

### A query fails asking for a composite index

Only three indexes exist (`firestore.indexes.json`), all on `gameScores` and
`wordleScores`. **The deploy service account cannot create indexes**, so new query
shapes are a design constraint, not a deploy step: the niyams area deliberately
uses a single equality filter per query and embeds an inverted timestamp in
submission ids to sort without one. Follow that pattern rather than adding an index.

---

## Auth and admin

### `/admin` bounces to `/admin/auth`

`middleware/admin.ts` redirects when the account has no `admins/{uid}` document, and
always redirects during SSR (the check is client-only). Admin is a **Firestore
document, not a code change**: create `admins/{your-uid}` with `{ name, active }`.

`active: false` revokes it. There is **no privilege tier** — `isAdmin()`
(`firestore.rules:8`) checks existence and `active != false`, and that grants every
write path in the file including creating further admins. The old `guest` role was
removed rather than left implying a limit it never enforced.

If you are already an admin and still bounce: the middleware waits up to 4s for
auth and 4s for the admin lookup. A slow or denied `admins/{uid}` read looks
identical to not being an admin.

### Google sign-in popup closes immediately

`Cross-Origin-Opener-Policy` is set to `same-origin-allow-popups` in
`nuxt.config.ts` precisely because plain `same-origin` severs the popup. If you
tighten that header, Google sign-in breaks.

### Storage upload denied

`storage.rules` is **create-only** and scoped to three folders: `events`,
`timeline`, `uploads`. Overwrites and deletes are refused from a browser
entirely, SVG is excluded (it executes script on a world-readable origin), and the
size cap is 8 MB. Clearing a stray object is a console job.

Also: `storage.rules` is **not deployed by CI** — see
[Deploying storage rules](#storage-rules-changes-do-not-take-effect).

---

## The site is locked

### Everything redirects to `/gate`

`SITE_PASSWORD` is set. `server/middleware/site-gate.ts` locks every route except
`/gate`, `/api/site-gate`, `/favicon.ico`, `/robots.txt`,
`/firebase-messaging-sw.js` and the Nuxt asset paths, and answers `/api/**` with a
401 instead of a redirect.

Unset `SITE_PASSWORD` in App Hosting to open the site; an empty value means public
(`nuxt.config.ts` runtimeConfig). The unlock cookie is `bhaktiras_preview` and
holds a SHA-256 of the password, compared with `timingSafeEqual`
(`server/utils/siteGate.ts`) — so changing the password invalidates every
existing cookie.

---

## Push notifications

Push fails silently in more ways than anything else here. In order of likelihood:

1. **`NUXT_PUBLIC_FIREBASE_VAPID_KEY` missing.** Without it the browser cannot
   request a token. No build error, no runtime warning on the site. It must be set
   in `.env` locally, in the Actions secrets for the Hosting workflow, **and** in
   `apphosting.yaml` (Secret Manager) for the live App Hosting deploy.
2. **The service worker is blank or absent.** `public/firebase-messaging-sw.js` is
   generated, gitignored, and never committed — see
   [`[push] Skipped …`](#push-skipped-publicfirebase-messaging-swjs-on-every-build).
   A worker built from an empty config registers cleanly and can never receive a
   push.
3. **A second service worker at `/`.** Registering one replaces this registration
   and silently kills push. That is why the install/`beforeinstallprompt` fetch
   handler rides along inside the messaging worker instead of getting its own.
4. **The permission prompt was already dismissed.** Browsers permanently blocklist
   a site after a dismissal. `pages/events.vue` fires the prompt 1.2s after mount
   regardless of engagement (IMPROVEMENTS #9), so this is easy to burn.

The in-app inbox is a separate path: `notifications` is written only by Cloud
Functions and read by any signed-in user, with per-user read state in
`notificationState/{uid}`. A missed OS notification should still show there.

---

## Games

### A daily puzzle is yesterday's

Everything daily is keyed to `ukDateId()` — the Europe/London calendar day
(`utils/gameDay.ts`), not UTC and not the device timezone. A puzzle, its timer,
its storage keys and its leaderboard row all pin to the day the page **mounted**;
an app minimised overnight never remounts. `isStaleGameDay()` and
`plugins/game-day-rollover.client.ts` exist to catch that. If a game is showing
stale content, check whether the page has been mounted since midnight UK.

### `/play/mini-crossword` and `/play/bhakti-marg` go somewhere else

They are redirect stubs, on purpose:

- `/play/mini-crossword` → `/play/crossword` (301)
- `/admin/games/mini-crossword` → `/admin/games/crossword` (301)
- `/play/bhakti-marg` → `/play/surya-chandra`

The game formerly called Bhakti Marg is now **Surya Chandra**, and the admin menu
still routes its editor through the old path: `data/adminMenu.ts:56` labels it
"Surya Chandra" but points at `/admin/games/bhakti-marg` and names the
`bhaktiMargPuzzles` collection, while the page itself documents overrides in
`suryaChandraPuzzles`. Expect the names to disagree; the runtime truth is
`composables/useSuryaChandraPuzzle.ts`.

### `WARN Duplicated imports "cyclePlayCell"` on every build

Nuxt auto-imports everything in `utils/` and `composables/` by bare name, so two files
exporting the same name collide and one silently wins. Today that is
`utils/suryaChandra.ts` (dead, superseded) losing to `utils/tango.ts` (live) — harmless
only because nothing imports the dead one. **Treat the warning as real**: a bare call to
a duplicated name resolves to whichever file Nuxt picked, not the one you meant. Import
explicitly, or delete the loser (IMPROVEMENTS #12).

### A player claims an impossible record

Achievements and crowns are still **self-reported**. `handleGameAchievements`
(`functions/index.js`) range-checks the client's numbers but never cross-references
the `gameScores` document that was written, so a direct call to the callable can
claim a one-guess Wordle. Play streaks are likewise validated only as ints
(`firestore.rules:380`). Both are IMPROVEMENTS #6 and #7, still open. Crowns are
public and all-time, so a forged record is permanent.

### A section of the app renders "not available"

An admin switched it off at `/admin/content/sections`. The gate is enforced in one
place — `useContentGate` in `layouts/default.vue` — and the switches are cached in
`localStorage`, so a stale cache can hide a section that has since been switched
back on. Clear site data to re-read.

The section catalogue itself is code (`data/siteSections.ts`); Firestore stores
only the on/off switches, so a stored document can never resurrect a page this
build does not have.

---

## Deploys

### Storage rules changes do not take effect

`storage.rules` is deliberately excluded from CI. The Actions service account
lacks `firebasestorage.defaultBucket.get`, and the Firebase CLI resolves the bucket
before deploying *anything* — so including `storage` fails the whole run at the
first step and ships nothing, not even hosting.

Deploy it by hand from an owner account after any change:

```bash
npx firebase-tools deploy --only storage --project skssw-bhaktiras
```

To fold it back in: grant the deploy service account **Firebase Storage Admin**
(`roles/firebasestorage.admin`), verify a manual `--only storage` deploy as that
account, then add `storage` to `.github/workflows/firebase-hosting.yml`.

Note that `package.json`'s `npm run deploy` *does* include `storage` — that script
is for a human with owner access, not for CI.

### CI deploy fails with a 403

| Endpoint in the error | Missing role |
|---|---|
| `firebaserules.googleapis.com/…:test` | Firebase Rules Admin |
| `firestore.googleapis.com/…/databases/(default)` | Cloud Datastore User |
| `firebasestorage.defaultBucket.get` | Firebase Storage Admin (see above) |

The full role table is in `README.md`.

### The deployed site is missing security headers

`firebase.json` headers apply **only** to the static Firebase Hosting deploy, which
`PROJECT-MAP.md` records as vestigial. The live site is App Hosting (Nitro on Cloud
Run) and never reads `firebase.json`. Headers for the live site live in
`nuxt.config.ts` `routeRules`, which Nitro sends on whichever target serves.

There is no Content-Security-Policy yet, deliberately: the app pulls Firebase,
Google Fonts, gstatic and Flickr, and a wrong CSP fails closed and silently breaks
the site.

### An App Hosting deploy builds but the app has no Firebase config

`apphosting.yaml` declares each `NUXT_PUBLIC_*` variable with
`availability: [BUILD]`, backed by Secret Manager. A variable missing there is
missing from the client bundle — the values are baked in at build time, not read at
runtime. `NUXT_PUBLIC_FLICKR_USER_ID` is absent on purpose: nothing reads it.

### Flickr albums render empty

`useFlickr()` returns nothing at all when `NUXT_PUBLIC_FLICKR_API_KEY` is absent, so
the albums come up empty rather than erroring. Unlike the Firebase values this is a
real rate-limited credential — and it is still baked into the client bundle.

---

## Reading the code

When the docs and the code disagree, the code wins. In rough order of authority:

1. `firestore.rules` and `storage.rules` — what is actually permitted
2. `functions/index.js` — everything derived server-side
3. `nuxt.config.ts`, `apphosting.yaml`, `.github/workflows/` — how it ships
4. `PROJECT-MAP.md` — what the app is
5. `IMPROVEMENTS.md` — what is known-broken
6. `README.md` — first-time setup

`PROJECT-MAP.md` carries a "Where things live" table for finding the file behind a
feature.
