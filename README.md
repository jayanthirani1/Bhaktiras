# Bhaktiras (Nuxt + Firebase)

**Repository:** [https://github.com/jayanthirani1/Bhaktiras](https://github.com/jayanthirani1/Bhaktiras)

A **Nuxt 3** (Vue 3, TypeScript) app for Shree KS Swaminarayan Temple Woolwich, built
around the Bhaktiras Patotsav, with **Firebase** for data, auth, storage, push and
functions.

This README covers **setup and deploy**. For everything else:

| Document | What it is for |
|---|---|
| [`PROJECT-MAP.md`](./PROJECT-MAP.md) | What the app is and where every piece of it lives. Start here. |
| [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) | Symptom-first fixes for the ways this app actually breaks. |
| [`IMPROVEMENTS.md`](./IMPROVEMENTS.md) | The prioritised work queue, including open security findings. |
| [`CLAUDE.md`](./CLAUDE.md) | The checks to run before pushing. |
| `firestore.rules` | The real access-control model. Heavily commented, and the authority. |

**How it is deployed.** The live site runs on **Firebase App Hosting** — Nuxt SSR on
Cloud Run, configured by `apphosting.yaml`. It builds as a static site too
(`nuxt generate`), and the GitHub Actions workflow targeting static Firebase Hosting
still exists, but App Hosting is what serves production. One consequence worth knowing:
**App Hosting never reads `firebase.json`**, so the headers in that file apply only to
the static target. Headers for the live site live in `nuxt.config.ts` `routeRules`.

## Setup

### 0. Run it without Firebase (fastest path)

`npm install && npm run dev` works with **no credentials at all**. Firebase init is
skipped, every Firestore read no-ops, and the app serves the static defaults in `data/` —
enough to play every game end to end and verify most UI changes in a real browser. What
you will not get: sign-in, admin, leaderboards, CMS content or push.

Continue below only when you need live data.

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project (or use an existing one).
2. Enable **Firestore Database**. Choose **production mode** and deploy this repo's
   `firestore.rules` (step 4) rather than starting in test mode — test-mode rules expire
   after 30 days, and when they did on this project every page rendered as merely empty
   for five months before anyone noticed. See IMPROVEMENTS #8.
3. Under **Project settings → General**, add a web app and copy the config object.



### 3. Environment variables

Copy `.env.example` to `.env` and fill in your Firebase config:

```bash
cp .env.example .env
```

In `.env`:

```
NUXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=sender-id
NUXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NUXT_PUBLIC_FIREBASE_VAPID_KEY=your-web-push-certificate-key
NUXT_PUBLIC_FLICKR_API_KEY=your-flickr-api-key
NUXT_PUBLIC_FLICKR_USER_ID=your-flickr-user-id
```

No quotes around values, and **restart the dev server after editing** — Nuxt reads `.env`
once at boot. `plugins/firebase.client.ts` logs `[Firebase] Connected to project: …` in
dev when it worked.

Every `NUXT_PUBLIC_*` value is **baked into the client bundle at build time**. They are
not secrets; Firestore rules are what protect the data. The Flickr key is the one
exception — it is a real rate-limited credential that ships to the browser anyway.

Optional: set `SITE_PASSWORD` to lock the whole site behind `/gate` until launch. Empty
or unset means public. See `server/middleware/site-gate.ts`.



### 4. Deploy the security rules

**Do this before seeding anything.** A collection with no rules block is denied to every
client, and most of this app's composables catch a denied read and render an empty list —
so a missing rule looks exactly like missing data.

```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project skssw-bhaktiras
```

`storage.rules` is a separate, manual step — see [Deploying storage
rules](#deploying-storage-rules) under Deploying.

### 5. Seed Firestore (optional)

You do not have to seed anything. Every content area has a static default in `data/` that
renders when Firestore is empty, and the admin CMS writes the Firestore layer for you
once you have an admin account (step 7). Seeding by hand is only worth it for a fresh
project you want populated immediately.

The collections an admin would otherwise fill:

| Collection            | Fields                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `timeline`            | `year`, `title`, `description`, optional `imageUrl` / media array                          |
| `events`              | `date`, `title`, `description`, optional `posterUrl` and `flickrAlbumId`                    |
| `yajmanOpportunities` | `title`, `detail`, `amount`, `contactUrl`, `active`, `order`                                |
| `siteContent/main`    | Homepage tiles, navigation, community prompts, seva teams, section switches — one document |
| `sitePages`           | The `/privacy` and `/policy` bodies                                                        |
| `niyamChallenges`     | The five shared niyams. **Publish these from the admin UI** — until the document exists the rules refuse submissions against it |
| `connectionsPuzzles`  | `title`, optional `dateId`, four `groups`, `published`                                     |

Written automatically, never by hand: `users`, `admins` (see step 7), `bugReports`,
`gratitude` / `gratitudeAuthors`, `pushSubscriptions`, and everything under Games and
Notifications. `pushMessages`, `notifications`, `dailyStats`, `niyamChallengeStats` and
the `contributors` rollups are **closed to browser writes entirely** and produced by Cloud
Functions.

**Indexes:** `firestore.indexes.json` holds the only three the app needs, all on
`gameScores` and `wordleScores`. A single-field `orderBy` needs no composite index, and
**the deploy service account cannot create new ones** — so new query shapes are a design
constraint, not a deploy step. See `PROJECT-MAP.md`.

`volunteerRoles` and `timeCapsule` appeared in earlier versions of this README. They are
dead — no rules block, no caller — and are tracked in IMPROVEMENTS #12.

### 6. Enable Firebase Authentication

1. In Firebase Console go to **Build → Authentication**.
2. Click **Get started**, then under **Sign-in method** enable:
  - **Email/Password** (for email sign-in and sign-up).
  - **Google** (for “Continue with Google” on login and sign-up).



### 7. Make yourself an admin

Admin is a **Firestore document, not a code change**. Sign up in the app, find your Auth
UID in Firebase Console → Authentication, then create:

```
admins/{your-uid}  →  { name: "Your Name", active: true }
```

`/admin` bounces to `/admin/auth` until that document exists. Note there is **no
privilege tier** — an `admins` document grants every write path in the rules, including
creating further admins.

### 8. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying

Two targets exist. **App Hosting is production**; static Hosting is the older path the
Actions workflow still drives.

| Target | Config | How it deploys |
|---|---|---|
| **App Hosting** (live) | `apphosting.yaml` — backend `sksswoolwich-bhaktiras`, Nuxt SSR on Cloud Run | Builds from the connected GitHub branch. Env vars come from Secret Manager, declared with `availability: [BUILD]`. |
| Static Hosting | `firebase.json`, `.firebaserc` | `npm run deploy` by hand, or `.github/workflows/firebase-hosting.yml` on push to `main`. |

A variable missing from `apphosting.yaml` is missing from the client bundle — the
`NUXT_PUBLIC_*` values are baked in at build time, not read at runtime. `SITE_PASSWORD` is
the one runtime value, set on the App Hosting backend.

### By hand

1. **Install Firebase CLI** (one-time):
  ```bash
   npm install -g firebase-tools
   firebase login
  ```
2. **Build and deploy**:
  ```bash
   npm run deploy
  ```
   This runs `nuxt generate`, installs the Functions dependencies, and deploys hosting,
   functions, firestore rules **and storage rules**. It needs owner access — CI cannot
   run it, because of the storage step described below.

   For rules only: `npx firebase-tools deploy --only firestore:rules`.

**Config:** `firebase.json` and `.firebaserc` point at project `skssw-bhaktiras`. To use another project, run `firebase use <project-id>` or edit `.firebaserc`.

Push delivery uses a callable Cloud Function, so the Firebase project must support Cloud Functions deployment (normally the Blaze plan).
The backend also sends the opted-in game reminder daily at 08:30 Europe/London and automatically notifies event subscribers when an event is created.

### Deploying storage rules

`storage.rules` is **not** deployed by CI. The GitHub Actions service account
lacks `firebasestorage.defaultBucket.get`, and the Firebase CLI resolves the
bucket before deploying anything — so including `storage` in the CI deploy fails
the entire run at the first step and ships nothing, not even hosting.

Until that is fixed, deploy storage rules by hand from an account with owner
access, after any change to `storage.rules`:

```bash
npx firebase-tools deploy --only storage --project skssw-bhaktiras
```

To fold it back into CI: grant the deploy service account the **Firebase Storage
Admin** role (`roles/firebasestorage.admin`), verify a manual
`--only storage` deploy works as that account, then add `storage` to the deploy
line in `.github/workflows/firebase-hosting.yml`.

### Deploy via GitHub (Actions)

Two workflows:

- **`.github/workflows/pr-validate.yml`** runs on every pull request: `npm run typecheck`
  and `npm run build`. It holds no credentials, deploys nothing, and fails the run if
  `.nuxt` or `.output` are tracked in git (they can carry baked-in config). It supplies
  placeholder Firebase values purely because `nuxt.config.ts` calls
  `writeFirebaseMessagingSw()` on every command, and that script throws in CI when the
  config is empty.
- **`.github/workflows/firebase-hosting.yml`** builds and deploys on push to `main`.

Add these **repository secrets** (Settings → Secrets and variables → Actions):


| Secret                                     | Value                                                            |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `FIREBASE_SERVICE_ACCOUNT_SKSSW_BHAKTIRAS` | JSON key for the deploy service account (see roles below)        |
| `NUXT_PUBLIC_FIREBASE_API_KEY`             | Same as in your `.env`                                           |
| `NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Same as in your `.env`                                           |
| `NUXT_PUBLIC_FIREBASE_PROJECT_ID`          | Same as in your `.env`                                           |
| `NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Same as in your `.env`                                           |
| `NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Same as in your `.env` (`365204369219` — full 12 digits)         |
| `NUXT_PUBLIC_FIREBASE_APP_ID`              | Same as in your `.env`                                           |
| `NUXT_PUBLIC_FIREBASE_VAPID_KEY`           | Web Push certificate key from Firebase Console → Cloud Messaging |
| `NUXT_PUBLIC_FLICKR_API_KEY`               | Flickr API key used by event galleries                           |
| `NUXT_PUBLIC_FLICKR_USER_ID`               | Flickr account/user ID that owns the albums                      |


The workflow builds the app, installs the Functions dependencies, then deploys Hosting,
Functions and Firestore rules — **not** storage rules. No `.env` file is used in GitHub;
everything comes from secrets.

**Service account IAM roles** (Google Cloud Console → IAM → the account whose key is in `FIREBASE_SERVICE_ACCOUNT_SKSSW_BHAKTIRAS`):


| Role                            | Needed for                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------- |
| Firebase Hosting Admin          | Hosting deploy                                                                |
| Cloud Functions Developer       | Functions deploy                                                              |
| Service Account User            | Functions runtime identity                                                    |
| Cloud Scheduler Admin           | Scheduled game-reminder function                                              |
| Firebase Rules Admin            | Firestore rules compile/deploy (`firebaserules.googleapis.com`)               |
| Cloud Datastore User            | Reading the Firestore database during Functions deploy (Firestore triggers) |
| Artifact Registry Administrator | Functions container images                                                    |


Without **Firebase Rules Admin**, deploy fails with `403` on `firebaserules.googleapis.com/...:test`.  
Without **Cloud Datastore User**, deploy fails with `403` on `firestore.googleapis.com/.../databases/(default)`.

## Project structure

`PROJECT-MAP.md` has the full directory table and a feature → composable → collection
index. The short version:

- `pages/` – every route (Nuxt file-based routing); `pages/admin/**` is the CMS,
  `pages/play/**` the seven daily games
- `components/` – auto-imported, flat; the prefix names the area (`Admin*`, `Niyam*`, `Game*`)
- `composables/` – all Firestore access and shared client state
- `data/` – static defaults and puzzle banks, so the site renders with no database
- `utils/` – pure helpers: puzzle generators, the Europe/London day helper, markdown
- `server/` – Nitro only: the site-password gate, `robots.txt`, `sitemap.xml`
- `functions/index.js` – Cloud Functions v2: push delivery, achievements, niyam totals,
  scheduled reminders and stats
- `firestore.rules` / `storage.rules` – the access-control model, commented per collection

## Requirements

The **Blaze** plan, for Cloud Functions and Storage. Functions run in `europe-west2` on
Node 22; the App Hosting backend is in `europe-west4`.

## Troubleshooting

See [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md). The short version of the most common
one: **an empty page usually means a denied read, not an empty collection** — most
composables swallow the error. Check the network tab for `PERMISSION_DENIED` before
concluding there is no data.

