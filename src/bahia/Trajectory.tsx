import { useLayoutEffect, useRef, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { Lang } from '../content'
import { copy, stops } from './copy'
import { gsap, ScrollTrigger } from './gsap'
import { Scramble } from './Scramble'

function moveLens(event: PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect()
  event.currentTarget.style.setProperty('--lx', `${event.clientX - rect.left}px`)
  event.currentTarget.style.setProperty('--ly', `${event.clientY - rect.top}px`)
}

/**
 * Career as a flight path: the line draws itself as you scroll and each stop
 * lights up when the path reaches it. The portrait sits in the same blue as
 * the bay; a lens follows the pointer and shows it in full colour.
 */
export function Trajectory({ lang }: { lang: Lang }) {
  const t = copy[lang]
  const list = useRef<HTMLOListElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const track = useRef<SVGPathElement>(null)
  const line = useRef<SVGPathElement>(null)
  const glow = useRef<SVGPathElement>(null)
  const head = useRef<SVGCircleElement>(null)
  const halo = useRef<SVGCircleElement>(null)

  useLayoutEffect(() => {
    const ol = list.current
    const box = svg.current
    const faint = track.current
    const drawn = line.current
    const soft = glow.current
    const dot = head.current
    const ring = halo.current
    if (!ol || !box || !faint || !drawn || !soft || !dot || !ring) return
    let length = 1
    let progress = 1
    // The glow is a wide, faint copy of the stroke rather than a CSS filter,
    // which would re-rasterise on every scroll frame.
    const draw = () => {
      for (const path of [drawn, soft]) {
        path.style.strokeDasharray = `${length}`
        path.style.strokeDashoffset = `${length * (1 - progress)}`
      }
      const point = drawn.getPointAtLength(length * progress)
      for (const circle of [dot, ring]) {
        circle.setAttribute('cx', point.x.toFixed(1))
        circle.setAttribute('cy', point.y.toFixed(1))
      }
    }
    const build = () => {
      const height = ol.offsetHeight
      const marks = Array.from(ol.children).map(item => (item as HTMLElement).offsetTop + 30)
      let d = 'M 24 0'
      let previous = 0
      marks.concat(height).forEach((y, i) => {
        const sway = i % 2 ? 15 : -15
        d += ` C ${24 + sway} ${(previous + (y - previous) * .38).toFixed(1)} ${24 - sway} ${(previous + (y - previous) * .62).toFixed(1)} 24 ${y.toFixed(1)}`
        previous = y
      })
      box.setAttribute('viewBox', `0 0 48 ${height}`)
      box.style.height = `${height}px`
      faint.setAttribute('d', d)
      drawn.setAttribute('d', d)
      soft.setAttribute('d', d)
      length = drawn.getTotalLength() || 1
      draw()
    }
    build()
    const resize = new ResizeObserver(build)
    resize.observe(ol)
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      progress = 0
      draw()
      const items = Array.from(ol.children) as HTMLElement[]
      ScrollTrigger.create({ trigger: ol, start: 'top 66%', end: 'bottom 66%', scrub: .4, onUpdate: self => { progress = self.progress; draw() } })
      items.forEach(item => ScrollTrigger.create({
        trigger: item,
        start: 'top 68%',
        onEnter: () => item.classList.add('is-lit'),
        onLeaveBack: () => item.classList.remove('is-lit'),
      }))
      ol.classList.add('is-animated')
      return () => {
        progress = 1
        draw()
        ol.classList.remove('is-animated')
        items.forEach(item => item.classList.remove('is-lit'))
      }
    })
    return () => {
      resize.disconnect()
      media.revert()
    }
  }, [])

  return <section className="b-path" id="path" aria-labelledby="b-path-title">
    <div className="b-wrap">
      <h2 className="b-h2 b-path-title" id="b-path-title"><Scramble text={t.path.title} /></h2>
    </div>
    <div className="b-wrap b-path-grid">
      <div className="b-path-aside">
        <figure className="b-portrait" onPointerMove={moveLens} onPointerEnter={moveLens}>
          <img src="/jan-profile.jpg" alt={t.path.portrait} width={682} height={1024} loading="lazy" />
          <img className="b-portrait-color" src="/jan-profile.jpg" alt="" aria-hidden="true" loading="lazy" />
        </figure>
        <p className="b-lede">{t.path.intro}</p>
        <Link className="b-link" to={lang === 'es' ? '/es/resume' : '/resume'}>{t.path.resume}<ArrowUpRight size={16} strokeWidth={1.75} /></Link>
      </div>
      <div className="b-path-line">
        <svg className="b-path-svg" ref={svg} aria-hidden="true" preserveAspectRatio="none">
          <path className="b-path-track" ref={track} />
          <path className="b-path-glow" ref={glow} />
          <path className="b-path-drawn" ref={line} />
          <circle className="b-path-halo" ref={halo} r="14" cx="24" cy="0" />
          <circle className="b-path-head" ref={head} r="5" cx="24" cy="0" />
        </svg>
        <ol className="b-stops" ref={list}>
          {stops.map(stop => <li className="b-stop" key={stop.company}>
            <p className="b-meta">{stop.period[lang]}</p>
            <h3>{stop.company}</h3>
            <p className="b-stop-role">{stop.role}</p>
            <p className="b-stop-body">{stop.body[lang]}</p>
          </li>)}
        </ol>
      </div>
    </div>
  </section>
}
