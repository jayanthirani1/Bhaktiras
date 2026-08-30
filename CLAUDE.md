# Bhaktiras — working notes for Claude

## Read these first

| Document | When |
|---|---|
| `PROJECT-MAP.md` | Always. It has a "Where things live" table and a feature → composable → collection index. Read it before hunting through directories. |
| `TROUBLESHOOTING.md` | The moment something does not work. Symptom-first, with the file to open. |
| `IMPROVEMENTS.md` | Before changing rules, functions or a composable's error handling — it records what is known-broken and why. |
| `README.md` | Firebase setup, secrets, IAM roles, deploy. |
| `firestore.rules` | Whenever a write is involved. It is heavily commented and it is the authority — when a doc and the rules disagree, the rules win. |

## Checks before pushing

`npm run typecheck` is the gate CI runs. Run it before every push. CI also runs
`npm run build`, because `nuxt build` does not run `vue-tsc` and typecheck does not
catch every way a build can fail — run both if you have touched anything that
compiles.

The dev server (`npm run dev`) works without Firebase credentials: puzzle content
falls back to the static data in `data/`, which is enough to play any game
end to end and verify a change in a real browser.

## Things that bite

- **A failed Firestore read looks like an empty collection.** Most composables
  swallow the error. Check the network tab for `PERMISSION_DENIED` before
  concluding there is no data (IMPROVEMENTS #8).
- **Adding a collection means adding a rules block.** Firestore denies anything
  unruled, and the catch-and-fallback pattern hides it. Three collections are in
  that state right now (IMPROVEMENTS #15).
- **New query shapes are constrained.** The deploy service account cannot create
  composite indexes, so queries use a single equality filter and sort via the
  document id.
- **`public/firebase-messaging-sw.js` is generated and gitignored.** Never commit
  it; a blank one ships push that silently never fires.
- **Everything daily is Europe/London**, via `ukDateId()` in `utils/gameDay.ts` —
  never UTC, never the device timezone.
- **`utils/` and `composables/` are auto-imported by bare name.** Two files exporting
  the same name collide and one silently wins — the build warns, and the warning is
  real. `utils/suryaChandra.ts` vs `utils/tango.ts` is the live example.
- **`storage.rules` is not deployed by CI.** It goes by hand (see `README.md`).
