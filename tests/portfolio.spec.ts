import { test, expect, type Page } from '@playwright/test'

async function ready(page: Page, path = '/') {
  await page.goto(path)
  await expect(page.locator('.sculpture-stage')).toHaveAttribute('data-state', 'ready')
  await page.evaluate(() => document.fonts.ready)
}

// Observe real GPU submissions. Cropped screenshots also capture fixed UI and
// compositor scrolling, which can change while the sculpture is fully paused.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as typeof window & { sculptureDraws: number }
    state.sculptureDraws = 0
    const drawArrays = WebGL2RenderingContext.prototype.drawArrays
    WebGL2RenderingContext.prototype.drawArrays = function (...args) {
      if (this.canvas instanceof HTMLCanvasElement && this.canvas.classList.contains('hero-field-canvas')) state.sculptureDraws++
      return drawArrays.apply(this, args)
    }
  })
})

async function renderedFrames(page: Page) {
  return page.evaluate(() => (window as typeof window & { sculptureDraws: number }).sculptureDraws)
}

test('current role is consistent in both languages and resumes', async ({ page }) => {
  for (const path of ['/', '/es', '/resume', '/es/resume']) {
    await ready(page, path)
    const content = await page.locator('body').innerText()
    expect(content).toContain('Cencora')
    expect(content).toContain('Lead AI Engineer')
    expect(content).not.toMatch(/open to (work|remote roles)|looking for (my |the )?next full-time|buscando mi próximo|contrátame|disponible para roles/i)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
})

test('Orbit starts automatically and continues without playback controls', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await ready(page)
  await page.locator('.sculpture-stage').scrollIntoViewIfNeeded()
  await expect(page.locator('.sculpture-stage')).toHaveAttribute('data-motion', 'running')
  await expect(page.locator('.hero-field button')).toHaveCount(0)
  const orbit = await renderedFrames(page)
  expect(orbit).toBeGreaterThan(0)
  await expect.poll(() => renderedFrames(page)).toBeGreaterThan(orbit + 10)
  expect(errors).toEqual([])
})

test('reduced motion keeps gentle rotation and reacts to preference changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await ready(page)
  await page.locator('.sculpture-stage').scrollIntoViewIfNeeded()
  await expect(page.locator('.hero-field button')).toHaveCount(0)
  const before = await renderedFrames(page)
  expect(before).toBeGreaterThan(0)
  await expect(page.locator('.sculpture-stage')).toHaveAttribute('data-motion-mode', 'gentle')
  await expect.poll(() => renderedFrames(page)).toBeGreaterThan(before)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(page.locator('.sculpture-stage')).toHaveAttribute('data-motion', 'running')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.sculpture-stage')).toHaveAttribute('data-motion', 'running')
  await expect(page.locator('.sculpture-stage')).toHaveAttribute('data-motion-mode', 'gentle')
})

test('suspends offscreen and does not restart offscreen on tab return', async ({ page }) => {
  await ready(page)
  await page.locator('#contact').scrollIntoViewIfNeeded()
  await expect(page.locator('.sculpture-stage')).toHaveAttribute('data-motion', 'paused')
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect(page.locator('.sculpture-stage')).toHaveAttribute('data-motion', 'paused')
  await page.locator('.sculpture-stage').scrollIntoViewIfNeeded()
  await expect(page.locator('.sculpture-stage')).toHaveAttribute('data-motion', 'running')
})

test('restores the actual WebGL context and automatically resumes', async ({ page }) => {
  await ready(page)
  await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('.hero-field-canvas')!
    const gl = canvas.getContext('webgl2')!
    const extension = gl.getExtension('WEBGL_lose_context')!
    extension.loseContext()
    // Retain the extension across loss. Querying a lost context returns null.
    setTimeout(() => extension.restoreContext(), 450)
  })
  await expect(page.locator('.sculpture-stage')).toHaveAttribute('data-state', 'fallback')
  await expect(page.locator('.sculpture-stage')).toHaveAttribute('data-state', 'ready')
  await page.locator('.sculpture-stage').scrollIntoViewIfNeeded()
  const before = await renderedFrames(page)
  await expect.poll(() => renderedFrames(page)).toBeGreaterThan(before)
})

test('WebGL unavailable keeps readable content, art, and navigation', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (...args: Parameters<typeof original>) {
      if (String(args[0]).startsWith('webgl')) return null
      return original.apply(this, args)
    } as typeof original
  })
  await page.goto('/')
  await expect(page.locator('.sculpture-stage')).toHaveAttribute('data-state', 'fallback')
  await expect(page.locator('.sculpture-fallback')).toBeVisible()
  await expect(page.locator('.sculpture-fallback ellipse')).toHaveCount(22)
  await page.getByRole('link', { name: 'My background' }).click()
  await expect(page).toHaveURL(/\/resume$/)
  await expect(page.getByRole('heading', { name: 'Jan Faris' })).toBeVisible()
})

test('portrait, landscape, narrow phones, and both themes retain artwork and readable layout', async ({ page }) => {
  await ready(page)
  for (const [width, height] of [[320, 740], [390, 844], [844, 390], [768, 1024], [1440, 1000]]) {
    await page.setViewportSize({ width, height })
    for (const theme of ['dark', 'light']) {
      await page.evaluate(theme => {
        document.documentElement.classList.toggle('light', theme === 'light')
      }, theme)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      const stage = await page.locator('.sculpture-stage').boundingBox()
      const lede = await page.locator('.hero-lede').boundingBox()
      expect(stage).toBeTruthy()
      expect(lede).toBeTruthy()
      const overlapping = stage!.x < lede!.x + lede!.width && stage!.x + stage!.width > lede!.x && stage!.y < lede!.y + lede!.height && stage!.y + stage!.height > lede!.y
      expect(overlapping, JSON.stringify({ width, height, stage, lede })).toBe(false)
    }
  }
})

test('touch can change the sculpture and scroll remains native', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Touch interaction only')
  await ready(page)
  await page.locator('.sculpture-stage').tap()
  expect(await page.locator('.sculpture-stage').evaluate(el => getComputedStyle(el).touchAction)).toBe('pan-y pinch-zoom')
  const cancelled = await page.locator('.sculpture-stage').evaluate(el => !el.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'touch', clientX: 160, clientY: 410, bubbles: true, cancelable: true })))
  expect(cancelled).toBe(false)
  await page.getByRole('link', { name: 'Explore my work' }).click()
  await expect(page).toHaveURL(/#work$/)
  await expect(page.getByRole('heading', { name: 'Selected Work', exact: true })).toBeInViewport()
})


test('project videos respect visibility and live reduced-motion changes', async ({ page }) => {
  await ready(page)
  const preview = page.locator('video').first()
  await expect.poll(() => preview.evaluate(video => (video as HTMLVideoElement).paused)).toBe(true)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await preview.scrollIntoViewIfNeeded()
  await expect.poll(() => preview.evaluate(video => (video as HTMLVideoElement).paused)).toBe(true)
  await expect(preview).toHaveAttribute('playsinline', '')
  await expect(preview).toHaveAttribute('poster', /\.jpg$/)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect.poll(() => preview.evaluate(video => (video as HTMLVideoElement).paused), { timeout: 15000 }).toBe(false)
  await page.locator('#contact').scrollIntoViewIfNeeded()
  await expect.poll(() => preview.evaluate(video => (video as HTMLVideoElement).paused)).toBe(true)
})
