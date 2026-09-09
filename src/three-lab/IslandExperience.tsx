import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, Hand, MapPin, Pause, Play, RotateCcw, Sparkles, X } from 'lucide-react'
import { SceneViewport } from './SceneViewport'
import { createCombined } from './combined'
import { createIsland } from './island'
import { islandProjects } from './projects'
import type { SceneController } from './types'
import './IslandExperience.css'

const copy = {
  en: {
    built: 'Built in Puerto Rico.', back: 'All motion studies', eyebrow: 'A PLACE. A FEW IDEAS. A LITTLE PLAY.', intro: 'Things I make, from a place I call home.',
    experience: "Explore Jan’s projects on an interactive island", scene: 'Puerto Rico with magnetic project blocks and particle trails',
    play: 'Play island animation', pause: 'Pause island animation', reset: 'Reset island and projects', resetTitle: 'Reset view',
    desktopHint: 'Drag the island · Flick a block · Select a project', mobileHint: 'Swipe to turn · Tap a project · Scroll as usual',
    explorer: 'Project explorer', work: 'SELECTED WORK', choose: 'Choose a project', close: 'Return project to island', preview: 'product preview',
    smallIsland: 'Small island.', bigIdeas: 'A world of ideas.', explore: 'Pick a project above or tap a floating block. Each one has a story.', start: 'Start with Wandr',
    sideFooter: 'Made with curiosity, in San Juan.', footer: 'Grab a little piece of the work.', nudge: 'Give the blocks a nudge',
    initialStatus: 'Drag to explore the island. Select a project to discover the work.',
  },
  es: {
    built: 'Hecho en Puerto Rico.', back: 'Todos los conceptos', eyebrow: 'UN LUGAR. ALGUNAS IDEAS. UN POCO DE JUEGO.', intro: 'Cosas que creo, desde el lugar que llamo hogar.',
    experience: 'Explora los proyectos de Jan en una isla interactiva', scene: 'Puerto Rico con bloques de proyectos y estelas de partículas',
    play: 'Reproducir la animación de la isla', pause: 'Pausar la animación de la isla', reset: 'Restablecer la isla y los proyectos', resetTitle: 'Restablecer la vista',
    desktopHint: 'Arrastra la isla · Impulsa un bloque · Elige un proyecto', mobileHint: 'Desliza para girar · Toca un proyecto · Desplázate como siempre',
    explorer: 'Explorador de proyectos', work: 'TRABAJO SELECCIONADO', choose: 'Elige un proyecto', close: 'Devolver el proyecto a la isla', preview: 'vista del producto',
    smallIsland: 'Una isla pequeña.', bigIdeas: 'Un mundo de ideas.', explore: 'Elige un proyecto arriba o toca un bloque flotante. Cada uno tiene su historia.', start: 'Empieza con Wandr',
    sideFooter: 'Hecho con curiosidad, en San Juan.', footer: 'Descubre un poco de mi trabajo.', nudge: 'Dale un impulso a los bloques',
    initialStatus: 'Arrastra para explorar la isla. Elige un proyecto para conocer mi trabajo.',
  },
}

const embeddedCopy = {
  en: {
    experience: 'Explore Puerto Rico and Jan’s portfolio',
    scene: 'Interactive Puerto Rico island with a San Juan location pin',
    reset: 'Recenter the Puerto Rico island',
    desktopHint: 'Drag to turn · Tap the San Juan pin',
    mobileHint: 'Swipe to turn · Tap San Juan · Scroll as usual',
    explore: 'Choose a project above to explore what I’ve built.',
    close: 'Close project details',
    initialStatus: 'Drag to explore Puerto Rico. Tap the blue pin to find San Juan.',
  },
  es: {
    experience: 'Explora Puerto Rico y el portafolio de Jan',
    scene: 'Isla interactiva de Puerto Rico con un marcador en San Juan',
    reset: 'Centrar la vista de Puerto Rico',
    desktopHint: 'Arrastra para girar · Toca el marcador de San Juan',
    mobileHint: 'Desliza para girar · Toca San Juan · Desplázate como siempre',
    explore: 'Elige un proyecto arriba para descubrir lo que he creado.',
    close: 'Cerrar los detalles del proyecto',
    initialStatus: 'Arrastra para explorar Puerto Rico. Toca el marcador azul para encontrar San Juan.',
  },
}

type IslandExperienceProps = {
  embedded?: boolean
  lang?: 'en' | 'es'
  theme?: 'light' | 'dark'
}

export default function IslandExperience({ embedded = false, lang = 'en', theme = 'light' }: IslandExperienceProps) {
  const text = embedded ? { ...copy[lang], ...embeddedCopy[lang] } : copy[lang]
  const controller = useRef<SceneController | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const [info, setInfo] = useState({ label: '', detail: '' })
  const onInfo = useCallback((label: string, detail = '') => setInfo({ label, detail }), [])
  const onSelectProject = useCallback((index: number | null) => setSelected(index), [])
  const project = selected === null ? null : islandProjects[selected]
  const projectText = lang === 'es' && project?.es ? project.es : project
  const statusProject = islandProjects.find(item => item.name === info.label)
  const status = lang === 'es'
    ? statusProject?.es?.description || (info.label === 'San Juan, Puerto Rico' ? 'Hecho en Puerto Rico. Una perspectiva local, con trabajo que llega más allá de la isla.' : text.initialStatus)
    : info.detail || info.label || text.initialStatus
  const detailId = embedded ? 'embedded-island-project-detail' : 'island-project-detail'
  const Root = embedded ? 'div' : 'main'

  useEffect(() => {
    if (embedded) return
    const title = document.title
    document.title = lang === 'es' ? 'Hecho en Puerto Rico — Jan Faris' : 'Built in Puerto Rico — Jan Faris'
    document.body.classList.add('island-route')
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.appendChild(robots)
    return () => {
      document.title = title
      document.body.classList.remove('island-route')
      robots.remove()
    }
  }, [embedded, lang])

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelected(null)
        controller.current?.action?.('close')
      }
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [])

  const choose = (index: number) => {
    setSelected(index)
    setPaused(false)
    controller.current?.action?.('project', index)
  }
  const close = () => { setSelected(null); controller.current?.action?.('close') }
  const reset = () => { setSelected(null); setPaused(false); controller.current?.action?.(embedded ? 'recenter' : 'reset') }

  return <Root className={`island-page${embedded ? ' island-embedded' : ''}`} data-theme={theme}>
    {!embedded && <>
      <header className="island-page-header">
        <Link className="island-wordmark" to={lang === 'es' ? '/es' : '/'}><span>JF</span>Jan Faris</Link>
        <Link className="island-back" to="/lab/three?concept=island"><ArrowLeft size={14} /><span>{text.back}</span></Link>
      </header>
      <div className="island-page-intro">
        <div><p className="island-eyebrow">{text.eyebrow}</p><h1>{text.built}</h1></div>
        <p>{text.intro}</p>
      </div>
    </>}
    <section className="island-experience" aria-label={text.experience}>
      <div className="island-world">
        {!embedded && <div className="island-location"><MapPin size={13} />{embedded ? <h2 className="island-embedded-title">{text.built}</h2> : 'San Juan, Puerto Rico'}<span>{embedded ? 'San Juan, Puerto Rico' : '18.46° N · 66.11° W'}</span></div>}
        <SceneViewport factory={embedded ? createIsland : createCombined} name={text.scene} controllerRef={controller} paused={paused} onInfo={onInfo} onSelectProject={onSelectProject} allowPageScroll fitAspect={embedded ? 1.4 : 1.18} theme={theme} lang={lang} />
        <div className="island-world-actions">
          <button onClick={() => setPaused(value => !value)} aria-label={paused ? text.play : text.pause} title={paused ? text.play : text.pause}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
          {!embedded && <button onClick={reset} aria-label={text.reset} title={text.resetTitle}><RotateCcw size={16} /></button>}
        </div>
        {!embedded && <div className="island-gesture-hint"><Hand size={14} /><span className="island-desktop-hint">{text.desktopHint}</span><span className="island-mobile-hint">{text.mobileHint}</span></div>}
      </div>
      {!embedded && <aside className="island-side" aria-label={text.explorer}>
        <div className="island-side-title"><span>{text.work}</span><span>01—03</span></div>
        <div className="island-project-selector" aria-label={text.choose}>
          {islandProjects.map((item, index) => <button key={item.name} onClick={() => choose(index)} aria-pressed={selected === index} aria-controls={detailId} style={{ '--project-color': item.color } as React.CSSProperties}><span>{item.number}</span><strong>{item.name}</strong><span className="island-project-indicator" /></button>)}
        </div>
        <div className="island-project-detail" id={detailId} aria-live="polite" aria-atomic="true">
          {project && projectText ? <div className="island-project-content" key={project.name}>
            <div className="island-project-heading"><div><p className="island-eyebrow">{projectText.category}</p><h2>{project.name}</h2></div><button className="island-close-project" onClick={close} aria-label={text.close}><X size={16} /></button></div>
            <div className="island-project-preview"><img src={project.image} alt={`${project.name} · ${text.preview}`} width="800" height="474" /></div>
            <h3>{projectText.tagline}</h3>
            <p className="island-project-description">{projectText.description}</p>
            <a className="island-project-link" href={project.url} target="_blank" rel="noreferrer">{projectText.linkLabel}<ArrowUpRight size={16} /></a>
          </div> : <div className="island-explorer-intro">
            <span className="island-small-star"><Sparkles size={23} strokeWidth={1.2} /></span>
            <h2>{text.smallIsland}<br />{' '}{text.bigIdeas}</h2>
            <p>{text.explore}</p>
            <button onClick={() => choose(0)}>{text.start}<ArrowRight size={16} /></button>
          </div>}
        </div>
        <div className="island-side-footer"><span className="island-online-dot" />{text.sideFooter}</div>
      </aside>}
    </section>
    {!embedded && <footer className="island-page-footer"><span>{text.footer}</span><button onClick={() => { setPaused(false); controller.current?.action?.('nudge') }}><Sparkles size={13} />{text.nudge}</button></footer>}
    <p className="island-sr-only" role="status">{status}</p>
  </Root>
}
