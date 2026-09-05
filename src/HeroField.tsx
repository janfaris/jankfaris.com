import { useEffect, useRef, useState } from 'react'
import type { Lang } from './content'

const labels = {
  en: { title: 'Orbit', hint: 'Move or touch to explore', pause: 'Pause sculpture', play: 'Play sculpture' },
  es: { title: 'Órbita', hint: 'Mueve o toca para explorar', pause: 'Pausar escultura', play: 'Animar escultura' },
}

/** A single GPU-deformed orbital ribbon. No textures or postprocessing.
 * Native scroll stays in charge on touch screens. A static SVG is always
 * available during loading, context loss, and on devices without WebGL2. */
export function HeroField({ lang = 'en', interactive = true }: { lang?: Lang; interactive?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const controller = useRef<{ pause: (value: boolean) => void } | null>(null)
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const preferences = useRef({ paused })
  const text = labels[lang]

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    let disposed = false
    let cleanup = () => {}
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
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
            vec3 darkInk = mix(vec3(.46, .50, .86), vec3(.82, .86, 1.0), clamp(vLight, 0.0, 1.0));
            vec3 lightInk = mix(vec3(.23, .24, .62), vec3(.43, .46, .80), clamp(vLight, 0.0, 1.0));
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
      let visible = false
      let lost = false
      let isPaused = preferences.current.paused
      let reduced = media.matches
      let elapsed = 0
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
        group.rotation.set(-.3 + tilt.y * .16, -.3 + tilt.x * .25 + Math.sin(elapsed * .14) * .16, -.18)
      }
      const frame = (now: number) => {
        if (!running) return
        raf = requestAnimationFrame(frame)
        // Phones stay at 30fps; desktop caps at 60fps even on ProMotion displays.
        const interval = mobile ? 1000 / 30 : 1000 / 60
        if (now - last < interval - 1) return
        const dt = Math.min((now - last) / 1000, .05)
        last = now
        elapsed += dt
        const ease = 1 - Math.exp(-dt * 4.5)
        uniforms.uTime.value = elapsed
        uniforms.uPointer.value.lerp(pointer, ease)
        const strength = inside || elapsed - lastTouch < 1 ? 1 : 0
        uniforms.uStrength.value += (strength - uniforms.uStrength.value) * ease
        tilt.lerp(inside ? pointer : origin, ease * .5)
        setPose()
        render()
      }
      const sync = () => {
        const next = visible && !document.hidden && !lost && !isPaused && !disposed
        host.dataset.motion = next ? 'running' : 'paused'
        if (next === running) return
        running = next
        if (running) { last = performance.now(); raf = requestAnimationFrame(frame) }
        else cancelAnimationFrame(raf)
      }
      controller.current = {
        pause(value) { isPaused = value; inside = false; sync() },
      }
      const resize = () => {
        const w = host.clientWidth, h = host.clientHeight
        if (!w || !h) return
        const ratio = Math.min(window.devicePixelRatio || 1, mobile ? 1.35 : 1.75)
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
        if (isPaused || reduced) return
        const rect = host.getBoundingClientRect()
        pointer.set(((event.clientX - rect.left) / rect.width - .5) * 4.8, (.5 - (event.clientY - rect.top) / rect.height) * 4.8)
        inside = true
        if (event.pointerType !== 'mouse') lastTouch = elapsed
      }
      const release = () => { inside = false }
      const onMotion = () => {
        reduced = media.matches
        isPaused = reduced
        preferences.current.paused = reduced
        setPaused(reduced)
        if (reduced) {
          uniforms.uStrength.value = 0
          tilt.set(0, 0)
          setPose()
          render()
        }
        sync()
      }
      const onLost = (event: Event) => {
        event.preventDefault()
        lost = true
        host.dataset.state = 'fallback'
        sync()
      }
      // Three.js restores its own GPU resources first. Keep the renderer alive
      // so its restoration listener survives; never dispose inside contextlost.
      const onRestored = () => { lost = false; resize(); sync() }
      const onPageHide = () => { visible = false; sync() }
      const onPageShow = () => {
        const rect = host.getBoundingClientRect()
        visible = rect.bottom > 0 && rect.top < window.innerHeight
        resize()
        sync()
      }
      const resizeObserver = new ResizeObserver(resize)
      const intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() })
      const themeObserver = new MutationObserver(updateTheme)
      resizeObserver.observe(host)
      intersectionObserver.observe(host)
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
      document.addEventListener('visibilitychange', sync)
      media.addEventListener('change', onMotion)
      canvas.addEventListener('webglcontextlost', onLost)
      canvas.addEventListener('webglcontextrestored', onRestored)
      window.addEventListener('pagehide', onPageHide)
      window.addEventListener('pageshow', onPageShow)
      host.addEventListener('pointermove', onPointer, { passive: true })
      host.addEventListener('pointerdown', onPointer, { passive: true })
      host.addEventListener('pointerleave', release)
      host.addEventListener('pointerup', release)
      host.addEventListener('pointercancel', release)
      updateTheme()
      setPose()
      resize()
      cleanup = () => {
        running = false
        cancelAnimationFrame(raf)
        controller.current = null
        resizeObserver.disconnect()
        intersectionObserver.disconnect()
        themeObserver.disconnect()
        document.removeEventListener('visibilitychange', sync)
        media.removeEventListener('change', onMotion)
        canvas.removeEventListener('webglcontextlost', onLost)
        canvas.removeEventListener('webglcontextrestored', onRestored)
        window.removeEventListener('pagehide', onPageHide)
        window.removeEventListener('pageshow', onPageShow)
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
    }
    void initialize().catch(() => { if (!disposed) host.dataset.state = 'fallback' })
    return () => { disposed = true; cleanup() }
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
            <button className="sculpture-pause" type="button" aria-label={paused ? text.play : text.pause} aria-pressed={paused}
              onClick={() => { preferences.current.paused = !paused; setPaused(!paused); controller.current?.pause(!paused) }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                {paused ? <path d="M3 1.5 10 6 3 10.5Z" /> : <path d="M2 1h3v10H2zm5 0h3v10H7z" />}
              </svg>
            </button>
        </div>
      )}
    </div>
  )
}
