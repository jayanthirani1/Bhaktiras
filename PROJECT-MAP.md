# Bhaktiras — Project Map

What the app actually is, as built. Descriptive, not aspirational — read from the
codebase at commit `6f43a87` (30 Aug 2026).

**The other docs:** `TROUBLESHOOTING.md` when something is broken, `IMPROVEMENTS.md`
for the prioritised work queue and known security findings, `README.md` for
first-time Firebase setup and deploy, `CLAUDE.md` for the checks before pushing.

When this file and the code disagree, the code wins — start with `firestore.rules`.

---

## Where things live

Directory-by-directory, so you can go straight to the file instead of searching.

| Path | What is in it |
|---|---|
| `pages/` | Every route. Nuxt file-based routing — the path *is* the URL. `pages/admin/**` is the CMS, `pages/play/**` the games. |
| `components/` | Auto-imported Vue components, flat. Prefix tells you the area: `Admin*`, `Niyam*`, `Game*`. |
| `composables/` | All Firestore reads/writes and shared client state. **Start here to find where data comes from** — see the table below. |
| `data/` | Static TypeScript defaults and puzzle banks. The layer that makes the site render with no database. |
| `utils/` | Pure functions, no Vue and no Firebase: puzzle generators, the UK day helper, markdown, storage keys. **Auto-imported by bare name**, like `composables/` — two files exporting the same name collide and one silently wins. |
| `types/` | Shared types (`types/index.ts` is the big one). |
| `server/` | Nitro-only code: the site-password gate, `robots.txt`, `sitemap.xml`. |
| `middleware/` | Route middleware — only `admin.ts`. |
| `layouts/` | `default` (public chrome + content gate), `admin` (sidebar), `blank`. |
| `plugins/` | Client-only boot: Firebase init, push, PWA, game-day rollover, storage reset. |
| `functions/` | Cloud Functions v2, all of it in `functions/index.js`. Everything derived server-side. |
| `scripts/` | Build and one-off generators — notably `writeFirebaseMessagingSw.mjs`, which `nuxt.config.ts` calls on every command. |
| `firestore.rules` | The real access-control model, heavily commented. The authority on what any client may do. |
| `storage.rules` | Image uploads. Create-only, three folders, **not deployed by CI**. |
| `client/` | React leftovers from the previous app. Dead. |

### Finding the code behind a feature

| Feature | Composable | Backing collection(s) |
|---|---|---|
| Sign-in, current user | `useAuth`, `useAuthErrors` | Firebase Auth, `users` |
| Admin gate | `useAdminAccess` + `middleware/admin.ts` | `admins` |
| Homepage tiles, nav, prompts | `useSiteContent` | `siteContent/main` |
| Section on/off switches | `useContentGate` | `siteContent/main` |
| Privacy / policy pages | `useSitePage` | `sitePages` |
| Timeline | `useTimeline` (`useMandir.ts`) | `timeline` + `data/timeline.ts` |
| Events | `useEvents` (`useMandir.ts`) | `events` |
| Event photo albums | `useFlickr` | Flickr public API |
| Community wall | `useGratitudeMessages`, `useCreateGratitudeMessage` | `gratitude`, `gratitudeAuthors` |
| Niyams (devotee side) | `useNiyamChallenges` | `niyamChallenges`, `niyamChallengeStats`, `niyamSubmissions` |
| Niyams (admin side) | `useAdminNiyamChallenges` | same, plus `contributors` |
| Mandir visit streak | `useMandirVisit`, `useGeolocation` | `mandirVisits` |
| Every admin editor | `useAdminData` | one collection each |
| Game puzzles (server-backed) | `useGamesContent` | `wordleWords`, `miniCrosswordPuzzles`, `connectionsPuzzles`, `onePercentQuestions`, `bracketCityPuzzles`, `gameWords` |
| Game puzzles (own composable) | `useSuryaChandraPuzzle`, `useRasRaniPuzzle`, `useBhaktiMargPuzzle` | `suryaChandraPuzzles`, `rasRaniPuzzles`, `bhaktiMargPuzzles` — **no rules blocks yet**, see IMPROVEMENTS #15 |
| Leaderboards | `useGameLeaderboard`, `useWordleLeaderboard` | `gameScores`, `wordleScores` (legacy) |
| Daily completion, cross-device | `usePlayCompletion`, `usePlayCompletionStore` | `playCompletions` |
| Visit streaks | `usePlayStreak` | `playStreaks` |
| Achievements and crowns | `useAchievements` | `userAchievements`, `achievementCrowns` |
| Game timer, how-to, hints | `useGameTimer`, `useHowToPlay`, `useKeyTapGuard` | local only |
| Push opt-in and delivery | `usePushNotifications` | `pushSubscriptions`, `pushMessages` |
| In-app notification inbox | `useNotificationInbox` | `notifications`, `notificationState` |
| Install / sign-in nudges | `useInstallPrompt`, `useSignInPrompt`, `useAppPrompts` | local only |
| GDPR export and deletion | `useAccountPrivacy` | everything owned by the uid |
| Page titles and `noindex` | `usePageSeo` | — |
| Countdown to the utsav | `useCountdown` | `data/site.ts` (not CMS-driven) |

---

## What it is

A Nuxt 3 (Vue 3, TypeScript) web app for **Shree KS Swaminarayan Temple Woolwich**,
built around the Bhaktiras Patotsav.

| | |
|---|---|
| Utsav | Saturday 14 – Sunday 22 August 2027 |
| Framing | "Celebrating 10 Years with Ghanshyam Maharaj" |
| Journey span | 2017 – 2027 |
| Live at | `sksswoolwich-bhaktiras--skssw-bhaktiras.europe-west4.hosted.app` |
| Firebase project | `skssw-bhaktiras` |

Site-wide constants — utsav dates, WhatsApp invite, journey range, gallery link — live in
`data/site.ts`. That file is the single edit point for the countdown and the seva CTA.

## Stack

- **Nuxt 3** static/SSR, deployed to **Firebase App Hosting** (`apphosting.yaml`,
  backend `sksswoolwich-bhaktiras`). The GitHub Actions workflow targeting static Hosting
  is vestigial.
- **Firestore** — 34 ruled top-level collections (`firestore.rules`, 590 lines).
  Three more (`suryaChandraPuzzles`, `bhaktiMargPuzzles`, `rasRaniPuzzles`) are used by
  code but have no rules block, so they are denied by default — IMPROVEMENTS #15.
- **Firebase Auth** — email/password + Google, with account linking
- **Firebase Storage** — admin image uploads (`storage.rules`)
- **Firebase Cloud Messaging** — web push, service worker generated at build by
  `scripts/writeFirebaseMessagingSw.mjs`
- **Cloud Functions v2** (`functions/`, Node 22, `europe-west2`) — push delivery,
  achievement processing, scheduled reminders
- **Flickr** — event photo albums via public API
- Tailwind, Cinzel + DM Sans, `vue-tsc` typechecking
- **Nitro server routes** (`server/`) — a site-password gate, `robots.txt`, `sitemap.xml`
- Security headers ship from `nuxt.config.ts` `routeRules`, not `firebase.json` — App
  Hosting never reads `firebase.json`. No CSP yet, deliberately.

Requires the **Blaze** plan (Functions + Storage).

## Routes

Nuxt file-based routing: the path is the file under `pages/`.

**Public** — `/` `/journey` `/events` `/community` `/seva` `/niyams` `/yajman`
`/darshan` `/legacy` `/account` `/login` `/signup` `/privacy` `/policy` `/submit-bug`
`/gate`

**Games** — `/play` plus `wordle`, `crossword`, `connections`, `one-percent`,
`bracket-city`, `surya-chandra`, `ras-rani`, `achievements`, `streaks`

**Admin** — `/admin` plus `auth`, `insights`, `timeline`, `events`, `niyam-challenges`,
`yajman`, `notifications`, `legal`, `bugs`,
`content/{index,homepage,community,navigation,seva,sections}`,
`games/{wordle,crossword,connections,one-percent,bracket-city,bhakti-marg,ras-rani,word-bank}`

**Redirect stubs, not games** — `/play/mini-crossword` → `/play/crossword` (301),
`/admin/games/mini-crossword` → `/admin/games/crossword` (301), `/play/bhakti-marg` →
`/play/surya-chandra`. The game once called Bhakti Marg is now Surya Chandra, and
`data/adminMenu.ts` still routes its editor through the old path.

**Not a route** — `pages/[...slug].vue` is the 404 catch-all, and it sets a real HTTP
404 rather than serving the page under a 200.

`utils/gameRoutes.ts` lists the nine game paths that run in immersive mode (app chrome
scrolls away so each game can pin its own bar).

## Sections

### Homepage
Animated `BhaktirasLogo`, utsav date label, live countdown (`useCountdown`, driven by
`data/site.ts`), bhakti quote of the week from `data/quotes.csv` (53 quotes, attributed),
and a tile grid that is **CMS-driven** via `siteContent`.

### Our Journey
Year-by-year timeline. `useTimeline` merges static `JOURNEY_MILESTONES`
(`data/timeline.ts`, 13 entries) with the Firestore `timeline` collection, Firestore
winning on ID collision — so the site renders fully even with an empty database, and
admins can override or extend without a deploy. Supports mixed image/video media arrays.

### Our Events
Split into **Upcoming** and **Past** by date, with posters and embedded Flickr albums
per event. Triggers the push-notification opt-in prompt after 1.2s.

### Our Community
A message wall with rotating prompts. Posting **requires sign-in**
(`firestore.rules:238`), with an **optional name** — blank posts as "Anonymous", and a
signed-in user's name is pre-filled. Messages publish **immediately**; admins can edit or
delete after the fact. Prompts come from `siteContent.communityPrompts` (CMS) with
`data/communityPrompts.ts` as fallback.

The wall is world-readable and `playStreaks` is a public uid-to-name map, so an
`anonymous` post must carry **no** `userId` — a uid stored here would make anonymity a
mask over a document that names its author. The author link lives separately in
`gratitudeAuthors/{postId}`, readable only by admins and the author, which is what lets
moderation find an author without the wall naming one, and what "delete my account"
severs. Rules also pin `createdAt == request.time`, cap `name` at 50 characters and
`message` at 500, and allow only those six keys.

### Seva
WhatsApp community invite (live link in `data/site.ts`) plus 12 volunteer teams and their
responsibilities from `data/sevaTeams.ts`. No hour logging.

### Our Niyams
`/niyams` runs **five niyams at once** until the Patotsav — Janmangal Stotra and
Mala at 10 Lakh each, Dandvat & Panchang Pranaam at 10 Lakh, and Aarti/Chesta/Katha
attendance and Shanti Path at 10,000. A devotee logs what they have done; approved
entries from everyone ladder up into one shared total per niyam.

The five live in `data/niyamChallenges.ts` as **defaults**, the same static-plus-Firestore
shape as `data/timeline.ts`: they render so the page is never blank, and an admin
publishing one writes a real `niyamChallenges/{id}` document that then wins on every
field. Ids are stable slugs so a published document collapses onto its default rather
than doubling it. `mergeChallenges()` does the merge and tags each with an `origin`;
**until the document exists the niyam cannot take entries**, because the rules require
it, so `isPublished()` gates the UI rather than letting a submit fail.

Beyond target and deadline, a niyam carries how it is logged (`inputMode`: a count, or a
one-tap check-in for attendance), its quick-add `presets`, a `hint` saying what counts as
one, and an `icon`.

The page is a **sangat board**: five compact rows, each with the counted total, the next
milestone and a `+ Log` pill; input happens in a bottom sheet (`NiyamLogSheet`), never
inline — five inline forms was the thing that did not scale. Tapping a row body opens the
detail sheet instead. The private "Visit Mandir" streak card still sits below the board,
and both it and the board read one shared `useMandirVisit` instance.

Rendering targets this large took some care, and the helpers carry the reasoning:
`formatTarget` says "10 Lakh" rather than seven digits, `percentLabel` keeps a decimal
below 10%, `barPercent` clamps to a visible sliver, and `milestoneFor` gives the next
marker. Twelve thousand malas against ten lakh otherwise renders as a flat "0%" and an
empty bar, which reads as nothing happening.
`syncNiyamChallengeTotals` also keeps a fortnight of per-day totals in
`niyamChallengeStats.dailyTotals`, attributed to the day the sadhana was done rather than
the day it was approved, which is what the "the sangat added N today" strip reads from.
**That line stays hidden until the functions deploy carrying it has run.**

Admin side is `/admin/niyam-challenges`: a cross-niyam overview, a **combined approval
queue across all five** (an admin should not have to open each niyam to find what is
waiting), one-tap publishing of the defaults, the editor with a live preview of the
devotee card, and per-challenge entries, filters and per-person totals.

It also has "log on behalf of the mandir", for counts gathered on paper at sabha. The
rules only let a signed-in user create a submission under their **own** `userId`, so this
writes under the admin's uid with an attributed `userName` ("Mandir sabha") and a note.
It needs no rules change and gets no special treatment — the same ceiling and the same
auto-approve rule apply. The wrinkle to know: those counts and that admin's personal
counts share one contributor rollup, so their per-person total mixes the two. Separating
them properly would need a rules change allowing a synthetic account.

The integrity model is worth knowing before changing anything here:

- `niyamChallengeStats/{challengeId}` and the per-person
  `niyamChallenges/{id}/contributors/{uid}` rollups are **closed to browser
  writes** and derived by the `syncNiyamChallengeTotals` Firestore trigger. The
  number on the progress bar cannot be typed in.
- Each challenge carries an `autoApproveMax`. A submission at or below it is
  written as `approved`; anything larger is written as `pending` and stays out
  of the total until an admin approves it. **The security rules enforce which
  one it must be**, so bypassing the UI does not bypass review.
- `maxPerSubmission` is a hard ceiling — rules refuse anything above it.
- Submissions are private to their author and to admins. An individual mala
  count is personal sadhana, not a leaderboard row.
- Every query uses a single equality filter (`statusKey`, `userChallengeKey`,
  `challengeId`) and submission ids embed an inverted timestamp, so nothing here
  needs a composite index — the deploy service account cannot create them.

The personal daily tracker that used to sit on a second tab — a 12-item
checklist each devotee ticked for themselves — is **retired**. Its code and its
`niyams` / `niyamStats` rules are gone. `niyamProgress/{uid}` keeps a
read-and-delete-only rule, because it is personal data and "delete my account"
must still be able to erase it; once those documents are cleared from the
console, that rule and the legacy branch in `useAccountPrivacy` can go too.

### Yajman
Utsav sponsorship opportunities with amounts and contact links, admin-managed.

### Games
Seven daily games, each on its own page under `/play`:

| Game | Route | Puzzle source |
|---|---|---|
| Wordle | `/play/wordle` | `wordleWords` / `wordleDaily` + `data/fiveLetterWords.ts` |
| Crossword | `/play/crossword` | `miniCrosswordPuzzles`, else generated by `utils/crosswordGenerator.ts` from `data/satsangWordBank.json` |
| Connections | `/play/connections` | `connectionsPuzzles` + `data/connectionsPuzzles.ts` |
| 1% Club | `/play/one-percent` | `onePercentQuestions` + `data/onePercentClub.ts` |
| Bracket City | `/play/bracket-city` | `bracketCityPuzzles`, else generated by `utils/bracketCityGenerator.ts` |
| Surya Chandra | `/play/surya-chandra` | `suryaChandraPuzzles`, else generated by `utils/tango.ts` |
| Ras Rani | `/play/ras-rani` | `rasRaniPuzzles` + `data/rasRaniPuzzles.ts` |

Shared across all of them: active-play timers that pause when you leave the game and
resume when you return (`useGameTimer`), daily leaderboards (`gameScores`), cross-device
completion tracking (`playCompletions`), daily visit streaks (`playStreaks`), an
achievements system, and all-time "crowns" for record holders. Achievements and crowns
are awarded by Cloud Functions — though they are still computed from numbers the client
sends, not from the stored score (IMPROVEMENTS #6).

**Everything daily is keyed to `ukDateId()`** — the Europe/London calendar day
(`utils/gameDay.ts`), never UTC and never the device timezone. A puzzle, its timer, its
storage keys and its leaderboard row all pin to the day the page mounted, which is why
`isStaleGameDay()` and `plugins/game-day-rollover.client.ts` exist: an app minimised
overnight would otherwise stay on yesterday.

Puzzle content is admin-editable per game with static fallbacks — except that the three
newest collections have no rules block yet, so their overrides are silently denied and
the generated board always wins (IMPROVEMENTS #15).

### Account & legal
`/account` offers self-serve **GDPR data export and account deletion**, plus auth
provider linking. `/privacy` and `/policy` render from the `sitePages` collection and are
admin-editable. Policy acceptance is recorded per user in `users/{uid}`.

### Bug reporting
`/submit-bug` accepts reports from anyone; `/admin/bugs` triages them open → resolved →
closed.

### Notifications
Two paths, and they are separate. **Web push** goes out through a callable Cloud Function
to the FCM tokens in `pushSubscriptions`, with a delivery audit in `pushMessages`
(admin-read only). **The in-app inbox** (`NotificationInbox`, `useNotificationInbox`)
keeps a copy of every announcement in `notifications` so a missed OS notification is not
lost; per-user read and dismissed state lives in `notificationState/{uid}`. Both
collections are written only by Cloud Functions. Admin test sends land in
`testNotifications/{uid}/messages` so a test never reaches the shared inbox.

The backend also sends an opted-in game reminder daily at 08:30 Europe/London and
notifies event subscribers when an event is created.

### The site gate
Set `SITE_PASSWORD` (App Hosting env) and `server/middleware/site-gate.ts` locks the
whole site behind `/gate` until launch — every route redirects, `/api/**` answers 401,
and only `/gate`, `/api/site-gate`, `/favicon.ico`, `/robots.txt`,
`/firebase-messaging-sw.js` and the Nuxt asset paths stay open. Empty means public.

The unlock cookie is `bhaktiras_preview` and holds a SHA-256 of the password, compared
with `timingSafeEqual` (`server/utils/siteGate.ts`), so changing the password invalidates
every cookie already issued.

### SEO
`usePageSeo` sets titles and meta per page, `useNoIndex` marks the pages that should stay
out of search. `server/routes/robots.txt.ts` and `server/routes/sitemap.xml.ts` generate
both at request time from Nitro.

## Admin

Gated by an `admins/{uid}` **Firestore document** — not hardcoded UIDs — so adding a
moderator is a document write, no rules edit or redeploy. Enforced in
`firestore.rules:8` (`isAdmin()`), in Cloud Functions, and cosmetically by
`middleware/admin.ts` + `layouts/admin.vue`.

**There is no privilege tier.** `isAdmin()` checks that the document exists and
`active != false`, and that grants every write path in the rules — including creating
further admins. Documents used to carry a `role` of `'admin'` or `'guest'` that nothing
ever read; the field was dropped rather than left implying a limit. A read-only tier has
to start in the rules before any UI can offer one.

The admin area is a full CMS: homepage tiles, navigation (including which items are
mobile-primary), community prompts, timeline, events, niyam challenges, yajman, legal
pages, push notifications, bug triage, and a per-game puzzle editor with a shared word
bank. `/admin/insights` is a read-only view over members, activity and notification
reach, backed by the `getAdminOverview` callable and the nightly `dailyStats` snapshots.

**Content → Sections** (`/admin/content/sections`) switches a whole part of the app off,
writing to the same `siteContent/main` document as the rest of the CMS. A hidden section
drops out of the navigation and the homepage tiles, and its pages render a "not
available" screen instead of mounting. The sections themselves are code
(`data/siteSections.ts`) — Firestore stores only the switches, so a stored document can
never resurrect a page this build does not have.

The gate is enforced in one place — `useContentGate` in `layouts/default.vue` — and the
switches are cached in `localStorage`, so a repeat visitor never sees a hidden section
flash up while Firestore answers.

Every admin page is listed once, in `data/adminMenu.ts`. The sidebar and the `/admin`
dashboard cards are both generated from it, so a page cannot be reachable from one and
missing from the other. An entry's optional `collection` is the Firestore collection
behind that editor — the dashboard shows its document count on the card. Two entries are
currently stale: the "Surya Chandra" item points at `/admin/games/bhakti-marg` and names
`bhaktiMargPuzzles`, while the page it opens documents `suryaChandraPuzzles`.

## Content model

Two layers throughout: **static TypeScript defaults in `data/`** and **Firestore
overrides**. The static layer means the site is never blank; the Firestore layer means
admins can change content without a deploy.

`data/` holds: `site.ts`, `timeline.ts`, `sevaTeams.ts`, `communityPrompts.ts`,
`quotes.csv`, `siteContent.ts`, `siteSections.ts`, `legalPages.ts`, `adminMenu.ts`,
`niyamChallenges.ts`, and the game banks (`connectionsPuzzles`, `miniCrossword`,
`onePercentClub`, `fiveLetterWords`, `wordleGuessList`, `satsangWordBank`,
`bracketCityPuzzles`, `bracketCityFrames`, `bracketCityCharitra`, `bhaktiMargPuzzles`,
`rasRaniPuzzles`).

The generators that produced some of those banks live in `scripts/`
(`generate_word_bank.py`, `generate_five_letter_words.py`); `data/SATSANG_WORD_BANK.md`
documents the word bank's editorial rules.

## Firestore collections

34 collections carry a rules block; `firestore.rules` is the authority and is commented
per collection.

**Public content** — `siteContent` `sitePages` `timeline` `events`
`yajmanOpportunities`

**User-generated** — `gratitude` (wall) · `gratitudeAuthors` (admin-only author link)
· `bugReports`

**Identity** — `admins` `users`

**Games** — `gameScores` `wordleScores` (legacy) `playStreaks` `playCompletions`
`userAchievements` `achievementCrowns` `gameWords` `wordleWords` `wordleDaily`
`miniCrosswordPuzzles` `connectionsPuzzles` `onePercentQuestions` `bracketCityPuzzles`

**Niyams** — `niyamChallenges` (+ `contributors` subcollection)
`niyamChallengeStats` `niyamSubmissions` `mandirVisits`. `niyamProgress`, `niyams` and
`niyamStats` are retired leftovers of the personal tracker, not written any more.

**Notifications** — `pushSubscriptions` `pushMessages` `notifications`
`notificationState` `testNotifications`

**Analytics** — `dailyStats` (nightly aggregate snapshots, admin-read, function-written)

**Used by code but unruled — denied by default** — `suryaChandraPuzzles`
`bhaktiMargPuzzles` `rasRaniPuzzles`. See IMPROVEMENTS #15.

Only three composite indexes exist (`firestore.indexes.json`, all on `gameScores` and
`wordleScores`) and **the deploy service account cannot create more**, so new query
shapes are a design constraint rather than a deploy step. The niyams area works within
it by using a single equality filter per query and embedding an inverted timestamp in
submission ids.

## Environment

| Variable | Needed for | Missing means |
|---|---|---|
| `NUXT_PUBLIC_FIREBASE_API_KEY` · `..._PROJECT_ID` | Firebase init | `$firebaseDb` is `null`; every read no-ops and the static `data/` layer serves |
| `..._AUTH_DOMAIN` · `..._STORAGE_BUCKET` · `..._MESSAGING_SENDER_ID` · `..._APP_ID` | Auth, Storage, FCM | Derived from the project id where possible; push and uploads degrade |
| `NUXT_PUBLIC_FIREBASE_VAPID_KEY` | Web push token request | Push fails silently — no build error, no runtime warning |
| `NUXT_PUBLIC_FLICKR_API_KEY` | Event and darshan albums | `useFlickr()` returns nothing; albums render empty |
| `NUXT_PUBLIC_FLICKR_USER_ID` | Nothing | Declared in `nuxt.config.ts` and injected by CI, but no code reads it — photoset ids are globally unique |
| `SITE_PASSWORD` | Pre-launch lock | Empty = the site is public |

The `NUXT_PUBLIC_*` values are **baked into the client bundle at build time** and are not
secrets — Firestore rules are what protect the data. The Flickr key is the exception: it
is a real rate-limited credential that ships to the browser anyway.

Three places need them and they drift apart easily: `.env` locally, GitHub Actions
secrets for the Hosting workflow, and Secret Manager entries declared in
`apphosting.yaml` for the live App Hosting deploy.

## Build and CI

- `npm run dev` — dev server. Works with no credentials; every game is playable against
  the static `data/` layer, which is enough to verify most changes in a real browser.
- `npm run typecheck` — `vue-tsc`. **The gate CI runs; run it before every push.**
- `npm run build` — CI runs this too, because `nuxt build` does not run `vue-tsc` and
  typecheck does not catch every way a build can fail.
- `npm run deploy` — `nuxt generate` plus a Firebase deploy of hosting, functions, rules
  **and storage**. For a human with owner access, not for CI.

`nuxt.config.ts` calls `writeFirebaseMessagingSw()` on **every** nuxt command. That
script refuses to write a blank push service worker: it warns and skips locally, and
throws when `CI` is set. `public/firebase-messaging-sw.js` is generated and gitignored —
never commit it.

`.github/workflows/pr-validate.yml` runs typecheck and build on every PR, holds no
credentials, and fails the run if `.nuxt` or `.output` are tracked.
`.github/workflows/firebase-hosting.yml` deploys on push to `main` — **without**
`storage.rules`, which the deploy service account cannot resolve; that one is deployed by
hand. `README.md` has the full secret and IAM role tables.

## Superseded planning decisions

An earlier version of this document recorded decisions that the build settled differently.
Recorded so the divergence is deliberate rather than forgotten:

| Earlier decision | What was built |
|---|---|
| Wall strictly anonymous, no author stored | Sign-in required, optional name defaulting to Anonymous; the wall itself never names an author, and the link lives in the admin-only `gratitudeAuthors` |
| Wall pre-moderated (approve before showing) | Publishes immediately, admins remove after |
| Niyams a daily check-in with streaks | Five shared niyams with moderated totals, plus a private mandir-visit streak; the 12-item personal checklist was built, then dropped |
| One niyam challenge at a time | Five running together, seeded from code defaults an admin publishes |
| Darshan and Legacy dropped | Both retained |
| Journey spans 39 years | 2017–2027, ten years |
| Moderation-only admin UI | Full CMS |
| Media hosting undecided | Flickr albums + Firebase Storage |
| Four daily games | Seven, plus two redirect stubs from renamed ones |

---

## When something is broken

`TROUBLESHOOTING.md` is symptom-first and covers the failure modes this project actually
produces — silent empty pages, denied writes, dead push, stale daily puzzles, deploy
403s. Read it before debugging from first principles; most of them have been hit before.
