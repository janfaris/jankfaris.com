import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ArrowUpRight, Box, Pause, Play, RotateCcw, Shuffle, Sparkles } from 'lucide-react'
import { createBlocks } from './blocks'
import { createParticles } from './particles'
import { islandProjects } from './projects'
import { SceneViewport } from './SceneViewport'
import type { SceneController } from './types'

type CompactMotionProps = {
  kind: 'blocks' | 'particles'
  theme: 'dark' | 'light'
  lang: 'en' | 'es'
}

const copy = {
  en: {
    blocks: 'Project blocks', particles: 'Particles', pause: 'Pause animation', play: 'Play animation',
    nudge: 'Nudge', reset: 'Return the blocks home', scatter: 'Scatter and reform', shapes: 'Choose a particle shape',
    shapeNames: ['JF', 'Puerto Rico', 'App window'],
    shapeStatus: ['JF, the builder.', 'Puerto Rico, where I build.', 'Products, what I make.'],
  },
  es: {
    blocks: 'Bloques de proyectos', particles: 'Partículas', pause: 'Pausar animación', play: 'Reproducir animación',
    nudge: 'Dar un impulso', reset: 'Devolver los bloques a su lugar', scatter: 'Dispersar y reagrupar', shapes: 'Elige una forma de partículas',
    shapeNames: ['JF', 'Puerto Rico', 'App'],
    shapeStatus: ['JF, quien construye.', 'Puerto Rico, donde construyo.', 'Productos, lo que creo.'],
  },
}

export default function CompactMotion({ kind, theme, lang }: CompactMotionProps) {
  const text = copy[lang]
  const title = text[kind]
  const headingId = useId()
  const stage = useRef<HTMLDivElement>(null)
  const controller = useRef<SceneController | null>(null)
  const [entered, setEntered] = useState(false)
  const [paused, setPaused] = useState(false)
  const [info, setInfo] = useState({ label: '', detail: '' })
  const onInfo = useCallback((label: string, detail = '') => {
    setInfo(previous => previous.label === label && previous.detail === detail ? previous : { label, detail })
  }, [])

  useEffect(() => {
    if (entered || !stage.current) return
    let alive = true
    if (typeof IntersectionObserver === 'undefined') {
      queueMicrotask(() => { if (alive) setEntered(true) })
      return () => { alive = false }
    }
    const observer = new IntersectionObserver(entries => {
      if (!alive || !entries.some(entry => entry.isIntersecting)) return
      setEntered(true)
      observer.disconnect()
    }, { rootMargin: '160px', threshold: 0.01 })
    observer.observe(stage.current)
    return () => { alive = false; observer.disconnect() }
  }, [entered])

  const selectedProject = kind === 'blocks' ? islandProjects.find(project => project.name === info.label) : undefined
  const projectText = lang === 'es' && selectedProject?.es ? selectedProject.es : selectedProject
  const activeShape = info.label.startsWith('Puerto Rico') ? 1 : info.label.startsWith('Products') ? 2 : 0
  const status = kind === 'particles'
    ? info.label ? text.shapeStatus[activeShape] : ''
    : selectedProject ? `${selectedProject.name}. ${projectText?.description ?? ''}` : ''

  function action(name: string, value?: number) {
    setPaused(false)
    if (name === 'reset') setInfo({ label: '', detail: '' })
    controller.current?.action?.(name, value)
  }

  return (
    <section className={`desk-motion-card desk-${kind}-motion`} data-theme={theme} aria-labelledby={headingId}>
      <header className="desk-motion-header">
        <h2 id={headingId}>{kind === 'blocks' ? <Box size={15} aria-hidden="true" /> : <Sparkles size={15} aria-hidden="true" />}{title}</h2>
        <button className="desk-motion-icon-button" type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? text.play : text.pause} title={paused ? text.play : text.pause} disabled={!entered} style={{ width: 44, height: 44 }}>
          {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
        </button>
      </header>

      <div className="desk-motion-stage" ref={stage} onPointerDownCapture={() => { if (paused) setPaused(false) }}>
        {entered ? <SceneViewport
          key={kind}
          factory={kind === 'blocks' ? createBlocks : createParticles}
          name={title}
          paused={paused}
          controllerRef={controller}
          onInfo={onInfo}
          allowPageScroll
          theme={theme}
          lang={lang}
          showFloor={kind !== 'particles'}
        /> : <div className="desk-motion-placeholder" aria-hidden="true" />}
      </div>

      <footer className="desk-motion-footer">
        {kind === 'blocks' ? <>
          <button className="desk-motion-nudge" type="button" onClick={() => action('shuffle')} disabled={!entered}><Shuffle size={13} aria-hidden="true" />{text.nudge}</button>
          {selectedProject && projectText && <a className="desk-motion-project-link" href={selectedProject.url} target="_blank" rel="noreferrer">{projectText.linkLabel}<ArrowUpRight size={13} aria-hidden="true" /></a>}
          <button className="desk-motion-icon-button" type="button" onClick={() => action('reset')} disabled={!entered} aria-label={text.reset} title={text.reset} style={{ width: 44, height: 44 }}><RotateCcw size={14} aria-hidden="true" /></button>
        </> : <>
          <div className="desk-motion-shapes" role="group" aria-label={text.shapes}>
            {text.shapeNames.map((label, index) => <button key={index} type="button" onClick={() => action('shape', index)} disabled={!entered} aria-pressed={activeShape === index}>{label}</button>)}
          </div>
          <button className="desk-motion-icon-button" type="button" onClick={() => action('scatter')} disabled={!entered} aria-label={text.scatter} title={text.scatter} style={{ width: 44, height: 44 }}><Sparkles size={14} aria-hidden="true" /></button>
        </>}
      </footer>
      <p className="desk-motion-status" role="status" aria-live="polite">{status}</p>
    </section>
  )
}
