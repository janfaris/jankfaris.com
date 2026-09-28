import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/geist-mono/wght.css'
import './bahia.css'
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUpRight, Menu, X } from 'lucide-react'
import { JFMark } from '../JFMark'
import type { Lang } from '../content'
import { formatNoteNumber, posts, type Post } from '../posts'
import { postsEs } from '../posts.es'
import BayCanvas2D from './BayCanvas2D'
import { createBayInput, hasWebGL, type BayInput } from './input'
import { motion, readReducedPreference, writeReducedPreference } from './motion'
import { createNightSound } from './coqui'
import { copy, EMAIL, socials } from './copy'
import { gsap, ScrollTrigger } from './gsap'
import { KineticName } from './KineticName'
import { Scramble } from './Scramble'
import { coastPaths } from './shapes'
import { Trajectory } from './Trajectory'
import { WorkReel } from './WorkReel'

// three.js loads in its own chunk so the hero copy never waits for the scene.
const BayBackdrop = lazy(() => import('./BayBackdrop'))
const MAILTO = `mailto:${EMAIL}?subject=Hola%20Jan`
// "Say hello" goes to LinkedIn; email stays one tap away in the contact section.
const LINKEDIN = 'https://www.linkedin.com/in/jan-faris-garcia'
const NOTE_NUMBERS = [8, 7, 4, 1]
const staticMap = coastPaths(1000, 400)

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const phase = (value: number, start: number, end: number) => clamp01((value - start) / (end - start))

/** ?diag on any page URL shows what this device reports, for remote debugging. */
function Diagnostics({ input, renderer, reduced }: { input: BayInput; renderer: string; reduced: boolean }) {
  const [text, setText] = useState('')
  useEffect(() => {
    const errors: string[] = []
    const onError = (event: ErrorEvent) => { errors.push(event.message) }
    window.addEventListener('error', onError)
    const probe = document.createElement('canvas').getContext('webgl2')
    const info = probe?.getExtension('WEBGL_debug_renderer_info')
    const gpu = probe ? String(info ? probe.getParameter(info.UNMASKED_RENDERER_WEBGL) : probe.getParameter(probe.RENDERER)) : 'none'
    let frames = 0
    let fps = 0
    let since = performance.now()
    let raf = 0
    const count = (now: number) => {
      frames++
      if (now - since >= 1000) { fps = frames * 1000 / (now - since); frames = 0; since = now }
      raf = requestAnimationFrame(count)
    }
    raf = requestAnimationFrame(count)
    const timer = window.setInterval(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('.b-backdrop canvas')
      setText([
        `renderer: ${renderer}${input.failed ? ' (shader error)' : ''}`,
        `motion: ${reduced ? 'reduced by footer switch' : 'on'}`,
        `iOS/OS reduce motion: ${window.matchMedia('(prefers-reduced-motion: reduce)').matches}`,
        `webgl2: ${Boolean(probe)} (${gpu})`,
        `scene frames: ${input.frames}  quality tier: ${canvas?.dataset.quality ?? '-'}`,
        `page fps: ${fps.toFixed(0)}  gsap frame: ${gsap.ticker.frame}`,
        `intro: ${document.querySelector<HTMLElement>('.bahia')?.dataset.intro}  visible: ${!document.hidden}`,
        `ua: ${navigator.userAgent}`,
        ...errors.slice(-3).map(message => `error: ${message}`),
      ].join('\n'))
    }, 500)
    return () => {
      window.removeEventListener('error', onError)
      window.clearInterval(timer)
      cancelAnimationFrame(raf)
    }
  }, [input, renderer, reduced])
  return <pre className="b-diag" aria-hidden="true">{text}</pre>
}

type Note = Post & { href: string; english: boolean }

function notesFor(lang: Lang): Note[] {
  return NOTE_NUMBERS.flatMap(number => {
    const en = posts.find(post => post.noteNumber === number)
    if (!en) return []
    const es = lang === 'es' ? postsEs.find(post => post.noteNumber === number) : undefined
    return [{ ...(es ?? en), href: es ? `/es/writing/${es.slug}` : `/writing/${en.slug}`, english: lang === 'es' && !es }]
  })
}

/**
 * Pointer position in the canvas's normalised device coordinates. The backdrop
 * is 100lvh tall so iOS toolbar changes never resize it, which means it can be
 * taller than innerHeight; measuring the backdrop keeps wakes under the finger.
 */
function toNdc(clientX: number, clientY: number) {
  const backdrop = document.querySelector<HTMLElement>('.b-backdrop')
  const width = backdrop?.clientWidth || window.innerWidth
  const height = backdrop?.clientHeight || window.innerHeight
  return { x: clientX / width * 2 - 1, y: -(clientY / height) * 2 + 1 }
}

/** San Juan's label follows the beacon the scene projects to the screen. */
function placeBeacon(label: HTMLElement | null, x: number, y: number, opacity: number) {
  if (!label) return
  const rounded = Math.round(opacity * 100) / 100
  if (rounded === 0 && label.style.opacity === '0') return
  // Near the right edge the label flips to the beacon's left so it never clips.
  const flip = x > window.innerWidth - 200
  label.classList.toggle('is-flipped', flip)
  label.style.opacity = String(rounded)
  label.style.transform = `translate3d(${(flip ? x - 14 - label.offsetWidth : x + 14).toFixed(1)}px, ${(y - 40).toFixed(1)}px, 0)`
}

function StaticIsland({ label, animate }: { label: string; animate: boolean }) {
  const map = useRef<SVGSVGElement>(null)
  // Without the particle scene, the coast still draws itself when it scrolls into view.
  useEffect(() => {
    const svg = map.current
    if (!svg || !animate) return
    svg.querySelectorAll('path').forEach(path => path.style.setProperty('--length', String(Math.ceil(path.getTotalLength()))))
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      svg.classList.add('is-drawn')
      observer.disconnect()
    }, { threshold: .3 })
    observer.observe(svg)
    return () => observer.disconnect()
  }, [animate])
  return <svg className={`b-isla-map${animate ? ' is-animated' : ''}`} ref={map} viewBox="0 0 1000 400" role="img" aria-label={label}>
    {staticMap.paths.map(d => <path key={d.slice(0, 24)} d={d} />)}
    <circle className="b-isla-ring" cx={staticMap.sanJuan.x} cy={staticMap.sanJuan.y} r="15" />
    <circle cx={staticMap.sanJuan.x} cy={staticMap.sanJuan.y} r="5" />
  </svg>
}

function NoteRow({ note, input, englishLabel }: { note: Note; input: BayInput; englishLabel: string }) {
  const [replay, setReplay] = useState(0)
  return <li>
    <Link
      className="b-note"
      to={note.href}
      hrefLang={note.english ? 'en' : undefined}
      onPointerEnter={event => {
        setReplay(value => value + 1)
        input.splashes.push({ ...toNdc(event.clientX, event.clientY), strength: .8 })
      }}
      onFocus={() => setReplay(value => value + 1)}
    >
      <span className="b-note-num">{formatNoteNumber(note.noteNumber)}</span>
      <Scramble className="b-note-title" text={note.title} replay={replay} />
      <span className="b-note-meta">{note.english && <abbr title="English">{englishLabel}</abbr>}{note.date} · {note.readTime}</span>
      <ArrowUpRight className="b-note-arrow" size={20} strokeWidth={1.5} aria-hidden="true" />
    </Link>
  </li>
}

export default function BahiaPage({ lang = 'en' }: { lang?: Lang }) {
  const t = copy[lang]
  const [reduced, setReduced] = useState(readReducedPreference)
  const [renderer, setRenderer] = useState<'webgl' | '2d'>(() => hasWebGL() ? 'webgl' : '2d')
  const diagnostics = useMemo(() => new URLSearchParams(window.location.search).has('diag'), [])
  // Stable, so the backdrop's context-loss recovery timer is not reset by re-renders.
  const fallbackTo2d = useCallback(() => setRenderer('2d'), [])
  const input = useMemo(() => createBayInput((x, y, opacity) => placeBeacon(document.getElementById('b-sj'), x, y, opacity)), [])
  const sound = useMemo(() => createNightSound(), [])
  const page = useRef<HTMLDivElement>(null)
  const nav = useRef<HTMLElement>(null)
  const island = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const contact = useRef<HTMLElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const menuPanel = useRef<HTMLElement>(null)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [soundOn, setSoundOn] = useState(false)
  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [glLost, setGlLost] = useState(false)
  const notes = useMemo(() => notesFor(lang), [lang])
  const navigate = useNavigate()
  const home = lang === 'es' ? '/es' : '/'
  const other = lang === 'es' ? '/' : '/es'

  // The footer switch is the only thing that turns motion down on this page.
  useLayoutEffect(() => {
    motion.reduced = reduced
    document.documentElement.classList.toggle('bahia-reduced', reduced)
    return () => document.documentElement.classList.remove('bahia-reduced')
  }, [reduced])

  // If the WebGL scene never produces a frame (driver, shader, or chunk failure),
  // switch to the 2D water so the page is never left without its motion.
  useEffect(() => {
    if (renderer !== 'webgl') return
    let visibleSeconds = 0
    const check = window.setInterval(() => {
      if (input.failed) { setRenderer('2d'); return }
      if (document.hidden) return
      visibleSeconds++
      if (visibleSeconds >= 5 && input.frames === 0) setRenderer('2d')
    }, 1000)
    return () => window.clearInterval(check)
  }, [input, renderer])

  // Page chrome: dark document and browser UI, no ambient glow from the old theme.
  useEffect(() => {
    const html = document.documentElement
    const themeColor = document.querySelector('meta[name="theme-color"]')
    const previousColor = themeColor?.getAttribute('content')
    html.classList.add('bahia-route')
    html.classList.remove('light')
    themeColor?.setAttribute('content', '#02060c')
    return () => {
      html.classList.remove('bahia-route')
      // Hand the rest of the site back its usual theme (same rule as main.tsx).
      html.classList.toggle('light', localStorage.getItem('theme') !== 'dark')
      if (previousColor && previousColor !== '#02060c') themeColor?.setAttribute('content', previousColor)
      else themeColor?.setAttribute('content', '#f5f4ed')
      sound.stop()
      clearTimeout(copiedTimer.current)
    }
  }, [sound])

  // Links shared from the previous homepage used ?view=work and ?view=writing.
  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get('view')
    if (view === 'writing') navigate(lang === 'es' ? '/es/writing' : '/writing', { replace: true })
    else if (view === 'work') requestAnimationFrame(() => document.getElementById('work')?.scrollIntoView())
  }, [lang, navigate])

  useEffect(() => {
    document.title = t.metaTitle
    document.documentElement.lang = lang
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.metaDescription)
    // Copy changes width when the language flips; re-measure once the text settles.
    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 900)
    return () => window.clearTimeout(refresh)
  }, [lang, t.metaTitle, t.metaDescription])

  // Safari can drop GSAP's pending frame while the page is suspended; wake the ticker on return.
  useEffect(() => {
    const wake = () => { if (!document.hidden) gsap.ticker.wake() }
    window.addEventListener('pageshow', wake)
    window.addEventListener('focus', wake)
    document.addEventListener('visibilitychange', wake)
    return () => {
      window.removeEventListener('pageshow', wake)
      window.removeEventListener('focus', wake)
      document.removeEventListener('visibilitychange', wake)
    }
  }, [])

  // Pointer and taps stir the water behind the content.
  useEffect(() => {
    if (reduced) return
    const pointer = input.pointer
    const aim = (clientX: number, clientY: number) => {
      const { x, y } = toNdc(clientX, clientY)
      pointer.x = x
      pointer.y = y
      pointer.moved = true
      pointer.lastMove = performance.now()
    }
    const move = (event: PointerEvent) => aim(event.clientX, event.clientY)
    const touch = (event: TouchEvent) => { const point = event.touches[0]; if (point) aim(point.clientX, point.clientY) }
    const down = (event: PointerEvent) => {
      if ((event.target as Element | null)?.closest?.('a, button, input, textarea, select, video, label')) return
      input.splashes.push({ ...toNdc(event.clientX, event.clientY), strength: event.pointerType === 'touch' ? .9 : 1.15 })
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('touchmove', touch, { passive: true })
    window.addEventListener('pointerdown', down, { passive: true })
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('touchmove', touch)
      window.removeEventListener('pointerdown', down)
    }
  }, [input, reduced])

  // One master timeline maps scroll position to the scene: rise over the
  // island, let it form, dissolve it back into the water, brighten at the end.
  useLayoutEffect(() => {
    const root = page.current
    const islandEl = island.current
    const stageEl = stage.current
    const contactEl = contact.current
    const navEl = nav.current
    const work = document.getElementById('work')
    if (!root || !islandEl || !stageEl || !contactEl || !navEl || !work) return
    const media = gsap.matchMedia()
    media.add('all', () => {
      if (!reduced) root.classList.add('is-motion')
      let offsets = { island: 0, islandHeight: 1, work: 0, contact: 0 }
      let step = ''
      let caption = ''
      const measure = () => {
        const top = (element: HTMLElement) => element.getBoundingClientRect().top + window.scrollY
        offsets = { island: top(islandEl), islandHeight: islandEl.offsetHeight, work: top(work), contact: top(contactEl) }
      }
      const update = (y: number) => {
        navEl.classList.toggle('is-scrolled', y > 40)
        if (reduced) return
        const vh = window.innerHeight
        const enter = phase(y, offsets.island - vh, offsets.island)
        const stuck = phase(y, offsets.island, offsets.island + offsets.islandHeight - vh)
        const leave = phase(y, offsets.work - vh, offsets.work - vh * .12)
        const targets = input.targets
        targets.lift = .2 * enter + .8 * phase(stuck, 0, .42)
        targets.morph = (.1 * enter + .9 * phase(stuck, .04, .46)) * (1 - leave)
        targets.settle = leave
        targets.dim = phase(y, offsets.work - vh * .6, offsets.work) * (1 - phase(y, offsets.contact - vh, offsets.contact - vh * .35))
        targets.boost = phase(y, offsets.contact - vh * .9, offsets.contact - vh * .1)
        const nextStep = stuck <= 0 ? 'none' : stuck < .56 ? '0' : '1'
        if (nextStep !== step) { step = nextStep; stageEl.dataset.step = step }
        const nextCaption = String(stuck > .64)
        if (nextCaption !== caption) { caption = nextCaption; stageEl.dataset.caption = caption }
      }
      measure()
      const master = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: self => {
          if (!reduced) input.velocity.value = self.getVelocity()
          update(self.scroll())
        },
        onRefresh: self => { measure(); update(self.scroll()) },
      })
      update(window.scrollY)
      void document.fonts?.ready.then(() => ScrollTrigger.refresh())
      return () => {
        master.kill()
        root.classList.remove('is-motion')
        Object.assign(input.targets, { lift: 0, morph: 0, settle: 0, dim: 0, boost: 0 })
        delete stageEl.dataset.step
        delete stageEl.dataset.caption
      }
    })
    return () => media.revert()
  }, [input, reduced])

  // Entrance: the name rises out of the water once the display face is ready.
  useLayoutEffect(() => {
    const root = page.current
    if (!root) return
    if (readReducedPreference()) {
      root.dataset.intro = 'done'
      return
    }
    root.dataset.intro = 'pending'
    let cancelled = false
    let timeline: gsap.core.Timeline | undefined
    const fontReady = document.fonts?.load("600 100px 'Archivo Variable'") ?? Promise.resolve()
    void Promise.race([fontReady, new Promise(resolve => setTimeout(resolve, 900))]).then(() => {
      if (cancelled) return
      root.dataset.intro = 'running'
      timeline = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => { root.dataset.intro = 'done' } })
      timeline
        .from(root.querySelectorAll('.b-letter'), { yPercent: 118, duration: 1.6, stagger: .055 }, .15)
        .from(root.querySelectorAll('.b-reveal'), { y: 24, autoAlpha: 0, duration: 1.2, stagger: .09 }, .7)
        .from(root.querySelector('.b-nav'), { y: -18, autoAlpha: 0, duration: 1.1 }, .85)
    })
    return () => {
      cancelled = true
      // Revert, not kill: a killed from() tween would leave the name and nav
      // parked in their hidden start state if the effect runs again.
      timeline?.revert()
      root.dataset.intro = 'done'
    }
  }, [])

  // Primary buttons lean toward the pointer.
  useEffect(() => {
    const root = page.current
    if (!root || reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const cleanups = Array.from(root.querySelectorAll<HTMLElement>('[data-magnetic]')).map(button => {
      const x = gsap.quickTo(button, 'x', { duration: .7, ease: 'elastic.out(1, .45)' })
      const y = gsap.quickTo(button, 'y', { duration: .7, ease: 'elastic.out(1, .45)' })
      const move = (event: PointerEvent) => {
        const rect = button.getBoundingClientRect()
        x((event.clientX - rect.left - rect.width / 2) * .28)
        y((event.clientY - rect.top - rect.height / 2) * .38)
      }
      const leave = () => { x(0); y(0) }
      button.addEventListener('pointermove', move)
      button.addEventListener('pointerleave', leave)
      return () => {
        button.removeEventListener('pointermove', move)
        button.removeEventListener('pointerleave', leave)
        gsap.set(button, { clearProps: 'transform' })
      }
    })
    return () => cleanups.forEach(cleanup => cleanup())
  }, [reduced])

  // Mobile menu: focus moves in, Escape closes, focus returns to the toggle.
  useEffect(() => {
    if (!menuOpen) return
    const opener = menuButton.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    menuPanel.current?.querySelector<HTMLElement>('a')?.focus()
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false) }
    const resize = () => { if (window.innerWidth > 860) setMenuOpen(false) }
    window.addEventListener('keydown', key)
    window.addEventListener('resize', resize)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', key)
      window.removeEventListener('resize', resize)
      opener?.focus()
    }
  }, [menuOpen])

  const toggleSound = () => {
    if (soundOn) sound.stop()
    else void sound.start()
    setSoundOn(!soundOn)
  }

  const copyEmail = async (event: MouseEvent<HTMLButtonElement>) => {
    const { clientX, clientY } = event
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      clearTimeout(copiedTimer.current)
      copiedTimer.current = setTimeout(() => setCopied(false), 2200)
      input.splashes.push({ ...toNdc(clientX, clientY), strength: 1.4 })
    } catch {
      window.location.href = MAILTO
    }
  }

  const goToWork = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    setMenuOpen(false)
    document.getElementById('work')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
  }

  const links = <>
    <a href="#work" onClick={goToWork}>{t.nav.work}</a>
    <Link to={lang === 'es' ? '/es/writing' : '/writing'}>{t.nav.notes}</Link>
    <Link to={lang === 'es' ? '/es/resume' : '/resume'}>{t.nav.resume}</Link>
  </>

  return <div className="bahia" ref={page}>
    <a className="b-skip" href="#b-main">{t.skip}</a>
    {renderer === 'webgl'
      ? <Suspense fallback={null}><BayBackdrop input={input} onLost={setGlLost} onFail={fallbackTo2d} reduced={reduced} /></Suspense>
      : <BayCanvas2D input={input} reduced={reduced} />}
    <div className="b-grain" aria-hidden="true" />

    <header className="b-nav" ref={nav}>
      <Link className="b-brand" to={home} aria-label="Jan Faris" onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })}>
        <JFMark size={30} />
        <span>Jan Faris</span>
      </Link>
      <nav className="b-nav-links" aria-label={lang === 'es' ? 'Navegación principal' : 'Main navigation'}>{links}</nav>
      <div className="b-nav-actions">
        <Link className="b-lang" to={other} hrefLang={lang === 'es' ? 'en' : 'es'} aria-label={t.nav.switchLabel}>{t.nav.switchTo}</Link>
        <button className="b-sound" type="button" aria-pressed={soundOn} aria-label={t.sound.label} title={t.sound.label} onClick={toggleSound}>
          <span className="b-eq" aria-hidden="true"><i /><i /><i /><i /></span>
          <span className="b-sound-text" aria-hidden="true">{soundOn ? t.sound.on : t.sound.off}</span>
        </button>
        <a className="b-btn b-btn-primary b-nav-cta" href={LINKEDIN} target="_blank" rel="noreferrer">{t.hello}</a>
        <button className="b-menu-btn" type="button" ref={menuButton} aria-expanded={menuOpen} aria-controls="b-menu" aria-label={menuOpen ? t.nav.close : t.nav.menu} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
        </button>
      </div>
    </header>
    {menuOpen && <nav className="b-menu" id="b-menu" ref={menuPanel} aria-label={t.nav.menu}>
      {links}
      <a href={LINKEDIN} target="_blank" rel="noreferrer">{t.hello}</a>
    </nav>}

    {renderer === 'webgl' && !glLost && !reduced && <div className="b-sj" id="b-sj" aria-hidden="true">
      <span className="b-sj-name">San Juan</span>
      <span className="b-sj-coords">18.47° N, 66.11° W</span>
    </div>}

    <main id="b-main" className="b-main" inert={menuOpen}>
      <section className="b-hero" aria-label="Jan Faris">
        <div className="b-hero-row">
          <p className="b-eyebrow b-reveal">{t.hero.eyebrow}</p>
          <div className="b-hero-copy">
            <p className="b-hero-sub b-reveal"><Scramble text={t.hero.sub} duration={900} /></p>
            <div className="b-ctas b-reveal">
              <a className="b-btn b-btn-primary" href="#work" onClick={goToWork} data-magnetic><Scramble text={t.hero.work} /><ArrowDown size={16} strokeWidth={2} aria-hidden="true" /></a>
              <a className="b-btn b-btn-ghost" href={LINKEDIN} target="_blank" rel="noreferrer" data-magnetic><Scramble text={t.hello} /></a>
            </div>
          </div>
        </div>
        <KineticName reduced={reduced} />
      </section>

      <section className="b-isla" ref={island} aria-labelledby="b-isla-title">
        <div className="b-isla-stage" ref={stage}>
          {(renderer === '2d' || reduced || glLost) && <StaticIsland label={t.island.mapLabel} animate={!reduced} />}
          <div className="b-wrap b-isla-copy">
            <div className="b-isla-steps">
              {t.island.steps.map((step, i) => <div className="b-isla-step" key={i}>
                <h2 className="b-h2" id={i === 0 ? 'b-isla-title' : undefined}><Scramble text={step.title} /></h2>
                <p className="b-lede">{step.body}</p>
              </div>)}
            </div>
          </div>
          <p className="b-isla-caption">{t.island.caption}</p>
        </div>
      </section>

      <WorkReel lang={lang} reduced={reduced} />
      <Trajectory lang={lang} reduced={reduced} />

      <section className="b-notes" aria-labelledby="b-notes-title">
        <div className="b-wrap">
          <h2 className="b-h2" id="b-notes-title"><Scramble text={t.notes.title} /></h2>
          <p className="b-lede">{t.notes.sub}</p>
          <ol className="b-note-list">
            {notes.map(note => <NoteRow key={note.slug} note={note} input={input} englishLabel={t.notes.english} />)}
          </ol>
          <div className="b-notes-foot">
            <Link className="b-link" to={lang === 'es' ? '/es/writing' : '/writing'}>{t.notes.all}<ArrowUpRight size={16} strokeWidth={1.75} /></Link>
            <p>{t.notes.tool} <Link className="b-inline" to={lang === 'es' ? '/es/ai-readiness' : '/ai-readiness'}>{t.notes.toolName}</Link>, {t.notes.toolTail}</p>
          </div>
        </div>
      </section>

      <section className="b-contact" ref={contact} aria-labelledby="b-contact-title">
        <div className="b-wrap">
          <h2 className="b-contact-title" id="b-contact-title"><Scramble text={t.contact.title} duration={900} /></h2>
          <p className="b-lede">{t.contact.body}</p>
          <div className="b-contact-actions">
            <a className="b-btn b-btn-primary" href={LINKEDIN} target="_blank" rel="noreferrer" data-magnetic><Scramble text={t.hello} /><ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" /></a>
            <div className="b-email">
              <a href={MAILTO}>{EMAIL}</a>
              <button type="button" onClick={copyEmail}><span role="status">{copied ? t.contact.copied : t.contact.copy}</span></button>
            </div>
          </div>
        </div>
      </section>
    </main>

    {diagnostics && <Diagnostics input={input} renderer={renderer} reduced={reduced} />}
    <footer className="b-footer">
      <div className="b-wrap b-footer-row">
        <p>{t.footer}</p>
        <nav aria-label={lang === 'es' ? 'Redes' : 'Social'}>
          {socials.map(social => <a key={social.label} href={social.href} target="_blank" rel="noreferrer">{social.label}</a>)}
          <button className="b-motion-switch" type="button" aria-pressed={reduced} onClick={() => { writeReducedPreference(!reduced); setReduced(!reduced) }}>
            {reduced ? t.motionOn : t.motionOff}
          </button>
        </nav>
      </div>
    </footer>
  </div>
}
