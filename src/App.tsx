import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import './index.css'
import './App.css'
import { JFMark } from './JFMark.tsx'
import { posts } from './posts'
import { content as siteContent, type Lang } from './content'

interface Props { lang?: Lang }

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
        <span className="lang-divider">·</span>
        <a href="#writing">Writing</a>
        <span className="lang-divider">·</span>
        <a href="#experience">About</a>
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
          <div className="hero-status">
            <img src="/jan-profile.jpg" alt="Jan Faris" className="hero-avatar" />
            <span className="pulse" />
            <span>
              {lang === 'es'
                ? 'Puliendo Lupa y usableai · San Juan, PR'
                : 'Polishing Lupa & usableai · San Juan, PR'}
            </span>
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
