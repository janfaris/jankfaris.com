import { test, expect } from '@playwright/test'

for (const lang of ['en', 'es']) {
  test(`every featured project stacks and stays readable on mobile (${lang})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(lang === 'es' ? '/es' : '/')
    await page.evaluate(() => document.fonts.ready)
    const projects = page.locator('.case-study')
    expect(await projects.count()).toBeGreaterThanOrEqual(2)
    for (const width of [320, 390, 440, 768, 980]) {
      await page.setViewportSize({ width, height: 844 })
      for (const project of await projects.all()) {
        const box = await project.boundingBox()
        const media = await project.locator('.case-media').boundingBox()
        const copy = await project.locator('.case-copy').boundingBox()
        expect(box).toBeTruthy()
        expect(media).toBeTruthy()
        expect(copy).toBeTruthy()
        const detail = `${width}px: ${await project.locator('h3').innerText()}`
        expect(copy!.y, detail).toBeGreaterThanOrEqual(media!.y + media!.height + 20)
        expect(copy!.width, detail).toBeGreaterThanOrEqual(Math.min(box!.width, 680) - 1)
        // Global overflow clipping can hide a broken grid, so check each child.
        for (const child of await project.locator('.case-media, .case-copy, .case-name, .case-summary, .case-outcome, .case-footer').all()) {
          const bounds = await child.boundingBox()
          expect(bounds!.x, detail).toBeGreaterThanOrEqual(0)
          expect(bounds!.x + bounds!.width, detail).toBeLessThanOrEqual(width + 1)
        }
      }
    }
  })
}

test('desktop retains alternating wide project media', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  for (const width of [981, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    const projects = page.locator('.case-study')
    for (let index = 0; index < await projects.count(); index++) {
      const project = projects.nth(index)
      const media = (await project.locator('.case-media').boundingBox())!
      const copy = (await project.locator('.case-copy').boundingBox())!
      if (index % 2 === 0) expect(media.x + media.width).toBeLessThanOrEqual(copy.x)
      else expect(copy.x + copy.width).toBeLessThanOrEqual(media.x)
      expect(media.width).toBeGreaterThanOrEqual(copy.width - 1)
    }
  }
})
