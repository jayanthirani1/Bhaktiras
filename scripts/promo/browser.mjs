/** Shared Chromium launch, so capture and compositing agree on the browser. */

import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

/**
 * Finds a Chromium to drive.
 *
 * Playwright's own download is the happy path. `PROMO_CHROME` overrides it, and
 * failing both we look through `PLAYWRIGHT_BROWSERS_PATH` — a sandbox that ships
 * a browser often ships a different build number than the installed Playwright
 * expects, and a working browser at the wrong revision beats no browser.
 */
function findChromium() {
  if (process.env.PROMO_CHROME) return process.env.PROMO_CHROME
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH
  if (!root || !fs.existsSync(root)) return undefined
  const build = fs
    .readdirSync(root)
    .filter(name => name.startsWith('chromium-'))
    .sort()
    .pop()
  if (!build) return undefined
  const binary = path.join(root, build, 'chrome-linux', 'chrome')
  return fs.existsSync(binary) ? binary : undefined
}

/**
 * Launches Chromium, routed through an HTTPS proxy when the environment sets
 * one. Chromium does not read `HTTPS_PROXY` the way curl and node do, so a
 * sandbox that only reaches the internet through a proxy needs it passed in.
 */
export async function launch() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy
  const options = {
    args: [
      '--disable-quic',
      /**
       * Chromium's TLS 1.3 handshake does not survive some proxy relays; the
       * tunnel is torn down mid-handshake and every navigation returns
       * ERR_CONNECTION_RESET. Capping the version costs nothing here — we are
       * photographing our own site, not securing a session.
       */
      '--ssl-version-max=tls1.2'
    ]
  }
  if (proxyUrl) options.proxy = { server: proxyUrl, bypass: 'localhost,127.0.0.1' }

  try {
    return await chromium.launch(options)
  } catch (error) {
    const fallback = findChromium()
    if (!fallback) throw error
    return chromium.launch({ ...options, executablePath: fallback })
  }
}
