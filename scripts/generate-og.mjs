// Capture the real hero as a social card; start the site before running this.
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'

const browser = await chromium.launch({ channel: 'chrome' })
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  await page.goto(process.env.PORTFOLIO_BASE_URL || 'http://127.0.0.1:5188')
  await page.locator('.sculpture-stage[data-state="ready"]').waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => document.documentElement.classList.remove('light'))
  await page.addStyleTag({ content: `
    .topbar, .mobile-dock, .hero-foot, .hero-cta, .sculpture-caption,
    main > :not(.hero), .skip-link { display: none !important; }
    .app { padding: 40px 0 0; min-height: 630px; }
    .container { padding: 0 58px; max-width: none; }
    .hero { padding: 0; }
    .hero-composition { padding: 46px 0 0; grid-template-columns: 1.2fr 1fr; gap: 24px; }
    .hero-current { font-size: 14px; margin-bottom: 24px; }
    .hero-status-line { font-size: 11px; }
    .display { font-size: 100px; }
    .hero-lede { font-size: 20px; max-width: 40ch; line-height: 1.5; margin-top: 28px; }
    .sculpture-stage { height: 405px; }
  ` })
  await page.screenshot({ path: fileURLToPath(new URL('../public/og-image.png', import.meta.url)), animations: 'disabled' })
} finally {
  await browser.close()
}
