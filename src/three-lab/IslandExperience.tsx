import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, Hand, MapPin, Pause, Play, RotateCcw, Sparkles, X } from 'lucide-react'
import { SceneViewport } from './SceneViewport'
import { createCombined } from './combined'
import { islandProjects } from './projects'
import type { SceneController } from './types'
import './IslandExperience.css'

export default function IslandExperience() {
  const controller = useRef<SceneController | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const [status, setStatus] = useState('Drag to explore the island. Select a project to discover the work.')
  const onInfo = useCallback((label: string, detail?: string) => setStatus(detail || label), [])
  const onSelectProject = useCallback((index: number | null) => setSelected(index), [])
  const project = selected === null ? null : islandProjects[selected]

  useEffect(() => {
    const title = document.title
    document.title = 'Built in Puerto Rico — Jan Faris'
    document.body.classList.add('island-route')
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.appendChild(robots)
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelected(null)
        controller.current?.action?.('close')
      }
    }
    window.addEventListener('keydown', escape)
    return () => {
      document.title = title
      document.body.classList.remove('island-route')
      robots.remove()
      window.removeEventListener('keydown', escape)
    }
  }, [])

  const choose = (index: number) => {
    setSelected(index)
    setPaused(false)
    controller.current?.action?.('project', index)
  }
  const close = () => { setSelected(null); controller.current?.action?.('close') }
  const reset = () => { setSelected(null); setPaused(false); controller.current?.action?.('reset') }

  return <main className="island-page">
    <header className="island-page-header">
      <Link className="island-wordmark" to="/"><span>JF</span>Jan Faris</Link>
      <Link className="island-back" to="/lab/three?concept=island"><ArrowLeft size={14} /><span>All motion studies</span></Link>
    </header>
    <div className="island-page-intro">
      <div><p className="island-eyebrow">A PLACE. A FEW IDEAS. A LITTLE PLAY.</p><h1>Built in Puerto Rico.</h1></div>
      <p>Things I make, from a place I call home.</p>
    </div>
    <section className="island-experience" aria-label="Explore Jan's projects on an interactive island">
      <div className="island-world">
        <div className="island-location"><MapPin size={13} />San Juan, Puerto Rico<span>18.46° N · 66.11° W</span></div>
        <SceneViewport factory={createCombined} name="Puerto Rico with magnetic project blocks and particle trails" controllerRef={controller} paused={paused} onInfo={onInfo} onSelectProject={onSelectProject} allowPageScroll fitAspect={1.18} />
        <div className="island-world-actions">
          <button onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play island animation' : 'Pause island animation'} title={paused ? 'Play animation' : 'Pause animation'}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
          <button onClick={reset} aria-label="Reset island and projects" title="Reset view"><RotateCcw size={16} /></button>
        </div>
        <div className="island-gesture-hint"><Hand size={14} /><span className="island-desktop-hint">Drag the island · Flick a block · Select a project</span><span className="island-mobile-hint">Swipe to turn · Tap a project · Scroll as usual</span></div>
      </div>
      <aside className="island-side" aria-label="Project explorer">
        <div className="island-side-title"><span>SELECTED WORK</span><span>01—03</span></div>
        <div className="island-project-selector" aria-label="Choose a project">
          {islandProjects.map((item, index) => <button key={item.name} onClick={() => choose(index)} aria-pressed={selected === index} aria-controls="island-project-detail" style={{ '--project-color': item.color } as React.CSSProperties}><span>{item.number}</span><strong>{item.name}</strong><span className="island-project-indicator" /></button>)}
        </div>
        <div className="island-project-detail" id="island-project-detail" aria-live="polite" aria-atomic="true">
          {project ? <div className="island-project-content" key={project.name}>
            <div className="island-project-heading"><div><p className="island-eyebrow">{project.category}</p><h2>{project.name}</h2></div><button className="island-close-project" onClick={close} aria-label="Return project to island"><X size={16} /></button></div>
            <div className="island-project-preview"><img src={project.image} alt={`${project.name} product preview`} width="800" height="474" /></div>
            <h3>{project.tagline}</h3>
            <p className="island-project-description">{project.description}</p>
            <a className="island-project-link" href={project.url} target="_blank" rel="noreferrer">{project.linkLabel}<ArrowUpRight size={16} /></a>
          </div> : <div className="island-explorer-intro">
            <span className="island-small-star"><Sparkles size={23} strokeWidth={1.2} /></span>
            <h2>Small island.<br /> A world of ideas.</h2>
            <p>Pick a project above or tap a floating block. Each one has a story.</p>
            <button onClick={() => choose(0)}>Start with Wandr<ArrowRight size={16} /></button>
          </div>}
        </div>
        <div className="island-side-footer"><span className="island-online-dot" />Made with curiosity, in San Juan.</div>
      </aside>
    </section>
    <footer className="island-page-footer"><span>Grab a little piece of the work.</span><button onClick={() => { setPaused(false); controller.current?.action?.('nudge') }}><Sparkles size={13} />Give the blocks a nudge</button></footer>
    <p className="island-sr-only" role="status">{status}</p>
  </main>
}
