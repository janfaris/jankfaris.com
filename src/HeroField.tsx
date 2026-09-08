import { useEffect, useRef } from 'react'
import type { Lang } from './content'

const labels = {
  en: { title: 'Orbit', hint: 'Move or touch to explore' },
  es: { title: 'Órbita', hint: 'Mueve o toca para explorar' },
}

/** A single GPU-deformed orbital ribbon. No textures or postprocessing.
 * Native scroll stays in charge on touch screens. An animated SVG covers
 * loading, context loss, and devices without WebGL2. */
export function HeroField({ lang = 'en', interactive = true }: { lang?: Lang; interactive?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const text = labels[lang]

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    let disposed = false
    let cleanup = () => {}
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduced = media.matches
    let active = false
    let pageAway = false
    let syncScene = (_restart = false) => { void _restart }
    let resizeScene = () => {}
    let resetInteraction = () => {}

    // A visibility observer is an optimization, not permission to start.
    // Safari can delay it while scrolling or restoring a suspended page.
    const refreshPlayback = (restart = false) => {
      if (disposed) return
      const rect = host.getBoundingClientRect()
      const viewport = window.visualViewport
      const top = viewport?.offsetTop ?? 0
      const left = viewport?.offsetLeft ?? 0
      const inView = rect.width > 0 && rect.height > 0 &&
        rect.bottom > top && rect.top < top + (viewport?.height ?? window.innerHeight) &&
        rect.right > left && rect.left < left + (viewport?.width ?? window.innerWidth)
      active = inView && !document.hidden && !pageAway
      host.dataset.motion = active ? 'running' : 'paused'
      host.dataset.motionMode = reduced ? 'gentle' : 'full'
      syncScene(restart)
    }
    const onScroll = () => refreshPlayback()
    const onResize = () => { resizeScene(); refreshPlayback() }
    const onVisibility = () => {
      if (!document.hidden) pageAway = false
      refreshPlayback(true)
    }
    const onPageHide = () => { pageAway = true; refreshPlayback(true) }
    const onPageShow = () => { pageAway = false; resizeScene(); refreshPlayback(true) }
    const onMotion = () => {
      reduced = media.matches
      resetInteraction()
      refreshPlayback()
    }
    const intersectionObserver = new IntersectionObserver(() => refreshPlayback())
    const resizeObserver = new ResizeObserver(onResize)
    intersectionObserver.observe(host)
    resizeObserver.observe(host)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('focus', onPageShow)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    window.visualViewport?.addEventListener('resize', onResize, { passive: true })
    window.visualViewport?.addEventListener('scroll', onScroll, { passive: true })
    media.addEventListener('change', onMotion)
    refreshPlayback()
    const initialize = async () => {
      const THREE = await import('three')
      if (disposed) return
      const mobile = window.matchMedia('(pointer: coarse)').matches || host.clientWidth < 420
      let renderer: InstanceType<typeof THREE.WebGLRenderer>
      try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'default' })
      } catch {
        host.dataset.state = 'fallback'
        return
      }
      renderer.setClearColor(0x000000, 0)
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40)
      camera.position.set(0, 0, 8.8)
      const group = new THREE.Group()
      scene.add(group)

      const columns = mobile ? 112 : 180
      const rows = mobile ? 36 : 60
      const positions = new Float32Array(columns * rows * 3)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
          const i = (r * columns + c) * 3
          positions[i] = c / (columns - 1)
          positions[i + 1] = r / (rows - 1)
          positions[i + 2] = 0
        }
      }
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const uniforms = {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2() }, uStrength: { value: 0 },
        uPixelRatio: { value: 1 }, uLight: { value: 0 }, uLine: { value: 0 },
      }
      const vertexShader = /* glsl */ `
        uniform float uTime;
        uniform vec2 uPointer;
        uniform float uStrength;
        uniform float uPixelRatio;
        varying float vLight;
        varying float vDepth;
        const float PI = 3.14159265359;
        void main() {
          float u = position.x;
          float v = position.y;
          float a = u * PI * 2.0;
          float b = v * PI * 2.0;
          float t = uTime;
          // Twisted elliptical ribbon: continuous threads with a breathing core.
          float twist = a * 1.5 + t * .16;
          float band = cos(b) * .62;
          float thickness = sin(b) * .13;
          float radius = 1.42 + band * cos(twist) - thickness * sin(twist);
          vec3 orbit = vec3(cos(a) * radius, sin(a) * radius,
            band * sin(twist) + thickness * cos(twist));
          orbit.x *= 1.12;
          orbit.z += sin(a * 2.0 + t * .25) * .22;
          vec3 p = orbit;
          float distanceToPointer = length(p.xy - uPointer);
          float influence = exp(-distanceToPointer * distanceToPointer * 1.4) * uStrength;
          p.z += influence * .5;
          p.xy += (p.xy - uPointer) * influence * .12;
          float travellingLight = pow(.5 + .5 * cos(a * 2.0 - t * .65 + b * .15), 8.0);
          vLight = .25 + .25 * sin(a * 2.0 + b - t * .4) + travellingLight * .6 + influence * .65;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vDepth = 1.0 - smoothstep(6.0, 11.0, -mv.z);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp((1.9 + vLight * .95) * uPixelRatio * 8.0 / -mv.z, 1.0, 5.0);
        }
      `
      const material = new THREE.ShaderMaterial({
        uniforms, vertexShader, transparent: true, depthTest: false, depthWrite: false,
        fragmentShader: /* glsl */ `
          uniform float uLight;
          uniform float uLine;
          varying float vLight;
          varying float vDepth;
          void main() {
            float alpha = 1.0;
            if (uLine < .5) {
              float d = length(gl_PointCoord - .5);
              alpha = 1.0 - smoothstep(.26, .5, d);
            }
            vec3 darkInk = mix(vec3(.27, .60, .94), vec3(.76, .90, 1.0), clamp(vLight, 0.0, 1.0));
            vec3 lightInk = mix(vec3(.08, .35, .70), vec3(.25, .54, .85), clamp(vLight, 0.0, 1.0));
            vec3 color = mix(darkInk, lightInk, uLight);
            gl_FragColor = vec4(color, alpha * mix(.55 + vDepth * .38, .16 + vDepth * .15, uLine));
          }
        `,
      })
      const points = new THREE.Points(geometry, material)
      points.frustumCulled = false // CPU positions are UVs; the shader owns the bounds.
      group.add(points)
      // Sparse contour threads add shape and depth without a heavy bloom pass.
      const indices: number[] = []
      for (let r = 0; r < rows; r += 4) {
        for (let c = 0; c < columns - 1; c++) {
          indices.push(r * columns + c, r * columns + c + 1)
        }
      }
      const linesGeometry = new THREE.BufferGeometry()
      linesGeometry.setAttribute('position', geometry.getAttribute('position'))
      linesGeometry.setIndex(indices)
      const lineMaterial = material.clone()
      lineMaterial.uniforms = { ...uniforms, uLine: { value: 1 } }
      const lines = new THREE.LineSegments(linesGeometry, lineMaterial)
      lines.frustumCulled = false
      group.add(lines)

      let raf = 0
      let running = false
      let lost = false
      let elapsed = 0
      let turn = 0
      let last = 0
      let inside = false
      let lastTouch = -10
      const pointer = new THREE.Vector2()
      const origin = new THREE.Vector2()
      const tilt = new THREE.Vector2()
      const render = () => {
        if (disposed || lost || renderer.getContext().isContextLost()) return
        renderer.render(scene, camera)
        host.dataset.state = 'ready'
      }
      const setPose = () => {
        group.rotation.set(-.3 + tilt.y * .16, -.3 + tilt.x * .25 + turn, -.18)
      }
      const frame = (now: number) => {
        if (!running) return
        raf = requestAnimationFrame(frame)
        // Phones stay at 30fps; desktop caps at 60fps even on ProMotion displays.
        const interval = mobile ? 1000 / 30 : 1000 / 60
        if (now - last < interval - 1) return
        const dt = Math.min((now - last) / 1000, .1)
        last = now
        // Gentle mode keeps the requested automatic rotation, but removes
        // deformation and touch swells and halves the turning speed.
        elapsed += reduced ? 0 : dt
        turn = (turn + dt * .18 * (reduced ? .5 : 1)) % (Math.PI * 2)
        const ease = 1 - Math.exp(-dt * 4.5)
        uniforms.uTime.value = elapsed
        uniforms.uPointer.value.lerp(pointer, ease)
        const strength = inside || elapsed - lastTouch < 1 ? 1 : 0
        uniforms.uStrength.value += (strength - uniforms.uStrength.value) * ease
        tilt.lerp(inside ? pointer : origin, ease * .5)
        setPose()
        render()
      }
      const sync = (restart = false) => {
        const next = active && !lost && !disposed
        // Safari may discard a pending callback during suspension. On wake,
        // replace it even if our last known state was already "running".
        if (restart) { cancelAnimationFrame(raf); running = false }
        if (next === running) return
        running = next
        if (running) { last = performance.now(); raf = requestAnimationFrame(frame) }
        else cancelAnimationFrame(raf)
      }
      let sizedWidth = 0, sizedHeight = 0, sizedRatio = 0
      const resize = () => {
        const w = host.clientWidth, h = host.clientHeight
        if (!w || !h) return
        const ratio = Math.min(window.devicePixelRatio || 1, mobile ? 1.35 : 1.75)
        // Safari's toolbar resizes the visual viewport during scrolling even
        // when this canvas is unchanged. Avoid reallocating its GPU buffers.
        if (w === sizedWidth && h === sizedHeight && ratio === sizedRatio) return
        sizedWidth = w; sizedHeight = h; sizedRatio = ratio
        renderer.setPixelRatio(ratio)
        uniforms.uPixelRatio.value = ratio
        renderer.setSize(w, h, false)
        camera.aspect = w / h
        // Portrait phones retain the entire sculpture, including touch displacement.
        camera.position.z = camera.aspect < 1 ? 9.8 : 7.6
        camera.updateProjectionMatrix()
        render()
      }
      const updateTheme = () => {
        uniforms.uLight.value = document.documentElement.classList.contains('light') ? 1 : 0
        render()
      }
      const onPointer = (event: PointerEvent) => {
        if (reduced) return
        const rect = host.getBoundingClientRect()
        pointer.set(((event.clientX - rect.left) / rect.width - .5) * 4.8, (.5 - (event.clientY - rect.top) / rect.height) * 4.8)
        inside = true
        if (event.pointerType !== 'mouse') lastTouch = elapsed
      }
      const release = () => { inside = false }
      resetInteraction = () => {
        inside = false
        lastTouch = -10
        uniforms.uStrength.value = 0
        tilt.set(0, 0)
      }
      const onLost = (event: Event) => {
        event.preventDefault()
        lost = true
        host.dataset.state = 'fallback'
        sync()
      }
      // Three.js restores its own GPU resources first. Keep the renderer alive
      // so its restoration listener survives; never dispose inside contextlost.
      const onRestored = () => { lost = false; resize(); render(); refreshPlayback(true) }
      const themeObserver = new MutationObserver(updateTheme)
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
      canvas.addEventListener('webglcontextlost', onLost)
      canvas.addEventListener('webglcontextrestored', onRestored)
      host.addEventListener('pointermove', onPointer, { passive: true })
      host.addEventListener('pointerdown', onPointer, { passive: true })
      host.addEventListener('pointerleave', release)
      host.addEventListener('pointerup', release)
      host.addEventListener('pointercancel', release)
      syncScene = sync
      resizeScene = resize
      cleanup = () => {
        running = false
        cancelAnimationFrame(raf)
        themeObserver.disconnect()
        canvas.removeEventListener('webglcontextlost', onLost)
        canvas.removeEventListener('webglcontextrestored', onRestored)
        host.removeEventListener('pointermove', onPointer)
        host.removeEventListener('pointerdown', onPointer)
        host.removeEventListener('pointerleave', release)
        host.removeEventListener('pointerup', release)
        host.removeEventListener('pointercancel', release)
        geometry.dispose()
        linesGeometry.dispose()
        material.dispose()
        lineMaterial.dispose()
        renderer.dispose()
      }
      updateTheme()
      setPose()
      resize()
      refreshPlayback(true)
    }
    void initialize().catch(() => { if (!disposed) host.dataset.state = 'fallback' })
    return () => {
      disposed = true
      intersectionObserver.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('focus', onPageShow)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.visualViewport?.removeEventListener('resize', onResize)
      window.visualViewport?.removeEventListener('scroll', onScroll)
      media.removeEventListener('change', onMotion)
      cleanup()
    }
  }, [])

  return (
    <div className={`hero-field${interactive ? ' hero-field-interactive' : ''}`}>
      <div ref={hostRef} className="sculpture-stage" data-state="loading" aria-hidden="true">
        <svg className="sculpture-fallback" viewBox="0 0 480 400" fill="none">
          {Array.from({ length: 22 }, (_, i) => (
            <ellipse key={i} cx="240" cy="200" rx={108 + i * 1.5} ry={70 + i * 2.6}
              transform={`rotate(${i * 7 - 45} 240 200)`} stroke="currentColor" strokeWidth=".7" opacity={.2 + i / 50} />
          ))}
        </svg>
        <canvas ref={canvasRef} className="hero-field-canvas" />
      </div>
      {interactive && (
        <div className="sculpture-caption">
          <div className="sculpture-description"><span>{text.title}</span><span>{text.hint}</span></div>
        </div>
      )}
    </div>
  )
}
