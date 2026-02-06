# Bhaktiras (Nuxt + Firebase)

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
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NUXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4. Seed Firestore (optional)

To have timeline, events, gratitude, and volunteer data show up, create these **Firestore collections** and add documents. You can do this in the Firebase Console or with a script.

**Collections and fields:**

| Collection       | Fields |
|-----------------|--------|
| `timeline`      | `year` (string), `title` (string), `description` (string), `imageUrl` (string, optional) |
| `events`        | `time`, `title`, `description` (strings), `isLive` (boolean) |
| `gratitude`     | `name`, `message` (strings), `createdAt` (timestamp) |
| `volunteerRoles`| `role`, `timeSlot` (strings), `isFilled` (boolean) |
| `timeCapsule`   | `message` (string), `submittedAt` (timestamp) |
| `wordleScores`  | `userId`, `userName`, `userEmail` (optional), `guesses` (number), `word` (string), `completedAt` (timestamp) — for Wordle leaderboard |

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

## Deploy (e.g. Netlify)

1. Build: `npm run build`
2. Deploy the output (e.g. `.output/public` for static, or use the Nitro server).
3. In Netlify (or your host), set the same `NUXT_PUBLIC_FIREBASE_*` environment variables so the client can connect to Firestore.

For **static export** (no Node server):

```bash
npm run generate
```

Then deploy the `dist/` (or configured output) folder. All data is read/written from the browser to Firebase, so no API server is needed.

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
- **Play games:** Quiz, Crossword, Wordle, and Spelling Bee are placeholder pages; game logic can be copied from the original app if needed.
