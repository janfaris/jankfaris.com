import { useEffect, useRef, useState } from 'react'
import { Monitor } from 'lucide-react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import type { SceneController, SceneFactory } from './types'

const noop = () => undefined

export function SceneViewport({ factory, name, paused, controllerRef, onInfo, onProgress = noop, onSelectProject = noop, allowPageScroll = false, fitAspect = 1.35, theme = 'light', lang = 'en', showFloor = true }: {
  factory: SceneFactory
  name: string
  paused: boolean
  controllerRef: React.RefObject<SceneController | null>
  onInfo: (label: string, detail?: string) => void
  onProgress?: (progress: number) => void
  onSelectProject?: (index: number | null) => void
  allowPageScroll?: boolean
  fitAspect?: number
  theme?: 'light' | 'dark'
  lang?: 'en' | 'es'
  showFloor?: boolean
}) {
  const host = useRef<HTMLDivElement>(null)
  const pauseRef = useRef(paused)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => { pauseRef.current = paused }, [paused])
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReducedMotion(media.matches)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  useEffect(() => {
    const element = host.current
    if (!element) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' })
    } catch {
      queueMicrotask(() => setError(true))
      return
    }
    const smallScreen = () => window.matchMedia('(max-width: 760px), (pointer: coarse)').matches
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, smallScreen() ? 1.5 : 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = .9
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.domElement.setAttribute('aria-label', name + ' interactive 3D preview')
    renderer.domElement.setAttribute('role', 'img')
    element.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const background = theme === 'dark' ? '#152331' : '#edf4fb'
    scene.background = new THREE.Color(background)
    scene.fog = new THREE.Fog(background, 18, 45)
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 80)
    camera.position.set(0, 1.5, 9)
    camera.lookAt(0, 0, 0)
    const room = new RoomEnvironment()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = pmrem.fromScene(room, .04)
    scene.environment = environment.texture
    scene.environmentIntensity = .6
    room.dispose()
    pmrem.dispose()
    scene.add(new THREE.HemisphereLight('#ddebff', '#bac5d4', 1.2))
    const key = new THREE.DirectionalLight('#fff9ef', 2.2)
    key.position.set(-3, 7, 6)
    key.castShadow = true
    key.shadow.mapSize.setScalar(smallScreen() ? 512 : 1024)
    Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: .1, far: 25 })
    key.shadow.bias = -.001
    key.shadow.normalBias = .035
    scene.add(key)
    const rim = new THREE.DirectionalLight('#88c6ff', 1.5)
    rim.position.set(3, 4, -4)
    scene.add(rim)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: background, roughness: .9 }))
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.6
    floor.receiveShadow = true
    floor.visible = showFloor
    scene.add(floor)
    let alive = true
    const controller = factory({ scene, camera, renderer, reducedMotion, onInfo: (label, detail) => { if (alive) onInfo(label, detail) }, onSelectProject: index => { if (alive) onSelectProject(index) } })
    controllerRef.current = controller
    let cancelGesture = noop
    const resize = () => {
      const width = element.clientWidth
      const height = element.clientHeight
      if (!width || !height) return
      cancelGesture()
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, smallScreen() ? 1.5 : 1.75))
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.zoom = Math.min(1, camera.aspect / fitAspect)
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()
    let elapsed = 0
    let lastTime = performance.now()
    let lastProgressTime = 0
    let inViewport = true
    let contextAvailable = true
    const intersection = new IntersectionObserver(entries => { inViewport = entries[0]?.isIntersecting ?? true }, { rootMargin: '80px' })
    intersection.observe(element)
    renderer.setAnimationLoop((time) => {
      const delta = Math.min((time - lastTime) / 1000, .05)
      lastTime = time
      if (document.hidden || !inViewport || !contextAvailable) return
      if (!pauseRef.current) elapsed += delta
      controller.update(elapsed, pauseRef.current ? 0 : delta)
      if (controller.getProgress && time - lastProgressTime > 100) {
        lastProgressTime = time
        onProgress(controller.getProgress())
      }
      renderer.render(scene, camera)
    })
    let pressed = false
    let activePointer: number | null = null
    let lastX = 0
    let lastY = 0
    const input = (event: PointerEvent, type: 'down' | 'move' | 'up' | 'cancel') => {
      if (type === 'down' && (event.target !== renderer.domElement || !contextAvailable)) return
      if (type === 'down' && (activePointer !== null || event.button !== 0)) return
      if (activePointer !== null && event.pointerId !== activePointer) return
      if ((type === 'up' || type === 'cancel') && activePointer !== event.pointerId) return
      if (type === 'move' && activePointer === null && event.pointerType !== 'mouse') return
      const rect = element.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width * 2 - 1
      const y = -(event.clientY - rect.top) / rect.height * 2 + 1
      if (type === 'down') { activePointer = event.pointerId; pressed = true; lastX = x; lastY = y; element.setPointerCapture(event.pointerId) }
      if (type === 'up' || type === 'cancel') pressed = false
      controller.pointer?.(type, { x, y, dx: x - lastX, dy: y - lastY, pressed, pointerType: event.pointerType })
      if (type === 'up' || type === 'cancel') { activePointer = null; if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId) }
      lastX = x
      lastY = y
    }
    const down = (e: PointerEvent) => input(e, 'down')
    const move = (e: PointerEvent) => input(e, 'move')
    const up = (e: PointerEvent) => input(e, 'up')
    const cancel = (e: PointerEvent) => input(e, 'cancel')
    const lost = (e: PointerEvent) => {
      if (e.pointerId !== activePointer) return
      activePointer = null
      pressed = false
      controller.pointer?.('cancel', { x: lastX, y: lastY, dx: 0, dy: 0, pressed: false })
    }
    cancelGesture = () => {
      if (activePointer === null) return
      const pointerId = activePointer
      activePointer = null
      pressed = false
      controller.pointer?.('cancel', { x: lastX, y: lastY, dx: 0, dy: 0, pressed: false })
      if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId)
    }
    const visibility = () => { lastTime = performance.now(); if (document.hidden) cancelGesture() }
    const contextLost = (e: Event) => { e.preventDefault(); cancelGesture(); contextAvailable = false; setError(true) }
    element.addEventListener('pointerdown', down)
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerup', up)
    element.addEventListener('pointercancel', cancel)
    element.addEventListener('lostpointercapture', lost)
    renderer.domElement.addEventListener('webglcontextlost', contextLost)
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('blur', cancelGesture)
    return () => {
      alive = false
      cancelGesture()
      observer.disconnect()
      intersection.disconnect()
      renderer.setAnimationLoop(null)
      controllerRef.current = null
      controller.dispose?.()
      element.removeEventListener('pointerdown', down)
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerup', up)
      element.removeEventListener('pointercancel', cancel)
      element.removeEventListener('lostpointercapture', lost)
      renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('blur', cancelGesture)
      const textures = new Set<THREE.Texture>()
      const materials = new Set<THREE.Material>()
      const geometries = new Set<THREE.BufferGeometry>()
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (mesh.geometry) geometries.add(mesh.geometry)
        if (mesh.material) for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
          materials.add(material)
          for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value)
        }
      })
      geometries.forEach(geometry => geometry.dispose())
      materials.forEach(material => material.dispose())
      textures.forEach(texture => texture.dispose())
      key.shadow.dispose()
      environment.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [factory, name, controllerRef, onInfo, onProgress, onSelectProject, attempt, reducedMotion, fitAspect, theme, showFloor])

  return <div className="lab-canvas-host" ref={host} style={{ position: 'absolute', inset: 0, overflow: 'hidden', touchAction: allowPageScroll ? 'pan-y pinch-zoom' : 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}>
    {error && <div className="lab-error" role="status"><Monitor size={28} /><p>{lang === 'es' ? 'La vista 3D está tomando un descanso.' : 'The 3D view is taking a break.'}</p><span>{lang === 'es' ? 'Puedes explorar todos los proyectos abajo.' : 'You can still explore every project below.'}</span><button onClick={() => { setError(false); setAttempt(value => value + 1) }}>{lang === 'es' ? 'Intentar 3D de nuevo' : 'Try 3D again'}</button></div>}
  </div>
}
