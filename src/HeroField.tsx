import { useEffect, useRef } from 'react'

function isIOSDevice() {
  return (
    /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
  )
}

/**
 * Subtle indigo particle wave behind the hero, with a cursor ripple.
 * three.js is dynamically imported so it never blocks first paint.
 * iOS-safe: renderer creation is guarded, pixel ratio is capped, and the
 * scene remounts on WebGL context loss (Safari drops contexts aggressively).
 * With prefers-reduced-motion the wave renders one static frame instead.
 */
export function HeroField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let disposed = false
    let mountToken = 0
    let restoreTimer: ReturnType<typeof setTimeout> | null = null
    let cleanupScene = () => {}

    const mountScene = async () => {
      const token = ++mountToken
      cleanupScene()

      const THREE = await import('three')
      if (disposed || token !== mountToken) return

      const isIOS = isIOSDevice()
      const isMobile = window.innerWidth < 720 || window.matchMedia('(pointer: coarse)').matches
      const isPhoneLike = isIOS || isMobile

      let renderer: InstanceType<typeof THREE.WebGLRenderer>
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: false,
          depth: false,
          stencil: false,
          failIfMajorPerformanceCaveat: false,
          powerPreference: isPhoneLike ? 'default' : 'high-performance',
          preserveDrawingBuffer: false,
        })
      } catch (error) {
        console.warn('Hero wave could not start.', error)
        return
      }

      const maxPixelRatio = isIOS ? 1.25 : 1.5
      renderer.setClearColor(0x000000, 0)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio))

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
      camera.position.set(0, 2.2, 7)
      camera.lookAt(0, 0, 0)

      // Flat grid of points; the vertex shader lifts them into a moving wave.
      const COLS = isPhoneLike ? 70 : 90
      const ROWS = isPhoneLike ? 32 : 40
      const positions = new Float32Array(COLS * ROWS * 3)
      let i = 0
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          positions[i++] = (c / (COLS - 1) - 0.5) * 22 // x
          positions[i++] = 0                           // y (animated)
          positions[i++] = (r / (ROWS - 1) - 0.5) * 10 // z
        }
      }
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

      // Phones get a bolder, quicker wave: no hover ripple there, so the
      // ambient motion has to carry the effect on its own.
      const waveAmp = isPhoneLike ? 0.8 : 0.55
      const waveSpeed = isPhoneLike ? 1.5 : 1.0
      const uniforms = {
        uTime: { value: 0 },
        uAmp: { value: waveAmp },
        uMouse: { value: new THREE.Vector2(0, 0) }, // cursor on the grid plane (x, z)
        uMouseStrength: { value: 0 },               // eases 0→1 while the pointer is over the hero
      }
      const material = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        vertexShader: /* glsl */ `
          uniform float uTime;
          uniform float uAmp;
          uniform vec2 uMouse;
          uniform float uMouseStrength;
          varying float vFade;
          varying float vGlow;
          void main() {
            vec3 p = position;
            p.y = sin(p.x * 0.55 + uTime * 0.6) * cos(p.z * 0.7 + uTime * 0.4) * uAmp;

            // cursor ripple: a gaussian swell with a trailing ring around the pointer
            float d = distance(position.xz, uMouse);
            float swell = exp(-d * d * 0.30);
            float ring = exp(-pow(d - 1.8, 2.0) * 1.2) * sin(d * 3.0 - uTime * 2.5) * 0.35;
            vGlow = (swell + max(ring, 0.0)) * uMouseStrength;
            p.y += (swell * 0.9 + ring) * uMouseStrength;

            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (2.2 + vGlow * 2.4) * (7.0 / -mv.z);
            // fade points toward the horizontal edges
            vFade = (1.0 - smoothstep(6.0, 11.0, abs(position.x))) * (0.35 + 0.65 * (p.y + 0.55));
          }
        `,
        fragmentShader: /* glsl */ `
          varying float vFade;
          varying float vGlow;
          void main() {
            vec2 d = gl_PointCoord - 0.5;
            if (dot(d, d) > 0.25) discard;
            vec3 indigo = vec3(0.369, 0.416, 0.824);      // --indigo #5e6ad2
            vec3 soft   = vec3(0.486, 0.529, 0.878);      // --indigo-soft #7c87e0
            vec3 color = mix(indigo, soft, min(vGlow, 1.0));
            gl_FragColor = vec4(color, min(vFade * 0.55 + vGlow * 0.5, 0.95));
          }
        `,
      })
      scene.add(new THREE.Points(geometry, material))

      const render = () => {
        if (renderer.getContext().isContextLost()) return
        renderer.render(scene, camera)
      }

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = host
        if (!w || !h) return
        renderer.setSize(w, h, false)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        if (reducedMotion) render()
      }
      resize()
      const ro = new ResizeObserver(resize)
      ro.observe(host)

      // Reduced motion: draw the wave once, frozen, and skip all animation.
      if (reducedMotion) {
        render()
        cleanupScene = () => {
          ro.disconnect()
          geometry.dispose()
          material.dispose()
          renderer.dispose()
        }
        return
      }

      // Pointer → grid plane (y = 0), eased each frame so the ripple trails the cursor.
      const raycaster = new THREE.Raycaster()
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const ndc = new THREE.Vector2()
      const hit = new THREE.Vector3()
      const target = new THREE.Vector2(0, 0)
      let pointerActive = false
      const onPointerMove = (e: PointerEvent) => {
        const rect = host.getBoundingClientRect()
        const inside =
          e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom
        pointerActive = inside
        if (!inside) return
        ndc.set(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        )
        raycaster.setFromCamera(ndc, camera)
        if (raycaster.ray.intersectPlane(plane, hit)) target.set(hit.x, hit.z)
      }
      const onPointerLeave = () => { pointerActive = false }
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      document.addEventListener('pointerleave', onPointerLeave)
      // touch: no leave event fires after the finger lifts, so release the ripple explicitly
      const onPointerUp = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') pointerActive = false
      }
      window.addEventListener('pointerup', onPointerUp, { passive: true })
      window.addEventListener('pointercancel', onPointerUp, { passive: true })

      let raf = 0
      let running = false
      const start = performance.now()
      const frame = () => {
        uniforms.uTime.value = ((performance.now() - start) / 1000) * waveSpeed
        uniforms.uMouse.value.lerp(target, 0.08)
        uniforms.uMouseStrength.value +=
          ((pointerActive ? 1 : 0) - uniforms.uMouseStrength.value) * 0.05
        render()
        raf = requestAnimationFrame(frame)
      }
      const setRunning = (on: boolean) => {
        if (on === running) return
        running = on
        if (on) raf = requestAnimationFrame(frame)
        else cancelAnimationFrame(raf)
      }

      const io = new IntersectionObserver(
        ([e]) => setRunning(e.isIntersecting && !document.hidden),
        { threshold: 0 }
      )
      io.observe(host)
      const onVisibility = () => setRunning(!document.hidden)
      document.addEventListener('visibilitychange', onVisibility)

      render()
      setRunning(!document.hidden)

      cleanupScene = () => {
        setRunning(false)
        io.disconnect()
        ro.disconnect()
        document.removeEventListener('visibilitychange', onVisibility)
        window.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerleave', onPointerLeave)
        window.removeEventListener('pointerup', onPointerUp)
        window.removeEventListener('pointercancel', onPointerUp)
        geometry.dispose()
        material.dispose()
        renderer.dispose()
      }
    }

    // iOS Safari drops WebGL contexts under memory pressure; remount when restored.
    const onContextLost = (event: Event) => {
      event.preventDefault()
      cleanupScene()
      cleanupScene = () => {}
    }
    const onContextRestored = () => {
      if (disposed) return
      if (restoreTimer) clearTimeout(restoreTimer)
      restoreTimer = setTimeout(() => { void mountScene() }, 120)
    }
    canvas.addEventListener('webglcontextlost', onContextLost, false)
    canvas.addEventListener('webglcontextrestored', onContextRestored, false)
    void mountScene()

    return () => {
      disposed = true
      if (restoreTimer) clearTimeout(restoreTimer)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      cleanupScene()
    }
  }, [])

  return (
    <div ref={hostRef} className="hero-field" aria-hidden="true">
      <canvas ref={canvasRef} className="hero-field-canvas" />
    </div>
  )
}
