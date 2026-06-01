import { useEffect, useRef } from 'react'

/**
 * Lightweight Canvas2D "signal" animation. Runs on every device (including
 * iOS Safari / Chrome / in-app webviews) with no WebGL or heavy bundle.
 * Time-delta based so it degrades gracefully under Low Power Mode throttling,
 * and pauses/resumes on visibility change instead of freezing.
 */
export function HeroSignal() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = 1

    const resize = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w === 0 || h === 0) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = w
      height = h
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    let cleanupResize = () => {}
    const ResizeObserverCtor = (window as Window & { ResizeObserver?: typeof ResizeObserver }).ResizeObserver
    if (typeof ResizeObserverCtor === 'function') {
      const ro = new ResizeObserverCtor(resize)
      ro.observe(canvas)
      cleanupResize = () => ro.disconnect()
    } else {
      window.addEventListener('resize', resize)
      cleanupResize = () => window.removeEventListener('resize', resize)
    }

    const pointer = { x: 0, y: 0 }
    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX / window.innerWidth - 0.5
      pointer.y = event.clientY / window.innerHeight - 0.5
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })

    // Orbiting nodes: orbit radius factor, angular speed, size, color, phase.
    const nodes = [
      { r: 0.34, speed: 0.45, size: 5.5, color: '#f6a728', phase: 0 },
      { r: 0.34, speed: 0.45, size: 3.5, color: '#3346d3', phase: Math.PI },
      { r: 0.5, speed: -0.3, size: 4.5, color: '#1b9aaa', phase: 1.1 },
      { r: 0.5, speed: -0.3, size: 3, color: '#f6a728', phase: 1.1 + Math.PI },
      { r: 0.64, speed: 0.22, size: 3.5, color: '#273dba', phase: 2.4 },
    ]

    let elapsed = 0
    let lastTs = 0
    let frameId = 0
    let running = true

    const draw = () => {
      const cx = width / 2
      const cy = height * 0.46
      const base = Math.min(width, height)
      const tilt = pointer.y * 0.12
      const swing = pointer.x * 0.4

      ctx.clearRect(0, 0, width, height)

      const rings = [
        { rf: 0.34, color: 'rgba(246, 167, 40, 0.55)', w: 1.4 },
        { rf: 0.5, color: 'rgba(27, 154, 170, 0.38)', w: 1.2 },
        { rf: 0.64, color: 'rgba(51, 70, 211, 0.26)', w: 1 },
      ]
      for (const ring of rings) {
        const rr = base * ring.rf
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(swing * 0.15)
        ctx.scale(1, 0.46 + tilt)
        ctx.beginPath()
        ctx.arc(0, 0, rr, 0, Math.PI * 2)
        ctx.strokeStyle = ring.color
        ctx.lineWidth = ring.w
        ctx.stroke()
        ctx.restore()
      }

      const pulse = 1 + Math.sin(elapsed * 1.6) * 0.06
      const coreR = base * 0.12 * pulse
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR)
      grad.addColorStop(0, 'rgba(253, 248, 238, 0.95)')
      grad.addColorStop(0.6, 'rgba(246, 167, 40, 0.35)')
      grad.addColorStop(1, 'rgba(246, 167, 40, 0)')
      ctx.beginPath()
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      ctx.beginPath()
      ctx.arc(cx, cy, base * 0.055, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(253, 248, 238, 0.92)'
      ctx.fill()

      for (const node of nodes) {
        const ang = node.phase + elapsed * node.speed + swing
        const rr = base * node.r
        const nx = cx + Math.cos(ang) * rr
        const ny = cy + Math.sin(ang) * rr * (0.46 + tilt)

        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(nx, ny)
        ctx.strokeStyle = 'rgba(51, 70, 211, 0.12)'
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(nx, ny, node.size, 0, Math.PI * 2)
        ctx.fillStyle = node.color
        ctx.fill()
      }
    }

    const loop = (ts: number) => {
      if (!running) return
      if (lastTs === 0) lastTs = ts
      // Cap delta so a resumed tab doesn't jump the animation forward.
      const dt = Math.min((ts - lastTs) / 1000, 0.05)
      lastTs = ts
      elapsed += dt
      draw()
      frameId = window.requestAnimationFrame(loop)
    }
    frameId = window.requestAnimationFrame(loop)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (!running) {
          running = true
          lastTs = 0
          frameId = window.requestAnimationFrame(loop)
        }
      } else {
        running = false
        window.cancelAnimationFrame(frameId)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      running = false
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('visibilitychange', onVisibility)
      cleanupResize()
    }
  }, [])

  return (
    <div className="signal-stage" aria-hidden="true">
      <div className="signal-fallback">
        <span className="signal-orbit signal-orbit-one" />
        <span className="signal-orbit signal-orbit-two" />
        <span className="signal-core" />
        <span className="signal-node signal-node-one" />
        <span className="signal-node signal-node-two" />
        <span className="signal-node signal-node-three" />
      </div>
      <canvas ref={canvasRef} className="signal-canvas" />
    </div>
  )
}
