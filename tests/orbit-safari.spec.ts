import { test, expect, type Page } from '@playwright/test'

type OrbitTelemetry = { draws: number; matrix: string; time: number; strength: number; dropFrames: boolean }

// Read the values actually submitted to WebGL, not only a DOM "running" flag.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as typeof window & { orbitTelemetry: OrbitTelemetry }
    state.orbitTelemetry = { draws: 0, matrix: '', time: 0, strength: 0, dropFrames: false }
    const locations = new WeakMap<WebGLUniformLocation, string>()
    const prototype = WebGL2RenderingContext.prototype
    const getUniformLocation = prototype.getUniformLocation
    prototype.getUniformLocation = function (program, name) {
      const location = getUniformLocation.call(this, program, name)
      if (location) locations.set(location, name)
      return location
    }
    const uniformMatrix4fv = prototype.uniformMatrix4fv
    prototype.uniformMatrix4fv = function (...args: Parameters<typeof uniformMatrix4fv>) {
      if (args[0] && locations.get(args[0]) === 'modelViewMatrix') state.orbitTelemetry.matrix = Array.from(args[2]).join(',')
      uniformMatrix4fv.apply(this, args)
    }
    const uniform1f = prototype.uniform1f
    prototype.uniform1f = function (location, value) {
      if (location && locations.get(location) === 'uTime') state.orbitTelemetry.time = value
      if (location && locations.get(location) === 'uStrength') state.orbitTelemetry.strength = value
      uniform1f.call(this, location, value)
    }
    const drawArrays = prototype.drawArrays
    prototype.drawArrays = function (...args) {
      state.orbitTelemetry.draws++
      drawArrays.apply(this, args)
    }
    const raf = window.requestAnimationFrame
    window.requestAnimationFrame = callback => raf(time => {
      if (!state.orbitTelemetry.dropFrames) callback(time)
    })
  })
})

async function telemetry(page: Page) {
  return page.evaluate(() => (window as typeof window & { orbitTelemetry: OrbitTelemetry }).orbitTelemetry)
}

async function openOrbit(page: Page) {
  await page.goto('/')
  await page.locator('.sculpture-stage').scrollIntoViewIfNeeded()
  await expect(page.locator('.sculpture-stage')).toHaveAttribute('data-state', 'ready')
}

test('starts and rotates even when Safari delays the visibility observer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 400 })
  await page.addInitScript(() => { IntersectionObserver.prototype.observe = function () {} })
  await openOrbit(page)
  const before = await telemetry(page)
  await expect.poll(async () => (await telemetry(page)).draws).toBeGreaterThan(before.draws + 4)
  await expect.poll(async () => (await telemetry(page)).matrix).not.toBe(before.matrix)
})

test('gentle mode rotates without deformation or touch swells', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openOrbit(page)
  const before = await telemetry(page)
  await expect.poll(async () => (await telemetry(page)).matrix).not.toBe(before.matrix)
  expect((await telemetry(page)).time).toBe(before.time)
  await page.locator('.sculpture-stage').dispatchEvent('pointermove', { pointerType: 'touch', clientX: 200, clientY: 300 })
  expect((await telemetry(page)).strength).toBe(0)
  await expect(page.locator('.hero-field button')).toHaveCount(0)
})

test('foregrounding replaces a callback discarded during Safari suspension', async ({ page }) => {
  await openOrbit(page)
  await page.evaluate(() => { (window as typeof window & { orbitTelemetry: OrbitTelemetry }).orbitTelemetry.dropFrames = true })
  await page.waitForTimeout(150)
  const before = await telemetry(page)
  await page.evaluate(() => {
    (window as typeof window & { orbitTelemetry: OrbitTelemetry }).orbitTelemetry.dropFrames = false
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect.poll(async () => (await telemetry(page)).draws).toBeGreaterThan(before.draws + 4)
  await expect.poll(async () => (await telemetry(page)).matrix).not.toBe(before.matrix)
})

test('returning after pagehide works even without a pageshow event', async ({ page }) => {
  await openOrbit(page)
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })))
  const before = await telemetry(page)
  await page.waitForTimeout(150)
  expect((await telemetry(page)).draws).toBe(before.draws)
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect.poll(async () => (await telemetry(page)).draws).toBeGreaterThan(before.draws + 4)
})

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`WebGL failure retains a moving fallback (${reducedMotion})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion })
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (...args: Parameters<typeof original>) {
        if (String(args[0]).startsWith('webgl')) return null
        return original.apply(this, args)
      } as typeof original
    })
    await page.goto('/')
    const stage = page.locator('.sculpture-stage')
    await stage.scrollIntoViewIfNeeded()
    await expect(stage).toHaveAttribute('data-state', 'fallback')
    const fallback = page.locator('.sculpture-fallback')
    const transform = await fallback.evaluate(el => getComputedStyle(el).transform)
    await expect.poll(() => fallback.evaluate(el => getComputedStyle(el).transform)).not.toBe(transform)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.locator('#contact').scrollIntoViewIfNeeded()
    await expect.poll(() => fallback.evaluate(el => getComputedStyle(el).animationPlayState)).toBe('paused')
  })
}
