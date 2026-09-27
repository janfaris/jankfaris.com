import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type { Lang } from '../content'
import { alsoShipped, copy, featured, type FeaturedProject } from './copy'
import { gsap, ScrollTrigger } from './gsap'
import { Scramble } from './Scramble'

/** Lupa means magnifying glass; its panel shows the real pipeline under one. */
function LupaLens({ steps, label }: { steps: string[]; label: string }) {
  return <div className="b-lens">
    <div className="b-lens-glass">
      <span className="b-lens-scan" aria-hidden="true" />
      <ol aria-label={label}>
        {steps.map((step, i) => <li key={step} style={{ '--i': i } as CSSProperties}><span aria-hidden="true" />{step}</li>)}
      </ol>
    </div>
    <span className="b-lens-handle" aria-hidden="true" />
  </div>
}

function Panel({ project, lang }: { project: FeaturedProject; lang: Lang }) {
  const t = copy[lang]
  return <article className={`b-panel${project.video ? '' : ' b-panel-diagram'}`}>
    <h3 className="b-panel-name">{project.name}</h3>
    <div className="b-frame">
      {project.video
        ? <video className="b-video" src={project.video.src} poster={project.video.poster} muted loop playsInline preload="none" aria-label={`${project.name} demo`} />
        : project.pipeline && <LupaLens steps={project.pipeline[lang]} label={t.work.pipeline} />}
    </div>
    <div className="b-panel-info">
      <p className="b-meta">{project.meta[lang]}</p>
      <p className="b-panel-body">{project.body[lang]}</p>
      {project.note && <p className="b-panel-note">{project.note[lang]}</p>}
      {project.stats && <dl className="b-panel-stats">
        {project.stats.map(stat => <div key={stat.value}><dt>{stat.label[lang]}</dt><dd>{stat.value}</dd></div>)}
      </dl>}
      <p className="b-tech">{project.tech.join(' / ')}</p>
      <a className="b-link" href={project.link} target="_blank" rel="noreferrer">{project.linkLabel[lang]}<ArrowUpRight size={16} strokeWidth={1.75} /></a>
    </div>
  </article>
}

/**
 * Selected work. On wide screens the section becomes a horizontal reel driven
 * by vertical scroll, and each product is revealed through a widening lens.
 * Narrow screens, reduced motion, and no-JS get the same content as a column.
 */
export function WorkReel({ lang }: { lang: Lang }) {
  const t = copy[lang]
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = section.current
    const rail = track.current
    if (!root || !rail) return
    const media = gsap.matchMedia()
    media.add({ wide: '(min-width: 900px)', motion: '(prefers-reduced-motion: no-preference)' }, context => {
      const { wide, motion } = context.conditions as Record<string, boolean>
      if (!motion) return
      if (!wide) {
        // Phones get a compositor-only reveal; animating clip-path over video repaints every frame.
        gsap.utils.toArray<HTMLElement>('.b-frame', root).forEach(frame => gsap.fromTo(frame,
          { autoAlpha: .2, scale: .9, y: 48 },
          { autoAlpha: 1, scale: 1, y: 0, ease: 'none', scrollTrigger: { trigger: frame, start: 'top 98%', end: 'top 58%', scrub: true } }))
        return
      }
      root.classList.add('is-reel')
      const distance = () => Math.max(0, rail.scrollWidth - window.innerWidth)
      const size = () => { root.style.height = `${distance() + window.innerHeight}px` }
      size()
      ScrollTrigger.addEventListener('refreshInit', size)
      const pan = gsap.to(rail, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: .7, invalidateOnRefresh: true },
      })
      gsap.utils.toArray<HTMLElement>('.b-panel', root).forEach(panel => {
        const frame = panel.querySelector('.b-frame')
        const name = panel.querySelector('.b-panel-name')
        if (frame) gsap.fromTo(frame,
          { clipPath: 'circle(8% at 50% 50%)' },
          { clipPath: 'circle(75% at 50% 50%)', ease: 'none', scrollTrigger: { trigger: panel, containerAnimation: pan, start: 'left 96%', end: 'left 32%', scrub: true } })
        if (name) gsap.fromTo(name,
          { xPercent: 14 },
          { xPercent: -8, ease: 'none', scrollTrigger: { trigger: panel, containerAnimation: pan, start: 'left right', end: 'right left', scrub: true } })
      })
      return () => {
        ScrollTrigger.removeEventListener('refreshInit', size)
        root.style.height = ''
        root.classList.remove('is-reel')
      }
    })
    return () => media.revert()
  }, [])

  // Demos play only while on screen, and never under reduced motion. Phones
  // decode one at a time: only the most visible demo plays.
  useEffect(() => {
    const root = section.current
    if (!root) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const single = window.matchMedia('(max-width: 899px), (pointer: coarse)').matches
    const videos = Array.from(root.querySelectorAll('video'))
    const ratios = new Map<HTMLVideoElement, number>()
    videos.forEach(video => { video.controls = reduced.matches })
    const sync = () => {
      const threshold = single ? .6 : .35
      const best = single ? [...ratios].sort((a, b) => b[1] - a[1])[0]?.[0] : undefined
      for (const video of videos) {
        const ratio = ratios.get(video) ?? 0
        const play = !reduced.matches && ratio >= threshold && (!single || video === best)
        if (play && video.paused) void video.play().catch(() => undefined)
        else if (!play && !video.paused) video.pause()
      }
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => ratios.set(entry.target as HTMLVideoElement, entry.intersectionRatio))
      sync()
    }, { threshold: [0, .35, .6, .8, 1] })
    videos.forEach(video => observer.observe(video))
    return () => observer.disconnect()
  }, [])

  return <section className="b-work" id="work" ref={section} aria-labelledby="b-work-title">
    <div className="b-work-stage">
      <div className="b-track" ref={track}>
        <div className="b-work-intro">
          <h2 className="b-h2" id="b-work-title"><Scramble text={t.work.title} /></h2>
          <p className="b-lede">{t.work.sub}</p>
          <dl className="b-proof">
            {t.work.stats.map(stat => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}
          </dl>
        </div>
        {featured.map(project => <Panel key={project.name} project={project} lang={lang} />)}
        <article className="b-panel b-panel-also">
          <h3 className="b-also-title"><Scramble text={t.work.also} /></h3>
          <ul>
            {alsoShipped.map(project => <li key={project.name}>
              <div className="b-also-media" aria-hidden={!project.image && !project.code}>
                {project.image ? <img src={project.image} alt={`${project.name} App Store artwork`} loading="lazy" /> : project.code ? <code>{project.code}</code> : <span>@{project.name}</span>}
              </div>
              <div>
                <h4>{project.name}</h4>
                <p className="b-meta">{project.meta[lang]}</p>
                <p>{project.body[lang]}</p>
                <a className="b-link" href={project.link} target="_blank" rel="noreferrer">{project.linkLabel[lang]}<ArrowUpRight size={15} strokeWidth={1.75} /></a>
              </div>
            </li>)}
          </ul>
        </article>
      </div>
    </div>
  </section>
}
