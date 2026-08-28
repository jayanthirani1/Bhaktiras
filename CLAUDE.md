# Bhaktiras — working notes for Claude

`PROJECT-MAP.md` is the map of the codebase; read it before hunting through
directories. `IMPROVEMENTS.md` tracks known rough edges.

## Checks before pushing

`npm run typecheck` is the gate CI runs. Run it before every push.

The dev server (`npm run dev`) works without Firebase credentials: puzzle content
falls back to the static data in `data/`, which is enough to play any game
end to end and verify a change in a real browser.
