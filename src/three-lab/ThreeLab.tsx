import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, Box, Hand, Layers3, MapPin, Monitor, Pause, Play, RotateCcw, Sparkles } from 'lucide-react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { createShowroom, showroomProjects } from './showroom'
import { createAssembly } from './assembly'
import { createIsland } from './island'
import { createBlocks } from './blocks'
import { createParticles } from './particles'
import type { SceneController, SceneFactory } from './types'
import './ThreeLab.css'

const concepts = [
  { id: 'showroom', name: 'Product showroom', short: 'Showroom', icon: Monitor, headline: 'Software you can almost touch.', description: 'Your actual projects, on beautifully lit devices. A familiar object makes the story immediate: I build software.', hint: 'Swipe to change projects · move to look around', strength: 'Best for showing your work', factory: createShowroom },
  { id: 'assembly', name: 'Sketch to shipped', short: 'Build sequence', icon: Layers3, headline: 'Watch an idea become a product.', description: 'A wireframe separates into interface, logic, and data, then comes together as a finished app. The whole building process, in one gesture.', hint: 'Drag left or right to scrub the build', strength: 'Best for telling your process', factory: createAssembly },
  { id: 'island', name: 'Puerto Rico in miniature', short: 'Puerto Rico', icon: MapPin, headline: 'Built in Puerto Rico.', description: 'A little piece of home, sculpted above the water. Explore the coastline and find the San Juan beacon.', hint: 'Drag to tilt · tap the San Juan beacon', strength: 'Best for making it personal', factory: createIsland },
  { id: 'blocks', name: 'Magnetic project blocks', short: 'Project blocks', icon: Box, headline: 'A little play goes a long way.', description: 'Pick up a project, give it a flick, and watch the pieces find their way home. A tangible way to explore the things you build.', hint: 'Grab a block, drag, then release to flick', strength: 'Best for hands-on exploration', factory: createBlocks },
  { id: 'particles', name: 'Particles with a purpose', short: 'Particles', icon: Sparkles, headline: 'A signature, with a story.', description: 'Thousands of blue points become your initials, your island, and an app. Touch them to break the shape; let go to bring it back.', hint: 'Press and move to scatter · release to reform', strength: 'Best fit for the existing Orbit card', factory: createParticles },
]

function SceneViewport({ factory, name, paused, controllerRef, onInfo, onProgress }: {
  factory: SceneFactory
  name: string
  paused: boolean
  controllerRef: React.RefObject<SceneController | null>
  onInfo: (label: string, detail?: string) => void
  onProgress: (progress: number) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const pauseRef = useRef(paused)
  const [error, setError] = useState(false)
  useEffect(() => { pauseRef.current = paused }, [paused])
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = .9
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.domElement.setAttribute('aria-label', name + ' interactive 3D preview')
    renderer.domElement.setAttribute('role', 'img')
    element.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#edf4fb')
    scene.fog = new THREE.Fog('#edf4fb', 18, 45)
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
    key.shadow.mapSize.set(1024, 1024)
    Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: .1, far: 25 })
    key.shadow.bias = -.001
    key.shadow.normalBias = .035
    scene.add(key)
    const rim = new THREE.DirectionalLight('#88c6ff', 1.5)
    rim.position.set(3, 4, -4)
    scene.add(rim)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: '#edf4fb', roughness: .9 }))
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.6
    floor.receiveShadow = true
    scene.add(floor)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let alive = true
    const controller = factory({ scene, camera, renderer, reducedMotion, onInfo: (label, detail) => { if (alive) onInfo(label, detail) } })
    controllerRef.current = controller
    const resize = () => {
      const width = element.clientWidth
      const height = element.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.zoom = Math.min(1, camera.aspect / 1.35)
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()
    let elapsed = 0
    let lastTime = performance.now()
    let lastProgressTime = 0
    renderer.setAnimationLoop((time) => {
      const delta = Math.min((time - lastTime) / 1000, .05)
      lastTime = time
      if (document.hidden) return
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
      if (type === 'down' && (activePointer !== null || event.button !== 0)) return
      if (activePointer !== null && event.pointerId !== activePointer) return
      if ((type === 'up' || type === 'cancel') && activePointer !== event.pointerId) return
      if (type === 'move' && activePointer === null && event.pointerType !== 'mouse') return
      const rect = element.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width * 2 - 1
      const y = -(event.clientY - rect.top) / rect.height * 2 + 1
      if (type === 'down') { activePointer = event.pointerId; pressed = true; lastX = x; lastY = y; element.setPointerCapture(event.pointerId) }
      if (type === 'up' || type === 'cancel') pressed = false
      controller.pointer?.(type, { x, y, dx: x - lastX, dy: y - lastY, pressed })
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
    const contextLost = (e: Event) => { e.preventDefault(); setError(true) }
    element.addEventListener('pointerdown', down)
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerup', up)
    element.addEventListener('pointercancel', cancel)
    element.addEventListener('lostpointercapture', lost)
    renderer.domElement.addEventListener('webglcontextlost', contextLost)
    return () => {
      alive = false
      observer.disconnect()
      renderer.setAnimationLoop(null)
      controllerRef.current = null
      controller.dispose?.()
      element.removeEventListener('pointerdown', down)
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerup', up)
      element.removeEventListener('pointercancel', cancel)
      element.removeEventListener('lostpointercapture', lost)
      renderer.domElement.removeEventListener('webglcontextlost', contextLost)
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
  }, [factory, name, controllerRef, onInfo, onProgress])

  return <div className="lab-canvas-host" ref={host}>
    {error && <div className="lab-error"><Monitor size={28} /><p>The 3D preview needs WebGL.</p><button onClick={() => window.location.reload()}>Reload preview</button></div>}
  </div>
}

export default function ThreeLab() {
  const [selected, setSelected] = useState(() => Math.max(0, concepts.findIndex(c => c.id === new URLSearchParams(location.search).get('concept'))))
  const [paused, setPaused] = useState(false)
  const [info, setInfo] = useState({ label: '', detail: '' })
  const [progress, setProgress] = useState(0)
  const controllerRef = useRef<SceneController | null>(null)
  const concept = concepts[selected]
  const onInfo = useCallback((label: string, detail = '') => setInfo({ label, detail }), [])
  const onProgress = useCallback((progress: number) => setProgress(progress), [])
  useEffect(() => {
    document.body.classList.add('lab-route')
    const previousTitle = document.title
    document.title = 'Motion studies — Jan Faris'
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.appendChild(robots)
    return () => { document.body.classList.remove('lab-route'); document.title = previousTitle; robots.remove() }
  }, [])
  const selectConcept = (index: number) => {
    setSelected(index)
    setPaused(false)
    setInfo({ label: '', detail: '' })
    setProgress(0)
    const url = new URL(location.href)
    url.searchParams.set('concept', concepts[index].id)
    window.history.replaceState(null, '', url)
  }
  const action = (name: string, value?: number) => controllerRef.current?.action?.(name, value)
  const project = showroomProjects.find(project => project.name === info.label)
  return <main className="lab-shell">
    <header className="lab-header">
      <Link className="lab-brand" to="/"><span>JF</span> Jan Faris <span className="lab-divider">/</span><span className="lab-header-label">Motion studies</span></Link>
      <span className="lab-preview-badge"><span /> Concept preview</span>
    </header>
    <section className="lab-intro">
      <div><p className="lab-eyebrow">FIVE WAYS TO TELL THE STORY</p><h1>A little motion.<br className="lab-mobile-break" /> A lot more meaning.</h1></div>
      <p>Explore five directions for your portfolio.<br />Pick one. Play with it. See what feels like you.</p>
    </section>
    <div className="lab-tabs" role="tablist" aria-label="Animation concepts">
      {concepts.map((item, index) => {
        const Icon = item.icon
        return <button key={item.id} id={'tab-' + item.id} role="tab" aria-selected={selected === index} aria-controls="concept-preview" tabIndex={selected === index ? 0 : -1} onClick={() => selectConcept(index)} onKeyDown={event => {
          let next = index
          if (event.key === 'ArrowRight') next = (index + 1) % concepts.length
          else if (event.key === 'ArrowLeft') next = (index - 1 + concepts.length) % concepts.length
          else if (event.key === 'Home') next = 0
          else if (event.key === 'End') next = concepts.length - 1
          else return
          event.preventDefault()
          selectConcept(next)
          document.getElementById('tab-' + concepts[next].id)?.focus()
        }}><span className="lab-tab-number">0{index + 1}</span><Icon size={17} /><span>{item.short}</span></button>
      })}
    </div>
    <section className="lab-workspace" id="concept-preview" role="tabpanel" aria-labelledby={'tab-' + concept.id}>
      <div className="lab-stage">
        <div className="lab-stage-label"><span className="lab-dot" />{concept.name}</div>
        <button className="lab-pause" onClick={() => setPaused(!paused)} aria-label={paused ? 'Play animation' : 'Pause animation'}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
        <SceneViewport key={concept.id} factory={concept.factory} name={concept.name} paused={paused} controllerRef={controllerRef} onInfo={onInfo} onProgress={onProgress} />
        <div className="lab-stage-hint"><Hand size={15} />{concept.hint}</div>
      </div>
      <aside className="lab-details">
        <div><p className="lab-eyebrow">CONCEPT 0{selected + 1} <span>/ 05</span></p><h2>{concept.headline}</h2><p className="lab-description">{concept.description}</p><span className="lab-strength">{concept.strength}</span></div>
        <div className="lab-controls">
          <p className="lab-control-heading">TRY IT YOURSELF</p>
          {selected === 0 && <><div className="lab-project-options">{showroomProjects.map((item, i) => <button key={item.name} className={info.label === item.name ? 'is-selected' : ''} onClick={() => action('project', i)}>{item.name}</button>)}</div><div className="lab-control-row"><button onClick={() => action('previous')} aria-label="Previous project"><ArrowLeft size={17} /></button><span>Swipe or choose a project</span><button onClick={() => action('next')} aria-label="Next project"><ArrowRight size={17} /></button></div></>}
          {selected === 1 && <><label className="lab-range-label" htmlFor="build-progress">Scrub the build <span>{Math.round(progress * 100)}%</span></label><input id="build-progress" className="lab-range" type="range" min="0" max="100" value={progress * 100} onChange={event => { const value = Number(event.target.value) / 100; setProgress(value); action('progress', value) }} /><div className="lab-range-captions"><span>Sketch</span><span>Build</span><span>Ship</span></div><button className="lab-wide-button" onClick={() => { setProgress(0); action('replay') }}><RotateCcw size={15} />Replay the sequence</button></>}
          {selected === 2 && <><button className="lab-wide-button lab-button-blue" onClick={() => action('marker')}><MapPin size={16} />Find San Juan</button><button className="lab-wide-button" onClick={() => action('recenter')}><RotateCcw size={15} />Reset the view</button></>}
          {selected === 3 && <><button className="lab-wide-button lab-button-blue" onClick={() => action('shuffle')}><Sparkles size={16} />Give them a nudge</button><button className="lab-wide-button" onClick={() => action('reset')}><RotateCcw size={15} />Bring them home</button><div className="lab-project-options">{showroomProjects.map((item, i) => <button key={item.name} onClick={() => action('project', i)}>{item.name}</button>)}</div></>}
          {selected === 4 && <><div className="lab-project-options">{['JF', 'Puerto Rico', 'App window'].map((label, i) => <button key={label} onClick={() => action('shape', i)}>{label}</button>)}</div><button className="lab-wide-button" onClick={() => action('scatter')}><Sparkles size={16} />Scatter & reform</button></>}
        </div>
        <div className="lab-current" aria-live="polite"><p>{info.label || concept.name}</p><span>{info.detail}</span>{project && (selected === 0 || selected === 3) && <a href={project.url} target="_blank" rel="noreferrer">Explore {project.name}<ArrowUpRight size={15} /></a>}</div>
      </aside>
    </section>
    <footer className="lab-footer"><span><span className="lab-dot" />Live, interactive Three.js studies</span><span>Drag works with a mouse or touch.</span></footer>
  </main>
}
