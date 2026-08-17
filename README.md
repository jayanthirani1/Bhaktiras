# Bhaktiras (Nuxt + Firebase)

**Repository:** [https://github.com/jayanthirani1/Bhaktiras](https://github.com/jayanthirani1/Bhaktiras)

This is the Bhaktiras app recreated with **Nuxt 3** and **Firebase (Firestore)** as the database. It can be deployed as a static site (e.g. Netlify, Vercel) with no backend server.

## Setup

**→ For a full step-by-step Firebase and database setup, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).**

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project (or use an existing one).
2. Enable **Firestore Database** (Create database → start in test mode for development).
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



### 4. Seed Firestore (optional)

To have timeline, events, gratitude, and volunteer data show up, create these **Firestore collections** and add documents. You can do this in the Firebase Console or with a script.

**Collections and fields:**


| Collection            | Fields                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `timeline`            | `year` (string), `title` (string), `description` (string), `imageUrl` (string, optional)                                              |
| `events`              | `date`, `title`, `description`, `posterUrl` and `flickrAlbumId` (optional strings)                                                    |
| `yajmanOpportunities` | `title`, `detail`, `amount`, `contactUrl`, `active`, `order`                                                                          |
| `bugReports`          | Created from the footer form and managed in Admin                                                                                     |
| `users`               | Account UID and versioned policy-acceptance timestamps (created automatically at signup)                                              |
| `pushSubscriptions`   | Private per-device FCM tokens and opted-in notification categories                                                                    |
| `pushMessages`        | Admin-only delivery audit written by the notification Cloud Function                                                                  |
| `connectionsPuzzles`  | `title`, optional `dateId`, four `groups`, `published`                                                                                |
| `gratitude`           | `name`, `message` (strings), `createdAt` (timestamp)                                                                                  |
| `volunteerRoles`      | `role`, `timeSlot` (strings), `isFilled` (boolean)                                                                                    |
| `timeCapsule`         | `message` (string), `submittedAt` (timestamp)                                                                                         |
| `wordleScores`        | `userId`, `userName`, `userEmail` (optional), `guesses` (number), `word` (string), `completedAt` (timestamp) — for Wordle leaderboard |


**Index:** In Firestore, create a composite index for `gratitude` on `createdAt` (Descending) so the community page can order by date.

**Example seed documents:**

- **timeline:** `{ year: "2016", title: "Foundation Stone", description: "The first stone was laid...", imageUrl: null }`
- **events:** `{ time: "06:00 AM", title: "Morning Aarti", description: "Start the day...", isLive: false }`
- **gratitude:** Add via the app or manually: `{ name: "Devotee", message: "Grateful for this mandir.", createdAt: <timestamp> }`
- **volunteerRoles:** `{ role: "Prasad Distribution", timeSlot: "10:00 AM - 12:00 PM", isFilled: false }`



### 5. Enable Firebase Authentication (for login & Wordle leaderboard)

1. In Firebase Console go to **Build → Authentication**.
2. Click **Get started**, then under **Sign-in method** enable:
  - **Email/Password** (for email sign-in and sign-up).
  - **Google** (for “Continue with Google” on login and sign-up).



### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Firebase Hosting

The app is configured to deploy as a **static site** to [Firebase Hosting](https://firebase.google.com/docs/hosting) (same project as your Firestore/Auth).

1. **Install Firebase CLI** (one-time):
  ```bash
   npm install -g firebase-tools
   firebase login
  ```
2. **Build and deploy**:
  ```bash
   npm run deploy
  ```
   This generates the static app. Deploy Hosting, Functions and Firestore rules with `firebase deploy --only hosting,functions,firestore:rules`.

**Config:** `firebase.json` and `.firebaserc` point at project `skssw-bhaktiras`. To use another project, run `firebase use <project-id>` or edit `.firebaserc`.

Push delivery uses a callable Cloud Function, so the Firebase project must support Cloud Functions deployment (normally the Blaze plan).
The backend also sends the opted-in game reminder daily at 08:30 Europe/London and automatically notifies event subscribers when an event is created.

### Deploy via GitHub (Actions)

A workflow in `.github/workflows/firebase-hosting.yml` builds and deploys on push to `main`. Add these **repository secrets** (Settings → Secrets and variables → Actions):


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


The workflow builds the app, installs the Functions dependencies, then deploys Hosting, Functions and Firestore rules. No `.env` file is used in GitHub; everything comes from secrets.

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

- `app.vue` – Root layout with navigation
- `pages/` – Route pages (index, journey, events, community, darshan, seva, legacy, play/*)
- `components/` – PageHeader, Navigation
- `composables/useMandir.ts` – Firestore reads/writes (timeline, events, gratitude, volunteers, time capsule)
- `plugins/firebase.client.ts` – Firebase init (client-only)
- `types/index.ts` – Shared types



## Differences from the original (React + Express + Postgres)

- **Stack:** Nuxt 3 (Vue) + Firebase Firestore instead of React + Express + PostgreSQL.
- **Hosting:** Can be deployed as a static site; no backend or Docker required.
- **Data:** All persistence is in Firestore. Create the collections and indexes above for full functionality.
- **Play games:** Daily and all-time games include Wordle, crosswords, Connections, 1% Club, and Spelling Bee.

