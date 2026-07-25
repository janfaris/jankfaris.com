import { Link } from 'react-router-dom'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import './index.css'
import './App.css'
import { JFMark } from './JFMark.tsx'
import { HeroField } from './HeroField.tsx'
import { formatNoteNumber, posts } from './posts'
import { postsEs } from './posts.es'
import { content as siteContent, type Lang, type Project } from './content'

interface Props { lang?: Lang }

/* ============================================
   Small components
   ============================================ */

function SectionTitle({ label }: { label: string }) {
  return <h2 className="section-title" data-reveal>{label}</h2>
}

/** Dot-and-line flow diagram: how a project actually works, one glance. */
function Pipeline({ steps }: { steps: string[] }) {
  return (
    <div className="pipeline" aria-label={steps.join(' to ')}>
      {steps.map((step, i) => (
        <span key={step} className="pipe-seg">
          {i > 0 && <span className="pipe-line" aria-hidden="true" />}
          <span className="pipe-step">
            <span className="pipe-dot" aria-hidden="true" />
            {step}
          </span>
        </span>
      ))}
    </div>
  )
}

/** Puerto Rico rendered in the hero wave's particle language.
 *  Outlines are real lon/lat coastline points, projected to the viewBox,
 *  so the silhouette (and Vieques / Culebra placement) matches the map. */
const PR_COAST: [number, number][] = [
  // clockwise from the northwest corner (Aguadilla)
  [-67.16, 18.47], [-66.95, 18.49], [-66.70, 18.485], [-66.45, 18.475],
  [-66.20, 18.465], [-66.10, 18.47], [-65.99, 18.455], [-65.83, 18.425],
  [-65.65, 18.38], [-65.59, 18.30], [-65.62, 18.22], [-65.72, 18.05],
  [-65.85, 17.97], [-66.05, 17.955], [-66.30, 17.94], [-66.55, 17.985],
  [-66.85, 17.95], [-67.05, 17.93], [-67.20, 17.935], [-67.17, 18.05],
  [-67.16, 18.18], [-67.21, 18.26], [-67.27, 18.36], [-67.23, 18.43],
]
const VIEQUES: [number, number][] = [
  [-65.57, 18.11], [-65.45, 18.16], [-65.30, 18.15], [-65.27, 18.10],
  [-65.40, 18.05], [-65.53, 18.07],
]
const CULEBRA: [number, number][] = [
  [-65.34, 18.32], [-65.27, 18.35], [-65.22, 18.31], [-65.28, 18.27], [-65.33, 18.28],
]
// project lon/lat to viewBox units (equal-ish aspect at PR's latitude)
const prX = (lon: number) => ((lon + 67.27) / 1.68) * 100
const prY = (lat: number) => ((18.52 - lat) / 0.59) * 39

function inPolygon(x: number, y: number, poly: [number, number][]) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = prX(poly[i][0]), yi = prY(poly[i][1])
    const xj = prX(poly[j][0]), yj = prY(poly[j][1])
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
const PR_DOTS: { x: number; y: number; o: number; p: number }[] = (() => {
  const dots: { x: number; y: number; o: number; p: number }[] = []
  for (const isle of [PR_COAST, VIEQUES, CULEBRA]) {
    for (let y = 0; y <= 39; y += 2.2) {
      for (let x = 0; x <= 123; x += 2.2) {
        if (inPolygon(x, y, isle)) {
          // deterministic pseudo-random opacity per dot
          const h = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1
          // A second, decorrelated hash scatters where each dot sits in the
          // glint cycle. Without it the highlight sweeps as a clean vertical
          // front; with it, single dots light up ahead of and behind the
          // front, which is what reads as an island coming alive.
          const j = Math.abs(Math.sin(x * 39.3468 + y * 11.135) * 24634.6345) % 1
          // Dots to the west sit later in the cycle, so they fire first and
          // the front travels Aguadilla → Vieques.
          const phase = 0.94 * (1 - x / 123) + (j - 0.5) * 0.2
          dots.push({ x, y, o: 0.35 + h * 0.55, p: ((phase % 1) + 1) % 1 })
        }
      }
    }
  }
  return dots
})()

function PRDotMap() {
  return (
    <svg className="pr-map" viewBox="-2 -2 127 43" aria-hidden="true">
      {PR_DOTS.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r="0.8"
          style={{ '--o': d.o, '--p': d.p } as CSSProperties}
        />
      ))}
    </svg>
  )
}

/** Demo media available in /public/demos per project slug. */
const DEMO_MEDIA: Record<string, 'video' | 'image'> = {
  lupa: 'video',
  demotape: 'video',
  blok: 'video',
  vantage: 'video',
  wandr: 'video',
  janga: 'image',
  usableai: 'image',
}

function CardMedia({
  slug,
  name,
  playInView = false,
}: {
  slug: string
  name: string
  playInView?: boolean
}) {
  const kind = DEMO_MEDIA[slug]
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !playInView) return

    const play = () => {
      // Keep the property set explicitly for iOS Safari's autoplay policy.
      video.muted = true
      void video.play().catch((error: DOMException) => {
        if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
          console.warn(`Could not play the ${name} preview.`, error)
        }
      })
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) play()
        else video.pause()
      },
      { threshold: 0.2, rootMargin: '48px 0px' },
    )
    observer.observe(video)
    video.addEventListener('canplay', play)

    return () => {
      observer.disconnect()
      video.removeEventListener('canplay', play)
      video.pause()
    }
  }, [name, playInView])

  if (kind === 'video') {
    return (
      <video
        ref={videoRef}
        className="card-demo"
        src={`/demos/${slug}.mp4`}
        poster={`/demos/${slug}.jpg`}
        autoPlay={playInView}
        muted
        loop
        playsInline
        preload={playInView ? 'auto' : 'metadata'}
        aria-label={`${name} demo`}
      />
    )
  }
  if (kind === 'image') {
    return (
      <img
        className="card-demo"
        src={`/demos/${slug}.jpg`}
        alt={`${name} preview`}
        loading={playInView ? 'eager' : 'lazy'}
      />
    )
  }
  return <Wordmark slug={slug} />
}

/** Split a string into individual words for staggered animation.
 *  `offset` continues the stagger across the lead/em/tail fragments of the
 *  headline so the rise reads as one sweep rather than three restarts. */
function splitWords(text: string, offset = 0) {
  let word = 0
  return text.split(/(\s+)/).map((tok, i) => {
    // Splitting on a capture group yields empty strings at the edges when the
    // fragment starts or ends with a space; they must not consume an index.
    if (tok === '') return null
    if (/^\s+$/.test(tok)) return <span key={i}>{tok}</span>
    const index = offset + word++
    return (
      <span key={i} className="reveal-word" style={{ '--i': index } as CSSProperties}>
        {tok}
      </span>
    )
  })
}

/** Number of animatable words in a fragment, for continuing the stagger. */
function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length
}

/** Settle [data-reveal] elements as they scroll into view, once each.
 *  Under reduced motion everything is revealed immediately and no observer
 *  is created. */
function useScrollReveal(deps: unknown[] = []) {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (!targets.length) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach((el) => el.classList.add('is-in'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-in')
          observer.unobserve(entry.target)
        }
      },
      // Fire a little before the element is fully in view, and treat anything
      // already on screen at load as visible.
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' },
    )
    targets.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

type TechMark = { name: string; kind: string }

const TECH_LOGOS: Record<string, string> = {
  Claude: 'claude',
  Gemini: 'googlegemini',
  'GitHub Copilot': 'githubcopilot',
  ElevenLabs: 'elevenlabs',
  TypeScript: 'typescript',
  Python: 'python',
  JavaScript: 'javascript',
  C: 'c',
  Perl: 'perl',
  React: 'react',
  'Next.js': 'nextdotjs',
  'Node.js': 'nodedotjs',
  Expo: 'expo',
  'Tailwind CSS': 'tailwindcss',
  Zod: 'zod',
  FFmpeg: 'ffmpeg',
  AKS: 'kubernetes',
  PostgreSQL: 'postgresql',
  Supabase: 'supabase',
  Snowflake: 'snowflake',
  'Databricks Genie': 'databricks',
  Retool: 'retool',
  'GitHub Actions': 'githubactions',
  OpenTelemetry: 'opentelemetry',
  Vercel: 'vercel',
  npm: 'npm',
  Stripe: 'stripe',
  'WhatsApp API': 'whatsapp',
  PageSpeed: 'pagespeedinsights',
  'Google Maps': 'googlemaps',
}

const TECH_USAGE: Record<string, string[]> = {
  Claude: ['Vantage', 'Blok'],
  'OpenAI GPT': ['usableai'],
  Gemini: ['Lupa', 'Wandr'],
  'GitHub Copilot': ['Microsoft'],
  'Copilot CLI': ['Microsoft · PRPilot'],
  'Microsoft Scout': ['Microsoft · PRPilot'],
  WorkIQ: ['Microsoft · PRPilot'],
  MCP: ['Microsoft · PRPilot', 'agent tooling'],
  ElevenLabs: ['Vantage'],
  'Vision QA': ['usableai'],
  'GPT Image': ['usableai'],
  TypeScript: ['Microsoft', 'Xtillion', 'Lupa', 'demotape'],
  Python: ['Microsoft', 'Pratt & Whitney'],
  JavaScript: ['AI products', 'client platforms'],
  SQL: ['Xtillion', 'Pratt & Whitney'],
  'C#': ['Xtillion'],
  C: ['Pratt & Whitney'],
  Perl: ['Pratt & Whitney'],
  React: ['Microsoft', 'Xtillion', 'Lupa'],
  'Next.js': ['Lupa', 'Vantage', 'Blok'],
  'Node.js': ['Xtillion', 'demotape', 'usableai'],
  'React Native': ['Janga'],
  Expo: ['Janga'],
  'Tailwind CSS': ['Lupa', 'AI products'],
  Zod: ['demotape', 'spanish-tone-spec'],
  Playwright: ['demotape'],
  FFmpeg: ['demotape'],
  Azure: ['Microsoft'],
  AKS: ['Microsoft'],
  'AWS Lambda': ['production infrastructure'],
  'Amazon S3': ['production infrastructure'],
  'AWS SES': ['Xtillion'],
  PostgreSQL: ['Lupa', 'Janga', 'Wandr'],
  Supabase: ['Lupa', 'Janga', 'Wandr'],
  Snowflake: ['Xtillion'],
  'Databricks Genie': ['Xtillion'],
  'SQL Server': ['Xtillion'],
  dbt: ['Xtillion'],
  Retool: ['Xtillion'],
  'GitHub Actions': ['Xtillion', 'Pratt & Whitney'],
  OpenTelemetry: ['Microsoft'],
  Geneva: ['Microsoft'],
  'Azure DevOps': ['Microsoft'],
  Vercel: ['Lupa', 'Vantage', 'Wandr', 'this portfolio'],
  npm: ['demotape', 'spanish-tone-spec'],
  Stripe: ['Lupa', 'Vantage'],
  Twilio: ['Blok'],
  'WhatsApp API': ['Lupa', 'Blok'],
  PageSpeed: ['Lupa'],
  'Google Maps': ['Lupa'],
  'Google Places': ['Lupa'],
  SerpAPI: ['Wandr'],
  'REST APIs': ['Microsoft', 'Xtillion', 'AI products'],
  'OpenText Fax': ['Xtillion'],
}

function techMonogram(name: string) {
  if (name.length <= 3) return name
  const words = name.replace(/[^a-zA-Z0-9 ]/g, ' ').split(/\s+/).filter(Boolean)
  return words.length > 1 ? words.slice(0, 2).map((word) => word[0]).join('') : name.slice(0, 2)
}

const TECH_ROWS: TechMark[][] = [
  [
    { name: 'Claude', kind: 'LLM' },
    { name: 'OpenAI GPT', kind: 'LLM' },
    { name: 'Gemini', kind: 'LLM' },
    { name: 'GitHub Copilot', kind: 'Agent' },
    { name: 'Copilot CLI', kind: 'Agent runtime' },
    { name: 'Microsoft Scout', kind: 'Agent' },
    { name: 'WorkIQ', kind: 'Agent tools' },
    { name: 'MCP', kind: 'Protocol' },
    { name: 'ElevenLabs', kind: 'Voice' },
    { name: 'Vision QA', kind: 'Multimodal' },
    { name: 'GPT Image', kind: 'Image gen' },
    { name: 'TypeScript', kind: 'Language' },
    { name: 'Python', kind: 'Language' },
    { name: 'JavaScript', kind: 'Language' },
    { name: 'SQL', kind: 'Language' },
    { name: 'C#', kind: 'Language' },
    { name: 'C', kind: 'Language' },
    { name: 'Perl', kind: 'Language' },
    { name: 'React', kind: 'Frontend' },
    { name: 'Next.js', kind: 'Full-stack' },
    { name: 'Node.js', kind: 'Runtime' },
    { name: 'React Native', kind: 'Mobile' },
    { name: 'Expo', kind: 'Mobile' },
    { name: 'Tailwind CSS', kind: 'Frontend' },
    { name: 'Zod', kind: 'Validation' },
    { name: 'Playwright', kind: 'Automation' },
    { name: 'FFmpeg', kind: 'Media' },
  ],
  [
    { name: 'Azure', kind: 'Cloud' },
    { name: 'AKS', kind: 'Kubernetes' },
    { name: 'AWS Lambda', kind: 'Compute' },
    { name: 'Amazon S3', kind: 'Storage' },
    { name: 'AWS SES', kind: 'Email' },
    { name: 'PostgreSQL', kind: 'Database' },
    { name: 'Supabase', kind: 'Platform' },
    { name: 'Snowflake', kind: 'Warehouse' },
    { name: 'Databricks Genie', kind: 'Data + AI' },
    { name: 'SQL Server', kind: 'Database' },
    { name: 'dbt', kind: 'Transformation' },
    { name: 'Retool', kind: 'Internal tools' },
    { name: 'GitHub Actions', kind: 'CI/CD' },
    { name: 'OpenTelemetry', kind: 'Observability' },
    { name: 'Geneva', kind: 'Telemetry' },
    { name: 'Azure DevOps', kind: 'DevOps' },
    { name: 'Vercel', kind: 'Deployment' },
    { name: 'npm', kind: 'Open source' },
    { name: 'Stripe', kind: 'Payments' },
    { name: 'Twilio', kind: 'Messaging' },
    { name: 'WhatsApp API', kind: 'Messaging' },
    { name: 'PageSpeed', kind: 'Web quality' },
    { name: 'Google Maps', kind: 'Location' },
    { name: 'Google Places', kind: 'Location' },
    { name: 'SerpAPI', kind: 'Search' },
    { name: 'REST APIs', kind: 'Backend' },
    { name: 'OpenText Fax', kind: 'Enterprise' },
  ],
]

/** A client-logo-style marquee for the complete production toolchain. */
function TechMarquee({ lang }: { lang: Lang }) {
  // Reduced motion parks the rails; the toggle still offers to start them,
  // so the control and what's on screen always agree.
  const [paused, setPaused] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [activeTech, setActiveTech] = useState<string | null>(null)
  const copy = lang === 'es'
    ? {
        eyebrow: 'Stack de producción',
        title: 'De modelos a producción.',
        body: 'Un stack usado de verdad — en productos de IA lanzados y sistemas empresariales en producción.',
        pause: 'Pausar movimiento',
        play: 'Reanudar movimiento',
        usageLabel: 'Dónde lo usé',
        usedIn: 'Usado en',
        usageHint: 'Pasa el cursor o toca una tecnología para ver la evidencia.',
      }
    : {
        eyebrow: 'Production stack',
        title: 'From models to production.',
        body: 'A working stack, not a keyword list — used across shipped AI products and production systems.',
        pause: 'Pause motion',
        play: 'Resume motion',
        usageLabel: 'Where it shipped',
        usedIn: 'Used in',
        usageHint: 'Hover, focus, or tap a technology to see the evidence.',
      }

  const activeUsage = activeTech ? TECH_USAGE[activeTech] ?? ['production work'] : null

  return (
    <section className="tech-marquee" aria-labelledby="tech-marquee-title">
      <div className="tech-marquee-head" data-reveal>
        <div>
          <span className="tech-marquee-eyebrow">{copy.eyebrow}</span>
          <h2 id="tech-marquee-title" className="tech-marquee-title">{copy.title}</h2>
        </div>
        <div className="tech-marquee-aside">
          <p className="tech-marquee-copy">{copy.body}</p>
          <button
            type="button"
            className="tech-motion-toggle"
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? copy.play : copy.pause}
            aria-pressed={paused}
          >
            <span aria-hidden="true">{paused ? '▶' : 'Ⅱ'}</span>
            {paused ? copy.play : copy.pause}
          </button>
        </div>
      </div>

      <div className={`tech-rails${paused ? ' is-paused' : ''}`} aria-label={TECH_ROWS.flat().map((tech) => tech.name).join(', ')}>
        {TECH_ROWS.map((row, rowIndex) => (
          <div className="tech-rail" key={rowIndex}>
            <div className={`tech-track tech-track-${rowIndex + 1}`}>
              {[0, 1].map((copyIndex) => (
                <ul className="tech-list" key={copyIndex} aria-hidden={copyIndex === 1 ? 'true' : undefined}>
                  {row.map((tech) => (
                    <li className="tech-item" key={tech.name}>
                      <button
                        type="button"
                        className="tech-mark"
                        tabIndex={copyIndex === 1 ? -1 : 0}
                        aria-pressed={activeTech === tech.name}
                        aria-label={`${tech.name}. ${copy.usedIn} ${(TECH_USAGE[tech.name] ?? ['production work']).join(', ')}`}
                        onMouseEnter={() => setActiveTech(tech.name)}
                        onFocus={() => setActiveTech(tech.name)}
                        onClick={() => setActiveTech((current) => current === tech.name ? null : tech.name)}
                      >
                        <span className="tech-mark-logo" aria-hidden="true">
                          {TECH_LOGOS[tech.name] ? (
                            <img src={`/icons/tech/${TECH_LOGOS[tech.name]}.svg`} alt="" />
                          ) : (
                            <span className="tech-mark-monogram">{techMonogram(tech.name)}</span>
                          )}
                        </span>
                        <span className="tech-mark-copy">
                          <span className="tech-mark-name">{tech.name}</span>
                          <span className="tech-mark-kind">{tech.kind}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        ))}
        <div className="tech-context" aria-live="polite">
          <span className="tech-context-label">{activeTech ?? copy.usageLabel}</span>
          <span className="tech-context-value">
            {activeTech && activeUsage ? `${copy.usedIn} ${activeUsage.join(' · ')}` : copy.usageHint}
          </span>
        </div>
      </div>
    </section>
  )
}

/** Dot-wave motif — the hero wave's signature, echoed in 2D.
 *  Every dot runs the same vertical sine; the per-dot phase offset is what
 *  makes the shape a wave, and offsetting it against the clock is what makes
 *  that wave travel. `--y` is the resting offset (the animation's first
 *  frame), used when motion is reduced. */
function DotWave() {
  const dots = Array.from({ length: 56 }, (_, i) => {
    const t = i / 55
    // 2.4π across the strip = 1.2 cycles; negated so the wave travels right.
    const p = (((-1.2 * t) % 1) + 1) % 1
    return {
      x: 8 + t * 464,
      y: Math.sin(p * Math.PI * 2) * 8,
      p,
      o: (0.25 + 0.75 * Math.sin(t * Math.PI)) * 0.8,
    }
  })
  return (
    <svg className="dot-wave" viewBox="0 0 480 32" aria-hidden="true">
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy="16"
          r="1.6"
          fill="var(--indigo)"
          opacity={d.o}
          style={{ '--y': `${d.y}px`, '--p': d.p } as CSSProperties}
        />
      ))}
    </svg>
  )
}

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (stored) return stored
    return 'light'
  })
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    localStorage.setItem('theme', theme)
  }, [theme])
  return { theme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark') }
}

function TopBar({ lang }: { lang: Lang }) {
  const { theme, toggle } = useTheme()
  const labels = siteContent[lang].nav
  const themeLabel = theme === 'dark'
    ? (lang === 'es' ? 'Usar tema claro' : 'Use light theme')
    : (lang === 'es' ? 'Usar tema oscuro' : 'Use dark theme')

  return (
    <div className="topbar">
      <nav className="sitenav">
        <a href="#work">{labels.work}</a>
        <a href="#writing">{labels.writing}</a>
        <a href="#experience">{labels.about}</a>
        <a href="#contact" className="nav-hire">{labels.hire}</a>
      </nav>
      <button onClick={toggle} className="theme-toggle" aria-label={themeLabel} title={themeLabel}>
        {theme === 'dark' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
      <nav className="lang-switch">
        <Link to="/" className={lang === 'en' ? 'lang-active' : ''} aria-label="English">EN</Link>
        <span className="lang-divider">·</span>
        <Link to="/es" className={lang === 'es' ? 'lang-active' : ''} aria-label="Español">ES</Link>
      </nav>
    </div>
  )
}

/* ============================================
   Wordmark renderer — per-project typographic logo
   ============================================ */
function Wordmark({ slug }: { slug: string }) {
  switch (slug) {
    case 'lupa':
      return <span className="wordmark">Lupa</span>
    case 'demotape':
      return <span className="wordmark-mono">demotape<span className="dot">.</span></span>
    case 'spanish-tone-spec':
      return <span className="wordmark"><em>es-</em>PR</span>
    case 'vantage':
      return <span className="wordmark">Vantage</span>
    case 'usableai':
      return <span className="wordmark-mono">@usableai</span>
    case 'wandr':
      return <span className="wordmark">Wandr</span>
    case 'janga':
      return <span className="wordmark">Janga</span>
    case 'blok':
      return <span className="wordmark">Blok</span>
    case 'prpilot':
      return <span className="wordmark-mono">PRPilot<span className="dot">/</span></span>
    default:
      return <span className="wordmark">{slug}</span>
  }
}

function FeaturedProject({
  project,
  lang,
}: {
  project: Project
  lang: Lang
}) {
  const labels = siteContent[lang].workUi
  const slug = project.media || project.name.toLowerCase()

  return (
    <article className="case-study" data-reveal>
      <div className="case-media">
        <CardMedia slug={slug} name={project.name} playInView />
      </div>

      <div className="case-copy">
        <div className="case-meta">
          <span>{project.tag}</span>
          <span>{project.year}</span>
        </div>
        <h3 className="case-name">{project.name}</h3>
        <p className="case-summary">{project.description}</p>

        {project.metrics && project.metrics.length > 0 ? (
          <dl className="case-metrics" aria-label={labels.evidence}>
            {project.metrics.map((metric) => (
              <div key={metric.label}>
                <dt>{metric.label}</dt>
                <dd>{metric.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {project.pipeline ? <Pipeline steps={project.pipeline} /> : null}

        <div className="case-footer">
          <span className="case-stack">{project.tech.slice(0, 5).join(' · ')}</span>
          <a href={project.link} target="_blank" rel="noreferrer" className="case-link">
            {labels.openProject} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </article>
  )
}

function ProjectArchive({ projects, lang }: { projects: Project[]; lang: Lang }) {
  const labels = siteContent[lang].workUi

  return (
    <div className="project-archive">
      <div className="archive-heading" data-reveal>
        <h3>{labels.archiveTitle}</h3>
        <p>{labels.archiveBody}</p>
      </div>
      <div className="archive-list">
        {projects.map((project, i) => (
          <a
            key={project.name}
            href={project.link}
            target="_blank"
            rel="noreferrer"
            className="archive-row"
            data-reveal
            style={{ '--i': i } as CSSProperties}
          >
            <span className="archive-name">{project.name}</span>
            <span className="archive-desc">{project.description}</span>
            <span className="archive-tech">{project.tech.slice(0, 3).join(' · ')}</span>
            <span className="archive-year">{project.year}</span>
            <span className="archive-arrow" aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </div>
  )
}

function MobileDock({ lang }: { lang: Lang }) {
  const labels = siteContent[lang]

  return (
    <nav className="mobile-dock" aria-label={lang === 'es' ? 'Acciones principales' : 'Primary actions'}>
      <Link to={lang === 'es' ? '/es/resume' : '/resume'}>{labels.mobileDock.resume}</Link>
      <a href="#contact" className="mobile-dock-primary">{labels.mobileDock.hire}</a>
    </nav>
  )
}

/* ============================================
   Main App
   ============================================ */
export default function App({ lang = 'en' }: Props) {
  const c = siteContent[lang]
  const featuredProjects = c.projects.filter((project) => project.featured)
  const archiveProjects = c.projects.filter((project) => !project.featured)
  const writingPosts = lang === 'es' ? postsEs : posts
  const leadWords = countWords(c.hero.display.lead)
  const emWords = countWords(c.hero.display.em)

  useScrollReveal([lang])

  useEffect(() => {
    document.title = c.meta.title
    document.documentElement.lang = lang === 'es' ? 'es' : 'en'
    const desc = document.querySelector('meta[name="description"]')
    if (desc) desc.setAttribute('content', c.meta.description)
  }, [c, lang])

  return (
    <div className="app" id="top">
      <a className="skip-link" href="#main-content">
        {c.skipToContent}
      </a>
      <TopBar lang={lang} />

      <main className="container" id="main-content" tabIndex={-1}>

        {/* ============ HERO ============ */}
        <section className="hero">
          <HeroField />
          <div className="hero-status">
            <img src="/jan-profile.jpg" alt="Jan Faris" className="hero-avatar" />
            <div className="hero-id">
              <strong className="hero-name">Jan Faris</strong>
              <span className="hero-status-line">
                <span className="pulse" />
                <span>
                  {lang === 'es'
                    ? 'Disponible para roles remotos · San Juan, PR'
                    : 'Open to remote roles · San Juan, PR'}
                </span>
              </span>
            </div>
          </div>

          <h1 className="display">
            {splitWords(c.hero.display.lead)}
            <em>{splitWords(c.hero.display.em, leadWords)}</em>
            {splitWords(c.hero.display.tail, leadWords + emWords)}
          </h1>

          <div className="hero-foot">
            <p className="hero-lede">{c.hero.lede as string}</p>
            <div className="hero-meta">
              {c.hero.metaItems.map((m, i) => (
                <div key={m.key} className={i === 1 ? 'accent' : ''}>{m.val}</div>
              ))}
            </div>
          </div>

          <div className="hero-cta">
            <a className="btn-primary" href="#contact">
              {lang === 'es' ? 'Contrátame' : 'Hire me'}
            </a>
            <Link className="btn-secondary" to={lang === 'es' ? '/es/resume' : '/resume'}>
              Résumé
            </Link>
          </div>

        </section>

        {/* ============ PRODUCTION TOOLCHAIN ============ */}
        <TechMarquee lang={lang} />

        {/* ============ WORK ============ */}
        <section className="section" id="work">
          <SectionTitle label={c.sections.work} />
          <div className="featured-work">
            {featuredProjects.map((project) => (
              <FeaturedProject key={project.name} project={project} lang={lang} />
            ))}
          </div>
          <ProjectArchive projects={archiveProjects} lang={lang} />
        </section>

        {/* ============ EXPERIENCE ============ */}
        <section className="section" id="experience">
          <SectionTitle label={c.sections.experience} />
          <ol className="experience">
            {c.experience.map((e, i) => (
              <li key={e.company} className="exp-row" data-reveal style={{ '--i': i } as CSSProperties}>
                <span className="exp-period">{e.period}</span>
                <div className="exp-body">
                  <div className="exp-head">
                    <span className="exp-company">{e.company}</span>
                    <span className="exp-divider">·</span>
                    <span className="exp-role">{e.role}</span>
                  </div>
                  <p className="exp-note">{e.note}</p>
                  {e.highlights && (
                    <ul className="exp-highlights">
                      {e.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <Link className="experience-cta" to={lang === 'es' ? '/es/resume' : '/resume'}>
            {lang === 'es' ? 'Ver résumé completo' : 'View full résumé'} <span>→</span>
          </Link>
        </section>

        {/* ============ WRITING ============ */}
        <section className="section" id="writing">
          <SectionTitle label={c.sections.writing} />
          <Link
            to={lang === 'es' ? '/es/ai-readiness?utm_source=portfolio&utm_medium=owned&utm_campaign=ai_readiness' : '/ai-readiness?utm_source=portfolio&utm_medium=owned&utm_campaign=ai_readiness'}
            className="readiness-promo"
            data-reveal
          >
            <span className="readiness-promo-index">
              <strong>10</strong>
              <small>{lang === 'es' ? 'preguntas' : 'checks'}</small>
            </span>
            <div>
              <span className="readiness-promo-eyebrow">{c.readiness.eyebrow}</span>
              <h3>{c.readiness.title}</h3>
              <p>{c.readiness.body}</p>
            </div>
            <span className="readiness-promo-cta">{c.readiness.cta} <span aria-hidden="true">↗</span></span>
          </Link>
          <div className="writing-list">
            {writingPosts.slice(0, 5).map((p, i) => (
              <Link
                key={p.slug}
                to={lang === 'es' ? `/es/writing/${p.slug}` : `/writing/${p.slug}`}
                className="writing-row"
                data-reveal
                style={{ '--i': i } as CSSProperties}
              >
                <span className="writing-index">
                  <span className="writing-note-id">
                    {lang === 'es' ? 'Nota' : 'Ship Note'} {formatNoteNumber(p.noteNumber)}
                  </span>
                  <span className="writing-date">{p.date}</span>
                </span>
                <div>
                  <div className="writing-title">{p.title}</div>
                  <p className="writing-desc">{p.description}</p>
                </div>
                <span className="writing-time">{p.readTime}</span>
              </Link>
            ))}
          </div>
          <Link to={lang === 'es' ? '/es/writing' : '/writing'} className="writing-cta">
            {c.allWriting} <span>→</span>
          </Link>
        </section>

        {/* ============ CONTACT ============ */}
        <section className="section" id="contact">
          <SectionTitle label={c.sections.available} />
          <div className="contact-head" data-reveal>
            <p className="contact-lede">{c.available.body}</p>
            <PRDotMap />
          </div>
          <div className="contact-grid">
            {c.available.channels.map((ch, i) => (
              <a
                key={ch.key}
                href={ch.href}
                className={`contact-card ${ch.key === 'hire' ? 'contact-card-primary' : ''}`}
                data-reveal
                style={{ '--i': i } as CSSProperties}
                {...(ch.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                <h3 className="contact-title">{ch.title}</h3>
                <p className="contact-desc">{ch.desc}</p>
                <span className="contact-cta">{ch.cta} →</span>
              </a>
            ))}
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <DotWave />
        <footer className="footer">
          <span className="foot-mark">
            <JFMark size={20} />
            <span>· 2026</span>
          </span>
          <span className="foot-text">
            <span>San Juan, PR</span>
            <a href="mailto:jankarlo.faris@outlook.com">jankarlo.faris@outlook.com</a>
            <a href="https://github.com/janfaris" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://linkedin.com/in/jan-faris-garcia" target="_blank" rel="noreferrer">LinkedIn</a>
          </span>
        </footer>

      </main>
      <MobileDock lang={lang} />
    </div>
  )
}
