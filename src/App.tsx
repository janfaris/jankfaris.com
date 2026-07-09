import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './index.css'
import './App.css'
import { JFMark } from './JFMark.tsx'
import { HeroField } from './HeroField.tsx'
import { posts } from './posts'
import { content as siteContent, type Lang } from './content'

interface Props { lang?: Lang }

/* ============================================
   Small components
   ============================================ */

function SectionTitle({ label }: { label: string }) {
  return <h2 className="section-title">{label}</h2>
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
const PR_DOTS: { x: number; y: number; o: number }[] = (() => {
  const dots: { x: number; y: number; o: number }[] = []
  for (const isle of [PR_COAST, VIEQUES, CULEBRA]) {
    for (let y = 0; y <= 39; y += 2.2) {
      for (let x = 0; x <= 123; x += 2.2) {
        if (inPolygon(x, y, isle)) {
          // deterministic pseudo-random opacity per dot
          const h = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1
          dots.push({ x, y, o: 0.35 + h * 0.55 })
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
        <circle key={i} cx={d.x} cy={d.y} r="0.8" fill="var(--indigo)" opacity={d.o} />
      ))}
    </svg>
  )
}

/** Small platform mark shown next to a card tag when the claim has a real home. */
function tagIcon(tag: string, link: string): { src: string; alt: string } | null {
  if (tag.includes('npm')) return { src: '/icons/npm.svg', alt: 'npm' }
  if (tag.includes('iOS') || tag.includes('App Store')) return { src: '/icons/appstore.svg', alt: 'App Store' }
  if (link.includes('github.com')) return { src: '/icons/github.svg', alt: 'GitHub' }
  return null
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

function CardMedia({ slug, name }: { slug: string; name: string }) {
  const kind = DEMO_MEDIA[slug]
  if (kind === 'video') {
    return (
      <video
        className="card-demo"
        src={`/demos/${slug}.mp4`}
        poster={`/demos/${slug}.jpg`}
        muted
        loop
        playsInline
        preload="none"
        aria-label={`${name} demo`}
        onMouseEnter={(e) => { void e.currentTarget.play() }}
        onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0 }}
      />
    )
  }
  if (kind === 'image') {
    return <img className="card-demo" src={`/demos/${slug}.jpg`} alt={`${name} preview`} loading="lazy" />
  }
  return <Wordmark slug={slug} />
}

/** Returns the grid-span class for a project based on its tier. */
function cardSpan(slug: string): string {
  // Tier 1 — flagship anchor (full row)
  if (slug === 'lupa') return 'card-wide'
  // Tier 2 — current / active (3 per row)
  if (['demotape', 'usableai', 'spanish-tone-spec'].includes(slug)) return 'card-third'
  // Tier 3 — previous / archive (4 per row)
  return 'card-quarter'
}

/** Split a string into individual words for staggered animation. */
function splitWords(text: string) {
  return text.split(/(\s+)/).map((tok, i) => {
    if (/^\s+$/.test(tok)) return <span key={i}>{tok}</span>
    return <span key={i} className="reveal-word">{tok}</span>
  })
}

/** Split description into a short title (first sentence) and remainder for desc.
 *  If the description is a single sentence, return title only and no desc. */
function splitDesc(desc: string): { title: string; rest: string } {
  const match = desc.match(/^([^.]+\.)\s*(.*)$/s)
  if (!match) return { title: desc, rest: '' }
  return { title: match[1].trim(), rest: match[2].trim() }
}

/** Hard-numbers strip under the hero. Adds a live npm-downloads item
 *  once the packages clear a number worth showing. */
const NPM_PACKAGES = ['demotape', 'spanish-tone-spec']
const NPM_SHOW_THRESHOLD = 100 // weekly downloads

function ProofBar({ items, lang }: { items: { value: string; label: string }[]; lang: Lang }) {
  const [npmWeekly, setNpmWeekly] = useState<number | null>(null)
  useEffect(() => {
    Promise.all(
      NPM_PACKAGES.map((p) =>
        fetch(`https://api.npmjs.org/downloads/point/last-week/${p}`)
          .then((r) => r.json())
          .then((d: { downloads?: number }) => d.downloads ?? 0)
      )
    )
      .then((counts) => {
        const total = counts.reduce((s, n) => s + n, 0)
        if (total >= NPM_SHOW_THRESHOLD) setNpmWeekly(total)
      })
      .catch(() => {})
  }, [])
  return (
    <div className="proofbar">
      {items.map((item) => (
        <div key={item.label} className="proofbar-item">
          <span className="proofbar-value">{item.value}</span>
          <span className="proofbar-label">{item.label}</span>
        </div>
      ))}
      {npmWeekly !== null && (
        <div className="proofbar-item">
          <span className="proofbar-value">{npmWeekly.toLocaleString()} / wk</span>
          <span className="proofbar-label">
            {lang === 'es' ? 'descargas npm esta semana' : 'npm downloads this week'}
          </span>
        </div>
      )}
    </div>
  )
}

/** Static dot-wave motif — the hero wave's signature, echoed in 2D. */
function DotWave() {
  const dots = Array.from({ length: 56 }, (_, i) => {
    const t = i / 55
    return {
      x: 8 + t * 464,
      y: 16 + Math.sin(t * Math.PI * 2.4) * 8,
      o: (0.25 + 0.75 * Math.sin(t * Math.PI)) * 0.8,
    }
  })
  return (
    <svg className="dot-wave" viewBox="0 0 480 32" aria-hidden="true">
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r="1.6" fill="var(--indigo)" opacity={d.o} />
      ))}
    </svg>
  )
}

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark'
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (stored) return stored
    // Default to dark (per moodboard direction). User can toggle.
    return 'dark'
  })
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    localStorage.setItem('theme', theme)
  }, [theme])
  return { theme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark') }
}

function TopBar({ lang }: { lang: Lang }) {
  const { theme, toggle } = useTheme()
  return (
    <div className="topbar">
      <nav className="sitenav">
        <a href="#work">Work</a>
        <a href="#writing">Writing</a>
        <a href="#experience">About</a>
        <a href="#contact">Contact</a>
      </nav>
      <button onClick={toggle} className="theme-toggle" aria-label="Toggle theme">
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

/* ============================================
   Main App
   ============================================ */
export default function App({ lang = 'en' }: Props) {
  const c = siteContent[lang]

  useEffect(() => {
    document.title = c.meta.title
    document.documentElement.lang = lang === 'es' ? 'es' : 'en'
    const desc = document.querySelector('meta[name="description"]')
    if (desc) desc.setAttribute('content', c.meta.description)
  }, [c, lang])

  return (
    <div className="app">
      <TopBar lang={lang} />

      <div className="container">

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
            <em>{splitWords(c.hero.display.em)}</em>
            {splitWords(c.hero.display.tail)}
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
            <a className="btn-secondary" href="/resume.pdf" target="_blank" rel="noopener">
              {lang === 'es' ? 'Résumé (PDF)' : 'Résumé (PDF)'}
            </a>
          </div>

          <ProofBar items={c.proofBar} lang={lang} />
        </section>

        {/* ============ NOW ============ */}
        <section className="section">
          <SectionTitle label={c.sections.now} />
          <div className="now">
            <div>
              <h3 className="now-headline">{c.now.headline}</h3>
              <ul className="now-lines">
                {c.now.lines.map((l) => <li key={l}>{l}</li>)}
              </ul>
              <span className="now-updated">{c.now.updated}</span>
            </div>
          </div>
        </section>

        {/* ============ WORK ============ */}
        <section className="section" id="work">
          <SectionTitle label={c.sections.work} />
          <div className="work-grid">
            {c.projects.map((p) => {
              const { title, rest } = splitDesc(p.description)
              const spanClass = cardSpan(p.media || p.name.toLowerCase())
              return (
              <a
                key={p.name}
                href={p.link}
                target="_blank"
                rel="noreferrer"
                className={`card ${spanClass}`}
              >
                <div className="card-mark">
                  <CardMedia slug={p.media || p.name.toLowerCase()} name={p.name} />
                </div>
                <div className="card-body">
                  <div className="card-head">
                    <span className="card-tag">
                      {(() => {
                        const icon = tagIcon(p.tag, p.link)
                        return icon ? <img className="tag-icon" src={icon.src} alt={icon.alt} /> : null
                      })()}
                      {p.tag}
                    </span>
                    <span className="card-year">{p.year}</span>
                  </div>
                  <h3 className="card-title">{title}</h3>
                  {rest && <p className="card-desc">{rest}</p>}
                  {p.pipeline && <Pipeline steps={p.pipeline} />}
                  <div className="card-foot">
                    <span className="card-stack">{p.tech.slice(0, 4).join(', ')}</span>
                    <span className="card-arrow">↗</span>
                  </div>
                </div>
              </a>
              )
            })}
          </div>
        </section>

        {/* ============ WRITING ============ */}
        <section className="section" id="writing">
          <SectionTitle label={c.sections.writing} />
          <div className="writing-list">
            {posts.slice(0, 5).map((p) => (
              <Link key={p.slug} to={`/writing/${p.slug}`} className="writing-row">
                <span className="writing-date">{p.date}</span>
                <div>
                  <div className="writing-title">{p.title}</div>
                  <p className="writing-desc">{p.description}</p>
                </div>
                <span className="writing-time">{p.readTime}</span>
              </Link>
            ))}
          </div>
          <Link to="/writing" className="writing-cta">
            {c.allWriting} <span>→</span>
          </Link>
        </section>

        {/* ============ EXPERIENCE ============ */}
        <section className="section" id="experience">
          <SectionTitle label={c.sections.experience} />
          <ol className="experience">
            {c.experience.map((e) => (
              <li key={e.company} className="exp-row">
                <span className="exp-period">{e.period}</span>
                <div className="exp-body">
                  <div className="exp-head">
                    <span className="exp-company">{e.company}</span>
                    <span className="exp-divider">·</span>
                    <span className="exp-role">{e.role}</span>
                  </div>
                  <p className="exp-note">{e.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ============ STACK, PROVEN ============ */}
        <section className="section" id="proof">
          <SectionTitle label={c.sections.proof} />
          <dl className="stack-proof">
            {c.stackProof.map((row) => (
              <div key={row.claim} className="stack-row">
                <dt className="stack-claim">{row.claim}</dt>
                <dd className="stack-evidence">{row.evidence}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ============ CONTACT ============ */}
        <section className="section" id="contact">
          <SectionTitle label={c.sections.available} />
          <div className="contact-head">
            <p className="contact-lede">{c.available.body}</p>
            <PRDotMap />
          </div>
          <div className="contact-grid">
            {c.available.channels.map((ch) => (
              <a
                key={ch.key}
                href={ch.href}
                className={`contact-card ${ch.key === 'hire' ? 'contact-card-primary' : ''}`}
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

      </div>
    </div>
  )
}
