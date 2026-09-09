import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, Box, Hand, Layers3, MapPin, Monitor, Pause, Play, RotateCcw, Sparkles } from 'lucide-react'
import { createShowroom, showroomProjects } from './showroom'
import { createAssembly } from './assembly'
import { createIsland } from './island'
import { createBlocks } from './blocks'
import { createParticles } from './particles'
import type { SceneController } from './types'
import { SceneViewport } from './SceneViewport'
import './ThreeLab.css'

const concepts = [
  { id: 'showroom', name: 'Product showroom', short: 'Showroom', icon: Monitor, headline: 'Software you can almost touch.', description: 'Your actual projects, on beautifully lit devices. A familiar object makes the story immediate: I build software.', hint: 'Swipe to change projects · move to look around', strength: 'Best for showing your work', factory: createShowroom },
  { id: 'assembly', name: 'Sketch to shipped', short: 'Build sequence', icon: Layers3, headline: 'Watch an idea become a product.', description: 'A wireframe separates into interface, logic, and data, then comes together as a finished app. The whole building process, in one gesture.', hint: 'Drag left or right to scrub the build', strength: 'Best for telling your process', factory: createAssembly },
  { id: 'island', name: 'Puerto Rico in miniature', short: 'Puerto Rico', icon: MapPin, headline: 'Built in Puerto Rico.', description: 'A little piece of home, sculpted above the water. Explore the coastline and find the San Juan beacon.', hint: 'Drag to tilt · tap the San Juan beacon', strength: 'Best for making it personal', factory: createIsland },
  { id: 'blocks', name: 'Magnetic project blocks', short: 'Project blocks', icon: Box, headline: 'A little play goes a long way.', description: 'Pick up a project, give it a flick, and watch the pieces find their way home. A tangible way to explore the things you build.', hint: 'Grab a block, drag, then release to flick', strength: 'Best for hands-on exploration', factory: createBlocks },
  { id: 'particles', name: 'Particles with a purpose', short: 'Particles', icon: Sparkles, headline: 'A signature, with a story.', description: 'Thousands of blue points become your initials, your island, and an app. Touch them to break the shape; let go to bring it back.', hint: 'Press and move to scatter · release to reform', strength: 'Best fit for the existing Orbit card', factory: createParticles },
]


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
