# Bhaktiras — Project Map

What the app actually is, as built. Descriptive, not aspirational — this document was
rewritten from the codebase at commit `96aeceb` (18 Aug 2026).

For the prioritised work queue, including security findings, see `IMPROVEMENTS.md`.

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
- **Firestore** — 28 collections, fully ruled (`firestore.rules`, 324 lines)
- **Firebase Auth** — email/password + Google, with account linking
- **Firebase Storage** — admin image uploads (`storage.rules`)
- **Firebase Cloud Messaging** — web push, service worker generated at build by
  `scripts/writeFirebaseMessagingSw.mjs`
- **Cloud Functions v2** (`functions/`, Node 22, `europe-west2`) — push delivery,
  achievement processing, scheduled reminders
- **Flickr** — event photo albums via public API
- Tailwind, Cinzel + DM Sans, `vue-tsc` typechecking

Requires the **Blaze** plan (Functions + Storage).

## Routes

**Public** — `/` `/journey` `/events` `/community` `/seva` `/niyams` `/yajman`
`/darshan` `/legacy` `/account` `/login` `/signup` `/privacy` `/policy` `/submit-bug`

**Games** — `/play` plus `wordle`, `crossword`, `mini-crossword`, `connections`,
`one-percent`, `achievements`, `streaks`

**Admin** — `/admin` plus `auth`, `timeline`, `events`, `niyams`, `yajman`,
`notifications`, `legal`, `bugs`, `content/{index,homepage,community,navigation}`,
`games/{wordle,crossword,mini-crossword,connections,one-percent,word-bank}`

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
A message wall with rotating prompts. Posting is **open to everyone, no sign-in**, with
an **optional name** — blank posts as "Anonymous", and a signed-in user's name is
pre-filled. Messages publish **immediately**; admins can edit or delete after the fact.
Prompts come from `siteContent.communityPrompts` (CMS) with `data/communityPrompts.ts`
as fallback.

### Seva
WhatsApp community invite (live link in `data/site.ts`) plus 12 volunteer teams and their
responsibilities from `data/sevaTeams.ts`. No hour logging.

### Our Niyams
12 utsav niyams (`data/niyams.ts`, admin-editable via the `niyams` collection). Each
person ticks their own — a **checklist**, not a dated daily tracker: `niyamProgress/{uid}`
holds a `checked` map with no per-day history. Public `niyamStats` aggregates
participants and per-niyam counts as community encouragement.

### Yajman
Utsav sponsorship opportunities with amounts and contact links, admin-managed.

### Games
Four daily games — **Wordle, Mini Crossword, 1% Club, Connections** —
with persistent timers that survive leaving the page, daily leaderboards, cross-device
completion tracking (`playCompletions`), daily visit streaks, an achievements system, and
all-time "crowns" for record holders. Achievements and crowns are awarded server-side by
Cloud Functions. Puzzle content is admin-editable per game, with static fallbacks.

### Account & legal
`/account` offers self-serve **GDPR data export and account deletion**, plus auth
provider linking. `/privacy` and `/policy` render from the `sitePages` collection and are
admin-editable. Policy acceptance is recorded per user in `users/{uid}`.

### Bug reporting
`/submit-bug` accepts reports from anyone; `/admin/bugs` triages them open → resolved →
closed.

## Admin

Gated by an `admins/{uid}` **Firestore document** — not hardcoded UIDs — so adding a
moderator is a document write, no rules edit or redeploy. Enforced in
`firestore.rules:8` (`isAdmin()`), in Cloud Functions, and cosmetically by
`middleware/admin.ts` + `layouts/admin.vue`.

The admin area is a full CMS: homepage tiles, navigation (including which items are
mobile-primary), community prompts, timeline, events, niyams, yajman, legal pages, push
notifications, bug triage, and a per-game puzzle editor with a shared word bank.

## Content model

Two layers throughout: **static TypeScript defaults in `data/`** and **Firestore
overrides**. The static layer means the site is never blank; the Firestore layer means
admins can change content without a deploy.

`data/` holds: `site.ts`, `timeline.ts`, `niyams.ts`, `sevaTeams.ts`,
`communityPrompts.ts`, `quotes.csv`, `siteContent.ts`, `legalPages.ts`, `adminMenu.ts`,
and the game banks (`connectionsPuzzles`, `miniCrossword`,
`onePercentClub`, `fiveLetterWords`, `wordleGuessList`, `satsangWordBank`).

## Firestore collections

**Public content** — `siteContent` `sitePages` `timeline` `events` `niyams`
`yajmanOpportunities`

**User-generated** — `gratitude` (wall) · `bugReports`

**Identity** — `admins` `users`

**Games** — `gameScores` `wordleScores` (legacy) `playStreaks` `playCompletions`
`userAchievements` `achievementCrowns` `gameWords` `wordleWords` `wordleDaily`
`miniCrosswordPuzzles` `connectionsPuzzles` `onePercentQuestions`

**Niyams** — `niyamProgress` `niyamStats`

**Push** — `pushSubscriptions` `pushMessages`

## Environment

Beyond the six `NUXT_PUBLIC_FIREBASE_*` values, the app needs
`NUXT_PUBLIC_FIREBASE_VAPID_KEY` (web push) and `NUXT_PUBLIC_FLICKR_API_KEY` /
`NUXT_PUBLIC_FLICKR_USER_ID` (event albums). See `.env.example`.

## Superseded planning decisions

An earlier version of this document recorded decisions that the build settled differently.
Recorded so the divergence is deliberate rather than forgotten:

| Earlier decision | What was built |
|---|---|
| Wall strictly anonymous, no author stored | Optional name, defaults to Anonymous |
| Wall pre-moderated (approve before showing) | Publishes immediately, admins remove after |
| Niyams a daily check-in with streaks | A checklist with community totals |
| Darshan and Legacy dropped | Both retained |
| Journey spans 39 years | 2017–2027, ten years |
| Moderation-only admin UI | Full CMS |
| Media hosting undecided | Flickr albums + Firebase Storage |
