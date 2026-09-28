import type { BayInput } from './input'

type Mark = { x: number; y: number; t: number; s: number }

function glowSprite(r: number, g: number, b: number) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const context = canvas.getContext('2d')
  if (context) {
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`)
    gradient.addColorStop(.22, `rgba(${r}, ${g}, ${b}, .6)`)
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
    context.fillStyle = gradient
    context.fillRect(0, 0, 64, 64)
  }
  return canvas
}

/**
 * The bay without WebGL: the same glowing water drawn with Canvas 2D, for
 * devices where WebGL is missing, disabled, or fails. It reads the same shared
 * input as the WebGL scene: pointer and touch wakes, taps, scroll, and the
 * page's dim and boost targets.
 */
export function startBay2D(canvas: HTMLCanvasElement, input: BayInput, reduced: boolean) {
  const context = canvas.getContext('2d')
  if (!context) return () => undefined
  const compact = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches
  const count = compact ? 700 : 1400
  const sprites = { deep: glowSprite(40, 95, 190), cyan: glowSprite(90, 215, 255), white: glowSprite(225, 250, 255) }
  const across = new Float32Array(count)
  const depth = new Float32Array(count)
  const phase = new Float32Array(count)
  const size = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    across[i] = Math.random() * 2.4 - 1.2
    depth[i] = Math.pow(Math.random(), .75)
    phase[i] = Math.random() * Math.PI * 2
    size[i] = .6 + Math.random() * Math.random() * 1.8
  }
  const stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), p: Math.random() * 6 }))
  const trail: Mark[] = []
  const ripples: Mark[] = []
  let width = 1
  let height = 1
  let ratio = 1
  let horizon = 0
  let background: CanvasGradient | null = null
  const resize = () => {
    ratio = Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 1.75)
    width = canvas.clientWidth || window.innerWidth
    height = canvas.clientHeight || window.innerHeight
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    horizon = height * (width / height < .8 ? .22 : .34)
    background = context.createLinearGradient(0, 0, 0, height)
    background.addColorStop(0, '#03060d')
    background.addColorStop(horizon / height, '#0a1627')
    background.addColorStop(Math.min(1, horizon / height + .02), '#071222')
    background.addColorStop(1, '#02060c')
  }
  resize()
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)

  const start = performance.now()
  let lastTrail = { x: -1e4, y: -1e4, t: 0 }
  let lastSwim = 0
  let lastWake = 0
  let nextDrop = 2.5
  let frame = 0
  let lastFrameAt = performance.now()

  const draw = (now: number) => {
    const time = (now - start) / 1000
    const bright = (1 - input.targets.dim * .5) * (1 + input.targets.boost * .7)
    const idle = performance.now() - input.pointer.lastMove > 2500
    const toScreen = (x: number, y: number) => ({ x: (x + 1) / 2 * width, y: (1 - y) / 2 * height })
    const inWater = (a: number, b: number) => ({ x: width / 2 + a * width * .42, y: horizon + (height - horizon) * b })

    if (!reduced) {
      if (input.pointer.moved) {
        input.pointer.moved = false
        const point = toScreen(input.pointer.x, input.pointer.y)
        const travelled = Math.hypot(point.x - lastTrail.x, point.y - lastTrail.y)
        if (point.y > horizon && (travelled > 8 || time - lastTrail.t > .12)) {
          trail.push({ ...point, t: time, s: Math.min(1, .45 + travelled / 120) })
          lastTrail = { ...point, t: time }
        }
      }
      for (const splash of input.splashes.splice(0)) {
        const point = toScreen(splash.x, splash.y)
        ripples.push({ ...point, t: time, s: splash.strength })
        trail.push({ ...point, t: time, s: splash.strength })
      }
      if (time - lastSwim > .08) {
        lastSwim = time
        const strength = idle ? .6 : .25
        trail.push({ ...inWater(Math.sin(time * .31) * .95, .45 + Math.sin(time * .47 + 1.3) * .3), t: time, s: strength })
        trail.push({ ...inWater(Math.cos(time * .23 + 2.1) * .85, .3 + Math.sin(time * .19) * .22), t: time, s: strength * .8 })
      }
      const speed = Math.min(Math.abs(input.velocity.value) / 2600, 1)
      input.velocity.value *= .92
      if (speed > .12 && time - lastWake > .06) {
        lastWake = time
        trail.push({ ...inWater(Math.random() * 2 - 1, .55 + Math.random() * .4), t: time, s: .35 + speed * .7 })
      }
      if (idle && time > nextDrop) {
        nextDrop = time + 2.4 + Math.random() * 2.2
        ripples.push({ ...inWater(Math.random() * 1.6 - .8, .15 + Math.random() * .75), t: time, s: .85 })
      }
      while (trail.length > 30 || (trail[0] && time - trail[0].t > 2.6)) trail.shift()
      while (ripples.length > 6 || (ripples[0] && time - ripples[0].t > 4)) ripples.shift()
    }

    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.globalCompositeOperation = 'source-over'
    context.globalAlpha = 1
    context.fillStyle = background ?? '#02060c'
    context.fillRect(0, 0, width, height)
    context.globalCompositeOperation = 'lighter'
    for (const star of stars) {
      const y = star.y * horizon * .95
      context.globalAlpha = (.25 + .2 * Math.sin(time * 1.3 + star.p)) * bright
      context.drawImage(sprites.white, star.x * width - 1.5, y - 1.5, 3, 3)
    }
    for (let i = 0; i < count; i++) {
      const d = depth[i]
      const scale = .35 + 1.25 * d
      let x = width / 2 + (across[i] + Math.sin(time * .35 + phase[i]) * .02) * width * .5 * (.3 + .9 * d)
      let y = horizon + (height - horizon) * Math.pow(d, 1.35) + Math.sin(time * .8 + phase[i]) * 1.5 * scale
      let glow = Math.pow(Math.max(0, Math.sin(time * (.4 + size[i] * .5) + phase[i] * 13)), 24) * .8
      for (const mark of trail) {
        const age = time - mark.t
        const radius = (26 + age * 60) * scale
        const dx = x - mark.x
        const dy = (y - mark.y) * 1.8
        const f = mark.s * Math.exp(-(dx * dx + dy * dy) / (radius * radius)) * Math.exp(-age * 1.5)
        if (f < .01) continue
        glow += f
        const length = Math.hypot(dx, dy) || 1
        x += dx / length * f * 6 * scale
        y += dy / length * f * 3 * scale
      }
      for (const ring of ripples) {
        const age = time - ring.t
        const distance = Math.hypot(x - ring.x, (y - ring.y) * 1.8)
        glow += Math.exp(-Math.pow((distance - age * 170 * scale) / (16 * scale), 2)) * Math.exp(-age * .9) * ring.s * 1.2
      }
      const radius = size[i] * scale * (2.2 + Math.min(glow, 2) * 1.6)
      context.globalAlpha = Math.min(1, (.16 + glow * .85) * bright * (.45 + .55 * d))
      context.drawImage(glow > 1.1 ? sprites.white : glow > .25 ? sprites.cyan : sprites.deep, x - radius, y - radius, radius * 2, radius * 2)
    }
  }

  const loop = (now: number) => {
    lastFrameAt = performance.now()
    draw(now)
    frame = requestAnimationFrame(loop)
  }
  // Same resilience as the WebGL scene: re-arm if Safari drops a frame callback.
  const restart = () => {
    if (reduced || document.hidden) return
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(loop)
  }
  const watchdog = window.setInterval(() => { if (!reduced && !document.hidden && performance.now() - lastFrameAt > 1500) restart() }, 1000)
  if (reduced) draw(start + 6000)
  else frame = requestAnimationFrame(loop)
  const redrawStill = () => { if (reduced) draw(start + 6000) }
  window.addEventListener('pageshow', restart)
  window.addEventListener('focus', restart)
  window.addEventListener('resize', redrawStill)
  document.addEventListener('visibilitychange', restart)

  return () => {
    cancelAnimationFrame(frame)
    window.clearInterval(watchdog)
    observer.disconnect()
    window.removeEventListener('pageshow', restart)
    window.removeEventListener('focus', restart)
    window.removeEventListener('resize', redrawStill)
    document.removeEventListener('visibilitychange', restart)
  }
}
