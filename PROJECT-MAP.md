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

**Admin** — `/admin` plus `auth`, `timeline`, `events`, `niyam-challenges`, `yajman`,
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
`/niyams` is the challenges: admin-set community goals with a target and a deadline
("10,000 malas in three months"). A devotee submits how many they have done;
approved entries from every devotee ladder up into one shared total on a
progress bar. Admin side is `/admin/niyam-challenges`: create the challenge,
then review the queue and see everyone's entries and per-person totals.

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
mobile-primary), community prompts, timeline, events, niyam challenges, yajman, legal
pages, push notifications, bug triage, and a per-game puzzle editor with a shared word
bank.

Every admin page is listed once, in `data/adminMenu.ts`. The sidebar and the `/admin`
dashboard cards are both generated from it, so a page cannot be reachable from one and
missing from the other. An entry's optional `collection` is the Firestore collection
behind that editor — the dashboard shows its document count on the card.

## Content model

Two layers throughout: **static TypeScript defaults in `data/`** and **Firestore
overrides**. The static layer means the site is never blank; the Firestore layer means
admins can change content without a deploy.

`data/` holds: `site.ts`, `timeline.ts`, `sevaTeams.ts`,
`communityPrompts.ts`, `quotes.csv`, `siteContent.ts`, `legalPages.ts`, `adminMenu.ts`,
and the game banks (`connectionsPuzzles`, `miniCrossword`,
`onePercentClub`, `fiveLetterWords`, `wordleGuessList`, `satsangWordBank`).

## Firestore collections

**Public content** — `siteContent` `sitePages` `timeline` `events`
`yajmanOpportunities`

**User-generated** — `gratitude` (wall) · `bugReports`

**Identity** — `admins` `users`

**Games** — `gameScores` `wordleScores` (legacy) `playStreaks` `playCompletions`
`userAchievements` `achievementCrowns` `gameWords` `wordleWords` `wordleDaily`
`miniCrosswordPuzzles` `connectionsPuzzles` `onePercentQuestions`

**Niyams** — `niyamChallenges` (+ `contributors` subcollection)
`niyamChallengeStats` `niyamSubmissions`. `niyamProgress`, `niyams` and
`niyamStats` are retired leftovers of the personal tracker, not written any more.

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
| Niyams a daily check-in with streaks | Shared challenges with a moderated total; the personal checklist was built, then dropped |
| Darshan and Legacy dropped | Both retained |
| Journey spans 39 years | 2017–2027, ten years |
| Moderation-only admin UI | Full CMS |
| Media hosting undecided | Flickr albums + Firebase Storage |
