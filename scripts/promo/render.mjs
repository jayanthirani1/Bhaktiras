/**
 * Renders the promo film to MP4, in both a vertical and a landscape cut.
 *
 *   node scripts/promo/render.mjs
 *
 * Frames come from promo.html driven one `seek(t)` at a time by a headless
 * Chromium, then ffmpeg assembles them. Rendering frame-by-frame rather than
 * screen-recording means the output is deterministic and never catches a
 * transition half-finished.
 *
 * Inputs are the screenshots in .promo/screens — run shoot.mjs first.
 * Everything it writes lands in .promo/, which is gitignored.
 */
import { chromium } from 'playwright';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../..');
const PROMO = `${REPO}/.promo`;
const SCREENS = `${PROMO}/screens`;
const FPS = 25;

// Chromium ships with the container image; Playwright's own ffmpeg is a stripped
// VP8-only build, so encoding needs a full one. Override either with an env var.
const CHROME = process.env.PROMO_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const FF = process.env.PROMO_FFMPEG || 'ffmpeg';

// Which capture backs each named screen, so the HTML never holds a filename.
const SHOTS = {
  'phone-home': `${SCREENS}/phone-home.png`,
  'phone-connections': `${SCREENS}/phone-connections-played.png`,
  'phone-niyams': `${SCREENS}/phone-niyams.png`,
  'desktop-home': `${SCREENS}/desktop-home.png`,
  'desktop-connections': `${SCREENS}/desktop-connections-played.png`,
  'desktop-niyams': `${SCREENS}/desktop-niyams.png`,
};

const missing = Object.entries(SHOTS).filter(([, v]) => !existsSync(v));
if (missing.length) {
  console.error('missing screenshots — run `node scripts/promo/shoot.mjs` first:');
  for (const [k, v] of missing) console.error(`  ${k}: ${v}`);
  process.exit(1);
}

const FORMATS = [
  { name: 'vertical', w: 1080, h: 1920 },
  { name: 'landscape', w: 1920, h: 1080 },
];

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--force-color-profile=srgb', '--font-render-hinting=none'],
});

for (const fmt of FORMATS) {
  const frameDir = `${PROMO}/frames-${fmt.name}`;
  rmSync(frameDir, { recursive: true, force: true });
  mkdirSync(frameDir, { recursive: true });

  const ctx = await browser.newContext({
    viewport: { width: fmt.w, height: fmt.h },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  // The screenshots live outside scripts/promo, so hand the page absolute
  // file:// URLs rather than relying on relative paths resolving.
  await page.addInitScript((shots) => {
    window.PROMO_SHOTS = Object.fromEntries(
      Object.entries(shots).map(([k, v]) => [k, 'file://' + v]));
  }, SHOTS);

  await page.goto(`file://${HERE}/promo.html?format=${fmt.name}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);   // let the woff2 faces and PNGs decode

  const duration = await page.evaluate(() => window.PROMO_DURATION);
  const total = Math.round(duration * FPS);
  const stage = page.locator('#stage');

  for (let i = 0; i < total; i++) {
    await page.evaluate((t) => window.seek(t), i / FPS);
    await stage.screenshot({ path: `${frameDir}/f${String(i).padStart(5, '0')}.png` });
  }
  await ctx.close();
  console.log(`${fmt.name}: ${total} frames`);

  const out = `${PROMO}/bhaktiras-promo-${fmt.name}.mp4`;
  execFileSync(FF, [
    '-y', '-loglevel', 'error',
    '-framerate', String(FPS),
    '-i', `${frameDir}/f%05d.png`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
    // yuv420p and even dimensions are what every social platform actually decodes.
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    out,
  ]);
  console.log(`${fmt.name}: wrote ${out}`);
}

await browser.close();
