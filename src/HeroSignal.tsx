import { useEffect, useRef } from 'react'

function isIOSDevice() {
  return (
    /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
  )
}

export function HeroSignal() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let disposed = false
    let mountToken = 0
    let restoreTimer: ReturnType<typeof setTimeout> | null = null
    let cleanupScene = () => {}

    const setCanvasReady = (ready: boolean) => {
      canvas.classList.toggle('signal-canvas-ready', ready)
    }

    const mountScene = async () => {
      const token = ++mountToken
      cleanupScene()
      setCanvasReady(false)

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
          antialias: !isPhoneLike,
          depth: true,
          failIfMajorPerformanceCaveat: false,
          powerPreference: isPhoneLike ? 'default' : 'high-performance',
          preserveDrawingBuffer: false,
          stencil: false,
        })
      } catch (error) {
        console.warn('Hero WebGL animation could not start.', error)
        return
      }

      const maxPixelRatio = isIOS ? 1.25 : isMobile ? 1.5 : 2
      renderer.setClearColor(0x000000, 0)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio))

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100)
      camera.position.set(0, 0.25, 7)

      const group = new THREE.Group()
      scene.add(group)

      const coreDetail = isPhoneLike ? 1 : 2
      const ringSegments = isPhoneLike ? 96 : 180
      const coreMaterial = isPhoneLike
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

      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.12, coreDetail), coreMaterial)
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
      const pointCount = isPhoneLike ? 42 : 76
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
          linePositions.push(
            pointPositions[prev],
            pointPositions[prev + 1],
            pointPositions[prev + 2],
            x,
            y,
            z,
          )
        }
      }

      const pointsGeometry = new THREE.BufferGeometry()
      pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointPositions, 3))
      const points = new THREE.Points(
        pointsGeometry,
        new THREE.PointsMaterial({
          color: 0x273dba,
          size: isPhoneLike ? 0.07 : 0.052,
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

      scene.add(new THREE.AmbientLight(0xffffff, isPhoneLike ? 2 : 1.8))
      const keyLight = new THREE.DirectionalLight(0xffffff, isPhoneLike ? 2 : 2.4)
      keyLight.position.set(2.4, 3.2, 4)
      scene.add(keyLight)
      const warmLight = new THREE.PointLight(0xffb45e, isPhoneLike ? 18 : 28, 9)
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

      let cleaned = false
      let elapsed = 0
      let frameId: number | null = null
      let paused = document.visibilityState !== 'visible'
      const clock = new THREE.Clock()

      const render = () => {
        const gl = renderer.getContext()
        if (gl.isContextLost()) return

        renderer.render(scene, camera)
        setCanvasReady(true)
      }

      const animate = () => {
        if (disposed || cleaned || paused) {
          frameId = null
          return
        }

        const delta = Math.min(clock.getDelta(), 0.05)
        elapsed += delta
        group.rotation.x = -0.18 + pointer.y * 0.18 + Math.sin(elapsed * 0.7) * 0.045
        group.rotation.y = elapsed * 0.18 + pointer.x * 0.36
        group.rotation.z = Math.sin(elapsed * 0.36) * 0.08
        core.rotation.y = -elapsed * 0.28
        amberRing.rotation.z = elapsed * 0.33
        blueRing.rotation.z = -elapsed * 0.22
        points.rotation.y = -elapsed * 0.045
        lines.rotation.y = points.rotation.y

        render()
        frameId = window.requestAnimationFrame(animate)
      }

      const startLoop = () => {
        if (frameId !== null || disposed || cleaned || paused) return
        clock.start()
        frameId = window.requestAnimationFrame(animate)
      }

      const stopLoop = () => {
        if (frameId === null) return
        window.cancelAnimationFrame(frameId)
        frameId = null
      }

      const onVisibility = () => {
        paused = document.visibilityState !== 'visible'
        if (paused) {
          stopLoop()
        } else {
          startLoop()
        }
      }
      document.addEventListener('visibilitychange', onVisibility)

      render()
      startLoop()

      cleanupScene = () => {
        if (cleaned) return
        cleaned = true
        stopLoop()
        window.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('visibilitychange', onVisibility)
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
        setCanvasReady(false)
      }
    }

    const onContextLost = (event: Event) => {
      event.preventDefault()
      cleanupScene()
    }

    const onContextRestored = () => {
      if (disposed) return
      if (restoreTimer) window.clearTimeout(restoreTimer)
      restoreTimer = window.setTimeout(() => {
        void mountScene()
      }, 120)
    }

    canvas.addEventListener('webglcontextlost', onContextLost, false)
    canvas.addEventListener('webglcontextrestored', onContextRestored, false)
    void mountScene()

    return () => {
      disposed = true
      if (restoreTimer) window.clearTimeout(restoreTimer)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
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
