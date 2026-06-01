import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import './index.css'
import './App.css'
import { JFMark } from './JFMark.tsx'
import { HeroSignal } from './HeroSignal.tsx'
import { posts } from './posts'
import { content as siteContent, type Lang } from './content'

interface Props { lang?: Lang }

const typewriterLines: Record<Lang, string[]> = {
  en: [
    'Building AI tools for founders',
    'Shipping npm packages and mobile apps',
    'Designing internal systems at Microsoft',
    'Turning Spanish-first ideas into software',
  ],
  es: [
    'Construyendo herramientas de IA para founders',
    'Lanzando paquetes npm y apps móviles',
    'Diseñando sistemas internos en Microsoft',
    'Convirtiendo ideas Spanish-first en software',
  ],
}

/* ============================================
   Small components
   ============================================ */

function Eyebrow({ index, label }: { index: string; label: string }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true)
            obs.disconnect()
            break
          }
        }
      },
      { threshold: 0.5, rootMargin: '0px 0px -40px 0px' }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={`eyebrow ${visible ? 'is-visible' : ''}`}>
      <span className="eyebrow-num">{index}</span>
      <span className="eyebrow-rule" />
      <span className="eyebrow-label">{label}</span>
    </div>
  )
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

function TypewriterLine({ phrases }: { phrases: string[] }) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [visibleChars, setVisibleChars] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const phrase = phrases[phraseIndex] ?? ''

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncPreference = () => setReducedMotion(media.matches)
    syncPreference()
    media.addEventListener('change', syncPreference)
    return () => media.removeEventListener('change', syncPreference)
  }, [])

  useEffect(() => {
    if (reducedMotion || phrase.length === 0) return

    const delay = !deleting && visibleChars === phrase.length
      ? 1500
      : deleting && visibleChars === 0
        ? 260
        : deleting
          ? 34
          : 48

    const timeout = window.setTimeout(() => {
      if (!deleting && visibleChars < phrase.length) {
        setVisibleChars((count) => count + 1)
        return
      }
      if (!deleting) {
        setDeleting(true)
        return
      }
      if (visibleChars > 0) {
        setVisibleChars((count) => count - 1)
        return
      }

      setDeleting(false)
      setPhraseIndex((index) => (index + 1) % phrases.length)
    }, delay)

    return () => window.clearTimeout(timeout)
  }, [deleting, phrase, phrases.length, reducedMotion, visibleChars])

  return (
    <p className="typewriter-line" aria-label={phrases[0]}>
      <span aria-hidden="true">{reducedMotion ? phrases[0] : phrase.slice(0, visibleChars)}</span>
      <span className="typewriter-cursor" aria-hidden="true" />
    </p>
  )
}

function TopBar() {
  return (
    <div className="topbar">
      <nav className="sitenav">
        <a href="#work">Work</a>
        <span className="lang-divider">·</span>
        <a href="#writing">Writing</a>
        <span className="lang-divider">·</span>
        <a href="#experience">About</a>
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
  const heroProof = lang === 'es'
    ? [
        { key: 'Proof', value: 'PRPilot 5.0/5.0', label: 'evaluación interna de IA' },
        { key: 'Launches', value: '2 npm + App Store', label: 'proyectos reales, no mockups' },
        { key: 'Market', value: 'EN + ES', label: 'software para PR / LATAM' },
      ]
    : [
        { key: 'Proof', value: 'PRPilot 5.0/5.0', label: 'internal AI evaluation' },
        { key: 'Launches', value: '2 npm + App Store', label: 'real products, not mockups' },
        { key: 'Market', value: 'EN + ES', label: 'software for PR / LATAM' },
      ]

  useEffect(() => {
    document.title = c.meta.title
    document.documentElement.lang = lang === 'es' ? 'es' : 'en'
    const desc = document.querySelector('meta[name="description"]')
    if (desc) desc.setAttribute('content', c.meta.description)
  }, [c, lang])

  return (
    <div className="app">
      <TopBar />

      <div className="container">

        {/* ============ HERO ============ */}
        <section className="hero">
          <div className="hero-copy">
            <div className="hero-intro">
              <img src="/jan-profile.jpg" alt="Jan Faris" className="hero-avatar" />
              <div>
                <span className="hero-intro-kicker">{lang === 'es' ? 'San Juan, PR' : 'San Juan, PR'}</span>
                <strong>{lang === 'es' ? 'Jan Faris' : 'Jan Faris'}</strong>
              </div>
            </div>

            <TypewriterLine phrases={typewriterLines[lang]} />

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

            <div className="hero-actions" aria-label={lang === 'es' ? 'Acciones principales' : 'Primary actions'}>
              <a className="hero-link hero-link-primary" href="#work">
                {lang === 'es' ? 'Ver trabajo seleccionado' : 'View selected work'}
              </a>
              <a className="hero-link" href="mailto:jankarlo.faris@outlook.com">
                {lang === 'es' ? 'Escribirle a Jan' : 'Email Jan'}
              </a>
            </div>
          </div>

          <aside className="hero-stage" aria-label={lang === 'es' ? 'Escultura de señal de producto' : 'Product signal sculpture'}>
            <HeroSignal />
            <div className="stage-panel">
              <span className="stage-kicker">{lang === 'es' ? 'Señal de producto' : 'Product signal'}</span>
              <strong>{lang === 'es' ? 'Prueba real. Energía técnica.' : 'Real proof. Technical energy.'}</strong>
              <p>
                {lang === 'es'
                  ? 'Microsoft SWE construyendo herramientas de IA, paquetes npm, apps móviles y sistemas internos desde Puerto Rico.'
                  : 'Microsoft SWE building AI tools, npm packages, mobile apps, and internal systems from Puerto Rico.'}
              </p>
            </div>
          </aside>

          <div className="hero-proof-strip">
            {heroProof.map((item) => (
              <div className="proof-card" key={item.key}>
                <span>{item.key}</span>
                <strong>{item.value}</strong>
                <p>{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============ NOW ============ */}
        <section className="section">
          <Eyebrow index="01" label={c.sections.now} />
          <div className="now">
            <div className="now-pulse-frame">
              <span className="pulse" />
            </div>
            <div>
              <h2 className="now-headline">{c.now.headline}</h2>
              <ul className="now-lines">
                {c.now.lines.map((l) => <li key={l}>{l}</li>)}
              </ul>
              <span className="now-updated">{c.now.updated}</span>
            </div>
          </div>
        </section>

        {/* ============ WORK ============ */}
        <section className="section" id="work">
          <Eyebrow index="02" label={c.sections.work} />
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
                  <Wordmark slug={p.media || p.name.toLowerCase()} />
                </div>
                <div className="card-body">
                  <div className="card-head">
                    <span className="card-tag">{p.tag}</span>
                    <span className="card-year">{p.year}</span>
                  </div>
                  <h3 className="card-title">{title}</h3>
                  {rest && <p className="card-desc">{rest}</p>}
                  <div className="card-foot">
                    <span className="card-stack">{p.tech.slice(0, 4).join(' · ')}</span>
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
          <Eyebrow index="03" label={c.sections.writing} />
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
          <Eyebrow index="04" label={c.sections.experience} />
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

        {/* ============ FOOTER ============ */}
        <footer className="footer">
          <span className="foot-mark">
            <JFMark size={20} />
            <span>· 2026</span>
          </span>
          <span className="foot-text">
            <span>San Juan, PR</span>
            <span>·</span>
            <a href="mailto:jankarlo.faris@outlook.com">jankarlo.faris@outlook.com</a>
            <span>·</span>
            <a href="https://github.com/janfaris" target="_blank" rel="noreferrer">GitHub</a>
            <span>·</span>
            <a href="https://linkedin.com/in/jan-faris-garcia" target="_blank" rel="noreferrer">LinkedIn</a>
          </span>
        </footer>

      </div>
    </div>
  )
}
