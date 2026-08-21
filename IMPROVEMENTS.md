# Bhaktiras — Prioritised Improvements

From a review of the codebase at `96aeceb` (18 Aug 2026). Ordered by severity. Each item
names the file, the concrete failure, and the fix.

---

## P0 — Security

### 1. The community wall accepts unauthenticated, unvalidated, unlimited writes

`firestore.rules:163`

```
match /gratitude/{id} {
  allow read: if true;
  allow create: if request.resource.data.message is string
    && request.resource.data.message.size() >= 5
    && request.resource.data.message.size() <= 500;
}
```

Only `message` is checked. Missing: authentication, a `hasOnly()` field allowlist, any
constraint on `name`, and `createdAt == request.time`. Messages publish instantly with no
moderation.

What that allows, with nothing but a browser console and the public project ID:

- **Impersonation.** `name` is unvalidated and unbounded — anyone can post as a sant, a
  trustee, or any member of the sangat. On a mandir wall this is the most damaging one.
- **Permanent pinning.** The wall sorts by `createdAt`, which the client supplies freely.
  A far-future timestamp sits at the top of the wall forever.
- **Unlimited flooding.** No auth, no rate limit — a script can add documents until the
  page is unusable and your Firestore bill is not.
- **Arbitrary field injection.** No `hasOnly()`, so documents can carry any payload.

**Fix.** Add `hasOnly(['name','message','prompt','anonymous','createdAt'])`, bound `name`
to ~50 chars, pin `createdAt == request.time`, and decide on auth. Requiring sign-in to
post is the strongest control; if the wall must stay open, treat moderation as
compensating and add it back.

### 2. Any signed-in user can overwrite or delete every image on the site

`storage.rules:4`

```
match /{allPaths=**} {
  allow read: if true;
  allow write: if request.auth != null && size < 8MB && contentType.matches('image/.*');
}
```

`{allPaths=**}` is the whole bucket, and `write` covers create, overwrite **and delete**.
Any account — and anyone can self-register at `/signup` — can replace an event poster or a
timeline photograph with an arbitrary image, or delete all of them. Content type is the
only gate, and it is client-asserted.

**Fix.** Scope writes to admins (mirror the Firestore admins lookup), or at minimum confine
user writes to a per-UID prefix and make the admin upload paths admin-only.

### 3. `niyamStats` accepts arbitrary writes from any signed-in user

`firestore.rules:306,308` — `allow create, update: if isSignedIn();`

No field validation, no ownership check. Any account can zero the community counts, set
`participants` to anything, or inject fields — and it is public-read, so it renders. It is
the one number on the niyams page meant to encourage the sangat.

**Fix.** Validate shape and allow only increments, or move aggregation into a Cloud
Function and set `allow write: if false`.

### 4. Unauthenticated deletion of leaderboard history

`firestore.rules:157-160` — `wordleScores` has `allow delete: if true;`. Legacy, but any
anonymous visitor can empty it.

`firestore.rules:152` — `gameScores` allows delete when
`resource.data.dateId < utcDateId()` with **no auth clause**, so anyone can erase all
historical leaderboards across all four games.

**Fix.** Require admin for the cleanup path, or run it from the scheduled function that
already exists.

### 5. The `guest` admin role grants full admin

`firestore.rules:8`, `composables/useAdminAccess.ts:13`

`AdminRecord.role` is typed `'admin' | 'guest'` and parsed everywhere, but **nothing
enforces it** — `isAdmin()` checks only that the document exists and `active != false`.
Rules, Cloud Functions and middleware all ignore `role`. Anyone added as a guest can edit
every CMS collection, send push notifications to the whole community, and create further
admins.

**Fix.** Either enforce the admin role on write paths and give guests genuinely read-only
rules, or remove the field so the UI stops implying a distinction that does not exist.

---

## P1 — Integrity

### 6. Achievements and crowns are self-reported

`functions/index.js:229`

`handleGameAchievements` range-checks the client's `guesses`, `timeMs`, `score` and
`words`, but never cross-references the `gameScores` document actually written. A signed-in
user can call the callable directly and claim a one-guess Wordle or a sub-5-second
crossword. Crowns are public and all-time, so a forged record is permanent and visible.

**Fix.** Derive metrics server-side from the stored score document, or trigger achievement
processing from `onDocumentCreated` on `gameScores` rather than from a client call.

### 7. Play streaks are trivially forgeable

`firestore.rules:250` — `currentStreak` and `longestStreak` are validated only as ints with
`longestStreak >= currentStreak`. A user can write a 999-day streak to their own document,
and the leaderboard is public-read.

**Fix.** Validate that `lastVisitDate` advances by at most one day per update, or compute
streaks server-side.

---

## P2 — Reliability

### 8. Widespread silent error swallowing

`composables/useMandir.ts:112,147`, `useAdminData.ts`, and 13 composables that return no
`error` state at all — including `useWordleLeaderboard`, `useSiteContent`, `useSitePage`
and `useGameLeaderboard`.

`useEvents` and `useGratitudeMessages` both catch and set `items.value = []`. A denied
read, an expired rules deployment or a dropped connection then renders as "no events yet"
and "no messages yet".

**This exact pattern hid a fully broken database for five months earlier this year** — when
the default test-mode rules expired in March, every page looked merely empty rather than
broken.

`useTimeline` gets it right: it falls back to static milestones and preserves `error`.

**Fix.** Return `{ data, isLoading, error, refetch }` consistently and render a real error
state. A failed read must never be indistinguishable from an empty collection.

### 9. Push prompt fires on a bare timer

`pages/events.vue:109` requests the notification prompt 1.2s after mount regardless of
engagement. Browsers permanently blocklist a site once its permission prompt is dismissed —
this spends a one-shot resource on someone who has only just arrived.

**Fix.** Gate on a real interaction, or on a second visit.

### 9b. A build without `.env` silently blanks the push service worker

`scripts/writeFirebaseMessagingSw.mjs` regenerates the tracked file
`public/firebase-messaging-sw.js` on every `nuxt build`, writing the Firebase config from
environment variables. Build without a populated `.env` and it rewrites the file with six
empty strings — and because the file is committed to git, it is very easy to stage that
and push it. Web push then fails in production with no build error and no runtime warning
on the site itself.

**Fix.** Add `public/firebase-messaging-sw.js` to `.gitignore` and generate it at deploy
time, or make the script fail loudly when the config is empty rather than writing blanks.

**Fixed.** The script now refuses to write blanks: it keeps the committed file and warns
locally, and throws in CI where a missing config is always a mistake.

### 10. The countdown is not CMS-driven

`composables/useCountdown.ts:3` binds to `SITE.patotsavStart` in `data/site.ts`. Everything
else on the site became admin-editable; the utsav date still needs a code change and a
deploy.

---

## P3 — Consistency

### 11. Three `getDb()` implementations

Duplicated in `useMandir.ts:17`, `useSiteContent.ts:11`, `useAdminAccess.ts:4` and others.
Hoist into `utils/`.

### 12. Dead code from the previous app

`useVolunteerRoles` and `useVolunteerSignUp` (`useMandir.ts:185,209`) query a
`volunteerRoles` collection with no rules block and no caller — the seva page reads a
static file. `client/` still holds React leftovers. `wordleScores` is superseded by
`gameScores`.

### 13. `Event.time` retained alongside `date`

`types/index.ts:41` keeps an optional legacy `time`, and `useMandir.ts:102` falls back to
it. Fine as a migration shim; worth removing once event documents are normalised.

---

## Already fixed — no action needed

Both bugs from the earlier review are resolved here independently: the Wordle
ref-unwrapping trap (`pages/play/wordle.vue:439` now binds the ref directly) and the
Spelling Bee case mismatch (that game has since been removed from the app).
`vue-tsc` is wired up as `npm run typecheck`.

---

## Suggested order

1. **Wall rules** (#1) — one rules edit, removes impersonation and flooding
2. **Storage scoping** (#2) — one rules edit, protects all site imagery
3. **`niyamStats` and the delete rules** (#3, #4) — same deploy
4. **Decide the guest role** (#5) — enforce it or delete it
5. **Error states** (#8) — the failure mode with the worst track record on this project
6. Then integrity (#6, #7), and the rest as capacity allows

Items 1–4 are a single `firebase deploy --only firestore:rules,storage` once written.
