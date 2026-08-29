/**
 * Captures a game mid-play, so the promo shows a populated board rather than a
 * cold "how to play" panel.
 *
 *   npm run dev                     # in another shell
 *   node scripts/promo/play.mjs     # writes .promo/screens/*-connections-played.png
 *
 * Only Connections is captured. Wordle is driven by an on-screen keyboard whose
 * keys carry an aria-label that changes as the game scores them ("A, empty" then
 * "A, correct"), and driving it far enough to fill a row did not work reliably:
 * ENTER stays disabled unless all five letters register, and it intermittently
 * did not. It is left out rather than shipped flaky — the film uses the
 * Connections board instead.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const BASE = process.env.PROMO_BASE ?? 'http://localhost:3000';
const OUT = process.env.PROMO_OUT ?? `${REPO}/.promo/screens`;
const CHROME = process.env.PROMO_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const DEVICES = {
  phone: { viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
};

// The dev server injects Nuxt DevTools and a tracer overlay; both float above
// the app and would otherwise sit in the middle of the promo frame.
const HIDE_DEV_CHROME = `
  #nuxt-devtools-container,
  nuxt-devtools-inspect-panel,
  #vue-tracer-overlay { display: none !important; }
`;

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const log = [];

for (const [device, opts] of Object.entries(DEVICES)) {
  const ctx = await browser.newContext({ ...opts, colorScheme: 'light' });
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/play/connections`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.addStyleTag({ content: HIDE_DEV_CHROME });
    await page.getByRole('button', { name: /start game/i }).first().click();
    await page.waitForTimeout(1800);
    // Tap a few tiles so the board shows selection state rather than a cold grid.
    const tiles = page.locator('button:visible');
    const n = await tiles.count();
    for (const i of [0, 5, 9]) {
      if (i < n) { await tiles.nth(i).click().catch(() => {}); await page.waitForTimeout(250); }
    }
    await page.screenshot({ path: `${OUT}/${device}-connections-played.png` });
    log.push(`${device}/connections-played: ok`);
  } catch (err) {
    log.push(`${device}/connections-played: FAILED ${err.message.split('\n')[0]}`);
  }
  await ctx.close();
}

await browser.close();
console.log(log.join('\n'));
