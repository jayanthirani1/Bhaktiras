#!/usr/bin/env bash
#
# Installs the Higgsfield CLI so it is on PATH in a Claude Code container.
#
# Point the remote environment's setup script at this file. Containers are
# rebuilt from scratch every session, so this runs each time and is written to
# be idempotent — a second run with the binary already in place does nothing
# but print what it found.
#
# Why this exists rather than a plain `npm install -g @higgsfield/cli`:
# the package's postinstall (install.js) fetches the `hf` binary from GitHub
# releases using node's raw `https.get`, which does not read HTTPS_PROXY. In a
# proxied environment that call hangs until the install times out. So we install
# the package with --ignore-scripts and fetch the binary with curl, which does
# honour the proxy, then drop it exactly where the bin wrappers look for it.
#
# Credentials are not created here — Higgsfield uses OAuth with a loopback
# browser callback, which cannot complete in a headless container. Log in on a
# machine with a browser and pass the resulting file through as an environment
# variable; see HIGGSFIELD.md for the full walkthrough.

set -euo pipefail

log() { printf '[higgsfield] %s\n' "$*"; }

# ---------------------------------------------------------------- the binary

PKG="$(npm root -g)/@higgsfield/cli"
VENDOR="$PKG/vendor"

# Check for a usable install *before* touching npm: `npm install -g` replaces
# the package directory wholesale, taking vendor/ with it, so asking afterwards
# whether the binary is already there always answers no.
if [ -x "$VENDOR/hf" ] && [ -f "$PKG/package.json" ] && [ -f "$VENDOR/install.json" ]; then
  have="$(node -p "require('$VENDOR/install.json').version || ''" 2>/dev/null || echo "")"
  want="$(node -p "require('$PKG/package.json').version || ''" 2>/dev/null || echo "")"
  if [ -n "$want" ] && [ "$have" = "$want" ]; then
    log "hf $want already installed — skipping"
    SKIP_INSTALL=1
  fi
fi

if [ -z "${SKIP_INSTALL:-}" ]; then

log "installing @higgsfield/cli package (scripts skipped)"
npm install -g --ignore-scripts @higgsfield/cli >/dev/null

VERSION="$(node -p "require('$PKG/package.json').version")"

case "$(uname -s)" in
  Linux)  PLATFORM=linux ;;
  Darwin) PLATFORM=darwin ;;
  *) log "unsupported OS $(uname -s) — skipping binary install"; exit 0 ;;
esac

case "$(uname -m)" in
  x86_64|amd64)  ARCH=amd64 ;;
  aarch64|arm64) ARCH=arm64 ;;
  *) log "unsupported arch $(uname -m) — skipping binary install"; exit 0 ;;
esac

TARBALL="hf_${VERSION}_${PLATFORM}_${ARCH}.tar.gz"
URL="https://github.com/higgsfield-ai/cli/releases/download/v${VERSION}/${TARBALL}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

log "downloading $TARBALL"
curl -fsSL --max-time 180 -o "$TMP/$TARBALL" "$URL"

mkdir -p "$VENDOR"
tar xzf "$TMP/$TARBALL" -C "$VENDOR" hf
chmod 755 "$VENDOR/hf"

# The bin wrappers read this for telemetry, and the skip check above reads the
# version back out of it — so it has to be written after every download, not
# only the first.
cat > "$VENDOR/install.json" <<JSON
{
  "install_method": "npm",
  "package_manager": "npm",
  "package_name": "@higgsfield/cli",
  "version": "$VERSION"
}
JSON
log "installed hf $VERSION"

fi

# ----------------------------------------------------------------- the config

CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/higgsfield"
mkdir -p "$CONFIG_DIR"

# HIGGSFIELD_CREDENTIALS_JSON holds the verbatim contents of a credentials.json
# produced by `higgsfield auth login` elsewhere. We write it out rather than
# parsing it — the CLI owns that file's shape, and it rewrites it in place when
# it refreshes the access token.
if [ -n "${HIGGSFIELD_CREDENTIALS_JSON:-}" ]; then
  printf '%s' "$HIGGSFIELD_CREDENTIALS_JSON" > "$CONFIG_DIR/credentials.json"
  chmod 600 "$CONFIG_DIR/credentials.json"
  log "credentials written to $CONFIG_DIR/credentials.json"
else
  log "HIGGSFIELD_CREDENTIALS_JSON not set — CLI installed but not authenticated"
fi

# The CLI reads HIGGSFIELD_WORKSPACE_ID at runtime, so setting it in the
# environment is enough on its own. Mirroring it into config.json means the
# workspace also survives a shell that does not inherit the environment.
if [ -n "${HIGGSFIELD_WORKSPACE_ID:-}" ]; then
  printf '{\n  "workspace_id": "%s"\n}\n' "$HIGGSFIELD_WORKSPACE_ID" > "$CONFIG_DIR/config.json"
  log "workspace pinned to $HIGGSFIELD_WORKSPACE_ID"
fi

# ----------------------------------------------------------------- verify

log "$(higgsfield --version)"

# `account status` is the cheapest call that proves the token and the network
# path both work. It must not fail the setup script: a container with the CLI
# installed but unauthenticated is still a useful container.
if [ -f "$CONFIG_DIR/credentials.json" ]; then
  if higgsfield account status 2>&1 | sed 's/^/[higgsfield] /'; then
    log "authenticated"
  else
    log "credentials present but the call failed — see the error above"
  fi
fi
