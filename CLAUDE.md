# Bhaktiras — working notes for Claude

`PROJECT-MAP.md` is the map of the codebase; read it before hunting through
directories. `IMPROVEMENTS.md` tracks known rough edges.

## Announce every merge as a release note

Whenever a pull request you worked on is merged to `main`, send Jay a push
notification written as a release note. Do it after the merge lands, not before.

Wait for the Firebase Hosting deploy (`.github/workflows/firebase-hosting.yml`,
which runs on every push to `main`) to finish first, so the notification says
whether the change is actually live. A deploy takes roughly two minutes.

Keep it to one line, under 200 characters, no markdown:

- lead with what a devotee using the site would notice, not the file that changed
- name the games or pages affected when it is scoped to some of them
- close with the PR number and whether the deploy succeeded

> Shipped to Bhaktiras — Game timers now pause when you leave. All 7 timed games
> start at 0:00, pause on minimise/tab-switch/navigate, resume on return, stop at
> game end. PR #21, deployed.

If the deploy fails, say that instead — a failed deploy is the thing worth
interrupting someone for.

## Checks before pushing

`npm run typecheck` is the gate CI runs. Run it before every push.

The dev server (`npm run dev`) works without Firebase credentials: puzzle content
falls back to the static data in `data/`, which is enough to play any game
end to end and verify a change in a real browser.
