import { useEffect, useRef } from 'react'

export function HeroSignal() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const probe = document.createElement('canvas')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.innerWidth < 720
    const hasWebGL = Boolean(
      probe.getContext('webgl2', { powerPreference: 'high-performance' }) ||
      probe.getContext('webgl', { powerPreference: 'high-performance' }),
    )

    if (reduceMotion || !hasWebGL) return

    let disposed = false
    let frameId = 0
    let cleanupScene = () => {}

    async function mountScene() {
      const THREE = await import('three')
      if (disposed || !canvas) return

      let renderer: InstanceType<typeof THREE.WebGLRenderer>
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: !isMobile,
          alpha: true,
          powerPreference: 'high-performance',
        })
      } catch (error) {
        console.warn('Hero WebGL animation could not start.', error)
        return
      }
      renderer.setClearColor(0x000000, 0)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2))

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100)
      camera.position.set(0, 0.25, 7)

      const group = new THREE.Group()
      scene.add(group)
      const coreDetail = isMobile ? 1 : 2
      const ringSegments = isMobile ? 120 : 180
      const coreMaterial = isMobile
        ? new THREE.MeshStandardMaterial({
            color: 0xfdf8ee,
            roughness: 0.24,
            metalness: 0.08,
            transparent: true,
            opacity: 0.84,
          })
        : new THREE.MeshPhysicalMaterial({
            color: 0xfdf8ee,
            roughness: 0.18,
            metalness: 0.05,
            transparent: true,
            opacity: 0.78,
            iridescence: 0.45,
            iridescenceIOR: 1.8,
          })

      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.12, coreDetail),
        coreMaterial,
      )
      group.add(core)

      const wire = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.18, coreDetail),
        new THREE.MeshBasicMaterial({
          color: 0x3346d3,
          wireframe: true,
          transparent: true,
          opacity: 0.22,
        }),
      )
      group.add(wire)

      const amberRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.95, 0.012, 8, ringSegments),
        new THREE.MeshBasicMaterial({ color: 0xf6a728, transparent: true, opacity: 0.72 }),
      )
      amberRing.rotation.x = Math.PI / 2.7
      group.add(amberRing)

      const blueRing = new THREE.Mesh(
        new THREE.TorusGeometry(2.48, 0.01, 8, ringSegments),
        new THREE.MeshBasicMaterial({ color: 0x1b9aaa, transparent: true, opacity: 0.42 }),
      )
      blueRing.rotation.x = Math.PI / 1.95
      blueRing.rotation.y = Math.PI / 5
      group.add(blueRing)

      const pointPositions: number[] = []
      const linePositions: number[] = []
      const pointCount = isMobile ? 48 : 76
      for (let i = 0; i < pointCount; i += 1) {
        const ratio = i / pointCount
        const theta = ratio * Math.PI * 8
        const radius = 2.25 + Math.sin(i * 1.7) * 0.32
        const y = (ratio - 0.5) * 2.9
        const x = Math.cos(theta) * radius
        const z = Math.sin(theta) * radius
        pointPositions.push(x, y, z)

        if (i > 0 && i % 3 !== 0) {
          const prev = pointPositions.length - 6
          linePositions.push(pointPositions[prev], pointPositions[prev + 1], pointPositions[prev + 2], x, y, z)
        }
      }

      const pointsGeometry = new THREE.BufferGeometry()
      pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointPositions, 3))
      const points = new THREE.Points(
        pointsGeometry,
        new THREE.PointsMaterial({
          color: 0x273dba,
          size: 0.052,
          transparent: true,
          opacity: 0.78,
          sizeAttenuation: true,
        }),
      )
      group.add(points)

      const linesGeometry = new THREE.BufferGeometry()
      linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
      const lines = new THREE.LineSegments(
        linesGeometry,
        new THREE.LineBasicMaterial({
          color: 0x3346d3,
          transparent: true,
          opacity: 0.12,
        }),
      )
      group.add(lines)

      scene.add(new THREE.AmbientLight(0xffffff, 1.8))
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.4)
      keyLight.position.set(2.4, 3.2, 4)
      scene.add(keyLight)
      const warmLight = new THREE.PointLight(0xffb45e, 28, 9)
      warmLight.position.set(-2.8, -1.4, 3.2)
      scene.add(warmLight)

      const pointer = { x: 0, y: 0 }
      const onPointerMove = (event: PointerEvent) => {
        pointer.x = event.clientX / window.innerWidth - 0.5
        pointer.y = event.clientY / window.innerHeight - 0.5
      }
      window.addEventListener('pointermove', onPointerMove, { passive: true })

      const resize = () => {
        const width = canvas.clientWidth
        const height = canvas.clientHeight
        if (width === 0 || height === 0) return
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      }
      let cleanupResize = () => {}
      const ResizeObserverCtor = (window as Window & { ResizeObserver?: typeof ResizeObserver }).ResizeObserver
      if (typeof ResizeObserverCtor === 'function') {
        const resizeObserver = new ResizeObserverCtor(resize)
        resizeObserver.observe(canvas)
        cleanupResize = () => resizeObserver.disconnect()
      } else {
        window.addEventListener('resize', resize)
        cleanupResize = () => window.removeEventListener('resize', resize)
      }
      resize()

      const clock = new THREE.Clock()
      const animate = () => {
        const elapsed = clock.getElapsedTime()
        group.rotation.x = -0.18 + pointer.y * 0.18 + Math.sin(elapsed * 0.7) * 0.045
        group.rotation.y = elapsed * 0.18 + pointer.x * 0.36
        group.rotation.z = Math.sin(elapsed * 0.36) * 0.08
        core.rotation.y = -elapsed * 0.28
        amberRing.rotation.z = elapsed * 0.33
        blueRing.rotation.z = -elapsed * 0.22
        points.rotation.y = -elapsed * 0.045
        lines.rotation.y = points.rotation.y

        renderer.render(scene, camera)
        frameId = window.requestAnimationFrame(animate)
      }
      animate()

      cleanupScene = () => {
        window.cancelAnimationFrame(frameId)
        window.removeEventListener('pointermove', onPointerMove)
        cleanupResize()
        scene.traverse((object) => {
          const disposable = object as typeof object & {
            geometry?: { dispose: () => void }
            material?: { dispose: () => void } | { dispose: () => void }[]
          }
          disposable.geometry?.dispose()
          if (Array.isArray(disposable.material)) {
            disposable.material.forEach((material) => material.dispose())
          } else {
            disposable.material?.dispose()
          }
        })
        renderer.dispose()
        renderer.forceContextLoss()
      }
    }

    void mountScene()

    return () => {
      disposed = true
      cleanupScene()
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
