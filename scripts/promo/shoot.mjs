/**
 * Captures the app screens the promo film is built from.
 *
 *   npm run dev                       # in another shell
 *   node scripts/promo/shoot.mjs      # writes .promo/screens
 *
 * PROMO_BASE points it at a different origin (the deployed site, say); off-box
 * origins are routed through HTTPS_PROXY because Chromium, unlike curl, does
 * not read that from the environment on its own.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const BASE = process.env.PROMO_BASE ?? 'http://localhost:3000';
const OUT = process.env.PROMO_OUT ?? `${REPO}/.promo/screens`;
const CHROME = process.env.PROMO_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// Phone frames for the vertical cut, desktop for the landscape cut. The phone
// size is iPhone 14 Pro logical pixels at dpr 3, which is what the app's own
// breakpoints are tuned for.
const DEVICES = {
  phone: { viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
};

// scroll is in viewport-heights: 0 is the top of the page, 1 is one screen down.
const SHOTS = [
  ['home', '/', 0],
  ['home-quote', '/', 1],
  ['journey', '/journey', 0],
  ['journey-mid', '/journey', 1],
  ['events', '/events', 0],
  ['community', '/community', 0],
  ['seva', '/seva', 0],
  ['niyams', '/niyams', 0],
  ['darshan', '/darshan', 0],
  ['play', '/play', 0],
  ['wordle', '/play/wordle', 0],
  ['connections', '/play/connections', 0],
];

// The dev server injects Nuxt DevTools and a tracer overlay. Both float above
// the app and would appear in every frame of the promo, so they are removed
// before the shutter rather than cropped out afterwards.
const HIDE_DEV_CHROME = `
  #nuxt-devtools-container,
  nuxt-devtools-inspect-panel,
  #vue-tracer-overlay { display: none !important; }
`;

mkdirSync(OUT, { recursive: true });

// Chromium does not read HTTPS_PROXY from the environment the way curl does, so
// anything off-box needs it passed explicitly. localhost is left direct — routing
// it through the proxy would fail, and the dev server needs no egress.
const proxyServer = process.env.HTTPS_PROXY || process.env.https_proxy;
const needsProxy = proxyServer && !BASE.includes('localhost') && !BASE.includes('127.0.0.1');

const browser = await chromium.launch({
  executablePath: CHROME,
  ...(needsProxy ? { proxy: { server: proxyServer, bypass: 'localhost,127.0.0.1' } } : {}),
});
const results = [];

for (const [deviceName, opts] of Object.entries(DEVICES)) {
  const ctx = await browser.newContext({ ...opts, colorScheme: 'light' });
  const page = await ctx.newPage();

  for (const [name, path, scroll] of SHOTS) {
    const file = `${OUT}/${deviceName}-${name}.png`;
    try {
      // networkidle hangs on the homepage — the live countdown keeps a timer
      // running that never lets the network go quiet — so wait on the DOM and
      // then give animations a fixed settle instead.
      const res = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(3500);
      await page.addStyleTag({ content: HIDE_DEV_CHROME });
      if (scroll) {
        await page.evaluate((s) => window.scrollTo({ top: window.innerHeight * s, behavior: 'instant' }), scroll);
        await page.waitForTimeout(1200);
      }
      await page.screenshot({ path: file });
      results.push(`${deviceName}/${name}: HTTP ${res?.status()} -> ${file.split('/').pop()}`);
    } catch (err) {
      results.push(`${deviceName}/${name}: FAILED ${err.message.split('\n')[0]}`);
    }
  }
  await ctx.close();
}

await browser.close();
console.log(results.join('\n'));
