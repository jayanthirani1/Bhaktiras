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
| Live at | `bhaktiras.sksswoolwich.org` (App Hosting backend `sksswoolwich-bhaktiras`) |
| Firebase project | `skssw-bhaktiras` |

Site-wide constants — utsav dates, WhatsApp invite, journey range, gallery link — live in
`data/site.ts`. That file is the single edit point for the countdown and the seva CTA.

## Stack

- **Nuxt 3** static/SSR, deployed to **Firebase App Hosting** (`apphosting.yaml`,
  backend `sksswoolwich-bhaktiras`). The GitHub Actions workflow targeting static Hosting
  is vestigial.
- **Firestore** — 40 collections, fully ruled (`firestore.rules`, 886 lines)
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
`/darshan` `/legacy` `/haar` (hidden) `/account` `/login` `/signup` `/privacy` `/policy` `/submit-bug`

**Shop** (hidden until switched on) — `/shop`, `/shop/basket`, `/shop/orders/[reference]`

**Games** — `/play` plus `wordle`, `crossword`, `mini-crossword`, `connections`,
`one-percent`, `achievements`, `streaks`

**Admin** — `/admin` plus `auth`, `timeline`, `events`, `niyam-challenges`, `yajman`,
`notifications`, `legal`, `bugs`, `content/{index,homepage,community,navigation,seva,sections}`,
`shop/{index,products,totals,settings,team}`,
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
A message wall with rotating prompts. Posting is **signed-in only**, with an **optional
name** — blank posts as "Anonymous", and a signed-in user's name is pre-filled. Messages
publish **immediately**; admins can edit or delete after the fact. Prompts come from
`siteContent.communityPrompts` (CMS) with `data/communityPrompts.ts` as fallback.

Every post carries **reactions**: 👍 ❤️ 😀 🍯 💪 and nothing else, listed in
`data/communityReactions.ts` against the stable slugs `like` `love` `smile` `honey`
`strength`. One per person per post — tapping another moves it, tapping your own takes
it back — so a post's counts add up to the number of people who reacted. Reacting is
signed-in only; everyone sees the numbers.

**Only numbers are ever shown, never names**, and that is a storage decision rather than
a UI one. The tally lives on the post in `reactions`, world readable with the post; who
chose what lives in `gratitudeReactionVotes/{postId}_{uid}`, readable by nobody but its
owner. It is the same split `gratitudeAuthors` makes, for the same reason: `playStreaks`
is a public uid-to-name map, so a readable uid beside a post is a name beside a post —
on a wall where people post anonymously.

The two documents move in one batch and the **security rules tie them together**. The
post's rule reads the vote with `getAfter`, as it will be once the batch commits, and
lets a count move only by the single step that vote just took; the vote's delete rule
reads the post the same way and refuses to let a vote go without giving its count back.
So no count without a vote, no vote without a count, no second vote, and no deleting the
vote to react again. Counts are written with `FieldValue.increment`, so two devotees
reacting at the same moment both land.

This is the one derived total in the app that is **not** kept honest by a Cloud Function
trigger, unlike `niyamChallengeStats`. A wall reaction does not warrant one, and a tally
that only started counting after the next functions deploy would read as a broken button.
The rules do the same job here, and the deploy that carries them carries the feature.

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
one, an `icon`, an optional `gloss` — the plain-English line under the Sanskrit name on the
board, falling back to `NIYAM_GLOSS_BY_ICON` — and an optional `resourceUrl`/`resourceLabel`
— where the words are. Janmangal
Stotra's default points at the Kirtanavali page for the Namavali, because a counter is no use
to somebody who does not have the text in front of them. Only absolute http(s) is stored or
rendered (`safeResourceUrl`), since the href reaches an anchor tag straight from a document.

The page is a **sangat board**: five compact rows, each with the counted total, the next
milestone and a `+ Log` pill; input happens in a bottom sheet (`NiyamLogSheet`), never
inline — five inline forms was the thing that did not scale. Tapping a row body opens the
detail sheet instead. Daily Darshan is logged by hand — you pick morning, evening or both
— and the day is capped at two sabhas; there is no location-driven auto check-in.

The detail sheet ends with **your own last five entries** (`NiyamMyEntries`), each removable.
The 30-second undo on the log sheet only catches a mis-tap you notice immediately; this is
where a count typed wrong yesterday is taken back. Removal asks once inline rather than
opening a dialog over a sheet, the row leaves the list optimistically and returns if the
delete is refused, and `syncNiyamChallengeTotals` unwinds the shared total. The rules already
allowed it — `niyamSubmissions` delete has been open to the entry's author all along — so
this is UI over an existing permission, not a new one. The list is five because it exists to
undo a mistake, not to be a diary; older entries stay as they are.

**Everything the section says that is not part of a niyam** — page heading, empty and loading
states, the sentences on both sheets, the leaderboard headings — is CMS copy, defaulted in
`data/niyamCopy.ts` and overridden by `siteContent.niyamCopy`. Components read it through
`useNiyamCopy()`. Only overrides are stored: a blank field in the editor means "whatever the
code says", so rewording a default in a deploy still reaches the live site instead of being
pinned by a copy of itself saved in Firestore.

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
waiting), one-tap publishing of the defaults, a **Section copy** panel (`AdminNiyamCopy`)
holding every front-end string listed above, the editor with a live preview of the
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
Four daily games — **Wordle, Mini Crossword, 1% Club, Connections** —
with active-play timers that pause when you leave the game and resume when you return,
daily leaderboards, cross-device
completion tracking (`playCompletions`), daily visit streaks, an achievements system, and
all-time "crowns" for record holders. Achievements and crowns are awarded server-side by
Cloud Functions. Puzzle content is admin-editable per game, with static fallbacks.

### The Haar Trail (escape room)
Puzzle 7 of the escape room, not linked from anywhere. **Four quick taps on Seva in the
navigation bar** open `/haar`: the first tap goes to `/seva` as usual, and tapping the link you
are already on does nothing else. Typed in directly, `/haar` shows the ordinary 404, and leaving
it locks it again for the next team.

The Original Haar has vanished on its way from the staging area, and the CCTV is corrupted.
Players turn corridor sections to rebuild its route from the door logs. A decoy route leads to
the Security post. The only complete route ends at Ankut prep, and solving it shows the evidence
image and room 2 puzzle 5's chain of evidence. A solve is kept for the tab, so a team that wanders
off goes straight back to the evidence; **holding the case-file heading for two seconds** is the
game master's reset for the next team.

The board, trigger and solution are in `data/haarTrail.ts`, shared with
`server/api/haar-trail.post.ts`, which traces the submitted board again and only then returns
the image (`server/assets/haar-trail/evidence.jpg`) and the chain of evidence
(`server/utils/haarTrailChainOfEvidence.ts`, placeholder for now). Neither is in `public/` or the
client bundle; replace the image (`.jpg`, `.png` or `.webp`) or edit the chain and redeploy. An
admin can switch the whole thing off under **Content → Sections**, and the taps then do nothing.

### Shop (souvenir pre-orders)

Pre-orders for the Patotsav souvenir stand: apparel (hoodies, t-shirts, polos, jabhos,
sarees) and one-size items (water bottles, Lego). **No payment is taken in the app.** A
devotee signs in, orders, and is shown a payment reference — `BRSHOP-0001` onwards — with
the mandir's bank details; they pay by bank transfer or at the mandir. The Treasury team
marks the order paid and sends confirmation and receipts outside the app. Collection is at
the mandir on set evenings; the team announces it on WhatsApp. The app does not post items
or track collection.

**Ships switched off.** `shop` is the one section in `data/siteSections.ts` with
`defaultVisible: false`, so nothing appears until an admin turns it on under
Content → Sections. The nav item is added to stored navs without replacing them
(`NAV_ITEMS_ADDED` in `data/siteContent.ts`), and is hidden with the section.

**Only paid orders count.** Unpaid orders are not cancelled automatically when a window
closes — the Souvenir team chases them — but Order totals (`/admin/shop/totals`) counts
only `paid` towards what is ordered from suppliers, showing awaiting payment alongside.

How it fits together:

- `shopProducts` — name, description, category, up to 8 photos (`shop/` in Storage), a
  size list per product with each size marked adult or child, an adult/standard price and
  a child price (pence), and **a pre-order window per product** (`opensAt`/`closesAt`,
  either open-ended). Devotees read only `active` products.
- `shopOrders/{BRSHOP-nnnn}` — **created only by the `placeShopOrder` callable.** The
  browser sends product, size and quantity; the function prices each line from the
  product, checks the window and allocates the reference from `shopCounters/orders` in one
  transaction. So no client can set a price or reuse a reference. Each line keeps the
  name and price it was ordered at. The shop team can edit customer details, note and
  items, mark paid/unpaid, cancel and reinstate; every change is appended to `history`
  with who did it. Orders are **never deleted** and **survive account deletion** — the
  Treasury needs them; the privacy policy and the account page say so. They are in the
  data export.
- `shopSettings/main` — bank details (blank until Treasury confirms; the shop then says
  details will follow) and the shop wording, including the pre-order terms a devotee must
  tick. Copy fields store overrides only, defaults in `data/shop.ts`. Each order records
  the `termsVersion` it was placed under.
- `shopStaff/{uid}` — **the Shop role**, for the Souvenir lead and Treasury team. It
  grants the `/admin/shop` pages and nothing else (`isShopStaff()` in the rules; the
  middleware and sidebar route accordingly). Only full admins grant it, at
  `/admin/shop/team`, by email via the `grantShopAccess` callable; full admins have the
  shop implicitly.
- Exports: one CSV row per item ordered (all order and customer fields on each row) from
  the orders page, respecting the current filter; and a totals CSV from Order totals.

The basket lives in `localStorage` and holds only product, size and quantity. My orders is
a section on `/account`, shown while the shop is open or once someone has an order.

### Account & legal
`/account` offers self-serve **GDPR data export and account deletion**, plus auth
provider linking. `/privacy` and `/policy` render from the `sitePages` collection and are
admin-editable. Policy acceptance is recorded per user in `users/{uid}`.

### Bug reporting
`/submit-bug` accepts reports from anyone; `/admin/bugs` triages them open → resolved →
closed.

## Admin

Gated by an `admins/{uid}` **Firestore document** — not hardcoded UIDs — so adding a
moderator is a document write, no rules edit or redeploy. The one narrower role is
`shopStaff/{uid}`, which sees the Shop pages only (see Shop above). Enforced in
`firestore.rules:8` (`isAdmin()`), in Cloud Functions, and cosmetically by
`middleware/admin.ts` + `layouts/admin.vue`.

The admin area is a full CMS: homepage tiles, navigation (including which items are
mobile-primary), community prompts, timeline, events, niyam challenges, yajman, legal
pages, push notifications, bug triage, and a per-game puzzle editor with a shared word
bank.

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
behind that editor — the dashboard shows its document count on the card.

## Content model

Two layers throughout: **static TypeScript defaults in `data/`** and **Firestore
overrides**. The static layer means the site is never blank; the Firestore layer means
admins can change content without a deploy.

`data/` holds: `site.ts`, `timeline.ts`, `sevaTeams.ts`,
`communityPrompts.ts`, `quotes.csv`, `siteContent.ts`, `niyamCopy.ts`, `legalPages.ts`, `adminMenu.ts`,
and the game banks (`connectionsPuzzles`, `miniCrossword`,
`onePercentClub`, `fiveLetterWords`, `wordleGuessList`, `satsangWordBank`).

## Firestore collections

**Public content** — `siteContent` `sitePages` `timeline` `events`
`yajmanOpportunities`

**User-generated** — `gratitude` (wall) · `bugReports`

**Shop** — `shopProducts` `shopOrders` `shopSettings` `shopStaff` `shopCounters`

**Identity** — `admins` `users`

**Games** — `gameScores` `wordleScores` (legacy) `playStreaks` `playCompletions`
`userAchievements` `achievementCrowns` `gameWords` `wordleWords` `wordleDaily`
`miniCrosswordPuzzles` `connectionsPuzzles` `onePercentQuestions`

**Niyams** — `niyamChallenges` (+ `contributors` subcollection)
`niyamChallengeStats` `niyamSubmissions` `mandirVisits`. `niyamProgress`, `niyams` and
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
| Niyams a daily check-in with streaks | Five shared niyams with moderated totals, plus a private mandir-visit streak; the 12-item personal checklist was built, then dropped |
| One niyam challenge at a time | Five running together, seeded from code defaults an admin publishes |
| Darshan and Legacy dropped | Both retained |
| Journey spans 39 years | 2017–2027, ten years |
| Moderation-only admin UI | Full CMS |
| Media hosting undecided | Flickr albums + Firebase Storage |
