# Higgsfield in this project

Higgsfield generates the imagery and video behind Bhaktiras' marketing and
social assets. It plays no part in the app itself — nothing here is imported by
Nuxt, nothing ships in the bundle, and `npm run typecheck` neither knows nor
cares about any of it. This is tooling for making promotional material, kept in
the repo so the setup is written down rather than living in one person's shell
history.

`scripts/setup-higgsfield.sh` puts the CLI on PATH in a fresh container.

## The one rule worth carrying over

**AI generates imagery. Code composites all text.**

This is the load-bearing decision from `flex-content-pipeline`, learned the
expensive way: an earlier version had the image model generate finished text
slides and it produced garbled copy — "eco⁻es nnd" where "end without a" was
intended — with typefaces drifting between slides and margins that never
matched across a set. Prompt instructions cannot pin a design system.

So: Higgsfield for backgrounds, photography and video. Every word composited
afterwards with real fonts. If you find yourself writing a prompt containing
the text you want to appear in the image, stop.

## Setup

### 1. Point the environment's setup script at the installer

In the Claude Code web environment settings for this project, set the setup
script to run:

```bash
bash scripts/setup-higgsfield.sh
```

Containers are rebuilt from scratch each session, so this runs every time. It
is idempotent — a re-run with the binary already in place prints one line and
stops.

It does not use `npm install -g @higgsfield/cli` on its own, deliberately. That
package's postinstall fetches the `hf` binary with node's raw `https.get`,
which ignores `HTTPS_PROXY`; behind this environment's proxy the install hangs
until it times out. The script installs with `--ignore-scripts` and fetches the
binary with curl, which honours the proxy.

### 2. Get credentials from a machine that has a browser

Higgsfield authenticates with OAuth 2.0 PKCE and a **loopback callback** —
`higgsfield auth login` starts a local server on `127.0.0.1` and waits for the
browser to redirect back to it. A headless container has no browser, and its
loopback address is not reachable from yours, so the flow cannot complete here.
There is no API-key alternative: the CLI has no `HIGGSFIELD_API_KEY`, and its
release binary is built with `buildConfigLocked=true`, which disables the
`HIGGSFIELD_OAUTH_*` and `HIGGSFIELD_API_URL` overrides.

Log in where a browser exists, then carry the credentials across:

```bash
npm install -g @higgsfield/cli     # on your own machine
higgsfield auth login              # opens a browser, completes normally
cat ~/.config/higgsfield/credentials.json
```

On Windows that file is under `%APPDATA%`; on macOS and Linux it is
`~/.config/higgsfield/credentials.json` (or `$XDG_CONFIG_HOME/higgsfield/`).

### 3. Set two environment variables

Both go in the environment settings, not in `.env` — `.env` is for the Nuxt
build, is gitignored, and is not read by a setup script.

| Variable | Value |
|---|---|
| `HIGGSFIELD_CREDENTIALS_JSON` | The entire contents of `credentials.json`, verbatim |
| `HIGGSFIELD_WORKSPACE_ID` | The workspace to bill against — `higgsfield workspace list` shows the options |

The setup script writes the first to `~/.config/higgsfield/credentials.json`
with mode 600 and mirrors the second into `config.json`. The CLI reads
`HIGGSFIELD_WORKSPACE_ID` directly too, so that one works even without the
script; credentials do not, which is why they go through a file.

`credentials.json` is not parsed on the way through — it is written out
byte for byte, because the CLI owns that file's shape and rewrites it in place
when it refreshes the access token.

### 4. Check it

```bash
higgsfield account status     # credits, and proof the token works
higgsfield workspace list
higgsfield model list
```

A run's cost lands in credits — for comparison, a five-post content week in
`flex-content-pipeline` with one video and four 4:5 plates cost 30.5. Check
`account status` before a big batch, and if a number far above that appears,
something is regenerating in a loop.

## What the token actually is

`credentials.json` holds an access token and a refresh token for the whole
Higgsfield account, scoped `email profile offline_access user:org:read`. The
refresh token is long-lived by design — that is what stops it needing a browser
every session. Treat the environment variable as the secret it is:

- The container is ephemeral, so the file dies with the session, but the
  variable persists in the environment settings until changed.
- `higgsfield auth logout` on the origin machine invalidates the stored token,
  which is the way to revoke it if it ever leaks.
- Never commit it, never echo it into terminal output, and never paste it into
  a chat transcript.

## Gotchas

**The proxy is fine, the postinstall is not.** All three Higgsfield hosts
(`fnf-api-gw.higgsfield.ai`, `clerk.higgsfield.ai`, `higgsfield.ai`) are
reachable through this environment's egress proxy, and the Go binary honours
`HTTPS_PROXY` correctly. Only the npm postinstall's hand-rolled fetch does not.

**"No workspace selected" masks "Not authenticated".** The CLI checks the
workspace before the token, so an unauthenticated container with no workspace
reports the workspace problem first. Set `HIGGSFIELD_WORKSPACE_ID` before
concluding anything about the credentials.

**Aspect ratios do not default helpfully.** `seedance_2_0` defaults to 16:9 and
needs `--aspect_ratio 9:16` for anything vertical. `nano_banana_pro` is one of
the few models supporting 4:5 natively.

**`higgsfield upload create <file> --json`** returns a public CloudFront URL.
That is how assets reach tools that accept URLs but have no upload endpoint of
their own.
