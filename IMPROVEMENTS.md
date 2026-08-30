# Bhaktiras — Prioritised Improvements

Ordered by severity. Each item names the file, the concrete failure, and the fix. Items
struck through are closed — the entry stays so the reasoning is not lost.

Last reconciled against the code at `6f43a87` (30 Aug 2026). `PROJECT-MAP.md` describes
the app; `TROUBLESHOOTING.md` covers problems you are hitting right now.

---

## P0 — Security

### 1. The community wall accepts unauthenticated, unvalidated, unlimited writes — ~~closed~~

**Fixed.** `firestore.rules:238` now requires sign-in, allowlists exactly six keys with
`hasOnly()`, caps `name` at 50 characters, pins `createdAt == request.time`, and forbids
a `userId` on an anonymous post — the author link moved to the admin-only
`gratitudeAuthors` collection instead. The original finding follows.

The rule as it stood:

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

### 2. Any signed-in user can overwrite or delete every image on the site — ~~mostly closed~~

**Fixed, with one part outstanding.** `storage.rules` is now create-only — nothing can be
overwritten or deleted from a browser at all — scoped to the `events`, `timeline` and
`uploads` folders, and SVG is excluded from the allowed content types because it executes
script on a world-readable origin. **Still open:** restricting *who* may upload. Storage
rules cannot read Firestore, so that needs an `admin` custom claim on the auth token and
a `request.auth.token.admin == true` check. Until then an upload costs storage but cannot
damage anything. The original finding follows.

The rule as it stood:

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

### 3. `niyamStats` accepts arbitrary writes from any signed-in user — ~~closed~~

The writable community counter belonged to the personal daily niyam tracker, which has
since been retired. Its rules are gone, so the collection is closed by default and there
is nothing left to write. The niyams area is the challenges now, where the shared total is
derived by a Cloud Function and `allow write: if false` from the browser — the fix this
entry asked for, arrived at by deleting the feature.

### 4. Unauthenticated deletion of leaderboard history — ~~closed~~

**Fixed.** Both delete paths now require `isAdmin()` (`firestore.rules:213` for
`gameScores`, `:222` for `wordleScores`), and the routine cleanup runs from the scheduled
`pruneOldGameScores` function rather than from a browser.

As it stood: `wordleScores` had `allow delete: if true`, and `gameScores` allowed delete
on any past `dateId` with no auth clause — so any anonymous visitor could erase every
historical leaderboard across all four games.

### 5. The `guest` admin role grants full admin — ~~closed~~

**Resolved by deletion.** The `role` field is gone from the app, so the UI no longer
implies a distinction the rules never enforced. `isAdmin()` (`firestore.rules:8`) is
still the whole model — the document exists and `active != false` — and it grants every
write path in the file, including creating further admins. **A read-only tier has to
start in the rules before any UI can offer one**; do not reintroduce a `role` field
without one.

As it stood: `AdminRecord.role` was typed `'admin' | 'guest'` and parsed everywhere,
while rules, Cloud Functions and middleware all ignored it — so anyone added as a guest
could edit every CMS collection, send push to the whole community, and create further
admins.

---

## P1 — Integrity

### 6. Achievements and crowns are self-reported

`functions/index.js:897`

`handleGameAchievements` range-checks the client's `guesses`, `timeMs`, `score` and
`words`, but never cross-references the `gameScores` document actually written. A signed-in
user can call the callable directly and claim a one-guess Wordle or a sub-5-second
crossword. Crowns are public and all-time, so a forged record is permanent and visible.

**Fix.** Derive metrics server-side from the stored score document, or trigger achievement
processing from `onDocumentCreated` on `gameScores` rather than from a client call.

### 7. Play streaks are trivially forgeable

`firestore.rules:380` — `currentStreak` and `longestStreak` are validated only as ints with
`longestStreak >= currentStreak`. A user can write a 999-day streak to their own document,
and the leaderboard is public-read.

**Fix.** Validate that `lastVisitDate` advances by at most one day per update, or compute
streaks server-side.

---

## P2 — Reliability

### 8. Widespread silent error swallowing

`composables/useMandir.ts:112,152`, `useAdminData.ts`, and 23 composables that return no
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

`pages/events.vue:114` requests the notification prompt 1.2s after mount regardless of
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

### 15. Three game puzzle collections have no rules block, so their overrides are dead

Numbered by discovery, not position — this belongs with the reliability items.

`suryaChandraPuzzles`, `bhaktiMargPuzzles` and `rasRaniPuzzles` are read and written by
the app but appear nowhere in `firestore.rules`, so Firestore denies them by default:

| Collection | Read by | Written by |
|---|---|---|
| `suryaChandraPuzzles` | `composables/useSuryaChandraPuzzle.ts:21` | documented in `pages/admin/games/bhakti-marg.vue`, entered by hand |
| `bhaktiMargPuzzles` | `composables/useBhaktiMargPuzzle.ts:22` | `composables/useAdminData.ts:177` |
| `rasRaniPuzzles` | `composables/useRasRaniPuzzle.ts:22` | `composables/useAdminData.ts:181` |

Each read sits inside a `try`/`catch` that falls back to the generated or static daily
puzzle, so nothing surfaces: an admin publishes an override, the game keeps serving the
generated board, and the only evidence is a `PERMISSION_DENIED` in the network tab. This
is item #8's failure mode with a concrete instance behind it.

The admin menu compounds it — `data/adminMenu.ts:56` labels the entry "Surya Chandra",
routes it to `/admin/games/bhakti-marg`, and names `bhaktiMargPuzzles`, while the page it
opens documents `suryaChandraPuzzles`. Three names for one game.

**Fix.** Add rules blocks mirroring `bracketCityPuzzles` (`firestore.rules:374`) — public
read where `published == true`, admin write — deploy them, then settle on one collection
name per game and make the menu entry agree with it.

---

## P3 — Consistency

### 11. Sixteen `getDb()` implementations

The same four-line helper is redeclared in sixteen composables — `useMandir.ts:24`,
`useSiteContent.ts:20`, `useAdminAccess.ts:4` and thirteen more. Hoist into `utils/`.

### 12. Dead code from the previous app

`useVolunteerRoles` and `useVolunteerSignUp` (`useMandir.ts:215,239`) query a
`volunteerRoles` collection with no rules block and no caller — the seva page reads a
static file. `useCreateTimeCapsuleMessage` writes to `timeCapsule`, likewise unruled and
uncalled. `client/` still holds React leftovers. `wordleScores` is superseded by
`gameScores`. Both dead collections were still documented in `README.md` until this pass.

`utils/suryaChandra.ts` is a second, superseded implementation of the Surya Chandra
board. Nothing imports it — the game runs on `utils/tango.ts` — but Nuxt auto-imports
`utils/` wholesale, so the two files both export `cyclePlayCell` and every build prints:

```
WARN  Duplicated imports "cyclePlayCell", the one from "utils/suryaChandra.ts" has been
ignored and "utils/tango.ts" is used
```

Which means anything calling the bare `cyclePlayCell()` silently gets tango's. Delete the
dead file.

### 13. `Event.time` retained alongside `date`

`types/index.ts:40` keeps an optional legacy `time`, and `useMandir.ts:102` falls back to
it. Fine as a migration shim; worth removing once event documents are normalised.

---

## Already fixed — no action needed

Both bugs from the earlier review are resolved here independently: the Wordle
ref-unwrapping trap (`pages/play/wordle.vue:439` now binds the ref directly) and the
Spelling Bee case mismatch (that game has since been removed from the app).
`vue-tsc` is wired up as `npm run typecheck`.

---

## Content — the crossword word bank

### 14. Crossword variety is capped by vocabulary, not by the algorithm

`data/satsangWordBank.json` holds 353 entries, 347 of which the generator can use
(`MIN_ANSWER_LENGTH = 4`). The distribution is thin exactly where an interlocking grid
needs it most:

```
 4 letters: 43     7 letters: 70    10 letters: 15
 5 letters: 61     8 letters: 24    11+ letters: 33
 6 letters: 69     9 letters: 32
```

An earlier 5-column generator was measured over 1000 simulated days and produced only 42
distinct answers and 109 distinct puzzles, because just 42 of the 104 four- and five-letter
words could satisfy an interlocking grid at all. Two attempted fixes did not move it — a
deterministic per-day subset of the bank, and a looser template with 6 crossings instead
of 9 — and a 6x6 template was tried and removed, since it needs eight mutually consistent
6-letter answers.

**That generator has since been replaced** by the fixed 10x10 sparse skeleton in
`utils/crosswordGenerator.ts`, which draws on all 347 usable words and already samples a
per-day pool (`DAILY_POOL_FRACTION`, `MIN_POOL_PER_LENGTH`). So the 42/109 figures no
longer describe what ships — **variety on the current generator has not been measured.**

**Fix.** Measure distinct answers and puzzles over ~1000 simulated days against the
current generator before acting. If variety is still short, the remedy is a content task,
not a code one: grow the bank at lengths 4 and 5, where it is thinnest.

---

## Suggested order

The original P0 block is done: #1, #3, #4 and #5 are closed and #2 is closed apart from
restricting who may upload. What is left, in order:

1. **The three unruled puzzle collections** (#15) — one rules edit; today an admin can
   publish a puzzle and nothing anywhere says it was refused
2. **Error states** (#8) — the failure mode with the worst track record on this project,
   and the reason #15 went unnoticed
3. **Achievement and streak integrity** (#6, #7) — crowns are public and permanent, so a
   forged record does not age out
4. **Admin uploads behind a custom claim** (the open half of #2)
5. **The push prompt on a bare timer** (#9), then the consistency items as capacity allows

#15 and #4 are a single `firebase deploy --only firestore:rules`; the storage half of #2
must still be deployed by hand (see `README.md`).
