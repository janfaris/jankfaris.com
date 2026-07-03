import { useEffect, useRef } from 'react'

/**
 * Subtle indigo particle wave behind the hero.
 * three.js is dynamically imported so it never blocks first paint.
 * Skips entirely on prefers-reduced-motion; pauses when offscreen or tab-hidden.
 */
export function HeroField() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let disposed = false
    let cleanup: (() => void) | undefined

    import('three').then((THREE) => {
      if (disposed || !hostRef.current) return

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      renderer.domElement.className = 'hero-field-canvas'
      host.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
      camera.position.set(0, 2.2, 7)
      camera.lookAt(0, 0, 0)

      // Flat grid of points; the vertex shader lifts them into a moving wave.
      const COLS = 90
      const ROWS = 40
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

      const uniforms = {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) }, // cursor on the grid plane (x, z)
        uMouseStrength: { value: 0 },               // eases 0→1 while the pointer is over the hero
      }
      const material = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        vertexShader: /* glsl */ `
          uniform float uTime;
          uniform vec2 uMouse;
          uniform float uMouseStrength;
          varying float vFade;
          varying float vGlow;
          void main() {
            vec3 p = position;
            p.y = sin(p.x * 0.55 + uTime * 0.6) * cos(p.z * 0.7 + uTime * 0.4) * 0.55;

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

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = host
        renderer.setSize(w, h, false)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
      }
      resize()
      const ro = new ResizeObserver(resize)
      ro.observe(host)

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

      let raf = 0
      let running = false
      const start = performance.now()
      const frame = () => {
        uniforms.uTime.value = (performance.now() - start) / 1000
        uniforms.uMouse.value.lerp(target, 0.08)
        uniforms.uMouseStrength.value +=
          ((pointerActive ? 1 : 0) - uniforms.uMouseStrength.value) * 0.05
        renderer.render(scene, camera)
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

      cleanup = () => {
        setRunning(false)
        io.disconnect()
        ro.disconnect()
        document.removeEventListener('visibilitychange', onVisibility)
        window.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerleave', onPointerLeave)
        geometry.dispose()
        material.dispose()
        renderer.dispose()
        renderer.domElement.remove()
      }
    })

    return () => {
      disposed = true
      cleanup?.()
    }
  }, [])

  return <div ref={hostRef} className="hero-field" aria-hidden="true" />
}
